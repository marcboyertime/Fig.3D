// Formation: two linked views of one processing state.
// The bench follows the Figure 5 and 6 insets (vial, liquid, external Li chip, the device's
// carbon and polymer leads, an instrument with + and − terminals). The magnified wall
// follows the Figure 2 inset (carbon | interphase | PAQEDOT | pore). Both read one row of
// formationSteps, so a circuit, a caption and a wall cannot disagree.
import {formationSteps} from './self-separating-battery-depth.mjs?v=5';
import {phaseMaterial} from './self-separating-battery-scene.mjs?v=5';
import {clamp,easeInOut} from './self-separating-battery-model.mjs?v=5';
const T=window.THREE,linear=hex=>new T.Color(hex).convertSRGBToLinear();
const DEVICE=1,LIQUID_TOP=-.62,FLOOR=-2.05;
export const BENCH={
 deviceX:-.42,immersedY:-1.36,raisedY:.42,chipX:.78,
 lead:{carbon:[-.86,2.32,0],polymer:[-.3,2.32,0],li:[.78,2.32,0]},
 terminal:{plus:[-.62,3.02,.36],minus:[.62,3.02,.36]}
};
export class FormationBench{
 constructor(host){
  this.host=host;this.group=new T.Group();this.wires=new T.Group();this.group.add(this.wires);this.state=null;this.motion=null;
  const glass=new T.MeshPhysicalMaterial({color:linear(0xc8d6ee),transparent:true,opacity:.07,roughness:.08,metalness:0,depthWrite:false,side:T.DoubleSide});
  const vial=new T.Mesh(new T.CylinderGeometry(1.32,1.32,3.7,72,1,true),glass);vial.position.y=-.2;
  const base=new T.Mesh(new T.CircleGeometry(1.32,72),glass);base.rotation.x=-Math.PI/2;base.position.y=FLOOR;
  const rim=(y,r=1.32)=>{const m=new T.Mesh(new T.TorusGeometry(r,.012,6,96),new T.MeshBasicMaterial({color:0x7e90b0,transparent:true,opacity:.75}));m.rotation.x=Math.PI/2;m.position.y=y;return m;};
  this.liquid=new T.Mesh(new T.CylinderGeometry(1.29,1.29,LIQUID_TOP-FLOOR,72),new T.MeshStandardMaterial({color:linear(0x5f9fe0),transparent:true,opacity:.36,roughness:.15,metalness:0,depthWrite:false,emissive:linear(0x0c2440),emissiveIntensity:.6}));
  this.liquid.position.y=(LIQUID_TOP+FLOOR)/2;
  this.surface=rim(LIQUID_TOP,1.29);this.surface.material=new T.MeshBasicMaterial({color:0xa9cdf2,transparent:true,opacity:.85});
  this.cap=new T.Mesh(new T.CylinderGeometry(1.4,1.4,.36,72),new T.MeshStandardMaterial({color:linear(0x2c3a36),roughness:.55,metalness:.1}));this.cap.position.y=1.83;
  this.vial=new T.Group();this.vial.add(vial,base,rim(FLOOR),rim(1.65),this.liquid,this.surface,this.cap);this.group.add(this.vial);
  // The device: the same generated network, scaled down, with the outer PEDOT contact film on top.
  this.device=new T.Group();const s=DEVICE/6;
  for(const [name,phase] of [['carbon','carbon'],['sei','sei'],['cathode','cathode']]){const m=new T.Mesh(host.meshes[name].geometry,phaseMaterial(phase));m.scale.setScalar(s);m.castShadow=true;this.device.add(m);this[name+'Mini']=m;}
  this.pedot=new T.Mesh(new T.BoxGeometry(DEVICE*.72,.035,DEVICE*.72),phaseMaterial('cathode',{roughness:.3}));this.pedot.position.y=DEVICE/2+.018;this.device.add(this.pedot);
  this.paste={carbon:this.blob(-DEVICE/2-.02,0,0),polymer:this.blob(.12,DEVICE/2+.05,0)};this.device.add(this.paste.carbon,this.paste.polymer);
  this.group.add(this.device);
  this.chip=new T.Mesh(new T.BoxGeometry(.52,.74,.06),new T.MeshStandardMaterial({color:linear(0xb9bec8),metalness:.85,roughness:.32}));this.chip.position.set(BENCH.chipX,-1.28,0);this.group.add(this.chip);
  this.clip=new T.Mesh(new T.BoxGeometry(.2,.16,.12),new T.MeshStandardMaterial({color:linear(0x8a9099),metalness:.8,roughness:.3}));this.clip.position.set(BENCH.chipX,-.86,0);this.group.add(this.clip);
  // Instrument with the red + and dark − terminals of the paper's insets.
  this.instrument=new T.Mesh(new T.BoxGeometry(2.3,.62,.72),new T.MeshStandardMaterial({color:linear(0x1d2431),roughness:.45,metalness:.25}));this.instrument.position.set(0,3.38,0);this.group.add(this.instrument);
  this.terminals={};for(const [k,c] of [['plus',0xd8504c],['minus',0x23262d]]){const t=new T.Mesh(new T.BoxGeometry(.3,.22,.12),new T.MeshStandardMaterial({color:linear(c),roughness:.4,metalness:.1}));t.position.set(...BENCH.terminal[k]);this.group.add(t);this.terminals[k]=t;}
  const edge=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(.3,.22,.12)),new T.LineBasicMaterial({color:0x9aa6bd}));edge.position.set(...BENCH.terminal.minus);this.group.add(edge);
 }
 blob(x,y,z){const m=new T.Mesh(new T.SphereGeometry(.07,14,10),new T.MeshStandardMaterial({color:linear(0x16181d),roughness:.8}));m.position.set(x,y,z);return m;}
 tube(points,color,radius=.022){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');const m=new T.Mesh(new T.TubeGeometry(curve,80,radius,8,false),new T.MeshStandardMaterial({color:linear(color),roughness:.35,metalness:.5}));m.userData.curve=curve;return m;}
 clear(){for(const o of [...this.wires.children]){o.geometry.dispose();o.material.dispose();this.wires.remove(o);}}
 // Lead ends in device coordinates, given the device height.
 leadEnds(y){return {carbon:[BENCH.deviceX-DEVICE/2-.02,y,0],polymer:[BENCH.deviceX+.12,y+DEVICE/2+.05,0],li:[BENCH.chipX,-.86,0]};}
 build(step,y){
  this.clear();const ends=this.leadEnds(y),leads=[];
  // Fixed leads rise from each electrode through the cap to a short stub above it.
  const route=(from,to,bend)=>[from,[from[0]+bend,Math.max(from[1]+.35,from[1]),0],[to[0],1.55,0],[to[0],2.05,0],to];
  leads.push(['carbon',this.tube(route(ends.carbon,BENCH.lead.carbon,-.18),0x9ca6b8)]);
  leads.push(['polymer',this.tube(route(ends.polymer,BENCH.lead.polymer,0),0x8fb6ea)]);
  if(step.vial)leads.push(['li',this.tube(route(ends.li,BENCH.lead.li,0),0xb9bec8)]);
  for(const [key,m] of leads){m.userData.lead=key;this.wires.add(m);const stub=new T.Mesh(new T.SphereGeometry(.045,12,8),new T.MeshStandardMaterial({color:linear(0xdfe5ef),metalness:.6,roughness:.3}));stub.position.set(...BENCH.lead[key]);stub.userData.lead=key;this.wires.add(stub);}
  // Patch cables from the instrument terminals to the leads this step actually uses.
  this.cables=[];
  for(const [terminal,lead,color] of [['plus',step.plus,0xe0625d],['minus',step.minus,0xc8d0de]]){
   if(!lead)continue;const a=[BENCH.terminal[terminal][0],BENCH.terminal[terminal][1]-.11,BENCH.terminal[terminal][2]],b=BENCH.lead[lead];
   const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2-.05,.62];const cable=this.tube([a,[a[0],a[1]-.2,.5],mid,[b[0],b[1]+.2,.2],b],color,.026);
   cable.userData={...cable.userData,terminal,lead};this.wires.add(cable);this.cables.push(cable);
  }
 }
 update(step,{reduced}){
  const changed=this.state?.key!==step.key,prev=this.state;this.state=step;
  this.vial.visible=step.vial;this.chip.visible=this.clip.visible=step.vial;
  this.seiMini.visible=step.key!=='deposited';
  this.seiMini.material.color.copy(linear(step.key==='deposited'?0x1b68a8:0x86d1aa));
  const target=step.immersed?BENCH.immersedY:BENCH.raisedY;
  if(changed){const from=this.device.position.y||target;this.motion={from,to:target,start:performance.now(),duration:reduced||!prev?0:900};this.cableStart=performance.now()+(reduced||!prev?-1e4:Math.abs(from-target)>.01?650:0);}
  this.device.position.x=BENCH.deviceX;this.tick(performance.now());
  const c=this.host.canvas.dataset;c.formation=step.key;c.plus=step.plus||'none';c.minus=step.minus||'none';c.immersed=String(step.immersed);c.vial=String(step.vial);
 }
 tick(now){
  let busy=false;
  if(this.motion){const m=this.motion,t=m.duration?clamp((now-m.start)/m.duration,0,1):1,y=m.from+(m.to-m.from)*easeInOut(t);this.device.position.y=y;if(t<1)busy=true;if(!this.builtFor||this.builtFor.key!==this.state.key||Math.abs(this.builtFor.y-y)>.004){this.build(this.state,y);this.builtFor={key:this.state.key,y};}}
  // Cables draw from the instrument towards the lead once the device has settled.
  const u=easeInOut(clamp((now-this.cableStart)/700,0,1));for(const cable of this.cables||[]){const n=cable.geometry.index.count;cable.geometry.setDrawRange(0,Math.floor(n*u/3)*3);}
  if(u<1)busy=true;
  return busy;
 }
 // Screen anchors for HTML labels (world positions in the bench group).
 anchors(){
  const y=this.device.position.y,s=this.state,list=[];if(!s)return list;
  const used=new Set([s.plus,s.minus]);
  list.push({id:'device',text:s.immersed||!s.vial?'Device':'Device · raised',at:[-1.48,y,0],kind:'quiet',align:'end'});
  list.push({id:'carbon',text:'Carbon lead',at:[BENCH.lead.carbon[0]-.05,2.62,0],kind:used.has('carbon')?'on':'off',align:'end'});
  list.push({id:'polymer',text:'Polymer lead',at:[BENCH.lead.polymer[0]+.08,1.12,0],kind:used.has('polymer')?'on':'off',align:'start'});
  if(s.vial){list.push({id:'li',text:used.has('li')?'External Li':'External Li · loose',at:[BENCH.chipX+.38,-1.65,0],kind:used.has('li')?'on':'off',align:'start'});
   list.push({id:'liquid',text:'Electrolyte',at:[-1.48,s.immersed?-1.86:-1.36,0],kind:'quiet',align:'end'});}
  if(s.mode)list.push({id:'instrument',text:s.mode,at:[0,3.8,0],kind:'mode'});
  return list;
 }
}

