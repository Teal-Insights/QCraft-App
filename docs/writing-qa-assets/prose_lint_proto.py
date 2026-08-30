#!/usr/bin/env python3
"""prose-lint prototype: mechanical dose counters + shape detectors for AI-era writing QA.

Design rules (ADM-182): mechanical counts only, no LLM judgment anywhere.
Each detector is a regex or arithmetic over tokens. Output is per-file and
per-corpus rates per 1,000 words, plus sentence-shape statistics.

Usage: python3 prose_lint_proto.py <dir-or-file> [...]
"""

import json
import re
import statistics
import sys
from pathlib import Path

# ---------- text extraction (qmd/md -> prose) ----------

def strip_to_prose(text: str) -> str:
    # YAML frontmatter
    text = re.sub(r"\A---\n.*?\n---\n", "", text, flags=re.S)
    # fenced code / mermaid / mmd blocks
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    # include shortcodes and comments
    text = re.sub(r"{{<.*?>}}", " ", text, flags=re.S)
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    # display + inline math
    text = re.sub(r"\$\$.*?\$\$", " ", text, flags=re.S)
    text = re.sub(r"\$[^$\n]+\$", " ", text)
    # div fences / callout attrs / headings markers (keep heading text)
    text = re.sub(r"^:{3,}.*$", " ", text, flags=re.M)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.M)
    # tables (display copy, not prose)
    text = re.sub(r"^\|.*\|\s*$", " ", text, flags=re.M)
    text = re.sub(r"^[-|: ]+$", " ", text, flags=re.M)
    # images, links (keep link text), refs, inline code, html tags
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"\[@[^\]]+\]", " ", text)
    text = re.sub(r"`[^`]*`", " ", text)
    text = re.sub(r"<[^>\n]+>", " ", text)
    # emphasis markers
    text = re.sub(r"[*_]{1,3}", "", text)
    # bullets / numbering markers
    text = re.sub(r"^\s*[-+*]\s+", "", text, flags=re.M)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.M)
    return text

ABBREV = r"(?<!\bMr)(?<!\bMrs)(?<!\bDr)(?<!\bSt)(?<!\be\.g)(?<!\bi\.e)(?<!\bvs)(?<!\bpp)(?<!\bp)(?<!\bcf)(?<!\bet al)(?<!\bU\.S)(?<!\bU\.K)(?<!\bNo)"

def sentences(prose: str):
    # collapse whitespace, then split on sentence enders followed by space+capital/quote
    flat = re.sub(r"\s+", " ", prose).strip()
    parts = re.split(ABBREV + r"(?<=[.!?])\s+(?=[\"'A-Z(])", flat)
    return [p.strip() for p in parts if len(p.strip()) > 1]

def words(s: str):
    return re.findall(r"[A-Za-z][A-Za-z'-]*", s)

# ---------- detectors: (name, style-guide rule, regex) ----------
# Every detector counts OCCURRENCES; the dose verdict is applied later
# against per-1k thresholds, never as a single-use ban.

WORD_LISTS = {
    "filler_intensifiers": r"\b(genuinely|honestly|truly|simply|straightforward|of course|needless to say)\b",
    "banned_vocab": r"\b(delve|delves|delving|leverage[sd]?|leveraging|robust|robustly|seamless(?:ly)?|elevate[sd]?|unlock(?:s|ed|ing)?)\b",
    "watchlist_vocab": r"\b(crucial(?:ly)?|pivotal|foster(?:s|ing)?|underscor(?:e|es|ing)|tapestry|multifaceted|holistic|deep dive|journey|landscape|realm|testament|boast(?:s|ing)?|vibrant|intricate|comprehensive(?:ly)?)\b",
}

