import {initialDepth,reduceDepth} from './self-separating-battery-depth.mjs?v=5';
// Geometric interpretation of Tait et al. Fig. 1c / Fig. 2; not a transport solver.
// Colours follow the paper's own figures (grey carbon, mint separator, deep blue cathode),
// so the live model reads as the same material as the printed panels.
export const PHASES={
 carbon:{name:'Carbon',role:'Anode · electronic scaffold',color:0x45484f,swatch:'#8a8e96'},
 cathode:{name:'PAQEDOT',role:'Redox-active cathode',color:0x0f4f8a,swatch:'#3f8fd6'},
 sei:{name:'SEI',role:'Ion-permeable interphase',color:0x6fbf96,swatch:'#8fd8b2'},
 template:{name:'Template',role:'Removed during pyrolysis',color:0xb5363d,swatch:'#d0545a'},
 precursor:{name:'Resol-rich domain',role:'Becomes carbon',color:0x2a3aa6,swatch:'#5865d4'}
};
export const STAGES=['hybrid','carbon','cathode','sei'];
export const DISPLAYS=['model','1','2','5','6'];
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const ease=t=>t*t*(3-2*t);
export const easeInOut=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-(-2*t+2)**3/2;};

// The printed cubes in Figure 1c and Figure 2 are drawn from almost exactly this viewpoint.
// Measured from the native JPEGs: face widths 169:140 px and edge slopes 43:51 px give
// yaw 0.70 rad and elevation 0.31 rad under an orthographic fit (see production notes).
export const PAPER_POSE={yaw:.70,elevation:.31,halfHeight:5.3,target:[0,0,0]};
export const HOME={yaw:.56,elevation:.44,halfHeight:5.3,target:[0,0,0]};
// Bounding boxes of each printed cube, in native image pixels [x0,y0,x1,y1].
export const ANCHORS={
 1:{c:[937,56,1246,365]},
 2:{hybrid:[5,28,240,263],carbon:[356,30,597,271],cathode:[765,24,1012,271],sei:[1178,24,1425,271]}
};
// Which printed cube corresponds to the visible model, if any.
export function anchorFor(s,figure){
 if(s.deep)return null;
 if(figure===1&&s.view==='architecture'&&s.architecture==='network')return ANCHORS[1].c;
 if(figure===2&&s.view==='fabrication')return ANCHORS[2][s.stage];
 if(figure===2&&s.view==='architecture'&&s.architecture==='network')return ANCHORS[2].sei;
 return null;
}

// Drag convention: the nearest surface point follows the pointer horizontally and vertically.
export function orbit(p,dx,dy){return {...p,yaw:p.yaw-dx*.006,elevation:clamp(p.elevation+dy*.006,-1.08,1.08)};}

export function initialState(reduced=false){return {view:'architecture',architecture:'network',stage:'hybrid',layer:'all',cut:0,route:null,transport:!reduced,reduced,opening:!reduced,paused:false,display:reduced?'model':'1',deep:null};}
export const showingPaper=s=>s.display!=='model';
export function reduce(s,action){
 switch(action.type){
 case 'depth-enter':return {...s,deep:initialDepth(),opening:false,paused:false,display:'model'};
 case 'depth-exit':return {...s,deep:null,display:'model'};
 case 'depth':return s.deep?{...s,deep:reduceDepth(s.deep,action.action)}:s;
 case 'view':return {...s,view:action.value,layer:'all',route:null,opening:false,cut:action.value==='interface'?0:s.cut};
 case 'stage':return {...s,stage:action.value,layer:'all',route:null,opening:false};
 case 'architecture':return {...s,architecture:action.value,layer:'all',route:null,opening:false};
 case 'layer':return {...s,layer:action.value,route:null,opening:action.opening?s.opening:false};
 case 'route':return {...s,route:s.route===action.value?null:action.value,layer:s.route===action.value?'all':action.value,opening:false};
 case 'cut':return {...s,cut:clamp(Number(action.value),0,1),opening:action.opening?s.opening:false};
 case 'explore':return {...s,opening:false,paused:false};
 case 'transport':return {...s,transport:!s.transport,opening:false};
 case 'display':return DISPLAYS.includes(action.value)?{...s,display:action.value,opening:action.opening?s.opening:false,paused:action.opening?s.paused:false}:s;
 case 'pause':return {...s,paused:!s.paused};
 default:return s;
 }
}
export function meshNames(s){
 if(s.view!=='fabrication')return ['carbon','sei','cathode'];
 return s.stage==='hybrid'?['carbon','template']:s.stage==='carbon'?['carbon']:s.stage==='cathode'?['carbon','deposited']:['carbon','sei','cathode'];
}
export function phaseAt(v,s,meta){
 if(v<=0)return 'carbon';
 if(s.view==='fabrication'&&s.stage==='hybrid')return 'template';
 if(s.view==='fabrication'&&s.stage==='carbon')return null;
 if(v>=meta.outerThreshold)return null;
 if(s.view==='fabrication'&&s.stage==='cathode')return 'cathode';
 return v<meta.seiThreshold?'sei':'cathode';
}
export function intervals(s,m){
 const list=[['carbon',-Infinity,0]];
 if(s.view==='fabrication'&&s.stage==='hybrid')return [...list,['template',0,Infinity]];
 if(s.view==='fabrication'&&s.stage==='carbon')return list;
 if(s.view==='fabrication'&&s.stage==='cathode')return [...list,['cathode',0,m.outerThreshold]];
 return [...list,['sei',0,m.seiThreshold],['cathode',m.seiThreshold,m.outerThreshold]];
}
// Clip a triangle in (x,y,value) space at scalar thresholds; keeps cut-face identity.
export function clipScalar(poly,threshold,keepAbove){
 if(!Number.isFinite(threshold))return poly;
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],inside=p=>keepAbove?p[2]>=threshold:p[2]<=threshold;
  if(inside(a))out.push(a);
  if(inside(a)!==inside(b)){const t=(threshold-a[2])/(b[2]-a[2]);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]),threshold]);}
 }
 return out;
}

