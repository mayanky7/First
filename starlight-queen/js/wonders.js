'use strict';
/* Starlight Queen — wonders (things worth stopping for) and the tear in the afternoon */
const WONDERS = [
  { id: 'fox', where: 'Finland', name: 'The Fox Fires', line: 'A fox runs over the fells, and its tail strikes sparks from the snow.' },
  { id: 'frogs', where: 'Sweden', name: 'Små grodorna', line: 'Adults, hopping like frogs round a pole. Nobody is embarrassed.' },
  { id: 'undersky', where: 'Kiruna', name: 'The Under-Sky', line: 'Ore in the roof of the mine, catching her light.' },
  { id: 'whale', where: 'the sea', name: 'A Whale', line: 'It looks at her with one eye, and finds nothing to object to.' },
  { id: 'arch', where: 'America', name: 'The Window', line: 'Water did this, and frost, and time.' },
  { id: 'kings', where: 'the Mesa', name: 'The Stone Kings', line: 'Each with a hand held out. Whoever carved them had met a king.' },
  { id: 'cross', where: 'Australia', name: 'The Southern Cross', line: 'Stars she has never seen. Nothing bad has come of it.' }
];
const WONDER_BY_ID = {}; WONDERS.forEach((q, i) => { q.n = i; WONDER_BY_ID[q.id] = q; });

