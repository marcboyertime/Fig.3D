/* Views other than lessons: home, sentences, sources, glossary, notebook,
   review, progress, defense, proposal, legend. */
(function () {
  'use strict';
  const WC = window.WC;
  const { esc, $, $$, stripTags } = WC;
  const S = WC.svg;
  const V = WC.views;

  const LEGEND = [
    ['est', 'Established by prior work', 'A finding reported in a cited paper, in that paper’s system. Not automatically true here.'],
    ['prop', 'Proposed in this project', 'Something the proposal commits to doing. A plan, not a result.'],
    ['hyp', 'Hypothesis', 'A falsifiable prediction the project tests. It may turn out false.'],
    ['asm', 'Assumption', 'Something that must hold for a step to work. Often worth checking explicitly.'],
    ['pilot', 'Pilot-dependent design choice', 'A setting or decision the pilot will fix (dwell pair, current, windows, thresholds).'],
    ['sim', 'Teaching simulation', 'Invented numbers that show how an idea works. Never a prediction or result.'],
    ['unres', 'Unresolved question', 'Not settled by the proposal or the literature. Say so in an interview.'],
    ['bgd', 'Background · outside the proposal', 'General scientific context added for teaching, not a claim of the proposal or its sources.'],
  ];
  const legendHTML = () => `<div class="legend-grid">${LEGEND.map(([k, , d]) => `<div>${WC.ev(k)}<span class="muted">${d}</span></div>`).join('')}</div>`;

  /* ---------- Home ---------- */
  function heroFigure() {
    const W = 460, H = 270;
    const f = S.frame({ w: W, h: H, x: [0, 1], y: [0, 30], xt: [0, .5, 1], yt: [0, 10, 20, 30], xfmt: (v) => ['short', 'mid', 'long'][v * 2], xl: 'heating dwell t', yl: 'late-window n-propanol', m: { l: 52, b: 42, t: 18, r: 20 } });
    const n2 = (t) => 12 + 2 * t, co = (t) => 22 - 6 * t;
    const pts = (fn) => Array.from({ length: 21 }, (_, i) => [f.x(i / 20), f.y(fn(i / 20))]);
    let g = f.axes;
    g += `<path d="${S.path(pts(n2))}" style="fill:none;stroke:var(--c-n2);stroke-width:2.6" stroke-dasharray="7 5"/><path d="${S.path(pts(co))}" style="fill:none;stroke:var(--c-co);stroke-width:2.6"/>`;
    [0, 1].forEach((t) => { g += `<line x1="${f.x(t) + (t ? -8 : 8)}" x2="${f.x(t) + (t ? -8 : 8)}" y1="${f.y(n2(t))}" y2="${f.y(co(t))}" style="stroke:var(--c-theta);stroke-width:2"/><text x="${f.x(t) + (t ? -14 : 14)}" y="${(f.y(n2(t)) + f.y(co(t))) / 2 + 4}" text-anchor="${t ? 'end' : 'start'}" class="svg-label" style="fill:var(--c-theta)">g(${t ? 't' : 't_ref'})</text>`; });
    g += `<text x="${f.x(.5)}" y="${f.y(co(.5)) - 10}" class="svg-label" text-anchor="middle" style="fill:var(--c-co)">activated in CO</text><text x="${f.x(.5)}" y="${f.y(n2(.5)) + 18}" class="svg-label" text-anchor="middle" style="fill:var(--c-n2)">activated in N₂</text>`;
    return S.svg(W, H, g, 'Illustration: n-propanol output versus heating dwell for CO-activated and N2-activated electrodes. The gap between the lines, the gas effect g, shrinks with dwell, so theta is nonzero.');
  }
  V.home = {
    render(view) {
      const last = WC.state.last && WC.state.last !== '#home' ? WC.state.last : '';
      const done = WC.lessons.filter((l) => WC.state.done[l.id]).length;
      view.innerHTML = `<div class="home">
<section class="home-hero">
  <div>
    <div class="kicker"><span>NSF GRFP research proposal</span><span class="k-part">Interactive study guide</span></div>
    <h1>Learning to make the <em>working</em> catalyst</h1>
    <p class="home-q">“Does activation overwrite precursor structure, or can both histories shape the working catalyst?”</p>
    <p class="lede" style="margin-top:0">Twenty-nine lessons, every one of the proposal’s 61 sentences annotated, the eight cited papers with their limits, and a notebook for preparing to defend it.</p>
    <div class="btn-row">${last ? `<a class="btn btn-primary" href="${esc(last)}">Continue where you left off →</a><a class="btn" href="#l-transform">Start from lesson 1</a>` : `<a class="btn btn-primary" href="#l-transform">Start with lesson 1 →</a>`}<a class="btn" href="#sentences">Read every sentence</a><a class="btn" href="#defense">Practice the defense</a></div>
    <p class="small muted ui">${done} of ${WC.lessons.length} lessons marked understood. Progress and notes stay in this browser; export them from the <a href="#notebook">notebook</a>.</p>
  </div>
  <figure class="hero-fig"><div class="chart">${heroFigure()}</div><figcaption>${WC.ev('sim', 'Illustration')} The proposal’s target in one picture. At each dwell t, the gas effect g(t) is the gap between the lines. θ(t) = g(t) − g(t_ref) asks whether that gap changes with dwell. Here it shrinks, so θ ≠ 0: the activation effect depends on how the precursor was made. Invented curves.</figcaption></figure>
</section>
<h2>How to read this guide</h2>
<p class="ui small" style="max-width:72ch">Every claim carries a label so you never confuse what is known with what is planned, hypothesized or invented for teaching. The <strong>Intuitive / Rigorous</strong> switch at the top changes depth everywhere: rigorous mode adds equations, edge cases and stricter wording.</p>
${legendHTML()}
<h2>Four parts</h2>
<div class="parts">${WC.PARTS.map((p) => `<div class="part-card"><span class="pn">PART ${p.n}</span><h3>${esc(p.title)}</h3><p>${esc(p.blurb)}</p><ol>${WC.lessons.filter((l) => l.part === p.id).map((l) => `<li><a href="#l-${l.id}"><span class="ln">${WC.lessonNum(l.id)}</span><span>${esc(l.short)}${WC.state.done[l.id] ? ' <span style="color:var(--patina)" aria-label="understood">✓</span>' : ''}</span></a></li>`).join('')}</ol></div>`).join('')}</div>
<h2>Study tools</h2>
<div class="tool-row">
<a class="tool-card" href="#sentences"><b>Every sentence</b><span>All 61 sentences with plain English, purpose, status, assumptions, the reviewer’s challenge and your best defense.</span></a>
<a class="tool-card" href="#sources"><b>Scientific foundation</b><span>What each of the eight papers studied, found, and does not establish for this proposal.</span></a>
<a class="tool-card" href="#defense"><b>Oral defense</b><span>${WC.oral.length} PI-level questions. Answer in writing, then compare with a model answer and common weak answers.</span></a>
<a class="tool-card" href="#review"><b>Spaced review</b><span>Questions you missed come back first. Rate yourself on the ${WC.concepts.length} concepts you should explain from memory.</span></a>
<a class="tool-card" href="#notebook"><b>Notebook</b><span>Lesson, sentence and paper notes; adviser questions; open doubts; proposal edits; experiments you would change. Export to Markdown or JSON.</span></a>
<a class="tool-card" href="#proposal"><b>Original proposal</b><span>The exact two pages, embedded offline, with the text keyed to paragraph IDs.</span></a>
</div>
<h2>A suggested route</h2>
<ol class="ui small" style="max-width:72ch"><li>Read Part I in Intuitive mode. Don’t skip the knowledge checks; they feed your review queue.</li><li>Work through Parts II and III with every interactive. Change one control at a time and predict the result first.</li><li>Switch to Rigorous and reread lessons 7, 8, 18, 19 and 22.</li><li>Walk the 61 sentences and write a one-line defense for the ones marked with a challenge you could not answer.</li><li>Do ten oral-defense questions aloud with the timer, then the teach-back in lesson 29.</li></ol>
</div>`;
    },
  };

  /* ---------- Sentence explorer ---------- */
  const STATUS_OPTS = [['', 'All statuses'], ['lit', 'Prior literature'], ['pexp', 'Proposed experiment'], ['hyp', 'Hypothesis'], ['meth', 'Methodology'], ['feas', 'Feasibility'], ['bi', 'Broader impact']];
  let sentFilter = { q: '', st: '', notes: false };
  V.sentence = {
    render(view, r) {
      view.innerHTML = `<div style="max-width:1320px"><div class="kicker"><span>Every-sentence mode</span><span class="k-part">61 sentences · proposal text unchanged</span></div><h1>Every sentence, defended</h1>
<p class="lede">Select a sentence to see what it means, why it is there, what it quietly assumes, how a skeptical reviewer would push on it, and how to answer. The proposal text is shown exactly as written.</p>
<div class="explorer-filters ui"><label>Filter sentences<input id="sf-q" type="search" placeholder="e.g. companion, charge, replay" value="${esc(sentFilter.q)}"></label><label>Evidence status<select id="sf-st">${STATUS_OPTS.map(([k, n]) => `<option value="${k}"${sentFilter.st === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label><label class="check-row" style="flex:0 0 auto;align-self:center"><input type="checkbox" id="sf-notes"${sentFilter.notes ? ' checked' : ''}> With my notes</label></div>
<div class="explorer"><div class="reading" id="sent-reading"></div><aside class="annot" id="annot" aria-live="polite" aria-label="Sentence annotation"></aside></div></div>`;
      $('#sf-q').addEventListener('input', (e) => { sentFilter.q = e.target.value; drawReading(); });
      $('#sf-st').addEventListener('change', (e) => { sentFilter.st = e.target.value; drawReading(); });
      $('#sf-notes').addEventListener('change', (e) => { sentFilter.notes = e.target.checked; drawReading(); });
      drawReading();
      this.update(r, true);
      const onKey = (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.ctrlKey || e.metaKey || $('#modal-back')) return;
        if (e.key === 'j' || e.key === 'k') { const id = (WC.route || {}).id || WC.sentences[0].id; const i = WC.sentences.findIndex((s) => s.id === id); const n = WC.sentences[i + (e.key === 'j' ? 1 : -1)]; if (n) location.hash = `#s-${n.id}`; }
      };
      document.addEventListener('keydown', onKey);
      WC.teardown = () => document.removeEventListener('keydown', onKey);
    },
    update(r, first) {
      const id = r.id || WC.sentences[0].id;
      $$('#sent-reading .sent').forEach((b) => b.setAttribute('aria-current', String(b.dataset.sid === id)));
      drawAnnot(id);
      const cur = $(`#sent-reading .sent[data-sid="${id}"]`);
      if (cur && !first) cur.scrollIntoView({ block: 'nearest' });
      if (cur && first && r.id) setTimeout(() => cur.scrollIntoView({ block: 'center' }), 30);
    },
  };
  function sentMatches(s) {
    const x = WC.sentenceExtra[s.id] || {};
    if (sentFilter.st && x.st !== sentFilter.st) return false;
    if (sentFilter.notes && !(WC.state.notes.sentence[s.id] || '').trim()) return false;
    if (sentFilter.q) { const q = sentFilter.q.toLowerCase(); if (!`${s.text} ${s.plain} ${s.why} ${x.ch} ${x.def}`.toLowerCase().includes(q)) return false; }
    return true;
  }
  function drawReading() {
    const box = $('#sent-reading'); if (!box) return;
    const cur = (WC.route || {}).id || WC.sentences[0].id;
    const any = WC.sentences.some(sentMatches);
    box.innerHTML = (any ? '' : '<p class="muted ui">No sentences match these filters.</p>') + WC.paragraphs.map((p) => {
      const ss = WC.sentences.filter((s) => s.pid === p.id);
      return `<section class="para-block" aria-label="${esc(p.title)}"><h2 class="lab">${p.id} · ${esc(p.title)} <span class="muted">· p.${p.page}</span></h2>${ss.map((s) => { const m = sentMatches(s); const note = (WC.state.notes.sentence[s.id] || '').trim(); return `<a class="sent${m ? '' : ' dim'}${note ? ' has-note' : ''}" href="#s-${s.id}" data-sid="${s.id}" aria-current="${s.id === cur}"><span class="sid">${s.id.slice(3)}</span>${esc(s.text)}</a> `; }).join('')}</section>`;
    }).join('');
  }
  function drawAnnot(id) {
    const box = $('#annot'); if (!box) return;
    const i = WC.sentences.findIndex((s) => s.id === id);
    const s = WC.sentences[i];
    if (!s) { box.innerHTML = '<div class="annot-head"><p>Unknown sentence.</p></div>'; return; }
    const x = WC.sentenceExtra[s.id] || {};
    const prev = WC.sentences[i - 1], next = WC.sentences[i + 1];
    box.innerHTML = `<div class="annot-head"><div class="meta"><span>${s.id}</span><span>${esc(s.section)}</span><span>page ${s.page}</span>${WC.ev(x.st || 'meth')}</div><p class="annot-orig">${esc(s.text)}</p></div>
<div class="annot-body">
<div class="annot-field"><h3 class="lab"><i>1</i>Plain English</h3><p>${s.plain}</p></div>
<div class="annot-field"><h3 class="lab"><i>2</i>Scientific purpose</h3><p>${s.why}</p></div>
<div class="annot-field"><h3 class="lab"><i>3</i>Evidence status</h3><p>${WC.ev(x.st || 'meth')} ${statusExplain(x.st)}</p></div>
<div class="annot-field"><h3 class="lab"><i>4</i>Hidden assumptions</h3>${x.asm && x.asm.length ? `<ul>${x.asm.map((a) => `<li>${a}</li>`).join('')}</ul>` : '<p class="muted">None beyond those of the surrounding sentences.</p>'}</div>
<div class="annot-field"><h3 class="lab"><i>5</i>What it does not claim</h3><p>${s.watch}</p></div>
<div class="annot-field"><h3 class="lab"><i>6</i>Reviewer challenge</h3><p><strong>${x.ch || '—'}</strong></p></div>
<div class="annot-field"><h3 class="lab"><i>7</i>Best defense</h3><details><summary>Try answering aloud first, then reveal</summary><p style="margin-top:.5rem">${x.def || '—'}</p></details></div>
<div class="annot-field"><h3 class="lab"><i>8</i>Go deeper</h3><div class="chips">${(x.ls || []).map((l) => `<a class="chip chip-go" href="#l-${l}" data-ret="${s.id}">Lesson ${WC.lessonNum(l)} · ${esc(WC.lessonTitle(l).replace(/<[^>]+>/g, ''))} </a>`).join('')}${(x.refs || []).map((n) => `<a class="chip chip-ref" href="#src-${n}" data-ret="${s.id}">[${n}] ${esc(WC.refs[n - 1].short)}</a>`).join('')}<button class="chip chip-src" data-src="${s.pid}">Whole paragraph</button></div></div>
<div class="annot-field"><h3 class="lab"><i>✎</i>My note on this sentence</h3><label class="sr-only" for="sn-${s.id}">Note on ${s.id}</label><textarea id="sn-${s.id}" placeholder="How would you say this in your own words? What would you change?">${esc(WC.state.notes.sentence[s.id] || '')}</textarea>
<div data-capture-box style="margin-top:.6rem"><label class="small muted" for="scap-${s.id}">Capture with this sentence as context</label><div class="nb-add" style="margin-top:.3rem"><input id="scap-${s.id}" type="text" placeholder="An edit, a question, a doubt…"></div><div class="capture">${Object.keys(WC.LISTS).map((k) => `<button class="btn btn-sm" data-capture="${k}">+ ${esc(WC.LISTS[k][0])}</button>`).join('')}</div></div></div>
</div>
<nav class="annot-nav ui" aria-label="Sentence navigation">${prev ? `<a class="btn btn-sm" href="#s-${prev.id}">← ${prev.id}</a>` : '<span></span>'}<span class="small muted">${i + 1} / ${WC.sentences.length} · <kbd>j</kbd> <kbd>k</kbd></span>${next ? `<a class="btn btn-sm" href="#s-${next.id}">${next.id} →</a>` : '<span></span>'}</nav>`;
    $(`#sn-${s.id}`).addEventListener('input', (e) => { WC.state.notes.sentence[s.id] = e.target.value; WC.saveSoon(); const b = $(`#sent-reading .sent[data-sid="${s.id}"]`); b && b.classList.toggle('has-note', !!e.target.value.trim()); });
    $$('[data-ret]', box).forEach((a) => a.addEventListener('click', () => WC.setReturn(`#s-${a.dataset.ret}`, `sentence ${a.dataset.ret}`)));
  }
  function statusExplain(st) {
    return {
      lit: 'Reports what earlier work found. Check that the sentence does not stretch it beyond that system.',
      pexp: 'Describes work the project will do. It is a plan, not a result.',
      hyp: 'A falsifiable prediction or the question that frames one.',
      meth: 'A design or analysis rule that protects the interpretation.',
      feas: 'An argument that the work can be done, or a constraint on how.',
      bi: 'A benefit beyond the research itself, with its delivery plan.',
    }[st] || '';
  }

  /* ---------- Sources ---------- */
  V.source = {
    render(view, r) {
      view.innerHTML = `<div class="lesson" style="max-width:1000px"><div class="kicker"><span>Scientific foundation</span><span class="k-part">8 cited papers</span></div><h1>What each paper does, and does not, establish</h1>
<p class="lede">Each card separates what the paper found in its own system from what it cannot tell you about this proposal. Read the red panel before citing a paper in an interview.</p>
${WC.call('note', '<p>Summaries were checked against each paper’s published abstract and indexed summaries (October 2026). Publisher full texts were not reachable from the environment that built this guide, so only numbers stated in abstracts are used. Confirm figure-level details in the PDFs before quoting them. External links need internet; everything else works offline.</p>', { title: 'How these summaries were checked' })}
${WC.refs.map((p, i) => paperCard(p, i + 1)).join('')}</div>`;
      $$('textarea[data-paper]', view).forEach((t) => t.addEventListener('input', () => { WC.state.notes.paper[t.dataset.paper] = t.value; WC.saveSoon(); }));
      $$('[data-ret-src]', view).forEach((a) => a.addEventListener('click', () => WC.setReturn(`#src-${a.dataset.retSrc}`, `paper [${a.dataset.retSrc}]`)));
      this.update(r);
    },
    update(r) { if (r.id) { const c = $(`#paper-${r.id}`); if (c) setTimeout(() => c.scrollIntoView({ block: 'start' }), 20); } },
  };
  function paperCard(p, n) {
    const deps = WC.sentences.filter((s) => (WC.sentenceExtra[s.id] || {}).refs && WC.sentenceExtra[s.id].refs.includes(n));
    return `<article class="paper" id="paper-${n}" aria-labelledby="paper-h-${n}"><header class="paper-head"><span class="paper-num">[${n}]</span><div><h2 class="paper-title" id="paper-h-${n}">${esc(p.title)}</h2><div class="cite">${esc(p.authors)} · <em>${esc(p.journal)}</em> · <a href="${p.url}" target="_blank" rel="noopener">Open paper ↗</a></div></div></header>
<div class="paper-grid"><div><h3 class="lab">What it studied</h3><p>${p.studied}</p></div><div><h3 class="lab">System</h3><p>${p.system}</p></div>
<div><h3 class="lab">${WC.ev('est', 'What it found')}</h3><ul>${p.found.map((f) => `<li>${f}</li>`).join('')}</ul></div><div><h3 class="lab">Why it is cited here</h3><p>${p.why}</p></div>
<div class="paper-not" style="grid-column:1/-1"><h3 class="lab">${WC.ev('unres', 'What it does not establish for this proposal')}</h3><ul>${p.not.map((f) => `<li>${f}</li>`).join('')}</ul></div></div>
<div class="paper-foot"><div><strong>Proposal sentences that depend on it:</strong> ${deps.length ? deps.map((s) => `<a class="chip" href="#s-${s.id}" data-ret-src="${n}">${s.id}</a>`).join(' ') : '<span class="muted">none directly</span>'}</div>
<div><label for="pn-${n}" class="small muted">My notes on this paper</label><textarea id="pn-${n}" data-paper="${n}" placeholder="What would you check in the PDF? What could a reviewer say about this citation?">${esc(WC.state.notes.paper[n] || '')}</textarea></div></div></article>`;
  }

  /* ---------- Glossary ---------- */
  let glossQ = '';
  V.glossary = {
    render(view, r) {
      const letters = [...new Set(WC.glossary.map((g) => g.term[0].toUpperCase()))];
      view.innerHTML = `<div class="lesson" style="max-width:1000px"><div class="kicker"><span>Glossary</span><span class="k-part">${WC.glossary.length} terms</span></div><h1>Words that are easy to conflate</h1>
<p class="lede">Dotted-underlined words in lessons open these definitions in place.</p>
<label class="ui small muted" for="gq">Filter terms</label><input id="gq" type="search" value="${esc(glossQ)}" placeholder="grain, companion, θ…" style="max-width:420px;display:block;margin-top:.3rem">
<nav class="gloss-alpha" aria-label="Jump to letter">${letters.map((l) => `<a href="#glossary-${WC.slug(WC.glossary.find((g) => g.term[0].toUpperCase() === l).term)}">${l}</a>`).join('')}</nav>
<div class="gloss-list" id="gl"></div></div>`;
      const draw = () => { const q = glossQ.toLowerCase(); $('#gl').innerHTML = WC.glossary.filter((g) => !q || `${g.term} ${stripTags(g.def)} ${(g.alias || []).join(' ')}`.toLowerCase().includes(q)).map((g) => `<div class="gloss-item" id="glossary-${WC.slug(g.term)}" tabindex="-1"><b>${esc(g.term)}</b>${g.def}${g.src ? ` <button class="chip chip-src" data-src="${g.src}">${g.src}</button>` : ''}</div>`).join('') || '<p class="muted">No terms match.</p>'; };
      $('#gq').addEventListener('input', (e) => { glossQ = e.target.value; draw(); });
      draw(); this.update(r);
    },
    update(r) { if (r.id) { const el = document.getElementById(`glossary-${r.id}`); if (el) setTimeout(() => { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); el.focus({ preventScroll: true }); }, 20); } },
  };

  /* ---------- Notebook ---------- */
  let nbTab = 'lists';
  V.notebook = {
    render(view) {
      view.innerHTML = `<div class="lesson" style="max-width:980px"><div class="kicker"><span>Notebook</span><span class="k-part">${WC.storageOK() ? 'Saved in this browser' : 'Storage unavailable: export to keep'}</span></div><h1>Your study notebook</h1>
<p class="lede">Everything you write in lessons, sentences and papers collects here. Nothing leaves your browser unless you export it.</p>
<div class="seg nb-tabs" role="tablist" aria-label="Notebook sections">${[['lists', 'Lists'], ['lesson', 'Lesson notes'], ['sentence', 'Sentence notes'], ['paper', 'Paper notes'], ['data', 'Export & import']].map(([k, n]) => `<button role="tab" aria-selected="${nbTab === k}" data-nb="${k}">${n}</button>`).join('')}</div>
<div id="nb-body"></div></div>`;
      $$('[data-nb]', view).forEach((b) => b.addEventListener('click', () => { nbTab = b.dataset.nb; $$('[data-nb]', view).forEach((x) => x.setAttribute('aria-selected', String(x === b))); drawNB(); }));
      drawNB();
    },
  };
  function drawNB() {
    const body = $('#nb-body'); if (!body) return;
    const s = WC.state;
    if (nbTab === 'lists') {
      body.innerHTML = Object.entries(WC.LISTS).map(([k, [name, d]]) => `<section aria-labelledby="nbh-${k}"><h2 id="nbh-${k}" style="font-size:1.3rem">${esc(name)} <span class="muted small mono">${s.lists[k].filter((x) => !x.done).length} open</span></h2><p class="small muted ui">${esc(d)}</p>
<form class="nb-add" data-add="${k}"><label class="sr-only" for="nba-${k}">Add to ${esc(name)}</label><input id="nba-${k}" type="text" placeholder="Add an item…"><button class="btn btn-sm btn-primary" type="submit">Add</button></form>
<ul class="nb-list">${s.lists[k].map((it) => `<li class="${it.done ? 'done' : ''}"><input type="checkbox" aria-label="Mark done: ${esc(it.text)}" data-tog="${k}:${it.id}" ${it.done ? 'checked' : ''}><span><span class="nb-text">${esc(it.text)}</span>${it.ctx ? `<span class="nb-ctx">${esc(it.ctx)}</span>` : ''}</span><button class="btn btn-ghost btn-sm" data-del="${k}:${it.id}" aria-label="Delete: ${esc(it.text)}">Delete</button></li>`).join('') || '<li><span></span><span class="muted small">Nothing yet.</span><span></span></li>'}</ul></section>`).join('');
      $$('form[data-add]', body).forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); const i = $('input', f); const v = i.value.trim(); if (!v) return; WC.addListItem(f.dataset.add, v, 'Notebook'); drawNB(); const ni = $(`#nba-${f.dataset.add}`); ni && ni.focus(); }));
      $$('[data-tog]', body).forEach((c) => c.addEventListener('change', () => { const [k, id] = c.dataset.tog.split(':'); const it = s.lists[k].find((x) => x.id === id); if (it) { it.done = c.checked; WC.save(); drawNB(); } }));
      $$('[data-del]', body).forEach((b) => b.addEventListener('click', () => { const [k, id] = b.dataset.del.split(':'); s.lists[k] = s.lists[k].filter((x) => x.id !== id); WC.save(); drawNB(); WC.toast('Deleted'); }));
    } else if (nbTab === 'lesson') {
      const ls = WC.lessons.filter((l) => (s.notes.lesson[l.id] || '').trim());
      body.innerHTML = ls.length ? ls.map((l) => `<div class="note-card"><h3 class="lab"><a href="#l-${l.id}">${WC.lessonNum(l.id)}. ${stripTags(l.title)}</a></h3><div class="note-text">${esc(s.notes.lesson[l.id])}</div></div>`).join('') : '<p class="muted">No lesson notes yet. Each lesson ends with a notes box.</p>';
    } else if (nbTab === 'sentence') {
      const ss = WC.sentences.filter((x) => (s.notes.sentence[x.id] || '').trim());
      body.innerHTML = ss.length ? ss.map((x) => `<div class="note-card"><h3 class="lab"><a href="#s-${x.id}">${x.id}</a></h3><p class="small muted">${esc(x.text)}</p><div class="note-text">${esc(s.notes.sentence[x.id])}</div></div>`).join('') : '<p class="muted">No sentence notes yet. Open <a href="#sentences">Every sentence</a> to add some.</p>';
    } else if (nbTab === 'paper') {
      const ps = WC.refs.map((p, i) => [p, i + 1]).filter(([, n]) => (s.notes.paper[n] || '').trim());
      body.innerHTML = ps.length ? ps.map(([p, n]) => `<div class="note-card"><h3 class="lab"><a href="#src-${n}">[${n}] ${esc(p.short)}</a></h3><div class="note-text">${esc(s.notes.paper[n])}</div></div>`).join('') : '<p class="muted">No paper notes yet. Each card on <a href="#sources">Sources</a> has a notes box.</p>';
    } else {
      body.innerHTML = `<h2 style="font-size:1.3rem">Export</h2><div class="btn-row"><button class="btn btn-primary" id="nb-md">Export study notes (Markdown)</button><button class="btn" id="nb-json">Export full backup (JSON)</button></div>
<h2 style="font-size:1.3rem">Import</h2><p class="small ui">Restore a JSON backup exported from this guide. You will be able to merge or replace.</p><label class="btn" for="nb-file">Choose backup file…</label><input id="nb-file" type="file" accept="application/json,.json" class="sr-only">
<h2 style="font-size:1.3rem">Reset</h2><p class="small ui">Clears progress, quiz history, notes and lists in this browser. Export first if you want to keep them.</p><button class="btn" id="nb-reset">Reset everything…</button><div id="nb-confirm"></div>`;
      $('#nb-md').addEventListener('click', () => WC.showExport('md'));
      $('#nb-json').addEventListener('click', () => WC.showExport('json'));
      $('#nb-file').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) WC.importFile(f); e.target.value = ''; });
      $('#nb-reset').addEventListener('click', () => {
        $('#nb-confirm').innerHTML = `<div class="readout warn ui" style="margin-top:.8rem"><p>This permanently deletes everything stored by this guide in this browser.</p><div class="btn-row"><button class="btn btn-copper" id="nb-reset-yes">Delete everything</button><button class="btn" id="nb-reset-no">Keep my data</button></div></div>`;
        $('#nb-reset-yes').addEventListener('click', () => { const t = WC.state.theme; WC.state = WC.blankState(); WC.state.theme = t; WC.save(); WC.applyDepth(); WC.toast('Everything reset'); drawNB(); });
        $('#nb-reset-no').addEventListener('click', () => { $('#nb-confirm').innerHTML = ''; });
      });
    }
  }

  /* ---------- Review ---------- */
  V.review = {
    render(view) {
      const visited = WC.lessons.filter((l) => WC.state.visited[l.id]);
      const maxIdx = visited.length ? Math.max(...visited.map((l) => WC.lessonIndex(l.id))) + 1 : 5;
      const qs = WC.pickReview(Math.max(5, maxIdx), 8, Date.now() % 100000);
      view.innerHTML = `<div class="lesson"><div class="kicker"><span>Spaced review</span><span class="k-part">${qs.length} questions</span></div><h1>Retrieve, don’t reread</h1>
<p class="lede">Questions come from lessons you have opened (or Part I if you have not started). Questions you missed come first, then ones you have never answered, then the oldest. Reload this page for a fresh draw.</p>
${qs.map((q) => WC.check(q.id).replace('class="check"', 'class="check" data-from="1"')).join('')}
<p class="ui small"><a href="#progress">See concept mastery →</a></p></div>`;
      WC.renderChecks(view);
    },
  };

  /* ---------- Progress ---------- */
  V.progress = {
    render(view) {
      const s = WC.state;
      const done = WC.lessons.filter((l) => s.done[l.id]).length;
      const qa = Object.values(s.quiz);
      const totalA = qa.reduce((a, b) => a + b.n, 0), right = qa.reduce((a, b) => a + b.right, 0);
      const cs = WC.concepts.map((c) => [c, WC.conceptStatus(c.id)]);
      const mastered = cs.filter(([, x]) => x.status === 'm').length, review = cs.filter(([, x]) => x.status === 'r').length;
      view.innerHTML = `<div class="lesson" style="max-width:1000px"><div class="kicker"><span>Progress</span></div><h1>Where you stand</h1>
<div class="grid-4" style="margin:1.2rem 0"><div class="stat"><small>Lessons understood</small><b>${done}/${WC.lessons.length}</b></div><div class="stat"><small>Quiz answers</small><b>${totalA ? Math.round((100 * right) / totalA) : 0}%</b><span>${right} of ${totalA} correct</span></div><div class="stat ok"><small>Concepts mastered</small><b>${mastered}/${WC.concepts.length}</b></div><div class="stat hi"><small>Need review</small><b>${review}</b></div></div>
<h2>Concepts you should explain from memory</h2>
<p class="small ui muted">Status combines your quiz answers (last attempt per question) with your own rating. A concept is “mastered” when every question you answered on it is right and you have not rated yourself shaky, or when you rate yourself confident. Gamification is kept deliberately light.</p>
<div>${cs.map(([c, x]) => `<div class="conf-row"><div><span class="status-pill ${x.status}">${x.status === 'm' ? '✓ mastered' : x.status === 'r' ? '↻ review' : '· not yet'}</span> <a href="#l-${c.lesson}">${esc(c.label)}</a> <span class="muted small">· ${x.answered}/${x.total} questions answered</span></div><div class="self" role="group" aria-label="Self-rating for ${esc(c.label)}">${[[1, 'Shaky'], [2, 'Partly'], [3, 'Can explain']].map(([v, n]) => `<button data-self="${c.id}:${v}" aria-pressed="${x.self === v}">${n}</button>`).join('')}</div><div class="bar"><span style="width:${x.total ? (100 * x.right) / x.total : 0}%"></span></div></div>`).join('')}</div>
<h2>Lessons</h2>
${WC.PARTS.map((p) => `<h3>Part ${p.n} · ${esc(p.title)}</h3><ul class="ui small">${WC.lessons.filter((l) => l.part === p.id).map((l) => `<li>${s.done[l.id] ? '✓' : s.visited[l.id] ? '◐' : '○'} <a href="#l-${l.id}">${WC.lessonNum(l.id)}. ${esc(l.short)}</a>${s.done[l.id] ? '' : s.visited[l.id] ? ' <span class="muted">opened</span>' : ''}</li>`).join('')}</ul>`).join('')}</div>`;
      $$('[data-self]', view).forEach((b) => b.addEventListener('click', () => { const [cid, v] = b.dataset.self.split(':'); WC.state.self[cid] = WC.state.self[cid] === +v ? 0 : +v; WC.save(); V.progress.render(view); }));
    },
  };

  /* ---------- Oral defense ---------- */
  let defCur = null, defTopic = '', timer = null;
  V.defense = {
    render(view) {
      if (WC.pendingOral) { defCur = WC.pendingOral; WC.pendingOral = null; }
      const topics = [...new Set(WC.oral.map((o) => o.topic))];
      view.innerHTML = `<div class="defense"><div class="kicker"><span>Oral-defense mode</span><span class="k-part">${WC.oral.length} questions</span></div><h1>Answer like you are in the room</h1>
<p class="lede">Write or speak your answer before revealing anything. Then check which key ideas you named, read the model answer, and note which weak answers you came close to.</p>
<div class="btn-row ui"><label class="small muted" for="def-topic">Topic</label><select id="def-topic" style="max-width:220px"><option value="">All topics</option>${topics.map((t) => `<option${defTopic === t ? ' selected' : ''}>${t}</option>`).join('')}</select><button class="btn" id="def-rand">Random question</button><a class="btn btn-ghost" href="#l-teachback">Teach-back challenge →</a></div>
<div id="def-card"></div><h2>All questions</h2><ol class="ui small" id="def-list"></ol></div>`;
      $('#def-topic').addEventListener('change', (e) => { defTopic = e.target.value; pick(); });
      $('#def-rand').addEventListener('click', pick);
      if (!defCur) pick(); else drawQ();
      drawList();
      WC.teardown = () => { clearInterval(timer); };
    },
  };
  function pool() { return WC.oral.filter((o) => !defTopic || o.topic === defTopic); }
  function pick() {
    const p = pool();
    const unanswered = p.filter((o) => !(WC.state.oral[o.id] && WC.state.oral[o.id].rating));
    const from = unanswered.length ? unanswered : p;
    let n = from[Math.floor(Math.random() * from.length)];
    if (from.length > 1 && n.id === defCur) n = from[(from.indexOf(n) + 1) % from.length];
    defCur = n.id; drawQ();
  }
  function drawList() {
    const l = $('#def-list'); if (!l) return;
    l.innerHTML = WC.oral.map((o) => { const a = WC.state.oral[o.id]; return `<li><button class="btn btn-ghost btn-sm" data-pickq="${o.id}" style="text-align:left">${esc(o.q)}</button> ${a && a.rating ? `<span class="status-pill ${a.rating === 'strong' ? 'm' : a.rating === 'weak' ? 'r' : 'n'}">${a.rating}</span>` : ''}</li>`; }).join('');
    $$('[data-pickq]', l).forEach((b) => b.addEventListener('click', () => { defCur = b.dataset.pickq; drawQ(); $('#def-card').scrollIntoView({ block: 'start' }); }));
  }
  function drawQ() {
    const o = WC.oral.find((x) => x.id === defCur); if (!o) return;
    const saved = WC.state.oral[o.id] || {};
    clearInterval(timer);
    $('#def-card').innerHTML = `<section class="q-card" aria-labelledby="qtext"><div class="q-meta"><span>${esc(o.topic)}</span><span>Q${WC.oral.indexOf(o) + 1} of ${WC.oral.length}</span><span class="timer" id="def-timer" aria-live="off">0:00</span><button class="btn btn-sm" id="def-t">Start 2-minute timer</button></div>
<h2 class="q-text" id="qtext">${esc(o.q)}</h2>
<label for="def-ans" class="small muted">Your answer (saved automatically)</label><textarea id="def-ans" placeholder="Answer in full sentences, as you would to a PI.">${esc(saved.answer || '')}</textarea>
<div class="btn-row"><button class="btn btn-primary" id="def-reveal">Reveal and compare</button><button class="btn" id="def-next">Next question</button></div><div id="def-out"></div></section>`;
    $('#def-ans').addEventListener('input', (e) => { WC.state.oral[o.id] = Object.assign(WC.state.oral[o.id] || {}, { answer: e.target.value, ts: Date.now() }); WC.saveSoon(); });
    $('#def-next').addEventListener('click', pick);
    $('#def-t').addEventListener('click', () => {
      clearInterval(timer); let t = 0; const el = $('#def-timer');
      timer = setInterval(() => { t++; if (!el.isConnected) { clearInterval(timer); return; } el.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; if (t >= 120) { clearInterval(timer); el.textContent = '2:00 · time'; WC.toast('Two minutes. Wrap up in one sentence.'); } }, 1000);
    });
    $('#def-reveal').addEventListener('click', () => {
      const ans = ($('#def-ans').value || '').toLowerCase();
      const hits = o.keys.map(([label, kws]) => [label, kws.some((k) => ans.includes(k.toLowerCase()))]);
      $('#def-out').innerHTML = `<div class="reveal-grid">
<section><h3 class="lab">Key ideas a strong answer names</h3>${ans.trim() ? '' : '<p class="small muted">Write an answer first to see which ideas you named.</p>'}${hits.map(([l, h]) => `<div class="concept-hit ${ans.trim() ? (h ? 'hit' : 'miss') : ''}"><span class="mk" aria-hidden="true">${ans.trim() ? (h ? '✓' : '○') : '·'}</span><span>${esc(l)}${ans.trim() ? `<span class="sr-only">${h ? ' (mentioned)' : ' (not found)'}</span>` : ''}</span></div>`).join('')}<p class="small muted">Keyword matching is crude: it shows whether you named an idea, not whether you argued it well.</p></section>
<section><h3 class="lab">Model answer</h3><p>${o.model}</p></section>
<section><h3 class="lab">Common weak answers</h3><ul>${o.weak.map((w) => `<li>${w}</li>`).join('')}</ul></section>
<section><h3 class="lab">How did you do?</h3><div class="seg" role="group" aria-label="Rate your answer">${[['weak', 'Needs work'], ['ok', 'Okay'], ['strong', 'Strong']].map(([k, n]) => `<button data-rate="${k}" aria-pressed="${saved.rating === k}">${n}</button>`).join('')}</div></section></div>`;
      $$('[data-rate]', $('#def-out')).forEach((b) => b.addEventListener('click', () => { WC.state.oral[o.id] = Object.assign(WC.state.oral[o.id] || {}, { rating: b.dataset.rate, ts: Date.now() }); WC.save(); $$('[data-rate]', $('#def-out')).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); drawList(); if (b.dataset.rate === 'weak') WC.toast('Marked “needs work”. It will come up again.'); }));
    });
  }

  /* ---------- Original proposal ---------- */
  V.proposal = {
    render(view) {
      view.innerHTML = `<div style="max-width:1200px"><div class="kicker"><span>Original proposal</span><span class="k-part">${esc(WC.source.name)}</span></div><h1>The exact two pages</h1>
<p class="lede">The page images are embedded so the original is always one click away offline. Below them, the same text is keyed to the paragraph IDs used throughout this guide.</p>
<div class="btn-row"><button class="btn btn-primary" id="pdf-dl">Download the PDF</button><button class="btn" id="pdf-open">Open PDF in a new tab</button><span class="small muted mono">SHA-256 ${WC.source.sha256.slice(0, 16)}…</span></div>
<div class="pages"><figure><img src="${WC.assets.page1}" alt="Proposal page 1: title, Intellectual Merit opening, hypotheses and Aim 1." loading="lazy"></figure><figure><img src="${WC.assets.page2}" alt="Proposal page 2: Aim 2, preparation and feasibility, Broader Impacts, references." loading="lazy"></figure></div>
<p class="ui small" style="margin-top:1rem">The companion <a href="#notes">refinement notes</a> (definitions of θ, the acquisition rule, archive provenance) are also embedded.</p><h2>Text by paragraph</h2><div class="proposal-text">${WC.paragraphs.map((p) => `<h3><span class="pid">${p.id}</span>${esc(p.title)}</h3><p>${WC.sentences.filter((s) => s.pid === p.id).map((s) => `<a href="#s-${s.id}" style="color:inherit;text-decoration:none">${esc(s.text)}</a>`).join(' ')}</p>`).join('')}
<h3>References</h3><ol class="small">${WC.refs.map((r) => `<li>${esc(r.authors)}, <em>${esc(r.journal)}</em>. <a href="#src-${WC.refs.indexOf(r) + 1}">Guide card</a></li>`).join('')}</ol></div></div>`;
      const blob = () => { const bin = atob(WC.assets.pdf); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: 'application/pdf' }); };
      $('#pdf-dl').addEventListener('click', () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(blob()); a.download = WC.source.name; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500); WC.toast('Download started (if your browser allows it)'); } catch (e) { WC.toast('Download blocked here.'); } });
      $('#pdf-open').addEventListener('click', () => { try { const w = window.open(URL.createObjectURL(blob()), '_blank'); if (!w) WC.toast('Pop-up blocked. Use Download instead.'); } catch (e) { WC.toast('Opening blocked here. Use Download instead.'); } });
    },
  };

  /* ---------- Refinement notes ---------- */
  V.notes = {
    render(view) {
      view.innerHTML = `<div class="ref-notes"><div class="kicker"><span>Refinement notes</span><span class="k-part">Companion to the proposal · not part of the two-page submission</span></div><h1>Refinement notes</h1>
<p class="lede">The implementation detail behind the two pages: definitions of m, g and θ, the integrated-variance acquisition rule, archive provenance, and limits on interpretation. Reproduced from the original guide without edits. Where this guide explains an equation, these notes are the source.</p>
${(WC.refNotes || []).map((n) => `<section id="note-sec-${esc(n.id)}" aria-label="Refinement notes section ${esc(n.id)}">${n.html}</section>`).join('')}</div>`;
      $$('.ref-notes a[href^="http"]', view).forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
      $$('.ref-notes table', view).forEach((t) => { const w = document.createElement('div'); w.className = 'table-wrap'; t.parentNode.insertBefore(w, t); w.appendChild(t); });
    },
  };

  V.legend = { render(view) { view.innerHTML = `<div class="lesson"><h1>Evidence legend</h1><p class="lede">Each label pairs a glyph with words, so it reads without color.</p>${legendHTML()}</div>`; } };
})();
