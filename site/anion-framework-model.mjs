// State, data helpers and the pure science of the anion-framework companion (Wang et al. 2015).
// Scope, sources and every assumption: references/anion-framework/scientific-notes.md.
// Data files (site/assets/anion-framework/):
//   scene.json         ideal bcc/fcc/hcp sulfur lattices at 40 Å³ per S, their T and O sites, face-sharing links and
//                      the paths of Fig. 2; LGPS matched to bcc (R = 0.58 Å); Li₂S. Built by build-scene.py.
//   curves.json        Fig. 2 and Fig. 3 points read from the PDF's vector markers
//   volume-paths.json  Supplementary Figs S4–S6: every path at seven volumes, read from the raster plots
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number(v)||0));
export const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
export const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
export const lerp=(a,b,t)=>a+(b-a)*t;

export const QUESTIONS=['hop','volume','crystals'];
export const LATTICES=['bcc','fcc','hcp'];
// The paths the paper computes in each lattice (Fig. 2); the first is the one each lattice opens on.
export const ROUTES={bcc:['TT'],fcc:['TOT'],hcp:['TOT','TT','OO']};
export const ROUTE_NAMES={TT:'T → T',TOT:'T → O → T',OO:'O → O'};
export const VOLUMES=[28.5,34,40,46.6,54,62.1,70.8];
export const V0_INDEX=2;
// Fig. 3's shaded regimes, read from the vector drawing: I below 31.0 Å³, II to 43.5 Å³, III above.
export const REGIMES=[{id:'I',from:23.5,to:31},{id:'II',from:31,to:43.5},{id:'III',from:43.5,to:74}];
export const regimeOf=v=>v<31?'I':v<43.5?'II':'III';
// Experimental activation energies the paper's text gives together with a volume (it marks them on Fig. 3 as stars).
// LGPS's volume is computed from the Kamaya structure used for the model (39.7 Å³ per S); the text rounds it to 40.
export const STARS=[
 {name:'Li₇P₃S₁₁',V:37.7,E:.18,family:'bcc'},
 {name:'Li₁₀GeP₂S₁₂',V:39.7,E:.22,family:'bcc'},
 {name:'γ-Li₃PS₄',V:38.6,E:.49,family:'hcp'},
 {name:'Li₄GeS₄',V:41.8,E:.53,family:'hcp'}
];
export const CRYSTALS=['lgps','li2s'];
// Four steps from the real crystal to the idea underneath it.
export const STEPS=['crystal','sulfur','lattice','sites'];

