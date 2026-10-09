import {Annotations} from './annotations.mjs';
import {swapFigure,fitStage} from './figure-swap.mjs';
import {initialState,reduce,FIGURES,DISPLAYS,INSET,ROUTES,VOLUMES,V0_INDEX,REGIMES,STARS,regimeOf,clamp,smooth,ease,curveAt,pathPoints,barrierAt,siteEnergyAt,scaleFor} from './anion-framework-model.mjs';
import {FrameworkScene,PALETTE} from './anion-framework-scene.mjs';
const $=id=>document.getElementById(id),all=s=>[...document.querySelectorAll(s)],BASE='assets/anion-framework/',SVGNS='http://www.w3.org/2000/svg';
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)'),params=new URLSearchParams(location.search);
const load=f=>fetch(BASE+f).then(r=>{if(!r.ok)throw Error(f);return r.json();});
const [DATA,CURVES,VP]=await Promise.all([load('scene.json'),load('curves.json'),load('volume-paths.json')]);
let state=initialState(reducedQuery.matches||params.has('reduced')),scene=null,failed=false,openingStop=null,playStop=null;
const figureViews=Object.fromEntries(Object.keys(FIGURES).map(k=>[k,{zoom:1,x:0,y:0}]));
const fmt=(v,d=2)=>(Math.abs(v)<.005&&d===2?0:v).toFixed(d);
const LG=DATA.lgps,NET=Object.fromEntries(Object.entries(DATA.lattices).map(([k,v])=>[k,{T:v.T_count,clusters:v.tt_cluster_count,biggest:v.tt_clusters[0]}]));
const MAXMOVE=LG.match.max_displacement_A,LIMAX=Math.max(...LG.li.map(x=>x.to_bcc_T_A)),LIMED=LG.li.map(x=>x.to_bcc_T_A).sort((a,b)=>a-b)[LG.li.length>>1];

