// VICE FRAME — Cover Studio: editor state, presets, photo handling, export, shot mode.
import { LAYOUTS, GRADES, renderCover, pointInPoly } from './cover.js';

export const DEFAULT_PRESET = 'A';

export const PRESETS = {
  A: { name: 'Sunset Boulevard', desc: 'Cover Classic · Sunset · Chrome', layout: 'classic', grade: 'sunset', titleStyle: 'chrome', titlePos: 'top', title: 'SUNSET HEIST', caption: 'Every empire starts with one last ride', chip1: 'NOW LOADING TROUBLE', chip2: '', order: ['boulevard', 'pier', 'boulevard', 'pier'], focus: [{ oy: 0.5 }, { oy: 0.25 }, { oy: 0.5 }, { oy: 0.25 }] },
  B: { name: 'Neon Vice', desc: 'Diagonal Trio · Neon Nights · Solid', layout: 'trio', grade: 'neon', titleStyle: 'solid', titlePos: 'bottom', title: 'NEON VICE', caption: 'The city never sleeps. Neither do we.', order: ['pier', 'boulevard', 'pier'], focus: [{ oy: 0.18 }, { oy: 0.22 }, { oy: 0.18 }] },
  C: { name: 'Poster Pop', desc: 'Grid Heat · Poster Pop · Solid', layout: 'grid', grade: 'pop', titleStyle: 'solid', titlePos: 'top', title: 'PALM CITY HEAT', caption: 'Four crews. One coastline.', order: ['boulevard', 'pier', 'pier', 'boulevard'], focus: [{ oy: 0.45 }, { oy: 0.2 }, { oy: 0.35 }, { oy: 0.45 }] },
  D: { name: 'Golden Grid', desc: 'Hero Slash · Golden Hour · Outline', layout: 'slash', grade: 'golden', titleStyle: 'outline', titlePos: 'bottom', title: 'GOLDEN HOUR', caption: 'Fortune favours the bold', order: ['boulevard', 'pier', 'boulevard'] },
};

const SIZES = { '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1920x1080': [1920, 1080] };
const $ = (id) => document.getElementById(id);
const canvas = $('cover'); const ctx = canvas.getContext('2d');

const state = {
  layout: 'classic', grade: 'sunset', titleStyle: 'chrome', titlePos: 'top',
  title: '', caption: '', chip1: 'NOW LOADING TROUBLE', chip2: 'VICE FRAME ORIGINAL',
  billing: 'VICE FRAME PICTURES PRESENTS · A COVER STUDIO PRODUCTION · STARRING YOU · SHOT ON LOCATION IN PALM CITY',
  chipsOn: true, sealOn: true, billingOn: true,
  photos: [], photoNames: [], panelPhoto: [], panels: [], selected: 0, size: '1920x1080', preset: DEFAULT_PRESET,
};
const sampleImgs = {};

function freshPanels(n) { return Array.from({ length: n }, () => ({ ox: 0, oy: 0, zoom: 1, flip: false })); }
function panelCount() { return LAYOUTS[state.layout].panels().length; }
function ensurePanels() { const n = panelCount(); while (state.panels.length < n) state.panels.push({ ox: 0, oy: 0, zoom: 1, flip: false }); }

function draw() {
  ensurePanels();
  const [W, H] = SIZES[state.size];
  const pw = 960, ph = Math.round(960 * H / W);
  if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
  renderCover(ctx, pw, ph, { ...state, showSelection: !document.body.classList.contains('shot-cover') });
  syncPanelUI();
}

function syncPanelUI() {
  $('selLabel').textContent = `— panel ${state.selected + 1} of ${panelCount()}`;
  const p = state.panels[state.selected]; if (p) $('zoom').value = p.zoom;
  $('photoCount').textContent = state.photos.length ? `— ${state.photos.length} loaded` : '';
  document.querySelectorAll('#strip img').forEach((el, i) => el.classList.toggle('on', state.panelPhoto[state.selected] === i));
}

