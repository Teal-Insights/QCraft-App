// Console check: open each URL in headless Chrome over the DevTools Protocol and
// report every console call, uncaught exception and browser log entry. Chrome's
// --enable-logging=stderr route does not carry page console output under
// --headless=new on macOS, so grepping stderr for CONSOLE proves nothing.
//   node scripts/console-check.mjs "http://localhost:4178/?country=KEN" ...
// Exits 1 if any URL produced an error-level message or an exception.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const SETTLE_MS = 4000;
const urls = process.argv.slice(2);
if (!urls.length) { console.error('usage: node scripts/console-check.mjs <url> [url ...]'); process.exit(2); }

const profile = mkdtempSync(join(tmpdir(), 'qcraft-console-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,900',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForChrome() {
  for (let i = 0; i < 50; i += 1) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return; } catch {}
    await sleep(200);
  }
  throw new Error('Chrome did not open its debugging port');
}

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
    else if (msg.method) listeners.forEach((fn) => fn(msg));
  });
  return {
    send: (method, params = {}) => new Promise((resolve) => { id += 1; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); }),
    on: (fn) => listeners.push(fn),
  };
}

function describe(msg) {
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ');
    return { level: msg.params.type, text };
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    return { level: 'exception', text: d.exception?.description ?? d.text };
  }
  if (msg.method === 'Log.entryAdded') {
    const e = msg.params.entry;
    return { level: e.level, text: `${e.source}: ${e.text}${e.url ? ` (${e.url})` : ''}` };
  }
  return null;
}

let failures = 0;
try {
  await waitForChrome();
  for (const url of urls) {
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
    const c = cdp(ws);
    const entries = [];
    let loaded = false;
    c.on((msg) => { if (msg.method === 'Page.loadEventFired') loaded = true; const d = describe(msg); if (d) entries.push(d); });
    await c.send('Runtime.enable');
    await c.send('Log.enable');
    await c.send('Page.enable');
    await c.send('Page.navigate', { url });
    for (let i = 0; i < 100 && !loaded; i += 1) await sleep(100);
    await sleep(SETTLE_MS);
    const bad = entries.filter((e) => ['error', 'exception', 'assert'].includes(e.level));
    failures += bad.length;
    console.log(`${bad.length ? 'FAIL' : 'ok  '} ${url}  (${entries.length} console/log entries, ${bad.length} errors${loaded ? '' : ', load event not seen'})`);
    for (const e of entries) console.log(`      [${e.level}] ${e.text}`);
    ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);
  }
} finally {
  const exited = new Promise((resolve) => chrome.once('exit', resolve));
  chrome.kill();
  await Promise.race([exited, sleep(5000)]);
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* temp profile; leave it */ }
}
console.log(failures ? `${failures} CONSOLE ERRORS` : 'NO CONSOLE ERRORS');
process.exit(failures ? 1 : 0);