// ————— Words —————
// Barriers quoted in the words come from the data files, so the text and the curves cannot disagree.
const B=k=>CURVES.figure2[k].barrier_eV,O_SITE=CURVES.figure2.fcc_TOT.points[8].energy_eV;
const HOP={
 bcc_TT:{kicker:'Figure 2a · bcc sulfur',title:'Straight from one\ntetrahedral site to the next',copy:`In bcc, neighbouring tetrahedral sites share a face. The lithium leaves T1 through that triangle of sulfur and is already in T2. The paper’s barrier for the hop is ${fmt(B('bcc_TT'))} eV, the lowest of the three lattices.`},
 fcc_TOT:{kicker:'Figure 2b · fcc sulfur',title:'A detour through\nan octahedral site',copy:`In fcc, tetrahedral sites never share a face with each other. The lithium must stop in a larger octahedral site, O1, ${fmt(O_SITE)} eV higher, and cross two doorways. The barrier is ${fmt(B('fcc_TOT'))} eV.`},
 hcp_TOT:{kicker:'Figure 2c · hcp sulfur, a–b plane',title:'The same detour\nin hcp',copy:`Across the a–b plane, hcp behaves like fcc: from T1 through the octahedral site O1 to T2. The barrier is ${fmt(B('hcp_TOT'))} eV.`},
 hcp_TT:{kicker:'Figure 2c · hcp sulfur, along c',title:'A short hop\nthat leads nowhere',copy:`Along c, pairs of tetrahedral sites do share a face, and the hop from T1 to T3 costs only ${fmt(B('hcp_TT'))} eV. But each pair is isolated: to go any further, the lithium needs an octahedral site again.`},
 hcp_OO:{kicker:'Figure 2c · hcp sulfur, along c',title:'Octahedra share faces too,\nbut start high',copy:`O1 and O2 share a face, and the hop between them is ${fmt(B('hcp_OO'))} eV. But the lithium first has to climb into an octahedral site, ${fmt(CURVES.figure2.hcp_OO.points[0].energy_eV)} eV above a tetrahedral one.`}
};
const HOP_NOTE='The sites, the shared faces and the energies are the paper’s. The lithium’s straight route through the centre of each face is drawn, not calculated; the faint spheres mark the calculation’s evenly spaced images along it.';
const NETWORK={
 bcc:{kicker:'Every site and link · bcc',title:'One network of\nidentical sites',copy:`Each tetrahedral site in bcc shares a face with four others, so all ${NET.bcc.T} in this block join into ${NET.bcc.clusters===1?'one network':NET.bcc.clusters+' networks'}. Lithium can cross the whole crystal without ever leaving a tetrahedral site.`},
 fcc:{kicker:'Every site and link · fcc',title:'Tetrahedral sites\nthat never touch',copy:`None of the ${NET.fcc.T} tetrahedral sites in this block shares a face with another. Every link (pale lines) runs through an octahedral site (red).`},
 hcp:{kicker:'Every site and link · hcp',title:'Pairs, joined only\nthrough octahedra',copy:'Tetrahedral sites pair up along c, two by two (green links). The pairs connect only through octahedral sites, so long-range motion has to alternate easy T–T hops with costly T–O–T ones.'}
};
const NET_NOTE='Green spheres are tetrahedral sites, red ones octahedral. A line joins two sites that share a face. The block is cut at its edges, so sites on its surface show fewer links.';
function volumeWords(){
 const V=VOLUMES[state.volume],r=regimeOf(V),L=state.lattice,R=state.route,b=barrierAt(VP,L,R,state.volume),site=siteEnergyAt(VP,L,R,state.volume);
 const kick=`Figure 3 · ${L} ${R==='TOT'?'T–O–T':R==='TT'?'T–T':'O–O'}`;
 if(L==='bcc')return {kicker:kick,title:b<.01?'Stretched far enough,\nno barrier at all':V<40?'Squeezed, the hop\ngets harder':'bcc stays lowest\nat every volume',copy:b<.01?`At ${V} Å³ per sulfur the paper finds no barrier left at all (Supplementary Fig. S4). The tetrahedral site stays the stable one at every volume.`:`At ${V} Å³ the bcc barrier is ${fmt(b)} eV. It falls steadily as the lattice opens, and is the lowest of all the paths at every volume the paper computed.`};
 if(R==='OO')return {kicker:'Supplementary Fig. S6c · hcp O–O',title:'Computed only\nup to 40 Å³',copy:b==null?'The paper computed the O → O path at 28.5, 34 and 40 Å³ only. Move the volume back to see it.':`At ${V} Å³ the O → O hop costs ${fmt(b)} eV, before counting the climb into the octahedral site.`};
 if(R==='TT')return {kicker:kick,title:'Low, but\na dead end',copy:`At ${V} Å³ the T → T hop within a pair costs ${fmt(b)} eV. However low it gets, the pair stays isolated: long-range motion still needs the T–O–T step.`};
 if(r==='I')return {kicker:kick+' · regime I',title:'Squeezed: lithium\nprefers the octahedron',copy:`Below about 31 Å³ the octahedral site is the more stable one, ${fmt(-site)} eV below the tetrahedral site. Leaving it means squeezing through a tiny triangle of sulfur: ${fmt(b)} eV.`};
 if(r==='II')return {kicker:kick+' · regime II',title:'The tetrahedron\ntakes over',copy:`As the lattice opens, the tetrahedral site becomes the stable one and the doorway widens. At ${V} Å³ the octahedral stop sits ${fmt(site)} eV higher and the barrier is ${fmt(b)} eV.`};
 return {kicker:kick+' · regime III',title:'Stretched: the octahedron\nis no longer a stop',copy:`Above about 44 Å³ the octahedral site is no longer stable. The paper finds the lithium passing between tetrahedral sites without settling there; at ${V} Å³ the barrier is ${fmt(b)} eV, still above bcc.`};
}
const VOLUME_NOTE='Each lattice is scaled evenly; the paper keeps the sulfur fixed in every calculation. In regime III the paper says the path bypasses the octahedron’s centre; the drawing keeps the straight route through it.';
const CRYSTAL={
 lgps:[
  {kicker:'Figure 1a · Li₁₀GeP₂S₁₂',title:'LGPS, as it is',copy:'One of the fastest lithium conductors known, 12 mS cm⁻¹ at room temperature. Lithium (green, fainter where a site is only partly filled) threads between PS₄ (purple) and GeS₄ (blue) tetrahedra.'},
  {kicker:'Figure 1a · strip it to sulfur',title:'Twenty-four sulfur ions',copy:'Remove everything but the 24 sulfur ions of the cell. At a glance they look irregular.'},
  {kicker:'Figure 1a · the bcc match',title:'Hidden underneath:\nbody-centred cubic',copy:`Each sulfur moves to the nearest point of a bcc lattice (red) of 2 × 2 × 3 small cells. The root-mean-square move is ${LG.match.R_A.toFixed(2)} Å, the paper’s own figure; none moves more than ${MAXMOVE.toFixed(2)} Å.`},
  {kicker:'Figure 1a · the lithium sites',title:'Its lithium already sits\non bcc tetrahedral sites',copy:`Put the lithium back. Every lithium site lies within ${LIMAX.toFixed(1)} Å of a tetrahedral site of that bcc lattice (green dots), and those sites share faces: the network of the One hop tab.`}],
 li2s:[
  {kicker:'Figure 1c · Li₂S',title:'Li₂S: every\ntetrahedral site full',copy:'A simple lithium sulfide. Each sulfur sits on an fcc lattice and lithium fills all eight tetrahedral sites of the cell.'},
  {kicker:'Figure 1c · strip it to sulfur',title:'Fourteen sulfur ions',copy:'The sulfur of one cubic cell: eight corners and six face centres.'},
  {kicker:'Figure 1c · already exact',title:'An exact\nfcc lattice',copy:'Here nothing moves: the sulfur is a perfect fcc lattice, with a deviation of zero in the paper’s Table S1.'},
  {kicker:'Figure 1c · the lithium sites',title:'No easy way through',copy:'The tetrahedral sites are all full, and they connect only through the empty octahedral sites (red). In the paper’s simulation lithium stays almost entirely on its tetrahedral sites (Figure 4c).'}]
};
const CRYSTAL_NOTE={lgps:'LGPS is the published Kamaya structure. Its lithium sites are only partly filled on average; any one moment holds about 20 lithium ions in the cell. The red lattice is fitted here and reproduces the paper’s match.',li2s:'Li₂S uses a = 5.76 Å, the cell the paper’s Table S1 lists. The red lines mark its fcc cubic cell.'};
const OPENING=[
 {id:'paper',kicker:'Wang et al. 2015 · Figure 2',title:'One lithium,\nthree ways to pack sulfur',copy:'Each row follows one lithium ion through a lattice of sulfur, with the energy along its path on the right. Only the top row, bcc, never rises above 0.15 eV.'},
 {id:'inset',kicker:'Figure 2a · bcc',title:'Two tetrahedral sites\nthat share a face',copy:'T1 and T2 each have four sulfur neighbours. Three of them are shared: a triangle the lithium passes through.'},
 {id:'emerge',kicker:'Figure 2a, given depth',title:'The same drawing,\nnow in three dimensions',copy:'Rebuilt from an ideal bcc lattice at 40 Å³ per sulfur and fitted to this render: its ten sulfur spheres land within 0.03 Å of the model’s.'},
 {id:'play',kicker:'Figure 2a · bcc · T → T',title:'One step, over\n0.15 eV',copy:'As the lithium crosses the shared face, the marker follows the paper’s energy path. The highest point is the face itself.'}
];
// Reading pace for the opening's words: about 17 characters a second, never under 4.5 s.
const readingTime=b=>Math.max(4.5,(b.title.length+b.copy.length)/17+1.2);
const REFERENCES={
 bcc:{file:'figure-2a.webp',figure:'2',caption:'Figure 2a · the bcc hop and its energy path, as printed. Open Figure 2 ↗'},
 fcc:{file:'figure-2b.webp',figure:'2',caption:'Figure 2b · the fcc hop through O1, as printed. Open Figure 2 ↗'},
 hcp:{file:'figure-2c.webp',figure:'2',caption:'Figure 2c · the three hcp paths, as printed. Open Figure 2 ↗'},
 volume:{file:'figure-3.webp',figure:'3',caption:'Figure 3 · every barrier against volume, as printed. Open Figure 3 ↗'},
 lgps:{file:'figure-1.webp',figure:'1',caption:'Figure 1 · LGPS (a) with its sulfur matched to bcc in red, beside Li₇P₃S₁₁, Li₂S, γ-Li₃PS₄ and Li₄GeS₄. Open Figure 1 ↗'},
 li2s:{file:'figure-1.webp',figure:'1',caption:'Figure 1 · Li₂S (c) is an exact fcc lattice; LGPS and Li₇P₃S₁₁ match bcc. Open Figure 1 ↗'}
};
const DEPTH={
 hop:[['Why lithium sits in tetrahedral sites','At 40 Å³ per sulfur the paper finds lithium most stable with four sulfur neighbours in all three lattices. In fcc and hcp the octahedral site lies about 0.30 eV above it (Fig. 2b,c). In bcc the octahedral site is not stable at all, at any volume (Supplementary Table S2).'],
  ['What was calculated','Density-functional theory (PBE) with the climbing-image nudged elastic band method: one lithium ion in a 3 × 3 × 3 supercell of fixed sulfur, with a uniform background charge for the extra electron. Only the lithium was allowed to move. The points on each curve are the band’s images.'],
  ['Why a bare lattice','With no other cations present, the arrangement of the sulfur is the only thing that varies, which is the point of the experiment. Real crystals add repulsion from other cations, usually strongest at the top of the hop, so their barriers come out higher: LGPS measures 0.22–0.25 eV against 0.15 here.'],
  ['From barrier to conductivity','Conductivity scales roughly as exp(−Eₐ/kT), and kT is 0.026 eV at room temperature. The bare factor between 0.15 and 0.39 eV is about 10⁴; the paper states the difference as about three orders of magnitude.'],
  ['Every site and link','Switch to “Every site and link” to see why this matters beyond one hop. In bcc the tetrahedral sites form one connected network; in fcc none of them touch; in hcp they pair up. The paper’s design rule rests on that difference.']],
 volume:[['Why volume matters','A larger volume per sulfur means wider doorways between sites. The paper scanned 28.5 to 70.8 Å³, the range of lithium sulfides in the Inorganic Crystal Structure Database.'],
  ['Three regimes in fcc and hcp','I: squeezed, the octahedral site is the stable one and the way out is a tight triangle. II: the tetrahedral site takes over and the barrier drops, but the crossover makes it rise again. III: the octahedral site is no longer stable and lithium passes it without stopping. bcc needs none of this: its tetrahedral sites are linked directly at every volume.'],
  ['Real crystals on the plot','The stars are measured activation energies the paper quotes with a volume: Li₇P₃S₁₁ (0.18 eV) and LGPS (0.22 eV) lie just above the bcc curve; γ-Li₃PS₄ (0.49 eV) and Li₄GeS₄ (0.53 eV), both hcp-like, lie near the hcp T–O–T barrier.'],
  ['How the curves were read','Figure 3’s points were read from the PDF’s vector markers. The full energy paths at each volume come from Supplementary Figures S4–S6, which are raster images; each marker was found by its colour and checked against Figure 3, to within 0.008 eV.']],
 crystals:[['How the matching works','The paper’s algorithm, in the pymatgen library, searches for a supercell of an ideal bcc, fcc or hcp lattice that can be stretched slightly onto the crystal’s cell, then pairs each sulfur with a lattice point. R is the root-mean-square distance between the pairs. For LGPS the paper reports a = b = 4.35 Å, c = 4.20 Å and R = 0.58 Å.'],
  ['Partly filled sites','Diffraction sees lithium as smeared over more sites than there are ions: some LGPS sites are filled 64% or 69% of the time on average, and germanium and phosphorus share one site. The fading on the green spheres shows that average, not a snapshot.'],
  ['What Figure 4 adds','Simulations at 900 K show where lithium spends its time. In LGPS it spreads along channels through tetrahedral sites; in Li₇P₃S₁₁ it forms a 3D network; in Li₂S it stays on isolated sites; in Li₄GeS₄ it pairs up, as in hcp.'],
  ['Only a few are close to bcc','Screening the database (Figure 5), only 25 lithium sulfides without transition metals match bcc at all, most of them badly. LGPS and Li₇P₃S₁₁ are among the few that match well, which is why such fast conductors are rare.']]
};

