// Smoke test: loads the built guide in Chromium, visits every route, reports console errors.
// Usage: node grfp/test/smoke.cjs [width] [shotDir]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const file = path.resolve(__dirname, '../working-catalyst-guide.html');
  const width = +(process.argv[2] || 1440);
  const shots = process.argv[3];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width, height: 900 } });
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`${m.type()}: ${m.text()}`); });
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + file);
  await p.waitForTimeout(300);
  const lessons = await p.evaluate(() => WC.lessons.map((l) => l.id));
  const routes = ['home', ...lessons.map((l) => 'l-' + l), 'sentences', 's-P03S04', 'sources', 'src-2', 'glossary', 'notebook', 'review', 'progress', 'defense', 'proposal', 'notes', 'legend'];
  const report = [];
  for (const r of routes) {
    await p.evaluate((h) => { location.hash = h; }, '#' + r);
    await p.waitForTimeout(120);
    const info = await p.evaluate(() => ({
      h1: (document.querySelector('#view h1') || {}).textContent || '(no h1)',
      failed: [...document.querySelectorAll('.readout.warn')].filter((x) => /failed to load/i.test(x.textContent)).length + [...document.querySelectorAll('[data-widget] p.muted')].filter((x) => /is missing|Loading interactive/.test(x.textContent)).length,
      missingQ: [...document.querySelectorAll('.check')].filter((x) => /Missing question/.test(x.textContent)).length,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    report.push(`${r.padEnd(18)} ${info.failed ? 'WIDGET-FAIL ' : ''}${info.missingQ ? 'MISSING-Q ' : ''}${info.overflow ? 'H-OVERFLOW ' : ''}${info.h1.replace(/\s+/g, ' ').slice(0, 60)}`);
    if (shots) await p.screenshot({ path: path.join(shots, `${width}-${r}.png`), fullPage: false });
  }
  console.log(report.join('\n'));
  console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'no console errors');
  await b.close();
})();
