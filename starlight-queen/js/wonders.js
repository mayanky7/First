'use strict';
/* Starlight Queen — wonders (things worth stopping for) and the tear in the afternoon */
const WONDERS = [
  { id: 'fox', where: 'Finland', name: 'The Fox Fires', line: 'A fox runs over the fells, the old people say, and its tail strikes sparks from the snow. There are other explanations. This is the one we use.' },
  { id: 'frogs', where: 'Sweden', name: 'Små grodorna', line: 'Grown adults, hopping round a pole, singing that small frogs have no ears and no tails. Nobody is embarrassed. She had not known that was allowed.' },
  { id: 'undersky', where: 'Kiruna', name: 'The Under-Sky', line: 'Ore in the roof, catching her light. The miners have named the constellations: the Pick, the Kettle, the Late Shift.' },
  { id: 'whale', where: 'the sea', name: 'A Whale', line: 'It comes up alongside, regards her with one eye, and finds nothing to object to. Halfway between two lives, she takes that as a blessing.' },
  { id: 'arch', where: 'America', name: 'The Window', line: 'Wind did this, with sand, over a time nobody was there to count. In Kaamos a thing is old if a grandmother remembers it.' },
  { id: 'kings', where: 'the Mesa', name: 'The Stone Kings', line: 'Two of them, each with a hand held out. Whoever carved them had met a king.' },
  { id: 'cross', where: 'Australia', name: 'The Southern Cross', line: 'Stars she has never seen. The ones she knows are somewhere under her feet. Nothing bad has come of it.' }
];
const WONDER_BY_ID = {}; WONDERS.forEach((q, i) => { q.n = i; WONDER_BY_ID[q.id] = q; });