function buildStrip() {
  const strip = $('strip'); strip.innerHTML = '';
  state.photos.forEach((img, i) => {
    const t = document.createElement('img'); t.src = img.src; t.alt = state.photoNames[i] || `Photo ${i + 1}`; t.title = 'Assign to selected panel';
    t.addEventListener('click', () => { state.panelPhoto[state.selected] = i; draw(); });
    strip.appendChild(t);
  });
}

function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }

async function loadSamples() {
  for (const n of ['boulevard', 'pier']) if (!sampleImgs[n]) sampleImgs[n] = await loadImage(`samples/${n}.jpg`);
}

function applyPreset(key) {
  const p = PRESETS[key]; if (!p) return;
  state.preset = key; state.layout = p.layout; state.grade = p.grade; state.titleStyle = p.titleStyle; state.titlePos = p.titlePos;
  state.title = p.title; state.caption = p.caption;
  // Per-preset callout chips: a preset that does not specify a chip keeps the studio defaults.
  state.chip1 = p.chip1 ?? 'NOW LOADING TROUBLE'; state.chip2 = p.chip2 ?? 'VICE FRAME ORIGINAL';
  $('chip1').value = state.chip1; $('chip2').value = state.chip2;
  state.photos = p.order.map((n) => sampleImgs[n]).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  state.photoNames = state.photos.map((im) => (im === sampleImgs.boulevard ? 'Boulevard (sample)' : 'Pier (sample)'));
  state.panelPhoto = p.order.map((n) => state.photos.indexOf(sampleImgs[n]));
  state.panels = freshPanels(panelCount());
  if (p.focus) p.focus.forEach((f, i) => { if (state.panels[i]) Object.assign(state.panels[i], f); });
  state.selected = 0;
  $('title').value = state.title; $('caption').value = state.caption;
  buildStrip(); markButtons(); draw();
}

function markButtons() {
  document.querySelectorAll('#presets .preset').forEach((b) => b.classList.toggle('on', b.dataset.k === state.preset));
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.k === state.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.k === state.grade));
  document.querySelectorAll('#titleStyles button').forEach((b) => b.classList.toggle('on', b.dataset.v === state.titleStyle));
  document.querySelectorAll('#titlePos button').forEach((b) => b.classList.toggle('on', b.dataset.v === state.titlePos));
  document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('on', b.dataset.v === state.size));
}

function addPhoto(img, name) {
  if (state.photos.length >= 4) { const i = state.photos.length - 1; state.photos[i] = img; state.photoNames[i] = name; }
  else { state.photos.push(img); state.photoNames.push(name); }
  state.panelPhoto[state.selected] = state.photos.indexOf(img);
  buildStrip(); draw();
  $('status').textContent = `Photo added — assigned to panel ${state.selected + 1}. Drag on the cover to frame it.`;
}

