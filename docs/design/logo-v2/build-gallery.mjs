#!/usr/bin/env node
// build-gallery.mjs — assemble index.html from variations.json + results/*/
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(readFileSync(join(DIR, 'variations.json'), 'utf8'));
const basePrompt = readFileSync(join(DIR, 'base-prompt.md'), 'utf8');
const picks = existsSync(join(DIR, 'picks.json')) ? JSON.parse(readFileSync(join(DIR, 'picks.json'), 'utf8')) : { shortlist: [] };
const shortlist = new Map(picks.shortlist.map((p) => [p.id, p.why]));
const resultsDir = join(DIR, 'results');
const dirs = existsSync(resultsDir) ? readdirSync(resultsDir) : [];

const items = spec.variations.map((v) => {
  const dir = dirs.find((d) => d.startsWith(`${v.id}-`));
  const rel = dir ? `results/${dir}` : null;
  const has = (f) => rel && existsSync(join(DIR, rel, f));
  const readJson = (f) => (has(f) ? JSON.parse(readFileSync(join(DIR, rel, f), 'utf8')) : null);
  return {
    ...v,
    dir: rel,
    generated: has('source.png'),
    prompt: has('prompt.txt') ? readFileSync(join(DIR, rel, 'prompt.txt'), 'utf8') : null,
    meta: readJson('meta.json'),
    critique: readJson('critique.json'),
  };
});

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const axes = Object.keys(spec.axes);
const generated = items.filter((i) => i.generated).length;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>MemeOn logo v2 — noodle M options</title>
<style>
  :root { color-scheme: light dark; --ink:#19182A; --paper:#F6F6FC; --pink:#F99AD1; --uv:#B7B6F8; --sky:#74C9F9; }
  * { box-sizing: border-box; }
  body { margin:0; font: 14px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: var(--bg, #0E0E19); color: var(--fg, #F6F6FC); transition: background .2s; }
  body[data-theme="light"] { --bg:#F6F6FC; --fg:#19182A; --card:#fff; --muted:#6b6a80; --line:#e2e1ee; }
  body[data-theme="dark"]  { --bg:#0E0E19; --fg:#F6F6FC; --card:#19182A; --muted:#a3a2bd; --line:#2b2a44; }
  header { position: sticky; top:0; z-index:5; background: color-mix(in oklab, var(--bg) 88%, transparent); backdrop-filter: blur(10px); border-bottom:1px solid var(--line); padding: 12px 20px; display:flex; gap:16px; align-items:center; flex-wrap:wrap; }
  header h1 { font-size: 16px; margin:0; font-weight:700; }
  header .count { color: var(--muted); }
  .filters { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  .filters label { display:flex; gap:4px; align-items:center; color: var(--muted); font-size:12px; text-transform: uppercase; letter-spacing:.04em; }
  select, button { font: inherit; background: var(--card); color: var(--fg); border:1px solid var(--line); border-radius:8px; padding:4px 8px; }
  button.active { outline: 2px solid var(--uv); }
  main { padding: 20px; display:grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
  .card { background: var(--card); border:1px solid var(--line); border-radius:14px; padding:14px; display:flex; flex-direction:column; gap:10px; }
  .card.hidden { display:none; }
  .card .top { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
  .card .id { font-weight:800; font-size:18px; }
  .card .slug { color: var(--muted); font-size:12px; word-break: break-all; }
  .hero { display:flex; gap:12px; align-items:flex-start; }
  .hero img.big { width:200px; height:200px; border-radius:12px; flex: none; background:#0E0E19; }
  .sizes { display:flex; flex-direction:column; gap:8px; flex:1; }
  .sim { display:flex; flex-direction:column; gap:6px; }
  .tab { display:flex; align-items:center; gap:6px; padding:5px 10px; border-radius:8px 8px 0 0; font-size:12px; width: fit-content; }
  .tab.light { background:#fff; color:#222; border:1px solid #d9d9e3; border-bottom:none; }
  .tab.dark { background:#2b2b3a; color:#eee; border:1px solid #3a3a4c; border-bottom:none; }
  .tab img { width:16px; height:16px; image-rendering:auto; }
  .bar { display:flex; align-items:center; gap:10px; padding:6px 10px; border-radius:10px; font-weight:700; font-size:14px; width: fit-content; }
  .bar.light { background:#F6F6FC; color:#19182A; border:1px solid #e2e1ee; }
  .bar.dark { background:#19182A; color:#F6F6FC; border:1px solid #2b2a44; }
  .bar img { width:32px; height:32px; border-radius:50%; }
  .zoom { display:flex; gap:6px; }
  .zoom img { width:64px; height:64px; image-rendering: pixelated; border:1px solid var(--line); border-radius:6px; }
  .zoom figure { margin:0; text-align:center; font-size:10px; color: var(--muted); }
  .tags { display:flex; gap:4px; flex-wrap:wrap; }
  .tag { font-size:11px; padding:2px 7px; border-radius:999px; background: color-mix(in oklab, var(--uv) 25%, var(--card)); color: var(--fg); }
  .tag.ref { background: color-mix(in oklab, var(--pink) 35%, var(--card)); }
  .crit { font-size:13px; }
  .crit .scores { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:4px; }
  .score { font-size:11px; padding:2px 7px; border-radius:6px; border:1px solid var(--line); }
  .score.yes { background: color-mix(in oklab, var(--sky) 40%, var(--card)); }
  .score.partial { background: color-mix(in oklab, var(--pink) 30%, var(--card)); }
  .score.no { background: color-mix(in oklab, #ff5c5c 30%, var(--card)); }
  details { font-size:12px; color: var(--muted); }
  details pre { white-space: pre-wrap; font: 11px/1.4 ui-monospace, Menlo, monospace; background: var(--bg); padding:8px; border-radius:8px; max-height: 320px; overflow:auto; color: var(--fg); }
  .missing { color: var(--muted); font-style: italic; padding: 40px 0; text-align:center; }
  .pick { margin-left:auto; }
  .card.picked { outline: 3px solid var(--pink); }
  .picks { position: fixed; bottom: 14px; right: 14px; background: var(--card); border:1px solid var(--line); border-radius:12px; padding:10px 14px; font-size:12px; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,.25); }
  .picks code { user-select: all; }
  .star { color: var(--pink); font-size: 14px; vertical-align: middle; }
  .why { font-size: 12px; padding: 6px 8px; border-left: 3px solid var(--pink); background: color-mix(in oklab, var(--pink) 12%, var(--card)); border-radius: 4px; }
  header a { color: var(--fg); font-size: 12px; }
</style>
</head>
<body data-theme="dark">
<header>
  <h1>MemeOn logo v2 · noodle M in negative space</h1>
  <span class="count">${generated}/${items.length} generated · ${esc(spec.model)} · ${esc(spec.resolution)}</span>
  <div class="filters" id="filters">
    ${axes.map((a) => `<label>${esc(a)} <select data-axis="${esc(a)}"><option value="">all</option>${spec.axes[a].map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select></label>`).join('')}
    <label>ref <select data-axis="ref"><option value="">all</option><option value="true">with reference</option><option value="false">no reference</option></select></label>
    <label>16px <select data-axis="legible16"><option value="">all</option><option value="yes">yes</option><option value="partial">partial</option><option value="no">no</option></select></label>
    <label>sort <select id="sort"><option value="id">id</option><option value="score">critique score</option></select></label>
    <button id="theme">toggle page theme</button>
    <button id="onlypicked">show picked only</button>
    <button id="onlyshort">shortlist (${picks.shortlist.length})</button>
    <a href="contact-256.webp" target="_blank">contact sheet</a>
    <a href="contact-32.webp" target="_blank">all at 32px</a>
    <a href="contact-16.webp" target="_blank">all at 16px</a>
  </div>
</header>
<main id="grid">
${items.map((it) => {
  const c = it.critique || {};
  const scoreOf = (v) => (v === true || v === 'yes' ? 'yes' : v === 'partial' ? 'partial' : v == null ? '' : 'no');
  const score = ['legible16', 'negativeM', 'noOutline', 'noodleVibe'].reduce((n, k) => n + (scoreOf(c[k]) === 'yes' ? 2 : scoreOf(c[k]) === 'partial' ? 1 : 0), 0);
  const data = Object.entries(it.tags).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  const why = shortlist.get(it.id);
  return `<article class="card${why ? ' short' : ''}" id="v${it.id}" ${data} data-ref="${it.ref}" data-legible16="${esc(scoreOf(c.legible16))}" data-score="${score}" data-short="${why ? 1 : 0}" data-id="${it.id}">
  <div class="top"><span class="id">#${it.id}${why ? ' <span class="star" title="shortlist">★</span>' : ''}</span><span class="slug">${esc(it.slug)}</span><button class="pick" data-pick="${it.id}">pick</button></div>
  ${why ? `<div class="why">${esc(why)}</div>` : ''}
  ${it.generated ? `
  <div class="hero">
    <a href="${it.dir}/source.png" target="_blank"><img class="big" src="${it.dir}/preview-256.png" alt="${esc(it.slug)}" loading="lazy" /></a>
    <div class="sizes">
      <div class="sim">
        <div class="tab light"><img src="${it.dir}/preview-16.png" alt="" /> MemeOn</div>
        <div class="tab dark"><img src="${it.dir}/preview-16.png" alt="" /> MemeOn</div>
        <div class="bar light"><img src="${it.dir}/preview-32.png" alt="" /> MemeOn</div>
        <div class="bar dark"><img src="${it.dir}/preview-32.png" alt="" /> MemeOn</div>
      </div>
      <div class="zoom">
        <figure><img src="${it.dir}/preview-16-zoom.png" alt="16px" /><figcaption>16px ×4</figcaption></figure>
        <figure><img src="${it.dir}/preview-32-zoom.png" alt="32px" /><figcaption>32px ×2</figcaption></figure>
        <figure><img src="${it.dir}/preview-64.png" alt="64px" /><figcaption>64px</figcaption></figure>
      </div>
    </div>
  </div>` : `<div class="missing">not generated yet</div>`}
  <div class="tags">${Object.entries(it.tags).map(([k, v]) => `<span class="tag" title="${esc(k)}">${esc(v)}</span>`).join('')}${it.ref ? '<span class="tag ref">ref image</span>' : ''}</div>
  ${it.critique ? `<div class="crit">
    <div class="scores">
      <span class="score ${scoreOf(c.legible16)}">16px: ${esc(c.legible16)}</span>
      <span class="score ${scoreOf(c.negativeM)}">negative M: ${esc(c.negativeM)}</span>
      <span class="score ${scoreOf(c.noOutline)}">no outline: ${esc(c.noOutline)}</span>
      <span class="score ${scoreOf(c.noodleVibe)}">noodle vibe: ${esc(c.noodleVibe)}</span>
    </div>
    <div>${esc(c.notes)}</div>
  </div>` : ''}
  <details><summary>variation brief${it.meta?.id ? ` · job ${esc(it.meta.id)}` : ''}</summary><pre>${esc(it.delta)}</pre></details>
  ${it.prompt ? `<details><summary>full prompt as submitted</summary><pre>${esc(it.prompt)}</pre></details>` : ''}
</article>`;
}).join('\n')}
</main>
<div class="picks" id="picks" hidden>picked: <code id="picklist"></code></div>
<script>
  const body = document.body;
  const grid = document.getElementById('grid');
  const selects = [...document.querySelectorAll('#filters select[data-axis]')];
  const picked = new Set(JSON.parse(localStorage.getItem('logo-v2-picks') || '[]'));
  let onlyPicked = false;
  let onlyShort = false;
  function apply() {
    const active = selects.filter((s) => s.value).map((s) => [s.dataset.axis, s.value]);
    for (const card of grid.children) {
      const ok = active.every(([k, v]) => card.dataset[k] === v) && (!onlyPicked || picked.has(card.dataset.id)) && (!onlyShort || card.dataset.short === '1');
      card.classList.toggle('hidden', !ok);
      card.classList.toggle('picked', picked.has(card.dataset.id));
    }
    const sort = document.getElementById('sort').value;
    const cards = [...grid.children];
    cards.sort((a, b) => sort === 'score' ? (+b.dataset.score - +a.dataset.score) || a.dataset.id.localeCompare(b.dataset.id) : a.dataset.id.localeCompare(b.dataset.id));
    cards.forEach((c) => grid.appendChild(c));
    const list = [...picked].sort();
    document.getElementById('picks').hidden = list.length === 0;
    document.getElementById('picklist').textContent = list.join(', ');
    localStorage.setItem('logo-v2-picks', JSON.stringify(list));
  }
  selects.forEach((s) => s.addEventListener('change', apply));
  document.getElementById('sort').addEventListener('change', apply);
  document.getElementById('theme').addEventListener('click', () => { body.dataset.theme = body.dataset.theme === 'dark' ? 'light' : 'dark'; });
  document.getElementById('onlypicked').addEventListener('click', (e) => { onlyPicked = !onlyPicked; e.target.classList.toggle('active', onlyPicked); apply(); });
  document.getElementById('onlyshort').addEventListener('click', (e) => { onlyShort = !onlyShort; e.target.classList.toggle('active', onlyShort); apply(); });
  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (!b) return; const id = b.dataset.pick; picked.has(id) ? picked.delete(id) : picked.add(id); apply(); });
  apply();
</script>
</body>
</html>`;
writeFileSync(join(DIR, 'index.html'), html);
console.log(`index.html: ${generated}/${items.length} generated`);
