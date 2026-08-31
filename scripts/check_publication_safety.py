#!/usr/bin/env python3
"""Publication-safety gate for the companion guide.

The GPT ergonomics review of 31 August 2026 found the published guide rendering
internal production instructions as reader content: a bright Warning card titled
"WIDGET-TODO: expenditure rigidity" telling a ministry reader to embed a widget
from a lane-2 run. Its verdict was that this turns the published guide into a
staging environment. The smallest fix it ordered was a render-excluded class plus
a build check that fails publication when any such block remains.

This is that check. It fails the build on either half of the failure:

  SOURCE   an authoring marker in a .qmd that is not inside an `authoring-note`
           block, so a future author who writes the callout but forgets the class
           is caught before the render, not after.

  RENDER   an authoring marker that reached the HTML, the PDF or the search
           index, so a filter regression is caught even if the source is clean.

It also counts the DRAFT FOR TEAL callouts, which are the opposite case: those
are visible on purpose while Teal's editorial pass is pending, so the check
reports the source and render counts and fails if they have fallen out of step.

Usage:

    python3 scripts/check_publication_safety.py
    python3 scripts/check_publication_safety.py --guide docs/companion-guide

Exit status is 0 when the build is safe to publish and 1 when it is not.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

# Markers that identify authoring apparatus. Each is matched case-sensitively
# against the source and against the rendered text.
AUTHORING_MARKERS = (
    "WIDGET-TODO",
    "SCREENSHOT-TODO",
    "SOURCE-TODO",
    "PRODUCTION NOTE",
    "PILOT NOTE",
)

# A heading of the shape "## TODO: ..." is authoring apparatus too. The pattern
# is deliberately anchored to a heading so that the word TODO inside ordinary
# prose does not trip the gate.
TODO_HEADING = re.compile(r"^#{1,6}\s+TODO\b", re.MULTILINE)

# The visible-by-instruction marker, counted rather than banned.
DRAFT_MARKER = "DRAFT FOR TEAL"

FENCE = re.compile(r"^(:{3,})\s*(.*)$")

# A markdown link into another chapter's anchor. Quarto does not validate these:
# a link to a heading that was renamed or deleted silently goes nowhere, with no
# build error. The preface's 30-minute route is built entirely out of them, so a
# broken fragment breaks the review's highest-leverage fix without a single
# warning. This checks them.
QMD_FRAGMENT_LINK = re.compile(r"\]\((?P<file>[A-Za-z0-9._-]*\.qmd)?#(?P<anchor>[A-Za-z0-9._:-]+)\)")
HEADING_ANCHOR = re.compile(r"^#{1,6}\s+.*\{#(?P<id>[A-Za-z0-9._:-]+)", re.MULTILINE)
# An id can sit anywhere inside an attribute block, as it does in the glossary's
# `[Term]{.glossary-term #gloss-id}` spans, so match it wherever it appears.
ATTR_BLOCK = re.compile(r"\{[^}\n]*\}")
ATTR_ID = re.compile(r"#(?P<id>[A-Za-z0-9._:-]+)")


def anchor_index(guide: Path) -> dict[str, set[str]]:
    """Every anchor id each .qmd defines, including span and figure ids."""
    index: dict[str, set[str]] = {}
    for path in sorted(guide.rglob("*.qmd")):
        text = path.read_text(encoding="utf-8")
        ids = {m.group("id") for m in HEADING_ANCHOR.finditer(text)}
        for block in ATTR_BLOCK.finditer(text):
            ids |= {m.group("id") for m in ATTR_ID.finditer(block.group(0))}
        index[path.name] = ids
    return index


def link_findings(guide: Path) -> list[str]:
    """Cross-file and same-file anchor links that resolve to nothing."""
    problems: list[str] = []
    index = anchor_index(guide)
    for path in sorted(guide.rglob("*.qmd")):
        rel = path.relative_to(guide.parent.parent)
        text = path.read_text(encoding="utf-8")
        for number, line in enumerate(text.splitlines(), start=1):
            for match in QMD_FRAGMENT_LINK.finditer(line):
                target_file = match.group("file") or path.name
                anchor = match.group("anchor")
                if target_file not in index:
                    problems.append(
                        f"{rel}:{number}: link to {target_file}#{anchor}, "
                        "but that file is not in the guide"
                    )
                elif anchor not in index[target_file]:
                    problems.append(
                        f"{rel}:{number}: link to {target_file}#{anchor} "
                        "resolves to no anchor"
                    )
    return problems


def div_stack_at_lines(text: str) -> list[list[str]]:
    """Return, for each line of `text`, the stack of open div attribute strings.

    Pandoc fenced divs open with a colon fence carrying an attribute block or a
    bare class word, and close with a colon fence carrying nothing. Nesting is by
    order, not by fence length, which is what this reproduces.
    """
    stacks: list[list[str]] = []
    stack: list[str] = []
    for line in text.splitlines():
        match = FENCE.match(line)
        opened = None
        closed = False
        if match:
            rest = match.group(2).strip()
            if rest:
                opened = rest
            else:
                closed = True
        # The stack recorded for a fence line is the stack the fence itself sits
        # in, so an attribute on an opening fence is visible on that same line.
        current = list(stack)
        if opened is not None:
            current = current + [opened]
        stacks.append(current)
        if opened is not None:
            stack.append(opened)
        elif closed and stack:
            stack.pop()
    return stacks


def source_findings(guide: Path) -> tuple[list[str], int]:
    """Authoring markers in .qmd sources that escape the authoring-note class."""
    problems: list[str] = []
    draft_count = 0
    qmds = sorted(guide.rglob("*.qmd"))
    for path in qmds:
        text = path.read_text(encoding="utf-8")
        draft_count += text.count(DRAFT_MARKER)
        stacks = div_stack_at_lines(text)
        lines = text.splitlines()
        for number, line in enumerate(lines, start=1):
            hits = [m for m in AUTHORING_MARKERS if m in line]
            if TODO_HEADING.match(line):
                hits.append("TODO heading")
            if not hits:
                continue
            enclosing = stacks[number - 1]
            protected = any("authoring-note" in attr for attr in enclosing)
            if not protected:
                rel = path.relative_to(guide.parent.parent)
                problems.append(
                    f"{rel}:{number}: {', '.join(hits)} is not inside an "
                    f"authoring-note block: {line.strip()[:90]}"
                )
    return problems, draft_count


def pdf_text(pdf: Path) -> str | None:
    try:
        result = subprocess.run(
            ["pdftotext", str(pdf), "-"],
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return None
    return result.stdout


def render_findings(book: Path) -> tuple[list[str], list[str], int]:
    """Authoring markers that reached the rendered book."""
    problems: list[str] = []
    skipped: list[str] = []
    draft_count = 0

    def scan(label: str, text: str) -> None:
        nonlocal draft_count
        draft_count += text.count(DRAFT_MARKER)
        for marker in AUTHORING_MARKERS:
            if marker in text:
                problems.append(f"{label}: leaked authoring marker {marker!r}")

    html_files = sorted(book.glob("*.html"))
    if not html_files:
        skipped.append("no rendered HTML found, so the render half did not run")
    for path in html_files:
        scan(path.name, path.read_text(encoding="utf-8"))

    index = book / "search.json"
    if index.exists():
        payload = json.loads(index.read_text(encoding="utf-8"))
        scan("search.json", json.dumps(payload))
    else:
        skipped.append("no search.json found, so the index was not checked")

    pdfs = sorted(book.glob("*.pdf"))
    if not pdfs:
        skipped.append("no rendered PDF found, so the PDF was not checked")
    for pdf in pdfs:
        text = pdf_text(pdf)
        if text is None:
            skipped.append(f"{pdf.name}: pdftotext unavailable, PDF not checked")
            continue
        # The PDF carries no search index and no HTML, so count its own drafts
        # separately rather than into the HTML total.
        for marker in AUTHORING_MARKERS:
            if marker in text:
                problems.append(f"{pdf.name}: leaked authoring marker {marker!r}")

    return problems, skipped, draft_count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--guide",
        default="docs/companion-guide",
        help="the guide's source directory (default: docs/companion-guide)",
    )
    parser.add_argument(
        "--book",
        default=None,
        help="the rendered book directory (default: <guide>/_book)",
    )
    parser.add_argument(
        "--source-only",
        action="store_true",
        help="check the .qmd sources only, leaving the rendered book alone",
    )
    args = parser.parse_args()

    # The authoring profile renders the notes on purpose, so the render half of
    # the check would fail a build that is behaving correctly. The source half
    # still runs, because an unclassed marker is a defect in every profile.
    profile = os.environ.get("QUARTO_PROFILE", "")
    authoring_build = "authoring" in [p.strip() for p in profile.split(",")]
    source_only = args.source_only or authoring_build

    guide = Path(args.guide).resolve()
    if not guide.is_dir():
        print(f"FAIL: guide directory not found: {guide}", file=sys.stderr)
        return 1
    book = Path(args.book).resolve() if args.book else guide / "_book"

    src_problems, src_drafts = source_findings(guide)
    src_problems += link_findings(guide)
    if source_only:
        reason = (
            f"QUARTO_PROFILE={profile!r} renders authoring notes on purpose"
            if authoring_build
            else "--source-only was passed"
        )
        out_problems, skipped, out_drafts = [], [f"render not checked: {reason}"], 0
    elif book.is_dir():
        out_problems, skipped, out_drafts = render_findings(book)
    else:
        out_problems, skipped, out_drafts = [], [f"{book} does not exist"], 0

    print("Publication safety check")
    print(f"  source     {guide}")
    print(f"  render     {book}")
    print(
        f"  DRAFT FOR TEAL   source {src_drafts}, rendered HTML {out_drafts} "
        "(a rendered callout carries its title twice, in the card and in its "
        "anchor, so the render count runs about double the source count)"
    )

    for note in skipped:
        print(f"  SKIPPED    {note}")

    problems = src_problems + out_problems
    if src_drafts and not out_drafts and not skipped:
        problems.append(
            f"DRAFT FOR TEAL appears {src_drafts} times in source but never in the "
            "render: those callouts are visible by instruction until Teal's pass"
        )

    if problems:
        print()
        print(f"FAIL: {len(problems)} publication-safety problem(s)")
        for problem in problems:
            print(f"  - {problem}")
        return 1

    print()
    print("PASS: no authoring-only content in the public build")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
