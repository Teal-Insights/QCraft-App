# Lane 2, Run 3: Intuition widgets (TEA-1400)

Context: the Sept 1 Uganda MoF training teaches the model's intuitions interactively. Build three small, single-idea teaching widgets in apps/qcraft-web, separate from the main Explorer tabs: standalone routes (/widgets/debt-dynamics, /widgets/growth, /widgets/climate-channel) that work full-screen for live teaching and can be iframed into Quarto course pages later. Read SHARED/REFERENCE-NOTES.md and your MORNING-REPORT.md first to reload context. Same hard rules as PROMPT.md: this clone only, no push, local commits, no em-dashes in copy, brand theme.

Binding pedagogy principles (from Teal's Pedagogy and Explainer toolkits):
- One idea per widget. Nothing else on the screen.
- The slider and the responding chart share ONE visual field; no scrolling between cause and effect.
- A one-line DYNAMIC caption narrates what just changed in plain language ("r exceeds g by 2 points: the ratio rises even with the budget balanced").
- The DEFAULT state carries the full message: most users never touch widgets, so the widget must teach before anyone drags anything. Uganda is the default case everywhere.
- A lightweight predict-first affordance (a small "what do you expect?" prompt that reveals after the first interaction) where it fits naturally; never a quiz wall.

Widget 1, "The debt equation sandbox": sliders for r, g, pb, and initial debt; the debt path redraws instantly; preset buttons (r = g; favorable g > r; Uganda-like). Teaches the snowball term.
Widget 2, "Where growth comes from": demography variant selector, productivity start and long-run sliders (draw the logistic transition), inflation start and end; a stacked contribution chart building nominal growth. Teaches the growth-accounting skeleton.
Widget 3, "How warming reaches the debt line": six-scenario picker; show the growth hit first, then the debt fan against baseline; a rigidity slider that visibly switches the primary-balance channel on. Teaches that climate has no separate term in the equation; it flows through g and pb.

Engine: use the real TS engine through the adapter where available. For widgets 1 and 2 a simplified faithful mini-model is acceptable if clearly labeled in code comments and directionally consistent with the engine; widget 3 must use real scenario data.

DoD: three routes render and build (`npm run build` green); each has its dynamic caption and a sensible teaching default; MORNING-REPORT.md updated with the routes and a two-line pedagogy note per widget.

Stack, explicit (Teal): React 18 + D3 for the widgets. Charts are hand-built D3 (scales, axes, transitions), not a chart wrapper library, matching the debt-projection-tool-v2 conventions and the rest of apps/qcraft-web. Smooth transitions on slider input matter: the animation IS the pedagogy.
