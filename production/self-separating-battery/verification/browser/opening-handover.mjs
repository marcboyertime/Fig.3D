import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const at of [3000,12000,17000]){
const p=await browser.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>console.log('err',e.message));
await p.goto('http://localhost:4173/self-separating-battery.html');await p.waitForFunction(()=>window.figState);await p.waitForTimeout(at);
const b=await p.locator('#network').boundingBox();const x=b.x+b.width/2,y=b.y+b.height/2;
const info=await p.evaluate(([x,y])=>({top:document.elementFromPoint(x,y)?.id||document.elementFromPoint(x,y)?.className,d:window.figState.display,o:window.figState.opening,scroll:scrollY}),[x,y]);
await p.mouse.move(x,y);await p.mouse.down();for(let i=1;i<=8;i++)await p.mouse.move(x+15*i,y);await p.mouse.up();await p.waitForTimeout(300);
console.log(at,JSON.stringify(info),'after',await p.evaluate(()=>JSON.stringify({o:window.figState.opening,d:window.figState.display})));await p.close();}
await browser.close();