// A caption stays up at least half a second longer than reading it at 15 characters
// per second while also watching motion, and never less than 4 s (same rule as the homepage).
export const readingTime=text=>Math.max(4,text.length/15+.5);
// The opening: each beat names its own visible state, so controls can follow it truthfully.
const beat=(id,kicker,title,copy,extra={})=>({id,kicker,title,copy,...extra});
export const OPENING=[
 beat('paper','TAIT ET AL. 2026 · FIGURE 1','Three ways to\narrange a battery','Panel a rolls flat layers into a cell. Panel b is an earlier, ordered design. Panel c is the material in this paper.',{display:'1'}),
 beat('lift','FIGURE 1c → A LIVE MODEL','Panel c,\ngiven depth','The model takes the panel’s viewpoint and colours, then turns. Its geometry is explanatory, not the imaged specimen.',{display:'model',emerge:true,min:9}),
 beat('cut','CUT INTO THE VOLUME','The islands\ncontinue inside','A cut finds the same mint rings around blue cathode deep inside the carbon. Each patch is a section through something larger.',{display:'model',cut:.55}),
 beat('isolate','ISOLATE THE CATHODE','One network,\nnot many pockets','Hide the carbon and interphase, and the blue patches join into a single cathode that reaches every face of the sample.',{display:'model',cut:.55,layer:'cathode'})
];
export function openingSchedule(){let t=0;return OPENING.map(b=>{const start=t;t+=Math.max(b.min||0,readingTime(b.title+' '+b.copy));return {...b,start,end:t};});}
export const OPENING_END=openingSchedule().at(-1).end;
export const beatAt=t=>openingSchedule().find(b=>t<b.end)||null;

export function caption(s){
 if(s.view==='fabrication')return {
 hybrid:['FIGURE 2 · CO-ASSEMBLY','First, build\nthe template','A block copolymer organizes with phenol-formaldehyde resols into two intertwined domains. The resol-rich domain will become carbon; the other will be removed.','Colours follow Figure 2: red domain removed, blue domain becomes carbon.'],
 carbon:['FIGURE 2 · PYROLYSIS','Leave the\npathways open','Heating under nitrogen converts the resol-rich framework to carbon and removes the template. The carbon and the empty pore space both extend through the sample.','The paper reports an average pore size of about 90 nm.'],
 cathode:['FIGURE 2 · ELECTROPOLYMERIZATION','Coat the\ncarbon directly','AQEDOT is electropolymerized into redox-active PAQEDOT on the pore walls. At this stage the coating touches the carbon: anode and cathode are one electronic conductor.','The real coating is heterogeneous; this model simplifies it.'],
 sei:['FIGURE 2 · SEI FORMATION','Separate\nfrom within','Electrochemical processing against external lithium forms a solid–electrolyte interphase between carbon and polymer. It blocks electrons while letting lithium ions pass.','The authors’ proposed process, not a recorded growth sequence. Go deeper → Formation shows each step.']
 }[s.stage];
 if(s.view==='interface')return ['DURING DISCHARGE','Electrons go around,\nions go across','Inside the cell, lithium ions cross the thin interphase from carbon into the polymer. Electrons cannot; they leave through the carbon lead and return through the external circuit.','Enlarged local wall. Motion shows transport roles, not a calculated trajectory or rate.'];
 if(s.architecture==='layered')return ['FIGURE 1a · LAYERED ARCHITECTURE','A rolled sheet\nis still a sheet','A conventional cell places a separator between electrode layers tens of micrometres thick. Rolling the stack changes its packaging, not the distance ions must cross.','Compare with the interwoven structure of Figure 1c.'];
 if(s.route)return ['FOLLOW A CONNECTED NETWORK',s.route==='carbon'?'One continuous\ncarbon scaffold':'One continuous\ncathode network',s.route==='carbon'?'The carbon is both the anode and the electronic route to its lead. This route stays inside carbon from one face of the sample to the opposite face.':'The polymer coating extends through the porous scaffold. This route stays inside the cathode from one face of the sample to the opposite face.','A checked geometric connection in this model, not a measured electron trajectory.'];
 if(s.layer!=='all')return {carbon:['THE ANODE','More than\na support','Carbon forms a connected porous scaffold. In this device it stores lithium and carries electrons to its own lead.','The other phases are hidden; their space appears empty.'],cathode:['THE CATHODE','A network\nwithin a network','PAQEDOT coats the pore walls and forms one connected cathode. A separate outer PEDOT layer gives it a lead that does not touch the carbon.','The outer contact layer is omitted from this interior view.'],sei:['THE SEPARATING INTERPHASE','Thin,\nbut continuous','The SEI follows every boundary between the two electrode networks. Its intended role is to block electrons and pass lithium ions.','Displayed thickness is illustrative; the paper reports no interphase thickness.']}[s.layer];
 return ['FIGURE 1c · INTERWOVEN ARCHITECTURE','They look like islands\nuntil you turn them','Carbon, cathode and the interphase between them all extend through the volume. Cut into the structure, or isolate one material, to see the apparent pockets connect.','An explanatory nonperiodic geometry in the paper’s viewpoint and colours, not a reconstruction of the specimen.'];
}