function wire() {
  const pg = $('presets');
  for (const [k, p] of Object.entries(PRESETS)) {
    const b = document.createElement('button'); b.type = 'button'; b.className = `preset ${k.toLowerCase()}`; b.dataset.k = k;
    b.innerHTML = `<b>${k} · ${p.name}</b><i>${p.desc}</i>`;
    b.addEventListener('click', () => applyPreset(k)); pg.appendChild(b);
  }
  const lg = $('layouts');
  for (const [k, l] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = l.name;
    b.addEventListener('click', () => { state.layout = k; state.preset = ''; state.panels = freshPanels(panelCount()); state.selected = 0; markButtons(); draw(); }); lg.appendChild(b);
  }
  const gg = $('grades');
  for (const [k, g] of Object.entries(GRADES)) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = g.name;
    b.addEventListener('click', () => { state.grade = k; state.preset = state.preset; markButtons(); draw(); }); gg.appendChild(b);
  }
  $('title').addEventListener('input', (e) => { state.title = e.target.value; draw(); });
  $('caption').addEventListener('input', (e) => { state.caption = e.target.value; draw(); });
  $('chip1').addEventListener('input', (e) => { state.chip1 = e.target.value; draw(); });
  $('chip2').addEventListener('input', (e) => { state.chip2 = e.target.value; draw(); });
  $('billing').addEventListener('input', (e) => { state.billing = e.target.value; draw(); });
  $('titleStyles').addEventListener('click', (e) => { const v = e.target.dataset?.v; if (v) { state.titleStyle = v; markButtons(); draw(); } });
  $('titlePos').addEventListener('click', (e) => { const v = e.target.dataset?.v; if (v) { state.titlePos = v; markButtons(); draw(); } });
  $('sizes').addEventListener('click', (e) => { const v = e.target.dataset?.v; if (v) { state.size = v; markButtons(); draw(); } });
  $('zoom').addEventListener('input', (e) => { state.panels[state.selected].zoom = Number(e.target.value); draw(); });
  $('flip').addEventListener('click', () => { const p = state.panels[state.selected]; p.flip = !p.flip; draw(); });
  $('resetPanel').addEventListener('click', () => { state.panels[state.selected] = { ox: 0, oy: 0, zoom: 1, flip: false }; draw(); });
  for (const id of ['chipsOn', 'sealOn', 'billingOn']) $(id).addEventListener('change', (e) => { state[id] = e.target.checked; draw(); });
  $('chip1').value = state.chip1; $('chip2').value = state.chip2; $('billing').value = state.billing;
  $('chipsOn').checked = true; $('sealOn').checked = true; $('billingOn').checked = true;
  $('sampleB').addEventListener('click', () => addPhoto(sampleImgs.boulevard, 'Boulevard (sample)'));
  $('sampleP').addEventListener('click', () => addPhoto(sampleImgs.pier, 'Pier (sample)'));
  const drop = $('drop'), file = $('file');
  drop.addEventListener('click', () => file.click());
  file.addEventListener('change', async () => { for (const f of file.files) await addFile(f); file.value = ''; });
  for (const ev of ['dragover', 'dragenter']) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); });
  for (const ev of ['dragleave', 'drop']) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); });
  drop.addEventListener('drop', async (e) => { for (const f of e.dataTransfer.files) await addFile(f); });
  async function addFile(f) { if (!f.type.startsWith('image/')) return; const url = URL.createObjectURL(f); const im = await loadImage(url); addPhoto(im, f.name); }
  $('export').addEventListener('click', exportPng);
  // canvas: select + drag
  let drag = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = pos(e); const polys = LAYOUTS[state.layout].panels();
    for (let i = polys.length - 1; i >= 0; i--) if (pointInPoly(x, y, polys[i])) { state.selected = i; break; }
    drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); draw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect(); const p = state.panels[state.selected];
    p.ox = Math.max(-1, Math.min(1, p.ox + (e.clientX - drag.x) / r.width * 1.6));
    p.oy = Math.max(-1, Math.min(1, p.oy + (e.clientY - drag.y) / r.height * 1.6));
    drag = { x: e.clientX, y: e.clientY }; draw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
}

function exportPng() {
  const [W, H] = SIZES[state.size];
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  renderCover(off.getContext('2d'), W, H, { ...state, showSelection: false });
  off.toBlob((blob) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `vice-frame-${W}x${H}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    $('status').textContent = `Exported vice-frame-${W}x${H}.png — ready to post.`;
  }, 'image/png');
}

async function init() {
  wire();
  await loadSamples();
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const ratio = q.get('ratio') || '16:9';
    state.size = ratio === '1:1' ? '1080x1080' : ratio === '4:5' ? '1080x1350' : '1920x1080';
    applyPreset(q.get('preset') || DEFAULT_PRESET);
    canvas.style.width = '100vw'; canvas.style.height = '100vh';
    await document.fonts.ready;
    draw();
  } else {
    applyPreset(DEFAULT_PRESET);
    if (shot === 'editor') { /* full editor, sample cover already composed by the default preset */ }
    await document.fonts.ready;
    draw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
init();
