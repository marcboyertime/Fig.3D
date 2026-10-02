// Runs axe-core on every route in light and dark at one width.
// Usage: node grfp/test/axe.cjs <path-to-axe.min.js> [width]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const axe = fs.readFileSync(process.argv[2], 'utf8');
  const width = +(process.argv[3] || 1440);
  const b = await chromium.launch();
  const totals = {};
  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width, height: 900 }, colorScheme: scheme });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const p = await ctx.newPage();
    await p.goto('file://' + path.resolve(__dirname, '../working-catalyst-guide.html'));
    await p.addScriptTag({ content: axe });
    const lessons = await p.evaluate(() => WC.lessons.map((l) => 'l-' + l.id));
    for (const r of ['home', ...lessons, 's-P01S01', 'sources', 'glossary', 'notebook', 'review', 'progress', 'defense', 'proposal', 'notes']) {
      await p.evaluate((h) => { location.hash = h; }, '#' + r);
      await p.waitForTimeout(80);
      const res = await p.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'] })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0, 2).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n')[1]) })));
      res.forEach((v) => { const k = `${scheme} ${v.id} (${v.impact})`; (totals[k] = totals[k] || []).push(`${r}×${v.n}: ${v.ex.join(' | ')}`); });
    }
    await ctx.close();
  }
  const keys = Object.keys(totals);
  if (!keys.length) console.log('axe: no violations');
  keys.forEach((k) => console.log(k + '\n   ' + totals[k].slice(0, 4).join('\n   ')));
  await b.close();
})();
