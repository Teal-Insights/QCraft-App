"""Capture real Explorer screenshots for the course, and a clean set for the deck.

Two jobs, one drive of the frozen build.

The COURSE set answers the five SCREENSHOT-TODO placeholders in M1 to M4. Each of
those placeholders asks for something called out on the image, so a bare capture
does not discharge it: the shot is composed with an annotation layer drawn in the
same design language as scripts/build_exhibits.py, then flattened to a single PNG
so the HTML book and the PDF get the same picture. The composition step is a
second browser pass over a local HTML page; nothing is drawn by hand and nothing
in the underlying screenshot is retouched.

The DECK set is clean and unannotated: every tab, both modes, a coverage notice
and the export flow, for lane 5 to crop as it likes.

Everything runs against a server on the frozen build. Start one first, and check
it is serving THIS worktree rather than another branch's bundle, which is the
hazard the sprint notes record twice:

    python3 -m http.server 8080 --directory apps/qcraft-web/dist
    lsof -a -p "$(lsof -nP -iTCP:8080 -sTCP:LISTEN -t | head -1)" -d cwd

Then, from the repository root:

    uv run --no-project --with playwright python3 scripts/build_app_screenshots.py
    uv run --no-project --with playwright python3 scripts/build_app_screenshots.py course
    uv run --no-project --with playwright python3 scripts/build_app_screenshots.py deck

Override the target with QCRAFT_APP_URL.
"""

from __future__ import annotations

import base64
import json
import os
import sys
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # the include writer runs without a browser
    from playwright.sync_api import Page

REPO_ROOT = Path(__file__).resolve().parent.parent
COURSE_OUT = REPO_ROOT / "docs" / "companion-guide" / "figures" / "screenshots"
DECK_OUT = (
    REPO_ROOT.parent / "SHARED" / "screenshots-frozen"
)
URL = os.environ.get("QCRAFT_APP_URL", "http://localhost:8080/")
# Named in the note under each composed figure, so a reader can tell which
# build the capture came from. Override to name the build being shot.
BUILD_LABEL = os.environ.get("QCRAFT_BUILD_LABEL", "the frozen build at tag freeze-2026-08-29")

# Written by scripts/build_app_facts.py against the engine. Every callout number
# comes from here and is then matched against the app's own rendered label.
FACTS = json.loads(
    (REPO_ROOT / "docs" / "companion-guide" / "figures" / "series"
     / "app-facts.json").read_text()
)
ENGINE = FACTS["engine"]
ENGINE_INDEX = FACTS["index"]
KENYA = FACTS["kenya"]

SCALE = 2
VIEWPORT = {"width": 1440, "height": 900}

# The exhibit palette, from scripts/build_exhibits.py. Annotations have to read
# as part of the same book, so they share it rather than inventing a second one.
INK = "#2C3E50"
MUTED = "#63757F"
ACCENT_DARK = "#16A085"
RED = "#C0392B"
AMBER = "#C9871F"
WHITE = "#FFFFFF"
PANEL_LINE = "#E1E7EB"

SANS = '"Söhne","Inter",system-ui,-apple-system,sans-serif'


# ── driving the app ──────────────────────────────────────────────────────────


def set_mode(page: Page, mode: str) -> None:
    button = page.locator(".mode__switch").get_by_role("radio", name=mode, exact=True)
    if button.get_attribute("aria-checked") != "true":
        button.click()
        page.wait_for_timeout(900)


def set_register(page: Page, register: str) -> None:
    button = page.locator(".register__control").get_by_role(
        "radio", name=register, exact=True
    )
    if button.get_attribute("aria-checked") != "true":
        button.click()
        page.wait_for_timeout(500)


def open_tab(page: Page, tab: str) -> None:
    page.get_by_role("tab", name=tab, exact=True).click()
    page.wait_for_timeout(700)