// ————— Paper view —————
const showingPaper=()=>state.display!=='model';
function figureFor(key){const f=FIGURES[key],img=$('paper-image'),src=BASE+f.file;swapFigure(img,key,src,()=>{img.width=f.width;img.height=f.height;img.alt=`Original ${f.title}.`;sizeFigure();const v=figureViews[key];$('paper-viewport').scrollTo(v.x,v.y);});$('paper-original').href=src;$('paper-caption').textContent=f.caption;}
const shownFigure=()=>FIGURES[$('paper-image').dataset.key]?$('paper-image').dataset.key:state.display;
function saveFigure(){if(showingPaper()){const v=figureViews[shownFigure()],p=$('paper-viewport');v.x=p.scrollLeft;v.y=p.scrollTop;}}
function sizeFigure(){
 if(!showingPaper())return;
 const p=$('paper-viewport'),img=$('paper-image'),k=shownFigure(),v=figureViews[k],f=FIGURES[k],st=$('stage');
 const open=state.opening||st.classList.contains('is-emerging');
 const room=fitStage(st,open?null:{w:f.width,h:f.height,cap:1},{view:$('paper-view'),opening:open})??p.clientHeight;
 const fit=Math.min(p.clientWidth,room*(f.width/f.height),f.width);
 img.style.width=Math.max(1,fit*v.zoom)+'px';p.classList.toggle('zoomed',v.zoom>1);
 $('figure-out').disabled=v.zoom<=1;$('figure-in').disabled=v.zoom>=4;
 $('figure-help').textContent=v.zoom===1?'Original figure · Wang et al. 2015 · © Macmillan':'Drag or scroll to inspect · '+Math.round(v.zoom*100)+'%';
}
function zoomFigure(factor){
 const p=$('paper-viewport'),v=figureViews[shownFigure()],old=v.zoom;
 const c=[(p.scrollLeft+p.clientWidth/2)/p.scrollWidth,(p.scrollTop+p.clientHeight/2)/p.scrollHeight];
 v.zoom=factor===0?1:Math.max(1,Math.min(4,v.zoom*factor));if(v.zoom===old)return;
 sizeFigure();p.scrollTo(c[0]*p.scrollWidth-p.clientWidth/2,c[1]*p.scrollHeight-p.clientHeight/2);saveFigure();
}

// ————— SVG helpers —————
const el=(tag,attrs={},text)=>{const n=document.createElementNS(SVGNS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);if(text!=null)n.textContent=text;return n;};
const path=pts=>'M'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L');
// Series colours follow Fig. 3's legend: bcc green, fcc red, hcp blue (T–T dotted), hcp O–O pale.
const SERIES={bcc_TT:{c:'#43c06c',label:'bcc T–T'},fcc_TOT:{c:'#f0575a',label:'fcc T–O–T'},hcp_TOT:{c:'#8f9cf0',label:'hcp T–O–T'},hcp_TT:{c:'#8f9cf0',dash:'2 3',label:'hcp T–T'},hcp_OO:{c:'#d4d8e4',dash:'1 3',label:'hcp O–O'}};
const key=()=>`${state.lattice}_${state.route}`;
const marker=()=>{const g=el('g',{class:'marker'});g.append(el('line',{stroke:'#fff','stroke-opacity':.35,'stroke-dasharray':'2 3'}),el('circle',{r:5.5,fill:'none',stroke:'#fff','stroke-width':2}),el('circle',{r:2.2,fill:'#fff'}));return g;};
function placeMarker(g,x,y,top,bottom){g.setAttribute('transform',`translate(${x.toFixed(1)},0)`);const l=g.querySelector('line');l.setAttribute('y1',top);l.setAttribute('y2',bottom);g.querySelectorAll('circle').forEach(c=>c.setAttribute('cy',y.toFixed(1)));}
// Waypoint names under the energy axis: the sites the lithium starts, stops and ends in.
const WAYPOINTS={bcc_TT:['T1','T2'],fcc_TOT:['T1','O1','T2'],hcp_TOT:['T1','O1','T2'],hcp_TT:['T1','T3'],hcp_OO:['O1','O2']};

