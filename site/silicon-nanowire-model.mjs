// Pure schematic geometry and state. Scientific scope and source mapping: references/silicon-nanowire/scientific-notes.md.
// LENGTH and PAPER_POSE come from a silhouette fit to the printed wire of Fig. 5a
// (production/silicon-nanowire/registration/fit-panel-a.py, IoU 0.905 at progress 0.45).
export const LENGTH=9, TAU=Math.PI*2;
export const AXES={x1:[1,-1,0],x2:[1,1,-1],x3:[1,1,2]};
export const PAPER_POSE={yaw:.3985,elevation:.6682};
// Native Figure 5 pixels: where the model origin lands and how many pixels one pristine radius spans.
export const PANEL_A={origin:[242.43,158.19],unit:34.42,box:[99,41,335,289],progress:.45};
export const HOME={yaw:.56,elevation:.5,halfHeight:4.6};
export const VIEWS={
 oblique:HOME,
 // Both side views put the wire axis horizontal, so switching between them shows only the width change (Fig. 3g–h).
 x1:{yaw:Math.PI/2,elevation:0,halfHeight:4.9},
 x2:{yaw:Math.PI/2,elevation:Math.PI/2-.0001,halfHeight:4.9},
 axis:{yaw:0,elevation:0,halfHeight:3.3}
};
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number(v)||0));
export const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
export const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
export const localProgress=(p,s)=>smooth(0,.65,1.7*clamp(p)-clamp(s));
export const zAt=s=>LENGTH*(.5-clamp(s));
export const sAt=z=>.5-z/LENGTH;
export function section(p,s){
 const q=localProgress(p,s),a=1+1.62*q,n=.34*smooth(.35,.95,q);
 let ymax=0;for(let i=0;i<=80;i++){const t=Math.PI*i/80;const yy=Math.sin(t)*(1-n*Math.exp(-((Math.cos(t)/.34)**2)));ymax=Math.max(ymax,yy);}
 const b=(1+.14*q)/ymax;
 const cy=Math.pow(1-q,.58),cx=Math.pow(1-q,1.45);
 return {q,a,b,n,cx,cy,z:zAt(s)};
}
export function outer(t,d){const x=d.a*Math.cos(t);return [x,d.b*Math.sin(t)*(1-d.n*Math.exp(-((Math.cos(t)/.34)**2)))];}
export function core(t,d){return [d.cx*Math.cos(t),d.cy*Math.sin(t)];}
export function contour(p,s,count=160){const d=section(p,s);return {d,outer:Array.from({length:count},(_,i)=>outer(TAU*i/count,d)),core:Array.from({length:count},(_,i)=>core(TAU*i/count,d))};}
// Where along the wire the surface front sits: the first s (from the supplied end) whose section is still pristine.
export function frontAt(p){if(p<=0)return 0;const s=1.7*clamp(p);return clamp(s);}

// Each question has a scientific state; changing question glides there instead of jumping.
export const PRESETS={
 swelling:null,
 stress:{early:{progress:.18,slice:.12},late:{progress:.48,slice:.40},mises:{progress:.48,slice:.40}},
 fracture:{progress:.62,slice:.22}
};
export const QUESTIONS=['swelling','stress','fracture'];
export function initialState(reduced=false){return {question:'swelling',progress:.45,slice:.40,open:true,view:'oblique',display:reduced?'model':'5',playing:false,reduced,stress:'late',opening:!reduced,openingPaused:false,saved:{progress:.45,slice:.40,open:true}};}
export function reduce(s,a){
 const quiet={playing:false,opening:false};
 switch(a.type){
  case 'progress':return {...s,progress:clamp(a.value),playing:a.playing??false,opening:false,display:'model'};
  case 'slice':return {...s,slice:clamp(a.value),opening:false,display:'model'};
  case 'play':return {...s,display:'model',opening:false,playing:!s.playing,progress:!s.playing&&s.progress>=1?0:s.progress};
  case 'question':{
   if(a.value===s.question)return {...s,...quiet,display:'model'};
   const saved=s.question==='swelling'?{progress:s.progress,slice:s.slice,open:s.open}:s.saved;
   const target=a.value==='swelling'?saved:a.value==='stress'?PRESETS.stress[s.stress]:PRESETS.fracture;
   return {...s,...quiet,question:a.value,saved,open:false,...target,display:'model',view:'oblique'};
  }
  case 'stress':return {...s,...quiet,stress:a.value,...PRESETS.stress[a.value],display:'model'};
  case 'view':return {...s,...quiet,view:a.value,display:'model'};
  case 'free-camera':return {...s,view:null};
  case 'display':return {...s,display:a.value,playing:false,opening:false};
  case 'open':return {...s,...quiet,open:!s.open,display:'model'};
  case 'reduced':return {...s,reduced:a.value,opening:false,playing:false,display:'model'};
  case 'stop-opening':return {...s,opening:false,openingPaused:false,display:'model'};
  default:return s;
 }
}
export function orbit(p,dx,dy,w,h){return {...p,yaw:p.yaw-dx/w*Math.PI*1.6,elevation:clamp(p.elevation+dy/h*Math.PI*1.2,-1.25,1.25)};}
export const FIGURES={
 '5':{file:'figure-5.jpeg',width:1042,height:589,heading:'The simulated wire',title:'Figure 5 · the simulated wire',caption:'a–b: simulated lithiation, coloured by normalized lithium c; b is cut open to show the tapered core. c: TEM image of a partly lithiated wire. d–e: a cross-section, coloured by c and by von Mises stress. f: schematic of a crack growing from the surface indent, over a σ₁₁ section.'},
 '3':{file:'figure-3.jpeg',width:834,height:805,heading:'One wire, two\nviewing directions',title:'Figure 3 · one wire, two viewing directions',caption:'a–c: the pristine wire and its crystal directions. d–f: lithiation travelling along it. g–h: the same lithiated wire looks 180 nm wide, then 485 nm after tilting. The crystal directions, not the camera, set how much it swells.'},
 '2':{file:'figure-2.jpeg',width:1218,height:1543,heading:'A front that\nleaves a crack',title:'Figure 2 · a front that leaves a crack',caption:'a–i: the reaction front advancing along a wire; red arrows mark the front. l: a lithium-rich shell around a depleted core. m–o: imaging and line scans of the crack left behind the front.'},
 '1':{file:'figure-1.jpeg',width:1736,height:859,heading:'The experiment',title:'Figure 1 · the experiment',caption:'A nanowire is lithiated inside the electron microscope. Tilting exposes a dumbbell-shaped lithiated section in both solid and liquid cells (e–f), compared with the round pristine wire (g).'},
 's10':{file:'figure-s10.jpeg',width:2556,height:2055,heading:'The stress\nchanges sign',title:'Figure S10 · the stress changes sign',caption:'a–b: before necking, the surface is in compression and the centre in tension. c–d: after necking, the surface indent is in tension and the centre in compression. Calculated σ₁₁ profiles and sections from the supporting information.'}
};
export const DISPLAYS={swelling:['model','5','3','1'],stress:['model','5','s10'],fracture:['model','2','3','5']};
