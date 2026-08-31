#!/usr/bin/env python3
"""Measure the companion guide's emphasis density.

The 31 August ergonomics review counted roughly 388 bold-led units against 104
headings and concluded that bold had become body text, so the skim hierarchy had
collapsed: reading headings plus bold first sentences yielded a mixture of
teaching points, activity labels, navigation and emphasis rather than a
procedure. The rebalance that followed allows one bold takeaway per substantive
subsection, unbolds activity labels, and leaves navigation unbolded.

This script is the measurement, so the before and after are the same count taken
the same way rather than two impressions. It counts, per file:

  headings        markdown ATX headings, excluding the ones that title a callout,
                  which Quarto renders as a card header rather than as a heading
  bold leads      paragraphs and list items that OPEN with a bold run, which is
                  the unit the review counted
  bold runs       every bold span anywhere, which catches emphasis inside a
                  sentence that a lead count misses
  callouts        fenced callout divs
  subsections     headings at level 2 and below, the denominator for the
                  one-takeaway-per-subsection rule

Usage:

    python3 scripts/measure_emphasis.py
    python3 scripts/measure_emphasis.py --json > before.json
    python3 scripts/measure_emphasis.py --compare before.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HEADING = re.compile(r"^(#{1,6})\s+(.*)$")
CALLOUT_OPEN = re.compile(r"^:{3,}\s*\{[^}]*\.callout")
FENCE = re.compile(r"^:{3,}")
LIST_ITEM = re.compile(r"^\s*(?:[-*+]|\d+\.)\s+(.*)$")
BOLD_RUN = re.compile(r"\*\*(?!\s)(.+?)(?<!\s)\*\*", re.S)
CODE_FENCE = re.compile(r"^\s*(```|~~~)")

ORDER = [
    "index.qmd",
    "m0-start-here.qmd",
    "m1-how-qcraft-thinks.qmd",
    "m2-debt-equation.qmd",
    "m3-parameters.qmd",
    "m4-worked-example.qmd",
    "m5-boundaries.qmd",
    "m6-capstone.qmd",
    "appendix-workbook.qmd",
    "appendix-codesign.qmd",
    "appendix-maintainer.qmd",
    "glossary.qmd",
    "references.qmd",
]


def measure(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    headings = 0
    subsections = 0
    callouts = 0
    bold_leads = 0

    in_code = False
    # A heading directly after a callout fence is the callout's own title.
    prev_was_callout_open = False

    for line in lines:
        if CODE_FENCE.match(line):
            in_code = not in_code
            continue
        if in_code:
            continue

        if CALLOUT_OPEN.match(line):
            callouts += 1
            prev_was_callout_open = True
            continue

        heading = HEADING.match(line)
        if heading:
            if not prev_was_callout_open:
                headings += 1
                if len(heading.group(1)) >= 2:
                    subsections += 1
            prev_was_callout_open = False
            continue

        if line.strip() and not FENCE.match(line):
            prev_was_callout_open = False

        stripped = line.strip()
        if not stripped:
            continue
        item = LIST_ITEM.match(line)
        body = item.group(1) if item else stripped
        if body.startswith("**") and BOLD_RUN.match(body):
            bold_leads += 1

    # Bold runs are counted over the whole text with code blocks removed, since a
    # bold span inside a table cell is emphasis the reader sees too.
    without_code = re.sub(r"^```.*?^```", "", text, flags=re.S | re.M)
    bold_runs = len(BOLD_RUN.findall(without_code))

    return {
        "headings": headings,
        "subsections": subsections,
        "callouts": callouts,
        "bold_leads": bold_leads,
        "bold_runs": bold_runs,
        "words": len(text.split()),
    }


def collect(guide: Path) -> dict:
    result = {}
    known = [name for name in ORDER if (guide / name).exists()]
    extra = sorted(
        p.name
        for p in guide.glob("*.qmd")
        if p.name not in ORDER and not p.name.startswith("_")
    )
    for name in known + extra:
        result[name] = measure(guide / name)
    return result


def totals(data: dict) -> dict:
    keys = ("headings", "subsections", "callouts", "bold_leads", "bold_runs", "words")
    return {k: sum(v[k] for v in data.values()) for k in keys}


def render(data: dict, baseline: dict | None) -> None:
    head = f"{'file':28} {'head':>6} {'subs':>6} {'call':>6} {'bold-lead':>10} {'bold-run':>9} {'words':>7}"
    print(head)
    print("-" * len(head))
    for name, v in data.items():
        row = (
            f"{name:28} {v['headings']:>6} {v['subsections']:>6} {v['callouts']:>6} "
            f"{v['bold_leads']:>10} {v['bold_runs']:>9} {v['words']:>7}"
        )
        if baseline and name in baseline:
            b = baseline[name]
            row += (
                f"   (was {b['headings']}/{b['subsections']}/{b['callouts']}/"
                f"{b['bold_leads']}/{b['bold_runs']}/{b['words']})"
            )
        print(row)
    t = totals(data)
    print("-" * len(head))
    print(
        f"{'TOTAL':28} {t['headings']:>6} {t['subsections']:>6} {t['callouts']:>6} "
        f"{t['bold_leads']:>10} {t['bold_runs']:>9} {t['words']:>7}"
    )
    if baseline:
        b = totals(baseline)
        print(
            f"{'WAS':28} {b['headings']:>6} {b['subsections']:>6} {b['callouts']:>6} "
            f"{b['bold_leads']:>10} {b['bold_runs']:>9} {b['words']:>7}"
        )
    print()
    print(
        f"bold leads per heading: {t['bold_leads'] / t['headings']:.2f}"
        if t["headings"]
        else ""
    )
    if baseline:
        b = totals(baseline)
        if b["headings"]:
            print(f"  was: {b['bold_leads'] / b['headings']:.2f}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--guide", default="docs/companion-guide")
    parser.add_argument("--json", action="store_true", help="emit the raw counts")
    parser.add_argument("--compare", help="a --json snapshot to show alongside")
    args = parser.parse_args()

    guide = Path(args.guide).resolve()
    if not guide.is_dir():
        print(f"guide directory not found: {guide}", file=sys.stderr)
        return 1

    data = collect(guide)
    if args.json:
        print(json.dumps(data, indent=2))
        return 0

    baseline = None
    if args.compare:
        baseline = json.loads(Path(args.compare).read_text(encoding="utf-8"))
    render(data, baseline)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