// Hop: the energy along the chosen path, with the other Fig. 2 paths faint behind it. All are single-lithium energies
// relative to the same tetrahedral starting site, so they share one axis, as they do in the printed figure.
const HP={w:420,h:186,l:36,r:410,t:14,b:142,ymax:.5};
const hx=s=>HP.l+(HP.r-HP.l)*s,hy=e=>HP.b-(HP.b-HP.t)*e/HP.ymax;
function buildHopPlot(){
 const box=$('plot');box.innerHTML='';
 const svg=el('svg',{viewBox:`0 0 ${HP.w} ${HP.h}`,role:'img',id:'hop-svg'});
 for(const e of [0,.1,.2,.3,.4,.5]){svg.append(el('line',{x1:HP.l,x2:HP.r,y1:hy(e),y2:hy(e),stroke:'#fff','stroke-opacity':e?.07:.28}));svg.append(el('text',{x:HP.l-7,y:hy(e)+4,'text-anchor':'end','font-size':11,fill:'#8f9bb3'},e.toFixed(1)));}
 for(const [k,s] of Object.entries(SERIES)){const pts=pathPoints(CURVES,VP,...k.split('_'));const g=el('g',{class:'series','data-key':k});
  g.append(el('path',{d:path(pts.map(p=>[hx(p.s),hy(p.energy_eV)])),fill:'none',stroke:s.c,'stroke-width':1.6,...(s.dash?{'stroke-dasharray':s.dash}:{})}));
  for(const p of pts)g.append(el('circle',{cx:hx(p.s),cy:hy(p.energy_eV),r:2.6,fill:s.c}));
  const top=pts.reduce((a,p)=>p.energy_eV>a.energy_eV?p:a);g.append(el('text',{class:'peak',x:hx(top.s),y:hy(top.energy_eV)-9,'text-anchor':'middle','font-size':12,fill:'#eef2fb','font-weight':600},CURVES.figure2[k].barrier_eV.toFixed(2)+' eV'+(k==='hcp_OO'?' (from O1)':'')));
  svg.append(g);}
 svg.append(el('g',{class:'waypoints'}));
 svg.append(el('text',{x:(HP.l+HP.r)/2,y:HP.h-4,'text-anchor':'middle','font-size':11,fill:'#8f9bb3'},'Along the path →'));
 svg.append(marker());box.append(svg);
 const note=document.createElement('p');note.className='plot-axis-note';note.id='plot-note';box.append(note);
}
// Volume: Fig. 3's barriers against volume beside the chosen path's energy at the chosen volume.
const VB={w:200,h:156,l:30,r:194,t:12,b:118,ymax:1.15,vmin:25,vmax:72};
const vx=v=>VB.l+(VB.r-VB.l)*(v-VB.vmin)/(VB.vmax-VB.vmin),vy=e=>VB.b-(VB.b-VB.t)*e/VB.ymax;
const PB={w:200,h:156,l:30,r:194,t:12,b:118,ymax:1.15};
const px=s=>PB.l+(PB.r-PB.l)*s,py=e=>PB.b-(PB.b-PB.t)*e/PB.ymax;
function buildVolumePlot(){
 const box=$('plot');box.innerHTML='';const pair=document.createElement('div');pair.className='plot-pair';
 const frame=(svg,P,yf)=>{for(const e of [0,.25,.5,.75,1]){svg.append(el('line',{x1:P.l,x2:P.r,y1:yf(e),y2:yf(e),stroke:'#fff','stroke-opacity':e?.07:.28}));if(e*4%2===0)svg.append(el('text',{x:P.l-6,y:yf(e)+4,'text-anchor':'end','font-size':10,fill:'#8f9bb3'},e.toFixed(1)));}};
 const c1=document.createElement('div');c1.className='plot-card';c1.innerHTML='<span class="plot-title">Barrier against volume · Fig. 3</span>';
 const s1=el('svg',{viewBox:`0 0 ${VB.w} ${VB.h}`,role:'img',id:'vol-svg','aria-label':'Barrier against volume per sulfur for every path, with measured activation energies of real crystals as stars'});
 const tint={I:'#ef6a5e',II:'#58c77a',III:'#7e8ce0'};
 for(const r of REGIMES){const x0=vx(Math.max(VB.vmin,r.from)),x1=vx(Math.min(VB.vmax,r.to));s1.append(el('rect',{class:'regime','data-regime':r.id,x:x0,y:VB.t,width:x1-x0,height:VB.b-VB.t,fill:tint[r.id],'fill-opacity':.07}));s1.append(el('text',{x:(x0+x1)/2,y:VB.t+11,'text-anchor':'middle','font-size':10,fill:'#a9b4ca','letter-spacing':'.06em'},r.id));}
 frame(s1,VB,vy);
 for(const v of [30,40,50,60,70])s1.append(el('text',{x:vx(v),y:VB.b+13,'text-anchor':'middle','font-size':10,fill:'#8f9bb3'},v));
 s1.append(el('text',{x:(VB.l+VB.r)/2,y:VB.h-4,'text-anchor':'middle','font-size':10,fill:'#8f9bb3'},'Å³ per sulfur'));
 for(const [k,s] of Object.entries(SERIES)){const ser=VP.paths[k].series.filter(x=>x.barrier_eV!=null),g=el('g',{class:'series','data-key':k});
  g.append(el('path',{d:path(ser.map(x=>[vx(x.volume_A3),vy(x.barrier_eV)])),fill:'none',stroke:s.c,'stroke-width':1.5,...(s.dash?{'stroke-dasharray':s.dash}:{})}));
  for(const x of ser)g.append(el('circle',{cx:vx(x.volume_A3),cy:vy(x.barrier_eV),r:2.4,fill:s.c}));s1.append(g);}
 const star=(x,y,r=4.2)=>{let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;d+=(i?'L':'M')+(x+rr*Math.cos(a)).toFixed(1)+','+(y+rr*Math.sin(a)).toFixed(1);}return d+'Z';};
 for(const st of STARS)s1.append(el('path',{d:star(vx(st.V),vy(st.E)),fill:'none',stroke:'#fff','stroke-width':.9,'stroke-opacity':.85},null));
 const vm=el('g',{class:'vmarker'});vm.append(el('line',{y1:VB.t,y2:VB.b,stroke:'#fff','stroke-opacity':.4,'stroke-dasharray':'2 3'}),el('circle',{r:5,fill:'none',stroke:'#fff','stroke-width':2}));s1.append(vm);
 c1.append(s1);
 const c2=document.createElement('div');c2.className='plot-card';c2.innerHTML='<span class="plot-title" id="path-title">Energy along the path</span>';
 const s2=el('svg',{viewBox:`0 0 ${PB.w} ${PB.h}`,role:'img',id:'path-svg'});frame(s2,PB,py);
 s2.append(el('path',{class:'ref',fill:'none',stroke:SERIES.bcc_TT.c,'stroke-width':1.3,'stroke-opacity':.4}),el('path',{class:'cur',fill:'none','stroke-width':1.7}),el('g',{class:'pts'}),el('g',{class:'waypoints'}),el('text',{class:'empty',x:(PB.l+PB.r)/2,y:(PB.t+PB.b)/2,'text-anchor':'middle','font-size':11,fill:'#a9b4ca'},''));
 s2.append(el('text',{x:(PB.l+PB.r)/2,y:PB.h-4,'text-anchor':'middle','font-size':10,fill:'#8f9bb3'},'Along the path →'));
 s2.append(marker());c2.append(s2);pair.append(c1,c2);box.append(pair);
 const note=document.createElement('p');note.className='plot-axis-note';note.id='plot-note';box.append(note);
}
let plotKind='';
function waypointLabels(g,k,xf,y){g.innerHTML='';const names=WAYPOINTS[k];names.forEach((n,i)=>g.append(el('text',{x:xf(i/(names.length-1)),y,'text-anchor':i===0?'start':i===names.length-1?'end':'middle','font-size':10.5,fill:n[0]==='O'?'#f39a92':'#8fdcaa','font-weight':500},n)));}
function updatePlots(){
 const q=state.question,kind=q==='crystals'?'none':q;
 if(kind!==plotKind){plotKind=kind;if(kind==='hop')buildHopPlot();else if(kind==='volume')buildVolumePlot();else $('plot').innerHTML='';}
 const k=key(),s=shownProgress();
 if(kind==='hop'){
  const svg=$('hop-svg');svg.querySelectorAll('.series').forEach(g=>{const on=g.dataset.key===k;g.style.opacity=on?1:.16;g.querySelector('.peak').style.display=on?'':'none';if(on)svg.insertBefore(g,svg.querySelector('.waypoints'));});
  waypointLabels(svg.querySelector('.waypoints'),k,hx,HP.b+15);
  const pts=pathPoints(CURVES,VP,state.lattice,state.route);placeMarker(svg.querySelector('.marker'),hx(s),hy(curveAt(pts,s)),HP.t,HP.b);
  svg.setAttribute('aria-label',`Energy along the ${SERIES[k].label} path at 40 Å³ per sulfur, barrier ${CURVES.figure2[k].barrier_eV.toFixed(2)} eV, with the other paths faint`);
  $('plot-note').textContent='Energy of one lithium ion in eV, measured from a tetrahedral site. Points as printed in Figure 2; the faint curves are the other paths.';
 }else if(kind==='volume'){
  const V=VOLUMES[state.volume],svg=$('vol-svg');svg.querySelectorAll('.series').forEach(g=>{const on=g.dataset.key===k;g.style.opacity=on?1:.22;if(on)svg.insertBefore(g,svg.querySelector('.vmarker'));});
  svg.querySelectorAll('.regime').forEach(r=>r.setAttribute('fill-opacity',state.lattice==='bcc'?.04:r.dataset.regime===regimeOf(V)?.16:.06));
  const b=barrierAt(VP,state.lattice,state.route,state.volume),vm=svg.querySelector('.vmarker');vm.setAttribute('transform',`translate(${vx(V).toFixed(1)},0)`);const c=vm.querySelector('circle');c.style.display=b==null?'none':'';if(b!=null)c.setAttribute('cy',vy(b).toFixed(1));
  const ps=$('path-svg'),pts=pathPoints(CURVES,VP,state.lattice,state.route,state.volume),ref=state.lattice==='bcc'?null:pathPoints(CURVES,VP,'bcc','TT',state.volume),S=SERIES[k];
  ps.querySelector('.ref').setAttribute('d',ref?path(ref.map(p=>[px(p.s),py(p.energy_eV)])):'');
  const cur=ps.querySelector('.cur');cur.setAttribute('d',pts?path(pts.map(p=>[px(p.s),py(p.energy_eV)])):'');cur.setAttribute('stroke',S.c);if(S.dash)cur.setAttribute('stroke-dasharray',S.dash);else cur.removeAttribute('stroke-dasharray');
  const g=ps.querySelector('.pts');g.innerHTML='';if(pts)for(const p of pts)g.append(el('circle',{cx:px(p.s),cy:py(p.energy_eV),r:2.3,fill:S.c}));
  ps.querySelector('.empty').textContent=pts?'':'Not computed at this volume';
  waypointLabels(ps.querySelector('.waypoints'),k,px,PB.b+13);
  const m=ps.querySelector('.marker');m.style.display=pts?'':'none';if(pts)placeMarker(m,px(s),py(curveAt(pts,s)),PB.t,PB.b);
  $('path-title').textContent=`${S.label} at ${V} Å³`;
  ps.setAttribute('aria-label',pts?`Energy along the ${S.label} path at ${V} Å³ per sulfur, barrier ${fmt(barrierOfPts(pts))} eV${ref?', with bcc at the same volume faint':''}`:'Not computed at this volume');
  $('plot-note').textContent=`Energies in eV. Left: barriers as printed in Figure 3, regimes I–III shaded, stars for measured crystals. Right: the path from Supplementary Fig. S${state.lattice==='bcc'?4:state.lattice==='fcc'?5:6}${ref?', bcc faint for comparison':''}.`;
 }
}
const barrierOfPts=pts=>Math.max(...pts.map(p=>p.energy_eV))-pts[0].energy_eV;
const shownProgress=()=>scene&&state.question!=='crystals'?scene.view.progress:state.progress;

// ————— Labels anchored to the 3D scene —————
// Few and rigid: each names one thing in the model and travels with it; nothing slides or re-flows as the lithium moves.
// Words keep off the stage furniture and off the sulfur spheres around the path.
const notes=new Annotations($('stage'),{className:'lattice-notes',avoid:()=>{const st=$('stage').getBoundingClientRect(),out=[...$('stage').querySelectorAll('.scene-key,.stage-bar')].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return {x:r.left-st.left-6,y:r.top-st.top-6,w:r.width+12,h:r.height+12};});
 if(scene&&!showingPaper()){const pp=scene.pixelsPerAngstrom();for(const p of scene.nearSulfur()){const q=scene.project(p);out.push({x:q.x,y:q.y,r:.42*pp+4});}
  for(const p of scene.nearLithium()){const q=scene.project(p);out.push({x:q.x,y:q.y,r:.3*pp+3});}
  for(const t of siteTags)if(t.classList.contains('on')){const r=t.getBoundingClientRect();out.push({x:r.left-st.left-4,y:r.top-st.top-3,w:r.width+8,h:r.height+6});}}return out;}});
