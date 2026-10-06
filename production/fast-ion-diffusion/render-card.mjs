// Homepage card rendered from the live WebGL model (mid-event, lithium cages, paper colours).
// Needs a local server on :4173 serving site/. Writes site/assets/fast-ion-diffusion/collection.webp.
// Run from the repo root: node production/fast-ion-diffusion/render-card.mjs
import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
import {execFileSync} from 'node:child_process';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await browser.newPage({viewport:{width:1200,height:900},deviceScaleFactor:2});
await p.goto('http://localhost:4173/fast-ion-diffusion.html?reduced&no-opening&progress=0.42');
await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
await p.addStyleTag({content:'#stage{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:999;border-radius:0!important;margin:0!important}.stage-bar,#scene-labels,#scene-key{display:none!important}body{overflow:hidden}'});
await p.evaluate(()=>{dispatchEvent(new Event('resize'));const s=figScene;s.pose.halfHeight=4.6;s.dirty=true;s.wake();});
await p.waitForTimeout(5000);
await p.screenshot({path:'card-2x.png'});
await browser.close();
execFileSync('python3',['-c',"from PIL import Image;Image.open('card-2x.png').convert('RGB').resize((1200,900),Image.LANCZOS).save('site/assets/fast-ion-diffusion/collection.webp','WEBP',quality=90,method=6)"]);
execFileSync('rm',['card-2x.png']);
