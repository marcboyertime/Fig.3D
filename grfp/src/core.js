/* The Working Catalyst — core runtime.
   Plain browser JavaScript, no framework, no network. Everything hangs off one
   namespace (WC) so lesson files, widget files and view files can register
   themselves before boot. */
(function () {
  'use strict';
  const WC = (window.WC = window.WC || {});
  WC.lessons = WC.lessons || [];
  WC.widgets = WC.widgets || {};
  WC.quiz = WC.quiz || {};
  WC.views = WC.views || {};

  /* ---------- Small utilities ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fmt = (x, d = 1) => (Number.isFinite(x) ? (Math.abs(x) < 1e-9 ? 0 : x).toFixed(d) : '—');
  const signed = (x, d = 1) => (Number.isFinite(x) ? (x > 1e-9 ? '+' : x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(d) : '—');
  const stripTags = (h) => String(h).replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  let uidN = 0;
  const uid = (p = 'u') => `${p}-${(++uidN).toString(36)}`;
  /* Deterministic RNG so every simulation shows the same synthetic data on reload. */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    let u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function debounce(fn, ms) {
    let t;
    return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
  }
  Object.assign(WC, { esc, $, $$, clamp, fmt, signed, stripTags, uid, rng, gauss, debounce });

  /* ---------- Evidence vocabulary ----------
     Every claim category has a glyph and a word, so meaning never rides on color alone. */
  WC.EV = {
    est: ['◆', 'Established · prior work'],
    prop: ['▲', 'Proposed in this project'],
    hyp: ['H', 'Hypothesis'],
    asm: ['!', 'Assumption'],
    pilot: ['◐', 'Pilot-dependent choice'],
    sim: ['~', 'Teaching simulation'],
    unres: ['?', 'Unresolved question'],
    bgd: ['○', 'Background · outside the proposal'],
    lit: ['◆', 'Prior literature'],
    pexp: ['▲', 'Proposed experiment'],
    meth: ['≡', 'Methodology'],
    feas: ['■', 'Feasibility'],
    bi: ['+', 'Broader impact'],
  };
  const evClass = { lit: 'est', pexp: 'prop', meth: 'meth', feas: 'feas', bi: 'bi' };
  WC.ev = (k, label) => {
    const d = WC.EV[k] || ['•', k];
    return `<span class="ev ev-${evClass[k] || k}"><i aria-hidden="true">${d[0]}</i>${esc(label || d[1])}</span>`;
  };
  /* A short statement tagged with its evidence category. */
  WC.claim = (k, html) => `<div class="claim">${WC.ev(k)}<p>${html}</p></div>`;
  WC.claims = (rows) => `<div class="claims">${rows.map((r) => WC.claim(r[0], r[1])).join('')}</div>`;

  /* ---------- Content helpers used by lesson files ---------- */
  const CALL = {
    care: ['◎', 'Why should I care?'],
    mis: ['✕', 'Common misconception'],
    rev: ['?', 'Reviewer might ask…'],
    asm: ['!', 'This proposal assumes…'],
    dist: ['⇄', 'What experiment would distinguish these?'],
    unres: ['?', 'Unresolved question'],
    bgd: ['○', 'Background · outside the proposal'],
    key: ['▲', 'Key idea'],
    note: ['·', 'Note'],
  };
  /* call(kind, html, {title, side}) — side callouts move to the margin on wide screens. */
  WC.call = (kind, html, opts = {}) => {
    const c = CALL[kind] || CALL.note;
    const title = opts.title || c[1];
    return `<aside class="call call-${kind}${opts.side ? ' side' : ''}" aria-label="${esc(title)}"><div class="call-t"><i aria-hidden="true">${c[0]}</i>${esc(title)}</div>${html}</aside>`;
  };
  /* Reviewer question with a hidden best answer. */
  WC.reviewer = (q, a, side = true) => WC.call('rev', `<p><strong>${q}</strong></p><details><summary>Show a strong answer</summary><p>${a}</p></details>`, { side });
  WC.term = (word, key) => `<button type="button" class="term" data-term="${esc(key || word)}">${word}</button>`;
  WC.src = (pid, label) => `<button type="button" class="chip chip-src" data-src="${pid}">${esc(label || pid)} · proposal</button>`;
  WC.ref = (n, label) => `<a class="chip chip-ref" href="#src-${n}">[${n}] ${esc(label || (WC.refs && WC.refs[n - 1] ? WC.refs[n - 1].short : 'source'))}</a>`;
  WC.go = (lessonId, label) => `<a class="chip chip-go" href="#l-${lessonId}">${esc(label || WC.lessonTitle(lessonId))} </a>`;
  WC.link = (lessonId, label) => `<a href="#l-${lessonId}">${label}</a>`;
  WC.widget = (name, opts) => `<div class="widget wide" data-widget="${name}"${opts ? ` data-opts='${esc(JSON.stringify(opts))}'` : ''}><p class="muted small">Loading interactive…</p></div>`;
  WC.check = (qid) => `<div class="check" data-q="${qid}"></div>`;
  WC.rig = (html, title) => `<div class="rig rig-block"><span class="rig-tag">Rigorous version${title ? ' · ' + esc(title) : ''}</span>${html}</div>`;
  WC.eq = (math, read) => `<div class="eq" role="group" aria-label="Equation"><div class="math">${math}</div>${read ? `<div class="eq-read">${read}</div>` : ''}</div>`;
  WC.simBanner = (txt) => `<div class="sim-banner"><i aria-hidden="true">~</i>${esc(txt || 'Teaching simulation · invented numbers · not experimental evidence or a prediction')}</div>`;
  /* concept({title, steps:{intuition, diagram, formal, example, counter, why}}) — the seven-step progression as tabs. */
  const STEP_NAMES = [['intuition', 'Intuition'], ['diagram', 'Picture'], ['formal', 'Formal definition'], ['example', 'Example'], ['counter', 'Counterexample'], ['why', 'Why it matters here']];
  WC.concept = (o) => {
    const id = uid('cpt');
    const steps = STEP_NAMES.filter(([k]) => o[k]);
    const tabs = steps.map(([k, n], i) => `<button role="tab" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="tn">${i + 1}</span>${n}</button>`).join('');
    const panels = steps.map(([k], i) => `<div role="tabpanel" id="${id}-p${i}" aria-labelledby="${id}-t${i}"${i ? ' hidden' : ''}>${o[k]}</div>`).join('');
    return `<section class="concept" aria-label="Concept: ${esc(stripTags(o.title))}"><div class="concept-head"><span class="c-lab">Concept</span><h2 class="c-title">${o.title}</h2></div><div role="tablist" aria-label="Ways into ${esc(stripTags(o.title))}">${tabs}</div>${panels}${o.check ? `<div style="padding:0 1.1rem 1rem">${WC.check(o.check)}</div>` : ''}</section>`;
  };

  /* ---------- Persistent state ---------- */
  const KEY = 'working-catalyst-guide.v2';
  const blank = () => ({
    v: 2, theme: 'system', depth: 'intuitive', done: {}, visited: {}, quiz: {}, self: {},
    notes: { lesson: {}, sentence: {}, paper: {} },
    lists: { adviser: [], confused: [], edits: [], experiments: [] },
    oral: {}, teach: {}, last: '',
  });
  WC.LISTS = {
    adviser: ['Questions for my adviser', 'Things to ask a prospective PI or committee member.'],
    confused: ['Things I still don’t understand', 'Concepts to revisit before an interview.'],
    edits: ['Potential proposal edits', 'Wording or design changes to consider. The walkthrough never edits the proposal itself.'],
    experiments: ['Experiments I would change', 'Design alternatives, extra controls, or a different pilot.'],
  };
  let storageOK = true;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      return normalize(JSON.parse(raw));
    } catch (e) { storageOK = false; return blank(); }
  }
  function normalize(s) {
    const b = blank();
    if (!s || typeof s !== 'object') return b;
    const out = Object.assign(b, s);
    out.notes = Object.assign(blank().notes, s.notes || {});
    out.lists = Object.assign(blank().lists, s.lists || {});
    for (const k of Object.keys(out.lists)) if (!Array.isArray(out.lists[k])) out.lists[k] = [];
    for (const k of ['done', 'visited', 'quiz', 'self', 'oral', 'teach']) if (!out[k] || typeof out[k] !== 'object') out[k] = {};
    return out;
  }
  WC.state = load();
  WC.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(WC.state)); storageOK = true; } catch (e) { storageOK = false; }
    WC.updateRail && WC.updateRail();
  };
  WC.saveSoon = debounce(WC.save, 350);
  WC.storageOK = () => storageOK;
  WC.normalize = normalize;
  WC.blankState = blank;

  /* ---------- Theme & depth ---------- */
  function applyTheme() {
    const t = WC.state.theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    const b = $('#theme-btn');
    if (b) { b.querySelector('.lbl').textContent = { system: 'Auto', light: 'Light', dark: 'Dark' }[t] || 'Auto'; b.setAttribute('aria-label', `Color theme: ${t}. Change theme`); }
  }
  WC.cycleTheme = () => {
    const order = ['system', 'light', 'dark'];
    WC.state.theme = order[(order.indexOf(WC.state.theme) + 1) % 3];
    applyTheme(); WC.save(); WC.redrawCharts();
    toast(`Theme: ${WC.state.theme === 'system' ? 'follows your device' : WC.state.theme}`);
  };
  function applyDepth() {
    document.documentElement.setAttribute('data-depth', WC.state.depth);
    $$('.depth-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.depth === WC.state.depth)));
  }
  WC.setDepth = (d) => { WC.state.depth = d; applyDepth(); WC.save(); };
  WC.applyTheme = applyTheme; WC.applyDepth = applyDepth;
  /* Charts read CSS tokens at draw time; widgets register a redraw for theme changes. */
  const redrawers = new Set();
  WC.onRedraw = (fn) => { redrawers.add(fn); return () => redrawers.delete(fn); };
  WC.redrawCharts = () => redrawers.forEach((fn) => { try { fn(); } catch (e) { /* widget removed */ } });

  /* ---------- Toast & modal ---------- */
  let toastT;
  function toast(msg) {
    let t = $('#toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600);
  }
  WC.toast = toast;
  let modalReturn = null;
  WC.modal = function (title, html, opts = {}) {
    WC.closeModal();
    modalReturn = document.activeElement;
    const back = document.createElement('div');
    back.className = 'modal-back'; back.id = 'modal-back';
    back.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-head">${opts.head || `<h2 id="modal-title">${title}</h2>`}<button class="btn btn-ghost btn-sm" data-close aria-label="Close dialog">Close ✕</button></header><div class="modal-body">${html}</div></section>`;
    document.body.appendChild(back);
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) WC.closeModal(); });
    back.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); WC.closeModal(); }
      if (e.key === 'Tab') {
        const f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', back).filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    const first = opts.focus ? $(opts.focus, back) : $('[data-close]', back);
    (first || back).focus();
    if (opts.onOpen) opts.onOpen(back);
    return back;
  };
  WC.closeModal = function () {
    const m = $('#modal-back');
    if (m) { m.remove(); if (modalReturn && modalReturn.focus) modalReturn.focus(); modalReturn = null; }
  };

  /* ---------- Glossary popover ---------- */
  let pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  WC.closePop = closePop;
  function openTerm(btn) {
    closePop();
    const key = btn.dataset.term;
    const g = WC.findGloss(key);
    pop = document.createElement('div');
    pop.className = 'popover'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', `Definition: ${g ? g.term : key}`);
    pop.innerHTML = g
      ? `<b>${esc(g.term)}</b><div>${g.def}</div><div class="pop-actions"><a class="btn btn-sm" href="#glossary-${slug(g.term)}">Open glossary</a><button class="btn btn-sm" data-pop-confused>Add to “don’t understand”</button></div>`
      : `<b>${esc(key)}</b><div class="muted">No glossary entry yet.</div>`;
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let left = clamp(r.left, 16, window.innerWidth - pw - 16);
    let top = r.bottom + 8;
    if (top + ph > window.innerHeight - 16) top = Math.max(16, r.top - ph - 8);
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
    pop.addEventListener('click', (e) => {
      if (e.target.closest('[data-pop-confused]')) { WC.addListItem('confused', `What exactly is “${g ? g.term : key}”?`, WC.contextLabel()); closePop(); }
      if (e.target.closest('a')) closePop();
    });
    pop.tabIndex = -1; pop.focus();
  }
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9θ]+/g, '-').replace(/^-|-$/g, '');
  WC.slug = slug;
  WC.findGloss = (key) => {
    const k = String(key).toLowerCase();
    return (WC.glossary || []).find((g) => g.term.toLowerCase() === k || (g.alias || []).some((a) => a.toLowerCase() === k));
  };

  /* ---------- Lists (notebook) ---------- */
  WC.addListItem = function (list, text, ctx) {
    if (!text || !WC.state.lists[list]) return;
    WC.state.lists[list].push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: String(text).slice(0, 2000), ctx: ctx || '', done: false, ts: Date.now() });
    WC.save();
    toast(`Added to “${WC.LISTS[list][0]}”`);
  };

  /* ---------- Lessons registry ---------- */
  WC.PARTS = [
    { n: 'I', id: 'problem', title: 'The scientific problem', blurb: 'Why a copper catalyst changes, what prior work found, and the question it left open.' },
    { n: 'II', id: 'materials', title: 'The materials experiment', blurb: 'Making the precursor, activating it, the crossed pilot, structure, products and controls.' },
    { n: 'III', id: 'sdl', title: 'The self-driving lab', blurb: 'Hardware, fast and slow loops, θ(t), cost-aware choices, replay and fair benchmarks.' },
    { n: 'IV', id: 'defense', title: 'Defending the proposal', blurb: 'Both aims in plain English, falsification, feasibility, novelty, impact and teach-back.' },
  ];
  WC.lesson = (def) => { WC.lessons.push(def); };
  WC.lessonIndex = (id) => WC.lessons.findIndex((l) => l.id === id);
  WC.lessonTitle = (id) => { const l = WC.lessons.find((x) => x.id === id); return l ? l.title : id; };
  WC.lessonNum = (id) => WC.lessonIndex(id) + 1;
  const bodyCache = {};
  WC.lessonBody = (l) => (bodyCache[l.id] = bodyCache[l.id] || l.body());

  /* ---------- Quiz bank & mastery ---------- */
  WC.q = (def) => { WC.quiz[def.id] = def; };
  function quizRecord(qid, correct) {
    const r = (WC.state.quiz[qid] = WC.state.quiz[qid] || { n: 0, right: 0, last: null, ts: 0 });
    r.n += 1; if (correct) r.right += 1; r.last = !!correct; r.ts = Date.now();
    WC.save();
  }
  WC.conceptStatus = function (cid) {
    const qs = Object.values(WC.quiz).filter((q) => (q.concepts || []).includes(cid));
    const answered = qs.filter((q) => WC.state.quiz[q.id]);
    const right = answered.filter((q) => WC.state.quiz[q.id].last).length;
    const self = WC.state.self[cid] || 0;
    const score = answered.length ? right / answered.length : null;
    let status = 'n';
    if (answered.length && score < 1) status = 'r';
    else if (self === 1) status = 'r';
    else if ((answered.length && score === 1 && self !== 1) || self === 3) status = 'm';
    if (answered.length && score === 1 && self === 0 && answered.length < Math.min(2, qs.length)) status = 'n';
    return { total: qs.length, answered: answered.length, right, score, self, status };
  };
  function renderCheck(el) {
    const q = WC.quiz[el.dataset.q];
    if (!q) { el.innerHTML = `<p class="muted small">Missing question ${esc(el.dataset.q)}</p>`; return; }
    const from = el.dataset.from ? `<span class="from">from lesson ${WC.lessonNum(q.lesson)} · ${esc(stripTags(WC.lessonTitle(q.lesson)))}</span>` : '';
    const fb = `<div class="check-fb" aria-live="polite"></div>`;
    if (q.type === 'num') {
      const id = uid('num');
      el.innerHTML = `<div class="check-lab">${el.dataset.from ? 'Retrieval practice' : 'Knowledge check'} ${from}</div><div class="check-q">${q.q}</div><div class="check-num"><label class="sr-only" for="${id}">Your answer</label><input id="${id}" type="number" inputmode="decimal" step="any"><button class="btn btn-sm btn-primary" data-num-submit>Check</button></div>${fb}`;
    } else {
      const letters = 'ABCDEF';
      el.innerHTML = `<div class="check-lab">${el.dataset.from ? 'Retrieval practice' : 'Knowledge check'} ${from}</div><div class="check-q">${q.q}</div><div class="check-opts" role="group" aria-label="Answer choices">${q.choices.map((c, i) => `<button type="button" data-i="${i}"><span class="ol">${letters[i]}</span><span>${c}</span></button>`).join('')}</div>${fb}`;
    }
    const prev = WC.state.quiz[q.id];
    if (prev && prev.n) $('.check-fb', el).innerHTML = `<span class="muted small">You answered this before (${prev.right}/${prev.n} correct). Answer again to refresh your memory.</span>`;
  }
  function answerCheck(el, i, numVal) {
    const q = WC.quiz[el.dataset.q];
    let ok;
    if (q.type === 'num') {
      if (!Number.isFinite(numVal)) { $('.check-fb', el).innerHTML = '<span class="muted">Enter a number first.</span>'; return; }
      ok = Math.abs(numVal - q.answer) <= (q.tol || 0);
      $('input', el).disabled = true; $('[data-num-submit]', el).disabled = true;
    } else {
      ok = i === q.correct;
      $$('.check-opts button', el).forEach((b) => {
        const bi = +b.dataset.i; b.disabled = true;
        if (bi === q.correct) b.classList.add('right');
        if (bi === i && !ok) b.classList.add('wrong');
        b.setAttribute('aria-label', `${stripTags(b.textContent)}${bi === q.correct ? ' (correct answer)' : bi === i ? ' (your answer)' : ''}`);
      });
    }
    quizRecord(q.id, ok);
    const per = q.fb && i != null && q.fb[i] ? `<p>${q.fb[i]}</p>` : '';
    $('.check-fb', el).innerHTML = `<p><span class="verdict" style="color:${ok ? 'var(--patina)' : 'var(--st-unres)'}">${ok ? '✓ Correct.' : '✕ Not quite.'}</span> ${q.explain}</p>${per}<button class="btn btn-sm" data-retry>Try again later</button>`;
  }
  WC.renderChecks = (root) => $$('.check[data-q]', root).forEach(renderCheck);
  document.addEventListener('click', (e) => {
    const opt = e.target.closest('.check-opts button');
    if (opt && !opt.disabled) { answerCheck(opt.closest('.check'), +opt.dataset.i); return; }
    const ns = e.target.closest('[data-num-submit]');
    if (ns) { const el = ns.closest('.check'); answerCheck(el, null, parseFloat($('input', el).value)); return; }
    const rt = e.target.closest('[data-retry]');
    if (rt) { renderCheck(rt.closest('.check')); return; }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('.check-num input')) { const el = e.target.closest('.check'); answerCheck(el, null, parseFloat(e.target.value)); }
  });
  /* Spaced retrieval: earlier questions, missed first, then unseen, then oldest. */
  WC.pickReview = function (beforeIndex, n, seed) {
    const r = rng(seed || 7);
    const pool = Object.values(WC.quiz).filter((q) => WC.lessonIndex(q.lesson) >= 0 && WC.lessonIndex(q.lesson) < beforeIndex && !q.noReview);
    const score = (q) => {
      const s = WC.state.quiz[q.id];
      if (s && s.last === false) return 3 + r();
      if (!s) return 2 + r();
      return 1 + Math.min(.99, (Date.now() - s.ts) / 864e6) * r();
    };
    return pool.map((q) => [score(q), q]).sort((a, b) => b[0] - a[0]).slice(0, n).map((x) => x[1]);
  };

  /* ---------- Concept tabs (delegated) ---------- */
  function selectTab(tab) {
    const list = tab.parentElement;
    const tabs = $$('[role="tab"]', list);
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      const p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
  }
  WC.selectTab = selectTab;
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.concept [role="tab"]');
    if (tab) selectTab(tab);
  });
  document.addEventListener('keydown', (e) => {
    const tab = e.target.closest && e.target.closest('.concept [role="tab"]');
    if (!tab) return;
    const tabs = $$('[role="tab"]', tab.parentElement);
    const i = tabs.indexOf(tab);
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = tabs.length - 1;
    if (j != null) { e.preventDefault(); selectTab(tabs[j]); tabs[j].focus(); }
  });

  /* ---------- Global delegated interactions ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.term');
    if (t) { e.preventDefault(); openTerm(t); return; }
    const s = e.target.closest('[data-src]');
    if (s) { e.preventDefault(); WC.showParagraph(s.dataset.src); return; }
    if (pop && !e.target.closest('.popover')) closePop();
    const cap = e.target.closest('[data-capture]');
    if (cap) {
      const box = cap.closest('[data-capture-box]');
      const input = box && $('input', box);
      const text = input && input.value.trim();
      if (!text) { toast('Type something first, then choose a list.'); input && input.focus(); return; }
      WC.addListItem(cap.dataset.capture, text, WC.contextLabel());
      input.value = '';
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(); });

  WC.contextLabel = function () {
    const r = WC.route || {};
    if (r.kind === 'lesson') return `Lesson ${WC.lessonNum(r.id)} · ${WC.lessonTitle(r.id)}`;
    if (r.kind === 'sentence') return `Sentence ${r.id}`;
    if (r.kind === 'source') return `Source [${r.id}]`;
    return r.title || 'Guide';
  };

  /* Paragraph modal from the proposal */
  WC.showParagraph = function (pid) {
    const p = (WC.paragraphs || []).find((x) => x.id === pid);
    if (!p) return;
    const sents = WC.sentences.filter((s) => s.pid === pid);
    WC.modal(`${esc(p.title)} <span class="muted small mono">${pid} · page ${p.page}</span>`,
      `<p class="muted small ui">Exact proposal text. Select any sentence to open its full annotation.</p><div class="reading">${sents.map((s) => `<a class="sent" href="#s-${s.id}" data-close><span class="sid">${s.id.slice(3)}</span>${esc(s.text)}</a> `).join('')}</div>`);
  };
})();
