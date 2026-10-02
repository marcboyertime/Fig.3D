// End-to-end checks of persistence, quizzes, search, navigation, export/import.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const fs = require('fs'); const os = require('os');
const file = 'file://' + path.resolve(__dirname, '../working-catalyst-guide.html');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(file + '#l-twobytwo'); await p.waitForTimeout(200);
  // quiz
  await p.click('.check[data-q="q-dod"] .check-opts button[data-i="2"]');
  ok(await p.isVisible('.check[data-q="q-dod"] .check-opts button.right'), 'quiz marks the correct answer');
  await p.fill('.check[data-q="q-dod-num"] input', '-6'); await p.click('.check[data-q="q-dod-num"] [data-num-submit]');
  ok((await p.textContent('.check[data-q="q-dod-num"] .check-fb')).includes('Correct'), 'numeric quiz accepts −6');
  // 2x2 widget arithmetic
  await p.click('[data-widget="twobytwo"] [data-preset="reversal"]');
  ok((await p.textContent('[data-widget="twobytwo"] .stat.hi b')).includes('12'), '2×2 reversal preset gives |Δ| = 12');
  // lesson note + done + capture
  await p.fill('#note-twobytwo', 'my interaction note'); await p.check('#done-twobytwo');
  await p.fill('#cap-twobytwo', 'Ask about scale choice'); await p.click('[data-capture="adviser"]');
  await p.waitForTimeout(500);
  await p.reload(); await p.waitForTimeout(250);
  ok((await p.inputValue('#note-twobytwo')) === 'my interaction note', 'lesson note persists across reload');
  ok(await p.isChecked('#done-twobytwo'), 'lesson completion persists');
  const st = await p.evaluate(() => WC.state);
  ok(st.lists.adviser.length === 1 && st.lists.adviser[0].ctx.includes('2×2'), 'captured adviser question with context');
  ok(st.quiz['q-dod'] && st.quiz['q-dod'].last === true, 'quiz result recorded');
  // sentence -> lesson -> back
  await p.evaluate(() => { location.hash = '#s-P03S04'; }); await p.waitForTimeout(200);
  ok((await p.textContent('.annot-orig')).startsWith('Structural checks'), 'sentence annotation shows exact text');
  await p.fill('#sn-P03S04', 'sentence note'); await p.waitForTimeout(450);
  await p.keyboard.press('Escape'); await p.click('#view'); await p.keyboard.press('j'); await p.waitForTimeout(150);
  ok((await p.evaluate(() => location.hash)) === '#s-P03S05', 'j moves to next sentence');
  await p.click('.annot a.chip-go'); await p.waitForTimeout(200);
  ok(await p.isVisible('.return-chip'), 'return chip shown after jumping to a lesson');
  await p.click('.return-chip a'); await p.waitForTimeout(200);
  ok((await p.evaluate(() => location.hash)) === '#s-P03S05', 'return chip goes back to the sentence');
  // search
  await p.keyboard.press('/'); await p.fill('#s-input', 'pseudoreplication'); await p.waitForTimeout(100);
  const hits = await p.$$eval('.s-hit', (x) => x.length); ok(hits > 2, `search finds results (${hits})`);
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok((await p.evaluate(() => location.hash)).startsWith('#'), 'search navigates on Enter');
  // glossary popover
  await p.evaluate(() => { location.hash = '#l-twobytwo'; }); await p.waitForTimeout(200);
  // depth toggle
  await p.click('.depth-toggle button[data-depth="rigorous"]');
  ok(await p.evaluate(() => document.documentElement.dataset.depth === 'rigorous'), 'depth toggle switches to rigorous');
  ok(await p.isVisible('.rig-block'), 'rigorous blocks visible');
  // export markdown
  await p.evaluate(() => { location.hash = '#notebook'; }); await p.waitForTimeout(150);
  await p.click('[data-nb="data"]');
  await p.click('#nb-md'); await p.waitForTimeout(100);
  const md = await p.inputValue('#ex-area');
  ok(md.includes('Ask about scale choice') && md.includes('my interaction note') && md.includes('sentence note'), 'Markdown export contains lists and notes');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#ex-dl')]);
  ok(dl.suggestedFilename().endsWith('.md'), 'Markdown download offered');
  await p.click('[data-close]');
  await p.click('#nb-json'); const js = await p.inputValue('#ex-area'); await p.click('[data-close]');
  const tmp = path.join(os.tmpdir(), 'wc-backup.json'); fs.writeFileSync(tmp, js);
  // reset then import
  await p.click('#nb-reset'); await p.click('#nb-reset-yes'); await p.waitForTimeout(100);
  ok((await p.evaluate(() => WC.state.lists.adviser.length)) === 0, 'reset clears lists');
  await p.click('[data-nb="data"]');
  await p.setInputFiles('#nb-file', tmp); await p.waitForTimeout(200);
  await p.click('#im-replace'); await p.waitForTimeout(200);
  ok((await p.evaluate(() => WC.state.lists.adviser.length)) === 1 && (await p.evaluate(() => WC.state.notes.lesson.twobytwo)) === 'my interaction note', 'JSON import restores state');
  // defense
  await p.evaluate(() => { WC.pendingOral = 'o-theta'; location.hash = '#defense'; }); await p.waitForTimeout(150);
  await p.fill('#def-ans', 'At each heating dwell compare CO minus N2 output; subtract the gas effect at the reference dwell, so a constant benefit cancels.');
  await p.click('#def-reveal');
  ok(await p.isVisible('.concept-hit.hit'), 'defense reveal detects named key ideas');
  await p.click('[data-rate="ok"]');
  ok(!!(await p.evaluate(() => Object.values(WC.state.oral).find((o) => o.rating === 'ok'))), 'defense rating saved');
  // progress
  await p.evaluate(() => { location.hash = '#progress'; }); await p.waitForTimeout(150);
  await p.click('[data-self="c-theta:3"]');
  ok((await p.evaluate(() => WC.conceptStatus('c-theta').status)) === 'm', 'self-rating marks concept mastered');
  // theme
  await p.keyboard.press('t'); ok(await p.evaluate(() => document.documentElement.getAttribute('data-theme') === 'light'), 'theme cycles');
  ok(errs.length === 0, 'no page errors ' + errs.join('; '));
  await b.close();
})();
