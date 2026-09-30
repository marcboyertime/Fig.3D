// Native same-origin transitions preserve real links, history and new-tab behavior.
// The state attribute permits checking that a real transition ran, rather than only CSS support.
addEventListener('pagereveal',event=>{
 const root=document.documentElement,transition=event.viewTransition;
 root.dataset.navigationMotion='none';
 if(!transition)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){transition.skipTransition();root.dataset.navigationMotion='reduced';return;}
 transition.ready.then(()=>{root.dataset.navigationMotion='running'}).catch(()=>{root.dataset.navigationMotion='skipped'});
 transition.finished.then(()=>{if(root.dataset.navigationMotion==='running')root.dataset.navigationMotion='finished'});
});