const WonderArt = (() => {
  let A = null;
  function build() {
    A = {};
    A.note = Art.spr(5, 7, g => { R(g, 0, 4, 3, 3, '#ffe9a8'); R(g, 2, 0, 1, 5, '#ffe9a8'); R(g, 3, 0, 2, 2, '#ffe9a8'); });
    A.fox = [0, 1].map(f => Art.spr(26, 14, g => {
      const c = '#eafff4', d = '#9af0c8';
      R(g, 8, 5, 11, 4, c); R(g, 18, 3, 5, 4, c); R(g, 22, 5, 3, 2, c); R(g, 19, 1, 1, 2, c); R(g, 21, 1, 1, 2, c);
      R(g, 3, 4, 6, 3, c); R(g, 0, 2, 5, 3, c); R(g, 0, 1, 2, 1, '#ffffff'); R(g, 9, 8, 9, 1, d);
      if (f) { R(g, 9, 9, 1, 3, d); R(g, 12, 9, 1, 2, d); R(g, 16, 9, 1, 2, d); R(g, 18, 9, 1, 3, d); }
      else { R(g, 6, 9, 4, 1, d); R(g, 5, 10, 1, 1, d); R(g, 18, 9, 4, 1, d); R(g, 22, 10, 1, 1, d); }
      R(g, 21, 4, 1, 1, '#0a2a2a');
    }));
    A.dancer = ['#3a6ab0', '#f0d040', '#f4f4f4', '#d84a3a', '#58b848', '#e88ab0', '#f4f4f4', '#3a6ab0'].map((col, n) => [0, 1].map(f => Art.spr(13, 20, g => {
      const skin = '#f0c8a0', leg = '#3a3040', hair = ['#e8c868', '#8a5a30', '#c88a48', '#f0dc98'][n % 4], dk = mix(col, '#101020', 0.3), o = f ? 3 : 0; // crouched on the off-beat
      R(g, 4, 2 + o, 5, 5, skin); R(g, 4, 1 + o, 5, 2, hair); R(g, 3, 2 + o, 1, 4, hair); R(g, 9, 2 + o, 1, 4, hair);
      R(g, 3, 1 + o, 7, 1, '#4ea848'); R(g, 4, 0 + o, 1, 1, '#ffe060'); R(g, 6, 0 + o, 1, 1, '#ff6a8a'); R(g, 8, 0 + o, 1, 1, '#ffffff'); // midsummer crown
      R(g, 6, 4 + o, 1, 1, '#3a2a30'); R(g, 8, 4 + o, 1, 1, '#3a2a30');
      R(g, 3, 7 + o, 7, 6, col); R(g, 3, 12 + o, 7, 1, dk); R(g, 9, 7 + o, 1, 6, dk);
      if (n % 2) R(g, 2, 12 + o, 9, 2, col); // a skirt
      if (f) { R(g, 2, 3, 1, 5, skin); R(g, 10, 3, 1, 5, skin); R(g, 1, 2, 2, 2, skin); R(g, 10, 2, 2, 2, skin); R(g, 3, 16, 3, 2, leg); R(g, 7, 16, 3, 2, leg); R(g, 2, 18, 3, 2, leg); R(g, 8, 18, 3, 2, leg); } // hands for ears, knees out
      else { R(g, 2, 8, 1, 5, skin); R(g, 10, 8, 1, 5, skin); R(g, 4, 14, 2, 5, leg); R(g, 7, 14, 2, 5, leg); R(g, 4, 19, 3, 1, leg); R(g, 7, 19, 3, 1, leg); }
    })));
    // a midsummer pole: birch-leaf and flowers, a cross-beam, two wreaths
    A.pole = Art.spr(54, 104, g => {
      const lf = '#4ea848', lf2 = '#2f8a3a', lf3 = '#86d86a', r = rng(61);
      R(g, 25, 6, 4, 98, '#e8dcc0'); R(g, 28, 6, 1, 98, '#b8a888');
      for (let y = 6; y < 102; y++) { const sw = Math.round(Math.sin(y * 0.55) * 2); R(g, 25 + sw, y, 3, 1, y % 3 ? lf : lf2); if (y % 7 === 0) R(g, 26 + sw, y, 1, 1, ['#ffe060', '#ff6a8a', '#ffffff'][y / 7 % 3 | 0]); }
      R(g, 5, 26, 44, 3, '#e8dcc0'); for (let x = 5; x < 49; x++) { R(g, x, 25 + (x % 3 === 0), 1, 2, x % 2 ? lf : lf2); if (x % 6 === 2) R(g, x, 25, 1, 1, ['#ffe060', '#ff6a8a', '#ffffff'][x / 6 % 3 | 0]); }
      for (const cx of [10, 43]) for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; R(g, cx + Math.cos(a) * 6.5, 37 + Math.sin(a) * 7.5, 2, 2, i % 3 ? lf : i % 2 ? lf3 : lf2); if (i % 5 === 0) R(g, cx + Math.cos(a) * 6.5, 37 + Math.sin(a) * 7.5, 1, 1, i % 2 ? '#ffe060' : '#ff6a8a'); }
      for (const cx of [10, 43]) { R(g, cx, 28, 1, 3, '#b8a888'); R(g, cx + 1, 28, 1, 3, '#b8a888'); }
      for (let i = 0; i < 14; i++) R(g, 21 + r() * 12, 1 + r() * 8, 2, 2, i % 3 ? lf : lf3); R(g, 26, 0, 2, 2, '#ffe060');
      R(g, 29, 9, 12, 7, '#2a5aa8'); R(g, 32, 9, 2, 7, '#ffd840'); R(g, 29, 12, 12, 2, '#ffd840');
    });
    // a natural arch: two piers and the span the wind left between them
    A.arch = Art.spr(140, 96, g => {
      const body = '#b0522e', lit = '#e89a5c', sh = '#84361e', str = '#c86c40';
      for (let x = 0; x < 140; x++) {
        const k = x / 139, top = Math.round(8 + 5 * Math.sin(k * 9 + 1) + 2 * Math.sin(k * 31) + 22 * Math.pow(Math.abs(k - 0.48) * 2, 4));
        const hx = (x - 66) / 40, hole = Math.abs(hx) < 1 ? Math.round(Math.sqrt(1 - hx * hx) * 66 * (1 - 0.12 * hx)) : 0, bot = hole ? 96 - hole : 96;
        if (bot <= top + 3) continue;
        R(g, x, top, 1, bot - top, body);
        for (let y = top + 6; y < bot; y += 7) R(g, x, y + ((x * 5 >> 4) & 1), 1, 1, (y / 7 | 0) % 2 ? str : sh);
        R(g, x, top, 1, 2, lit);
        if (hole) { R(g, x, bot - 3, 1, 3, sh); R(g, x, bot - 1, 1, 1, '#5e2414'); }
        if (k < 0.1) R(g, x, top + 2, 1, bot - top - 2, mix(body, sh, 1 - k * 10));
      }
      for (let y = 30; y < 96; y++) { // the faces that look into the opening catch the light
        const hy = (96 - y) / 66; if (hy >= 1) continue; const hw = Math.sqrt(1 - hy * hy) * 40;
        R(g, Math.round(66 - hw) - 2, y, 2, 1, sh); R(g, Math.round(66 + hw) + 1, y, 2, 1, lit);
      }
    });
    // a stone king: a robe, a crown, and one hand held out for something
    A.king = Art.spr(48, 112, g => {
      const b = '#3c3240', d = '#241c26', l = '#5c505c', hi = '#807480';
      R(g, 0, 104, 36, 8, d); R(g, 2, 98, 32, 6, b); R(g, 2, 98, 32, 1, l); R(g, 0, 104, 36, 1, l);
      for (let y = 38; y < 98; y++) { const wd = 16 + Math.round((y - 38) * 0.2); R(g, 17 - (wd >> 1), y, wd, 1, b); R(g, 17 - (wd >> 1), y, 2, 1, l); R(g, 17 + (wd >> 1) - 3, y, 3, 1, d); }
      for (const x of [11, 16, 22]) R(g, x, 52, 1, 44, d);
      R(g, 5, 30, 24, 9, b); R(g, 5, 30, 24, 1, hi); R(g, 5, 30, 2, 9, l); R(g, 26, 31, 3, 8, d);
      R(g, 11, 14, 12, 16, b); R(g, 11, 14, 2, 16, l); R(g, 21, 15, 2, 15, d); R(g, 17, 20, 5, 2, '#120c12'); R(g, 16, 26, 6, 1, d); R(g, 22, 22, 2, 3, b);
      R(g, 9, 10, 16, 4, l); R(g, 9, 10, 16, 1, hi); for (const [x, h] of [[9, 6], [13, 4], [17, 9], [21, 4], [24, 6]]) { R(g, x, 10 - h, 1, h, l); R(g, x, 10 - h, 1, 1, hi); }
      R(g, 27, 34, 13, 6, b); R(g, 27, 34, 13, 1, hi); R(g, 27, 39, 13, 1, d);
      R(g, 38, 32, 9, 3, b); R(g, 38, 32, 9, 1, hi); for (const x of [39, 41, 43, 45]) R(g, x, 30, 1, 2, b); R(g, 47, 30, 1, 4, b);
      R(g, 8, 60, 1, 7, d); R(g, 9, 66, 2, 1, d); R(g, 24, 74, 1, 9, d); R(g, 14, 44, 3, 1, d); R(g, 13, 90, 6, 1, l);
    });
  }
  return { get A() { if (!A) build(); return A; } };
})();

