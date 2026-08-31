#!/usr/bin/env python3
"""Clean the companion guide's search index after a render.

The GPT ergonomics review of 31 August 2026 (Artifact 2, finding 7) searched the
published guide for "rigidity" and got warm-up material ahead of the parameter
section, SVG-map gibberish in the snippets, and production text on display. The
ordered fix was to label the control, exclude SVG text and authoring-only blocks
from the index, and weight exact headings and glossary terms above body matches.

Authoring-only blocks are handled upstream by _authoring-notes.lua, which deletes
them from the syntax tree so they never reach the index at all. This script does
the other two:

  SVG TEXT      Quarto indexes the text nodes of the inlined course-map and
                exhibit SVGs, so every page carrying a figure has a run like
                "Macro seriesIMF World Economic Outlookreal GDP, nominal GDP..."
                in its searchable body. The run matches no query a reader would
                type and it crowds the snippet that tells them whether the hit is
                worth opening. This removes the <text> runs and keeps the SVG's
                <title>, which is the figure's accessible description and is
                genuinely findable prose.

  GLOSSARY      The glossary renders as one page and therefore arrives as ONE
                index entry: a single 5,700-character blob with an empty section
                field. Quarto's Fuse index weights `title` and `section` at 20
                against `text` at 10, so under the old shape a glossary term
                could only ever match as body text. This splits the page into one
                entry per term, with the term in the section field, so an exact
                term match outranks a passing mention in a module.

Run after `quarto render`. The project's post-render hook does this, so a plain
render keeps the index clean without anyone remembering.

Usage:

    python3 scripts/clean_search_index.py
    python3 scripts/clean_search_index.py --book docs/companion-guide/_book
"""

from __future__ import annotations

import argparse
import html as htmlmod
import json
import re
import sys
from pathlib import Path

SVG_BLOCK = re.compile(r"<svg\b.*?</svg>", re.S)
SVG_TEXT_ELEMENT = re.compile(r"<text\b[^>]*>(.*?)</text>", re.S)
TAG = re.compile(r"<[^>]+>")
GLOSSARY_ENTRY = re.compile(
    r'<dt>\s*<span id="(?P<id>gloss-[^"]+)"[^>]*>(?P<term>.*?)</span>\s*</dt>\s*'
    r"<dd>\s*(?P<definition>.*?)\s*</dd>",
    re.S,
)


def strip_tags(fragment: str) -> str:
    return htmlmod.unescape(TAG.sub("", fragment))


def svg_text_runs(page_html: str) -> list[str]:
    """The exact concatenated <text> content of each inlined SVG on a page.

    Quarto's indexer concatenates SVG text nodes with no separator, so
    reproducing that concatenation gives a string that can be removed from the
    index entry verbatim rather than approximately.
    """
    runs = []
    for svg in SVG_BLOCK.findall(page_html):
        parts = [strip_tags(m.group(1)) for m in SVG_TEXT_ELEMENT.finditer(svg)]
        run = "".join(parts)
        if len(run) >= 20:
            runs.append(run)
    return runs


def tidy(text: str) -> str:
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def glossary_entries(book: Path, page_entry: dict) -> list[dict]:
    """One index entry per glossary term, with the term in the section field."""
    path = book / "glossary.html"
    if not path.exists():
        return []
    page_html = path.read_text(encoding="utf-8")
    entries = []
    for match in GLOSSARY_ENTRY.finditer(page_html):
        term = strip_tags(match.group("term")).strip()
        definition = tidy(strip_tags(match.group("definition")))
        if not term or not definition:
            continue
        href = f"glossary.html#{match.group('id')}"
        entries.append(
            {
                "objectID": href,
                "href": href,
                "title": page_entry.get("title", "Glossary"),
                "section": term,
                "text": f"{term}\n{definition}",
                "crumbs": page_entry.get("crumbs", []),
            }
        )
    return entries


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--book",
        default="docs/companion-guide/_book",
        help="the rendered book directory (default: docs/companion-guide/_book)",
    )
    args = parser.parse_args()

    book = Path(args.book).resolve()
    index_path = book / "search.json"
    if not index_path.exists():
        print(f"no search index at {index_path}, nothing to clean")
        return 0

    entries = json.loads(index_path.read_text(encoding="utf-8"))
    before_entries = len(entries)
    before_chars = sum(len(e.get("text", "")) for e in entries)

    runs_by_page: dict[str, list[str]] = {}
    for path in sorted(book.glob("*.html")):
        runs_by_page[path.name] = svg_text_runs(path.read_text(encoding="utf-8"))

    stripped_runs = 0
    cleaned: list[dict] = []
    glossary_page_entries: list[dict] = []

    for entry in entries:
        page = entry.get("href", "").split("#", 1)[0]
        if page == "glossary.html":
            # Held back and rebuilt from the rendered page below, so that a
            # second run over an already-split index rebuilds the same index
            # rather than collapsing it to whichever term happened to be last.
            glossary_page_entries.append(entry)
            continue
        text = entry.get("text", "")
        for run in runs_by_page.get(page, []):
            if run in text:
                text = text.replace(run, "")
                stripped_runs += 1
        entry["text"] = tidy(text)
        if entry["text"]:
            cleaned.append(entry)

    exploded = []
    if glossary_page_entries:
        exploded = glossary_entries(book, glossary_page_entries[0])
        if exploded:
            cleaned.extend(exploded)
        else:
            # Never lose the glossary from the index because a parse failed.
            cleaned.extend(glossary_page_entries)

    index_path.write_text(
        json.dumps(cleaned, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    after_chars = sum(len(e.get("text", "")) for e in cleaned)
    print("Search index cleaned")
    print(f"  entries        {before_entries} -> {len(cleaned)}")
    print(f"  indexed chars  {before_chars} -> {after_chars}")
    print(f"  SVG text runs removed   {stripped_runs}")
    print(f"  glossary terms indexed  {len(exploded)}")
    if not exploded and glossary_page_entries:
        print("  WARNING: the glossary did not split, so it stays as one entry")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
