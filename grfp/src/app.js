/* The Working Catalyst — shell, router, lesson renderer, search, export/import. */
(function () {
  'use strict';
  const WC = window.WC;
  const { esc, $, $$, stripTags, toast } = WC;

  /* ---------- Shell ---------- */
  function shell() {
    document.body.innerHTML = `
<a class="skip" href="#view">Skip to content</a>
<div class="app">
  <nav class="rail" id="rail" aria-label="Guide navigation">
    <a class="brand" href="#home"><span class="brand-mark" aria-hidden="true">Cu</span><span class="brand-txt"><b>The Working Catalyst</b><span>GRFP proposal · study guide</span></span></a>
    <div class="rail-scroll">
      <div class="rail-tools">
        <a href="#sentences"><span class="gl" aria-hidden="true">¶</span>Sentences</a>
        <a href="#sources"><span class="gl" aria-hidden="true">◆</span>Sources</a>
        <a href="#defense"><span class="gl" aria-hidden="true">?</span>Oral defense</a>
        <a href="#review"><span class="gl" aria-hidden="true">↻</span>Review</a>
        <a href="#notebook"><span class="gl" aria-hidden="true">✎</span>Notebook</a>
        <a href="#glossary"><span class="gl" aria-hidden="true">Aa</span>Glossary</a>
        <a href="#proposal"><span class="gl" aria-hidden="true">▤</span>Proposal</a>
        <a href="#progress"><span class="gl" aria-hidden="true">✓</span>Progress</a>
      </div>
      <div id="rail-parts"></div>
    </div>
    <div class="rail-foot"><div id="rail-progress">0 of 29 lessons marked understood</div><div class="meter"><span id="rail-meter" style="width:0%"></span></div><div id="rail-storage"></div></div>
  </nav>
  <div class="main">
    <header class="topbar">
      <button class="tb-btn menu-btn" id="menu-btn" aria-label="Open navigation" aria-expanded="false" aria-controls="rail"><span class="gl" aria-hidden="true">☰</span></button>
      <div class="crumbs" id="crumbs" aria-live="polite"></div>
      <div class="depth-toggle" role="group" aria-label="Explanation depth"><button data-depth="intuitive" aria-pressed="true" title="Explain this simply (d)">Intuitive</button><button data-depth="rigorous" aria-pressed="false" title="Show the rigorous version (d)">Rigorous</button></div>
      <button class="tb-btn" id="search-btn" aria-label="Search the guide (slash or Control K)"><span class="gl" aria-hidden="true">⌕</span><span class="tb-hide-sm">Search</span><kbd class="tb-hide-sm">/</kbd></button>
      <button class="tb-btn" id="theme-btn" aria-label="Change color theme"><span class="gl" aria-hidden="true">◐</span><span class="lbl">Auto</span></button>
      <button class="tb-btn tb-hide-sm" id="keys-btn" aria-label="Keyboard shortcuts"><span class="gl" aria-hidden="true">⌘</span></button>
    </header>
    <main class="view" id="view" tabindex="-1"></main>
  </div>
</div>
<nav class="bottom-bar" aria-label="Quick navigation">
  <button id="bb-menu" aria-label="Lessons menu"><span class="gl" aria-hidden="true">☰</span>Lessons</button>
  <a href="#sentences" data-bb="sentences"><span class="gl" aria-hidden="true">¶</span>Sentences</a>
  <button id="bb-search"><span class="gl" aria-hidden="true">⌕</span>Search</button>
  <a href="#notebook" data-bb="notebook"><span class="gl" aria-hidden="true">✎</span>Notebook</a>
  <a href="#defense" data-bb="defense"><span class="gl" aria-hidden="true">?</span>Defense</a>
</nav>
<div id="toast" class="toast" role="status" hidden></div>
<div id="return-slot"></div>`;
    renderRail();
    $('#menu-btn').addEventListener('click', toggleRail);
    $('#bb-menu').addEventListener('click', toggleRail);
    $('#search-btn').addEventListener('click', openSearch);
    $('#bb-search').addEventListener('click', openSearch);
    $('#theme-btn').addEventListener('click', WC.cycleTheme);
    $('#keys-btn').addEventListener('click', showKeys);
    $$('.depth-toggle button').forEach((b) => b.addEventListener('click', () => { WC.setDepth(b.dataset.depth); toast(b.dataset.depth === 'rigorous' ? 'Rigorous version: equations, assumptions and edge cases shown' : 'Intuitive version: core ideas first'); }));
    $('#rail').addEventListener('click', (e) => {
      const h = e.target.closest('.part-head');
      if (h) { const g = h.parentElement; g.classList.toggle('collapsed'); h.setAttribute('aria-expanded', String(!g.classList.contains('collapsed'))); return; }
      if (e.target.closest('a') && window.matchMedia('(max-width: 860px)').matches) closeRail();
    });
  }
  function renderRail() {
    $('#rail-parts').innerHTML = WC.PARTS.map((p) => {
      const ls = WC.lessons.filter((l) => l.part === p.id);
      return `<div class="part-group" data-part="${p.id}"><button class="part-head" aria-expanded="true"><span class="pn">Part ${p.n}</span><span>${esc(p.title)}</span><span class="chev" aria-hidden="true">▾</span></button><ol>${ls.map((l) => `<li><a href="#l-${l.id}" data-lid="${l.id}"><span class="ln">${String(WC.lessonNum(l.id)).padStart(2, '0')}</span><span>${esc(l.short || l.title)}</span><span class="done" aria-hidden="true"></span></a></li>`).join('')}</ol></div>`;
    }).join('');
    WC.updateRail();
  }
  WC.updateRail = function () {
    const done = WC.lessons.filter((l) => WC.state.done[l.id]).length;
    const p = $('#rail-progress'); if (!p) return;
    p.textContent = `${done} of ${WC.lessons.length} lessons marked understood`;
    $('#rail-meter').style.width = `${(100 * done) / WC.lessons.length}%`;
    $('#rail-storage').textContent = WC.storageOK() ? 'Notes and progress save in this browser only' : 'Browser storage unavailable: export your notes to keep them';
    $$('#rail-parts a[data-lid]').forEach((a) => {
      const d = WC.state.done[a.dataset.lid];
      a.querySelector('.done').textContent = d ? '✓' : '';
      a.setAttribute('aria-label', `${a.textContent.trim()}${d ? ', marked understood' : ''}`);
    });
  };
  function toggleRail() { $('#rail').classList.contains('open') ? closeRail() : openRail(); }
  function openRail() {
    $('#rail').classList.add('open'); $('#menu-btn').setAttribute('aria-expanded', 'true');
    const sh = document.createElement('div'); sh.className = 'rail-shade'; sh.id = 'rail-shade'; sh.addEventListener('click', closeRail);
    document.body.appendChild(sh);
    const cur = $('#rail a[aria-current="page"]') || $('#rail a'); cur && cur.focus();
  }
  function closeRail() { $('#rail').classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false'); const s = $('#rail-shade'); s && s.remove(); }

  /* ---------- Router ----------
     Hash tokens only use letters, digits and hyphens so they survive any host. */
  const scrollMem = {};
  let currentKey = '';
  function parse(hash) {
    const h = (hash || '').replace(/^#/, '');
    if (!h || h === 'home') return { kind: 'home', key: 'home' };
    if (h.startsWith('l-')) return { kind: 'lesson', id: h.slice(2), key: h };
    if (h === 'sentences') return { kind: 'sentence', id: null, key: h };
    if (h.startsWith('s-')) return { kind: 'sentence', id: h.slice(2), key: 'sentences' };
    if (h === 'sources') return { kind: 'source', id: null, key: h };
    if (h.startsWith('src-')) return { kind: 'source', id: h.slice(4), key: 'sources' };
    if (h === 'glossary' || h.startsWith('glossary-')) return { kind: 'glossary', id: h.slice(9) || null, key: 'glossary' };
    if (['notebook', 'review', 'defense', 'progress', 'proposal', 'legend', 'notes'].includes(h)) return { kind: h, key: h };
    return { kind: 'notfound', key: h };
  }
  function route() {
    if (currentKey) scrollMem[currentKey] = window.scrollY;
    const r = parse(location.hash);
    const sameView = r.key === currentKey && (r.kind === 'sentence' || r.kind === 'glossary' || r.kind === 'source');
    WC.route = r;
    WC.closePop(); WC.closeModal();
    if (sameView && WC.views[r.kind] && WC.views[r.kind].update) { WC.views[r.kind].update(r); setCrumbs(r); return; }
    currentKey = r.key;
    const view = $('#view');
    WC.teardown && WC.teardown(); WC.teardown = null;
    if (r.kind === 'lesson') renderLesson(r.id);
    else if (WC.views[r.kind]) WC.views[r.kind].render(view, r);
    else view.innerHTML = `<div class="lesson"><h1>Page not found</h1><p>No page called “${esc(r.key)}”. <a href="#home">Go to the start</a>.</p></div>`;
    setCrumbs(r);
    $$('#rail a').forEach((a) => a.removeAttribute('aria-current'));
    const navA = r.kind === 'lesson' ? $(`#rail a[data-lid="${r.id}"]`) : $(`#rail a[href="#${r.key}"]`);
    if (navA) {
      navA.setAttribute('aria-current', 'page');
      const g = navA.closest('.part-group'); if (g) g.classList.remove('collapsed');
      if (!window.matchMedia('(max-width: 860px)').matches) navA.scrollIntoView({ block: 'nearest' });
    }
    $$('.bottom-bar [data-bb]').forEach((a) => { if (a.dataset.bb === r.key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    renderReturn();
    requestAnimationFrame(() => focusableScrollers(view));
    WC.state.last = location.hash; WC.saveSoon();
    const y = scrollMem[r.key];
    requestAnimationFrame(() => {
      if (WC.pendingFind) { const q = WC.pendingFind; WC.pendingFind = null; findInView(q); }
      else if (y != null) window.scrollTo(0, y);
      else window.scrollTo(0, 0);
      if (r.kind !== 'home') $('#view').focus({ preventScroll: true });
    });
  }
  /* Scrollable containers must be reachable by keyboard when they overflow. */
  function focusableScrollers(root) {
    let n = 0;
    $$('.table-wrap, .eq, .chart, [data-g]', root).forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 1) { el.tabIndex = 0; n++; if (!el.getAttribute('aria-label') && !el.getAttribute('role')) { const h = el.querySelector('th, svg[aria-label], .math'); el.setAttribute('role', 'region'); el.setAttribute('aria-label', `Scrollable ${el.classList.contains('table-wrap') ? 'table' : el.classList.contains('eq') ? 'equation' : 'figure'} ${n}${h ? ': ' + (h.getAttribute('aria-label') || h.textContent).slice(0, 60) : ''}`); } }
    });
  }
  WC.focusableScrollers = focusableScrollers;
  WC.go2 = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };
  function setCrumbs(r) {
    const c = $('#crumbs');
    let html = '';
    if (r.kind === 'lesson') {
      const l = WC.lessons.find((x) => x.id === r.id);
      if (l) {
        const p = WC.PARTS.find((x) => x.id === l.part);
        html = `<span class="crumb-part">Part ${p.n} · ${esc(p.title)}</span><span class="sep crumb-part">/</span><span class="mono">${WC.lessonNum(l.id)}/${WC.lessons.length}</span><b>${esc(l.short || l.title)}</b>`;
        document.title = `${l.short || l.title} · The Working Catalyst`;
      }
    } else {
      const names = { home: 'Start', sentence: 'Every sentence', source: 'Scientific foundation', glossary: 'Glossary', notebook: 'Notebook', review: 'Review', defense: 'Oral defense', progress: 'Progress', proposal: 'Original proposal', legend: 'Evidence legend', notes: 'Refinement notes' };
      html = `<b>${names[r.kind] || 'The Working Catalyst'}</b>${r.kind === 'sentence' && r.id ? `<span class="sep">/</span><span class="mono">${esc(r.id)}</span>` : ''}`;
      document.title = r.kind === 'home' ? 'The Working Catalyst' : `${names[r.kind] || ''} · The Working Catalyst`;
    }
    c.innerHTML = html;
  }

  /* Return chip: after jumping from a sentence or source to a lesson, offer the way back. */
  WC.returnTo = null;
  WC.setReturn = (hash, label) => { WC.returnTo = { hash, label }; };
  function renderReturn() {
    const slot = $('#return-slot');
    const rt = WC.returnTo;
    if (!rt || location.hash === rt.hash) { slot.innerHTML = ''; if (rt && location.hash === rt.hash) WC.returnTo = null; return; }
    slot.innerHTML = `<div class="return-chip" role="navigation" aria-label="Return"><a href="${rt.hash}">← Back to ${esc(rt.label)}</a><button aria-label="Dismiss">✕</button></div>`;
    $('button', slot).addEventListener('click', () => { WC.returnTo = null; slot.innerHTML = ''; });
  }

  /* ---------- Lesson renderer ---------- */
  function renderLesson(id) {
    const i = WC.lessonIndex(id);
    const view = $('#view');
    if (i < 0) { view.innerHTML = `<div class="lesson"><h1>Lesson not found</h1><p><a href="#home">Back to the start</a></p></div>`; return; }
    const l = WC.lessons[i];
    const part = WC.PARTS.find((p) => p.id === l.part);
    const prev = WC.lessons[i - 1], next = WC.lessons[i + 1];
    WC.state.visited[l.id] = Date.now();
    const daySeed = Math.floor(Date.now() / 864e5) * 31 + i;
    const review = i > 1 ? WC.pickReview(i, 2, daySeed) : [];
    const noteId = `note-${l.id}`;
    view.innerHTML = `
<article class="lesson" aria-labelledby="lesson-title">
  <header class="lesson-head">
    <div class="kicker"><span class="k-part">Part ${part.n} · ${esc(part.title)}</span><span>Lesson ${i + 1} of ${WC.lessons.length}</span>${l.minutes ? `<span class="k-part">~${l.minutes} min</span>` : ''}</div>
    <h1 id="lesson-title">${l.title}</h1>
    ${l.lede ? `<p class="lede">${l.lede}</p>` : ''}
    ${l.goals ? `<div class="goals"><b>After this lesson you can explain</b><ul>${l.goals.map((g) => `<li>${g}</li>`).join('')}</ul></div>` : ''}
    <p class="depth-hint">Reading the intuitive version. Switch to <button class="btn btn-sm" data-set-depth="rigorous">Rigorous</button> for equations, edge cases and the stricter wording.</p>
  </header>
  <div class="lesson-body">${WC.lessonBody(l)}</div>
  <footer class="lesson-end">
    ${review.length ? `<h2 class="end-h">Retrieval practice from earlier lessons</h2><p class="muted small">Recalling an earlier idea after a gap is what makes it stick. Questions you missed come back first.</p>${review.map((q) => `<div class="check" data-q="${q.id}" data-from="1"></div>`).join('')}` : ''}
    <label class="check-row" style="font-size:1rem;margin-top:1.2rem"><input type="checkbox" id="done-${l.id}" ${WC.state.done[l.id] ? 'checked' : ''}> <span><strong>I could explain this lesson to a skeptical PI.</strong> <span class="muted">Marks it understood in your progress.</span></span></label>
    <div class="lesson-notes"><label for="${noteId}"><h3 class="lab" style="margin-top:1rem">My notes on this lesson</h3></label><textarea id="${noteId}" placeholder="What would you say if a PI asked about this?">${esc(WC.state.notes.lesson[l.id] || '')}</textarea></div>
    <div data-capture-box style="margin-top:.8rem"><label class="small muted" for="cap-${l.id}">Quick capture with this lesson as context</label><div class="nb-add" style="margin-top:.3rem"><input id="cap-${l.id}" type="text" placeholder="A question, a doubt, an edit…"></div><div class="capture">${Object.keys(WC.LISTS).map((k) => `<button class="btn btn-sm" data-capture="${k}">+ ${esc(WC.LISTS[k][0])}</button>`).join('')}</div></div>
    <nav class="pager" aria-label="Lesson pagination">${prev ? `<a href="#l-${prev.id}"><small>← Lesson ${i}</small>${esc(prev.short || prev.title)}</a>` : '<span></span>'}${next ? `<a class="next" href="#l-${next.id}"><small>Lesson ${i + 2} →</small>${esc(next.short || next.title)}</a>` : `<a class="next" href="#defense"><small>Next →</small>Oral defense practice</a>`}</nav>
  </footer>
</article>`;
    $(`#done-${l.id}`).addEventListener('change', (e) => { if (e.target.checked) WC.state.done[l.id] = Date.now(); else delete WC.state.done[l.id]; WC.save(); });
    $(`#${noteId}`).addEventListener('input', (e) => { WC.state.notes.lesson[l.id] = e.target.value; WC.saveSoon(); });
    $('[data-set-depth]', view).addEventListener('click', () => WC.setDepth('rigorous'));
    mountAll(view);
  }
  function mountAll(root) {
    WC.renderChecks(root);
    const cleanups = [];
    $$('[data-widget]', root).forEach((el) => {
      const fn = WC.widgets[el.dataset.widget];
      if (!fn) { el.innerHTML = `<p class="muted">Interactive “${esc(el.dataset.widget)}” is missing.</p>`; return; }
      let opts = {};
      try { opts = el.dataset.opts ? JSON.parse(el.dataset.opts) : {}; } catch (e) { opts = {}; }
      try { el.innerHTML = ''; const c = fn(el, opts); if (typeof c === 'function') cleanups.push(c); }
      catch (err) { el.innerHTML = `<p class="readout warn">This interactive failed to load (${esc(err.message)}). The rest of the lesson still works.</p>`; if (window.console) console.warn(err); }
    });
    WC.teardown = () => cleanups.forEach((c) => { try { c(); } catch (e) { /* ignore */ } });
  }
  WC.mountAll = mountAll;

  /* ---------- Search ---------- */
  let index = null;
  function buildIndex() {
    const items = [];
    WC.lessons.forEach((l) => items.push({ type: 'Lessons', title: `${WC.lessonNum(l.id)}. ${stripTags(l.title)}`, text: stripTags(`${l.lede || ''} ${(l.goals || []).join(' ')} ${WC.lessonBody(l)}`), hash: `#l-${l.id}`, w: 1 }));
    (WC.glossary || []).forEach((g) => items.push({ type: 'Glossary', title: g.term, text: stripTags(g.def), hash: `#glossary-${WC.slug(g.term)}`, w: 1.4 }));
    (WC.sentences || []).forEach((s) => items.push({ type: 'Proposal sentences', title: `${s.id} · ${s.text}`, text: `${s.text} ${s.plain} ${s.why} ${(WC.sentenceExtra[s.id] || {}).ch || ''}`, hash: `#s-${s.id}`, w: 1.2 }));
    (WC.refs || []).forEach((r, i) => items.push({ type: 'Papers', title: `[${i + 1}] ${r.authors} — ${r.title}`, text: stripTags(`${r.studied} ${r.system} ${r.found} ${r.why} ${r.not.join(' ')}`), hash: `#src-${i + 1}`, w: 1.3 }));
    (WC.refNotes || []).forEach((n) => { const t = stripTags(n.html); items.push({ type: 'Refinement notes', title: `Refinement notes §${n.id}: ${t.slice(0, 70)}`, text: t, hash: '#notes', w: 0.9 }); });
    (WC.oral || []).forEach((o) => items.push({ type: 'Defense questions', title: o.q, text: stripTags(`${o.model} ${(o.weak || []).join(' ')}`), hash: `#defense`, oral: o.id, w: 1 }));
    items.forEach((it) => { it.lt = it.title.toLowerCase(); it.lx = it.text.toLowerCase(); });
    return items;
  }
  function search(q) {
    index = index || buildIndex();
    const toks = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1 || /θ/.test(t));
    if (!toks.length) return [];
    const out = [];
    for (const it of index) {
      let s = 0, ok = true;
      for (const t of toks) {
        const inT = it.lt.includes(t), inX = it.lx.includes(t);
        if (!inT && !inX) { ok = false; break; }
        s += (inT ? 6 : 0) + (inX ? 1 + Math.min(3, it.lx.split(t).length - 1) * .3 : 0);
      }
      if (ok) out.push({ it, s: s * it.w });
    }
    return out.sort((a, b) => b.s - a.s).slice(0, 40).map((x) => x.it);
  }
  function snippet(it, q) {
    const t = q.toLowerCase().split(/\s+/).filter(Boolean)[0] || '';
    const i = it.lx.indexOf(t);
    const start = Math.max(0, i - 60);
    let s = (start > 0 ? '…' : '') + it.text.slice(start, start + 170) + '…';
    s = esc(s);
    q.split(/\s+/).filter((w) => w.length > 1).forEach((w) => { s = s.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>'); });
    return s;
  }
  function openSearch() {
    closeRail();
    const back = WC.modal('Search', '<div id="s-results" role="listbox" aria-label="Search results"><p class="muted small">Search lessons, the glossary, all 61 proposal sentences, the eight papers and the defense questions. Try “equal charge”, “companion”, “θ”, “pseudoreplication” or “Song”.</p></div>', {
      head: `<label class="sr-only" for="s-input">Search the guide</label><span class="gl mono" aria-hidden="true">⌕</span><input id="s-input" class="search-input" type="search" placeholder="Search everything…" autocomplete="off" aria-controls="s-results">`,
      focus: '#s-input',
    });
    const input = $('#s-input', back), res = $('#s-results', back);
    let sel = 0, hits = [];
    const draw = () => {
      const q = input.value.trim();
      hits = q ? search(q) : [];
      if (!q) return;
      if (!hits.length) { res.innerHTML = `<p class="muted">No matches for “${esc(q)}”. Try a shorter word.</p>`; return; }
      const groups = {};
      hits.forEach((h, i) => { (groups[h.type] = groups[h.type] || []).push([h, i]); });
      res.innerHTML = Object.entries(groups).map(([g, arr]) => `<div class="s-group"><h3 class="lab">${esc(g)}</h3>${arr.map(([h, i]) => `<button class="s-hit" role="option" id="hit-${i}" data-i="${i}" aria-selected="${i === sel}"><b>${esc(h.title.length > 140 ? h.title.slice(0, 140) + '…' : h.title)}</b><span>${snippet(h, q)}</span></button>`).join('')}</div>`).join('');
      input.setAttribute('aria-activedescendant', `hit-${sel}`);
    };
    const choose = (i) => {
      const h = hits[i]; if (!h) return;
      WC.closeModal();
      if (h.type === 'Lessons') WC.pendingFind = input.value.trim();
      if (h.oral) WC.pendingOral = h.oral;
      WC.go2(h.hash);
    };
    input.addEventListener('input', () => { sel = 0; draw(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(hits.length - 1, sel + 1); draw(); const b = $(`#hit-${sel}`, back); b && b.scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); const b = $(`#hit-${sel}`, back); b && b.scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
    });
    res.addEventListener('click', (e) => { const b = e.target.closest('.s-hit'); if (b) choose(+b.dataset.i); });
  }
  WC.openSearch = openSearch;
  /* Find a phrase inside the rendered view, opening hidden concept tabs if needed. */
  function findInView(q) {
    const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) return;
    const body = $('.lesson-body') || $('#view');
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    let node, target = null;
    while ((node = walker.nextNode())) {
      const t = node.nodeValue.toLowerCase();
      if (t.includes(words[0])) {
        const el = node.parentElement;
        if (el.closest('.rig') && WC.state.depth !== 'rigorous') { if (!target) target = { el, rig: true }; continue; }
        target = { el, rig: false }; break;
      }
    }
    if (!target) return;
    if (target.rig) { WC.setDepth('rigorous'); toast('Match is in the rigorous version, now shown'); }
    const panel = target.el.closest('[role="tabpanel"]');
    if (panel && panel.hidden) { const tab = document.getElementById(panel.getAttribute('aria-labelledby')); tab && WC.selectTab(tab); }
    const det = target.el.closest('details'); if (det) det.open = true;
    target.el.scrollIntoView({ block: 'center' });
    target.el.classList.add('flash');
    setTimeout(() => target.el.classList.remove('flash'), 2300);
  }

  /* ---------- Keyboard ---------- */
  function showKeys() {
    WC.modal('Keyboard shortcuts', `<table><tbody>
      <tr><td><kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd></td><td>Search everything</td></tr>
      <tr><td><kbd>[</kbd> <kbd>]</kbd></td><td>Previous / next lesson</td></tr>
      <tr><td><kbd>j</kbd> <kbd>k</kbd></td><td>Next / previous sentence (sentence view)</td></tr>
      <tr><td><kbd>d</kbd></td><td>Toggle intuitive / rigorous depth</td></tr>
      <tr><td><kbd>t</kbd></td><td>Cycle theme (auto, light, dark)</td></tr>
      <tr><td><kbd>n</kbd></td><td>Open notebook</td></tr>
      <tr><td><kbd>g</kbd> then <kbd>h</kbd></td><td>Go to the start page</td></tr>
      <tr><td><kbd>?</kbd></td><td>This list</td></tr>
      <tr><td><kbd>Esc</kbd></td><td>Close dialogs and popovers</td></tr></tbody></table>`);
  }
  let gPending = false;
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if ($('#modal-back')) return;
    const r = WC.route || {};
    if (gPending) { gPending = false; if (e.key === 'h') { WC.go2('#home'); return; } }
    switch (e.key) {
      case '/': e.preventDefault(); openSearch(); break;
      case '?': showKeys(); break;
      case 'd': WC.setDepth(WC.state.depth === 'rigorous' ? 'intuitive' : 'rigorous'); toast(`Depth: ${WC.state.depth}`); break;
      case 't': WC.cycleTheme(); break;
      case 'n': WC.go2('#notebook'); break;
      case 'g': gPending = true; setTimeout(() => { gPending = false; }, 900); break;
      case '[': case ']': {
        if (r.kind !== 'lesson') return;
        const i = WC.lessonIndex(r.id) + (e.key === ']' ? 1 : -1);
        if (WC.lessons[i]) WC.go2(`#l-${WC.lessons[i].id}`);
        break;
      }
      default:
    }
  });

  /* ---------- Export / import ---------- */
  WC.exportJSON = () => JSON.stringify(Object.assign({ exported: new Date().toISOString(), app: 'The Working Catalyst study guide' }, WC.state), null, 2);
  WC.exportMarkdown = function () {
    const s = WC.state, L = [];
    L.push('# The Working Catalyst — study notes', '', `Exported ${new Date().toLocaleString()}`, '');
    const done = WC.lessons.filter((l) => s.done[l.id]).length;
    L.push(`Lessons marked understood: ${done} of ${WC.lessons.length}`, '');
    for (const [k, [name]] of Object.entries(WC.LISTS)) {
      const items = s.lists[k] || [];
      L.push(`## ${name}`, '');
      if (!items.length) L.push('_None yet._');
      items.forEach((it) => L.push(`- [${it.done ? 'x' : ' '}] ${it.text}${it.ctx ? `  \n  _(${it.ctx})_` : ''}`));
      L.push('');
    }
    L.push('## Lesson notes', '');
    WC.lessons.forEach((l) => { const t = s.notes.lesson[l.id]; if (t && t.trim()) L.push(`### ${WC.lessonNum(l.id)}. ${stripTags(l.title)}`, '', t.trim(), ''); });
    L.push('## Notes on proposal sentences', '');
    (WC.sentences || []).forEach((x) => { const t = s.notes.sentence[x.id]; if (t && t.trim()) L.push(`### ${x.id}`, '', `> ${x.text}`, '', t.trim(), ''); });
    L.push('## Notes on papers', '');
    (WC.refs || []).forEach((r, i) => { const t = s.notes.paper[i + 1]; if (t && t.trim()) L.push(`### [${i + 1}] ${r.authors}, ${r.journal}`, '', t.trim(), ''); });
    L.push('## Oral-defense answers', '');
    (WC.oral || []).forEach((o) => { const a = s.oral[o.id]; if (a && a.answer && a.answer.trim()) L.push(`### ${o.q}`, '', a.answer.trim(), '', a.rating ? `_Self-rating: ${a.rating}_` : '', ''); });
    L.push('## Teach-back drafts', '');
    (WC.teachPrompts || []).forEach((p) => { const t = s.teach[p.id]; if (t && t.trim()) L.push(`### ${p.title}`, '', t.trim(), ''); });
    L.push('## Concepts', '');
    (WC.concepts || []).forEach((c) => { const st = WC.conceptStatus(c.id); L.push(`- ${st.status === 'm' ? '✓ mastered' : st.status === 'r' ? '↻ review' : '· not yet assessed'} — ${c.label}`); });
    return L.join('\n');
  };
  WC.download = function (name, text, type) {
    try {
      const blob = new Blob([text], { type });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    } catch (e) { /* the copy fallback below covers sandboxes that block downloads */ }
  };
  WC.copy = function (text, area) {
    const fallback = () => { if (area) { area.focus(); area.select(); } toast('Copy blocked here: the text is selected, press Ctrl/⌘ C'); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard'), fallback);
      else fallback();
    } catch (e) { fallback(); }
  };
  WC.showExport = function (kind) {
    const md = kind === 'md';
    const text = md ? WC.exportMarkdown() : WC.exportJSON();
    const name = md ? 'working-catalyst-study-notes.md' : 'working-catalyst-backup.json';
    const back = WC.modal(md ? 'Export study notes (Markdown)' : 'Export full backup (JSON)', `<p class="small">${md ? 'Clean, readable notes: lists, lesson notes, sentence and paper notes, defense answers and teach-back drafts.' : 'Everything: progress, quiz history, notes and lists. Import it later or on another browser to restore.'}</p><div class="btn-row"><button class="btn btn-primary" id="ex-dl">Download ${name}</button><button class="btn" id="ex-copy">Copy to clipboard</button></div><label class="sr-only" for="ex-area">Export text</label><textarea id="ex-area" readonly style="min-height:16rem;font-family:var(--f-mono);font-size:.78rem">${esc(text)}</textarea><p class="muted small">If your browser blocks downloads (some embedded viewers do), copy the text instead.</p>`);
    $('#ex-dl', back).addEventListener('click', () => { WC.download(name, text, md ? 'text/markdown' : 'application/json'); toast('Download started (if your browser allows it)'); });
    $('#ex-copy', back).addEventListener('click', () => WC.copy(text, $('#ex-area', back)));
  };
  WC.importFile = function (file) {
    const fr = new FileReader();
    fr.onload = () => {
      let data;
      try { data = JSON.parse(fr.result); } catch (e) { toast('That file is not valid JSON. Choose a backup exported from this guide.'); return; }
      if (!data || data.v !== 2 || typeof data.lists !== 'object') { toast('That JSON is not a backup from this guide (missing version 2 fields).'); return; }
      const back = WC.modal('Restore backup?', `<p>This backup has ${Object.keys(data.done || {}).length} lessons marked understood, ${Object.values(data.lists || {}).reduce((a, b) => a + (Array.isArray(b) ? b.length : 0), 0)} list items and ${Object.keys((data.notes || {}).lesson || {}).length} lesson notes.</p><p><strong>Replace</strong> overwrites everything here. <strong>Merge</strong> keeps your current notes and adds the backup’s list items and any notes you don’t already have.</p><div class="btn-row"><button class="btn btn-primary" id="im-merge">Merge</button><button class="btn" id="im-replace">Replace everything</button><button class="btn btn-ghost" data-close>Cancel</button></div>`);
      $('#im-replace', back).addEventListener('click', () => { WC.state = WC.normalize(data); finish(); });
      $('#im-merge', back).addEventListener('click', () => {
        const inc = WC.normalize(data), s = WC.state;
        for (const k of Object.keys(s.lists)) { const ids = new Set(s.lists[k].map((x) => x.id)); inc.lists[k].forEach((x) => { if (!ids.has(x.id)) s.lists[k].push(x); }); }
        for (const g of ['lesson', 'sentence', 'paper']) for (const [k, v] of Object.entries(inc.notes[g] || {})) if (!s.notes[g][k]) s.notes[g][k] = v;
        for (const g of ['done', 'quiz', 'self', 'oral', 'teach', 'visited']) for (const [k, v] of Object.entries(inc[g] || {})) if (!(k in s[g])) s[g][k] = v;
        finish();
      });
      function finish() { WC.save(); WC.applyTheme(); WC.applyDepth(); WC.closeModal(); toast('Backup restored'); route(); }
    };
    fr.readAsText(file);
  };

  /* ---------- Boot ---------- */
  function boot() {
    shell();
    WC.applyTheme(); WC.applyDepth();
    window.addEventListener('hashchange', route);
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const h = () => WC.redrawCharts();
      mq.addEventListener ? mq.addEventListener('change', h) : mq.addListener(h);
    }
    route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
