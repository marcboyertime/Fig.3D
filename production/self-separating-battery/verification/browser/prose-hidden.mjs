import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await browser.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://localhost:4173/self-separating-battery.html?reduced');await p.waitForSelector('#network[data-rendered=true]');
await p.addStyleTag({content:'#inspection,.intro .lede{visibility:hidden!important}'});
const shot=async n=>{await p.waitForTimeout(1500);await p.locator('#scene-stage').screenshot({path:`np-${n}.png`});};
await shot('1-overview');await p.click('#tab-interface');await shot('2-interface');
await p.click('#depth-toggle');await shot('3-conn');await p.click('#depth-length');await shot('4-length');
await p.click('#depth-formation');for(const i of [1,3,4,5]){await p.evaluate(i=>document.querySelector(`[data-formation="${i}"]`).click(),i);await p.waitForTimeout(1500);await shot('5-form'+i);}
await p.click('#depth-evidence');await shot('6-volt');
await browser.close();