// ————— Magnified wall (2D, crisp at any size) —————
const NS='http://www.w3.org/2000/svg';
const el=(name,attrs={},parent)=>{const e=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent?.append(e);return e;};
const W=360,H=300,C0=0,CARBON=118,POLY=96,TOP=30,BOTTOM=40;
export class FormationWall{
 constructor(host){
  this.host=host;this.svg=el('svg',{viewBox:`0 ${-TOP} ${W} ${H+TOP+BOTTOM}`,role:'img'});host.append(this.svg);
  const defs=el('defs',{},this.svg);
  const grad=(id,stops,x2='1')=>{const g=el('linearGradient',{id,x1:'0',x2,y1:'0',y2:x2==='1'?'0':'1'},defs);stops.forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},g));};
  grad('wall-carbon',[[0,'#35383e'],[1,'#5c6068']]);grad('wall-poly',[[0,'#1d6db0'],[1,'#164f82']]);grad('wall-pore',[[0,'#2a4f74'],[1,'#1c3550']]);
  el('clipPath',{id:'wall-clip'},defs).append(el('rect',{x:0,y:0,width:W,height:H,rx:6}));
  this.root=el('g',{'clip-path':'url(#wall-clip)'},this.svg);
  this.pore=el('rect',{x:0,y:0,width:W,height:H,fill:'url(#wall-pore)'},this.root);
  this.carbon=el('path',{fill:'url(#wall-carbon)'},this.root);
  this.plating=el('path',{fill:'#c9cfd8'},this.root);
  this.sei=el('path',{fill:'#86d1aa'},this.root);
  this.poly=el('path',{fill:'url(#wall-poly)'},this.root);
  this.backbones=el('g',{fill:'none','stroke-linecap':'round'},this.root);
  this.pendants=el('g',{},this.root);this.anions=el('g',{},this.root);this.carriers=el('g',{},this.root);
  this.labels=el('g',{'font-size':'13','font-family':'Sora, Arial, sans-serif'},this.svg);
  el('rect',{x:.5,y:.5,width:W-1,height:H-1,rx:6,fill:'none',stroke:'#4a5875','stroke-width':1},this.svg);
  this.backboneX=[0.32,0.62,0.88];this.sites=[];
  for(let b=0;b<3;b++)for(let i=0;i<5;i++)this.sites.push({b,y:40+i*52+(b%2)*24,side:b===2?-1:1});
  this.state=null;this.start=0;this.raf=0;
 }
 // Interface positions as functions of the one-shot progress u (0→1) for this step.
 layout(step,u){
  const s=step.inset,growth=s.sei===0?0:s.sei===1?10*u:10+5*u;
  const plate=s.plating?16*Math.sin(Math.PI*clamp(u*1.15,0,1)):0;
  const sei=s.sei===0?0:growth,x1=CARBON,x2=x1+plate,x3=x2+sei,x4=x3+POLY;
  return {x1,x2,x3,x4,plate,sei};
 }
 wavy(x,dir=1){let d=`M${x} 0`;for(let y=0;y<=H;y+=20)d+=` L${x+dir*3*Math.sin(y/37)} ${y}`;return d;}
 band(xa,xb){const left=this.wavy(xa).replace('M','M'),right=[];for(let y=H;y>=0;y-=20)right.push(`L${xb+3*Math.sin(y/37)} ${y}`);return left+' '+right.join(' ')+' Z';}
 set(step,{reduced}){
  if(this.state?.key===step.key)return;this.state=step;this.start=performance.now();this.reduced=reduced;
  this.svg.setAttribute('aria-label',this.description(step));this.dataset();this.frame(this.start,true);this.loop();
 }
 dataset(){const d=this.host.dataset,s=this.state;d.sei=String(s.inset.sei);d.polymer=s.inset.polymer;d.flows=s.inset.flows.join(' ');}
 replay(){this.start=performance.now();this.loop();}
 loop(){cancelAnimationFrame(this.raf);const tick=now=>{const busy=this.frame(now);this.raf=busy?requestAnimationFrame(tick):0;};this.raf=requestAnimationFrame(tick);}
 stop(){cancelAnimationFrame(this.raf);this.raf=0;}
 description(step){
  const s=step.inset,parts=[s.sei?'An interphase separates carbon from the polymer.':'The polymer touches the carbon directly.'];
  const f={short:'Electrons pass freely between carbon and polymer.','e-into-carbon':'Electrons enter the carbon from its lead.','li-to-carbon':'Lithium ions from the liquid reach the carbon surface.','e-into-polymer':'Electrons enter the polymer backbone from its lead.','li-into-polymer':'Lithium ions from the liquid are taken up at the polymer’s redox sites.','e-polymer-to-carbon':'Electrons leave the polymer and reach the carbon through the external circuit.','li-polymer-to-carbon':'Lithium ions cross the interphase from polymer to carbon.','anions-into-polymer':'Anions from the liquid re-dope the polymer backbone.','e-carbon-to-polymer':'Electrons leave the carbon and reach the polymer through the external circuit.','li-carbon-to-polymer':'Lithium ions cross the interphase from carbon to polymer.'};
  if(s.plating)parts.push('Lithium plates on the carbon, then is stripped away.');
  return 'Magnified pore wall: '+parts.concat(s.flows.map(k=>f[k])).join(' ');
 }
 frame(now,force){
  const step=this.state;if(!step)return false;const s=step.inset;
  const duration=s.plating?3600:s.sei===1?2400:3000,t=this.reduced?1:clamp((now-this.start)/duration,0,1),u=easeInOut(t);
  const L=this.layout(step,u),liquid=step.immersed;
  this.pore.setAttribute('fill',liquid?'url(#wall-pore)':'#11161f');
  this.carbon.setAttribute('d',`M0 0 ${this.wavy(L.x1).replace(/^M[^L]*/,'L'+L.x1+' 0')} L0 ${H} Z`);
  this.plating.setAttribute('d',this.band(L.x1,L.x2));this.plating.style.display=L.plate>.3?'':'none';
  this.sei.setAttribute('d',this.band(L.x2,L.x3));this.sei.style.display=L.sei>.3?'':'none';
  this.poly.setAttribute('d',this.band(L.x3,L.x4));
  // Backbone strands carry electrons; de-doping makes them dim (more insulating).
  const doped=s.polymer==='doped'||(step.key==='charge-device'&&u>.5);
  this.backbones.replaceChildren(...this.backboneX.map(f=>el('path',{d:this.wavy(L.x3+POLY*f,.6),stroke:doped?'#a9d3ff':'#5b7ea3','stroke-width':doped?1.8:1.3,'stroke-dasharray':doped?'':'3 5',opacity:doped?.95:.8})));
  // Redox pendants: hollow when oxidized, holding Li⁺ (amber) when reduced.
  const filled=i=>{const order=(i*7)%this.sites.length/this.sites.length;if(s.pendants==='fill')return u>order*.85;if(s.pendants==='empty-from-full')return u<order*.85;return false;};
  this.pendants.replaceChildren(...this.sites.flatMap((p,i)=>{const bx=L.x3+POLY*this.backboneX[p.b]+.6*3*Math.sin(p.y/37),x=bx+p.side*11,on=filled(i);
   return [el('line',{x1:bx,y1:p.y,x2:x,y2:p.y,stroke:'#7fb2e6','stroke-width':1}),el('circle',{cx:x,cy:p.y,r:4.2,fill:on?'#f3c36a':'#123a63',stroke:on?'#ffe2a6':'#9cc6f2','stroke-width':1.2})];}));
  // Anions arriving from the liquid during full-device charging.
  this.anions.replaceChildren();if(s.flows.includes('anions-into-polymer'))for(let i=0;i<5;i++){const q=clamp(u*1.3-i*.12,0,1),x=W-14-(W-14-(L.x3+POLY*.5+(i%2?10:-12)))*easeInOut(q),y=48+i*50;el('circle',{cx:x,cy:y,r:4.4,fill:'#b7a0ff'},this.anions);el('text',{x,y:y+3.4,'text-anchor':'middle','font-size':'10','font-weight':'600',fill:'#1a1530'},this.anions).textContent='−';}
  // Carriers: looping only where the step is a continuing condition (the short).
  this.carriers.replaceChildren();const loop=(now-this.start)/1000;
  const dot=(x,y,kind)=>el('circle',{cx:x,cy:y,r:kind==='li'?4.4:2.6,fill:kind==='li'?'#f3c36a':'#e6eeff',stroke:kind==='li'?'#fff1cf':'none','stroke-width':.8},this.carriers);
  for(const f of s.flows){
   if(f==='short')for(let i=0;i<6;i++){const q=(loop*.35+i/6)%1,dir=i%2?1:-1,x=L.x1-34+68*(dir>0?q:1-q);dot(x,30+i*44,'e');}
   if(t>=1&&f!=='short')continue;
   const k=u;
   if(f==='e-into-carbon')for(let i=0;i<4;i++){const q=clamp(k*1.4-i*.12,0,1);dot(8+(L.x1-16)*q,62+i*58,'e');}
   if(f==='li-to-carbon')for(let i=0;i<3;i++){const q=clamp(k*1.3-i*.15,0,1);dot(W-16-(W-16-(L.x2+5))*q,82+i*68,'li');}
   if(f==='e-into-polymer')for(let i=0;i<4;i++){const q=clamp(k*1.4-i*.13,0,1);dot(L.x3+POLY*this.backboneX[i%3],8+(H-16)*q,'e');}
   if(f==='li-into-polymer')for(let i=0;i<3;i++){const q=clamp(k*1.3-i*.15,0,1);dot(W-16-(W-16-(L.x3+POLY*.75))*q,70+i*80,'li');}
   if(f==='e-polymer-to-carbon'||f==='e-carbon-to-polymer'){const toCarbon=f==='e-polymer-to-carbon';for(let i=0;i<3;i++){const q=clamp(k*1.4-i*.14,0,1);if(toCarbon){dot(L.x3+POLY*this.backboneX[i],H-10-(H-20)*q,'e');dot(L.x1-24-(L.x1-40)*(1-q),70+i*70,'e');}else{dot(L.x1-30-(L.x1-46)*q,70+i*70,'e');dot(L.x3+POLY*this.backboneX[i],10+(H-20)*q,'e');}}}
   if(f==='li-polymer-to-carbon'||f==='li-carbon-to-polymer'){const toCarbon=f==='li-polymer-to-carbon';for(let i=0;i<3;i++){const q=clamp(k*1.25-i*.15,0,1),a=L.x3+POLY*.42,b=L.x1-16,x=toCarbon?a+(b-a)*q:b+(a-b)*q;dot(x,66+i*84,'li');}}
  }
  this.labelsFor(step,L,u);
  return t<1||s.flows.includes('short');
 }
 // Labels sit in bands above and below the wall, each with a pin in the region it names and a hairline to it,
 // so no word is drawn over a strand, pendant or carrier. Only the flow note stays inside, on a halo.
 labelsFor(step,L,u){
  const s=step.inset,doped=s.polymer==='doped'||(step.key==='charge-device'&&u>.5),below=[],above=[],inside=[];
  below.push({text:'Carbon',x:L.x1/2,fill:'#d7dbe2'});
  below.push({text:'PAQEDOT',sub:doped?'doped':'de-doped',x:L.x3+POLY*.47,fill:'#cfe3ff'});
  below.push({text:'Pore',sub:step.immersed?'with electrolyte':'',x:(L.x4+W)/2,fill:'#b6c9de'});
  const plate=L.plate>2,sei=L.sei>.3;
  if(plate)above.push({text:'Li plates',x:L.x1+L.plate/2,fill:'#eef2f8',side:sei?-1:0});
  if(sei)above.push({text:s.sei===1&&u<1?'SEI forming':'SEI',x:L.x2+L.sei/2,fill:'#bff0d6',side:plate?1:0});
  if(s.flows.includes('short'))above.push({text:'e⁻ cross: a short',x:L.x1,fill:'#ffffff',side:0,pin:44});
  if(s.flows.some(f=>f.startsWith('e-'))&&!s.flows.includes('short')&&sei&&step.key!=='form-sei'&&step.key!=='plate-strip')inside.push({text:'e⁻ blocked',x:L.x2-10,y:H/2+4,fill:'#e6eeff'});
  const nodes=[],stroke='#6f7f9c';
  for(const b of below){
   const pinY=H-16;nodes.push(el('circle',{cx:b.x,cy:pinY,r:2,fill:b.fill}),el('path',{d:`M${b.x} ${pinY+4}V${H+8}`,stroke:b.fill,'stroke-width':.8,opacity:.6}));
   const t=el('text',{x:b.x,y:H+22,'text-anchor':'middle',fill:b.fill,'font-size':12.5});t.textContent=b.text;nodes.push(t);
   if(b.sub){const n=el('text',{x:b.x,y:H+35,'text-anchor':'middle',fill:'#8d9bb5','font-size':10.5});n.textContent=b.sub;nodes.push(n);}
  }
  for(const a of above){
   const pinY=a.pin??16,tx=a.x+(a.side||0)*14,anchor=a.side<0?'end':a.side>0?'start':'middle',elbow=-10;
   nodes.push(el('circle',{cx:a.x,cy:pinY,r:2,fill:a.fill}),el('path',{d:a.side?`M${a.x} ${pinY-4}V${elbow}H${tx-(a.side*2)}`:`M${a.x} ${pinY-4}V${elbow+2}`,fill:'none',stroke:a.fill,'stroke-width':.8,opacity:.6}));
   const t=el('text',{x:a.side?tx:a.x,y:a.side?elbow+4:-14,'text-anchor':anchor,fill:a.fill,'font-size':12.5});t.textContent=a.text;nodes.push(t);
  }
  for(const n of inside){const t=el('text',{x:n.x,y:n.y,'text-anchor':'end',fill:n.fill,'font-size':12,stroke:'#2b2e34','stroke-width':3,'paint-order':'stroke','stroke-linejoin':'round'});t.textContent=n.text;nodes.push(t);}
  this.labels.replaceChildren(...nodes);
 }
}
