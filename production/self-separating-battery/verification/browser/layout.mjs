// Layout audit: label collisions, labels outside the stage, horizontal overflow, per state and viewport.
import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
const sizes=(process.argv[2]||'390x844,768x1024,1440x1000,1920x1080').split(',').map(s=>s.split('x').map(Number));
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let problems=0;
for(const [w,h,scale=1] of sizes){
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
 page.on('pageerror',e=>{problems++;console.log(w,'pageerror',e.message)});
 await page.goto('http://localhost:4173/self-separating-battery.html?reduced');
 await page.waitForSelector('#network[data-rendered=true]',{timeout:30000});
 const audit=async name=>{
  await page.waitForTimeout(1300);
  const r=await page.evaluate(()=>{
   const stage=document.getElementById('scene-stage').getBoundingClientRect();
   const labels=[...document.querySelectorAll('#scene-labels .label')].filter(l=>l.offsetParent&&getComputedStyle(l).opacity!=='0').map(l=>({t:l.textContent,r:l.getBoundingClientRect()}));
   const out=[];
   for(const a of labels){if(a.r.left<stage.left-1||a.r.right>stage.right+1||a.r.top<stage.top-1||a.r.bottom>stage.bottom+1)out.push('outside: '+a.t);}
   for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i].r,b=labels[j].r;if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom)out.push(`overlap: "${labels[i].t}" × "${labels[j].t}"`);}
   const wall=document.getElementById('formation-wall');
   if(wall&&!wall.hidden){const wr=wall.getBoundingClientRect();for(const a of labels){const b=a.r;if(b.left<wr.right&&wr.left<b.right&&b.top<wr.bottom&&wr.top<b.bottom)out.push('under wall: '+a.t);}}
   if(document.documentElement.scrollWidth>innerWidth+1)out.push('page overflows horizontally by '+(document.documentElement.scrollWidth-innerWidth));
   for(const e of document.querySelectorAll('#explorer *')){if(!e.offsetParent)continue;const b=e.getBoundingClientRect();if(b.width&&b.right>innerWidth+1&&getComputedStyle(e).position!=='absolute'){out.push('element past viewport: '+(e.id||e.className||e.tagName)+' '+Math.round(b.right));break;}}
   return out;});
  for(const p of r){problems++;console.log(`${w}x${h} ${name}: ${p}`);}
 };
 await audit('overview');
 await page.click('[data-architecture=layered]');await audit('layered');
 await page.click('[data-architecture=network]');await page.click('[data-route=cathode]');await audit('route');
 await page.click('#tab-fabrication');for(const s of ['hybrid','carbon','cathode','sei']){await page.click(`[data-stage=${s}]`);await audit('fab-'+s);}
 await page.click('#tab-interface');await audit('interface');
 await page.click('#depth-toggle');await audit('connections');
 for(const v of [0,20,40]){await page.evaluate(v=>{const s=document.getElementById('depth-slice');if(s){s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));}},v);await audit('connections-'+v);}
 await page.click('#depth-length');await audit('length');
 await page.click('#depth-formation');for(let i=0;i<6;i++){await page.click(`[data-formation="${i}"]`);await page.waitForTimeout(1200);await audit('formation-'+i);}
 await page.click('#depth-evidence');await audit('voltage');await page.click('[data-evidence=capacity]');await audit('capacity');
 for(const d of ['1','2','5','6']){const b=page.locator(`[data-display="${d}"]`);if(await b.isVisible())await b.click(),await audit('figure-'+d);}
 await page.close();
}
console.log(problems?`${problems} problems`:'no layout problems');
await browser.close();
