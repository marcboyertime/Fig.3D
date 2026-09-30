import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const hop=await import('./hop-model.mjs');
function testHero(reduce){
 const nodes=new Map();
 function node(id){if(!nodes.has(id))nodes.set(id,{textContent:'',value:'0',hidden:false,events:{},attrs:{},style:{},addEventListener(name,fn){this.events[name]=fn},setAttribute(n,v){this.attrs[n]=v},getContext(){return {}}});return nodes.get(id)}
 node('#hero-notes-dialog').querySelector=()=>node('close');node('#hero-notes-dialog').showModal=()=>{};node('#hero-notes-dialog').close=()=>{};
 const media={matches:reduce,addEventListener(_,fn){this.change=fn}};
 let scheduled=0,callback,source;
 class FakeImage{constructor(){this.complete=false;source=this;this.events={};}addEventListener(n,f){this.events[n]=f}}
 const document={hidden:false,querySelector:node,querySelectorAll(){return []},addEventListener(){}};
 const code=fs.readFileSync(new URL('./hero.js',import.meta.url),'utf8').replace(/^import.*\n/gm,'');
 vm.runInNewContext(code,{...hop,createHopRenderer:()=>({}),document,Image:FakeImage,matchMedia:()=>media,requestAnimationFrame:fn=>{scheduled++;callback=fn;return scheduled},ResizeObserver:class{observe(){}},Math,Array,Number,String});
 source.events.load();
 assert.equal(scheduled,reduce?0:1,'Autoplay on normal arrival; static arrival for reduced motion');
 assert.equal(node('#hero-play').attrs['aria-pressed'],String(!reduce));
 if(!reduce)node('#hero-play').events.click();
 node('#hero-play').events.click();
 assert.equal(node('#hero-play').attrs['aria-pressed'],'true','Explicit play opts into motion');
 media.matches=true;media.change();assert.equal(node('#hero-play').attrs['aria-pressed'],'false');
 const before=scheduled;callback(100);assert.equal(scheduled,before,'Preference-change pause stops frame scheduling');
 node('#hero-progress').value='1000';node('#hero-progress').events.input();assert.equal(node('#hero-play').textContent,'Play hop');
 node('#hero-replay').events.click();assert.equal(node('#hero-progress').value,'0');assert.equal(node('#hero-play').attrs['aria-pressed'],'false','Replay preserves reduced-motion preference');
}
testHero(true);testHero(false);
console.log('PASS: hero autoplay, reduced-motion static start, explicit play, preference-change pause, end scrubbing and reduced-motion replay.');