const WONDER_RANGE = { fox: 64, frogs: 76, undersky: 150, whale: 96, arch: 76, kings: 96, cross: 120 };
ENT.wonder = {
  lit: true,
  init(e) { e.def = WONDER_BY_ID[e.wonder]; e.cx = e.x; e.gy = e.y; e.w = 280; e.h = 140; e.x -= 140; e.y -= 140; e.seen = !!Game.wonders[e.def.id]; e.k = e.seen ? 1 : 0; e.t0 = 0; e.ph = -1; e.cool = 0; e.glow = 0; },
  update(w, e) {
    const p = nearP(w, e), id = e.def.id, dx = p.x + 5 - e.cx;
    const near = !p.dead && Math.abs(dx) < WONDER_RANGE[id] && Math.abs(p.y + p.h - e.gy) < 120;
    e.t0++;
    if (!e.seen && near && w.state === 'play' && w.introT <= 0 && !w.fight && (id !== 'undersky' || p.lit)) { e.seen = true; e.t0 = 0; World.wonder(e.def, e.cx, e.gy - 44); }
    if (e.seen && e.k < 1) e.k = Math.min(1, e.k + 0.012);
    if (Math.abs(dx) > 420 && id !== 'whale') return;
    if (id === 'fox' && e.seen) {
      w.litHold = 1; // the whole sky answers
      const f = this.fox(e);
      if (f && w.t % 2 === 0) w.parts.push({ x: f.x - 10, y: f.y + 2 + rand(-2, 2), vx: rand(-0.5, 0), vy: rand(-0.9, -0.2), life: rand(30, 60), col: ['#7affc8', '#bfffe8', '#b89aff'][w.t / 2 % 3 | 0], glow: 1, sz: 1 + (w.t % 4 === 0) });
    } else if (id === 'frogs') {
      if (Math.abs(dx) < 150 && e.t0 % 46 === 0) w.parts.push({ x: e.cx + rand(-26, 26), y: e.gy - 22, vx: rand(-0.2, 0.2), vy: -0.35, life: 70, max: 70, img: WonderArt.A.note });
    } else if (id === 'undersky') {
      e.glow = lerp(e.glow, p.lit && Math.abs(dx) < 190 ? 1 : e.seen ? 0.42 : 0.1, 0.05);
    } else if (id === 'whale') {
      if (e.cool > 0) e.cool--;
      if (e.ph < 0 && near && e.cool <= 0 && e.seen) { e.ph = 0; e.wx = p.x + 60; }
      if (e.ph >= 0) {
        e.ph += 1 / 460; e.wx = lerp(e.wx, p.x + 52, 0.035);
        const surf = e.gy + 21;
        if (e.ph > 0.2 && e.ph < 0.3) { if (e.ph - 1 / 460 <= 0.2) Sound.sfx('glide'); for (let i = 0; i < 2; i++) w.parts.push({ x: e.wx + 24 + rand(-1, 1), y: surf - 20, vx: rand(-0.5, 0.5), vy: rand(-3, -1.6), g: 0.09, life: rand(26, 44), col: i ? '#eaf8ff' : '#ffffff', sz: 2 }); }
        if (e.ph >= 1) { e.ph = -1; e.cool = 500; for (let i = 0; i < 10; i++) w.parts.push({ x: e.wx - 44 + rand(-6, 6), y: surf, vx: rand(-1.2, 1.2), vy: rand(-2.4, -0.8), g: 0.12, life: 30, col: '#eaf8ff', sz: 2 }); }
      }
    }
  },
  fox(e) { // where the fox is on its run across the sky, or null while it rests
    const k = (e.t0 % 560) / 380;
    if (k > 1) return null;
    return { x: e.cx - 190 + k * 380, y: e.gy - 70 - Math.sin(k * Math.PI) * 26 + Math.sin(e.t0 * 0.3) * 1.5, k };
  },
  // drawn behind the land and the water
  back(c, w, e, ox, oy) {
    const A = WonderArt.A, id = e.def.id, X = Math.round(e.cx - ox), Y = Math.round(e.gy - oy), t = w.t;
    if ((X < -260 || X > W + 260) && id !== 'cross' && id !== 'whale') return;
    if (id === 'arch') {
      Art.glow(c, X, Y - 34, 46 + 8 * e.k + Math.sin(t * 0.04) * 3, '#fff0b0', 0.25 + 0.4 * e.k);
      c.drawImage(A.arch, X - 66, Y - 95);
    } else if (id === 'kings') {
      c.drawImage(A.king, X - 104, Y - 111);
      c.save(); c.translate(X + 104, 0); c.scale(-1, 1); c.drawImage(A.king, 0, Y - 111); c.restore();
      if (e.k > 0) for (const sx of [-1, 1]) Art.glow(c, X + sx * 62, Y - 80, 5 + 2 * Math.sin(t * 0.1), '#ff7a20', 0.5 * e.k); // something has been left in each hand: a coal
    } else if (id === 'frogs') {
      const ring = (front) => {
        for (let i = 0; i < 8; i++) {
          const a = t * 0.016 + i * TAU / 8, s = Math.sin(a); if ((s >= 0) !== front) continue;
          const hop = Math.abs(Math.sin(t * 0.13 + i * 0.8)), f = hop < 0.3 ? 1 : 0, img = A.dancer[i][f];
          Art.blit(c, img, X + Math.cos(a) * 46 - 6, Y - 20 - Math.round(hop * 7) + Math.round(s * 2) + 1, Math.cos(a + Math.PI / 2) < 0);
        }
      };
      ring(false); c.drawImage(A.pole, X - 27, Y - 103); ring(true);
    } else if (id === 'fox') {
      const f = e.seen ? this.fox(e) : null;
      if (f) { const fx = Math.round(f.x - ox), fy = Math.round(f.y - oy); Art.glow(c, fx, fy + 6, 20, '#7affc8', 0.5 * e.k); c.globalAlpha = e.k; c.drawImage(A.fox[(t >> 3) % 2], fx - 13, fy); c.globalAlpha = 1; }
      else if (!e.seen) { const b = 0.4 + 0.3 * Math.sin(t * 0.08); R(c, X - 2, Y - 86, 1, 1, `rgba(190,255,230,${b})`); R(c, X + 9, Y - 92, 1, 1, `rgba(190,255,230,${b * 0.7})`); } // a glint, high over the hill
    } else if (id === 'cross') {
      const sx = Math.round((e.cx - ox - W / 2) * 0.22 + W / 2), sy = 52 + Math.round((e.gy - oy - 150) * 0.1), k = e.k;
      if (sx < -60 || sx > W + 60) return;
      const stars = [[0, -13, 2, '#ffc8a8'], [1, 13, 3, '#eaf2ff'], [-9, 1, 3, '#dfe8ff'], [8, -3, 2, '#eaf2ff'], [4, 5, 1, '#c8d4ff'], [-36, 7, 3, '#fff4d8'], [-25, 3, 2, '#dfe8ff']];
      if (k > 0) { c.fillStyle = `rgba(223,242,255,${0.28 * k})`; c.fillRect(sx, sy - 13, 1, 26); for (let i = -9; i <= 8; i++) c.fillRect(sx + i, sy + 1 - Math.round((i + 9) * 4 / 17), 1, 1); }
      stars.forEach(([x, y, r, col], i) => {
        const tw = 0.7 + 0.3 * Math.sin(t * 0.07 + i * 1.7), a = (0.45 + 0.55 * k) * tw;
        Art.glow(c, sx + x, sy + y, r * 3 + 2 * k, col, 0.5 * a);
        c.globalAlpha = a; R(c, sx + x, sy + y, 1, 1, '#ffffff');
        if (r > 1) { R(c, sx + x - 1, sy + y, 3, 1, col); R(c, sx + x, sy + y - 1, 1, 3, col); }
        if (r > 2 && k > 0.5) { R(c, sx + x - 2, sy + y, 5, 1, col); R(c, sx + x, sy + y - 2, 1, 5, col); R(c, sx + x, sy + y, 1, 1, '#ffffff'); }
        c.globalAlpha = 1;
      });
    } else if (id === 'whale' && e.ph >= 0) {
      const ph = e.ph, rise = Math.pow(Math.sin(Math.min(1, ph / 0.82) * Math.PI), 0.55), wx = Math.round(e.wx - ox), S = Y + 21, L = 66, Hh = 21 * rise;
      const body = '#2c4a6a', hi = '#7aa2c4', pale = '#c4d8e6';
      for (let x = -L; x <= L; x++) {
        const u = x / L, h = Math.round(Math.pow(1 - u * u, 0.6) * (1 + 0.24 * u) * Hh);
        if (h <= 0) continue;
        R(c, wx + x, S - h, 1, h + 10, body); R(c, wx + x, S - h, 1, h > 6 ? 2 : 1, hi);
        if (h > 9 && (x * 7 + 3) % 13 === 0) R(c, wx + x, S - h + 4 + (x & 3), 1, 1, '#e4f0f6'); // barnacles
        if (x > 12 && h > 4) { const j = Math.min(h - 2, 3 + Math.round((x - 12) * 0.12)); R(c, wx + x, S - j, 1, j + 2, x % 4 ? pale : '#8fb0c8'); R(c, wx + x, S - j - 1, 1, 1, '#16304a'); } // the pale pleated throat, and the line of the jaw
      }
      if (rise > 0.6) { const ex = wx + 34, ey = S - Math.round(Hh * 0.52); R(c, ex - 2, ey - 2, 6, 5, '#1c3450'); R(c, ex - 1, ey - 1, 4, 3, '#0a1420'); R(c, ex, ey - 1, 1, 1, '#ffffff'); R(c, ex - 2, ey + 3, 6, 1, hi); }
      if (rise > 0.3) { R(c, wx - 26, S - Math.round(Hh * 0.9) - 3, 7, 3, body); R(c, wx - 24, S - Math.round(Hh * 0.9) - 5, 4, 2, body); R(c, wx - 24, S - Math.round(Hh * 0.9) - 5, 4, 1, hi); }
      if (ph > 0.74) { // the flukes, last
        const fk = (ph - 0.74) / 0.26, th = Math.round(Math.sin(fk * Math.PI) * 30), tx = wx - 56;
        if (th > 2) {
          R(c, tx - 2, S - th, 5, th + 8, '#2c4a6a'); R(c, tx - 2, S - th, 1, th, '#7aa2c4');
          for (let i = 0; i < 13; i++) { const hh = Math.max(1, Math.round(5 - i * 0.36)); R(c, tx - 1 - i, S - th - 2 - Math.round(i * 0.45), 1, hh, '#2c4a6a'); R(c, tx + 1 + i, S - th - 2 - Math.round(i * 0.45), 1, hh, '#3a5c7e'); R(c, tx - 1 - i, S - th - 2 - Math.round(i * 0.45), 1, 1, '#7aa2c4'); }
        }
      }
    }
  },
  // drawn above the dark
  draw(c, w, e, ox, oy) {
    if (e.def.id !== 'undersky') return;
    if (!e.stars) { // ore crystals set in the roof; three of the constellations have names
      const r = rng(1917); e.stars = []; e.lines = [];
      const roofY = cx => { cx = clamp(cx, 0, w.cols - 1); let cy = 0; while (cy < w.rows - 1 && w.grid[cy][cx] === '#') cy++; return cy * T; };
      for (let i = 0; i < 64; i++) { const x = e.cx - 200 + r() * 400, base = roofY(Math.floor(x / T)); e.stars.push({ x, y: base + 3 + r() * r() * 46, b: 0.4 + r() * 0.6, c: r() < 0.2 ? '#ffd0a0' : r() < 0.5 ? '#bfe4ff' : '#ffffff' }); }
      const con = (pts) => { const base = e.stars.length; pts.forEach(([x, y]) => e.stars.push({ x: e.cx + x, y: roofY(Math.floor((e.cx + x) / T)) + y, b: 1, c: '#ffffff', big: 1 })); for (let i = 1; i < pts.length; i++) e.lines.push([base + i - 1, base + i]); };
      con([[-150, 40], [-128, 26], [-112, 12], [-120, 8], [-104, 16]]); // the Pick
      con([[-34, 22], [-14, 16], [8, 20], [14, 36], [-6, 44], [-28, 38], [-34, 22]]); // the Kettle
      con([[84, 14], [104, 30], [128, 22], [150, 40]]); // the Late Shift
    }
    const g = e.glow, t = w.t;
    if (g > 0.3) { c.fillStyle = `rgba(191,228,255,${(g - 0.3) * 0.5})`; for (const [a, b] of e.lines) { const p = e.stars[a], q = e.stars[b], n = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y)); for (let i = 0; i <= n; i += 2) c.fillRect(Math.round(p.x + (q.x - p.x) * i / n - ox), Math.round(p.y + (q.y - p.y) * i / n - oy), 1, 1); } }
    e.stars.forEach((s, i) => {
      const x = Math.round(s.x - ox), y = Math.round(s.y - oy); if (x < -4 || x > W + 4) return;
      const a = clamp(g * s.b * (0.75 + 0.25 * Math.sin(t * 0.06 + i * 2.3)), 0, 1);
      c.globalAlpha = a; R(c, x, y, 1, 1, s.c);
      if (s.big && g > 0.3) { R(c, x - 1, y, 3, 1, s.c); R(c, x, y - 1, 1, 3, s.c); }
      c.globalAlpha = 1;
      if (s.big && g > 0.5) Art.glow(c, x, y, 5, '#bfe4ff', 0.35 * g);
    });
  }
};