def set_state(page: Page, **kw) -> None:
    """Set the sidebar controls, then let the charts settle."""
    if "country" in kw:
        page.select_option("#country", kw["country"])
        page.wait_for_timeout(1400)
    for control, sel in (
        ("demography", "#demography"),
        ("interest_mode", "#interest-mode"),
        ("fiscal_rule", "#fiscal-rule"),
    ):
        if control in kw:
            page.select_option(sel, kw[control])
            page.wait_for_timeout(500)
    if "debt_target" in kw:
        page.fill("#debt-target", str(kw["debt_target"]))
        page.dispatch_event("#debt-target", "change")
        page.wait_for_timeout(500)
    if "rigidity" in kw:
        page.eval_on_selector(
            "#rigidity",
            """(el, v) => {
                const s = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value').set;
                s.call(el, String(v));
                el.dispatchEvent(new Event('input', {bubbles: true}));
                el.dispatchEvent(new Event('change', {bubbles: true}));
            }""",
            kw["rigidity"],
        )
        page.wait_for_timeout(800)
    page.wait_for_timeout(600)


def shoot(page: Page, path: Path, selector: str | None = None, full: bool = False):
    path.parent.mkdir(parents=True, exist_ok=True)
    if selector:
        page.locator(selector).first.screenshot(path=str(path))
    else:
        page.screenshot(path=str(path), full_page=full)
    print(f"  wrote {path.relative_to(REPO_ROOT.parent)}")
    return path


# ── composing an annotated figure ────────────────────────────────────────────


def png_size(path: Path) -> tuple[int, int]:
    """Width and height in device pixels, straight from the IHDR chunk."""
    raw = path.read_bytes()[16:24]
    return int.from_bytes(raw[:4], "big"), int.from_bytes(raw[4:], "big")