// Figures offered beside each question; the first entry is what the question opens on.
export const DISPLAYS={hop:['model','2'],volume:['model','3'],crystals:['model','1','4','5']};
export const FIGURES={
 '1':{file:'figure-1.webp',width:1437,height:857,title:'Figure 1 · sulfur sublattices mapped to bcc, fcc and hcp',heading:'Five real crystals,\nthree hidden lattices',caption:'Figure 1 · Mapping of the anion sublattice to a bcc/fcc/hcp framework in solid-state Li-ion conductors. a–e, Crystal structures of Li₁₀GeP₂S₁₂ (a), Li₇P₃S₁₁ (b), Li₂S (c), γ-Li₃PS₄ (d) and Li₄GeS₄ (e). Li, partially occupied Li, S, PS₄ tetrahedra and GeS₄ tetrahedra are coloured green, green–white, yellow, purple and blue. In Li₁₀GeP₂S₁₂ and Li₇P₃S₁₁ the sulphur sublattice can be closely mapped to a bcc framework (red circles connected by red lines). In Li₂S it is an exact fcc matrix. The anion sublattices in γ-Li₃PS₄ and Li₄GeS₄ are closely matched to an hcp framework.'},
 '2':{file:'figure-2.webp',width:2035,height:1862,title:'Figure 2 · Li-ion migration in bcc, fcc and hcp sulfur lattices',heading:'One lithium, three lattices,\nthree energy paths',caption:'Figure 2 · Li-ion migration pathways in bcc/fcc/hcp-type anion lattices. a–c, Li-ion migration path (left) and calculated energy path (right) in bcc (a), fcc (b) and hcp (c) sulphur lattices. Sulphur is yellow; Li is green, blue and red for different paths. LiS₄ tetrahedra and LiS₆ octahedra are green and red.'},
 '3':{file:'figure-3.webp',width:1155,height:675,title:'Figure 3 · barrier versus lattice volume',heading:'Squeeze or stretch the lattice:\nbcc stays lowest',caption:'Figure 3 · Activation barrier calculated for the Li-ion migration pathways in the bcc/fcc/hcp S²⁻ lattices at different volumes. Solid and dotted lines are guides to the eye. Experimental activation energies for Li₁₀GeP₂S₁₂, Li₁₀SnP₂S₁₂, Li₁₀SiP₂S₁₂, Li₇P₃S₁₁, Li₂S, Li₄GeS₄ and γ-Li₃PS₄ are marked by stars. The underestimate for Li₂S is because the experimental value includes the energy to form a defect.'},
 '4':{file:'figure-4.webp',width:1392,height:1174,title:'Figure 4 · where lithium spends its time',heading:'Where lithium spends\nits time at 900 K',caption:'Figure 4 · Li-ion probability densities from ab initio molecular dynamics at 900 K in Li₁₀GeP₂S₁₂ (a), Li₇P₃S₁₁ (b), Li₂S (c) and Li₄GeS₄ (d). Isosurfaces are drawn at 2P₀ to 32P₀, where P₀ is the mean density for each structure. PS₄ and GeS₄ tetrahedra are purple and blue; sulphur is shown as small yellow circles for Li₂S.'},
 '5':{file:'figure-5.webp',width:1147,height:697,title:'Figure 5 · how close real sulfides come to bcc',heading:'Only a few sulfides\nare close to bcc',caption:'Figure 5 · Similarity of screened ICSD structures containing Li and S to a bcc anion framework. Compounds with transition-metal cations are excluded. The lattice length deviation is σₗ = 1 − min(a,b,c)/max(a,b,c) and the angle deviation σθ = max(|90° − α|, |90° − β|, |90° − γ|) of the transformed lattice. A perfect bcc anion framework has σₗ = σθ = 0.'}
};
// Panel a's render inside figure-2.webp (figure pixels) and the native size of the embedded render; see extract-figures.py.
const F2=4.5833;
export const INSET={x:(135.4-108)*F2,y:(65.2-46)*F2,w:131.1*F2,h:92.7*F2,nativeW:402,nativeH:284};

export function initialState(reduced=false){
 return {question:'hop',display:reduced?'model':'2',lattice:'bcc',route:'TT',view:'hop',progress:0,playing:false,volume:V0_INDEX,
  crystal:'lgps',step:0,reduced,opening:!reduced,openingPaused:false,beat:null,saved:{}};
}
const routeFor=(lattice,route)=>ROUTES[lattice].includes(route)?route:ROUTES[lattice][0];
export function reduce(s,a){
 const quiet={playing:false,opening:false};
 switch(a.type){
  case 'question':{
   if(!QUESTIONS.includes(a.value))return s;
   if(a.value===s.question)return {...s,...quiet,display:DISPLAYS[s.question][0]};
   const saved={...s.saved,[s.question]:{progress:s.progress,display:s.display}};
   const back=saved[a.value];
   return {...s,...quiet,question:a.value,saved,progress:back?.progress??0,display:DISPLAYS[a.value][0],view:a.value==='hop'?s.view:'hop'};
  }
  case 'display':return {...s,opening:false,display:a.value};
  case 'lattice':{if(!LATTICES.includes(a.value))return s;const route=routeFor(a.value,a.route??(a.value===s.lattice?s.route:ROUTES[a.value][0]));return {...s,...quiet,display:'model',lattice:a.value,route,progress:a.value===s.lattice&&route===s.route?s.progress:0};}
  case 'route':{if(!ROUTES[s.lattice].includes(a.value))return s;return {...s,...quiet,display:'model',route:a.value,progress:a.value===s.route?s.progress:0};}
  case 'view':return {...s,...quiet,display:'model',view:a.value==='network'?'network':'hop'};
  case 'volume':return {...s,opening:false,playing:false,display:'model',volume:Math.round(clamp(a.value,0,VOLUMES.length-1))};
  case 'progress':return {...s,opening:false,playing:a.playing??false,progress:clamp(a.value),display:'model'};
  case 'play':return {...s,opening:false,display:'model',view:s.question==='hop'?'hop':s.view,playing:!s.playing,progress:!s.playing&&s.progress>=1?0:s.progress};
  case 'crystal':return {...s,...quiet,display:'model',crystal:CRYSTALS.includes(a.value)?a.value:s.crystal};
  case 'step':return {...s,...quiet,display:'model',step:Math.round(clamp(a.value,0,STEPS.length-1))};
  case 'stop-opening':return {...s,opening:false,openingPaused:false,beat:null,display:s.display==='2'||s.display==='model'?'model':s.display};
  case 'reduced':return {...s,reduced:a.value,playing:false};
  default:return s;
 }
}

