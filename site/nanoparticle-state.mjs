import {createParticle,representative,bindingSites} from './nanoparticle-model.mjs?v=20261002-6';
export const VIEWS=['surfaces','neighbors','size','binding'];
export function initialState(reduced=false){return {model:createParticle(6),view:'surfaces',faceId:'100:1,0,0',selected:null,site:'atop',cutaway:false,stacking:false,intro:!reduced,paused:false,reduced};}
export function reduce(state,action){
 const next={...state};
 if(action.type!=='pause'&&action.type!=='intro'){next.intro=false;next.paused=false;}
 switch(action.type){
 case 'intro':return {...next,...action.patch};
 case 'pause':next.paused=!state.paused;break;
 case 'explore':break;
 case 'view':if(!VIEWS.includes(action.value))return state;next.view=action.value;next.cutaway=false;next.stacking=false;if(next.view==='neighbors'&&!next.selected)next.selected=representative(next.model,'face',next.faceId).id;break;
 case 'face':if(!next.model.facets.some(f=>f.id===action.value))return state;next.faceId=action.value;next.selected=null;next.site='atop';next.stacking=false;next.cutaway=false;break;
 case 'atom':if(!next.model.byId.has(action.value))return state;next.selected=action.value;next.view='neighbors';break;
 case 'shortcut':next.selected=representative(next.model,action.value,next.faceId).id;next.view='neighbors';next.cutaway=action.value==='interior';next.stacking=false;break;
 case 'shells':next.model=createParticle(action.value);next.selected=state.selected&&next.model.byId.has(state.selected)?state.selected:null;next.cutaway=false;next.stacking=false;break;
 case 'cutaway':next.cutaway=!state.cutaway;break;
 case 'site':if(!(action.value in bindingSites(next.model,next.faceId)))return state;next.site=action.value;next.stacking=false;break;
 case 'stacking':next.stacking=!state.stacking;break;
 case 'reset':return {...initialState(state.reduced),intro:false};
 default:throw new Error('Unknown action '+action.type);
 }
 return next;
}
export const ease=t=>{t=Math.min(1,Math.max(0,t));return t*t*t*(t*(t*6-15)+10);};
// Camera yaw decreases as the pointer moves right: a near-side landmark follows the hand.
export function orbitDelta(pose,dx,dy){return {...pose,yaw:pose.yaw-dx*.006,elevation:Math.max(-1.16,Math.min(1.16,pose.elevation+dy*.006))};}