def data_uri(png: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(png.read_bytes()).decode()


def compose(
    browser,
    source: Path,
    out: Path,
    callouts: list[dict],
    note: str = "",
    brackets: list[dict] | None = None,
    pad_right: int = 250,
    pad_top: int = 0,
    pad_bottom: int = 0,
) -> Path:
    """Flatten a captured PNG plus an annotation layer into one PNG.

    `callouts` are placed in PERCENT of the underlying image, so they survive a
    capture whose pixel size shifts, and each is a labelled marker with an
    optional leader line to the point it is about.
    """
    brackets = brackets or []
    img = data_uri(source)
    pw, ph = png_size(source)
    logical_w, logical_h = pw // SCALE, ph // SCALE
    page = browser.new_page(
        viewport={
            "width": logical_w + pad_right + 24,
            "height": logical_h + pad_top + pad_bottom + (60 if note else 16),
        },
        device_scale_factor=SCALE,
    )
    marks = []
    for i, c in enumerate(callouts, start=1):
        colour = c.get("colour", ACCENT_DARK)
        lx, ly = c["label"]
        marks.append(
            f'<div class="lbl" style="left:{lx}%;top:{ly}%;--c:{colour};'
            f'{"transform:translate(-100%,-50%);" if c.get("flip") else ""}">'
            f'<span class="num">{i}</span><span class="txt">{c["text"]}</span></div>'
        )
        if "point" in c:
            px, py = c["point"]
            marks.append(
                f'<div class="dot" style="left:{px}%;top:{py}%;--c:{colour}"></div>'
            )
            marks.append(
                f'<svg class="leader"><line x1="{lx}%" y1="{ly}%" '
                f'x2="{px}%" y2="{py}%" stroke="{colour}" stroke-width="1.4" '
                f'stroke-dasharray="4 3"/></svg>'
            )
    for b in brackets:
        colour = b.get("colour", INK)
        sub = f'<i>{b["sub"]}</i>' if b.get("sub") else ""
        marks.append(
            f'<svg class="leader">'
            f'<line x1="{b["x"]}%" y1="{b["y1"]}%" x2="{b["x"]}%" y2="{b["y2"]}%" '
            f'stroke="{colour}" stroke-width="1.4"/>'
            f'<line x1="{b["x"]}%" y1="{b["y1"]}%" x2="{b["x"]}%" y2="{b["y1"]}%" '
            f'stroke="{colour}" stroke-width="1.4" '
            f'style="transform:translateX(-7px)" />'
            f'<line x1="{b["x"]}%" y1="{b["y1"]}%" x2="{b["x"]}%" y2="{b["y1"]}%" '
            f'stroke="{colour}" stroke-width="1.4"/>'
            f'</svg>'
            f'<div class="arm" style="left:{b["x"]}%;top:{b["y1"]}%;--c:{colour}"></div>'
            f'<div class="arm" style="left:{b["x"]}%;top:{b["y2"]}%;--c:{colour}"></div>'
        )
        marks.append(
            f'<div class="brk" style="left:calc({b["x"]}% + 14px);'
            f'top:{(b["y1"] + b["y2"]) / 2}%;--c:{colour}">'
            f'<b>{b["text"]}</b>{sub}</div>'
        )
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
      * {{ box-sizing: border-box; }}
      body {{ margin:0; background:{WHITE}; font-family:{SANS}; }}
      #wrap {{ position:relative; display:inline-block;
               padding:{pad_top}px {pad_right}px {pad_bottom}px 0; background:{WHITE}; }}
      #shot {{ display:block; width:{logical_w}px; height:{logical_h}px;
               border:1px solid {PANEL_LINE}; border-radius:3px; }}
      #layer {{ position:absolute; inset:{pad_top}px {pad_right}px {pad_bottom}px 0;
                pointer-events:none; }}
      .leader {{ position:absolute; inset:0; width:100%; height:100%; overflow:visible; }}
      .dot {{ position:absolute; width:11px; height:11px; margin:-5.5px 0 0 -5.5px;
              border-radius:50%; background:var(--c);
              box-shadow:0 0 0 2.5px {WHITE}; }}
      .lbl {{ position:absolute; transform:translate(0,-50%); display:flex;
              align-items:center; gap:7px; background:{WHITE};
              padding:3px 9px 3px 3px; border:1px solid var(--c); border-radius:14px;
              white-space:nowrap; box-shadow:0 1px 3px rgba(44,62,80,.10); }}
      .num {{ display:inline-flex; align-items:center; justify-content:center;
              width:20px; height:20px; border-radius:50%; background:var(--c);
              color:{WHITE}; font-size:11.5px; font-weight:600; }}
      .txt {{ font-size:12.5px; font-weight:500; color:{INK}; }}
      .arm {{ position:absolute; width:8px; height:0; margin:-0.7px 0 0 -8px;
              border-top:1.4px solid var(--c); }}
      .brk {{ position:absolute; transform:translateY(-50%); color:var(--c);
              line-height:1.25; white-space:nowrap; }}
      .brk b {{ display:block; font-size:13px; font-weight:600; }}
      .brk i {{ display:block; font-size:10.5px; font-style:normal; color:{MUTED}; }}
      #note {{ font-size:11px; color:{MUTED}; padding:9px 0 0 1px;
               max-width:900px; line-height:1.5; }}
    </style></head><body>
      <div id="wrap"><img id="shot" src="{img}"><div id="layer">{"".join(marks)}</div></div>
      {f'<div id="note">{note}</div>' if note else ''}
    </body></html>"""
    page.set_content(html)
    page.wait_for_timeout(500)
    out.parent.mkdir(parents=True, exist_ok=True)
    page.locator("body").screenshot(path=str(out))
    page.close()
    print(f"  composed {out.relative_to(REPO_ROOT.parent)}")
    return out


def side_by_side(
    browser, left: Path, right: Path, out: Path, left_cap: str, right_cap: str, note: str
) -> Path:
    lw, lh = png_size(left)
    rw, rh = png_size(right)
    total = 1280
    l_each = int(total * lw / (lw + rw))
    r_each = total - l_each
    lh_s = int(lh / lw * l_each)
    rh_s = int(rh / rw * r_each)
    page = browser.new_page(
        viewport={"width": total + 18 + 24, "height": max(lh_s, rh_s) + 110},
        device_scale_factor=SCALE,
    )
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
      body {{ margin:0; background:{WHITE}; font-family:{SANS}; }}
      #row {{ display:flex; gap:18px; align-items:flex-start; }}
      figure {{ margin:0; flex:0 0 auto; }}
      #lf {{ width:{l_each}px; }} #rf {{ width:{r_each}px; }}
      img {{ display:block; width:100%; border:1px solid {PANEL_LINE}; border-radius:3px; }}
      figcaption {{ font-size:12px; font-weight:600; color:{INK}; padding:0 0 7px 1px; }}
      #note {{ font-size:11px; color:{MUTED}; padding:10px 0 0 1px; line-height:1.5;
               max-width:1100px; }}
    </style></head><body>
      <div id="row">
        <figure id="lf"><figcaption>{left_cap}</figcaption><img src="{data_uri(left)}"></figure>
        <figure id="rf"><figcaption>{right_cap}</figcaption><img src="{data_uri(right)}"></figure>
      </div>
      <div id="note">{note}</div>
    </body></html>"""
    page.set_content(html)
    page.wait_for_timeout(500)
    out.parent.mkdir(parents=True, exist_ok=True)
    page.locator("body").screenshot(path=str(out))
    page.close()
    print(f"  composed {out.relative_to(REPO_ROOT.parent)}")
    return out


