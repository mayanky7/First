'use strict';
/* Starlight Queen — painted scenery: trees, small growing things, stones, houses, torches, and the weather */
(() => {
  const { rr, vgrad, disc, soft, stamp, star4, LOOK } = Paint;
  const tri = (g, x0, y0, x1, y1, x2, y2) => { g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath(); };
  const limb = (g, x0, y0, x1, y1, w0, w1) => { const a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2, c = Math.cos(a), s = Math.sin(a); g.moveTo(x0 - c * w0, y0 - s * w0); g.lineTo(x1 - c * w1, y1 - s * w1); g.lineTo(x1 + c * w1, y1 + s * w1); g.lineTo(x0 + c * w0, y0 + s * w0); g.closePath(); };

  // each: [width, height, paint(g, v, L, r)] with the ground along the bottom edge
  const PROPS = {
    spruce: [40, 70, (g, v, L) => {
      const dark = mix(L.ground[0], '#0a1838', 0.2), mid = mix(L.ridge[3], '#1c4a50', 0.5);
      g.fillStyle = '#2c2030'; g.fillRect(18.6, 58, 2.8, 12);
      for (let i = 0; i < 5; i++) { const y = 60 - i * 11.5, wd = 17 - i * 3 + (v - 1) * 0.8; g.fillStyle = i % 2 ? dark : mid; g.beginPath(); g.moveTo(20, y - 17); g.quadraticCurveTo(20 + wd * 0.5, y - 5, 20 + wd, y); g.quadraticCurveTo(20, y + 3.4, 20 - wd, y); g.quadraticCurveTo(20 - wd * 0.5, y - 5, 20, y - 17); g.fill(); }
      g.fillStyle = L.capCol; // snow lying on the boughs
      for (let i = 0; i < 5; i++) { const y = 60 - i * 11.5, wd = 17 - i * 3 + (v - 1) * 0.8; g.beginPath(); g.moveTo(20, y - 17.4); g.quadraticCurveTo(20 + wd * 0.42, y - 7, 20 + wd * 0.86, y - 1.4); g.quadraticCurveTo(20 + wd * 0.5, y - 3.8, 20 + wd * 0.2, y - 4.6); g.quadraticCurveTo(20 - wd * 0.2, y - 4, 20 - wd * 0.62, y - 2.4); g.quadraticCurveTo(20 - wd * 0.3, y - 7, 20, y - 17.4); g.fill(); }
    }],
    oak: [52, 60, (g, v, L) => {
      g.fillStyle = '#5a3a2a'; g.beginPath(); limb(g, 26, 60, 25 + v, 30, 2.6, 1.6); limb(g, 25.5, 40, 15, 28, 1.3, 0.7); limb(g, 26, 38, 37, 27, 1.3, 0.7); g.fill();
      const c0 = mix(L.ground[0], '#3c9a5a', 0.6), c1 = '#5cb86a', c2 = '#8cd87a';
      for (const [col, pts] of [[c0, [[26, 26, 17], [13, 30, 11], [39, 29, 11], [24, 14, 12]]], [c1, [[23, 23, 13], [12, 27, 8], [36, 25, 9], [24, 12, 9]]], [c2, [[20, 18, 7], [33, 20, 5], [12, 24, 4]]]]) { g.fillStyle = col; g.beginPath(); for (const [x, y, r] of pts) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); } g.fill(); }
    }],
    saguaro: [30, 54, (g, v, L) => {
      const c0 = mix(L.ground[0], '#3a7a52', 0.7), c1 = '#5a9a66';
      for (const [col, dx] of [[c0, 0], [c1, -1.1]]) { g.fillStyle = col; g.beginPath(); rr(g, 12 + (dx ? 0 : 0), 4, dx ? 3 : 6, 50, 3); rr(g, 3, 20, dx ? 2.2 : 4.4, 14, 2.2); rr(g, 22.6, 12, dx ? 2.2 : 4.4, 16, 2.2); if (!dx) { g.rect(3, 30, 11, 4.2); g.rect(16, 24, 11, 4.2); } g.fill(); }
      disc(g, 15, 4.2, 1.1, '#ffb0c8');
    }],
    gum: [56, 72, (g, v, L) => {
      g.fillStyle = '#f0e8dc'; g.beginPath(); limb(g, 28, 72, 30 + v, 34, 2.2, 1.3); limb(g, 29.4, 46, 14, 22, 1.1, 0.5); limb(g, 30, 40, 44, 20, 1.1, 0.5); limb(g, 30, 34, 29, 14, 0.9, 0.4); g.fill();
      g.fillStyle = 'rgba(120,100,90,0.35)'; g.beginPath(); limb(g, 29.6, 72, 31.4 + v, 34, 0.8, 0.5); g.fill();
      const r = rng(41 + v);
      for (const [col, n] of [['#5c7350', 26], ['#7d9364', 20], ['#a8b884', 9]]) { g.fillStyle = col; g.beginPath(); for (let i = 0; i < n; i++) { const [cx, cy, rw, rh] = [[13, 20, 12, 5], [45, 18, 12, 5], [28, 10, 13, 6], [20, 30, 7, 3], [38, 30, 7, 3]][i % 5], a = r() * TAU, d = Math.sqrt(r()); g.moveTo(cx + Math.cos(a) * d * rw + 3.4, cy + Math.sin(a) * d * rh); g.ellipse(cx + Math.cos(a) * d * rw, cy + Math.sin(a) * d * rh, 3.4, 1.3, (r() - 0.5) * 1.2, 0, TAU); } g.fill(); }
    }],
    charred: [34, 58, (g, v) => {
      g.fillStyle = '#140a0e'; g.beginPath(); limb(g, 17, 58, 18 + v, 8, 2.4, 0.5); limb(g, 17.4, 36, 6, 18, 1.1, 0.3); limb(g, 17.8, 28, 29, 12, 1.1, 0.3); limb(g, 10, 24, 7, 10, 0.6, 0.2); limb(g, 24, 19, 28, 4, 0.6, 0.2); g.fill();
      soft(g, 17, 50, 7, '#ff6a20', 0.25); disc(g, 16.6, 44, 0.5, '#ff8a30'); disc(g, 18.2, 31, 0.4, '#ff8a30');
    }],
    snowtuft: [16, 6, (g, v, L) => { g.fillStyle = L.capCol; g.beginPath(); g.ellipse(8, 6.6, 7.4, 4.6 + v * 0.3, 0, Math.PI, 0); g.fill(); g.fillStyle = L.capShade; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(9.5, 6.8, 5, 1.6, 0, Math.PI, 0); g.fill(); g.globalAlpha = 1; }],
    frostgrass: [10, 8, (g, v) => { g.strokeStyle = '#b9cdf0'; g.lineWidth = 0.5; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(2 + i * 1.5, 8); g.quadraticCurveTo(2 + i * 1.5, 4, 1 + i * 1.9 + (v - 1.5) * 0.4, 1.4 + (i % 2) * 2); } g.stroke(); }],
    rock: [16, 9, (g, v, L) => { g.fillStyle = mix(L.ground[0], L.ridge[2], 0.5); g.beginPath(); g.moveTo(0.5, 9); g.quadraticCurveTo(1, 3 + v * 0.4, 6, 1.5); g.quadraticCurveTo(12, 0.6, 15.5, 9); g.closePath(); g.fill(); g.fillStyle = L.cap === 'snow' ? L.capCol : 'rgba(255,255,255,0.16)'; g.beginPath(); g.moveTo(2.2, 4.6); g.quadraticCurveTo(4, 2.2, 7, 1.6); g.quadraticCurveTo(10.4, 1.4, 12.4, 3.8); g.quadraticCurveTo(8, 2.8, 2.2, 4.6); g.fill(); }],
    grass: [10, 7, (g, v) => { g.fillStyle = v % 2 ? '#8ee07a' : '#62c468'; g.beginPath(); for (let i = 0; i < 5; i++) tri(g, 1 + i * 1.7, 7, 1.6 + i * 1.8 + (i - 2) * 0.5, 1 + ((i + v) % 3) * 1.6, 2.6 + i * 1.7, 7); g.fill(); }],
    flower: [8, 10, (g, v) => { const col = ['#ff7a9a', '#ffe36a', '#ffffff', '#c39cff'][v % 4]; g.strokeStyle = '#4fae5a'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(4, 10); g.quadraticCurveTo(3.4, 6, 4, 3.4); g.stroke(); g.fillStyle = col; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; g.moveTo(4 + Math.cos(a) * 1.5 + 1.2, 3 + Math.sin(a) * 1.5); g.arc(4 + Math.cos(a) * 1.5, 3 + Math.sin(a) * 1.5, 1.2, 0, TAU); } g.fill(); disc(g, 4, 3, 0.9, '#ffb030'); }],
    bush: [24, 13, (g, v) => { for (const [col, pts] of [['#3c8f52', [[7, 9, 6], [16, 8, 7], [12, 5, 5]]], ['#62b868', [[6, 8, 3.6], [15, 6, 4.4]]]]) { g.fillStyle = col; g.beginPath(); for (const [x, y, r] of pts) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); } g.fill(); } for (let i = 0; i < 4; i++) disc(g, 5 + i * 4.6, 6 + (i % 2) * 3, 0.7, '#ff6a7a'); }],
    crystal: [14, 16, (g, v) => { const c = v % 2 ? ['#bff4ff', '#4aa8d8'] : ['#e0ccff', '#7a58d0']; soft(g, 7, 9, 8, c[0], 0.35); g.fillStyle = vgrad(g, 0, 16, c); g.beginPath(); tri(g, 2, 16, 5, 1, 8, 16); tri(g, 7.5, 16, 10.5, 6, 13, 16); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); tri(g, 3.4, 16, 5, 1, 5.2, 16); g.fill(); }],
    bones: [14, 5, (g) => { g.strokeStyle = '#d9d2c4'; g.lineWidth = 1; g.lineCap = 'round'; g.beginPath(); g.moveTo(1.5, 4); g.lineTo(10, 3.4); g.moveTo(4, 1.6); g.lineTo(12.5, 2.4); g.stroke(); }],
    rubble: [14, 6, (g, v, L) => { g.fillStyle = mix(L.ground[0], L.ridge[1], 0.5); g.beginPath(); rr(g, 0.5, 2.6, 5, 3.6, 1.4); rr(g, 4.6, 0.8 + (v % 2), 5.4, 5.4, 1.8); rr(g, 9.4, 3, 4.2, 3.2, 1.2); g.fill(); }],
    drygrass: [10, 7, (g, v) => { g.strokeStyle = '#f0c878'; g.lineWidth = 0.5; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i < 6; i++) { g.moveTo(2 + i * 1.2, 7); g.quadraticCurveTo(2 + i * 1.2, 4, 0.6 + i * 1.8, 1 + ((i + v) % 3) * 1.4); } g.stroke(); }],
    cactus: [10, 13, (g) => { g.fillStyle = '#4f9462'; g.beginPath(); rr(g, 3.6, 1, 3, 12, 1.5); rr(g, 0.6, 5, 2, 4.4, 1); rr(g, 7.2, 3.4, 2, 4.4, 1); g.rect(1, 7.6, 3.4, 1.6); g.rect(6, 6, 3, 1.6); g.fill(); disc(g, 5.1, 1.2, 0.8, '#ff9ab8'); }],
    skull: [8, 6, (g) => { g.fillStyle = '#e4dccb'; g.beginPath(); rr(g, 1, 0.4, 6, 4.4, 2); rr(g, 2.2, 3.6, 3.6, 2.4, 0.8); g.fill(); disc(g, 2.9, 2.6, 0.75, '#3a2030'); disc(g, 5.1, 2.6, 0.75, '#3a2030'); }],
    emberrock: [14, 9, (g) => { g.fillStyle = '#1c1216'; g.beginPath(); g.moveTo(0.5, 9); g.quadraticCurveTo(1, 3, 6, 1.4); g.quadraticCurveTo(12, 0.6, 13.5, 9); g.closePath(); g.fill(); soft(g, 7, 6, 6, '#ff6a20', 0.4); g.strokeStyle = '#ff8a30'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(4, 8); g.lineTo(6, 4.6); g.lineTo(8.4, 6); g.lineTo(10, 3.4); g.stroke(); }],
    spinifex: [14, 8, (g, v) => { g.strokeStyle = '#e6c466'; g.lineWidth = 0.5; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i < 11; i++) { const a = -1.4 + i * 0.28; g.moveTo(7, 8); g.lineTo(7 + Math.sin(a) * (6 + (i + v) % 2), 8 - Math.cos(a) * (6 + (i % 3))); } g.stroke(); }],
    termite: [10, 20, (g) => { g.fillStyle = vgrad(g, 0, 20, ['#d0683a', '#8a3018']); g.beginPath(); g.moveTo(0.6, 20); g.quadraticCurveTo(2.4, 9, 4.4, 1); g.quadraticCurveTo(6, 0, 6.6, 3); g.quadraticCurveTo(7.4, 12, 9.4, 20); g.closePath(); g.fill(); }],
    wattle: [20, 13, (g) => { g.fillStyle = '#5a7444'; g.beginPath(); for (const [x, y, r] of [[6, 9, 5.4], [13, 8, 6], [10, 5, 4.6]]) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); } g.fill(); const r = rng(5); for (let i = 0; i < 16; i++) disc(g, 2.5 + r() * 15, 2 + r() * 8, 0.8, i % 3 ? '#ffd838' : '#fff0a0'); }],
    cottage: [46, 40, (g, v) => { // red-ochre timber, white corners, a lit window, snow on the roof
      const wall = ['#b53a30', '#c8a84a', '#a8342c'][v % 3];
      g.fillStyle = '#6a5f66'; g.fillRect(31, 4, 4.4, 9);
      g.fillStyle = vgrad(g, 16, 40, [wall, mix(wall, '#2a1030', 0.35)]); g.fillRect(5, 17, 36, 23);
      g.fillStyle = '#f2f5ff'; g.fillRect(5, 17, 1.6, 23); g.fillRect(39.4, 17, 1.6, 23);
      g.fillStyle = '#eef3ff'; g.beginPath(); g.moveTo(1.4, 19); g.lineTo(23, 3.4); g.lineTo(44.6, 19); g.lineTo(42.6, 20.6); g.lineTo(23, 7); g.lineTo(3.4, 20.6); g.closePath(); g.fill();
      g.fillStyle = mix(wall, '#2a1030', 0.2); g.beginPath(); g.moveTo(5.6, 18.4); g.lineTo(23, 6.6); g.lineTo(40.4, 18.4); g.closePath(); g.fill();
      g.fillStyle = '#eef3ff'; g.beginPath(); rr(g, 30.4, 2.8, 5.6, 2.2, 1); g.fill();
      soft(g, 14.5, 27, 12, '#ffcf70', 0.55); g.fillStyle = '#ffd98a'; g.fillRect(10, 22.6, 9, 8.6); g.fillStyle = '#f2f5ff'; g.fillRect(9.4, 22, 10.2, 0.9); g.fillRect(9.4, 30.8, 10.2, 0.9); g.fillRect(14.1, 22.6, 0.9, 8.6); g.fillRect(10, 26.5, 9, 0.8);
      g.fillStyle = '#4a2e24'; g.fillRect(27, 25, 8, 15); g.fillStyle = '#f2f5ff'; g.fillRect(26.4, 24.2, 9.2, 0.9); disc(g, 33.4, 32.6, 0.6, '#ffd98a');
    }],
    gate: [48, 58, (g) => { // the last gate of Kaamos: two posts, a beam with snow on it, a lamp
      g.fillStyle = vgrad(g, 8, 58, ['#7a5a40', '#3e2a22']); g.fillRect(5, 10, 4.4, 48); g.fillRect(38.6, 10, 4.4, 48); g.fillRect(1, 10, 46, 4.6);
      g.fillStyle = '#eef3ff'; g.beginPath(); rr(g, 0.4, 7, 47.2, 4, 2); g.fill();
      g.strokeStyle = '#3e2a22'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(24, 14.6); g.lineTo(24, 21); g.stroke();
      soft(g, 24, 25, 15, '#ffcf70', 0.6); g.fillStyle = '#ffe2a0'; g.beginPath(); rr(g, 21.4, 21, 5.2, 7, 1.4); g.fill(); g.fillStyle = '#3e2a22'; g.fillRect(21, 20.4, 6, 0.9); g.fillRect(21, 27.6, 6, 0.9);
    }],
    watcher: [44, 100, (g, v, L) => { // a great stone figure from an older age, one hand raised
      g.fillStyle = vgrad(g, 0, 100, [mix(L.ridge[2], '#8a94b8', 0.35), mix(L.ground[0], '#20243c', 0.4)]);
      g.beginPath(); g.moveTo(8, 100); g.quadraticCurveTo(11, 60, 13, 34); g.quadraticCurveTo(13, 26, 18, 24); g.lineTo(26, 24); g.quadraticCurveTo(31, 26, 31, 34); g.quadraticCurveTo(33, 60, 36, 100); g.closePath();
      g.moveTo(27.4, 14); g.arc(22, 14, 5.4, 0, TAU); g.moveTo(22, 4); tri(g, 16.6, 13, 22, 1, 27.4, 13);
      limb(g, 29, 30, 38, 20, 2.6, 2); limb(g, 38, 20, 38.6, 8, 2, 1.4); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.1)'; g.beginPath(); g.moveTo(9, 100); g.quadraticCurveTo(12, 60, 14, 34); g.lineTo(16.4, 34); g.quadraticCurveTo(14, 60, 12.6, 100); g.closePath(); g.fill();
      if (L.cap === 'snow') { g.fillStyle = L.capCol; g.beginPath(); rr(g, 15, 22.6, 14, 2.6, 1.3); rr(g, 36, 6.6, 5, 2, 1); g.fill(); }
    }],
    throne: [48, 66, (g) => { g.fillStyle = vgrad(g, 0, 66, ['#3a2a34', '#140c12']); g.beginPath(); g.moveTo(8, 66); g.lineTo(8, 14); g.lineTo(13, 2); g.lineTo(18, 14); g.lineTo(24, 0); g.lineTo(30, 14); g.lineTo(35, 2); g.lineTo(40, 14); g.lineTo(40, 66); g.closePath(); g.fill(); g.fillStyle = '#4a3642'; g.fillRect(4, 42, 40, 6); g.fillRect(2, 42, 5, 24); g.fillRect(41, 42, 5, 24); soft(g, 24, 10, 10, '#ff6a20', 0.4); disc(g, 24, 9, 1.2, '#ffa040'); }],
    banner: [18, 44, (g) => { g.fillStyle = vgrad(g, 0, 44, ['#6a1820', '#3a0c14']); g.beginPath(); g.moveTo(1, 0); g.lineTo(17, 0); g.lineTo(17, 38); g.lineTo(9, 44); g.lineTo(1, 38); g.closePath(); g.fill(); g.fillStyle = '#2a1c24'; g.fillRect(0, 0, 18, 1.6); g.fillStyle = '#ff8a30'; for (const [x, h] of [[5, 5], [9, 8], [13, 5]]) { g.beginPath(); tri(g, x - 1.4, 22, x, 22 - h, x + 1.4, 22); g.fill(); } g.fillRect(4, 22, 10, 1.2); }]
  };
  PROPS.birch = [34, 62, (g, v) => { // a birch: a white stem with dark marks, small bright leaf
    g.fillStyle = '#f4f1e8'; g.beginPath(); limb(g, 17, 62, 17.6 + v * 0.6, 14, 1.5, 0.7); limb(g, 17.4, 36, 9, 24, 0.7, 0.3); limb(g, 17.6, 30, 26, 20, 0.7, 0.3); g.fill();
    g.fillStyle = '#3a3038'; for (let i = 0; i < 6; i++) g.fillRect(16.2 + (i % 2) * 0.8, 54 - i * 7, 1.6, 0.8);
    const r = rng(77 + v); for (const [col, n] of [['#6cab5c', 34], ['#9ad070', 26], ['#d4ec9a', 10]]) { g.fillStyle = col; g.beginPath(); for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()), cx = 17 + Math.cos(a) * d * 13, cy = 18 + Math.sin(a) * d * 14; g.moveTo(cx + 2, cy); g.ellipse(cx, cy, 2, 1.3, r() * 3, 0, TAU); } g.fill(); }
  }];
  PROPS.stuga = [46, 40, (g, v, L) => PROPS.cottage[2](g, 0, Object.assign({}, L, { capCol: '#f2f5ff' }))]; // a red summer cottage: falu red, white corners
  PROPS.elder = PROPS.oak; PROPS.dead = PROPS.charred; PROPS.maypole = PROPS.flower; PROPS.fern = PROPS.grass; PROPS.mushroom = PROPS.flower; PROPS.reeds = PROPS.frostgrass; PROPS.deadbush = PROPS.drygrass;

  Paint.prop = function (g, type, v, x, y, w, d) {
    const P = PROPS[type]; if (!P) return;
    const th = w.colTheme[clamp(Math.floor((x + w.cam.x) / T), 0, w.cols - 1)], L = LOOK[th.id] || LOOK.north;
    stamp(g, 'p:' + type + v + th.id, P[0], P[1], x - P[0] / 2, d && d.hang ? y : y - P[1] + 0.6, q => P[2](q, v, L));
    if (type === 'cottage') { const t = w.t; g.fillStyle = 'rgba(220,230,255,0.22)'; for (let i = 0; i < 4; i++) { const k = ((t * 0.4 + i * 25) % 100) / 100; g.globalAlpha = (1 - k) * 0.5; g.beginPath(); g.arc(x + 10 + Math.sin(k * 5 + i) * 3 + k * 6, y - 38 - k * 26, 1.6 + k * 3.2, 0, TAU); g.fill(); } g.globalAlpha = 1; }
  };
  Paint.propSize = type => PROPS[type] ? [PROPS[type][0], PROPS[type][1]] : [0, 0];

  // a flame: three soft tongues, never still
  Paint.flame = function (g, x, y, t, k) {
    k = k || 1;
    for (const [col, sc, ph] of [['#ff5a14', 1, 0], ['#ffa030', 0.68, 1.3], ['#fff0b0', 0.36, 2.1]]) {
      const h = (9 + Math.sin(t * 0.33 + ph) * 1.6 + Math.sin(t * 0.71 + ph * 2) * 1) * k * sc, wd = 3.6 * k * sc, sway = Math.sin(t * 0.21 + ph) * 1.2 * k;
      g.fillStyle = col; g.beginPath(); g.moveTo(x - wd, y); g.quadraticCurveTo(x - wd * 1.1, y - h * 0.45, x + sway, y - h); g.quadraticCurveTo(x + wd * 1.1, y - h * 0.45, x + wd, y); g.quadraticCurveTo(x, y + wd * 0.8, x - wd, y); g.fill();
    }
  };
  Paint.torch = function (g, x, y, t, lit) {
    if (!lit) { g.fillStyle = '#3a3040'; g.fillRect(x - 0.9, y - 14, 1.8, 13); g.fillStyle = '#5a4a58'; g.beginPath(); rr(g, x - 3, y - 16, 6, 3, 1); g.fill(); return; }
    soft(g, x, y - 20, 24 + Math.sin(t * 0.3 + x) * 2, '#ff9a30', 0.5); Paint.flame(g, x, y - 16, t + x, 0.9);
  };

  /* ---------- weather, drifting across the whole frame ---------- */
  Paint.makeAmbient = (kind, n0) => { const n = n0 || { pollen: 18, leaves: 16, dust: 22, mist: 0, ash: 40, snow: 70 }[kind] || 0, ps = []; for (let i = 0; i < n; i++) ps.push({ x: rand(W), y: rand(H), p: rand(TAU), s: rand(0.4, 1.3) }); return { kind, ps }; };
  Paint.ambient = function (g, amb, t, dx, n) { // n: draw only the first n of them (the weather thins and thickens)
    if (!amb) return;
    const lim = n === undefined ? amb.ps.length : Math.min(amb.ps.length, n);
    for (let qi = 0; qi < lim; qi++) { const q = amb.ps[qi];
      q.x -= dx * (0.3 + q.s * 0.5);
      if (amb.kind === 'snow') { q.y += 0.22 + q.s * 0.3; q.x += Math.sin(t * 0.015 + q.p) * 0.25 - 0.12; }
      else if (amb.kind === 'ash') { q.y -= 0.18 + q.s * 0.22; q.x += Math.sin(t * 0.02 + q.p) * 0.3; }
      else { q.y += Math.sin(t * 0.012 + q.p) * 0.12; q.x += Math.cos(t * 0.01 + q.p) * 0.12 + 0.04; }
      if (q.y > H + 3) { q.y = -3; q.x = rand(W); } if (q.y < -4) { q.y = H + 3; q.x = rand(W); } if (q.x < -4) q.x += W + 8; if (q.x > W + 4) q.x -= W + 8;
      const a = 0.35 + 0.35 * Math.sin(t * 0.03 + q.p);
      if (amb.kind === 'snow') { g.globalAlpha = 0.35 + q.s * 0.4; disc(g, q.x, q.y, 0.35 + q.s * 0.55, '#ffffff'); }
      else if (amb.kind === 'ash') { g.globalAlpha = a + 0.2; disc(g, q.x, q.y, 0.3 + q.s * 0.35, q.s > 0.9 ? '#ffb040' : '#ff6a20'); }
      else if (amb.kind === 'dust') { g.globalAlpha = a * 0.6; disc(g, q.x, q.y, 0.3 + q.s * 0.3, '#c8d4ff'); }
      else { g.globalAlpha = a; disc(g, q.x, q.y, 0.35 + q.s * 0.3, amb.kind === 'leaves' ? '#c8f0a0' : '#fff6c8'); }
    }
    g.globalAlpha = 1;
  };
})();
