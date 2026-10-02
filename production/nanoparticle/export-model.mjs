import {writeFileSync,mkdirSync} from 'node:fs';
import {createParticle,bindingSites,representative} from '../../site/nanoparticle-model.mjs';
const dir=new URL('./',import.meta.url);mkdirSync(dir,{recursive:true});
for(let n=3;n<=10;n++){
 const m=createParticle(n), sites={};for(const f of m.facets)sites[f.id]=bindingSites(m,f.id);
 const data={...m,byId:undefined,sites,representatives:Object.fromEntries(['face','edge','corner','interior'].map(k=>[k,representative(m,k).id]))};
 writeFileSync(new URL(`geometry-${n}.json`,dir),JSON.stringify(data));
}