# ── the quarto include, same shape as build_exhibits.py ──────────────────────


def write_include(name: str, caption: str) -> None:
    path = COURSE_OUT.parent / f"_screenshot-{name}.qmd"
    esc = caption.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    path.write_text(
        "<!-- Generated by scripts/build_app_screenshots.py. Do not edit by hand. -->\n\n"
        '::: {.qc-shot}\n'
        f"![{esc}](figures/screenshots/{name}.png)\n"
        ":::\n"
    )
    print(f"  wrote {path.relative_to(REPO_ROOT)}")


# ── measuring, so callouts point at what is actually drawn ───────────────────

MEASURE_JS = """
(sel) => {
  const el = document.querySelectorAll(sel.q)[sel.n];
  const box = el.getBoundingClientRect();
  const svg = el.querySelector('svg');
  const pc = (r) => ({
    x1: (r.left - box.left) / box.width * 100,
    x2: (r.right - box.left) / box.width * 100,
    y1: (r.top - box.top) / box.height * 100,
    y2: (r.bottom - box.top) / box.height * 100,
    cx: (r.left + r.right) / 2 === 0 ? 0 : ((r.left + r.right) / 2 - box.left) / box.width * 100,
    cy: ((r.top + r.bottom) / 2 - box.top) / box.height * 100,
  });
  const out = { box: { w: box.width, h: box.height }, texts: [], band: null, plot: null };
  if (!svg) return out;
  out.plot = pc(svg.getBoundingClientRect());
  // The shaded WEO band: the widest filled rect that is not the plot background.
  let best = null;
  for (const r of svg.querySelectorAll('rect')) {
    const f = (r.getAttribute('fill') || '').toLowerCase();
    if (!f || f === 'none' || f === '#fff' || f === '#ffffff' || f === 'white') continue;
    const b = r.getBoundingClientRect();
    if (b.width < 8 || b.height < 40) continue;
    if (!best || b.width < best.width) best = b;   // the band, not the backdrop
  }
  if (best) out.band = pc(best);
  for (const t of svg.querySelectorAll('text')) {
    const s = (t.textContent || '').trim();
    if (!s) continue;
    out.texts.push({ s, ...pc(t.getBoundingClientRect()) });
  }
  return out;
}
"""


def measure(page: Page, q: str, n: int = 0) -> dict:
    return page.evaluate(MEASURE_JS, {"q": q, "n": n})


def find_text(m: dict, pred) -> dict | None:
    for t in m["texts"]:
        if pred(t["s"]):
            return t
    return None


# ── the course set: the five SCREENSHOT-TODO placeholders ────────────────────

# Uganda's worked-case settings, from the M4 parameter table. `fiscal_rule` is
# the one still on Teal's desk, so both are captured and each include points at
# whichever is chosen. See MORNING-REPORT.md.
UGA_BASE = dict(country="UGA", demography="Medium", debt_target=50, rigidity=1.0)
UGA_BOUNDARY = "2029"


def label(m: dict, text: str) -> dict:
    """The app's own rendered label for a value, or a loud failure.

    Callouts quote engine numbers, so each one is looked up by the string the
    app drew rather than by where it happens to sit. If the number moves, this
    raises instead of shipping a figure whose annotation points at the wrong
    line, which is the failure mode the first pass of this script actually had.
    """
    for tx in m["texts"]:
        if tx["s"].strip() == text:
            return tx
    drawn = sorted({tx["s"] for tx in m["texts"] if "%" in tx["s"] or tx["s"].isdigit()})
    msg = f"the app never drew {text!r}; it drew {drawn}"
    raise SystemExit(msg)


