"""Synthetic state tests; no GitHub reads or writes."""

import copy
import json
import unittest
from unittest.mock import patch

from tool_site_guard import PATH, check, main


class GuardTests(unittest.TestCase):
    def setUp(self):
        self.env = {
            "GITHUB_REF": "refs/heads/main",
            "GITHUB_SHA": "a" * 40,
            "GITHUB_RUN_ID": "102",
            "GITHUB_RUN_ATTEMPT": "1",
            "OPERATION": "restore-prior-site",
            "APPROVAL_RECEIPT_SHA256": "b" * 64,
            "DISPATCH_RECEIPT_SHA256": "c" * 64,
            "FORWARD_DISPATCH_RECEIPT_SHA256": "d" * 64,
            "ROLLOUT_ASSESSMENT_SHA256": "e" * 64,
            "FAILED_FORWARD_RUN_ID": "101",
            "FAILED_FORWARD_CREATED_AT": "2026-09-06T12:00:00Z",
        }
        self.forward = self.run_entry(101, "2026-09-06T12:00:00Z", "completed")
        self.forward["display_title"] = "Tool release: publish | " + "d" * 64
        self.own = self.run_entry(102, "2026-09-06T12:05:00Z", "in_progress")
        self.own["display_title"] = "Tool release: restore-prior-site | " + "c" * 64
        self.runs = [self.own, self.forward]

    def run_entry(self, identifier, time, status):
        return {
            "id": identifier,
            "created_at": time,
            "status": status,
            "head_sha": "a" * 40,
            "event": "workflow_dispatch",
            "path": PATH,
            "display_title": str(identifier),
            "conclusion": "success",
        }

    def allowed(self, env=None, runs=None, main=None):
        return check(env or self.env, main or "a" * 40, runs or self.runs)

    def test_exact_completed_forward_can_fail_acceptance(self):
        for conclusion in ("success", "failure", "cancelled", "timed_out"):
            with self.subTest(conclusion=conclusion):
                self.forward["conclusion"] = conclusion
                self.assertTrue(self.allowed()["permitted_by_state_guard"])

    def test_noncompleted_target_is_never_restored(self):
        for status in ("queued", "in_progress", "pending", "waiting", "requested"):
            with self.subTest(status=status):
                self.forward["status"] = status
                with self.assertRaises(ValueError):
                    self.allowed()

    def test_every_older_noncompleted_dispatch_blocks(self):
        for status in (
            "queued",
            "in_progress",
            "pending",
            "waiting",
            "requested",
            "unknown",
        ):
            with self.subTest(status=status):
                other = self.run_entry(100, "2026-09-06T11:00:00Z", status)
                with self.assertRaises(ValueError):
                    self.allowed(runs=[*self.runs, other])

    def test_same_second_and_newer_completed_dispatches_block(self):
        for time in ("2026-09-06T12:00:00Z", "2026-09-06T12:01:00Z"):
            with self.subTest(time=time):
                other = self.run_entry(103, time, "completed")
                with self.assertRaises(ValueError):
                    self.allowed(runs=[*self.runs, other])

    def test_older_completed_run_is_not_a_conflict(self):
        other = self.run_entry(100, "2026-09-06T11:00:00Z", "completed")
        self.assertTrue(self.allowed(runs=[*self.runs, other]))

    def test_target_receipt_identity_must_match(self):
        for field, value in [
            ("head_sha", "f" * 40),
            ("event", "push"),
            ("created_at", "2026-09-06T11:59:59Z"),
            ("path", "other.yml"),
            ("display_title", "wrong"),
            ("conclusion", None),
        ]:
            with self.subTest(field=field):
                runs = copy.deepcopy(self.runs)
                runs[1][field] = value
                with self.assertRaises(ValueError):
                    self.allowed(runs=runs)

    def test_absent_duplicate_or_reused_receipt_is_blocked(self):
        cases = [[self.own], [*self.runs, self.forward]]
        reused = self.run_entry(100, "2026-09-06T11:00:00Z", "completed")
        reused["display_title"] = self.forward["display_title"]
        cases.append([*self.runs, reused])
        for runs in cases:
            with self.subTest(runs=len(runs)):
                with self.assertRaises(ValueError):
                    self.allowed(runs=runs)

    def test_approval_assessment_and_unique_dispatch_are_required(self):
        for key in (
            "APPROVAL_RECEIPT_SHA256",
            "DISPATCH_RECEIPT_SHA256",
            "ROLLOUT_ASSESSMENT_SHA256",
            "FORWARD_DISPATCH_RECEIPT_SHA256",
        ):
            with self.subTest(key=key):
                env = {**self.env, key: ""}
                with self.assertRaises(ValueError):
                    self.allowed(env=env)

    def test_changed_main_nonmain_and_rerun_block(self):
        with self.assertRaises(ValueError):
            self.allowed(main="f" * 40)
        for key, value in [
            ("GITHUB_REF", "refs/heads/other"),
            ("GITHUB_RUN_ATTEMPT", "2"),
        ]:
            with self.subTest(key=key):
                with self.assertRaises(ValueError):
                    self.allowed(env={**self.env, key: value})

    def test_publish_has_its_own_unique_receipt(self):
        env = {**self.env, "OPERATION": "publish"}
        own = {**self.own, "display_title": "Tool release: publish | " + "c" * 64}
        self.assertTrue(self.allowed(env=env, runs=[own, self.forward]))
        newer = self.run_entry(103, self.own["created_at"], "completed")
        with self.assertRaises(ValueError):
            self.allowed(env=env, runs=[own, self.forward, newer])


    def test_paginated_cli_checks_complete_inventory_and_stable_main(self):
        env = {**self.env, "GITHUB_REPOSITORY": "example/repository"}
        main_record = {"object": {"sha": "a" * 40}}
        pages = [
            {"total_count": 2, "workflow_runs": [self.own]},
            {"total_count": 2, "workflow_runs": [self.forward]},
        ]
        with patch("tool_site_guard.os.environ", env), patch(
            "tool_site_guard.subprocess.check_output",
            side_effect=[json.dumps(v) for v in [main_record, pages, main_record]],
        ) as api, patch("builtins.print"):
            main()
            inventory_command = api.call_args_list[1].args[0]
            self.assertIn("--paginate", inventory_command)
            self.assertIn("--slurp", inventory_command)
            self.assertEqual(api.call_count, 3)
        changed = {"object": {"sha": "f" * 40}}
        with patch("tool_site_guard.os.environ", env), patch(
            "tool_site_guard.subprocess.check_output",
            side_effect=[json.dumps(v) for v in [main_record, pages, changed]],
        ), self.assertRaisesRegex(ValueError, "Main changed"):
            main()
        pages[1]["total_count"] = 3
        with patch("tool_site_guard.os.environ", env), patch(
            "tool_site_guard.subprocess.check_output",
            side_effect=[json.dumps(v) for v in [main_record, pages]],
        ), self.assertRaisesRegex(ValueError, "Incomplete or changing"):
            main()


if __name__ == "__main__":
    unittest.main()