SHAPES = {
    # rule 3: negative parallelism (three frames)
    "neg_parallel_not_but": r"\bnot\b[^.;:!?]{1,60}?,?\s+but\b",
    "neg_parallel_isnt_about": r"\b(?:is|are|was|were)n[’']?t\s+(?:just\s+|only\s+|about\s+)[^.;!?]{1,60}?[,;]\s*(?:it|they|this|that)[’']?s?\b",
    "neg_parallel_not_only": r"\bnot\s+only\b[^.;!?]{1,80}?\bbut\s+(?:also\s+)?",
    # rule 6: "The X? A Y." rhetorical question-answer
    "question_answer": r"\?\s+(?:A|An|The|It|Yes|No|Not|Simple|Easy)\b[^.!?]{0,40}[.!]",
    # rule 10/8: appended-judgment / echo-amplifier tails
    "judgment_tail": r",\s+(?:and\s+that(?:\s+i|[’'])s\s+(?:a\s+)?(?:feature|good|the\s+point|why|what\s+matters)|which\s+is\s+exactly\s+the\s+point|and\s+that\s+matters)\b",
    "echo_amplifier": r",\s+and\s+the\s+\w+\s+(?:is|are)\s+real\b",
    # rule 11: participle taglines
    "participle_tagline": r",\s+made\s+\w+\b",
    # rule 7: self-certifying tails
    "self_certifying": r"\b(?:and\s+we\s+say\s+so\s+plainly|to\s+be\s+honest|we\s+are\s+transparent\s+about|let\s+us\s+be\s+clear|let[’']s\s+be\s+clear)\b",
    # other tics
    "worth_noting": r"\b(?:it[’']?s\s+worth\s+noting|it\s+is\s+worth\s+noting|it[’']?s\s+important\s+to\s+note|it\s+is\s+important\s+to\s+note)\b",
    "lets_dive": r"\blet[’']?s\s+(?:dive|explore|unpack)\b",
    "in_conclusion": r"\bin\s+conclusion\b",
    "throat_clearing": r"\b(?:in\s+today[’']?s\s+world|as\s+we\s+all\s+know)\b",
    # rule-of-three proxy: three-item coordination "A, B(,) and C"
    "rule_of_three": r"\b[\w-]+,\s+[\w-]+,?\s+and\s+[\w-]+\b",
    # em-dash (workspace: zero)
    "em_dash": r"[—]|(?<=\w)--(?=\w)",
}

def analyze_text(prose: str):
    sents = sentences(prose)
    all_words = words(prose)
    n_words = len(all_words)
    if n_words == 0:
        return None
    lens = [len(words(s)) for s in sents]
    lens = [l for l in lens if l > 0]
    per1k = lambda n: round(n * 1000 / n_words, 2)

    counts = {}
    for name, rx in {**WORD_LISTS, **SHAPES}.items():
        counts[name] = len(re.findall(rx, prose, flags=re.I))

    # sentence shape
    mean_len = statistics.mean(lens) if lens else 0
    sd_len = statistics.stdev(lens) if len(lens) > 1 else 0
    short = sum(1 for l in lens if l <= 8)
    long_ = sum(1 for l in lens if l >= 30)

    # repeated openers (first word of consecutive sentences)
    openers = [words(s)[0].lower() for s in sents if words(s)]
    rep_open = sum(1 for a, b in zip(openers, openers[1:]) if a == b)

    # punctuation per 1k
    punct = {p: per1k(prose.count(c)) for p, c in
             [("semicolons", ";"), ("colons", ":"), ("parens_open", "("), ("commas", ",")]}

    # lexical: MATTR window 400
    toks = [w.lower() for w in all_words]
    W = 400
    if len(toks) >= W:
        ratios = [len(set(toks[i:i+W])) / W for i in range(0, len(toks) - W + 1, 100)]
        mattr = round(statistics.mean(ratios), 4)
    else:
        mattr = round(len(set(toks)) / len(toks), 4)

    # long words (8+ letters), Economist metric
    long_words = sum(1 for w in all_words if len(w) >= 8)
    # nominalization proxy
    nomin = sum(1 for w in all_words if re.search(r"(?:tion|sion|ment|ance|ence|ity)s?$", w.lower()) and len(w) > 7)
    # "and" rate
    and_rate = per1k(sum(1 for w in toks if w == "and"))

    return {
        "words": n_words,
        "sentences": len(lens),
        "sent_mean": round(mean_len, 1),
        "sent_sd": round(sd_len, 1),
        "sent_cv": round(sd_len / mean_len, 3) if mean_len else 0,
        "pct_short_le8": round(100 * short / len(lens), 1) if lens else 0,
        "pct_long_ge30": round(100 * long_ / len(lens), 1) if lens else 0,
        "repeated_openers_per100sent": round(100 * rep_open / max(1, len(lens) - 1), 1),
        "mattr400": mattr,
        "long_words_pct": round(100 * long_words / n_words, 1),
        "nominalizations_per1k": per1k(nomin),
        "and_per1k": and_rate,
        **punct,
        "tics_per1k": {k: per1k(v) for k, v in counts.items() if v},
        "tics_raw": {k: v for k, v in counts.items() if v},
    }

def main(paths):
    out = {}
    for p in paths:
        p = Path(p)
        files = sorted(p.glob("*.qmd")) + sorted(p.glob("*.md")) + sorted(p.glob("*.txt")) if p.is_dir() else [p]
        corpus_prose = []
        out[p.name] = {"files": {}}
        for f in files:
            prose = strip_to_prose(f.read_text(errors="ignore"))
            r = analyze_text(prose)
            if r:
                out[p.name]["files"][f.name] = r
                corpus_prose.append(prose)
        whole = analyze_text("\n".join(corpus_prose)) if corpus_prose else None
        out[p.name]["TOTAL"] = whole
    print(json.dumps(out, indent=1))

if __name__ == "__main__":
    main(sys.argv[1:])