def course_set(page: Page, browser, rule: str) -> None:
    suffix = "" if rule == "Yes" else "-ruleoff"
    tag = "fiscal rule on" if rule == "Yes" else "fiscal rule off"
    raw = COURSE_OUT / "_raw"
    set_mode(page, "Verified")
    set_register(page, "Workbook")
    set_state(page, **UGA_BASE, fiscal_rule=rule)

    # Engine truth for this configuration, so the captions quote it rather than
    # a reading taken off a picture.
    v = ENGINE[rule]

    # ---- M4 step 2: the Baseline tab, all three charts --------------------
    open_tab(page, "Baseline")
    src = shoot(page, raw / f"m4-baseline{suffix}.png", selector=".tab")
    m = measure(page, ".chart", 0)
    boundary = label(m, f"WEO \u2192 {UGA_BOUNDARY}")
    end_lbl = label(m, v["debt_2099_label"])
    geom = page.evaluate(
        """() => {
            const P = document.querySelector('.tab').getBoundingClientRect();
            const g = (i) => {
              const b = document.querySelectorAll('.chart')[i].getBoundingClientRect();
              return {t:b.top, l:b.left, w:b.width, h:b.height};
            };
            return {P:{t:P.top,l:P.left,w:P.width,h:P.height}, c0:g(0), c2:g(2)};
        }"""
    )

    def onto(cx, cy, which):
        b, P = geom[which], geom["P"]
        return ((b["l"] - P["l"] + cx / 100 * b["w"]) / P["w"] * 100,
                (b["t"] - P["t"] + cy / 100 * b["h"]) / P["h"] * 100)

    plot = m["plot"] or {"y1": 20.0, "y2": 90.0}
    mid_y = plot["y1"] + (plot["y2"] - plot["y1"]) * 0.62
    ax, ay = onto(boundary["cx"], mid_y, "c0")
    bx, by = onto(end_lbl["x1"] - 1.5, end_lbl["cy"], "c0")
    cx, cy = onto(62, 46, "c2")
    compose(
        browser, src, COURSE_OUT / f"m4-baseline{suffix}.png",
        [
            {"text": f"the shaded WEO period ends at {UGA_BOUNDARY}",
             "point": (ax, ay), "label": (ax + 2.5, ay - 2.6), "colour": AMBER},
            {"text": f"the 2099 debt ratio, {v['debt_2099_label']}",
             "point": (bx, by), "label": (bx - 1.5, by - 3.2),
             "colour": RED, "flip": True},
            {"text": "primary minus overall is the interest burden",
             "point": (cx, cy), "label": (cx + 2.5, cy - 4), "colour": ACCENT_DARK},
        ],
        note=(f"Q-CRAFT Explorer, Verified mode (WEO October 2024), Uganda, demography "
              f"Medium, debt target 50, expenditure rigidity 1.0, {tag}. Captured from "
              f"{BUILD_LABEL}."),
        pad_right=300, pad_top=34, pad_bottom=8,
    )

    # ---- M4 step 4: the Climate tab GDP index ----------------------------
    open_tab(page, "Climate")
    src = shoot(page, raw / f"m4-climate-index{suffix}.png", selector=".chart")
    m = measure(page, ".chart", 0)
    bnd = label(m, f"WEO \u2192 {UGA_BOUNDARY}")
    idx = label(m, ENGINE_INDEX["baseline_label"])
    cplot = m["plot"] or {"y1": 20.0, "y2": 90.0}
    compose(
        browser, src, COURSE_OUT / f"m4-climate-index{suffix}.png",
        [
            {"text": "impacts begin in 2030; before it every scenario is the baseline",
             "point": (bnd["cx"], cplot["y1"] + (cplot["y2"] - cplot["y1"]) * 0.55),
             "label": (bnd["cx"] + 3,
                       cplot["y1"] + (cplot["y2"] - cplot["y1"]) * 0.22),
             "colour": AMBER},
        ],
        brackets=[{
            "x": min(96.0, idx["x2"] + 0.6),
            "y1": idx["cy"],
            "y2": idx["cy"] + (idx["cy"] - 4) * 0.10,
            "text": f"{ENGINE_INDEX['spread_pct']} percent",
            "sub": (f"baseline {ENGINE_INDEX['baseline_label']}, "
                    f"Hot unadapted {ENGINE_INDEX['hot_unadapted']}"),
            "colour": RED,
        }],
        note=("Q-CRAFT Explorer, Verified mode, Uganda, Climate tab. The index is set to "
              "100 at 2029, the last year Uganda's WEO series reports. The Explorer draws "
              "the six scenarios against a legend and labels only the baseline endpoint, "
              "so the spread at 2099 is named here: the scenarios run from Paris "
              f"{ENGINE_INDEX['paris']} down to Hot unadapted "
              f"{ENGINE_INDEX['hot_unadapted']}, against a baseline of "
              f"{ENGINE_INDEX['baseline_label']}."),
        pad_right=380, pad_top=30,
    )

    # ---- M1: the Analysis tab, the baseline-to-Hot-Unadapted gap ---------
    open_tab(page, "Analysis")
    src = shoot(page, raw / f"m1-analysis-gap{suffix}.png", selector=".chart")
    m = measure(page, ".chart", 0)
    hot = label(m, v["hot_unadapted_label"])
    base = label(m, v["baseline_label"])
    compose(
        browser, src, COURSE_OUT / f"m1-analysis-gap{suffix}.png",
        [
            {"text": f"Hot unadapted, {v['hot_unadapted_label']}",
             "point": (hot["x1"] - 1, hot["cy"]),
             "label": (hot["x1"] - 3, max(6.0, hot["cy"] - 9)),
             "colour": RED, "flip": True},
            {"text": f"baseline, {v['baseline_label']}",
             "point": (base["x1"] - 1, base["cy"]),
             "label": (base["x1"] - 3, min(94.0, base["cy"] + 9)),
             "colour": INK, "flip": True},
        ],
        brackets=[{
            "x": min(95.0, max(hot["x2"], base["x2"]) + 0.8),
            "y1": hot["cy"], "y2": base["cy"],
            "text": f"{v['gap_points']} points",
            "sub": "of GDP, at 2099",
            "colour": ACCENT_DARK,
        }],
        note=(f"Q-CRAFT Explorer, Verified mode, Uganda, Analysis tab, {tag}. The vertical "
              f"gap between the baseline and Hot unadapted at 2099 is the number a fiscal "
              f"risk paragraph quotes."),
        pad_right=380, pad_top=30,
    )

    # ---- M3: rigidity 1.0 against rigidity 0.0 ---------------------------
    shots, axes, fans = {}, {}, {}
    for rig in (1.0, 0.0):
        set_state(page, rigidity=rig)
        open_tab(page, "Analysis")
        base_png = shoot(page, raw / f"m3-rigidity-{rig:.1f}{suffix}.png", selector=".chart")
        mm = measure(page, ".chart", 0)
        rv = v["rigidity"][f"{rig:.1f}"]
        hot_l = label(mm, rv["hot_unadapted_label"])
        par_l = label(mm, rv["paris_label"])
        fans[rig] = rv["fan_points"]
        axes[rig] = [x["s"] for x in mm["texts"]
                     if x["s"].lstrip("-").isdigit() and not 2000 < int(x["s"]) < 2200]
        shots[rig] = compose(
            browser, base_png, raw / f"m3-marked-{rig:.1f}{suffix}.png", [],
            brackets=[{
                "x": min(94.0, max(hot_l["x2"], par_l["x2"]) + 0.8),
                "y1": hot_l["cy"], "y2": par_l["cy"],
                "text": f"{rv['fan_points']} points",
                "sub": "widest to narrowest, 2099",
                "colour": RED if rig == 1.0 else ACCENT_DARK,
            }],
            pad_right=230, pad_top=10,
        )
    same = axes[1.0] == axes[0.0]
    note = (f"Q-CRAFT Explorer, Verified mode, Uganda, Analysis tab, {tag}. Expenditure "
            f"rigidity 1.0 on the left and 0.0 on the right. ")
    note += ("Both panels are drawn on the same vertical scale. "
             if same else
             "The Explorer scales each chart to its own data, so the two vertical axes "
             "are not the same and the eye will read the two fans as more alike than they "
             "are. The bracket on each panel is the measurement to compare: ")
    note += (f"the fan spans {fans[1.0]} points of GDP at rigidity 1.0 and {fans[0.0]} at "
             f"rigidity 0.0. That collapse is what the rigidity control does.")
    side_by_side(
        browser, shots[1.0], shots[0.0],
        COURSE_OUT / f"m3-rigidity-compare{suffix}.png",
        "Expenditure rigidity 1.0, the tool default",
        "Expenditure rigidity 0.0, spending adjusts fully",
        note,
    )
    set_state(page, rigidity=1.0)