const WONDER_RANGE = { fox: 64, frogs: 76, undersky: 150, whale: 96, arch: 76, kings: 230, cross: 120 };
const DANCERS = ['#3a6ab0', '#f0d040', '#f4f4f4', '#d84a3a', '#58b848', '#e88ab0', '#f4f4f4', '#3a6ab0'].map((col, i) => ({ tunic: col, tunicD: mix(col, '#101028', 0.28), belt: '#ffffff', cloak: null, hair: ['#e8c868', '#8a5a30', '#c88a48', '#f0dc98'][i % 4], hairD: ['#c8a040', '#6a4020', '#a06a30', '#d0b870'][i % 4], skin: '#f6d4b4', leg: '#3a3048', boot: '#5a3b28', band: '#4ea848', hem: i % 2 ? -5 : -7, long: i % 2 }));
ENT.wonder = {
  lit: true,
  init(e) { e.def = WONDER_BY_ID[e.wonder]; e.cx = e.x; e.gy = e.y; e.w = 460; e.h = 140; e.x -= 230; e.y -= 140; e.seen = !!Game.wonders[e.def.id]; e.k = e.seen ? 1 : 0; e.t0 = 0; e.ph = -1; e.cool = 0; e.glow = 0; e.trail = []; },
  update(w, e) {
    const p = nearP(w, e), id = e.def.id, dx = p.x + 5 - e.cx;
    const near = !p.dead && Math.abs(dx) < WONDER_RANGE[id] && Math.abs(p.y + p.h - e.gy) < 120;
    e.t0++;
    if (!e.seen && near && w.state === 'play' && !w.fight && !w.wonderCard && w.introT <= 0 && (id !== 'undersky' || p.lit)) { e.seen = true; e.t0 = 0; World.wonder(e.def, e.cx, e.gy - 44); }
    if (e.seen && e.k < 1) e.k = Math.min(1, e.k + 0.012);
    if (Math.abs(dx) > 420 && id !== 'whale') return;
    if (id === 'fox' && e.seen) {
      w.litHold = 1; // the whole sky answers
      const f = this.fox(e);
      if (f) { e.trail.push([f.x - 12, f.y - 3]); if (e.trail.length > 70) e.trail.shift(); if (w.t % 3 === 0) w.parts.push({ x: f.x - 14, y: f.y - 2 + rand(-2, 2), vx: rand(-0.5, 0), vy: rand(-0.7, -0.1), life: rand(30, 60), max: 60, col: ['#7affc8', '#bfffe8', '#b89aff'][w.t / 3 % 3 | 0], glow: 1, sz: 1.2 }); }
      else if (e.trail.length) e.trail.shift();
    } else if (id === 'frogs') {
      if (Math.abs(dx) < 150 && e.t0 % 46 === 0) w.parts.push({ x: e.cx + rand(-30, 30), y: e.gy - 26, vx: rand(-0.2, 0.2), vy: -0.35, life: 70, max: 70, draw(c, x, y, q) { Paint.note(c, x, y, Math.min(1, q.life / 20)); } });
    } else if (id === 'undersky') {
      e.glow = lerp(e.glow, p.lit && Math.abs(dx) < 190 ? 1 : e.seen ? 0.42 : 0.1, 0.05);
    } else if (id === 'whale') {
      if (e.cool > 0) e.cool--;
      const tx = clamp(p.x + 112, e.cx - 200, e.cx + 250);
      if (e.ph < 0 && near && e.cool <= 0 && e.seen) { e.ph = 0; e.wx = tx; }
      if (e.ph >= 0) {
        e.ph += 1 / 520; e.wx = lerp(e.wx, tx, 0.03);
        const surf = e.gy + 21;
        if (e.ph > 0.2 && e.ph < 0.3) { if (e.ph - 1 / 520 <= 0.2) Sound.sfx('glide'); for (let i = 0; i < 2; i++) w.parts.push({ x: e.wx + 30 + rand(-1, 1), y: surf - 26, vx: rand(-0.5, 0.5), vy: rand(-3, -1.6), g: 0.09, life: rand(26, 44), max: 44, col: i ? '#eaf8ff' : '#ffffff', sz: 1.6 }); }
        if (e.ph >= 1) { e.ph = -1; e.cool = 500; for (let i = 0; i < 10; i++) w.parts.push({ x: e.wx - 60 + rand(-6, 6), y: surf, vx: rand(-1.2, 1.2), vy: rand(-2.4, -0.8), g: 0.12, life: 30, max: 30, col: '#eaf8ff', sz: 1.6 }); }
      }
    }
  },
  fox(e) { // where the fox is on its run across the sky, or null while it rests
    const k = (e.t0 % 600) / 420;
    if (k > 1) return null;
    return { x: e.cx - 210 + k * 420, y: e.gy - 52 - Math.sin(k * Math.PI) * 24 + Math.sin(e.t0 * 0.25) * 1.2, k };
  },
  // drawn behind the land and the water
  back(c, w, e, ox, oy) {
    const id = e.def.id, X = e.cx - ox, Y = e.gy - oy, t = w.t, { soft, disc, rr, vgrad, star4, stamp } = Paint;
    if ((X < -280 || X > W + 280) && id !== 'cross' && id !== 'whale') return;
    if (id === 'arch') {
      soft(c, X, Y - 36, 50 + 8 * e.k + Math.sin(t * 0.04) * 3, '#fff0b0', 0.22 + 0.4 * e.k);
      stamp(c, 'w:arch', 150, 100, X - 75, Y - 99.4, g => { // two piers and the span the weather left between them
        const p = new Path2D(); p.moveTo(2, 100); p.quadraticCurveTo(6, 40, 20, 22); p.quadraticCurveTo(40, 4, 78, 6); p.quadraticCurveTo(118, 4, 134, 24); p.quadraticCurveTo(146, 44, 148, 100); p.lineTo(114, 100); p.quadraticCurveTo(116, 34, 74, 30); p.quadraticCurveTo(36, 34, 34, 100); p.closePath();
        g.fillStyle = vgrad(g, 0, 100, ['#e09066', '#b85c40', '#7a3230']); g.fill(p);
        g.save(); g.clip(p); g.strokeStyle = 'rgba(90,30,30,0.28)'; g.lineWidth = 1.1; for (let y = 14; y < 100; y += 9) { g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(75, y - 5 + (y % 4), 150, y + 2); g.stroke(); }
        g.fillStyle = 'rgba(255,220,170,0.3)'; g.beginPath(); g.moveTo(114, 100); g.quadraticCurveTo(116, 34, 74, 30); g.lineTo(78, 26); g.quadraticCurveTo(122, 30, 120, 100); g.fill(); // the face that looks at the sun
        g.fillStyle = 'rgba(40,10,30,0.3)'; g.beginPath(); g.moveTo(2, 100); g.quadraticCurveTo(6, 40, 20, 22); g.lineTo(26, 26); g.quadraticCurveTo(14, 44, 12, 100); g.fill(); g.restore();
      });
    } else if (id === 'kings') {
      const king = g => { // a robe, a crown, a beard, and one hand held out for something
        g.fillStyle = vgrad(g, 0, 118, ['#5e5264', '#33293a', '#1c141f']);
        g.beginPath(); rr(g, 0, 108, 40, 10, 1.6); rr(g, 3, 101, 34, 8, 1.4);
        g.moveTo(8, 102); g.quadraticCurveTo(9, 60, 12, 38); g.quadraticCurveTo(6, 36, 7, 30); g.quadraticCurveTo(14, 25, 20, 26); g.quadraticCurveTo(27, 25, 33, 30); g.quadraticCurveTo(34, 36, 28, 38); g.quadraticCurveTo(31, 60, 32, 102); g.closePath();
        g.moveTo(26, 20); g.arc(20, 20, 6.4, 0, TAU);
        g.moveTo(12.6, 15.6); g.lineTo(13, 6); g.lineTo(15.6, 11.6); g.lineTo(17.6, 3); g.lineTo(20, 10.6); g.lineTo(22.4, 3); g.lineTo(24.4, 11.6); g.lineTo(27, 6); g.lineTo(27.4, 15.6); g.closePath();
        g.moveTo(15.6, 23); g.quadraticCurveTo(20, 36, 24.6, 23); g.closePath(); // beard
        g.moveTo(30, 31); g.lineTo(45, 33); g.lineTo(45, 37.6); g.quadraticCurveTo(38, 37, 36, 52); g.quadraticCurveTo(33, 42, 29, 39); g.closePath(); // the sleeve, and its drape
        g.moveTo(44, 33); g.lineTo(53, 31.6); g.lineTo(54, 29); g.lineTo(55, 31.6); g.lineTo(55, 35.4); g.lineTo(44, 37); g.closePath(); // the open hand
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.09)'; g.beginPath(); g.moveTo(8, 102); g.quadraticCurveTo(9, 60, 12, 38); g.lineTo(15, 38); g.quadraticCurveTo(12, 60, 12, 102); g.closePath(); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); rr(g, 16.4, 18, 7.4, 1.5, 0.7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.6; g.beginPath(); for (const x of [15, 20, 25]) { g.moveTo(x, 50); g.lineTo(x + (x - 20) * 0.3, 100); } g.stroke();
      };
      stamp(c, 'w:king', 56, 118, X - 108, Y - 117.4, king); stamp(c, 'w:king', 56, 118, X + 52, Y - 117.4, king, true);
      if (e.k > 0) for (const sx of [-1, 1]) { soft(c, X + sx * 58, Y - 88, 7 + 2 * Math.sin(t * 0.1), '#ff7a20', 0.55 * e.k); disc(c, X + sx * 58, Y - 87.6, 1, '#ffb060'); } // something has been left in each hand: a coal
    } else if (id === 'frogs') {
      const ring = (front) => {
        for (let i = 0; i < 8; i++) {
          const a = t * 0.016 + i * TAU / 8, sn = Math.sin(a); if ((sn >= 0) !== front) continue;
          const hop = Math.abs(Math.sin(t * 0.13 + i * 0.8)), crouch = hop < 0.3;
          Paint.figure(c, X + Math.cos(a) * 46, Y - hop * 7 + sn * 2 + 1, { face: -Math.sin(a) < 0 ? -1 : 1, t: t + i * 9, inAir: !crouch, air: crouch ? 0 : -2, raise: crouch, sq: crouch ? 0.8 : 1, scale: 0.86 }, DANCERS[i]);
        }
      };
      ring(false);
      stamp(c, 'w:pole', 60, 110, X - 30, Y - 109.4, g => { // a midsummer pole: birch-leaf and flowers, a cross-beam, two wreaths
        const lf = '#4ea848', lf2 = '#2f8a3a', fl = ['#ffe36a', '#ff8aa8', '#ffffff'];
        g.fillStyle = '#efe6cc'; g.fillRect(28, 8, 4, 102); g.fillRect(8, 27.6, 44, 3.2);
        g.strokeStyle = lf; g.lineWidth = 2; g.beginPath(); for (let y = 8; y < 108; y += 6) { g.moveTo(28, y); g.quadraticCurveTo(32.6, y + 2, 28, y + 6); } g.stroke();
        g.strokeStyle = lf2; g.lineWidth = 1.6; g.beginPath(); g.moveTo(8, 28.4); g.lineTo(52, 28.4); g.stroke();
        for (const cx of [13, 47]) { g.strokeStyle = lf; g.lineWidth = 2.2; g.beginPath(); g.ellipse(cx, 39, 6.4, 7.6, 0, 0, TAU); g.stroke(); g.strokeStyle = '#b8a888'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(cx, 30); g.lineTo(cx, 31.6); g.stroke(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; disc(g, cx + Math.cos(a) * 6.4, 39 + Math.sin(a) * 7.6, 0.9, fl[i % 3]); } }
        for (let i = 0; i < 9; i++) disc(g, 30, 12 + i * 11, 1, fl[i % 3]); for (let i = 0; i < 7; i++) disc(g, 11 + i * 6.4, 28.4, 0.9, fl[(i + 1) % 3]);
        g.fillStyle = lf; g.beginPath(); g.ellipse(30, 6, 5, 4, 0, 0, TAU); g.fill(); disc(g, 30, 3, 1.3, '#ffe36a');
        g.fillStyle = '#2a5aa8'; g.beginPath(); g.moveTo(31.4, 10); g.lineTo(44, 11.4); g.lineTo(42, 14.4); g.lineTo(44, 17.6); g.lineTo(31.4, 17); g.closePath(); g.fill(); g.fillStyle = '#ffd840'; g.fillRect(34.6, 10.4, 1.8, 6.8); g.fillRect(31.4, 12.9, 12, 1.6);
      });
      ring(true);
    } else if (id === 'fox') {
      const f = e.seen ? this.fox(e) : null;
      if (e.trail.length > 2) { // its tail strikes sparks from the snow: that is the aurora
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (let i = 1; i < e.trail.length; i++) { const k = i / e.trail.length; c.strokeStyle = `rgba(${Math.round(184 - 62 * k)},${Math.round(154 + 101 * k)},${Math.round(255 - 55 * k)},${0.5 * k * e.k})`; c.lineWidth = 0.6 + 2.6 * k; c.beginPath(); c.moveTo(e.trail[i - 1][0] - ox, e.trail[i - 1][1] - oy + Math.sin(i * 0.5 + t * 0.1) * 1.5); c.lineTo(e.trail[i][0] - ox, e.trail[i][1] - oy + Math.sin((i + 1) * 0.5 + t * 0.1) * 1.5); c.stroke(); }
        c.restore();
      }
      if (f) {
        const fx = f.x - ox, fy = f.y - oy, g = c, run = t * 0.45, st = Math.sin(run);
        soft(c, fx, fy, 34, '#7affc8', 0.45 * e.k);
        g.save(); g.translate(fx, fy); g.scale(1.5, 1.5); g.globalAlpha = e.k; g.rotate(Math.cos(f.k * Math.PI) * -0.25); g.lineCap = 'round';
        g.strokeStyle = '#bfeedd'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-5, 1.6); g.lineTo(-7.6 - st * 3.4, 6); g.moveTo(-3.4, 1.8); g.lineTo(-4 + st * 3, 6.4); g.moveTo(5, 1.6); g.lineTo(6.4 + st * 3.6, 6); g.moveTo(6.4, 1.4); g.lineTo(9.4 - st * 2.6, 5.8); g.stroke();
        g.fillStyle = '#f2fff8'; g.beginPath(); g.ellipse(0, 0, 8.4, 3, 0, 0, TAU); g.moveTo(6, -2.2); g.lineTo(13.6, -1.4 ); g.lineTo(16.4, 0.6); g.lineTo(11, 2); g.lineTo(6.4, 1.4); g.closePath(); g.moveTo(8.6, -2.4); g.lineTo(9.4, -6.4); g.lineTo(11.2, -2.6); g.closePath(); g.moveTo(10.6, -2.4); g.lineTo(12, -5.8); g.lineTo(13, -2); g.closePath();
        g.moveTo(-7, -1.6); g.quadraticCurveTo(-13, -4 + st, -18, -9 + st * 1.4); g.quadraticCurveTo(-21, -5 + st, -15.6, -1 + st * 0.6); g.quadraticCurveTo(-11, 1.6, -7, 1.6); g.closePath(); g.fill();
        disc(g, -18.4, -8.4 + st * 1.4, 1.5, '#ffffff'); disc(g, 12.6, -1.2, 0.5, '#0a2a2a');
        g.restore();
      } else if (!e.seen) { const b = 0.4 + 0.3 * Math.sin(t * 0.08); c.globalAlpha = b; star4(c, X - 2, Y - 84, 1.6, '#bfffe8', t * 0.03); c.globalAlpha = b * 0.7; star4(c, X + 10, Y - 92, 1.1, '#bfffe8'); c.globalAlpha = 1; } // a glint, high over the hill
    } else if (id === 'cross') {
      if (!w.zone || !w.zone.warp) return;
      const sx = (e.cx - ox - W / 2) * 0.22 + W / 2, sy = 46 + (e.gy - oy - 150) * 0.1, k = e.k, Z = 2.6;
      if (sx < -90 || sx > W + 90) return;
      if (k > 0) { c.fillStyle = vgrad(c, 0, 120, [`rgba(8,14,48,${0.66 * k})`, 'rgba(8,14,48,0)']); c.fillRect(0, 0, W, 120); const r = rng(9); c.fillStyle = '#dfe8ff'; for (let i = 0; i < 90; i++) { const u = r(), x = sx - 150 + u * 300 + (r() - 0.5) * 30, y = sy + 46 - u * 92 + (r() - 0.5) * 26; c.globalAlpha = 0.5 * k * r(); c.beginPath(); c.arc(x, y, 0.3 + r() * 0.3, 0, TAU); c.fill(); } c.globalAlpha = 1; } // the Milky Way, which runs through it
      const stars = [[0, -13, 2, '#ffc8a8'], [1, 13, 3, '#eaf2ff'], [-9, 1, 3, '#dfe8ff'], [8, -3, 2, '#eaf2ff'], [4, 5, 1, '#c8d4ff'], [-36, 7, 3, '#fff4d8'], [-25, 3, 2, '#dfe8ff']];
      if (k > 0) { c.strokeStyle = `rgba(223,242,255,${0.3 * k})`; c.lineWidth = 0.35; c.beginPath(); c.moveTo(sx, sy - 13 * Z); c.lineTo(sx + Z, sy + 13 * Z); c.moveTo(sx - 9 * Z, sy + Z); c.lineTo(sx + 8 * Z, sy - 3 * Z); c.stroke(); }
      stars.forEach(([x, y, r, col], i) => { const tw = 0.75 + 0.25 * Math.sin(t * 0.07 + i * 1.7), a = (0.4 + 0.6 * k) * tw; soft(c, sx + x * Z, sy + y * Z, r * 3 + 4 * k, col, 0.45 * a); c.globalAlpha = a; star4(c, sx + x * Z, sy + y * Z, 1 + r * (0.9 + 0.6 * k), col, 0); disc(c, sx + x * Z, sy + y * Z, 0.5, '#ffffff'); c.globalAlpha = 1; });
    } else if (id === 'whale' && e.ph >= 0) {
      const ph = e.ph, rise = Math.pow(Math.sin(Math.min(1, ph / 0.82) * Math.PI), 0.55), wx = e.wx - ox, S = Y + 21, L = 84, Hh = 40 * rise, g = c;
      if (Hh > 1) {
        g.fillStyle = vgrad(g, S - Hh, S + 10, ['#8a9cc4', '#5a6c9a', '#3a4a78']);
        g.beginPath(); g.moveTo(wx - L, S + 12); g.quadraticCurveTo(wx - L * 0.7, S - Hh * 0.8, wx - L * 0.1, S - Hh); g.quadraticCurveTo(wx + L * 0.62, S - Hh * 1.04, wx + L * 0.92, S - Hh * 0.34); g.quadraticCurveTo(wx + L * 1.04, S, wx + L, S + 12); g.closePath(); g.fill();
        g.save(); g.clip(); // the pale pleated throat, barnacles, an eye
        g.fillStyle = '#c9dcea'; g.beginPath(); g.moveTo(wx + L * 0.2, S + 12); g.quadraticCurveTo(wx + L * 0.5, S - Hh * 0.34, wx + L * 1.02, S - Hh * 0.2); g.lineTo(wx + L * 1.04, S + 12); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(40,70,100,0.5)'; g.lineWidth = 0.5; g.beginPath(); for (let i = 0; i < 7; i++) { g.moveTo(wx + L * (0.34 + i * 0.09), S + 12); g.quadraticCurveTo(wx + L * (0.5 + i * 0.08), S - Hh * 0.1, wx + L * (0.72 + i * 0.05), S - Hh * (0.24 - i * 0.02)); } g.stroke();
        g.strokeStyle = 'rgba(255,200,150,0.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(wx - L * 0.66, S - Hh * 0.66); g.quadraticCurveTo(wx, S - Hh * 1.02, wx + L * 0.6, S - Hh * 0.92); g.stroke();
        for (let i = 0; i < 9; i++) disc(g, wx - L * 0.5 + i * 13 + (i % 2) * 3, S - Hh * (0.5 + 0.3 * Math.sin(i * 2.1)), 0.6, 'rgba(230,240,246,0.7)');
        if (rise > 0.5) { const ex = wx + L * 0.62, ey = S - Hh * 0.5; disc(g, ex, ey, 2.6, '#16304a'); disc(g, ex, ey, 1.6, '#0a1420'); disc(g, ex - 0.5, ey - 0.6, 0.5, '#ffffff'); }
        g.restore();
        if (rise > 0.3) { g.fillStyle = '#5a6c9a'; g.beginPath(); g.moveTo(wx - L * 0.36, S - Hh * 0.9); g.quadraticCurveTo(wx - L * 0.3, S - Hh * 0.9 - 6, wx - L * 0.22, S - Hh * 0.97 - 2); g.lineTo(wx - L * 0.2, S - Hh * 0.96); g.closePath(); g.fill(); }
      }
      if (ph > 0.74) { // the flukes, last
        const fk = (ph - 0.74) / 0.26, th = Math.sin(fk * Math.PI) * 36, tx = wx - 62;
        if (th > 2) { g.fillStyle = vgrad(g, S - th - 8, S + 8, ['#8a9cc4', '#4a5a8a']); g.beginPath(); g.moveTo(tx - 3.4, S + 10); g.quadraticCurveTo(tx - 2, S - th * 0.6, tx - 1, S - th); g.quadraticCurveTo(tx - 9, S - th - 2, tx - 17, S - th - 9); g.quadraticCurveTo(tx - 8, S - th - 9.6, tx, S - th - 4.6); g.quadraticCurveTo(tx + 8, S - th - 9.6, tx + 17, S - th - 9); g.quadraticCurveTo(tx + 9, S - th - 2, tx + 1, S - th); g.quadraticCurveTo(tx + 2, S - th * 0.6, tx + 3.4, S + 10); g.closePath(); g.fill(); }
      }
    }
  },
  // drawn above the dark
  draw(c, w, e, ox, oy) {
    if (e.def.id !== 'undersky') return;
    if (!e.stars) { // ore crystals set in the roof; three of the constellations have names
      const r = rng(1917); e.stars = []; e.lines = [];
      const roofY = cx => { cx = clamp(cx, 0, w.cols - 1); let cy = 0; while (cy < w.rows - 1 && w.grid[cy][cx] === '#') cy++; return cy * T; };
      for (let i = 0; i < 150; i++) { const x = e.cx - 210 + r() * 420, base = roofY(Math.floor(x / T)); e.stars.push({ x, y: base - 1 - r() * r() * 26, b: 0.35 + r() * 0.65, c: r() < 0.2 ? '#ffd0a0' : r() < 0.5 ? '#bfe4ff' : '#ffffff', r: 0.3 + r() * 0.4 }); }
      const con = (name, pts) => { const base = e.stars.length; pts.forEach(([x, y]) => e.stars.push({ x: e.cx + x, y: roofY(Math.floor((e.cx + x) / T)) - 26 + y, b: 1, c: '#ffffff', big: 1, r: 0.8 })); for (let i = 1; i < pts.length; i++) e.lines.push([base + i - 1, base + i]); e.names = (e.names || []).concat([[name, e.cx + pts.reduce((a, q) => a + q[0], 0) / pts.length, base]]); };
      con('THE PICK', [[-150, 22], [-128, 12], [-112, 2], [-121, -1], [-103, 5]]);
      con('THE KETTLE', [[-30, 8], [-12, 3], [8, 6], [13, 17], [-4, 23], [-24, 19], [-30, 8]]);
      con('THE LATE SHIFT', [[84, 2], [104, 14], [128, 8], [150, 21]]);
    }
    const g = e.glow, t = w.t;
    if (g > 0.3) { c.strokeStyle = `rgba(191,228,255,${(g - 0.3) * 0.9})`; c.lineWidth = 0.4; c.beginPath(); for (const [a, b] of e.lines) { c.moveTo(e.stars[a].x - ox, e.stars[a].y - oy); c.lineTo(e.stars[b].x - ox, e.stars[b].y - oy); } c.stroke(); }
    e.stars.forEach((s, i) => {
      const x = s.x - ox, y = s.y - oy; if (x < -4 || x > W + 4) return;
      const a = clamp(g * s.b * (0.75 + 0.25 * Math.sin(t * 0.06 + i * 2.3)), 0, 1);
      c.globalAlpha = a;
      if (s.big) { if (g > 0.5) Paint.soft(c, x, y, 5, '#bfe4ff', 0.4 * g); Paint.star4(c, x, y, 1 + 1.4 * g, s.c, 0); } else Paint.disc(c, x, y, s.r, s.c);
    });
    c.globalAlpha = 1;
  }
};

