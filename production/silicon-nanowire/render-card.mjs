// Homepage card rendered from the live WebGL model (paper palette, lid lifted like Fig. 5b).
// Needs a local server on :4173 serving site/. Writes site/assets/silicon-nanowire/collection.webp via card-2x.png.
import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await browser.newPage({viewport:{width:1200,height:900},deviceScaleFactor:2});
await p.goto('http://localhost:4173/silicon-nanowire.html?reduced&card');await p.waitForSelector('#wire[data-rendered=true]');
await p.addStyleTag({content:'#stage{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:999;border-radius:0!important;margin:0!important}.stage-bar,#scene-labels,#scene-key,#section{display:none!important}body{overflow:hidden}'});
await p.waitForTimeout(6000);
await p.screenshot({path:'card-2x.png'});
await browser.close();
