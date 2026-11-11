'use strict';
/* Starlight Queen — the painted look: smooth skies, layered misty silhouettes, a small bright figure in a big quiet land.
   Everything here draws in game units (384 x 216) onto a context already scaled to the device, so it is sharp at any size. */
const Paint = (() => {
  let S = 1; // device pixels per unit
  const stamps = new Map();
  const layers = new Map(), glows = new Map();
  function setScale(k) { if (k !== S) { S = k; for (const e of stamps.values()) e.width = 0; stamps.clear(); for (const e of layers.values()) e.width = 0; layers.clear(); } }

  /* ---------- small helpers ---------- */
  function vgrad(g, y0, y1, stops) { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => gr.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), c)); return gr; }
  function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); }
  function disc(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  function soft(g, x, y, r, col, a) { // a soft round light: one small radial image per colour, stretched and added
    let cv = glows.get(col);
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = cv.height = 96; const q = cv.getContext('2d'), gr = q.createRadialGradient(48, 48, 0, 48, 48, 48);
      const m = /^#([0-9a-f]{6})$/i.exec(col), v = m ? parseInt(m[1], 16) : 0xffffff, rgb = `${v >> 16},${v >> 8 & 255},${v & 255}`;
      gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.35, `rgba(${rgb},0.5)`); gr.addColorStop(0.7, `rgba(${rgb},0.14)`); gr.addColorStop(1, `rgba(${rgb},0)`); q.fillStyle = gr; q.fillRect(0, 0, 96, 96); glows.set(col, cv);
    }
    const op = g.globalCompositeOperation, al = g.globalAlpha;
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = al * (a === undefined ? 0.6 : a); g.drawImage(cv, x - r, y - r, r * 2, r * 2); g.globalCompositeOperation = op; g.globalAlpha = al;
  }
  // Draw fn once into an offscreen at device scale and reuse it: for things that do not animate.
  function stamp(g, key, w, h, x, y, fn, flip) {
    let cv = stamps.get(key);
    if (!cv) { cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * S)); cv.height = Math.max(1, Math.ceil(h * S)); const q = cv.getContext('2d'); q.scale(S, S); fn(q); stamps.set(key, cv); }
    if (flip) { g.save(); g.translate(x + w, y); g.scale(-1, 1); g.drawImage(cv, 0, 0, w, h); g.restore(); } else g.drawImage(cv, x, y, w, h);
  }
  function star4(g, x, y, r, col, rot) { g.fillStyle = col; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + (rot || 0) - Math.PI / 2, q = i % 2 ? r * 0.28 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fill(); }

  /* ---------- the look of each land ---------- */
  const LOOK = {
    north: { sky: ['#050818', '#0a1433', '#12234f', '#1e3a72', '#3a5a92', '#6f86b4'], stars: 1, aurora: 1, orb: { x: 300, y: 46, r: 9, col: '#f4f7ff', glow: '#9fbcff', gr: 52 },
      ridge: ['#3c5a96', '#2b4580', '#1d3166', '#14234c'], kind: ['fells', 'fells', 'spruce', 'spruce'], haze: '#8fa9dc',
      ground: ['#24386e', '#0d1634'], cap: 'snow', capCol: '#edf3ff', capShade: '#a9bde6', plat: ['#6a5a56', '#3e3238'], pit: '#060a1c' },
    meads: { sky: ['#3f72be', '#7aacdc', '#c6dcd6', '#f4dca6', '#ffe9b8'], clouds: '#fff6e0', orb: { x: 290, y: 132, r: 12, col: '#fffbe6', glow: '#ffe6a0', gr: 96 },
      ridge: ['#8db4a4', '#6ea686', '#4f9468', '#3b7c54'], kind: ['hills', 'hills', 'round', 'round'], haze: '#ffe6b0',
      ground: ['#2a6448', '#102e24'], cap: 'grass', capCol: '#74c26c', capShade: '#4b9a52', plat: ['#b8895a', '#6e4a2c'], pit: '#0e2a26' },
    halls: { sky: ['#0b1024', '#152046', '#22346a', '#2f4a86'], cave: 1,
      ridge: ['#3a4f8c', '#2a3a70', '#1d2852', '#141b3a'], kind: ['pillars', 'pillars', 'pillars', 'rubble'], haze: '#4a64b0',
      ground: ['#3a4470', '#141a34'], cap: 'stone', capCol: '#8090c4', capShade: '#4a5688', plat: ['#7a6a5a', '#3e3438'], pit: '#080c1c' },
    canyon: { sky: ['#231a52', '#5a2c70', '#b8487a', '#ee7a58', '#ffb866', '#ffe6a0'], clouds: '#ffb0a0', orb: { x: 250, y: 132, r: 17, col: '#fff4d0', glow: '#ffd890', gr: 100 },
      ridge: ['#b8668a', '#96487a', '#6e3266', '#4a2050'], kind: ['mesa', 'mesa', 'mesa', 'cactus'], haze: '#ffc090',
      ground: ['#70304a', '#280e22'], cap: 'sand', capCol: '#f6b07a', capShade: '#c0705a', plat: ['#a06a52', '#5a3038'], pit: '#1e0a1c' },
    gloam: { sky: ['#1a0f2a', '#3a1630', '#6e2430', '#a8402a', '#e07a34', '#ffc070'], embers: 1, stars: 0.35,
      ridge: ['#7a2c30', '#5a1e2a', '#3e1422', '#280c18'], kind: ['mesa', 'mesa', 'mesa', 'dead'], haze: '#d06a34',
      ground: ['#3c2430', '#160a10'], cap: 'ash', capCol: '#a08088', capShade: '#5a3c48', plat: ['#5a4850', '#2a1c24'], pit: '#080305' },
    oz: { sky: ['#17245c', '#34509a', '#8d93c4', '#eeb2a4', '#ffd49a', '#fff0c6'], stars: 0.5, clouds: '#ffd8c0', orb: { x: 96, y: 150, r: 11, col: '#fffbe6', glow: '#ffe9b0', gr: 70 },
      ridge: ['#de8a6e', '#bc6258', '#923f48', '#6a2a34'], kind: ['rock', 'domes', 'plain', 'gum'], haze: '#ffd8b0',
      ground: ['#a23e22', '#48160e'], cap: 'spinifex', capCol: '#ecc866', capShade: '#b8862e', plat: ['#a8744c', '#5e3624'], pit: '#2a0c08' }
  };
  LOOK.sea = Object.assign({}, LOOK.canyon, { kind: ['plain', 'plain', 'plain', 'plain'], ridge: ['#a8668e', '#8a4c7c', '#6a386a', '#4e2858'] });
  LOOK.wood = LOOK.meads; LOOK.fens = LOOK.halls;
  LOOK.vista = Object.assign({}, LOOK.north, { seed: 'north', orb: { x: 346, y: 26, r: 6, col: '#f4f7ff', glow: '#9fbcff', gr: 40 } }); // the title painting: the moon keeps clear of the lettering
  // Kaamos again, on the morning the sun comes back
  LOOK.dawn = Object.assign({}, LOOK.north, { seed: 'north', sky: ['#2a3a7c', '#6a5a9e', '#c47c98', '#f4a87a', '#ffd89a', '#fff4d6'], stars: 0.25, aurora: 0, orb: { x: 306, y: 124, r: 13, col: '#fffbe6', glow: '#ffe6a8', gr: 110 }, ridge: ['#9a86ba', '#7a68a4', '#5a508c', '#40407a'], haze: '#ffd8b0' });

  /* ---------- far country: ridgelines as periodic silhouettes ---------- */
  const LW = 640; // the period of every far layer, in units
  const ridgeCache = {};
  function wave(seed, n) { const r = rng(seed), ph = [], am = []; for (let k = 1; k <= n; k++) { ph.push(r() * TAU); am.push((0.5 + r()) / Math.pow(k, 1.1)); } const tot = am.reduce((a, b) => a + b, 0); return x => { let v = 0; for (let k = 0; k < n; k++) v += am[k] * Math.sin(TAU * (k + 1) * x / LW + ph[k]); return v / tot; }; }
  function spruce(p, x, base, h) { const w = h * 0.3; p.moveTo(x - w, base + 1); for (let i = 0; i < 4; i++) { const k = i / 4, k2 = (i + 1) / 4; p.lineTo(x - w * (1 - k) , base - h * k); p.lineTo(x - w * (1 - k2) * 0.55, base - h * k2 + h * 0.03); } p.lineTo(x, base - h * 1.05); for (let i = 3; i >= 0; i--) { const k = i / 4, k2 = (i + 1) / 4; p.lineTo(x + w * (1 - k2) * 0.55, base - h * k2 + h * 0.03); p.lineTo(x + w * (1 - k), base - h * k); } p.lineTo(x + w, base + 1); p.closePath(); }
  function roundTree(p, x, base, h) { p.rect(x - h * 0.05, base - h * 0.5, h * 0.1, h * 0.5 + 1); p.moveTo(x + h * 0.42, base - h * 0.62); p.arc(x, base - h * 0.62, h * 0.42, 0, TAU); p.moveTo(x + h * 0.6, base - h * 0.5); p.arc(x + h * 0.3, base - h * 0.5, h * 0.3, 0, TAU); p.moveTo(x - h * 0.02, base - h * 0.46); p.arc(x - h * 0.3, base - h * 0.46, h * 0.28, 0, TAU); }
  function cactus(p, x, base, h) { const w = h * 0.1; rr(p, x - w, base - h, w * 2, h + 1, w); rr(p, x - w * 4, base - h * 0.62, w * 1.6, h * 0.36, w * 0.8); p.rect(x - w * 4, base - h * 0.36, w * 3.4, w * 1.5); rr(p, x + w * 2.6, base - h * 0.8, w * 1.6, h * 0.38, w * 0.8); p.rect(x, base - h * 0.52, w * 4, w * 1.5); }
  function deadTree(p, x, base, h) { const q = (x0, y0, x1, y1, w) => { p.moveTo(x0 - w, y0); p.lineTo(x1 - w * 0.3, y1); p.lineTo(x1 + w * 0.3, y1); p.lineTo(x0 + w, y0); p.closePath(); }; q(x, base + 1, x + h * 0.04, base - h, h * 0.05); q(x, base - h * 0.5, x - h * 0.3, base - h * 0.86, h * 0.025); q(x + h * 0.02, base - h * 0.66, x + h * 0.28, base - h * 0.98, h * 0.025); q(x - h * 0.16, base - h * 0.7, x - h * 0.2, base - h * 1.0, h * 0.015); }
  function gum(p, x, base, h) { const q = (x0, y0, x1, y1, w) => { p.moveTo(x0 - w, y0); p.lineTo(x1 - w * 0.4, y1); p.lineTo(x1 + w * 0.4, y1); p.lineTo(x0 + w, y0); p.closePath(); }; q(x, base + 1, x + h * 0.06, base - h * 0.7, h * 0.035); q(x + h * 0.03, base - h * 0.45, x - h * 0.3, base - h * 0.8, h * 0.02); q(x + h * 0.05, base - h * 0.6, x + h * 0.34, base - h * 0.86, h * 0.02); for (const [dx, dy, rw, rh] of [[-0.32, -0.86, 0.26, 0.09], [0.36, -0.92, 0.28, 0.09], [0.04, -0.98, 0.3, 0.1], [-0.1, -0.74, 0.16, 0.06], [0.22, -0.7, 0.14, 0.05]]) { p.moveTo(x + (dx + rw) * h, base + dy * h); p.ellipse(x + dx * h, base + dy * h, rw * h, rh * h, 0, 0, TAU); } }
  function ridgePath(id, i) {
    const key = id + i; if (ridgeCache[key]) return ridgeCache[key];
    const L = LOOK[id], kind = L.kind[i], sid = L.seed || id, seed = (sid.charCodeAt(0) * 31 + sid.length * 7 + i * 101) | 0, r = rng(seed + 9), n1 = wave(seed, 5), n2 = wave(seed + 1, 13);
    const base = [126, 102, 80, 60][i], amp = [34, 28, 22, 14][i], p = new Path2D(), hh = [];
    const hAt = x => {
      const a = n1(x), b = n2(x);
      if (kind === 'fells' || kind === 'spruce') return base + amp * (a * 0.9 + b * 0.25);
      if (kind === 'hills' || kind === 'round') return base + amp * (a * 0.7 + b * 0.1);
      if (kind === 'peaks' || kind === 'dead') return base + amp * (1 - Math.abs(a) * 2.1 + b * 0.35);
      if (kind === 'mesa' || kind === 'cactus') { const v = a + b * 0.15, st = v > 0.25 ? 1 : v > -0.05 ? 0.5 : 0; return base - amp * 0.4 + amp * 1.1 * st; }
      if (kind === 'domes') { const d = Math.max(0, Math.sin(x * TAU / 106 + i)) * Math.max(0, 0.4 + a); return base - 8 + amp * 1.4 * Math.sqrt(d); }
      if (kind === 'rock') { const k = (x - 190) / 110; return base - 22 + (Math.abs(k) < 1 ? 62 * Math.pow(1 - k * k * k * k, 0.5) + Math.sin(x * 0.3) * 1 : 0) + b * 2; }
      if (kind === 'plain' || kind === 'gum') return base - 4 + amp * 0.3 * a + b;
      return base + amp * a * 0.4;
    };
    for (let x = 0; x <= LW; x += 2) hh.push(hAt(x % LW));
    if (kind === 'mesa' || kind === 'cactus') for (let pass = 0; pass < 3; pass++) for (let k = 1; k < hh.length - 1; k++) hh[k] = Math.max(hh[k], Math.max(hh[k - 1], hh[k + 1]) - 3.2); // cliffs with a little talus, not walls
    hh[hh.length - 1] = hh[0];
    if (kind === 'pillars') { // a mine: roof above, columns between
      p.rect(0, 0, LW, 20 + i * 5);
      for (let k = 0; k < 9 - i * 2; k++) { const x = (k + r() * 0.6) * LW / (9 - i * 2), wd = 10 + r() * 14 + i * 5; p.moveTo(x - wd, 0); p.quadraticCurveTo(x - wd * 0.3, 40 + i * 8, x - wd * 0.42, H * 0.6); p.lineTo(x - wd * 0.9, H); p.lineTo(x + wd * 0.9, H); p.lineTo(x + wd * 0.42, H * 0.6); p.quadraticCurveTo(x + wd * 0.3, 40 + i * 8, x + wd, 0); p.closePath(); }
      for (let k = 0; k < 40; k++) { const x = r() * LW, len = 6 + r() * 22, wd = 2 + r() * 4; p.moveTo(x - wd, 18 + i * 5); p.lineTo(x, 18 + i * 5 + len); p.lineTo(x + wd, 18 + i * 5); p.closePath(); }
      p.rect(0, H - 30 + i * 6, LW, 40);
    } else {
      p.moveTo(0, H + 2); for (let k = 0; k < hh.length; k++) p.lineTo(k * 2, H - hh[k]); p.lineTo(LW, H + 2); p.closePath();
      const at = x => H - hh[Math.round(((x % LW) + LW) % LW / 2)];
      const n = kind === 'spruce' ? 34 + i * 10 : kind === 'round' ? 16 : kind === 'cactus' ? 9 : kind === 'dead' ? 8 : kind === 'gum' ? 7 : 0;
      for (let k = 0; k < n; k++) { const x = 6 + r() * (LW - 12), hgt = kind === 'spruce' ? (10 + r() * 14) * (0.6 + i * 0.28) : kind === 'round' ? 14 + r() * 12 : kind === 'cactus' ? 18 + r() * 14 : kind === 'gum' ? 30 + r() * 16 : 20 + r() * 16; const b = Math.max(at(x - 2), at(x + 2)) + 1; (kind === 'spruce' ? spruce : kind === 'round' ? roundTree : kind === 'cactus' ? cactus : kind === 'gum' ? gum : deadTree)(p, x, b, hgt); }
      if (kind === 'rubble') for (let k = 0; k < 30; k++) { const x = r() * LW, s = 3 + r() * 7; p.moveTo(x + s, at(x)); p.arc(x, at(x), s, 0, Math.PI, true); }
    }
    return ridgeCache[key] = p;
  }
  const starField = (() => { const r = rng(77), out = []; for (let i = 0; i < 150; i++) out.push({ x: r() * LW, y: r() * r() * 150, r: 0.25 + r() * r() * 0.75, p: r() * TAU, w: r() < 0.15 }); return out; })();
  const cloudField = (() => { const r = rng(15), out = []; for (let i = 0; i < 10; i++) out.push({ x: r() * LW, y: 18 + r() * 80, w: 40 + r() * 80, h: 3 + r() * 5 }); return out; })();
  const PARA = [0.05, 0.11, 0.2, 0.34], YO = [0.12, 0.2, 0.32, 0.46];

  function backdrop(g, id, cx, yo, t, lit) {
    const L = LOOK[id] || LOOK.north;
    g.fillStyle = vgrad(g, 0, H, L.sky); g.fillRect(-1, -1, W + 2, H + 2);
    if (L.stars) { const off = cx * 0.015; for (const s of starField) { const x = ((s.x - off) % LW + LW) % LW; if (x > W + 2) continue; g.globalAlpha = L.stars * (s.y > 110 ? 0.4 : 1) * (0.55 + 0.45 * Math.sin(t * 0.03 + s.p)); disc(g, x, s.y, s.r, s.w ? '#ffe9c8' : '#eaf2ff'); } g.globalAlpha = 1; }
    if (L.aurora) { g.save(); g.imageSmoothingEnabled = true; Backdrop.aurora(g, t, cx * 0.03, -6, 0.62 + 0.38 * (lit || 0)); g.restore(); }
    if (L.orb) {
      const o = L.orb; soft(g, o.x, o.y, o.gr * 1.25, o.glow, 0.55);
      const gr = g.createRadialGradient(o.x - o.r * 0.3, o.y - o.r * 0.3, 0, o.x, o.y, o.r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, o.col); g.fillStyle = gr; g.beginPath(); g.arc(o.x, o.y, o.r, 0, TAU); g.fill();
      if (L.aurora || id === 'vista') { g.fillStyle = 'rgba(170,186,228,0.4)'; g.beginPath(); g.ellipse(o.x - o.r * 0.3, o.y - o.r * 0.2, o.r * 0.32, o.r * 0.24, 0.4, 0, TAU); g.ellipse(o.x + o.r * 0.34, o.y + o.r * 0.1, o.r * 0.22, o.r * 0.3, -0.3, 0, TAU); g.ellipse(o.x - o.r * 0.05, o.y + o.r * 0.5, o.r * 0.26, o.r * 0.14, 0, 0, TAU); g.fill(); } // the seas of the moon
    }
    if (L.volcano) { const vx = 250 - cx * 0.03; soft(g, vx, 96, 90, '#ff5a1a', 0.5 + 0.08 * Math.sin(t * 0.04)); }
    if (L.clouds) { // clouds: a few soft heaps on a flat base, drifting, kept clear of the top of the frame
      g.fillStyle = L.clouds; g.globalAlpha = 0.34;
      for (const c of cloudField) { const x = ((c.x - cx * 0.03 - t * 0.02) % LW + LW) % LW - 120, y = c.y + 14; if (x > W + 10) continue; g.beginPath(); rr(g, x, y, c.w, c.h * 0.8, c.h * 0.4); for (let k = 0; k < 5; k++) { const ex = x + c.w * (0.14 + k * 0.18), er = c.h * (0.9 + ((k * 7 + (c.w | 0)) % 4) * 0.35); g.moveTo(ex + er * 1.5, y + c.h * 0.3); g.ellipse(ex, y + c.h * 0.3, er * 1.5, er, 0, Math.PI, 0); } g.fill(); }
      g.globalAlpha = 1;
    }
    for (let i = 0; i < 4; i++) {
      const off = Math.round((((cx * PARA[i]) % LW + LW) % LW) * S) / S, dy = L.cave ? 0 : Math.round(yo * YO[i] * S) / S, cv = layer(id, i);
      if (id === 'oz' && i === 3) roos(g, cx, yo, t);
      g.imageSmoothingQuality = 'low'; g.drawImage(cv, -off, dy, LW, H); if (LW - off < W + 1) g.drawImage(cv, LW - off - 0.4, dy, LW, H); g.imageSmoothingQuality = 'high';
    }
    if (L.cave) { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const x = ((k * 190 + 60 - cx * 0.16) % 560 + 560) % 560 - 90; g.fillStyle = vgrad(g, 0, 170, ['rgba(150,180,255,0.16)', 'rgba(150,180,255,0)']); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 16, 0); g.lineTo(x + 58, 170); g.lineTo(x - 26, 170); g.closePath(); g.fill(); } g.restore(); } // daylight, a long way up
    if (L.cave) for (let k = 0; k < 14; k++) { const x = ((k * 97 + 30 - cx * 0.2) % 520 + 520) % 520 - 60, y = 60 + (k * 53) % 90; soft(g, x, y, 5 + (k % 3) * 2, k % 3 ? '#7fd8ff' : '#b890ff', 0.35 + 0.2 * Math.sin(t * 0.04 + k)); disc(g, x, y, 0.7, '#eaf8ff'); }
    if (L.embers) for (let k = 0; k < 26; k++) { const life = ((t * (0.3 + (k % 5) * 0.08) + k * 41) % 260) / 260, x = ((k * 71 - cx * 0.3) % 440 + 440) % 440 - 20 + Math.sin(t * 0.02 + k) * 8; g.globalAlpha = (1 - life) * 0.8; disc(g, x, H - 20 - life * 170, 0.6 + (k % 3) * 0.3, k % 2 ? '#ffb040' : '#ff6a20'); } g.globalAlpha = 1;
  }
  function layer(id, i) {
    const k = Math.min(S, 3), key = id + i; // painted 1:1 on most screens; on very large ones, stretched a little
    let cv = layers.get(key);
    if (cv) return cv;
    if (layers.size >= 8) { const old = layers.keys().next().value; layers.get(old).width = 0; layers.delete(old); }
    const L = LOOK[id];
    cv = document.createElement('canvas'); cv.width = Math.ceil(LW * k); cv.height = Math.ceil(H * k);
    const q = cv.getContext('2d'); q.scale(k, k);
    q.fillStyle = L.cave ? L.ridge[i] : vgrad(q, H - [160, 130, 102, 74][i], H - [40, 30, 20, 10][i], [L.ridge[i], mix(L.ridge[i], L.haze, 0.5 - i * 0.09)]);
    q.fill(ridgePath(id, i));
    if (L.cave && i < 3) { q.save(); q.clip(ridgePath(id, i)); const r = rng(600 + i); q.lineCap = 'round'; for (let n = 0; n < 16; n++) { const x = r() * LW, y = 24 + r() * 150; q.strokeStyle = n % 3 ? 'rgba(184,98,58,0.42)' : 'rgba(224,154,90,0.5)'; q.lineWidth = 0.6 + r() * 1.2; q.beginPath(); q.moveTo(x, y); q.bezierCurveTo(x + 12, y + 10 * (r() - 0.5), x + 26, y + 16 * (r() - 0.5), x + 34 + r() * 20, y + 20 * (r() - 0.5)); q.stroke(); } q.restore(); } // iron in the rock
    if (!L.cave && i < 3) { q.fillStyle = vgrad(q, H - [112, 90, 70][i], H - [66, 48, 32][i], [L.haze + '00', L.haze + '30', L.haze + '00']); q.fillRect(0, H - 114, LW, 90); } // mist lying in the valleys
    layers.set(key, cv);
    return cv;
  }
  function roos(g, cx, yo, t) { // a mob of kangaroos crossing, far off, unbothered
    g.fillStyle = '#7a3038';
    for (let i = 0; i < 3; i++) {
      const hop = Math.abs(Math.sin(t * 0.045 + i * 0.9)), x = W + 30 - ((t * 0.5 + i * 24 + cx * 0.3) % (W * 2.6)), y = H - 78 - hop * 6 + yo * YO[2];
      if (x < -20 || x > W + 20) continue;
      g.save(); g.translate(x, y); g.rotate(-0.25 + hop * 0.2); g.beginPath(); g.ellipse(0, 0, 5.5, 3, -0.5, 0, TAU); g.ellipse(-4.5, -4.6, 2, 1.4, -0.9, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(-5.4, -5.6); g.lineTo(-5.2, -8.6); g.lineTo(-4.2, -5.8); g.moveTo(4, 1); g.quadraticCurveTo(10, 2, 12, -2 + hop * 3); g.lineTo(11, -3 + hop * 3); g.quadraticCurveTo(8, 0, 4, -1); g.moveTo(1, 2); g.lineTo(-1 - hop * 2, 6); g.lineTo(-4 - hop * 2, 6.6); g.lineTo(-4 - hop * 2, 5.6); g.lineTo(-2.4, 5); g.lineTo(-1, 1); g.fill(); g.restore();
    }
  }

  /* ---------- the ground she walks on ---------- */
  function terrain(g, w, ox, oy) {
    const x0 = Math.max(0, Math.floor(ox / T) - 1), x1 = Math.min(w.cols - 1, Math.floor((ox + W) / T) + 1);
    const y0 = Math.max(0, Math.floor(oy / T) - 1), y1 = Math.min(w.rows - 1, Math.floor((oy + H) / T) + 1);
    let a = x0;
    while (a <= x1) { // one span per land, so the join between two lands is a clean seam
      let b = a; const th = w.colTheme[a]; while (b + 1 <= x1 && w.colTheme[b + 1] === th) b++;
      const L = LOOK[th.id] || LOOK.north, wy = cy => cy * T - oy;
      g.beginPath();
      for (let cy = y0; cy <= y1; cy++) { let run = -1; for (let cx = a; cx <= b + 1; cx++) { const s = cx <= b && w.grid[cy][cx] === '#'; if (s && run < 0) run = cx; else if (!s && run >= 0) { g.rect(run * T - ox, wy(cy), (cx - run) * T + (cx <= b ? 0 : 0.3), T + 0.4); run = -1; } } }
      if (y1 === w.rows - 1) { let run = -1; for (let cx = a; cx <= b + 1; cx++) { const s = cx <= b && w.grid[y1][cx] === '#'; if (s && run < 0) run = cx; else if (!s && run >= 0) { g.rect(run * T - ox, wy(y1 + 1) - 0.2, (cx - run) * T + 0.3, H); run = -1; } } }
      g.fillStyle = vgrad(g, wy(w.rows - 16), wy(w.rows) + 30, [mix(L.ground[0], L.ridge[3], 0.25), L.ground[0], L.ground[1]]);
      g.fill();
      g.save(); g.clip(); g.fillStyle = mix(L.ground[0], L.capShade, 0.5); // old layers in the earth
      for (const [dy, th, al] of [[18, 3.4, 0.16], [34, 5, 0.13], [56, 4, 0.1], [84, 6, 0.08], [120, 5, 0.07], [160, 7, 0.06]]) {
        g.globalAlpha = al; g.beginPath(); const yb = wy(w.rows) - 190 + dy + 60;
        for (let x = a * T - ox - 8; x <= (b + 1) * T - ox + 8; x += 8) { const yy = yb + Math.sin((x + ox) * 0.021 + dy) * 3 + Math.sin((x + ox) * 0.057 + dy * 2) * 1.4; x === a * T - ox - 8 ? g.moveTo(x, yy) : g.lineTo(x, yy); }
        for (let x = (b + 1) * T - ox + 8; x >= a * T - ox - 8; x -= 8) g.lineTo(x, yb + th + Math.sin((x + ox) * 0.021 + dy) * 3 + Math.sin((x + ox) * 0.043 + dy) * 1.6);
        g.closePath(); g.fill();
      }
      g.restore(); g.globalAlpha = 1;
      caps(g, w, L, a, b, y0, y1, ox, oy);
      a = b + 1;
    }
  }
  function caps(g, w, L, a, b, y0, y1, ox, oy) {
    const runs = [];
    for (let cy = Math.max(1, y0); cy <= y1; cy++) { let run = -1; for (let cx = a; cx <= b + 1; cx++) { const s = cx <= b && w.grid[cy][cx] === '#' && w.grid[cy - 1][cx] !== '#'; if (s && run < 0) run = cx; else if (!s && run >= 0) { runs.push([run * T - ox, cx * T - ox, cy * T - oy, run]); run = -1; } } }
    if (!runs.length) return;
    const kind = L.cap;
    g.beginPath();
    for (const [xa, xb, y, c0] of runs) {
      if (kind === 'snow') { // a soft drift, heaped a little
        g.moveTo(xa - 1.2, y + 3.2); g.quadraticCurveTo(xa - 1.6, y - 1.6, xa + 2.5, y - 1.8);
        for (let x = xa + 2.5; x < xb - 2.5; x += 8) { const wx = Math.round(x + ox), h1 = 1.2 + 1.6 * hash2(wx >> 3, 7); g.quadraticCurveTo(Math.min(x + 4, xb - 2.5), y - 1.8 - h1, Math.min(x + 8, xb - 2.5), y - 1.8); }
        g.quadraticCurveTo(xb + 1.6, y - 1.6, xb + 1.2, y + 3.2);
        for (let x = xb; x > xa; x -= 6) g.quadraticCurveTo(x - 3, y + 4.6 - 1.2 * hash2((x + ox) >> 2, 3), Math.max(xa - 1.2, x - 6), y + 3.2);
        g.closePath();
      } else if (kind === 'grass') {
        rr(g, xa - 0.8, y - 1.2, xb - xa + 1.6, 3.6, 1.6);
        for (let x = xa + 1; x < xb - 1; x += 2.6) { const wx = Math.round(x + ox), hh = 1.4 + 3 * hash2(wx, 11), ln = (hash2(wx, 5) - 0.5) * 2.4; g.moveTo(x - 0.9, y - 0.8); g.lineTo(x + ln, y - 1 - hh); g.lineTo(x + 0.9, y - 0.8); g.closePath(); }
      } else if (kind === 'spinifex') {
        rr(g, xa - 0.6, y - 0.8, xb - xa + 1.2, 2.4, 1.2);
        for (let x = xa + 2; x < xb - 2; x += 5.2) { const wx = Math.round(x + ox); if (hash2(wx, 9) < 0.45) continue; for (let k = -2; k <= 2; k++) { g.moveTo(x - 0.5, y - 0.4); g.lineTo(x + k * 1.5, y - 3.6 + Math.abs(k) * 0.7); g.lineTo(x + 0.5, y - 0.4); g.closePath(); } }
      } else rr(g, xa - 0.5, y - 0.9, xb - xa + 1, kind === 'sand' ? 2.6 : 2.2, 1.1);
    }
    g.fillStyle = L.capCol; g.fill();
    g.beginPath(); // the shaded underside of the cap
    for (const [xa, xb, y] of runs) g.rect(xa, y + (kind === 'snow' ? 2.4 : 1.2), xb - xa, 0.9);
    g.globalAlpha = 0.5; g.fillStyle = L.capShade; g.fill(); g.globalAlpha = 1;
  }
  function liquid(g, w, ox, oy, glowPass) {
    const x0 = Math.max(0, Math.floor(ox / T) - 1), x1 = Math.min(w.cols - 1, Math.floor((ox + W) / T) + 1), t = w.t;
    let a = x0;
    while (a <= x1) {
      let b = a; const th = w.colTheme[a]; while (b + 1 <= x1 && w.colTheme[b + 1] === th) b++;
      const Lq = th.liquid;
      if (!!Lq.glow === glowPass) {
        let run = -1, top = 0;
        for (let cx = a; cx <= b + 1; cx++) {
          let sy = -1; if (cx <= b) for (let cy = 0; cy < w.rows; cy++) if (w.grid[cy][cx] === '~') { sy = cy; break; }
          if (sy >= 0 && run < 0) { run = cx; top = sy; }
          else if (run >= 0 && (sy < 0 || sy !== top)) {
            const xa = run * T - ox, xb = cx * T - ox, y = top * T - oy + 5;
            g.beginPath(); g.moveTo(xa, H + 4); g.lineTo(xa, y);
            for (let x = xa; x <= xb + 1; x += 4) g.lineTo(Math.min(x, xb), y + Math.sin(t * 0.05 + (x + ox) * 0.07) * 1.3 + Math.sin(t * 0.031 + (x + ox) * 0.13) * 0.6);
            g.lineTo(xb, H + 4); g.closePath();
            g.fillStyle = vgrad(g, y - 2, y + 64, Lq.glow ? [Lq.top, Lq.body, Lq.deep] : [mix(Lq.top, Lq.body, 0.62), Lq.body, Lq.deep, Lq.deep]); g.globalAlpha = Lq.glow ? 1 : 0.94; g.fill(); g.globalAlpha = 1;
            g.strokeStyle = Lq.glow ? '#fff6c8' : 'rgba(255,255,255,0.75)'; g.lineWidth = 0.7; g.beginPath();
            for (let x = xa; x <= xb + 1; x += 4) { const yy = y + Math.sin(t * 0.05 + (x + ox) * 0.07) * 1.3 + Math.sin(t * 0.031 + (x + ox) * 0.13) * 0.6; x === xa ? g.moveTo(x, yy) : g.lineTo(Math.min(x, xb), yy); } g.stroke();
            g.fillStyle = Lq.glow ? 'rgba(255,240,170,0.5)' : 'rgba(255,255,255,0.28)'; // slow glints
            for (let x = Math.ceil((xa + ox) / 23) * 23; x < xb + ox; x += 23) { const k = (t * 0.25 + x * 1.7) % 60; if (k < 22) { g.beginPath(); rr(g, x - ox + k * 0.2, y + 5 + (x % 3) * 4, 5 - k * 0.15, 0.7, 0.35); g.fill(); } }
            if (Lq.glow) for (let x = xa + 8; x < xb; x += 30) soft(g, x, y, 34, Lq.glow, 0.2 + 0.05 * Math.sin(t * 0.07 + x));
            run = sy >= 0 ? cx : -1; top = sy;
          }
        }
      }
      a = b + 1;
    }
  }

  /* ---------- small figures ---------- */
  const ANA = { tunic: '#2f9c96', tunicD: '#1f7478', belt: '#f0cf78', cloak: '#d8463c', cloakD: '#a52e32', hair: '#f6d572', hairD: '#d9a94a', skin: '#f8dfc4', leg: '#5a4a6e', boot: '#5a3b28', band: '#d8463c', hem: -7, long: 1, ears: 1 };
  const MAYANK = { tunic: '#f2a43c', tunicD: '#c97a22', belt: '#fff0c8', cloak: null, scarf: '#3b44a8', hair: '#221a1c', hairD: '#221a1c', skin: '#b98052', leg: '#f1e8d8', boot: '#6a4630', hem: -5, long: 0 };
  // o: face, speed (0..1), ph (stride phase), air (vertical speed, or 0 on the ground), glide, hurt, shoot, raise, t, sq, crown, lantern
  function figure(g, x, y, o, K) {
    K = K || ANA;
    const t = o.t || 0, sp = o.speed || 0, air = o.air || 0, inAir = !!o.inAir, ph = o.ph || 0;
    g.save(); g.translate(x, y); g.scale(o.face < 0 ? -1 : 1, 1); if (o.sq && Math.abs(o.sq - 1) > 0.02) g.scale(2 - o.sq, o.sq); if (o.scale) g.scale(o.scale, o.scale);
    const bob = inAir ? 0 : sp > 0.1 ? -Math.abs(Math.sin(ph)) * 0.9 : Math.sin(t * 0.05) * 0.25;
    const lean = o.hurt ? -0.3 : inAir ? clamp(air * 0.03, -0.12, 0.16) : sp * 0.13;
    const flow = clamp(sp + (inAir ? 0.5 : 0), 0, 1.3), lift = inAir ? clamp(air * 0.22, -0.6, 1.2) : 0, wv = Math.sin(t * 0.16) * (0.6 + flow), wv2 = Math.sin(t * 0.16 + 1.3) * (0.6 + flow);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // legs
    const st = inAir ? 0 : Math.sin(ph) * 3.6 * Math.min(1, sp * 1.4), lf = inAir ? 0 : Math.max(0, Math.cos(ph)) * 1.8 * sp, lf2 = inAir ? 0 : Math.max(0, -Math.cos(ph)) * 1.8 * sp;
    const f1 = inAir ? [air < 0 ? 1.6 : 2.4, air < 0 ? -1.6 : -0.6] : [st, -lf], f2 = inAir ? [air < 0 ? -1.8 : -1.2, air < 0 ? -0.4 : -1.4] : [-st, -lf2];
    if (!inAir && sp < 0.1) { f1[0] = 1.3; f2[0] = -1.3; } // standing: feet a little apart
    g.strokeStyle = K.leg; g.lineWidth = 2;
    g.beginPath(); // each leg bends at the knee, a little forward of the straight line
    g.moveTo(-0.9, -8 + bob); g.quadraticCurveTo((f2[0] - 1.3) * 0.5 + 1.2 + Math.abs(f2[1]) * 0.6, -4.6 + bob * 0.5 + f2[1] * 0.4, f2[0] - 0.4, f2[1] - 1.2);
    g.moveTo(0.9, -8 + bob); g.quadraticCurveTo((f1[0] + 1.3) * 0.5 + 1.2 + Math.abs(f1[1]) * 0.6, -4.6 + bob * 0.5 + f1[1] * 0.4, f1[0] + 0.4, f1[1] - 1.2); g.stroke();
    g.fillStyle = K.boot; g.beginPath(); rr(g, f2[0] - 1.7, f2[1] - 2.6, 3.6, 2.6, 1); rr(g, f1[0] - 1.3, f1[1] - 2.6, 3.6, 2.6, 1); g.fill();
    g.translate(0, bob); g.rotate(lean);
    // cloak, or a scarf
    if (K.cloak) {
      const gl = o.glide ? 1 : 0, tipX = -5 - 6.5 * flow - gl * 7, tipY = -3.2 - lift * 7 - gl * 9 + wv;
      g.fillStyle = K.cloak; g.beginPath(); g.moveTo(1.8, -16.6); g.quadraticCurveTo(-3.5 - 2 * flow, -15.5 - lift * 2 - gl * 3, tipX, tipY);
      g.quadraticCurveTo(tipX + 1.2, tipY + 2.4 + wv2 * 0.5, tipX + 3.4 + gl * 3, tipY + 3.2 + wv2); g.quadraticCurveTo(-2.4, -4.5 - lift * 2, 1.2, -6.6); g.closePath(); g.fill();
      g.strokeStyle = K.cloakD; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-0.6, -15.6); g.quadraticCurveTo(-3 - flow * 2, -11 - lift * 3, tipX + 2.2, tipY + 2.2 + wv2 * 0.6); g.stroke();
    }
    // far arm
    const sw = inAir ? 0.5 : Math.sin(ph) * 0.9 * Math.min(1, sp * 1.4);
    g.strokeStyle = K.tunicD; g.lineWidth = 1.7; g.beginPath(); g.moveTo(-1.4, -15.4); g.lineTo(-1.4 + Math.sin(sw) * 4.2, -15.4 + Math.cos(sw) * 4.6); g.stroke();
    // tunic
    g.fillStyle = K.tunic; g.beginPath(); g.moveTo(-2.7, -16.8); g.quadraticCurveTo(0, -17.8, 2.7, -16.8); g.lineTo(3.5, K.hem - 0.4); g.quadraticCurveTo(0, K.hem + 1.2, -3.5, K.hem - 0.4); g.closePath(); g.fill();
    g.fillStyle = K.tunicD; g.beginPath(); g.moveTo(-2.7, -16.8); g.lineTo(-3.5, K.hem - 0.4); g.quadraticCurveTo(-2.2, K.hem + 0.4, -1.2, K.hem + 0.5); g.lineTo(-1, -17.2); g.closePath(); g.fill();
    g.fillStyle = K.belt; g.fillRect(-3.1, -11.2, 6.2, 0.9);
    if (K.scarf) { g.fillStyle = K.scarf; g.beginPath(); rr(g, -2.6, -18, 5.4, 2, 1); g.fill(); g.beginPath(); g.moveTo(-2, -17.4); g.quadraticCurveTo(-5 - flow * 3, -15.6 + wv * 0.4, -5.6 - flow * 5, -12.4 + wv); g.lineTo(-4.2 - flow * 5, -11.6 + wv2); g.quadraticCurveTo(-3.6 - flow * 2, -14.6, -1, -16.2); g.closePath(); g.fill(); }
    // head
    const hx = 0.5, hy = -20.2;
    if (K.long) { // long hair, lifted by the going
      const hxT = -3 - 5 * flow, hyT = -11.4 - lift * 6 + wv2;
      g.fillStyle = K.hair; g.beginPath(); g.moveTo(-1.4, -22.6); g.quadraticCurveTo(-4.2 - flow * 2, -19 - lift, hxT, hyT); g.quadraticCurveTo(hxT + 0.6, hyT + 0.9, hxT + 1.2, hyT + 0.6 + wv * 0.3); g.quadraticCurveTo(-1.8, -15, -0.4, -18); g.closePath(); g.fill();
      g.strokeStyle = K.hairD; g.lineWidth = 0.45; g.beginPath(); g.moveTo(-1.8, -21); g.quadraticCurveTo(-3.6 - flow * 2, -17.6 - lift, hxT + 0.5, hyT + 0.3); g.stroke();
    }
    g.fillStyle = K.skin; g.beginPath(); g.arc(hx, hy, 2.9, 0, TAU); g.fill();
    if (K.ears) { g.beginPath(); g.moveTo(hx - 2.2, hy + 0.4); g.lineTo(hx - 4, hy - 0.9); g.lineTo(hx - 1.6, hy + 1.6); g.closePath(); g.fill(); }
    g.fillStyle = K.hair; g.beginPath(); g.moveTo(hx + 2.7, hy - 1.2); g.quadraticCurveTo(hx + 1.6, hy - 3.9, hx - 0.8, hy - 3.3); g.quadraticCurveTo(hx - 3.6, hy - 2.6, hx - 3.1, hy + 1); g.quadraticCurveTo(hx - 2.2, hy + 2.6, hx - 1.4, hy + 3); g.quadraticCurveTo(hx - 1.2, hy, hx + 0.2, hy - 1.3); g.quadraticCurveTo(hx + 1.6, hy - 1.6, hx + 2.7, hy - 1.2); g.closePath(); g.fill();
    if (K.band) { g.strokeStyle = K.band; g.lineWidth = 1.3; g.beginPath(); g.moveTo(hx + 2.7, hy - 1.5); g.quadraticCurveTo(hx, hy - 2.6, hx - 2.9, hy - 0.5); g.stroke(); star4(g, hx + 1.5, hy - 2, 0.9, '#ffffff'); }
    g.fillStyle = '#2a2233'; g.beginPath(); g.arc(hx + 1.7, hy + 0.1, 0.42, 0, TAU); g.fill();
    if (o.crown) { g.fillStyle = '#ffe9a0'; for (let i = -2; i <= 2; i++) star4(g, hx + i * 1.5, hy - 4.1 - (2 - Math.abs(i)) * 0.6, 0.9 + (i === 0 ? 0.5 : 0), '#fff3c4', t * 0.01); }
    // near arm: swinging, drawing a bow, holding up the light, or carrying a lantern
    g.strokeStyle = mix(K.tunic, '#ffffff', 0.22); g.lineWidth = 1.8; g.beginPath(); g.moveTo(1.4, -15.6);
    if (o.shoot) { g.lineTo(6.2, -15.2); g.stroke(); g.strokeStyle = '#fff6dc'; g.lineWidth = 1.2; g.beginPath(); g.arc(4.4, -15.2, 5.2, -1.15, 1.15); g.stroke(); g.lineWidth = 0.35; g.beginPath(); g.moveTo(6.5, -19.9); g.lineTo(6.5, -10.5); g.stroke(); }
    else if (o.raise) { g.lineTo(4.4, -21.6); g.stroke(); }
    else if (o.lantern) { g.lineTo(5.2, -13); g.stroke(); g.strokeStyle = '#6a4a30'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(5.4, -13); g.lineTo(5.6, -11); g.stroke(); g.fillStyle = '#ffe9a8'; g.beginPath(); rr(g, 4.2, -11.2, 2.8, 3.6, 0.9); g.fill(); g.fillStyle = '#6a4a30'; g.fillRect(4, -11.5, 3.2, 0.6); g.fillRect(4, -7.8, 3.2, 0.6); }
    else { g.lineTo(1.4 - Math.sin(sw) * 4.2, -15.6 + Math.cos(sw) * 4.8); g.stroke(); }
    g.restore();
  }
  function tonttu(g, x, y, t, face) { // the house-spirit: a boot high, and as old as the house
    g.save(); g.translate(x, y + Math.sin(t * 0.05) * 0.2); g.scale(face < 0 ? -1 : 1, 1);
    g.fillStyle = '#5b6a8c'; g.beginPath(); rr(g, -3.6, -7.4, 7.2, 7.4, 2.6); g.fill();
    g.fillStyle = '#3a2a24'; g.beginPath(); rr(g, -3.4, -1.3, 3, 1.4, 0.6); rr(g, 0.5, -1.3, 3, 1.4, 0.6); g.fill();
    g.fillStyle = '#f4f2ee'; g.beginPath(); g.moveTo(-3.2, -8.6); g.quadraticCurveTo(0.6, -7.6, 3.6, -8.6); g.quadraticCurveTo(3, -4, 0.6, -1.6); g.quadraticCurveTo(-2.4, -4, -3.2, -8.6); g.closePath(); g.fill();
    g.fillStyle = '#f2c9a6'; g.beginPath(); g.arc(1.4, -8.4, 1.15, 0, TAU); g.fill();
    g.fillStyle = '#d8463c'; g.beginPath(); g.moveTo(-4, -8.6); g.quadraticCurveTo(-2.4, -14, -1.8 + Math.sin(t * 0.04) * 0.6, -17.4); g.quadraticCurveTo(1.6, -13, 4.2, -8.6); g.quadraticCurveTo(0, -9.8, -4, -8.6); g.closePath(); g.fill();
    g.restore();
  }

  return { setScale, get s() { return S; }, LOOK, LW, vgrad, rr, disc, soft, stamp, star4, backdrop, terrain, liquid, figure, tonttu, ANA, MAYANK, spruce, roundTree, cactus, deadTree, gum };
})();

