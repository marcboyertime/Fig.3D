import {concentration, particleState} from './model.mjs';
const state=particleState(50);
document.querySelector('#teaser-gradient').innerHTML=Array.from({length:61},(_,i)=>{const c=concentration(i/60,state.tau);const rgb=[23,36,69].map((v,j)=>Math.round(v+([125,156,255][j]-v)*c));return `<stop offset="${i/60*100}%" stop-color="rgb(${rgb})"/>`;}).join('');
// A normalized Nyquist plot of Z = Rs + Rp/(1 + i ω Rp C).
// Sampling log frequency is only a plotting choice, not measured cell data.
const points=Array.from({length:181},(_,i)=>{
  const w=10**(3-i/30);
  return `${137+370/(1+w*w)},${370-370*w/(1+w*w)}`;
});
document.querySelector('#nyquist-teaser').setAttribute('d',`M${points.join('L')}`);
const concepts={
 battery:{title:'How a battery works.',intro:'Start with a lithium-ion cell. Follow the electrons outside it and the ions inside it, then connect their paths through the electrode reactions.',list:['Meet the electrodes, electrolyte, separator and external circuit.','See how discharge couples both charge pathways.','Connect the chemical changes to energy delivered to a load.']},
 impedance:{title:'A signal becomes a spectrum.',intro:'Begin with a simple electrical model. See how a changing voltage and responding current become an impedance plot.',list:['Link the signal to its amplitude and phase response.','Connect Nyquist and Bode views of the same model.','See why a fitted circuit does not by itself prove a physical mechanism.']}
};
const dialog=document.querySelector('#concept-dialog');
document.querySelectorAll('[data-concept]').forEach(button=>button.addEventListener('click',()=>{
 const item=concepts[button.dataset.concept];
 document.querySelector('#concept-title').textContent=item.title;
 document.querySelector('#concept-intro').textContent=item.intro;
 document.querySelector('#concept-list').replaceChildren(...item.list.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
 dialog.showModal();
}));
dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{const b=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom))dialog.close();});

import './hero.js';

import './battery-teaser.js';
