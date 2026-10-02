import {dot,sub,atomVisible,bindingSites,add,mul} from './nanoparticle-model.mjs?v=20261002-5';
// An SVG view of the same current model: no WebGL, no independent scientific data.
export function fallbackSVG(state){
 const m=state.model,y=.91,e=.43,right=[Math.cos(y),0,-Math.sin(y)],up=[-Math.sin(y)*Math.sin(e),Math.cos(e),-Math.cos(y)*Math.sin(e)],forward=[Math.sin(y)*Math.cos(e),Math.sin(e),Math.cos(y)*Math.cos(e)],scale=state.view==='size'?12:200/(m.shells*1.8);
 const project=p=>[320+dot(p,right)*scale,235-dot(p,up)*scale];
 const selected=m.byId.get(state.selected), neighbors=new Set(selected?.neighbors||[]),face=m.facets.find(f=>f.id===state.faceId),site=state.view==='binding'?bindingSites(m,state.faceId)[state.site]:null;
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 500" role="img" aria-label="Static projection of the current ${m.shells}-shell gold particle"><defs><radialGradient id="au"><stop stop-color="#e5c895"/><stop offset=".6" stop-color="#ae803d"/><stop offset="1" stop-color="#302820"/></radialGradient></defs><rect width="640" height="500" fill="#080a12"/><g font-family="Sora,Arial,sans-serif" fill="#c5cee4" font-size="28"><text x="25" y="32">${m.shells} shells · ${m.atoms.length} atoms</text></g>`;
 const atoms=m.atoms.filter(a=>atomVisible(a,state)).sort((a,b)=>dot(a.p,forward)-dot(b.p,forward));
 for(const a of atoms){const p=project(a.p),sel=a.id===state.selected,color=sel?'#dbe7ff':neighbors.has(a.id)?'#83adf6':site?.atomIds.includes(a.id)?'#b69ae9':'url(#au)';svg+=`<circle cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="${(.58*scale).toFixed(2)}" fill="${color}" stroke="${sel?'#ffffff':'#6e542f'}" stroke-width="${sel?2:.3}"/>`;}
 if(state.view==='surfaces'){const p=face.vertices.map(project);svg+=`<path d="M${p.map(p=>p.join(',')).join('L')}Z" fill="none" stroke="#b6caff" stroke-width="2.5"/><text x="320" y="465" text-anchor="middle" font-family="Sora,Arial,sans-serif" font-size="28" fill="#d5dfff">${face.family==='100'?'Square {100}':'Triangular {111}'} terrace</text>`;}
 if(site){const p=project(add(site.p,mul(site.normal,1.52)));svg+=`<path d="M${p[0]},${p[1]-7}l7,7 -7,7 -7,-7Z" fill="#c7adff" stroke="#f3e8ff"/><text x="320" y="465" text-anchor="middle" font-family="Sora,Arial,sans-serif" font-size="28" fill="#d5dfff">Diamond = geometric marker</text>`;}
 if(selected&&state.view==='neighbors')svg+=`<text x="320" y="465" text-anchor="middle" font-family="Sora,Arial,sans-serif" font-size="28" fill="#d5dfff">${selected.cn} neighbors · outlined atom</text>`;
 return svg+'</svg>';
}