// ————— Energy paths —————
// Key into curves.json / volume-paths.json for a lattice and route.
export const pathKey=(lattice,route)=>`${lattice}_${route}`;
// The printed points of one path as {s, energy_eV}: s runs 0…1 over the NEB images. Fig. 2 and Figs S4–S6 space their
// images evenly along the path axis, so image k of n sits at s = (k−1)/(n−1). Missing images are simply absent.
export function pathPoints(curves,volumePaths,lattice,route,volumeIndex=V0_INDEX){
 const key=pathKey(lattice,route);
 if(volumeIndex===V0_INDEX&&curves.figure2[key]){const p=curves.figure2[key].points,n=p.length;return p.map(q=>({s:(q.image-1)/(n-1),energy_eV:q.energy_eV}));}
 const set=volumePaths.paths[key],ser=set?.series.find(x=>Math.abs(x.volume_A3-VOLUMES[volumeIndex])<.05);
 if(!ser)return null;
 return ser.points.map(q=>({s:(q.image-1)/(set.images-1),energy_eV:q.energy_eV}));
}
// Piecewise-linear between the printed markers: nothing between NEB images is invented beyond a straight line.
export function curveAt(points,s){
 const p=points;if(!p?.length)return 0;if(s<=p[0].s)return p[0].energy_eV;
 for(let i=1;i<p.length;i++)if(s<=p[i].s){const t=(s-p[i-1].s)/(p[i].s-p[i-1].s);return lerp(p[i-1].energy_eV,p[i].energy_eV,t);}
 return p[p.length-1].energy_eV;
}
export const barrierOf=points=>points?Math.max(...points.map(p=>p.energy_eV))-Math.min(points[0].energy_eV,points[points.length-1].energy_eV):null;
// Fig. 3 barrier for a lattice and route at a volume, from the SI series (they agree with Fig. 3 to 0.008 eV).
export function barrierAt(volumePaths,lattice,route,volumeIndex){const ser=volumePaths.paths[pathKey(lattice,route)]?.series.find(x=>Math.abs(x.volume_A3-VOLUMES[volumeIndex])<.05);return ser?ser.barrier_eV:null;}
export function siteEnergyAt(volumePaths,lattice,route,volumeIndex){const ser=volumePaths.paths[pathKey(lattice,route)]?.series.find(x=>Math.abs(x.volume_A3-VOLUMES[volumeIndex])<.05);return ser?ser.site_energy_eV:null;}

// ————— Geometry along a path —————
// The path in scene.json runs site → shared-face centre → site …; the lithium is placed by arc length along it.
// This follows the sites and doorways the paper names; it is not the calculated minimum-energy path.
export function pathGeometry(points){
 const seg=[];let total=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],l=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);seg.push(l);total+=l;}
 return {points,seg,total};
}
export function positionAt(geo,s,scale=1){
 let d=clamp(s)*geo.total;const P=geo.points;
 for(let i=0;i<geo.seg.length;i++){if(d<=geo.seg[i]||i===geo.seg.length-1){const t=geo.seg[i]?clamp(d/geo.seg[i]):0,a=P[i],b=P[i+1];return [lerp(a[0],b[0],t)*scale,lerp(a[1],b[1],t)*scale,lerp(a[2],b[2],t)*scale];}d-=geo.seg[i];}
 return P[P.length-1].map(v=>v*scale);
}
// Where along the path each waypoint sits (0…1): sites at even indices, doorways at odd ones.
export function waypointS(geo){const out=[0];let acc=0;for(const l of geo.seg){acc+=l;out.push(acc/geo.total);}return out;}
// Lattice spacing scales with the cube root of the volume per sulfur.
export const scaleFor=volumeIndex=>Math.cbrt(VOLUMES[volumeIndex]/40);
export const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
// σ ∝ exp(−Eₐ/kT) at room temperature (the paper's three-orders-of-magnitude remark).
export const KT_300=.025852;
export const conductivityRatio=(Ea,Eb)=>Math.exp((Eb-Ea)/KT_300);
