// node grfp/test/shot.cjs <hash> <out.png> [width] [full] [theme] [depth] [clickSelector]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const [hash, out, w = 1440, full = '0', theme = 'light', depth = 'intuitive', click] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: 900 }, colorScheme: theme === 'dark' ? 'dark' : 'light' });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../working-catalyst-guide.html') + '#' + hash);
  await p.evaluate((d) => { WC.setDepth(d); }, depth);
  await p.waitForTimeout(250);
  if (click) { for (const c of click.split('||')) { await p.click(c); await p.waitForTimeout(150); } }
  await p.screenshot({ path: out, fullPage: full === '1' });
  if (errs.length) console.log(errs.join('\n'));
  await b.close();
})();