/* ---------- the made things in the world: ledges, blocks, runestones, thorns, gates, bridges and doors of light ---------- */
Paint.tiles = function (g, w, ox, oy) {
  const x0 = Math.max(0, Math.floor(ox / T) - 1), x1 = Math.min(w.cols - 1, Math.floor((ox + W) / T) + 1);
  const y0 = Math.max(0, Math.floor(oy / T) - 1), y1 = Math.min(w.rows - 1, Math.floor((oy + H) / T) + 1), t = w.t, rr = Paint.rr;
  for (let cy = y0; cy <= y1; cy++) {
    let run = -1;
    for (let cx = x0; cx <= x1 + 1; cx++) { // ledges, joined into one slab
      const s = cx <= x1 && w.grid[cy][cx] === '=' && (run < 0 || w.colTheme[cx] === w.colTheme[run]);
      if (s && run < 0) run = cx;
      else if (!s && run >= 0) {
        const L = Paint.LOOK[w.colTheme[run].id], xa = run * T - ox, wd = (cx - run) * T, y = cy * T - oy;
        g.fillStyle = L.plat[1]; g.beginPath(); rr(g, xa + 0.4, y + 1, wd - 0.8, 5, 2); g.fill();
        g.fillStyle = L.plat[0]; g.beginPath(); rr(g, xa, y, wd, 4, 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); rr(g, xa + 1.5, y + 0.6, wd - 3, 0.9, 0.45); g.fill();
        if (L.cap === 'snow') { g.fillStyle = L.capCol; g.beginPath(); rr(g, xa - 0.5, y - 1.2, wd + 1, 2.4, 1.2); g.fill(); }
        run = w.grid[cy][cx] === '=' && cx <= x1 ? cx : -1;
      }
    }
    for (let cx = x0; cx <= x1; cx++) {
      const ch = w.grid[cy][cx];
      if (ch === '.' || ch === '~' || ch === '#' || ch === '=') continue;
      const L = Paint.LOOK[w.colTheme[cx].id]; let x = cx * T - ox, y = cy * T - oy;
      if (w.bumps.length) for (const b of w.bumps) if (b.cx === cx && b.cy === cy) y -= Math.sin(b.t / 10 * Math.PI) * 5;
      if (ch === 'B') {
        g.fillStyle = mix(L.ground[0], L.ridge[2], 0.45); g.beginPath(); rr(g, x + 0.4, y + 0.4, T - 0.8, T - 0.8, 2.6); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); rr(g, x + 1.6, y + 1.4, T - 3.2, 1.2, 0.6); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x + 3, y + 8.5); g.lineTo(x + 13, y + 8.5); g.moveTo(x + 8, y + 2.5); g.lineTo(x + 8, y + 8.5); g.moveTo(x + 5, y + 8.5); g.lineTo(x + 5, y + 14); g.moveTo(x + 11, y + 8.5); g.lineTo(x + 11, y + 14); g.stroke();
      } else if (ch === '^') {
        g.fillStyle = L.cap === 'snow' ? '#d6e8ff' : L.cap === 'grass' ? '#e6e2d2' : mix(L.capCol, '#ffffff', 0.35);
        g.beginPath(); for (let i = 0; i < 3; i++) { const bx = x + 0.6 + i * 5.2; g.moveTo(bx, y + T); g.lineTo(bx + 2.3 + (i - 1) * 0.5, y + 6.5 + (i % 2) * 2); g.lineTo(bx + 4.6, y + T); g.closePath(); } g.fill();
      } else if (ch === 'X') {
        g.fillStyle = '#120e14'; g.fillRect(x + 1, y - 0.2, T - 2, T + 0.4); g.fillStyle = '#3c3440'; g.fillRect(x + 3, y - 0.2, 2.4, T + 0.4); g.fillRect(x + 10.6, y - 0.2, 2.4, T + 0.4); g.fillStyle = '#ff7a2a'; g.fillRect(x + 3.6, y + 7, 1.2, 1.6); g.fillRect(x + 11.2, y + 7, 1.2, 1.6);
      } else if (ch === 'M') { // a bridge of light: a rumour until starlight finds it
        const m = w.moon[cx + cy * w.cols] || 0;
        if (m > 0) { const a = Math.min(1, m / 40); g.globalAlpha = a; g.fillStyle = Paint.vgrad(g, y, y + 6, ['rgba(255,255,255,0.95)', 'rgba(170,215,255,0.55)', 'rgba(170,215,255,0)']); g.fillRect(x - 0.2, y, T + 0.4, 6); g.globalAlpha = 1; Paint.soft(g, x + 8, y + 2, 12, '#bfe4ff', 0.28 * a); if ((t + cx * 9) % 40 < 6) Paint.star4(g, x + ((cx * 7) % 12) + 2, y - 1.5, 1.6, '#ffffff', t * 0.05); }
        else if (((t + cx * 23) >> 3) % 9 === 0) Paint.disc(g, x + (cx * 7 + (t >> 5)) % 14 + 1, y + 2 + (cx % 3), 0.5, 'rgba(223,242,255,0.7)');
      } else if (ch === 'D') { // a door that shows itself only to starlight: a veil across the way, thin as breath until she lights it
        const d = w.doors.find(q => q.cx === cx), k = d ? clamp((w.doorP[d.id] || 0) / 70, 0, 1) : 0, a = 0.2 + 0.55 * k + 0.05 * Math.sin(t * 0.07 + cy);
        const gr = g.createLinearGradient(x, 0, x + T, 0); gr.addColorStop(0, 'rgba(190,220,255,0)'); gr.addColorStop(0.5, `rgba(214,236,255,${a})`); gr.addColorStop(1, 'rgba(190,220,255,0)');
        g.fillStyle = gr; g.fillRect(x, y - 0.2, T, T + 0.4);
        g.fillStyle = `rgba(255,255,255,${0.35 + 0.6 * k})`; for (let i = 0; i < 2; i++) { const yy = ((t * 0.3 + cy * 37 + i * 9) % 16); Paint.disc(g, x + 8 + Math.sin(t * 0.05 + cy + i * 2) * 3, y + yy, 0.45, g.fillStyle); }
        if (k > 0) Paint.soft(g, x + 8, y + 8, 16, '#bfe4ff', 0.3 * k);
      } else { // a runestone: a piece of the land itself, hung in the air, asleep until light or an arrow wakes it
        const used = ch === 'U', pulse = 0.6 + 0.4 * Math.sin(t * 0.06 + cx * 1.3), h1 = hash2(cx, cy), bob = used ? 0 : Math.sin(t * 0.04 + cx) * 0.5;
        g.fillStyle = Paint.vgrad(g, y, y + T, [mix(L.ground[0], L.ridge[1], used ? 0.3 : 0.55), mix(L.ground[1], L.ground[0], 0.5)]);
        g.beginPath(); g.moveTo(x + 1.2, y + 5 + bob); g.quadraticCurveTo(x + 1 + h1, y + 0.8 + bob, x + 6, y + 0.6 + bob); g.lineTo(x + 10.6, y + 0.5 + bob); g.quadraticCurveTo(x + 15.2, y + 1 + bob, x + 15, y + 6 + bob); g.quadraticCurveTo(x + 15.6 - h1, y + 12 + bob, x + 11.6, y + 15.4 + bob); g.quadraticCurveTo(x + 7, y + 16.4 + bob, x + 3.4, y + 14.8 + bob); g.quadraticCurveTo(x + 0.2, y + 11 + bob, x + 1.2, y + 5 + bob); g.closePath(); g.fill();
        g.fillStyle = L.capCol; g.globalAlpha = L.cap === 'snow' ? 0.95 : 0.55; g.beginPath(); g.moveTo(x + 1.6, y + 3.4 + bob); g.quadraticCurveTo(x + 3, y + 0.2 + bob, x + 8, y + 0.2 + bob); g.quadraticCurveTo(x + 13.6, y + 0.2 + bob, x + 14.6, y + 3.6 + bob); g.quadraticCurveTo(x + 8, y + 1.6 + bob, x + 1.6, y + 3.4 + bob); g.fill(); g.globalAlpha = 1;
        if (used) Paint.star4(g, x + 8, y + 8.6, 2.6, 'rgba(255,255,255,0.14)');
        else { Paint.soft(g, x + 8, y + 8.6 + bob, 8, '#bfe4ff', 0.3 * pulse); g.globalAlpha = 0.6 + 0.4 * pulse; Paint.star4(g, x + 8, y + 8.6 + bob, 3, '#eaf6ff'); g.globalAlpha = 1; }
      }
    }
  }
};
