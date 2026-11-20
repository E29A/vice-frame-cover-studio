// VICE FRAME — cover compositor: slanted panel layouts, per-pixel colour grades,
// poster extras and the full render pipeline. Pure canvas, no network, no libraries.

export const LAYOUTS = {
  classic: { name: 'Cover Classic', panels: (s) => [
    [[0, 0], [1, 0], [1, 0.56], [0, 0.625]],
    [[0, 0.64], [0.365, 0.578], [0.335, 1], [0, 1]],
    [[0.38, 0.575], [0.69, 0.562], [0.665, 1], [0.35, 1]],
    [[0.705, 0.56], [1, 0.545], [1, 1], [0.68, 1]],
  ] },
  slash: { name: 'Hero Slash', panels: (s) => [
    [[0, 0], [0.605, 0], [0.52, 1], [0, 1]],
    [[0.62, 0], [1, 0], [1, 0.5], [0.558, 0.565]],
    [[0.55, 0.58], [1, 0.515], [1, 1], [0.528, 1]],
  ] },
  trio: { name: 'Diagonal Trio', panels: (s) => [
    [[0, 0], [1, 0], [1, 0.3], [0, 0.445]],
    [[0, 0.46], [1, 0.315], [1, 0.63], [0, 0.755]],
    [[0, 0.77], [1, 0.645], [1, 1], [0, 1]],
  ] },
  grid: { name: 'Grid Heat', panels: (s) => [
    [[0, 0], [0.525, 0], [0.485, 0.52], [0, 0.555]],
    [[0.54, 0], [1, 0], [1, 0.55], [0.5, 0.52]],
    [[0, 0.57], [0.48, 0.535], [0.515, 1], [0, 1]],
    [[0.495, 0.535], [1, 0.565], [1, 1], [0.53, 1]],
  ] },
  full: { name: 'Full Bleed', panels: (s) => [
    [[0, 0], [1, 0], [1, 1], [0, 1]],
  ] },
  strips: { name: 'Strip Story', panels: (s) => [
    [[0, 0], [0.272, 0], [0.242, 1], [0, 1]],
    [[0.287, 0], [0.522, 0], [0.492, 1], [0.257, 1]],
    [[0.537, 0], [0.772, 0], [0.742, 1], [0.507, 1]],
    [[0.787, 0], [1, 0], [1, 1], [0.757, 1]],
  ] },
};

// Grade definitions: split-tone shadows/highlights, saturation, contrast, posterize levels.
export const GRADES = {
  sunset: { name: 'Sunset', shadow: [8, 74, 84], high: [255, 148, 62], tone: 0.52, sat: 1.28, con: 1.1, levels: 0 },
  neon: { name: 'Neon Nights', shadow: [94, 10, 92], high: [64, 224, 255], tone: 0.62, sat: 1.55, con: 1.14, levels: 0 },
  pop: { name: 'Poster Pop', shadow: [10, 84, 96], high: [255, 176, 84], tone: 0.42, sat: 1.32, con: 1.06, levels: 5 },
  golden: { name: 'Golden Hour', shadow: [66, 44, 30], high: [255, 196, 110], tone: 0.4, sat: 1.16, con: 1.05, levels: 0 },
  teal: { name: 'Teal Heat', shadow: [0, 66, 78], high: [255, 158, 84], tone: 0.58, sat: 1.36, con: 1.18, levels: 0 },
};

const gradeCache = new Map();