/* ----- the tear in the afternoon: a seam in the air that only opens to starlight ----- */
ENT.warp = {
  lit: true,
  init(e) { e.w = 16; e.h = 46; e.x -= 8; e.y -= 48; e.p = 0; },
  update(w, e) {
    const p = nearP(w, e), near = !p.dead && Math.abs(p.x + 5 - (e.x + 8)) < 60 && Math.abs(p.y + p.h - (e.y + 48)) < 50;
    if (near && p.lit && !w.warpFx && w.state === 'play') {
      if (e.p === 0) Sound.sfx('bridge');
      e.p = Math.min(64, e.p + 1);
      if (w.t % 5 === 0) World.sparkle(e.x + 8 + rand(-8, 8), e.y + rand(46), '#dff2ff', 2);
      if (e.p >= 64) { e.p = 0; World.warp(e.to); }
    } else if (e.p > 0) e.p = Math.max(0, e.p - 0.6);
  },
  draw(c, w, e, ox, oy) {
    const k = e.p / 64, cx = Math.round(e.x - ox + 8), cy = Math.round(e.y - oy + 23), t = w.t;
    const sky = e.to === 'ozArrive' ? ['#243c80', '#c8a0b4', '#ffe6a8'] : ['#5a2a64', '#ee7a4a', '#ffe08a'];
    Art.glow(c, cx, cy, 20 + 26 * k + Math.sin(t * 0.08) * 2, '#dff2ff', 0.35 + 0.4 * k);
    for (let y = -22; y <= 22; y++) {
      const u = y / 22, hw = (1 + k * 15) * Math.sqrt(1 - u * u) + Math.sin(t * 0.11 + y * 0.45) * (0.9 - 0.5 * k), n = Math.round(hw);
      if (n >= 1) R(c, cx - n, cy + y, n * 2, 1, u < 0 ? mix(sky[0], sky[1], u + 1) : mix(sky[1], sky[2], u));
      R(c, cx - n - 1, cy + y, 1, 1, '#ffffff'); R(c, cx + n, cy + y, 1, 1, '#ffffff');
    }
    if (k > 0.4 && e.to === 'ozArrive') { R(c, cx - 5, cy + 12, 10, 4, '#d8603a'); R(c, cx - 3, cy + 10, 6, 2, '#d8603a'); } // through it: one red rock
    if (k > 0.4 && e.to !== 'ozArrive') { R(c, cx - 7, cy + 11, 5, 6, '#6e3a5c'); R(c, cx + 1, cy + 8, 6, 9, '#6e3a5c'); }
    for (let i = 0; i < 12; i++) { // the hours, going round the wrong way
      const a = -t * 0.02 + i * TAU / 12, r = 15 + 14 * k;
      R(c, cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 1.5, 1, i % 3 ? 1 : 2, `rgba(223,242,255,${0.35 + 0.5 * k})`);
    }
  },
  light() { return 46; }
};
