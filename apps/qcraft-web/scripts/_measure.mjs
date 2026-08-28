import { chromium } from 'playwright';
const b = await chromium.launch();
for (const vp of [{w:1440,h:900},{w:1280,h:800}]) {
  const p = await b.newPage({ viewport: { width: vp.w, height: vp.h } });
  await p.goto(process.env.QCRAFT_PREVIEW_URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const r = await p.evaluate((h) => {
    const plot = document.querySelector('.chart__plot').getBoundingClientRect();
    const chart = document.querySelector('.chart').getBoundingClientRect();
    return {
      chartTop: Math.round(chart.top),
      plotTop: Math.round(plot.top),
      plotH: Math.round(plot.height),
      visible: Math.round(Math.max(0, Math.min(h, plot.bottom) - plot.top)),
      pct: Math.round((Math.max(0, Math.min(h, plot.bottom) - plot.top) / plot.height) * 100),
    };
  }, vp.h);
  console.log(`${vp.w}x${vp.h}: chart top ${r.chartTop}, plot ${r.plotTop}..${r.plotTop+r.plotH}, ${r.visible}/${r.plotH}px visible = ${r.pct}%`);
  await p.close();
}
await b.close();