let notesKey='';
function noteSpecs(sc){
 const list=[];if(showingPaper()||failed||(state.opening&&state.beat!=null&&state.beat<3))return list;
 const pp=()=>sc.pixelsPerAngstrom(),at=(f,r=.3)=>()=>{const p=f();if(!p)return null;const q=sc.project(p);return {x:q.x,y:q.y,r:r*pp()};};
 const q=state.question;
 if(q==='crystals'){
  if(state.crystal==='lgps'&&state.step===2){const i=LG.S_bcc.reduce((b,p,j)=>p[1]>LG.S_bcc[b][1]?j:b,0);list.push({id:'bcc',title:'bcc lattice',note:`Sulfur moved ${LG.match.R_A.toFixed(2)} Å (rms)`,tone:PALETTE.bcc,at:at(()=>LG.S_bcc[i],.42),dir:[1,-.8],phone:'note'});}
  if(state.step===3){const p=state.crystal==='lgps'?LG.bcc_T[LG.bcc_T.reduce((b,x,j)=>x[1]>LG.bcc_T[b][1]&&Math.abs(x[0])<3?j:b,0)]:DATA.li2s.O_empty.reduce((b,x)=>x[1]+.4*x[0]>b[1]+.4*b[0]?x:b);
   list.push({id:'sites-'+state.crystal,title:state.crystal==='lgps'?'bcc tetrahedral sites':'Empty octahedral site',note:state.crystal==='lgps'?'Linked face to face':'The only way between full sites',tone:state.crystal==='lgps'?PALETTE.tet:PALETTE.oct,at:at(()=>p,.2),dir:[1,-.7],phone:state.crystal==='lgps'?'note':'title'});}
  return list;
 }
 if(state.view==='network'&&q==='hop'){return list;}
 const k=key(),door=()=>sc.doorCentre(state.route==='TOT'?0:0);
 list.push({id:'door-'+k,title:'Shared face',note:state.route==='TOT'?'First of two doorways':'Three sulfurs: the doorway',tone:'#e9fff0',at:at(door,.18),dir:state.lattice!=='hcp'?[-1,-.9]:state.route==='OO'?[1,.9]:[-1,.8],phone:'title'});
 if(state.route==='TOT'){const site=siteEnergyAt(VP,state.lattice,'TOT',q==='volume'?state.volume:V0_INDEX),b=barrierAt(VP,state.lattice,'TOT',q==='volume'?state.volume:V0_INDEX);
  const words=site==null?'':site<0?`${fmt(-site)} eV below T: the stable site`:Math.abs(site-b)<.005?'No longer a resting place':`+${fmt(site)} eV: a costly stop`;
  list.push({id:'oct-'+k,title:'Octahedral site',note:words,tone:'#ff9b92',at:at(()=>sc.siteCentre(1),.35),dir:[1,-.8],phone:'title',live:true});}
 return list;
}
// Site names (T1, O1, T2 …) as in the paper's Fig. 2, fixed to each site so they turn with the lattice.
const siteTags=[0,1,2].map(()=>{const t=document.createElement('span');t.className='label site-tag';$('scene-labels').append(t);return t;});
function placeTags(sc){
 const on=!showingPaper()&&!failed&&state.question!=='crystals'&&!(state.question==='hop'&&state.view==='network')&&!(state.opening&&state.beat!=null&&state.beat<3);
 const names=WAYPOINTS[key()],pp=sc.pixelsPerAngstrom();
 siteTags.forEach((t,i)=>{const name=names[i],show=on&&!!name&&sc.view[state.lattice]>.98;t.classList.toggle('on',show);if(!name)return;
  if(t.textContent!==name){t.textContent=name;t.classList.toggle('oct',name[0]==='O');}
  if(!show)return;const p=sc.siteCentre(i);if(!p)return;const q=sc.project(p),w=t.offsetWidth,h=t.offsetHeight;
  t.style.transform=`translate(${(q.x+.34*pp+4).toFixed(1)}px,${(q.y+.34*pp+2-h/2).toFixed(1)}px)`;});
}
function placeLabels(sc){placeTags(sc);const list=noteSpecs(sc),k=JSON.stringify(list.map(x=>[x.id,x.title,x.note]));if(k!==notesKey){notesKey=k;notes.show(list);}notes.frame();}
function sceneKey(){
 const dot=(c,t,cls='')=>`<span><i class="${cls}" style="background:${c}"></i>${t}</span>`,q=state.question;let html='';
 if(q==='crystals'){
  if(state.crystal==='lgps')html=state.step===0?dot(PALETTE.sulfur,'S²⁻')+dot(PALETTE.li,'Li⁺')+dot(PALETTE.ps4,'PS₄','cage')+dot(PALETTE.ges4,'GeS₄','cage'):state.step===1?dot(PALETTE.sulfur,'S²⁻'):state.step===2?dot(PALETTE.sulfur,'S²⁻ on bcc points')+dot(PALETTE.bcc,'bcc lattice','line'):dot(PALETTE.li,'Li⁺')+dot(PALETTE.tet,'bcc T site','small')+dot(PALETTE.bcc,'bcc lattice','line');
  else html=state.step<3?dot(PALETTE.sulfur,'S²⁻')+(state.step===0?dot(PALETTE.li,'Li⁺'):'')+(state.step===2?dot(PALETTE.bcc,'fcc cell','line'):''):dot(PALETTE.li,'Li⁺ on T sites')+dot(PALETTE.oct,'Empty O site','small');
 }else if(state.view==='network'&&q==='hop')html=dot(PALETTE.tet,'T site','small')+(state.lattice==='bcc'?'':dot(PALETTE.oct,'O site','small'))+dot(PALETTE.tet,'Shared face','line');
 else html=dot(PALETTE.sulfur,'S²⁻')+dot(state.lattice==='hcp'&&state.route==='TT'?PALETTE.tt:state.lattice==='hcp'&&state.route==='OO'?'#f08a3c':PALETTE.li,'Li⁺')+dot(PALETTE.tet,'T site','cage')+(state.route==='TT'?'':dot(PALETTE.oct,'O site','cage'));
 $('scene-key').innerHTML=html;$('scene-key').style.opacity=state.opening&&state.beat!=null&&state.beat<3?0:1;
}

// ————— Camera poses —————
const T3=window.THREE;
let POSES=null;
function buildPoses(){
 const Q=(right,up)=>{const r=new T3.Vector3(...right).normalize(),u=new T3.Vector3(...up).normalize(),b=new T3.Vector3().crossVectors(r,u);return new T3.Quaternion().setFromRotationMatrix(new T3.Matrix4().makeBasis(r,u,b));};
 const turn=(q,yaw,pitch)=>{const up=new T3.Vector3(0,1,0).applyQuaternion(q),right=new T3.Vector3(1,0,0).applyQuaternion(q);return new T3.Quaternion().setFromAxisAngle(up,yaw).multiply(new T3.Quaternion().setFromAxisAngle(right,pitch)).multiply(q.clone()).normalize();};
 const centroid=pts=>{const c=[0,0,0];for(const p of pts)for(let i=0;i<3;i++)c[i]+=p[i]/pts.length;return new T3.Vector3(...c);};
 const RATIO=12.6;// camera distance over half-height: the perspective of the paper's renders
 const pose=(quat,target,halfHeight)=>({quat,target,halfHeight,dist:RATIO*halfHeight});
 // bcc: the paper's own viewpoint (Fig. 2a), turned 22° so the shared face reads in depth.
 const bccQ=turn(scene.paperQuat.clone(),-.38,0),fccQ=turn(Q([1,0,0],[0,1,0]),-.5,.2),hcpQ=turn(Q([0,0,-1],[0,1,0]),-.35,.16);
 const L=DATA.lattices,out={};
 for(const [name,q] of [['bcc',bccQ],['fcc',fccQ],['hcp',hcpQ]])for(const r of ROUTES[name]){const p=L[name].paths[r].points;out[name+'_'+r]=pose(q,centroid(p).add(new T3.Vector3(0,name==='bcc'?.45:.2,0)),name==='bcc'?4.6:r==='TOT'?4.6:r==='OO'?5.1:4.2);}
 for(const [name,q] of [['bcc',bccQ],['fcc',fccQ],['hcp',hcpQ]])out[name+'_net']=pose(turn(q,-.15,.12),new T3.Vector3(0,0,0),name==='hcp'?7.6:6.4);
 out.lgps=pose(turn(Q([1,0,0],[0,1,0]),-.42,.18),new T3.Vector3(0,.5,0),9.2);
 out.li2s=pose(turn(Q([1,0,0],[0,1,0]),-.5,.22),new T3.Vector3(0,0,0),4.6);
 return out;
}
function poseFor(s=state){
 if(!POSES)return null;let p;
 if(s.question==='crystals')p=POSES[s.crystal];
 else if(s.question==='hop'&&s.view==='network')p=POSES[s.lattice+'_net'];
 else p=POSES[s.lattice+'_'+s.route];
 // The camera follows the volume only a little, so squeezing and stretching the lattice is seen, not compensated.
 const k=s.question==='volume'?1+(scaleFor(s.volume)-1)*.3:1;
 return {quat:p.quat.clone(),target:p.target.clone().multiplyScalar(k),halfHeight:p.halfHeight*k,dist:p.dist*k};
}