// Returns a graded copy of an image (capped at 1100px on the long side), cached per grade.
export function gradedImage(img, gradeKey) {
  const key = gradeKey + '|' + (img.__vfId || (img.__vfId = Math.random().toString(36).slice(2)));
  if (gradeCache.has(key)) return gradeCache.get(key);
  const g = GRADES[gradeKey];
  const scale = Math.min(1, 1100 / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const w = Math.max(2, Math.round((img.naturalWidth || img.width) * scale));
  const h = Math.max(2, Math.round((img.naturalHeight || img.height) * scale));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h); const d = id.data;
  const [sr, sg, sb] = g.shadow, [hr, hg, hb] = g.high;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], gg = d[i + 1], b = d[i + 2];
    if (g.levels > 0) { const L = g.levels - 1; r = Math.round(r / 255 * L) / L * 255; gg = Math.round(gg / 255 * L) / L * 255; b = Math.round(b / 255 * L) / L * 255; }
    const lum = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
    // saturation around luma
    const grey = lum * 255;
    r = grey + (r - grey) * g.sat; gg = grey + (gg - grey) * g.sat; b = grey + (b - grey) * g.sat;
    // contrast
    r = (r - 128) * g.con + 128; gg = (gg - 128) * g.con + 128; b = (b - 128) * g.con + 128;
    // split tone: blend toward shadow/highlight tint by luminance
    const tr = sr + (hr - sr) * lum, tg = sg + (hg - sg) * lum, tb = sb + (hb - sb) * lum;
    d[i] = r + (tr - r) * g.tone * 0.62;
    d[i + 1] = gg + (tg - gg) * g.tone * 0.62;
    d[i + 2] = b + (tb - b) * g.tone * 0.62;
  }
  ctx.putImageData(id, 0, 0);
  gradeCache.set(key, c);
  return c;
}

function polyPath(ctx, poly, W, H) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => { const px = x * W, py = y * H; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
  ctx.closePath();
}

function bbox(poly, W, H) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of poly) { x0 = Math.min(x0, x * W); y0 = Math.min(y0, y * H); x1 = Math.max(x1, x * W); y1 = Math.max(y1, y * H); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

let noiseTile = null;
function getNoise() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas'); c.width = c.height = 180;
  const x = c.getContext('2d'); const id = x.createImageData(180, 180);
  for (let i = 0; i < id.data.length; i += 4) { const v = 118 + Math.random() * 60; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  x.putImageData(id, 0, 0); noiseTile = c; return c;
}

function fitTitle(ctx, title, maxW, startSize) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  let lines = words.length > 1 && words.length <= 3 ? words.slice() : [title.trim()];
  let size = startSize;
  const fits = () => lines.every((ln) => { ctx.font = `${size}px Anton, sans-serif`; return ctx.measureText(ln.toUpperCase()).width <= maxW; });
  while (!fits() && size > 18) size -= 4;
  if (!fits()) { // fall back to greedy two-per-line wrap
    lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; ctx.font = `${size}px Anton, sans-serif`; if (ctx.measureText(t.toUpperCase()).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    while (!fits() && size > 18) size -= 4;
  }
  return { lines, size };
}

function drawTitle(ctx, S, W, H) {
  const atTop = S.titlePos === 'top';
  const { lines, size } = fitTitle(ctx, S.title || 'VICE FRAME', W * 0.9, H * 0.155);
  const lh = size * 1.04;
  const capSize = Math.max(15, H * 0.032);
  const blockH = lines.length * lh + capSize * 1.9;
  const y0 = atTop ? H * 0.045 : H - H * 0.045 - blockH;
  // scrim for legibility
  const scrim = ctx.createLinearGradient(0, atTop ? 0 : H, 0, atTop ? y0 + blockH + H * 0.05 : H - blockH - H * 0.09);
  scrim.addColorStop(0, 'rgba(8,2,16,0.66)'); scrim.addColorStop(1, 'rgba(8,2,16,0)');
  ctx.fillStyle = scrim; ctx.fillRect(0, atTop ? 0 : H - blockH - H * 0.1, W, blockH + H * 0.1);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  lines.forEach((ln, i) => {
    const txt = ln.toUpperCase(); const y = y0 + i * lh;
    ctx.font = `${size}px Anton, sans-serif`;
    if (S.titleStyle === 'chrome') {
      ctx.fillStyle = '#ff2e88'; ctx.fillText(txt, W / 2 + size * 0.055, y + size * 0.055);
      ctx.fillStyle = 'rgba(10,4,20,0.9)'; ctx.fillText(txt, W / 2 + size * 0.03, y + size * 0.03);
      const grad = ctx.createLinearGradient(0, y, 0, y + size);
      grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.34, '#9fdcf2'); grad.addColorStop(0.52, '#ffffff');
      grad.addColorStop(0.72, '#f7a8c4'); grad.addColorStop(1, '#ffd76a');
      ctx.fillStyle = grad; ctx.fillText(txt, W / 2, y);
      ctx.lineWidth = Math.max(2, size * 0.035); ctx.strokeStyle = '#160a24'; ctx.strokeText(txt, W / 2, y);
    } else if (S.titleStyle === 'outline') {
      ctx.lineWidth = Math.max(3, size * 0.075); ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 0; ctx.shadowOffsetX = size * 0.04; ctx.shadowOffsetY = size * 0.04;
      ctx.strokeText(txt, W / 2, y);
      ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
      ctx.fillStyle = 'rgba(255,214,106,0.22)'; ctx.fillText(txt, W / 2, y);
    } else {
      ctx.fillStyle = 'rgba(10,4,20,0.85)'; ctx.fillText(txt, W / 2 + size * 0.045, y + size * 0.045);
      ctx.fillStyle = '#ffffff'; ctx.fillText(txt, W / 2, y);
      ctx.lineWidth = Math.max(2, size * 0.03); ctx.strokeStyle = 'rgba(22,10,36,0.9)'; ctx.strokeText(txt, W / 2, y);
    }
  });
  // caption on a slanted chip
  const cap = (S.caption || '').toUpperCase();
  if (cap) {
    ctx.font = `${capSize}px Anton, sans-serif`;
    const tw = ctx.measureText(cap).width + capSize * 1.5;
    const cx = W / 2, cy = y0 + lines.length * lh + capSize * 0.55, chh = capSize * 1.55, sl = capSize * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - tw / 2 - sl, cy + chh); ctx.lineTo(cx - tw / 2, cy); ctx.lineTo(cx + tw / 2, cy); ctx.lineTo(cx + tw / 2 - sl, cy + chh); ctx.closePath();
    ctx.fillStyle = '#ff2e88'; ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle';
    ctx.fillText(cap, cx - sl / 4, cy + chh / 2 + 1);
    ctx.textBaseline = 'top';
  }
  return { y0, blockH, atTop };
}

