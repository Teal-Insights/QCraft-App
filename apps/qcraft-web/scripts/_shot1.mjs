import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(process.env.QCRAFT_PREVIEW_URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.locator('.register__control').getByRole('radio', { name: 'Briefing', exact: true }).click();
await p.waitForTimeout(500);
await p.screenshot({ path: process.argv[2] });
await b.close();