// ————— Sync: one state for every visible part —————
let lastCaption='';
function caption(){
 if(state.opening&&state.beat!=null)return OPENING[state.beat];
 if(showingPaper()){const f=FIGURES[state.display];return {kicker:'Wang et al. 2015 · '+f.title.split(' · ')[0],title:f.heading,copy:'',note:''};}
 if(state.question==='crystals')return {...CRYSTAL[state.crystal][state.step],note:CRYSTAL_NOTE[state.crystal]};
 if(state.question==='volume')return {...volumeWords(),note:VOLUME_NOTE};
 if(state.view==='network')return {...NETWORK[state.lattice],note:NET_NOTE};
 return {...HOP[key()],note:HOP_NOTE};
}
function referenceKey(){return state.question==='hop'?state.lattice:state.question==='crystals'?state.crystal:state.question;}
function sync(){
 scene?.setState(state);
 const paper=showingPaper(),c=caption(),stage=$('stage'),q=state.question;
 stage.classList.toggle('showing-paper',paper);stage.classList.toggle('opening',state.opening);document.body.classList.toggle('exploring',!state.opening);
 const ck=c.kicker+c.title+c.copy;
 if(ck!==lastCaption){const fresh=(c.kicker+c.title)!==(lastCaption.split('\u0000')[0]);$('caption-kicker').textContent=c.kicker;$('caption-title').textContent=c.title;$('caption-copy').textContent=c.copy;$('caption-copy').hidden=!c.copy;const cap=document.querySelector('.caption');if(fresh){cap.classList.remove('changing');void cap.offsetWidth;if(lastCaption&&!state.reduced)cap.classList.add('changing');}lastCaption=c.kicker+c.title+'\u0000'+c.copy;}
 $('caption-note').textContent=paper?'':c.note||'';
 $('paper-details').hidden=!paper||state.opening;$('controls').classList.toggle('dimmed',state.opening);
 if(paper){figureFor(state.display);sizeFigure();}else fitStage($('stage'),null);
 all('[data-question]').forEach(b=>{const on=b.dataset.question===q;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
 $('inspection').setAttribute('aria-labelledby','tab-'+q);
 const offered=DISPLAYS[q];
 all('[data-display]').forEach(b=>{b.hidden=!offered.includes(b.dataset.display)&&b.dataset.display!==state.display;b.setAttribute('aria-pressed',String(b.dataset.display===state.display));});
 const crystals=q==='crystals';
 $('lattice-block').hidden=crystals;$('route-block').hidden=crystals||state.lattice!=='hcp';$('volume-block').hidden=q!=='volume';
 $('plot').hidden=crystals||(q==='hop'&&state.view==='network');$('transport-block').hidden=crystals||(q==='hop'&&state.view==='network');$('readout').hidden=crystals&&false;
 $('view-block').hidden=q!=='hop';$('crystal-block').hidden=!crystals;
 all('[data-lattice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lattice===state.lattice)));
 all('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===state.route)));
 all('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===state.view)));
 all('[data-crystal]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.crystal===state.crystal)));
 all('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.step===state.step)));
 $('step-3-label').textContent=state.crystal==='lgps'?'Snap to bcc':'Exact fcc';
 $('volume').value=state.volume;$('volume-value').value=VOLUMES[state.volume].toFixed(1)+' Å³';
 $('progress').value=Math.round(state.progress*1000);
 $('play').setAttribute('aria-label',state.playing?'Pause':state.progress>=1?'Replay':'Play the hop');$('play').innerHTML=state.playing?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9.5-5.5z"/></svg>';
 const ref=REFERENCES[referenceKey()];$('reference').hidden=!ref||paper;
 if(ref){if(!$('reference-image').src.endsWith(ref.file))$('reference-image').src=BASE+ref.file;$('reference-image').alt=ref.caption.replace(/ Open.*$/,'');$('reference-caption').textContent=ref.caption;$('reference-open').dataset.figure=ref.figure;}
 $('opening-controls').hidden=!state.opening;$('opening-pause').textContent=state.openingPaused?'Resume':'Pause';$('opening-pause').setAttribute('aria-pressed',String(state.openingPaused));
 $('figure-tools').hidden=!paper||state.opening;const cam=state.display==='model'&&!state.opening&&!failed;$('camera-controls').hidden=!cam;$('scene-help').hidden=!cam;
 sceneKey();depth();readout();updatePlots();
 if(failed&&state.display==='model'){state.display=DISPLAYS[q].find(d=>d!=='model');sync();return;}
 managePlay();
}
function whereOnPath(s){
 const names=WAYPOINTS[key()],n=names.length-1,x=s*n,i=Math.round(x);
 if(Math.abs(x-i)<.1)return `in ${names[i]}`;
 return `crossing the face between ${names[Math.floor(x)]} and ${names[Math.floor(x)+1]}`;
}
function readout(){
 const q=state.question,s=shownProgress();let html='';
 if(q==='hop'&&state.view==='network'){const n=NET[state.lattice];html=state.lattice==='bcc'?`<strong>${n.T} T sites, ${n.clusters===1?'one network':n.clusters+' networks'}</strong><span>Every tetrahedral site reaches every other through shared faces</span>`:state.lattice==='fcc'?`<strong>${n.T} T sites, none linked</strong><span>Each tetrahedral site shares faces only with octahedral ones</span>`:`<strong>${n.T} T sites in pairs</strong><span>Face-sharing pairs along c, joined to each other only through octahedral sites</span>`;}
 else if(q==='hop'){const pts=pathPoints(CURVES,VP,state.lattice,state.route),e=curveAt(pts,s),b=CURVES.figure2[key()].barrier_eV;
  html=`<strong>${fmt(e)} eV</strong> above a T site<span>Lithium ${state.playing?'on its way':whereOnPath(s)} · barrier ${fmt(b)} eV</span>`;}
 else if(q==='volume'){const pts=pathPoints(CURVES,VP,state.lattice,state.route,state.volume),V=VOLUMES[state.volume],b=barrierAt(VP,state.lattice,state.route,state.volume);
  const door=DATA.lattices[state.lattice].paths[state.route].doorway_A[0]*scaleFor(state.volume);
  html=pts?`<strong>${fmt(curveAt(pts,s))} eV</strong> at this point<span>${V} Å³${state.lattice==='bcc'?'':' · regime '+regimeOf(V)} · barrier ${fmt(b)} eV · doorway ${door.toFixed(2)} Å to each S</span>`:`<strong>Not computed</strong><span>The paper has the O → O path at 28.5–40 Å³ only</span>`;}
 else{const L=state.crystal==='lgps';html=state.step<2?(L?`<strong>${LG.S.length} S, ${LG.li.length} Li sites</strong><span>One tetragonal cell, ${LG.cell_A[0].toFixed(2)} × ${LG.cell_A[1].toFixed(2)} × ${LG.cell_A[2].toFixed(2)} Å</span>`:`<strong>${DATA.li2s.S.length} S, ${DATA.li2s.li.length} Li</strong><span>One cubic cell, a = ${DATA.li2s.cell_A.toFixed(2)} Å</span>`)
  :state.step===2?(L?`<strong>R = ${LG.match.R_A.toFixed(2)} Å</strong><span>rms move onto bcc (paper: 0.58 Å) · largest ${MAXMOVE.toFixed(2)} Å</span>`:'<strong>R = 0.00 Å</strong><span>The sulfur is exactly fcc</span>')
  :(L?`<strong>Median ${LIMED.toFixed(2)} Å</strong><span>lithium site to nearest bcc T site · max ${LIMAX.toFixed(2)} Å</span>`:'<strong>8 of 8 T sites full</strong><span>Linked only through empty octahedral sites</span>');}
 $('readout').innerHTML=html;$('progress-value').value=s.toFixed(2);
}
let depthKey='';
function depth(){const q=state.question;if(q===depthKey)return;depthKey=q;$('depth-argument').innerHTML=DEPTH[q].map(([h,p])=>`<details><summary>${h}</summary><p>${p}</p></details>`).join('');}
function onFrame(sc){placeLabels(sc);if(state.question!=='crystals'){updatePlots();readout();}}

// ————— Actions —————
function stopOpening(){
 if(!state.opening)return;openingStop?.();openingStop=null;emergence.cancel();
 state=reduce(state,{type:'stop-opening'});state.beat=null;if(scene)scene.moveTo(poseFor(),700);
}
function dispatch(action){
 if(state.opening)stopOpening();
 const before=state;state=reduce(state,action);
 const moved=['question','lattice','route','view','volume','crystal'].includes(action.type)&&scene&&JSON.stringify([before.question,before.lattice,before.route,before.view,before.volume,before.crystal])!==JSON.stringify([state.question,state.lattice,state.route,state.view,state.volume,state.crystal]);
 if(moved){const cross=before.question!==state.question||before.lattice!==state.lattice||before.crystal!==state.crystal;scene.moveTo(poseFor(),action.type==='volume'?700:cross?1200:1000);}
 if(before.display!==state.display&&before.display!=='model')saveFigure();
 sync();
 if(before.display!==state.display&&state.display==='model')scene?.wake();
}
function setDisplay(key){
 if(state.opening)stopOpening();
 if(key===state.display){sync();return;}
 saveFigure();state=reduce(state,{type:'display',value:key});sync();
 if(showingPaper())requestAnimationFrame(()=>{if(shownFigure()!==key)return;const v=figureViews[key];$('paper-viewport').scrollTo(v.x,v.y);});else scene?.wake();
}
// Playback: a steady sweep along the path. Its rate is a reading pace, not a physical speed.
const PLAY_SECONDS=5.5;
function managePlay(){
 if(!state.playing){playStop?.();playStop=null;return;}if(playStop)return;
 const tick=(now,dt)=>{if(!state.playing){playStop=null;return false;}const p=clamp(state.progress+dt/PLAY_SECONDS);state={...state,progress:p,playing:p<1};
  $('progress').value=Math.round(p*1000);scene?.setState(state);readout();updatePlots();if(!state.playing){playStop=null;sync();return false;}return true;};
 if(scene)playStop=scene.animate(tick);else{let last=0,run=true;const loop=t=>{if(!run)return;const dt=last?(t-last)/1000:0;last=t;if(tick(t,dt)!==false)requestAnimationFrame(loop);};requestAnimationFrame(loop);playStop=()=>{run=false;};}
}

// ————— Emergence: the printed render of Fig. 2a becomes the live lattice —————
// The figure zooms until panel a's render fills the stage at a measured scale. The camera takes the pose fitted to the
// render's ten printed sulfur spheres (registration/fit-figure-2a.py), at the same distance and pixels per ångström, so
// when the render dissolves the model's sulfur sits on the printed spheres. Then the lattice turns to show its depth.
const emergence={
 active:false,
 cancel(){this.active=false;this.transit?.remove();this.transit=null;$('stage').classList.remove('is-emerging');},
 plan(){const st=$('stage').getBoundingClientRect(),W=st.width,H=st.height,f=FIGURES['2'];
  const S=Math.min(W*.82/INSET.w,(H-70)*.84/INSET.h);
  const insetScreen={x:(W-INSET.w*S)/2,y:(H-56-INSET.h*S)/2,w:INSET.w*S,h:INSET.h*S};
  return {W,H,S,insetScreen,final:{x:insetScreen.x-INSET.x*S,y:insetScreen.y-INSET.y*S,w:f.width*S,h:f.height*S}};},
 pose(plan){
  const v=DATA.paperView,k=plan.insetScreen.w/INSET.nativeW,ppa=v.px_per_A_at_pivot*k;
  const q=scene.paperQuat,right=new T3.Vector3(1,0,0).applyQuaternion(q),up=new T3.Vector3(0,1,0).applyQuaternion(q);
  const sx=plan.insetScreen.x+v.pivot_px[0]*k,sy=plan.insetScreen.y+v.pivot_px[1]*k;
  const target=new T3.Vector3(...v.pivot_A).addScaledVector(right,-(sx-plan.W/2)/ppa).addScaledVector(up,(sy-plan.H/2)/ppa);
  const hEff=plan.H/(2*ppa),halfHeight=hEff/scene.halfHeightFor(1);
  return {quat:q.clone(),target,halfHeight,dist:v.camera_distance_A};
 },
 start(img){
  const st=$('stage'),r=img.getBoundingClientRect(),s=st.getBoundingClientRect();this.plan_=this.plan();
  const box=document.createElement('div');box.className='emerge-transit';box.setAttribute('aria-hidden','true');
  Object.assign(box.style,{left:r.left-s.left+'px',top:r.top-s.top+'px',width:r.width+'px',height:r.height+'px'});
  const copy=new Image();copy.src=img.currentSrc||img.src;copy.alt='';const f=FIGURES['2'],focus=document.createElement('div');focus.className='emerge-focus';
  Object.assign(focus.style,{left:INSET.x/f.width*100+'%',top:INSET.y/f.height*100+'%',width:INSET.w/f.width*100+'%',height:INSET.h/f.height*100+'%'});
  // A native-resolution copy of the embedded render takes over as it grows, so the zoom stays sharp.
  const hi=new Image();hi.src=BASE+'figure-2a-render.webp';hi.alt='';hi.className='emerge-hires';Object.assign(hi.style,{left:focus.style.left,top:focus.style.top,width:focus.style.width,height:focus.style.height});
  box.append(copy,hi,focus);st.append(box);this.transit=box;this.focus=focus;this.hi=hi;this.ratio=r.height/r.width;this.from={x:r.left-s.left,y:r.top-s.top,w:r.width};st.classList.add('is-emerging');this.active=true;
 },
 zoom(u){const a=this.from,b=this.plan_.final,w=a.w+(b.w-a.w)*u;
  Object.assign(this.transit.style,{left:a.x+(b.x-a.x)*u+'px',top:a.y+(b.y-a.y)*u+'px',width:w+'px',height:w*this.ratio+'px'});this.hi.style.opacity=String(smooth(.25,.7,u));
  // The rest of the page folds away around panel a as it arrives, so the handover has nothing left to cut.
  const f=FIGURES['2'],c=smooth(.55,1,u);this.transit.style.clipPath=`inset(${c*INSET.y/f.height*100}% ${c*(100-(INSET.x+INSET.w)/f.width*100)}% ${c*(100-(INSET.y+INSET.h)/f.height*100)}% ${c*INSET.x/f.width*100}%)`;this.focus.style.opacity=String(Math.min(1,u*3)*(1-.7*smooth(.75,1,u)));},
 handover(){scene.travel=null;const p=this.pose(this.plan_);scene.pose={quat:p.quat,target:p.target,halfHeight:p.halfHeight,dist:p.dist};state.display='model';sync();scene.renderNow();
  const f=FIGURES['2'];this.transit.style.clipPath=`inset(${INSET.y/f.height*100}% ${100-(INSET.x+INSET.w)/f.width*100}% ${100-(INSET.y+INSET.h)/f.height*100}% ${INSET.x/f.width*100}%)`;this.focus.style.opacity='0';},
 dissolve(u){if(this.transit)this.transit.style.opacity=String(1-u);},
 done(){this.transit?.remove();this.transit=null;$('stage').classList.remove('is-emerging');this.active=false;}
};
let stageInView=false;if(typeof IntersectionObserver==='function')new IntersectionObserver(e=>{stageInView=e[0].intersectionRatio>=.6;},{threshold:[0,.6,1]}).observe($('stage'));else stageInView=true;
const BUILD_IN=document.documentElement.classList.contains('build-in')?6:0;
if(BUILD_IN){const skip=()=>{for(const an of document.getAnimations())if(/^build-/.test(an.animationName||''))an.finish();for(const ev of ['pointerdown','keydown','wheel','touchstart'])removeEventListener(ev,skip,true);};for(const ev of ['pointerdown','keydown','wheel','touchstart'])addEventListener(ev,skip,{capture:true,passive:true});}
const EMERGE={zoom:2.4,dissolve:1.6,turn:2.6};
function startOpening(){
 if(!state.opening||!scene)return;
 const durations=OPENING.map(readingTime);durations[2]=Math.max(durations[2],EMERGE.dissolve+EMERGE.turn+2.2);durations[3]=PLAY_SECONDS+2.4;durations[0]=Math.min(durations[0],10.5);durations[1]=Math.min(durations[1],EMERGE.zoom+.6+4.6);
 let beat=0,t=0,elapsed=0,waited=false,turnFrom=null;const WORK=poseFor({...state,question:'hop',lattice:'bcc',route:'TT',view:'hop'});
 const enter=b=>{beat=b;t=0;state.beat=b;
  if(b===1)emergence.start($('paper-image'));
  if(b===2){emergence.handover();turnFrom={quat:scene.pose.quat.clone(),target:scene.pose.target.clone(),halfHeight:scene.pose.halfHeight,dist:scene.pose.dist};}
  if(b===3){emergence.done();state.progress=0;}
  sync();};
 state.beat=0;state.display='2';state.progress=0;sync();
 openingStop=scene.animate((now,dt)=>{
  if(!state.opening)return false;if(state.openingPaused||(beat===0&&!stageInView))return true;
  if(!waited){waited=true;durations[0]+=Math.max(0,BUILD_IN-now/1000);}
  t+=dt;elapsed+=dt;$('opening-progress').style.setProperty('--p',clamp(elapsed/durations.reduce((a,b)=>a+b,0)).toFixed(3));
  if(beat===1)emergence.zoom(ease(clamp((t-.6)/EMERGE.zoom)));
  if(beat===2){emergence.dissolve(ease(clamp((t-.5)/EMERGE.dissolve)));const u=ease(clamp((t-.5-EMERGE.dissolve)/EMERGE.turn));
   scene.pose.quat.copy(turnFrom.quat).slerp(WORK.quat,u);scene.pose.target.copy(turnFrom.target).lerp(WORK.target,u);scene.pose.halfHeight=turnFrom.halfHeight+(WORK.halfHeight-turnFrom.halfHeight)*u;scene.pose.dist=turnFrom.dist+(WORK.dist-turnFrom.dist)*u;scene.dirty=true;}
  if(beat===3){const p=clamp((t-1)/PLAY_SECONDS);if(p!==state.progress){state.progress=p;scene.setState(state);$('progress').value=Math.round(p*1000);readout();}}
  if(t>=durations[beat]){if(beat<OPENING.length-1)enter(beat+1);else{state=reduce(state,{type:'stop-opening'});state.beat=null;openingStop=null;sync();return false;}}
  return true;});
 enter(0);
}

// ————— Wiring —————
function failure(){failed=true;$('stage').classList.add('webgl-failed');$('fallback').hidden=false;emergence.cancel();state={...state,opening:false,playing:false,beat:null,display:showingPaper()?state.display:DISPLAYS[state.question].find(d=>d!=='model')};all('[data-display="model"]').forEach(b=>b.disabled=true);}
try{if(params.has('no-webgl'))throw Error('Requested fallback');
 if(!window.THREE)throw Error('Three.js unavailable');
 scene=new FrameworkScene($('lattice'),DATA,{frame:onFrame,interrupt:()=>{if(state.opening){stopOpening();sync();}},failure:()=>{failure();sync();},home:()=>poseFor()});
 POSES=buildPoses();const p=poseFor();scene.pose={quat:p.quat,target:p.target,halfHeight:p.halfHeight,dist:p.dist};
}catch(e){console.warn('Fig.3D: static fallback',e);failure();}
all('[data-question]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'question',value:b.dataset.question})));
$('explorer').querySelector('.tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=all('[data-question]'),i=tabs.indexOf(document.activeElement),n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[n].focus();tabs[n].click();});
all('[data-display]').forEach(b=>b.addEventListener('click',()=>setDisplay(b.dataset.display)));
all('[data-lattice]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'lattice',value:b.dataset.lattice})));
all('[data-route]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'route',value:b.dataset.route})));
all('[data-view]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'view',value:b.dataset.view})));
all('[data-crystal]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'crystal',value:b.dataset.crystal})));
all('[data-step]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'step',value:+b.dataset.step})));
all('[data-camera]').forEach(b=>b.addEventListener('click',()=>{if(state.opening){stopOpening();sync();}scene?.control(b.dataset.camera);}));
$('volume').addEventListener('input',e=>dispatch({type:'volume',value:+e.target.value}));
$('progress').addEventListener('input',e=>{if(scene)scene.scrubbing=true;dispatch({type:'progress',value:e.target.value/1000});});
$('progress').addEventListener('change',()=>{if(scene)scene.scrubbing=false;});
$('play').addEventListener('click',()=>dispatch({type:'play'}));
$('reference-open').addEventListener('click',e=>setDisplay(e.currentTarget.dataset.figure));
$('explore').addEventListener('click',()=>{stopOpening();sync();});
$('opening-pause').addEventListener('click',()=>{state={...state,openingPaused:!state.openingPaused};sync();});
$('figure-in').addEventListener('click',()=>zoomFigure(1.5));$('figure-out').addEventListener('click',()=>zoomFigure(1/1.5));$('figure-fit').addEventListener('click',()=>zoomFigure(0));
{let pan=null;const p=$('paper-viewport');p.addEventListener('pointerdown',e=>{if(figureViews[shownFigure()]?.zoom>1&&e.pointerType!=='touch'){pan={x:e.clientX,y:e.clientY,l:p.scrollLeft,t:p.scrollTop};p.setPointerCapture(e.pointerId);p.classList.add('panning');}});p.addEventListener('pointermove',e=>{if(pan){p.scrollLeft=pan.l-(e.clientX-pan.x);p.scrollTop=pan.t-(e.clientY-pan.y);}});const end=()=>{if(pan){pan=null;p.classList.remove('panning');saveFigure();}};p.addEventListener('pointerup',end);p.addEventListener('pointercancel',end);p.addEventListener('scroll',()=>{if(!pan)saveFigure();},{passive:true});}
$('paper-image').addEventListener('load',()=>{if(showingPaper()){sizeFigure();const v=figureViews[shownFigure()];$('paper-viewport').scrollTo(v.x,v.y);}});
// Any input on the stage during the opening hands it over.
$('stage').addEventListener('pointerdown',e=>{if(state.opening&&!e.target.closest('.stage-bar')){stopOpening();sync();}},{capture:true});
$('lattice').addEventListener('keydown',()=>{if(state.opening){stopOpening();sync();}});
addEventListener('keydown',e=>{if(e.key==='Escape'&&showingPaper()&&!state.opening){e.preventDefault();setDisplay('model');}});
addEventListener('resize',()=>sizeFigure());
reducedQuery.addEventListener('change',e=>{if(state.opening)stopOpening();state=reduce(state,{type:'reduced',value:e.matches});sync();});
addEventListener('pagehide',()=>{state={...state,playing:false};playStop?.();playStop=null;scene?.stop();});
addEventListener('pageshow',()=>scene?.wake());
// The emergence from the paper belongs to the first visit (or ?intro); later visits open straight on the model.
if(state.opening&&!BUILD_IN)state=reduce(state,{type:'stop-opening'});
for(const k of ['question','lattice','route','view','crystal'])if(params.has(k))state=reduce(state,{type:k,value:params.get(k)});
if(params.has('volume'))state=reduce(state,{type:'volume',value:VOLUMES.findIndex(v=>Math.abs(v-+params.get('volume'))<.06)>=0?VOLUMES.findIndex(v=>Math.abs(v-+params.get('volume'))<.06):+params.get('volume')});
if(params.has('step'))state=reduce(state,{type:'step',value:+params.get('step')});
if(params.has('progress'))state={...state,progress:clamp(+params.get('progress'))};
if(params.has('display'))state={...state,display:params.get('display')};
if(scene){const p=poseFor();scene.pose={quat:p.quat,target:p.target,halfHeight:p.halfHeight,dist:p.dist};}
window.figState=()=>({...state});window.figScene=scene;window.figData={DATA,CURVES,VP};
sync();if(state.opening&&scene)startOpening();else if(state.opening){state.opening=false;state.display='2';sync();}
document.documentElement.dataset.ready='true';