def course_kenya(page: Page, browser) -> None:
    """M2: the debt trajectory and the fiscal balances panel, in one image."""
    raw = COURSE_OUT / "_raw"
    set_mode(page, "Verified")
    set_register(page, "Workbook")
    set_state(page, country="KEN", demography="Medium", debt_target=50,
              rigidity=1.0, fiscal_rule="Yes")
    open_tab(page, "Baseline")
    debt = shoot(page, raw / "m2-kenya-debt.png", selector=".chart")
    bal = page.locator(".chart").nth(2)
    bal.scroll_into_view_if_needed()
    page.wait_for_timeout(500)
    balp = raw / "m2-kenya-balances.png"
    bal.screenshot(path=str(balp))
    print(f"  wrote {balp.relative_to(REPO_ROOT.parent)}")
    k = KENYA
    side_by_side(
        browser, debt, balp, COURSE_OUT / "m2-baseline-reconciliation.png",
        f"The debt ratio: {k['debt_window']} points across the deficit years",
        f"The primary balance: in deficit from {k['first']} to {k['last']}",
        ("Q-CRAFT Explorer, Verified mode, Kenya, Baseline tab, Explorer defaults. Kenya "
         f"runs a primary deficit every year from {k['first']} to {k['last']}, and over "
         f"those eleven years the debt ratio moves {k['debt_window']} points, from "
         f"{k['debt_first']} to {k['debt_last']} percent of GDP. A deficit does not have "
         "to raise the ratio, because nominal growth is working on the denominator at the "
         "same time. That is the reconciliation this chapter's arithmetic predicts, on the "
         "chapter's own country, so every plotted point is checkable against "
         "figures/series/m2-primary-balance.csv and m2-debt-paths.csv."),
    )


