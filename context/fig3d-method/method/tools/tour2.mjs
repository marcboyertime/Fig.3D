import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [,,w,h,prefix,query='?reduced']=process.argv;
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:+w,height:+h}});
page.on('pageerror',e=>console.log('pageerror',e.message));
page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('console',m.text())});
await page.goto('http://localhost:4173/self-separating-battery.html'+query);
await page.waitForSelector('#network[data-rendered=true]',{timeout:30000});
const shot=async n=>{await page.waitForTimeout(1500);await page.locator('#explorer').screenshot({path:`${prefix}-${n}.png`});};
await shot('a-overview');
await page.click('[data-architecture=layered]');await shot('b-layered');
await page.click('[data-architecture=network]');await page.click('[data-route=cathode]');await shot('c-route');
await page.click('#tab-fabrication');for(const s of ['hybrid','carbon','cathode','sei']){await page.click(`[data-stage=${s}]`);await shot('d-fab-'+s);}
await page.click('#tab-interface');await shot('e-interface');
await page.click('#depth-toggle');await shot('f-conn');
await page.click('#depth-length');await shot('g-length');
await page.click('#depth-formation');for(let i=0;i<6;i++){await page.click(`[data-formation="${i}"]`);await page.waitForTimeout(2500);await shot('h-form-'+i);}
await page.click('#depth-evidence');await shot('i-volt');await page.click('[data-evidence=capacity]');await shot('i-cap');
await browser.close();
