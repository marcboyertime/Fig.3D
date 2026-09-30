import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {batteryState,reverseProgress} from './battery-model.mjs';
const source=fs.readFileSync(new URL('./battery.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'');
function run(reducedInitially){
  const nodes=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',value:'0',hidden:false,dataset:{},events:{},attrs:{},classList:{toggle(){},add(){},remove(){}},addEventListener(n,f){this.events[n]=f;},setAttribute(n,v){this.attrs[n]=v;},toggleAttribute(n,v){if(v)this.attrs[n]='';else delete this.attrs[n];}});return nodes.get(id);};
  const modeButtons=['discharge','charge'].map(mode=>{const n=node(`mode-${mode}`);n.dataset.mode=mode;return n;});
  const media={matches:reducedInitially,addEventListener(_,fn){this.change=fn;}};
  const document={hidden:false,events:{},getElementById:node,querySelector:node,querySelectorAll:q=>q==='[data-mode]'?modeButtons:[],addEventListener(n,f){this.events[n]=f;}};
  let callback,instance;
  class FakeScene{constructor(){instance=this;this.flows=[];}select(){}setState(s){this.state=s;}setFlow(phase){this.flows.push(phase);}setView(inside,reduced){this.inside=inside;this.reduced=reduced;}resetCamera(){this.reset=true;}render(){}}
  vm.runInNewContext(source,{batteryState,reverseProgress,BatteryScene:FakeScene,document,matchMedia:()=>media,requestAnimationFrame:fn=>{callback=fn;return 1;},console,Math,Number,String});
  assert.equal(node('motion-toggle').attrs['aria-pressed'],String(!reducedInitially));
  const start=instance.state;callback(0);callback(100);assert.deepEqual(instance.state,start,'Direction animation must not alter composition');
  assert.equal(instance.flows.length>0,!reducedInitially,'Reduced-motion initial view must remain static');
  if(!reducedInitially)node('motion-toggle').events.click();
  node('motion-toggle').events.click();callback(200);callback(300);assert.ok(instance.flows.length>0,'Explicit Resume motion starts direction markers');
  const beforeModePhase=instance.flows.at(-1);modeButtons[1].events.click();assert.equal(node('progress').value,'450');assert.equal(instance.state.negative,start.negative);assert.equal(instance.state.positive,start.positive);
  callback(400);assert.ok(instance.flows.at(-1)<beforeModePhase,'Charging reverses marker velocity');
  assert.equal(node('negative-role').textContent,'Cathode · reduction');assert.equal(node('positive-role').textContent,'Anode · oxidation');assert.equal(node('mode-label').textContent,'CHARGING');
  node('progress').events.input({target:{value:'537'}});assert.equal(node('negative-readout').textContent,'0.537');assert.equal(node('positive-readout').textContent,'0.663');
  const selected=instance.state;for(let t=500;t<15000;t+=100)callback(t);assert.deepEqual(instance.state,selected,'Continuous explanation must not silently loop or advance the finite reaction');
  media.matches=true;media.change();assert.equal(node('motion-toggle').attrs['aria-pressed'],'false');
  const count=instance.flows.length;callback(16000);callback(18000);assert.equal(instance.flows.length,count,'Preference change pauses motion');
  node('dive').events.click();assert.equal(instance.inside,true);assert.equal(instance.reduced,true);assert.equal(node('dive').textContent,'Return to the cell');
  node('dive').events.click();assert.equal(instance.inside,false);
  node('motion-toggle').events.click();document.hidden=true;document.events.visibilitychange();const hiddenCount=instance.flows.length;callback(19000);assert.equal(instance.flows.length,hiddenCount,'Hidden tabs do not animate');document.hidden=false;document.events.visibilitychange();callback(20000);assert.ok(instance.flows.length>hiddenCount,'Returning to a visible tab preserves the user’s motion choice');
}
run(true);run(false);
console.log('PASS: fixed-composition continuous motion, no finite-state autoplay/loop, charge reverses marker velocity, slider couples inventories, preserved composition and reversed roles on mode change, graphite entry/return, reduced-motion static arrival, explicit Resume, preference-change and hidden-tab pause. Real controller with stub 3D renderer; WebGL visual QA is separate.');
