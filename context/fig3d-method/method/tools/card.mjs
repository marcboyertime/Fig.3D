import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await browser.newPage({viewport:{width:1200,height:900},deviceScaleFactor:2});
await p.goto('http://localhost:4173/self-separating-battery.html?reduced');await p.waitForSelector('#network[data-rendered=true]');
await p.addStyleTag({content:'#scene-stage{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:999;border-radius:0!important;margin:0!important}.stage-bar,#scene-labels,#scene-key,#leader{display:none!important}body{overflow:hidden}'});
await p.waitForTimeout(2500);
await p.screenshot({path:'card-2x.png'});
await browser.close();