function drawChip(ctx, text, cx, cy, rot, color, W, H) {
  if (!text) return;
  const fs = Math.max(14, H * 0.03);
  ctx.font = `${fs}px Anton, sans-serif`;
  const tw0 = ctx.measureText(text.toUpperCase()).width + fs * 1.3;
  cx = Math.max(tw0 / 2 + 12, Math.min(W - tw0 / 2 - 12, cx));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = tw0, th = fs * 1.7, sl = fs * 0.55;
  ctx.beginPath(); ctx.moveTo(-tw / 2 - sl, th / 2); ctx.lineTo(-tw / 2, -th / 2); ctx.lineTo(tw / 2, -th / 2); ctx.lineTo(tw / 2 - sl, th / 2); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.fillText(text.toUpperCase(), -sl / 4, 1);
  ctx.restore();
}

function drawSeal(ctx, x, y, R) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = 'rgba(14,6,26,0.82)'; ctx.fill();
  ctx.lineWidth = R * 0.07; ctx.strokeStyle = '#ffd76a'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.78, 0, Math.PI * 2); ctx.lineWidth = R * 0.03; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke();
  const ring = 'VICE FRAME • COVER STUDIO • ';
  ctx.fillStyle = '#ffffff'; ctx.font = `${R * 0.21}px Anton, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const step = (Math.PI * 2) / ring.length;
  for (let i = 0; i < ring.length; i++) { ctx.save(); ctx.rotate(-Math.PI / 2 + i * step); ctx.translate(0, -R * 0.885); ctx.fillText(ring[i], 0, 0); ctx.restore(); }
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * (Math.PI * 2 / 5); const a2 = a + Math.PI / 5; ctx.lineTo(Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42); ctx.lineTo(Math.cos(a2) * R * 0.18, Math.sin(a2) * R * 0.18); }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// Full render. state: {layout, grade, photos:[HTMLImageElement|canvas], panelPhoto:[idx], panels:[{ox,oy,zoom,flip}], ...}
export function renderCover(ctx, W, H, S) {
  const layout = LAYOUTS[S.layout];
  const polys = layout.panels();
  ctx.save();
  ctx.fillStyle = '#f7f1e3'; ctx.fillRect(0, 0, W, H);
  polys.forEach((poly, i) => {
    const src = S.photos.length ? gradedImage(S.photos[(S.panelPhoto[i] != null ? S.panelPhoto[i] : i) % S.photos.length], S.grade) : null;
    const b = bbox(poly, W, H);
    ctx.save(); polyPath(ctx, poly, W, H); ctx.clip();
    if (src) {
      const st = S.panels[i] || { ox: 0, oy: 0, zoom: 1, flip: false };
      const iw = src.width, ih = src.height;
      const scale = Math.max(b.w / iw, b.h / ih) * (st.zoom || 1);
      const dw = iw * scale, dh = ih * scale;
      const rangeX = Math.max(0, dw - b.w), rangeY = Math.max(0, dh - b.h);
      let dx = b.x0 - rangeX / 2 + (st.ox || 0) * rangeX;
      let dy = b.y0 - rangeY / 2 + (st.oy || 0) * rangeY;
      dx = Math.max(b.x0 - rangeX, Math.min(b.x0, dx));
      dy = Math.max(b.y0 - rangeY, Math.min(b.y0, dy));
      if (st.flip) { ctx.translate(dx + dw, 0); ctx.scale(-1, 1); dx = 0; ctx.drawImage(src, dx, dy, dw, dh); }
      else ctx.drawImage(src, dx, dy, dw, dh);
    } else { ctx.fillStyle = '#2a1840'; ctx.fillRect(b.x0, b.y0, b.w, b.h); }
    ctx.restore();
    // separator stroke
    polyPath(ctx, poly, W, H);
    ctx.lineWidth = Math.max(3, W * 0.008); ctx.strokeStyle = '#f7f1e3'; ctx.stroke();
    if (S.selected === i && S.showSelection) { polyPath(ctx, poly, W, H); ctx.lineWidth = Math.max(3, W * 0.006); ctx.strokeStyle = '#00e5ff'; ctx.stroke(); }
  });
  // print texture: halftone dots low in frame + grain + vignette
  ctx.save();
  ctx.globalAlpha = 0.10; ctx.fillStyle = '#12081f';
  const gap = Math.max(9, W * 0.011);
  for (let yy = H * 0.55; yy < H; yy += gap) for (let xx = 0; xx < W; xx += gap) { ctx.beginPath(); ctx.arc(xx + ((yy / gap) % 2) * gap / 2, yy, gap * 0.16 * ((yy - H * 0.55) / (H * 0.45) + 0.3), 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = 'overlay';
  const pat = ctx.createPattern(getNoise(), 'repeat'); ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  vg.addColorStop(0, 'rgba(10,2,18,0)'); vg.addColorStop(1, 'rgba(10,2,18,0.42)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // poster extras
  if (S.chipsOn) {
    const portrait = H > W;
    drawChip(ctx, S.chip1, W * 0.16, H * (S.titlePos === 'top' ? 0.7 : 0.3), -0.09, '#ff2e88', W, H);
    drawChip(ctx, S.chip2, W * 0.84, H * (S.titlePos === 'top' ? 0.32 : (portrait ? 0.52 : 0.68)), 0.07, '#0097b8', W, H);
  }
  const t = drawTitle(ctx, S, W, H);
  if (S.sealOn) drawSeal(ctx, W * 0.915, t.atTop ? H * 0.9 : H * 0.1, Math.min(W, H) * 0.075);
  if (S.billingOn && S.billing) {
    ctx.font = `${Math.max(10, H * 0.016)}px Anton, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(10,4,20,0.55)'; const by = t.atTop ? H - H * 0.012 : H * 0.026;
    ctx.fillText(S.billing.toUpperCase(), W / 2 + 1, by + 1);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillText(S.billing.toUpperCase(), W / 2, by);
  }
  // outer frame
  ctx.lineWidth = Math.max(4, W * 0.01); ctx.strokeStyle = '#f7f1e3'; ctx.strokeRect(0, 0, W, H);
  ctx.restore();
}

export function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
