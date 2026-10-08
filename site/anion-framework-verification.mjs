// Checks the companion's numbers against the paper. Run from site/: node anion-framework-verification.mjs
import fs from 'node:fs';
import {VOLUMES,ROUTES,regimeOf,barrierAt,siteEnergyAt,scaleFor,conductivityRatio} from './anion-framework-model.mjs';
const read=f=>JSON.parse(fs.readFileSync(new URL(f,import.meta.url)));
const C=read('./assets/anion-framework/curves.json'),VP=read('./assets/anion-framework/volume-paths.json'),S=read('./assets/anion-framework/scene.json');
const fit=read('../production/anion-framework/registration/figure-2a-fit.json');
let fails=0;const check=(name,ok,detail='')=>{console.log(`${ok?'ok  ':'FAIL'} ${name}${detail?' · '+detail:''}`);if(!ok)fails++;};
const near=(a,b,t)=>Math.abs(a-b)<=t;
// Main text, Fig. 2 at 40 Å³ per S: bcc 0.15, fcc 0.39, hcp T–O–T 0.40, hcp T–T 0.20, hcp O–O 0.19 (measured from the O site).
const peak=k=>Math.max(...C.figure2[k].points.map(p=>p.energy_eV)),start=k=>C.figure2[k].points[0].energy_eV;
for(const [k,v] of [['bcc_TT',.15],['fcc_TOT',.39],['hcp_TOT',.40],['hcp_TT',.20]])check(`Fig. 2 ${k} barrier ${v} eV`,near(peak(k),v,.006),peak(k).toFixed(3));
check('Fig. 2 hcp_OO barrier 0.19 eV above the O site',near(peak('hcp_OO')-start('hcp_OO'),.19,.01),(peak('hcp_OO')-start('hcp_OO')).toFixed(3));
// Supplementary paths agree with Fig. 3 and with Fig. 2 at 40 Å³.
check('S4–S6 paths agree with Fig. 3',VP.check_vs_figure3_max_diff_eV<=.01,VP.check_vs_figure3_max_diff_eV+' eV');
for(const [l,r] of [['bcc','TT'],['fcc','TOT'],['hcp','TOT'],['hcp','TT']])check(`40 Å³ ${l} ${r} matches Fig. 2`,near(barrierAt(VP,l,r,2),peak(`${l}_${r}`),.01));
// bcc lowest at every volume; barrier falls with volume.
const bcc=VOLUMES.map((_,i)=>barrierAt(VP,'bcc','TT',i));
check('bcc lowest at every volume',VOLUMES.every((_,i)=>['fcc','hcp'].every(l=>barrierAt(VP,l,'TOT',i)>bcc[i])));
check('bcc barrier falls with volume',bcc.every((b,i)=>i===0||b<=bcc[i-1]+.006));
// Regimes: O site below T in I, above in II, equal to the barrier (no stop) in III.
for(const i of VOLUMES.keys()){const s=siteEnergyAt(VP,'fcc','TOT',i),b=barrierAt(VP,'fcc','TOT',i),r=regimeOf(VOLUMES[i]);
 check(`fcc ${VOLUMES[i]} Å³ regime ${r}`,r==='I'?s<0:r==='II'?s>0&&s<b-.005:Math.abs(s-b)<.005,`site ${s} barrier ${b}`);}
// Geometry: bcc at 40 Å³, the T–T doorway, connectivity.
const a=S.lattices.bcc.cell_A[0];check('bcc a gives 40 Å³ per S',near(a**3/2,40,.01),a.toFixed(3)+' Å');
check('bcc T sites form one network',S.lattices.bcc.tt_cluster_count===1,`${S.lattices.bcc.T_count} T sites`);
check('fcc T sites share no faces',S.lattices.fcc.tt_clusters.every(n=>n===1)&&S.lattices.fcc.links.every(l=>l.kind!=='TT'));
check('hcp T sites pair up, never more',Math.max(...S.lattices.hcp.tt_clusters)===2,'largest cluster '+Math.max(...S.lattices.hcp.tt_clusters));
check('scale is the cube root of volume',near(scaleFor(6)**3,VOLUMES[6]/40,1e-9)&&VOLUMES[6]===70.8);
// LGPS: the paper's R = 0.58 Å; every Li site near a bcc T site.
check('LGPS bcc match R ≈ 0.58 Å',near(S.lgps.match.R_A,.58,.01),S.lgps.match.R_A.toFixed(3));
check('LGPS Li sites within 0.75 Å of a bcc T site',S.lgps.li.every(l=>l.to_bcc_T_A<.75),Math.max(...S.lgps.li.map(l=>l.to_bcc_T_A)).toFixed(2)+' Å max');
// Registration of the model to the printed Fig. 2a render.
check('Fig. 2a registration under 0.05 Å rms',fit.rms_A<.05,fit.rms_A.toFixed(3)+' Å, '+fit.rms_px.toFixed(2)+' px');
// Conductivity wording: about three orders of magnitude (paper); bare Boltzmann factor shown in Go deeper.
const ratio=conductivityRatio(.15,.39);check('exp factor 0.15 vs 0.39 eV is about 10⁴',ratio>3e3&&ratio<3e4,ratio.toExponential(1));
console.log(fails?`${fails} failed`:'all checks passed');process.exit(fails?1:0);