# ── the deck set: clean, unannotated, for lane 5 ─────────────────────────────

DECK_TABS = ["Baseline", "Analysis", "Climate", "Data", "Methodology", "About the data"]


def deck_set(page: Page) -> None:
    DECK_OUT.mkdir(parents=True, exist_ok=True)

    # Both modes, on the tab a reader lands on.
    for mode in ("Verified", "Current"):
        set_mode(page, mode)
        set_state(page, country="UGA", demography="Medium", debt_target=50,
                  rigidity=1.0, fiscal_rule="Yes")
        open_tab(page, "Baseline")
        shoot(page, DECK_OUT / f"mode-{mode.lower()}-uganda-baseline.png")
        shoot(page, DECK_OUT / f"mode-{mode.lower()}-banner.png", selector=".mode__switch")

    # Every tab, in Verified mode, which is the one the parity claim is about.
    set_mode(page, "Verified")
    set_state(page, country="UGA")
    for tab in DECK_TABS:
        open_tab(page, tab)
        slug = tab.lower().replace(" ", "-")
        shoot(page, DECK_OUT / f"tab-{slug}.png")
        shoot(page, DECK_OUT / f"tab-{slug}-full.png", full=True)

    # Both chart registers, on the tab where the difference reads.
    open_tab(page, "Baseline")
    for register in ("Workbook", "Briefing"):
        set_register(page, register)
        shoot(page, DECK_OUT / f"register-{register.lower()}.png", selector=".chart")
    set_register(page, "Workbook")

    # A coverage notice. Zambia refuses on both vintages; the Maldives has no
    # climate estimates and is the M5 teaching case.
    for iso, slug in (("ZMB", "notice-country-unavailable"),
                      ("MDV", "notice-no-climate-estimates")):
        set_state(page, country=iso)
        open_tab(page, "Baseline")
        shoot(page, DECK_OUT / f"{slug}.png")
        open_tab(page, "Analysis")
        shoot(page, DECK_OUT / f"{slug}-analysis.png")

    # An anchor-shifted country, where the app names the anchor year on screen.
    # Ecuador is anchor-shifted on the CURRENT vintage only: its April 2026 series
    # stops reporting after 2025 while the release runs to 2029. On the frozen
    # vintage it is an ordinary country and no notice shows, so capturing it in
    # Verified mode gives a picture that does not contain what the file is named
    # for. Both are taken, and the mode is in the file name.
    set_state(page, country="ECU")
    for mode in ("Current", "Verified"):
        set_mode(page, mode)
        open_tab(page, "Baseline")
        page.wait_for_timeout(900)
        shoot(page, DECK_OUT / f"notice-anchor-year-named-{mode.lower()}.png")
    set_mode(page, "Verified")

    # The export flow.
    set_state(page, country="UGA")
    open_tab(page, "Export")
    page.wait_for_timeout(2500)
    shoot(page, DECK_OUT / "export-flow.png")
    shoot(page, DECK_OUT / "export-flow-full.png", full=True)


