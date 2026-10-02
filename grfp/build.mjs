// Builds the single self-contained HTML file from src/.
//   node grfp/build.mjs            → grfp/working-catalyst-guide.html (standalone, with doctype)
//   node grfp/build.mjs --artifact → also writes grfp/dist/artifact.html (no html/head/body
//                                    wrapper, for hosts that add their own skeleton)
// No dependencies. Google Fonts are linked with full system fallbacks, so the guide
// still renders offline with local serif and sans faces.
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const r = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const b64 = (p) => fs.readFileSync(path.join(root, p)).toString('base64');

const scripts = [
  'src/core.js',
  'src/data/proposal-base.js',
  'src/data/sentences.js',
  'src/data/refs.js',
  'src/data/glossary.js',
  'src/data/defense.js',
  'src/widgets/common.js',
  'src/widgets/part1.js',
  'src/widgets/part2.js',
  'src/widgets/part3.js',
  'src/widgets/part4.js',
  'src/lessons/part1.js',
  'src/lessons/part2.js',
  'src/lessons/part3.js',
  'src/lessons/part4.js',
  'src/views.js',
  'src/app.js',
].filter((p) => fs.existsSync(path.join(root, p)));

const assets = `window.WC = window.WC || {};
WC.assets = {
  page1: 'data:image/png;base64,${b64('assets/proposal-page-1.png')}',
  page2: 'data:image/png;base64,${b64('assets/proposal-page-2.png')}',
  pdf: '${b64('assets/GRFP_Autonomous_Catalyst_CoDesign_Refined.pdf')}'
};`;

// Guard against a literal </script> inside any source file breaking the page.
const safe = (s) => s.replace(/<\/script/gi, '<\\/script');
const js = [assets, ...scripts.map((p) => `/* ==== ${p} ==== */\n${r(p)}`)].map(safe).join('\n');
const css = r('src/styles.css');

const title = 'The Working Catalyst';
const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="description" content="An offline interactive study guide to the NSF GRFP proposal “Learning to Make the Working Catalyst: Autonomous Synthesis–Activation Co-Design”.">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap">
<style>
${css}
</style>`;
const noscript = `<noscript><div style="padding:2rem;max-width:60ch;font-family:system-ui"><h1>JavaScript is needed</h1><p>This study guide runs entirely in your browser and makes no network requests for its content. Enable JavaScript to use the lessons, the sentence explorer and your notebook.</p></div></noscript>`;

const standalone = `<!doctype html>
<html lang="en">
<head>
${head}
</head>
<body>
${noscript}
<script>
${js}
</script>
</body>
</html>
`;
const outFile = path.join(root, 'working-catalyst-guide.html');
fs.writeFileSync(outFile, standalone);
console.log(`wrote ${path.relative(process.cwd(), outFile)} (${(standalone.length / 1024).toFixed(0)} KB, ${scripts.length} source files)`);

if (process.argv.includes('--artifact')) {
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  const art = `<title>${title}</title>
${head.replace(/<meta charset[^>]*>\n|<meta name="viewport"[^>]*>\n|<title>[^<]*<\/title>\n/g, '')}
${noscript}
<script>
${js}
</script>
`;
  fs.writeFileSync(path.join(root, 'dist/artifact.html'), art);
  console.log(`wrote grfp/dist/artifact.html (${(art.length / 1024).toFixed(0)} KB)`);
}
