#!/usr/bin/env python3
"""Audit tables for the companion guide / course: per-module shape stats,
refined dose counters, repeated-construction report."""

import re
import statistics
from collections import Counter
from pathlib import Path
import importlib.util

spec = importlib.util.spec_from_file_location("pl", str(Path(__file__).parent / "prose_lint_proto.py"))
pl = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pl)

CORPUS = Path(__file__).parent / "corpora"

def refined_rule_of_three(prose):
    """Exclude proper-name triplets (citations, author lists)."""
    hits = []
    for m in re.finditer(r"\b([\w-]+), ([\w-]+),? and ([\w-]+)\b", prose):
        a, b, c = m.group(1), m.group(2), m.group(3)
        if all(w[0].isupper() for w in (a, b, c)):
            continue  # citation/name list
        hits.append(m.group(0))
    return hits

def para_openers(text):
    """First word of each prose paragraph."""
    prose = pl.strip_to_prose(text)
    paras = [p.strip() for p in re.split(r"\n\s*\n", prose) if len(p.split()) > 5]
    return [pl.words(p)[0].lower() for p in paras if pl.words(p)]

def sentence_openers(prose):
    return [tuple(w.lower() for w in pl.words(s)[:2]) for s in pl.sentences(prose) if len(pl.words(s)) >= 2]

def ngrams(tokens, n):
    return zip(*[tokens[i:] for i in range(n)])

def main():
    print("== Per-module sentence shape (course-current) ==")
    print(f"{'module':<28}{'words':>7}{'sents':>7}{'mean':>7}{'sd':>7}{'cv':>7}{'short%':>8}{'long%':>7}{'r3/1k':>7}")
    module_rows = []
    for f in sorted((CORPUS / "course-current").glob("*.qmd")):
        if f.name in ("references.qmd",):
            continue
        text = f.read_text(errors="ignore")
        prose = pl.strip_to_prose(text)
        r = pl.analyze_text(prose)
        if not r:
            continue
        r3 = refined_rule_of_three(prose)
        r3k = round(len(r3) * 1000 / r["words"], 2)
        module_rows.append((f.name, r, r3))
        print(f"{f.name:<28}{r['words']:>7}{r['sentences']:>7}{r['sent_mean']:>7}{r['sent_sd']:>7}{r['sent_cv']:>7}{r['pct_short_le8']:>8}{r['pct_long_ge30']:>7}{r3k:>7}")

    print("\n== Refined rule-of-three dose (proper-name triplets excluded) ==")
    for corpus in ["course-current", "guide-current", "guide-first-draft", "clogs-final"]:
        text = "\n".join(f.read_text(errors="ignore") for f in sorted((CORPUS / corpus).glob("*"))
                         if f.name != "references.qmd")
        prose = pl.strip_to_prose(text)
        n_words = len(pl.words(prose))
        hits = refined_rule_of_three(prose)
        print(f"{corpus:<20} {len(hits):>4} hits  {round(len(hits)*1000/n_words,2):>6}/1k")

    print("\n== Repeated constructions: top recurring 4-grams (course-current, prose only) ==")
    text = "\n".join(f.read_text(errors="ignore") for f in sorted((CORPUS / "course-current").glob("*.qmd"))
                     if f.name != "references.qmd")
    prose = pl.strip_to_prose(text)
    toks = [w.lower() for w in pl.words(prose)]
    c4 = Counter(ngrams(toks, 4))
    for gram, n in c4.most_common(18):
        if n >= 4:
            print(f"  {n:>3}x  {' '.join(gram)}")

    print("\n== Sentence-opener bigram concentration ==")
    for corpus in ["course-current", "guide-current", "clogs-final"]:
        text = "\n".join(f.read_text(errors="ignore") for f in sorted((CORPUS / corpus).glob("*"))
                         if f.name != "references.qmd")
        prose = pl.strip_to_prose(text)
        ops = sentence_openers(prose)
        top = Counter(ops).most_common(5)
        total = len(ops)
        share = sum(n for _, n in top) / total * 100 if total else 0
        pretty = ", ".join(f"'{' '.join(g)}' x{n}" for g, n in top)
        print(f"{corpus:<20} top5 openers {share:.1f}% of {total} sents: {pretty}")

    print("\n== Paragraph-opener concentration (course-current) ==")
    all_ops = []
    for f in sorted((CORPUS / "course-current").glob("*.qmd")):
        if f.name == "references.qmd":
            continue
        all_ops += para_openers(f.read_text(errors="ignore"))
    top = Counter(all_ops).most_common(8)
    print(f"  {len(all_ops)} paragraphs; top openers: " + ", ".join(f"'{w}' x{n}" for w, n in top))

if __name__ == "__main__":
    main()