# The caption under each course screenshot. Every number in them is read from
# app-facts.json, so a caption cannot drift away from the engine.
def captions() -> dict[str, str]:
    e = ENGINE["Yes"]
    i = ENGINE_INDEX
    k = KENYA
    return {
        "m1-analysis-gap": (
            f"The Analysis tab, Uganda, in Verified mode. Six scenarios and a baseline, "
            f"and the one measurement a fiscal risk paragraph quotes is the vertical "
            f"distance between the outer two at 2099: {e['baseline_label']} under the "
            f"baseline against {e['hot_unadapted_label']} under Hot unadapted, which is "
            f"{e['gap_points']} points of GDP."
        ),
        "m2-baseline-reconciliation": (
            f"Kenya on the Baseline tab, with the debt ratio beside the fiscal balances "
            f"that produce it. The primary balance is in deficit every year from "
            f"{k['first']} to {k['last']}, and across those {k['years']} years the debt "
            f"ratio moves {k['debt_window']} points. A primary deficit does not have to "
            f"raise the ratio, which is the whole content of the equation in Step 1."
        ),
        "m3-rigidity-compare": (
            f"The same country, the same scenarios, and the expenditure rigidity control "
            f"moved from 1.0 to 0.0. The Explorer rescales each chart to its own data, so "
            f"the bracket rather than the eye is the comparison: the scenario fan spans "
            f"{e['rigidity']['1.0']['fan_points']} points of GDP at rigidity 1.0 and "
            f"{e['rigidity']['0.0']['fan_points']} at 0.0."
        ),
        "m4-baseline": (
            f"The Baseline tab for Uganda, the image the rest of this module refers back "
            f"to. Three things are marked: where the shaded WEO period ends, the 2099 "
            f"debt ratio of {e['debt_2099_label']}, and the distance between the primary "
            f"and overall balance, which is the interest burden on the existing stock."
        ),
        "m4-climate-index": (
            f"The Climate tab for Uganda. Every scenario tracks the baseline exactly until "
            f"2030 and only then separates. By 2099 the index reaches {i['baseline_label']} "
            f"on the baseline and {i['hot_unadapted']} under Hot unadapted, a level loss of "
            f"{i['spread_pct']} percent."
        ),
    }


def write_all_includes() -> None:
    for name, caption in captions().items():
        write_include(name, caption)


def main() -> None:
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    if which == "includes":
        write_all_includes()
        return
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport=VIEWPORT, device_scale_factor=SCALE)
        page.goto(URL)
        page.wait_for_timeout(2500)

        if which in ("all", "course"):
            print("COURSE SET")
            global UGA_BOUNDARY
            set_mode(page, "Verified")
            set_state(page, country="UGA")
            open_tab(page, "Baseline")
            sub = page.locator(".chart__subtitle").first.inner_text()
            digits = "".join(c for c in sub.split("through")[-1][:8] if c.isdigit())
            if len(digits) == 4:
                UGA_BOUNDARY = digits
            print(f"  Uganda's WEO boundary, read off the app: {UGA_BOUNDARY}")
            course_kenya(page, browser)
            for rule in ("Yes", "No"):
                print(f"  fiscal rule = {rule}")
                course_set(page, browser, rule)
            write_all_includes()

        if which in ("all", "deck"):
            print("DECK SET")
            deck_set(page)

        browser.close()
    print("done")


if __name__ == "__main__":
    main()