/* ----- the tear in the afternoon: a seam in the air that only opens to starlight ----- */
ENT.warp = {
  lit: true,
  init(e) { e.w = 16; e.h = 46; e.x -= 8; e.y -= 48; e.p = 0; e.lock = false; },
  update(w, e) {
    const p = nearP(w, e), near = !p.dead && Math.abs(p.x + 5 - (e.x + 8)) < 60 && Math.abs(p.y + p.h - (e.y + 48)) < 50;
    if (!p.lit && !w.warpFx) w.warpLock = false; // she must lower her hand and raise it again before a tear will take her a second time
    if (near && p.lit && !w.warpLock && !w.warpFx && w.state === 'play') {
      if (e.p === 0) Sound.sfx('bridge');
      e.p = Math.min(64, e.p + 1);
      if (w.t % 5 === 0) World.sparkle(e.x + 8 + rand(-8, 8), e.y + rand(46), '#dff2ff', 2);
      if (e.p >= 64) { e.p = 0; w.warpLock = true; World.warp(e.to); }
    } else if (e.p > 0) e.p = Math.max(0, e.p - 0.6);
  },
  draw(c, w, e, ox, oy) {
    const k = e.p / 64, cx = e.x - ox + 8, cy = e.y - oy + 23, t = w.t, { soft, vgrad } = Paint;
    const sky = e.to === 'ozArrive' ? ['#34509a', '#eeb2a4', '#fff0c6'] : ['#5a2c70', '#ee7a58', '#ffe6a0'];
    soft(c, cx, cy, 24 + 26 * k + Math.sin(t * 0.08) * 2, '#dff2ff', 0.4 + 0.3 * k);
    const hw = 1.6 + k * 15 + Math.sin(t * 0.09) * 0.4;
    c.beginPath(); c.moveTo(cx, cy - 23); c.bezierCurveTo(cx + hw * 1.3, cy - 10, cx + hw * 1.3, cy + 10, cx, cy + 23); c.bezierCurveTo(cx - hw * 1.3, cy + 10, cx - hw * 1.3, cy - 10, cx, cy - 23); c.closePath();
    c.fillStyle = vgrad(c, cy - 23, cy + 23, sky); c.fill();
    if (k > 0.3) { c.save(); c.clip(); c.globalAlpha = Math.min(1, (k - 0.3) * 3); if (e.to === 'ozArrive') { c.fillStyle = '#de8a6e'; c.beginPath(); c.ellipse(cx, cy + 20, 12, 9, 0, Math.PI, 0); c.fill(); c.fillStyle = '#a23e22'; c.fillRect(cx - 20, cy + 16, 40, 10); } else { c.fillStyle = '#6e3266'; c.fillRect(cx - 12, cy + 8, 9, 18); c.fillRect(cx + 1, cy + 3, 12, 22); c.fillStyle = '#70304a'; c.fillRect(cx - 20, cy + 17, 40, 10); } c.restore(); }
    c.strokeStyle = '#ffffff'; c.lineWidth = 0.7; c.stroke();
    c.fillStyle = `rgba(223,242,255,${0.4 + 0.5 * k})`;
    for (let i = 0; i < 12; i++) { const a = -t * 0.02 + i * TAU / 12, r = 16 + 14 * k; c.beginPath(); c.arc(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 1.5, i % 3 ? 0.4 : 0.8, 0, TAU); c.fill(); } // the hours, going round the wrong way
  },
  light() { return 46; }
};
