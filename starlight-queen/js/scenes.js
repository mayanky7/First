'use strict';
/* Starlight Queen — game state and scenes (title, prologue, map, play, vault, ending) */
const Game = {
  cp: null, melee: 0, meleeGot: {}, gems: {}, seen: {}, doors: {}, keeps: {}, wonders: {}, metBoy: false, bossDown: false, region: 0,
  stats: { foes: 0, deaths: 0, hits: 0, frames: 0 }, saved: null, vault: {}, shelf: {}, sights: {}, best: null,
  newGame() {
    Object.assign(this, { cp: null, melee: 0, meleeGot: {}, gems: {}, seen: {}, doors: {}, keeps: {}, wonders: {}, metBoy: false, bossDown: false, region: 0, bossHp: 0, bossOut: false, oz: false, stats: { foes: 0, deaths: 0, hits: 0, frames: 0 } });
  },
  read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
  write(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  loadSave() { this.saved = this.read('sq-run'); if (this.saved && this.saved.v !== 4) { this.saved = null; this.write('sq-run', null); } this.vault = this.read('sq-vault') || {}; this.shelf = this.read('sq-shelf') || {}; this.sights = this.read('sq-sights') || {}; this.best = this.read('sq-best'); if (this.best && this.best.v !== 4) this.best = null; },
  keepAll() { // what has been found stays found, whatever becomes of the journey it was found on
    Object.assign(this.vault, this.gems); this.write('sq-vault', this.vault); Object.assign(this.shelf, this.keeps); this.write('sq-shelf', this.shelf); Object.assign(this.sights, this.wonders); this.write('sq-sights', this.sights);
  },
  save() {
    this.keepAll();
    this.saved = { v: 4, oz: !!this.oz, bossHp: this.bossHp || 0, doors: this.doors, keeps: this.keeps, wonders: this.wonders, cp: this.cp, melee: this.melee, meleeGot: Object.keys(this.meleeGot), gems: this.gems, seen: this.seen, metBoy: this.metBoy, bossDown: this.bossDown, region: this.region, stats: this.stats };
    this.write('sq-run', this.saved);
  },
  resume() {
    const s = this.saved; this.newGame();
    Object.assign(this, { doors: s.doors || {}, keeps: s.keeps || {}, wonders: s.wonders || {}, cp: s.cp, melee: s.melee || 0, gems: s.gems || {}, seen: s.seen || {}, metBoy: !!s.metBoy, bossDown: !!s.bossDown, region: s.region || 0, bossHp: s.bossHp || 0, stats: s.stats || this.stats });
    (s.meleeGot || []).forEach(n => { this.meleeGot[n] = 1; });
  },
  playerDied() { Scenes.go('play', { respawn: true }); },
  carats() { return GEMS.reduce((a, g) => a + (this.gems[g.id] ? g.carat : 0), 0); },
  // The journey is graded like a stone, but on what was found and seen: nothing here counts falls, or the clock.
  grade() {
    const got = Object.keys(this.meleeGot).length, total = World.meleeTotal || got, frac = got / Math.max(1, total);
    const seen = Object.keys(this.wonders).length, kept = Object.keys(this.keeps).length, n = Object.keys(this.gems).length;
    const ci = frac >= 0.95 ? 0 : frac >= 0.88 ? 1 : frac >= 0.8 ? 2 : frac >= 0.7 ? 3 : frac >= 0.6 ? 4 : frac >= 0.45 ? 5 : frac >= 0.3 ? 6 : 7;
    const cl = [['I', 'Included'], ['I', 'Included'], ['SI', 'Slightly included'], ['SI', 'Slightly included'], ['VS', 'Very slightly included'], ['VVS', 'Very, very slightly included'], ['IF', 'Internally flawless'], ['FL', 'Flawless']][Math.min(7, seen)];
    const cut = ['Fair', 'Fair', 'Good', 'Good', 'Very good', 'Very good', 'Very good', 'Excellent'][Math.min(7, kept)];
    return {
      v: 4, carat: this.carats(), n, clarity: cl, colour: 'DEFGHIJK'[ci], cut, got, total, seen, kept,
      score: n * 3 + (7 - ci) + seen + kept
    };
  },
  finish() {
    const g = this.grade(); this.lastGrade = g;
    if (!this.best || g.score > this.best.score) { this.best = g; this.write('sq-best', g); }
    this.keepAll();
    this.write('sq-run', null); this.saved = null;
    Scenes.go('ending');
  }
};

const Scenes = (() => {
  const list = {};
  let cur = null, next = null, fade = 1, dir = -1;
  function go(name, arg) { if (next) return; next = { name, arg }; dir = 1; }
  function update() {
    if (dir === 1) { fade = Math.min(1, fade + 0.06); if (fade >= 1 && next) { cur = list[next.name]; const a = next.arg; next = null; dir = -1; cur.enter && cur.enter(a || {}); } }
    else if (fade > 0) fade = Math.max(0, fade - 0.05);
    if (cur) cur.update(dir === 1);
  }
  return { list, go, update, get cur() { return cur; }, get fade() { return fade; }, get busy() { return dir === 1; } };
})();

/* ---------- the diamond card: one stone, its four Cs and its story ---------- */
function drawGemCard(u, gem, t, a, footer) {
  const g = u.ctx, s = u.s;
  u.panel(0, 0, W, H, 0.96 * a, '#05060f');
  if (a < 0.05) return;
  g.save(); g.globalAlpha = a;
  // frame
  g.strokeStyle = 'rgba(214,186,120,0.75)'; g.lineWidth = Math.max(1, s * 0.5); g.strokeRect(14 * s, 14 * s, (W - 28) * s, (H - 28) * s);
  g.strokeStyle = 'rgba(214,186,120,0.3)'; g.lineWidth = Math.max(1, s * 0.3); g.strokeRect(17 * s, 17 * s, (W - 34) * s, (H - 34) * s);
  const r = 24 + 24 * Math.log10(gem.carat + 1) / Math.log10(531);
  g.scale(s, s);
  g.fillStyle = gem.tint; for (let i = 0; i < 22; i++) { const an = i / 22 * TAU + t * 0.003, wdt = 0.018 + (i % 3) * 0.012, len = 70 + (i * 7 % 5) * 9; g.globalAlpha = a * 0.07; g.beginPath(); g.moveTo(92, 96); g.lineTo(92 + Math.cos(an - wdt) * len, 96 + Math.sin(an - wdt) * len); g.lineTo(92 + Math.cos(an + wdt) * len, 96 + Math.sin(an + wdt) * len); g.fill(); }
  g.globalAlpha = a;
  drawGemHi(g, 92, 96, r * Math.min(1, 0.4 + t / 50), gem, t);
  g.restore();
  u.text(`${gem.carat} ct`, 92, 160, 14, { color: '#fff6dc', alpha: a, title: true, ls: 1 });
  const x = 176, wd = 178;
  u.text(`DIAMOND ${gem.n + 1} OF ${GEMS.length}   ·   ${gem.real ? 'A REAL STONE' : 'A TEACHING STONE'}`, x, 44, 5.4, { color: '#d6ba78', alpha: a, align: 'left', ls: 1.2, title: true });
  const nameSize = u.width(gem.name, 16, { title: true }) > wd ? 11.5 : 16;
  u.text(gem.name, x, 61, nameSize, { color: '#fff6dc', alpha: a, align: 'left', title: true, glow: gem.tint });
  u.wrap(`${gem.cut}  ·  ${gem.color}  ·  ${gem.clarity}`, wd, 7.6, { italic: true }).slice(0, 2).forEach((ln, i) => u.text(ln, x, 76 + i * 9.6, 7.6, { color: '#c9d2ea', alpha: a, align: 'left', italic: true }));
  u.text(gem.origin, x, 97, 7, { color: '#9aa6c8', alpha: a, align: 'left' });
  g.save(); g.globalAlpha = a * 0.6; g.fillStyle = '#d6ba78'; g.fillRect(x * s, 108 * s, wd * s, Math.max(1, s * 0.4)); g.restore();
  u.text(gem.lesson, x, 121, 10, { color: '#f0d896', alpha: a, align: 'left', italic: true });
  let fs = 8.4, lines = u.wrap(gem.text, wd, fs, {});
  while (lines.length * fs * 1.36 > 58 && fs > 6.8) { fs -= 0.3; lines = u.wrap(gem.text, wd, fs, {}); }
  lines.forEach((ln, i) => u.text(ln, x, 134 + i * fs * 1.36, fs, { color: '#e2e8f6', alpha: a, align: 'left' }));
  if (footer) u.text(footer, 92, 189, 5.4, { color: '#f0d896', alpha: a * (0.7 + 0.3 * Math.sin(t * 0.1)), ls: 1.3, title: true });
}

/* ---------- the establishing painting: Kaamos in its valley, at night (title, prologue) and at dawn (ending) ---------- */
const Vista = (() => {
  let snow = null;
  const HOUSES = [[182, 171, 0], [198, 173, 1], [214, 170, 0], [246, 172, 2], [262, 170, 0], [283, 173, 1]];
  function draw(c, t, dawn, scroll) {
    const { soft, disc, vgrad, rr } = Paint, id = dawn ? 'dawn' : 'vista';
    Paint.backdrop(c, id, scroll || 0, 0, t, 1);
    // the valley floor, and the lake with the sky lying in it
    c.fillStyle = vgrad(c, 156, H, dawn ? ['#c9b6d6', '#8f86b8', '#5a5a94'] : ['#31508e', '#1d3368', '#101c44']); c.beginPath(); c.moveTo(0, 166); c.quadraticCurveTo(120, 152, 250, 160); c.quadraticCurveTo(330, 164, W, 156); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
    c.fillStyle = vgrad(c, 178, 200, dawn ? ['#ffd9a8', '#f0a890', '#8a7ab0'] : ['#16306a', '#0b1840', '#081030']); c.beginPath(); c.ellipse(248, 190, 150, 13, 0, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.ellipse(248, 190, 150, 13, 0, 0, TAU); c.clip();
    if (!dawn) { c.translate(0, 206); c.scale(1, -0.3); Backdrop.aurora(c, t, 0, 0, 0.5); }
    else soft(c, 300, 186, 60, '#fff0c0', 0.5);
    c.restore();
    c.fillStyle = dawn ? 'rgba(255,255,255,0.4)' : 'rgba(200,225,255,0.22)'; for (let i = 0; i < 7; i++) { const k = (t * 0.1 + i * 37) % 120; c.beginPath(); rr(c, 150 + i * 31 + k * 0.2, 185 + (i % 3) * 3.4, 14 - k * 0.08, 0.6, 0.3); c.fill(); }
    // the town: a few lit windows, and the church
    for (const [x, y, v] of HOUSES) {
      const wall = ['#b53a30', '#c8a84a', '#a8342c'][v];
      soft(c, x, y - 3, 9, '#ffcf70', dawn ? 0.25 : 0.5);
      c.fillStyle = mix(wall, dawn ? '#ffd8b0' : '#1a2450', dawn ? 0.2 : 0.3); c.fillRect(x - 5, y - 6, 10, 6);
      c.fillStyle = dawn ? '#fff4ea' : '#dfe8ff'; c.beginPath(); c.moveTo(x - 6.4, y - 5.6); c.lineTo(x, y - 10.4); c.lineTo(x + 6.4, y - 5.6); c.closePath(); c.fill();
      c.fillStyle = '#ffdc90'; c.fillRect(x - 3, y - 4.2, 2.2, 2.2); c.fillRect(x + 1, y - 4.2, 2.2, 2.2);
      if (!dawn) { c.fillStyle = 'rgba(220,230,255,0.2)'; for (let j = 0; j < 3; j++) { const k = ((t * 0.3 + x + j * 30) % 90) / 90; c.globalAlpha = (1 - k) * 0.5; c.beginPath(); c.arc(x + 3 + k * 4, y - 12 - k * 14, 1 + k * 2, 0, TAU); c.fill(); } c.globalAlpha = 1; }
    }
    soft(c, 230, 160, 12, '#ffcf70', dawn ? 0.3 : 0.55); c.fillStyle = dawn ? '#fff4ea' : '#e6ecff'; c.fillRect(227.6, 156, 4.8, 15); c.beginPath(); c.moveTo(226.6, 156.4); c.lineTo(230, 146); c.lineTo(233.4, 156.4); c.closePath(); c.fill(); c.fillRect(229.7, 143, 0.6, 4); c.fillRect(228.8, 144.2, 2.4, 0.6); c.fillStyle = '#ffdc90'; c.fillRect(229, 159, 2, 4);
    c.fillStyle = dawn ? '#3a3c6c' : '#0c1634'; c.beginPath(); for (const [x, hh] of [[170, 12], [176, 9], [206, 11], [222, 8], [238, 10], [254, 9], [272, 12], [292, 10], [300, 13], [312, 9], [326, 12], [340, 10], [142, 14], [128, 11], [352, 14], [366, 12]]) Paint.spruce(c, x, 174 + (x % 5) * 0.5, hh); c.fill();
    // the ridge above the town, where she stands
    c.fillStyle = vgrad(c, 150, H, dawn ? ['#fff6ee', '#e8cfe0', '#b0a0cc'] : ['#e6eeff', '#9fb4e4', '#5a70b0']); c.beginPath(); c.moveTo(-2, 178); c.quadraticCurveTo(50, 162, 96, 171); c.quadraticCurveTo(150, 184, 176, H + 2); c.lineTo(-2, H + 2); c.closePath(); c.fill();
    c.fillStyle = dawn ? 'rgba(120,90,150,0.25)' : 'rgba(20,34,80,0.35)'; c.beginPath(); c.ellipse(86, 172.4, 22, 2.2, 0.08, 0, TAU); c.fill();
    // the dark spruces at the edge of the picture
    c.fillStyle = dawn ? '#2c2a58' : '#070c20'; c.beginPath(); Paint.spruce(c, 12, 232, 150); Paint.spruce(c, 372, 236, 176); Paint.spruce(c, 346, 232, 104); Paint.spruce(c, 40, 230, 70); c.fill();
    // Ana; and beside her the Tonttu, or at the end of it all, Mayank and his lantern
    const ax = 92, ay = 171.6, k = 1.9;
    soft(c, ax, ay - 20, 46 + Math.sin(t * 0.05) * 3, dawn ? '#fff0c8' : '#9fc8ff', dawn ? 0.35 : 0.3);
    if (dawn) { soft(c, ax - 20, ay - 18, 20, '#ffc060', 0.5); Paint.figure(c, ax - 30, ay + 0.6, { face: 1, t: t + 30, scale: k, lantern: true }, Paint.MAYANK); }
    c.save(); c.translate(dawn ? ax + 24 : ax - 30, ay + (dawn ? 2.6 : 1.2)); c.scale(k, k); if (!dawn) soft(c, 4, -6, 9, '#ffcf70', 0.4); Paint.tonttu(c, 0, 0, t, dawn ? -1 : 1); c.restore();
    Paint.figure(c, ax, ay, { face: 1, t, scale: k, crown: dawn, speed: 0.12, ph: 0 });
    if (!snow) snow = Paint.makeAmbient('snow');
    if (!dawn) Paint.ambient(c, snow, t, 0.25);
  }
  /* Kauaʻi, late in the day: the fluted green cliffs going down into the sea, a rainbow, and the two of them on the sand */
  function palm(c, x, y, h, lean, t) {
    const tx = x + lean, ty = y - h, sw = Math.sin(t * 0.03 + x) * 1.2;
    c.strokeStyle = '#3a2a22'; c.lineCap = 'round'; c.lineWidth = Math.max(1.2, h * 0.045); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + lean * 0.2, y - h * 0.6, tx, ty); c.stroke();
    c.fillStyle = '#1f4a34';
    for (let i = 0; i < 7; i++) { const a = -Math.PI + i * (Math.PI / 6) + 0.05, len = h * 0.46 * (0.8 + (i % 3) * 0.12), ex = tx + Math.cos(a) * len + sw, ey = ty + Math.sin(a) * len * 0.55 + len * 0.42; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.75 - 1, ex, ey); c.quadraticCurveTo(tx + Math.cos(a) * len * 0.5, ty + Math.sin(a) * len * 0.4 + 2.4, tx, ty); c.fill(); }
    c.fillStyle = '#6a4a2a'; c.beginPath(); c.arc(tx - 1, ty + 1.6, 1.3, 0, TAU); c.arc(tx + 1.4, ty + 1.8, 1.2, 0, TAU); c.fill();
  }
  // The mesa, after: the two of them, his lantern, the beacon burning, and still no summer in the sky
  function mesa(c, t) {
    const { soft, vgrad } = Paint;
    Paint.backdrop(c, 'gloam', 40, 0, t, 0);
    c.fillStyle = vgrad(c, 168, H, ['#3c2430', '#1a0c14']); c.beginPath(); c.moveTo(-2, 176); c.quadraticCurveTo(120, 168, 240, 174); c.quadraticCurveTo(320, 178, W + 2, 172); c.lineTo(W + 2, H + 2); c.lineTo(-2, H + 2); c.closePath(); c.fill();
    c.fillStyle = 'rgba(160,128,136,0.5)'; c.beginPath(); c.moveTo(-2, 176); c.quadraticCurveTo(120, 168, 240, 174); c.quadraticCurveTo(320, 178, W + 2, 172); c.lineTo(W + 2, 173.4); c.quadraticCurveTo(320, 179.4, 240, 175.4); c.quadraticCurveTo(120, 169.4, -2, 177.4); c.closePath(); c.fill();
    c.save(); c.translate(300, 174); c.scale(1.5, 1.5); Paint.beacon(c, 0, 0, t, 1); c.restore();
    const ax = 96, ay = 172.4, k = 1.9;
    soft(c, ax - 20, ay - 18, 22, '#ffc060', 0.55); Paint.figure(c, ax - 28, ay + 0.8, { face: 1, t: t + 30, scale: k, lantern: true }, Paint.MAYANK);
    soft(c, ax + 9, ay - 46, 14, '#dff2ff', 0.6); Paint.star4(c, ax + 9, ay - 46, 3.4, '#ffffff', t * 0.02);
    Paint.figure(c, ax, ay, { face: 1, t, scale: k, crown: true, raise: true });
  }
  function kauai(c, t, rise) {
    const { soft, disc, vgrad, rr } = Paint;
    c.fillStyle = vgrad(c, 0, 124, ['#2c4e94', '#5e8ecc', '#a9c4de', '#f6c8a0', '#ffe2a6']); c.fillRect(0, 0, W, 126);
    c.fillStyle = '#fff4e2'; c.globalAlpha = 0.5; for (const [x, y, wd] of [[40, 30, 70], [150, 18, 90], [270, 40, 80], [330, 66, 60]]) { const xx = (x + t * 0.015) % (W + 100) - 50; c.beginPath(); rr(c, xx, y, wd, 4, 2); for (let k = 0; k < 5; k++) { c.moveTo(xx + wd * (0.14 + k * 0.18) + 8, y + 1.5); c.ellipse(xx + wd * (0.14 + k * 0.18), y + 1.5, 8 + (k % 3) * 3, 5 + (k % 2) * 2.4, 0, Math.PI, 0); } c.fill(); } c.globalAlpha = 1;
    // the sun going down into the sea, and its road on the water
    soft(c, 300, 116, 100, '#ffe6a8', 0.6); disc(c, 300, 114, 11, '#fffbe6');
    // a rainbow, as there usually is
    c.save(); c.globalAlpha = 0.34; c.lineWidth = 1.5; ['#ff7a7a', '#ffb060', '#ffe36a', '#8ee07a', '#6ab8ff', '#b890ff'].forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(206, 150, 112 - i * 1.5, Math.PI * 1.08, Math.PI * 1.66); c.stroke(); }); c.restore();
    c.fillStyle = vgrad(c, 122, H, ['#ffd9a0', '#4fb6b0', '#1f8a94', '#135e78']); c.fillRect(0, 122, W, H - 122);
    c.fillStyle = 'rgba(255,244,214,0.5)'; for (let i = 0; i < 16; i++) { const k = (t * 0.2 + i * 23) % 60, y = 126 + i * 4.6; c.beginPath(); rr(c, 300 - (10 + i * 3) + Math.sin(i * 2.1 + t * 0.02) * 6, y, (20 + i * 6) * (0.5 + 0.5 * Math.sin(k / 60 * Math.PI)), 0.7, 0.35); c.fill(); }
    // the cliffs of the north shore: knife-edged ridges, one behind another, each stepping down into the water
    const ridges = [['#93b8b0', '#7aa4a2', 250, 46, 118], ['#6fa890', '#56907c', 206, 36, 122], ['#4f9470', '#3a7a5a', 160, 24, 127], ['#34804f', '#256440', 112, 16, 134]];
    ridges.forEach(([lit, shade, reach, top, base], i) => {
      const r = rng(40 + i), pts = [];
      for (let x = -4; x <= reach; x += 7) { const k = x / reach, env = top + (base - top) * Math.pow(Math.max(0, k), 1.7); pts.push([x, env + (pts.length % 2 ? 7 + r() * 5 : -r() * 4) * (1 - k * 0.7)]); }
      c.fillStyle = vgrad(c, top - 6, base, [lit, shade]); c.beginPath(); c.moveTo(-4, base + 2); for (const [x, y] of pts) c.lineTo(x, y); c.lineTo(reach + 6, base + 2); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(10,40,30,0.22)'; c.lineWidth = 0.7; c.beginPath(); for (let k = 0; k < pts.length; k += 2) { const [x, y] = pts[k]; c.moveTo(x, y); c.quadraticCurveTo(x + 3, (y + base) / 2, x + 7, base + 1); } c.stroke(); // the flutes
      c.fillStyle = 'rgba(255,240,200,0.16)'; c.beginPath(); for (let k = 0; k + 1 < pts.length; k += 2) { const [x, y] = pts[k]; c.moveTo(x, y); c.lineTo(x + 7, pts[k + 1][1]); c.lineTo(x + 5, (y + base) / 2); c.closePath(); } c.fill();
      if (i === 2) { c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(60, 58); c.lineTo(60.6, 124); c.stroke(); soft(c, 60.4, 124, 5, '#ffffff', 0.5); } // a waterfall, a long way off
      { const mg = c.createLinearGradient(0, base - 12, 0, base + 5), ma = 0.16 + i * 0.03; mg.addColorStop(0, 'rgba(255,236,200,0)'); mg.addColorStop(0.6, `rgba(255,236,200,${ma})`); mg.addColorStop(1, 'rgba(255,236,200,0)'); c.fillStyle = mg; c.beginPath(); c.ellipse(reach * 0.45, base - 3, reach * 0.75, 9, 0, 0, TAU); c.fill(); } // sea mist at the foot
    });
    // surf, and the beach
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.moveTo(-2, 168); c.quadraticCurveTo(90, 156 + Math.sin(t * 0.03) * 1.4, 190, 172 + Math.sin(t * 0.03 + 1) * 1.6); c.quadraticCurveTo(270, 186, W + 2, 196); c.lineTo(W + 2, 200); c.quadraticCurveTo(270, 190, 190, 176); c.quadraticCurveTo(90, 161, -2, 172); c.closePath(); c.fill();
    c.fillStyle = vgrad(c, 160, H, ['#ffe6b4', '#f0c88a', '#c89a62']); c.beginPath(); c.moveTo(-2, 170); c.quadraticCurveTo(90, 159, 190, 175); c.quadraticCurveTo(270, 189, W + 2, 199); c.lineTo(W + 2, H + 2); c.lineTo(-2, H + 2); c.closePath(); c.fill();
    palm(c, 22, 196, 96, 16, t); palm(c, 44, 204, 70, -10, t); palm(c, 352, 214, 108, -22, t); palm(c, 372, 210, 74, 6, t);
    c.fillStyle = 'rgba(120,80,60,0.25)'; c.beginPath(); c.ellipse(94, 181.6, 26, 2.2, 0.06, 0, TAU); c.fill();
    { // one of the island's wild chickens, with business of its own
      const x = 150 + Math.sin(t * 0.01) * 14, y = 186 + Math.abs(Math.sin(t * 0.2)) * -0.6, f = Math.cos(t * 0.01) > 0 ? 1 : -1;
      c.save(); c.translate(x, y); c.scale(f, 1); c.fillStyle = '#7a3a1c'; c.beginPath(); c.ellipse(0, -3, 3, 2.2, 0, 0, TAU); c.fill(); c.fillStyle = '#1c3a34'; c.beginPath(); c.moveTo(-2.4, -3.6); c.quadraticCurveTo(-6, -8, -4.6, -2.4); c.closePath(); c.fill();
      c.fillStyle = '#c8823a'; c.beginPath(); c.ellipse(2.4, -5.6, 1.5, 1.7, 0, 0, TAU); c.fill(); c.fillStyle = '#d8342c'; c.beginPath(); c.arc(2.4, -7.4, 0.9, 0, TAU); c.arc(3.2, -4.6, 0.6, 0, TAU); c.fill(); c.fillStyle = '#f0c040'; c.beginPath(); c.moveTo(3.8, -5.8); c.lineTo(5.2, -5.4); c.lineTo(3.8, -5); c.fill();
      c.strokeStyle = '#c8a040'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(-0.6, -1); c.lineTo(-0.6, 0.6); c.moveTo(0.8, -1); c.lineTo(0.8, 0.6); c.stroke(); c.restore();
    }
    // the two of them
    const ax = 100, ay = 181, k = 1.9;
    soft(c, ax - 10, ay - 20, 44, '#ffe9b8', 0.35);
    soft(c, ax - 20, ay - 18, 18, '#ffc060', 0.45); Paint.figure(c, ax - 28, ay + 0.6, { face: 1, t: t + 30, scale: k, lantern: true }, Paint.MAYANK);
    Paint.figure(c, ax, ay, { face: 1, t, scale: k, crown: true, speed: 0.12, ph: 0 });
    disc(c, ax - 3.4, ay - 41.6, 1.9, '#ff8ab0'); disc(c, ax - 3.4, ay - 41.6, 0.7, '#ffe36a'); // a plumeria behind her ear
    for (let i = 0; i < 9; i++) { const kk = ((t * 0.25 + i * 41) % 240) / 240, x = (i * 53 + kk * 60) % W, y = 40 + kk * 150 + Math.sin(kk * 9 + i) * 6; c.globalAlpha = 0.7 * Math.sin(kk * Math.PI); disc(c, x, y, 1, i % 2 ? '#ffd0e0' : '#fff6e0'); } c.globalAlpha = 1; // petals on the trade wind
    if (rise > 0) { // she opens her hands: the light goes up out of the stones, one for each she carried, and away over the sea
      const got = GEMS.filter(q => Game.gems[q.id] || Game.vault[q.id]), n = Math.max(3, got.length);
      soft(c, ax + 6, ay - 40, 16 + 10 * Math.sin(Math.min(1, rise / 260) * Math.PI), '#fff6d0', 0.5 * clamp(1.4 - rise / 420, 0.25, 1));
      for (let i = 0; i < n; i++) {
        const gem = got[i % Math.max(1, got.length)] || GEMS[i], k0 = (rise - 24 - i * 20) / 240; if (k0 <= 0) continue;
        // each one climbs out of her hands and then hangs in the evening like a new star
        const kk = Math.min(1, k0), e = 1 - Math.pow(1 - kk, 3), tx = 40 + ((i * 97 + 30) % 300), ty = i % 2 ? 9 + (i * 53 % 20) : 90 + (i * 31 % 34), x = lerp(ax + 6, tx, e) + Math.sin(t * 0.02 + i) * 2 * e, y = lerp(ay - 40, ty, e) + Math.cos(t * 0.017 + i * 2) * 1.5 * e;
        const tw = 0.8 + 0.2 * Math.sin(t * 0.09 + i * 1.9);
        soft(c, x, y, 20 + 5 * tw, gem.tint, 0.55); soft(c, x, y, 9, '#ffffff', 0.85 * tw); disc(c, x, y, 1.5, '#ffffff'); Paint.star4(c, x, y, 5 + 1.5 * tw, '#ffffff', 0);
      }
    }
  }
  return { draw, kauai, mesa };
})();

/* ---------- Title ---------- */
Scenes.list.title = {
  enter() {
    Game.loadSave(); this.t = 0; this.sel = 0;
    this.items = (Game.saved ? ['continue'] : []).concat(['new', 'vault']);
    // On a web page that is the whole game in one file, offer that file to keep: it plays on a laptop with no internet.
    // (Tested by whether the game's own code is inline, not by whether the page has any outside script: hosts add their own.)
    this.canSave = /^https?:$/.test(location.protocol) && !document.querySelector('script[src$="js/main.js"]');
    if (this.canSave) this.items.push('download'); // last in the list for the arrow keys, but drawn as a button of its own
    this.rows = this.items.filter(it => it !== 'download').length;
    this.saveNote = ''; this.saveT = 0;
    Sound.music('title'); Sound.duck(false); Sound.setRate(1);
  },
  update(busy) {
    this.t++;
    if (busy) return;
    const n = this.items.length;
    if (Input.hit('up')) { this.sel = (this.sel + n - 1) % n; Sound.sfx('select'); }
    if (Input.hit('dn')) { this.sel = (this.sel + 1) % n; Sound.sfx('select'); }
    if (Input.hit('vault')) { Scenes.go('vault'); return; }
    // the way in that is not on the menu: T, or three taps on the little stone above the name
    if (Input.hit('tap') && Math.abs(Input.tapX - 192) < 16 && Math.abs(Input.tapY - 19) < 14) { this.knock = (this.knock || 0) + 1; if (this.knock < 3) return; }
    if (Input.hit('travel') || this.knock >= 3) { this.knock = 0; Sound.sfx('lantern'); Scenes.go('places'); return; }
    if (Input.hit('enter') && this.t > 20) {
      if (Input.hit('tap')) {
        const k = Math.round((Input.tapY - 122) / 13);
        if (this.canSave && Math.abs(Input.tapX - 192) < 94 && Math.abs(Input.tapY - 184) < 14) this.sel = this.items.length - 1;
        else if (k < 0 || k >= this.rows || Math.abs(Input.tapX - 192) > 110) return; else this.sel = k;
      }
      Sound.sfx('confirm');
      const it = this.items[this.sel];
      if (it === 'continue') { Game.resume(); Scenes.go('map'); }
      else if (it === 'vault') Scenes.go('vault');
      else if (it === 'download') {
        this.saveNote = 'Fetching the game…'; this.saveT = this.t;
        fetch('./index.html', { credentials: 'same-origin' }).then(r => r.text().then(html => {
          if (!r.ok || html.indexOf('window.__sq') < 0) throw new Error('not the game');
          const page = html.replace(/<link rel="(manifest|apple-touch-icon)"[^>]*>\n?/g, ''); // the file needs neither on a laptop
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([page], { type: 'text/html' })); a.download = 'Starlight Queen.html';
          document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000);
          this.saveNote = 'Saved as “Starlight Queen.html”. Double-click it to play, no internet needed.'; this.saveT = this.t;
        })).catch(() => { this.saveNote = 'That did not work just now. Try again with a connection.'; this.saveT = this.t; });
      }
      else { Game.write('sq-run', null); Game.newGame(); Scenes.go('intro'); }
    }
  },
  noBloom: true,
  draw(c) { Vista.draw(c, this.t, false, this.t * 0.06); },
  drawHi(u) {
    const t = this.t, a = clamp((t - 10) / 50, 0, 1), g = u.ctx, s = u.s;
    // lockup: a small cut stone, two lines of engraved gold in one tracking, a hairline, the subtitle
    if (a > 0.05) { g.save(); g.globalAlpha = a; g.scale(s, s); drawGemHi(g, 192, 19, 6, GEM_BY_ID.kohinoor, t); g.restore(); }
    u.text('STARLIGHT', 192, 49, 21, { metal: true, ls: 5.6, alpha: a, title: true });
    u.text('QUEEN', 192, 73, 21, { metal: true, ls: 8.6, alpha: a, title: true });
    g.save(); g.globalAlpha = a * 0.9; g.fillStyle = '#d9b566';
    { const hw = u.width('Ana & the Mountain of Light', 9.5, { italic: true }) / 2 + 7, th = Math.max(1, s * 0.35); g.fillRect((192 - hw - 40) * s, 97 * s, 40 * s, th); g.fillRect((192 + hw) * s, 97 * s, 40 * s, th); } g.restore();
    u.text('Ana & the Mountain of Light', 192, 96.5, 9.5, { color: '#eef2ff', italic: true, alpha: a });
    const b = clamp((t - 60) / 40, 0, 1), vn = Object.keys(Game.vault).length;
    { const cy = (118 + this.rows * 6.5) * s, gr = g.createRadialGradient(192 * s, cy, 0, 192 * s, cy, 96 * s); gr.addColorStop(0, 'rgba(6,9,25,0.72)'); gr.addColorStop(0.55, 'rgba(6,9,25,0.5)'); gr.addColorStop(1, 'rgba(6,9,25,0)'); g.save(); g.globalAlpha = b; g.translate(0, cy); g.scale(1, 0.34); g.translate(0, -cy); g.fillStyle = gr; g.fillRect(0, cy - 110 * s, W * s, 220 * s); g.restore();
      const bg = g.createLinearGradient(0, (H - 30) * s, 0, H * s); bg.addColorStop(0, 'rgba(4,6,26,0)'); bg.addColorStop(0.6, 'rgba(4,6,26,0.8)'); bg.addColorStop(1, 'rgba(4,6,26,0.92)'); g.save(); g.globalAlpha = b; g.fillStyle = bg; g.fillRect(0, (H - 30) * s, W * s, 30 * s); g.restore(); }
    this.items.forEach((it, i) => {
      const on = i === this.sel, y = 122 + i * 13;
      if (it === 'download') return;
      const label = it === 'new' ? (Game.saved ? 'New journey' : 'Begin the journey') : it === 'continue' ? `Continue  ·  ${Game.saved.oz ? 'Australia' : MAP_NAMES[Game.saved.region || 0]}` : `The windowsill  ·  ${vn} of ${GEMS.length} diamonds`;
      u.text(label, 192, y, on ? 10 : 8.4, { color: on ? '#ffe9a8' : '#aab3d4', alpha: b * (on ? 1 : 0.8) });
      if (on) { const hw = u.width(label, 10) / 2 + 8, d = 1.7 + 0.3 * Math.sin(t * 0.12); g.save(); g.globalAlpha = b; g.fillStyle = '#f3d384'; for (const sx of [-1, 1]) { g.save(); g.translate((192 + sx * hw) * s, y * s); g.rotate(Math.PI / 4); g.fillRect(-d * s / 2, -d * s / 2, d * s, d * s); g.restore(); } g.restore(); }
    });
    if (this.canSave) { // the game to keep: a button of its own, the brightest thing under the name
      const on = this.items[this.sel] === 'download', bw = 180, bh = 25, bx = 192 - bw / 2, by = 171.5, pulse = 0.5 + 0.5 * Math.sin(t * 0.07), cx = bx + 15, cy = by + bh / 2;
      g.save(); g.globalAlpha = b; const r = 5 * s;
      g.beginPath(); if (g.roundRect) g.roundRect(bx * s, by * s, bw * s, bh * s, r); else g.rect(bx * s, by * s, bw * s, bh * s);
      g.shadowColor = `rgba(255,214,120,${0.35 + 0.3 * pulse + (on ? 0.3 : 0)})`; g.shadowBlur = (7 + 5 * pulse) * s;
      const bg = g.createLinearGradient(0, by * s, 0, (by + bh) * s); bg.addColorStop(0, on ? '#fff0b8' : '#f3d384'); bg.addColorStop(1, on ? '#eec25e' : '#d9a94e'); g.fillStyle = bg; g.fill();
      g.shadowColor = 'transparent'; g.strokeStyle = on ? '#ffffff' : 'rgba(255,246,214,0.8)'; g.lineWidth = Math.max(1, s * (on ? 0.7 : 0.4)); g.stroke();
      // the arrow coming down into a tray
      g.strokeStyle = '#1a1430'; g.lineWidth = 1.5 * s; g.lineCap = 'round'; g.lineJoin = 'round'; const dy = 1.2 * Math.sin(t * 0.07);
      g.beginPath(); g.moveTo(cx * s, (cy - 6.5 + dy) * s); g.lineTo(cx * s, (cy + 1.6 + dy) * s); g.moveTo((cx - 3.6) * s, (cy - 2 + dy) * s); g.lineTo(cx * s, (cy + 1.8 + dy) * s); g.lineTo((cx + 3.6) * s, (cy - 2 + dy) * s);
      g.moveTo((cx - 6) * s, (cy + 3.4) * s); g.lineTo((cx - 6) * s, (cy + 6.4) * s); g.lineTo((cx + 6) * s, (cy + 6.4) * s); g.lineTo((cx + 6) * s, (cy + 3.4) * s); g.stroke();
      g.restore();
      u.text('DOWNLOAD THE GAME', 192 + 12, by + 9.4, 8.6, { color: '#1a1430', ls: 1.6, title: true, alpha: b, shadow: false });
      u.text('one file  ·  plays on a laptop with no internet', 192 + 12, by + 18.6, 6.4, { color: '#3a2c48', italic: true, alpha: b, shadow: false });
    }
    if (this.saveNote && t - this.saveT < 600) u.text(this.saveNote, 192, 122 + this.rows * 13 + 4, 7, { color: '#fff3c4', halo: 'rgba(6,9,25,0.85)', alpha: b * clamp((600 - (t - this.saveT)) / 60, 0, 1), italic: true });
    else if (Game.best) u.text(`Finest journey  ·  ${Game.best.carat.toFixed(1)} ct  ·  ${Game.best.colour} colour  ·  ${Game.best.clarity[0]}  ·  ${Game.best.cut} cut`, 192, 122 + this.rows * 13 + 4, 6.6, { color: '#d9b566', alpha: b, italic: true });
    u.text(Input.touch ? 'TAP TO CHOOSE' : '↑ ↓  CHOOSE   ·   ENTER  BEGIN   ·   M  SOUND ' + (Sound.muted ? 'OFF' : 'ON') + '   ·   G  FULLSCREEN', 192, 208.5, Input.touch ? 6.2 : 5, { color: '#cfd5ea', alpha: b * 0.85, ls: 1.4, title: true });
  }
};

/* ---------- Another way in (hidden): begin from any land, keeping whatever has been found ---------- */
const PLACES = [
  { name: 'Kaamos', note: 'Finland, where the road begins' },
  { name: 'The Manic Lands', note: 'Sweden', theme: 'meads', col: 3 },
  { name: 'The Iron Deeps', note: 'Kiruna', theme: 'halls', col: 3 },
  { name: 'The Western Sea', note: 'two rafts, and a whale', theme: 'sea', col: 9 },
  { name: 'Red Rock Country', note: 'the United States', theme: 'canyon', col: 3 },
  { name: 'Australia', note: 'through the tear, where it is already tomorrow', mark: 'ozArrive' },
  { name: 'The Hoarder’s Mesa', note: 'where the summer is kept', theme: 'gloam', col: 3 },
  { name: 'The Hoarder King', note: 'at his door', theme: 'gloam', col: 172 },
  { name: 'Past the King', note: 'the stone is hers; somebody is singing', after: true }
];
Scenes.list.places = {
  noBloom: true,
  enter() {
    this.t = 0; this.sel = 0; Game.loadSave();
    const L = buildWorld(), rows = L.rows;
    const ground = (cx) => { let cy = rows - 1; if (L.grid[cy][cx] !== '#') return null; while (cy > 0 && L.grid[cy - 1][cx] === '#') cy--; return { x: cx * T + 8, y: cy * T }; };
    for (const pl of PLACES) {
      if (pl.mark) pl.cp = L.marks[pl.mark];
      else if (pl.after) pl.cp = { x: L.arena.x1 - 30, y: L.arena.floor };
      else if (pl.theme) { const z = L.zones.find(q => q.theme === pl.theme), cx = Math.round(z.x0 / T) + pl.col; pl.cp = ground(cx) || ground(cx + 1) || ground(cx + 2); }
      else pl.cp = null;
    }
  },
  start(pl) {
    if (Game.saved) Game.resume(); else Game.newGame(); // what has been found on this journey comes along
    Game.cp = pl.cp ? { x: pl.cp.x, y: pl.cp.y } : null;
    if (pl.after) { Game.bossDown = true; Game.gems.kohinoor = 1; }
    Game.seen.hello = 1; Game.save(); Sound.sfx('confirm'); Scenes.go('play', { resume: true });
  },
  update(busy) {
    this.t++;
    if (busy) return;
    const n = PLACES.length;
    if (Input.hit('up')) { this.sel = (this.sel + n - 1) % n; Sound.sfx('select'); }
    if (Input.hit('dn')) { this.sel = (this.sel + 1) % n; Sound.sfx('select'); }
    if (Input.hit('pause') || Input.hit('travel') || Input.hit('quit')) { Scenes.go('title'); return; }
    if (Input.hit('enter') && this.t > 20) {
      if (Input.hit('tap')) { const k = Math.round((Input.tapY - 62) / 14); if (k < 0 || k >= n) { if (Input.tapY < 44) Scenes.go('title'); return; } if (k !== this.sel) { this.sel = k; Sound.sfx('select'); return; } }
      this.start(PLACES[this.sel]);
    }
  },
  draw(c) { Vista.draw(c, this.t, false, 0); c.fillStyle = 'rgba(5,7,20,0.8)'; c.fillRect(0, 0, W, H); },
  drawHi(u) {
    const g = u.ctx, s = u.s, t = this.t, a = clamp(t / 30, 0, 1);
    u.text('ANOTHER WAY IN', 192, 22, 12, { metal: true, title: true, ls: 6, alpha: a });
    u.text(Game.saved ? 'Begin from any land. What you have found comes with you.' : 'Begin from any land.', 192, 37, 7.4, { color: '#a9b4d0', italic: true, alpha: a });
    u.rule(192, 47, 110, '#c8a860', a);
    PLACES.forEach((pl, i) => {
      const on = i === this.sel, y = 62 + i * 14;
      u.text(pl.name, 186, y, on ? 9.6 : 8.6, { color: on ? '#ffe9a8' : '#c3cdee', align: 'right', alpha: a * (on ? 1 : 0.85) });
      u.text(pl.note, 198, y + 0.4, 7, { color: on ? '#e6dcc0' : '#8f9cc0', align: 'left', italic: true, alpha: a * (on ? 1 : 0.8) });
      if (on) { const d = 1.7 + 0.3 * Math.sin(t * 0.12); g.save(); g.globalAlpha = a; g.fillStyle = '#f3d384'; g.translate(192 * s, y * s); g.rotate(Math.PI / 4); g.fillRect(-d * s / 2, -d * s / 2, d * s, d * s); g.restore(); }
    });
    u.text(Input.touch ? 'TAP A LAND, THEN TAP IT AGAIN   ·   TAP THE TITLE TO RETURN' : '↑ ↓  CHOOSE   ·   ENTER  BEGIN THERE   ·   ESC  RETURN', 192, 204, 5, { color: '#98a6cc', ls: 1.2, title: true, alpha: a });
  }
};

/* ---------- Prologue ---------- */
const PROLOGUE = [
  { s: 'Far in the north is a small town called Kaamos: the long dark. The old people say elves lived here once, and went west over the sea. Every house still leaves one window unshuttered, in case.' },
  { s: 'Ana grew up at the last fence, looking at the place where the road stops being Kaamos and becomes everywhere else. Nothing ever came down it for her.' },
  { s: 'Then came the winter that did not end. A king in the west had shut the world’s light inside its great diamonds, and dropped most of them on the long way home. The sun rose thin as a coin and warmed nothing.', fx: 'gems' },
  { s: '“The summer is in those stones,” said the Tonttu, who kept her house. “All of it. Somebody will have to fetch every one, and let the light out.”' },
  { s: 'Ana held out her hand, the way you would to see if it was snowing. Starlight came down into it like a bird that had been waiting for her to stand still.' },
  { s: '“Well,” said the Tonttu. “That explains the ears. Your boots are by the door. They have been by the door for years.”' }
];
// Shared by the prologue and the epilogue: one card at a time, and nothing moves on until the reader does.
const Cards = {
  step(sc, n) { // returns 'next' past the last card, 'skip', or null
    sc.pt++;
    if (Input.hit('pause')) return 'skip';
    if (Input.touch && Input.hit('tap') && Input.tapX > 330 && Input.tapY < 26) return 'skip';
    if ((Input.hit('left') || Input.hit('left2')) && sc.i > 0) { sc.i--; sc.pt = 12; Sound.sfx('select'); return null; }
    if ((Input.hit('enter') || Input.hit('right') || Input.hit('right2')) && sc.pt > 18) {
      if (sc.i >= n - 1) return 'next';
      sc.i++; sc.pt = 0; Sound.sfx('select');
    }
    return null;
  },
  hint(u, sc, n, y) {
    const g = u.ctx, s = u.s, a = clamp((sc.pt - 50) / 30, 0, 1);
    for (let k = 0; k < n; k++) { g.save(); g.translate((192 - (n - 1) * 3.5 + k * 7) * s, y * s); g.rotate(Math.PI / 4); g.fillStyle = k === sc.i ? '#f3d384' : k < sc.i ? 'rgba(243,211,132,0.45)' : 'rgba(200,210,240,0.22)'; const d = (k === sc.i ? 2.2 : 1.5) * s; g.fillRect(-d / 2, -d / 2, d, d); g.restore(); }
    if (Input.touch) { u.text('TAP TO GO ON', 192, y + 8, 6.2, { color: '#cfd5ea', alpha: a * (0.55 + 0.3 * Math.sin(sc.t * 0.08)), ls: 1.4, title: true }); u.text('SKIP', 362, 12, 6.2, { color: '#cfd5ea', alpha: 0.6, ls: 1.4, title: true }); }
    else u.rich('[ENTER]  go on        [←]  back        [ESC]  skip', 192, y + 9, 5, { color: '#aeb9d6', alpha: 0.35 + 0.5 * a });
  }
};
Scenes.list.intro = {
  noBloom: true,
  enter() { this.t = 0; this.i = 0; this.pt = 0; Sound.music('title'); },
  update(busy) {
    this.t++;
    if (busy) return;
    const r = Cards.step(this, PROLOGUE.length);
    if (r) { Sound.sfx('confirm'); Scenes.go('map'); }
  },
  draw(c) {
    const t = this.t, card = PROLOGUE[this.i], fx = card.fx;
    Vista.draw(c, t, false, 0); // the establishing shot: Kaamos under the aurora
    c.fillStyle = 'rgba(3,5,16,0.42)'; c.fillRect(0, 0, W, H);
    if (fx === 'gems') { // the great stones, drawn west across the sky
      const k0 = clamp((this.pt - 20) / 260, 0, 1);
      for (let i = 0; i < 7; i++) {
        const k = clamp(k0 * 1.6 - i * 0.09, 0, 1); if (k <= 0 || k >= 1) continue;
        const x = 400 - k * 440, y = 112 + i * 3 - Math.sin(k * Math.PI) * (22 + i * 3), gem = GEMS[5 + i] || GEMS[11];
        { const gr = c.createLinearGradient(x, 0, x + 30, 0); gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.strokeStyle = gr; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30, y + 3); c.stroke(); }
        Paint.soft(c, x, y, 10, gem.tint, 0.6); drawGemHi(c, x, y, 3.6, gem, t);
      }
      Paint.soft(c, 0, 120, 70 * k0, '#ff3a10', 0.4);
    }
  },
  drawHi(u) {
    const g = u.ctx, s = u.s, a = clamp(this.pt / 34, 0, 1), card = PROLOGUE[this.i];
    const lines = u.wrap(card.s, 296, 11, { italic: true }), lh = 15.5, cy = 68;
    { const gr = g.createRadialGradient(192 * s, cy * s, 0, 192 * s, cy * s, 190 * s); gr.addColorStop(0, 'rgba(3,5,18,0.78)'); gr.addColorStop(0.6, 'rgba(3,5,18,0.5)'); gr.addColorStop(1, 'rgba(3,5,18,0)'); g.save(); g.translate(0, cy * s); g.scale(1, 0.42); g.translate(0, -cy * s); g.fillStyle = gr; g.fillRect(0, (cy - 200) * s, W * s, 400 * s); g.restore(); }
    lines.forEach((ln, k) => u.text(ln, 192, cy + (k - (lines.length - 1) / 2) * lh + (1 - a) * 3, 11, { color: '#f2f5ff', alpha: a, italic: true }));
    Cards.hint(u, this, PROLOGUE.length, 197);
  }
};

/* ---------- Map ---------- */
const MAP_NODES = [[326, 150], [262, 108], [192, 138], [126, 100], [62, 124]];
Scenes.list.map = {
  enter() { this.t = 0; this.to = Game.region || 0; Sound.music('title'); Sound.duck(false); Sound.setRate(1); if (!this.tex) this.tex = this.parchment(); },
  parchment() {
    const [cv, g] = mk(768, 432), r = rng(42);
    g.fillStyle = '#dcc79a'; g.fillRect(0, 0, 768, 432);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,84,40' : '255,240,200'},${r() * 0.09})`; const s = 1 + r() * 5; g.fillRect(r() * 768, r() * 432, s, s * (0.4 + r())); }
    for (let i = 0; i < 9; i++) { const x = r() * 768, y = r() * 432, rad = 30 + r() * 80; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(140,96,44,0.12)'); gr.addColorStop(1, 'rgba(140,96,44,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    const v = g.createRadialGradient(384, 216, 150, 384, 216, 470); v.addColorStop(0, 'rgba(90,50,10,0)'); v.addColorStop(1, 'rgba(70,36,8,0.62)');
    g.fillStyle = v; g.fillRect(0, 0, 768, 432);
    return cv;
  },
  pos(k) {
    const i = Math.min(MAP_NODES.length - 2, Math.floor(k)), f = k - i, a = MAP_NODES[i], b = MAP_NODES[i + 1];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + (i % 2 ? -16 : 16);
    return [(1 - f) * (1 - f) * a[0] + 2 * f * (1 - f) * mx + f * f * b[0], (1 - f) * (1 - f) * a[1] + 2 * f * (1 - f) * my + f * f * b[1]];
  },
  update(busy) {
    this.t++;
    if (busy) return;
    if (this.t === 40) Sound.sfx('lantern');
    if (Input.hit('enter') && this.t > 50) { Sound.sfx('confirm'); Scenes.go('play', { resume: true }); }
  },
  draw(c) { c.fillStyle = '#1a1208'; c.fillRect(0, 0, W, H); },
  drawHi(u) {
    const g = u.ctx, s = u.s, t = this.t, ink = '#4a3018';
    g.save(); g.imageSmoothingEnabled = true; g.drawImage(this.tex, 0, 0, W * s, H * s); g.scale(s, s);
    g.strokeStyle = ink; g.fillStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = 1.2; g.strokeRect(8, 8, W - 16, H - 16); g.lineWidth = 0.4; g.strokeRect(11, 11, W - 22, H - 22);
    const r = rng(7);
    g.lineWidth = 0.6;
    // Finland: spruce and lakes
    for (let i = 0; i < 26; i++) { const x = 296 + r() * 64, y = 116 + r() * 62; if (Math.hypot(x - 326, y - 150) < 9) continue; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x, y - 4); g.moveTo(x - 3, y + 2); g.lineTo(x, y - 2); g.lineTo(x + 3, y + 2); g.moveTo(x - 2, y - 1); g.lineTo(x, y - 4); g.lineTo(x + 2, y - 1); g.stroke(); }
    // the gulf
    g.lineWidth = 0.5; for (let i = 0; i < 11; i++) { const x = 286 + Math.sin(i * 0.8) * 5, y = 50 + i * 13; g.beginPath(); g.moveTo(x - 5, y); g.quadraticCurveTo(x - 2.5, y - 2.5, x, y); g.quadraticCurveTo(x + 2.5, y + 2.5, x + 5, y); g.stroke(); }
    // Sweden: meadow trees
    g.lineWidth = 0.6; for (let i = 0; i < 26; i++) { const x = 232 + r() * 44, y = 80 + r() * 60; if (Math.hypot(x - 262, y - 108) < 9) continue; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x, y); g.stroke(); g.beginPath(); g.arc(x, y - 2.2, 2.6, 0, TAU); g.stroke(); }
    // Kiruna: mountains
    for (let i = 0; i < 13; i++) {
      const x = 176 + r() * 34 + Math.sin(i) * 5, y = 62 + i * 9, hgt = 9 + r() * 6;
      if (Math.abs(y - 134) < 9 && Math.abs(x - 192) < 12) continue;
      g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - hgt * 0.8, y + hgt * 0.5); g.lineTo(x, y - hgt * 0.6); g.lineTo(x + hgt * 0.8, y + hgt * 0.5); g.stroke();
      g.lineWidth = 0.35; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + k * 1.6, y - hgt * 0.6 + k * 2.6); g.lineTo(x + k * 1.6 + 1.5, y + hgt * 0.5); g.stroke(); }
    }
    // the western sea
    g.lineWidth = 0.5; for (let i = 0; i < 12; i++) { const x = 158 + Math.sin(i * 1.3) * 6, y = 44 + i * 12.5; g.beginPath(); g.moveTo(x - 6, y); g.quadraticCurveTo(x - 3, y - 3, x, y); g.quadraticCurveTo(x + 3, y + 3, x + 6, y); g.stroke(); }
    g.beginPath(); g.moveTo(152, 124); g.lineTo(162, 124); g.lineTo(160, 128); g.lineTo(154, 128); g.closePath(); g.moveTo(157, 124); g.lineTo(157, 115); g.lineTo(162, 122); g.stroke();
    // America: mesas
    g.lineWidth = 0.7; for (let i = 0; i < 9; i++) { const x = 100 + r() * 46, y = 70 + r() * 62, wd = 6 + r() * 6; if (Math.hypot(x - 126, y - 100) < 12) continue; g.beginPath(); g.moveTo(x - wd - 2, y + 4); g.lineTo(x - wd, y - 3); g.lineTo(x + wd, y - 3); g.lineTo(x + wd + 2, y + 4); g.stroke(); g.lineWidth = 0.35; g.beginPath(); g.moveTo(x - wd + 1, y); g.lineTo(x + wd - 1, y); g.stroke(); g.lineWidth = 0.7; }
    // the Hoarder's mesa
    g.lineWidth = 0.9; g.beginPath(); g.moveTo(40, 118); g.lineTo(48, 92); g.lineTo(76, 92); g.lineTo(84, 118); g.stroke();
    g.beginPath(); g.moveTo(58, 92); g.lineTo(58, 80); g.lineTo(60, 84); g.lineTo(62, 78); g.lineTo(64, 84); g.lineTo(66, 80); g.lineTo(66, 92); g.stroke();
    g.lineWidth = 0.4; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(70 + k * 2, 94 + k * 2); g.lineTo(71 + k * 2, 117); g.stroke(); }
    // compass
    g.save(); g.translate(346, 44); g.lineWidth = 0.5; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.stroke();
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -15); g.lineTo(2.4, 0); g.lineTo(-2.4, 0); g.closePath(); k % 2 ? g.stroke() : g.fill(); }
    g.restore();
    // road
    g.strokeStyle = '#8a2c1c'; g.lineWidth = 1.1; g.setLineDash([3, 2.5]);
    g.beginPath(); for (let k = 0; k <= (MAP_NODES.length - 1) * 20; k++) { const [x, y] = this.pos(k / 20); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.setLineDash([]);
    MAP_NODES.forEach(([x, y], i) => {
      g.fillStyle = '#dcc79a'; g.strokeStyle = ink; g.lineWidth = 0.9; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); g.stroke();
      if (i < this.to) { const f = Math.sin(t * 0.25 + i) * 0.6; g.fillStyle = '#e8651a'; g.beginPath(); g.moveTo(x - 2.4, y); g.quadraticCurveTo(x - 2.6, y - 4, x + f * 0.5, y - 7.5 - f); g.quadraticCurveTo(x + 2.8, y - 4, x + 2.4, y); g.fill(); g.fillStyle = '#ffd060'; g.beginPath(); g.arc(x, y - 1.6, 1.4, 0, TAU); g.fill(); }
    });
    g.restore();
    u.text('N', 346, 23, 6.5, { color: ink, shadow: false, title: true });
    u.text('THE ROAD WEST', 192, 25, 12, { color: ink, ls: 5, shadow: false, title: true });
    u.text('from Kaamos, after the summer', 192, 37, 6.8, { color: '#6a4a28', italic: true, shadow: false });
    const lbl = [['Kaamos', 'FINLAND', 350, 150], ['The Manic Lands', 'SWEDEN', 262, 84], ['Iron Deeps', 'KIRUNA', 192, 152], ['Red Rock Country', 'UNITED STATES', 126, 76], ['The Hoarder’s Mesa', '', 62, 137]];
    lbl.forEach(([a, b, x, y], i) => {
      const lw = Math.max(u.width(a, 7.2, { italic: true }), b ? u.width(b, 5, { title: true }) + b.length * 0.8 : 0) + 8;
      u.panel(x - lw / 2, y - 5.5, lw, b ? 18 : 11, 0.88, '#dcc79a');
      u.text(a, x, y, 7.2, { color: i <= this.to ? ink : '#7a6240', italic: true, shadow: false });
      if (b) u.text(b, x, y + 8, 5, { color: i <= this.to ? '#6a4a28' : '#8a7250', shadow: false, ls: 0.8, title: true });
    });
    const [mx, my] = MAP_NODES[this.to];
    g.save(); g.imageSmoothingEnabled = false; g.shadowColor = '#fff8d0'; g.shadowBlur = 6 * s;
    g.scale(s, s); Paint.figure(g, mx, my - 3 + Math.sin(t * 0.08), { face: -1, t, scale: 1.1 });
    g.restore();
    const a = clamp((t - 30) / 40, 0, 1);
    u.plate(82, 172, 220, 32, 0.95 * a);
    u.text(MAP_NAMES[this.to], 192, 181.5, 9.4, { color: '#f6e2a0', alpha: a, title: true, ls: 1 });
    u.text(`${Object.keys(Game.gems).length} of ${GEMS.length} diamonds   ·   ${Game.carats().toFixed(2)} carats carried`, 192, 190.5, 6.4, { color: '#e6dcc0', italic: true, alpha: a });
    u.text(Input.touch ? 'TAP TO SET FORTH' : 'ENTER TO SET FORTH', 192, 198.5, 5.4, { color: '#f0d896', alpha: a * (0.85 + 0.15 * Math.sin(t * 0.1)), ls: 1.2, title: true });
  }
};

function touchKeys(t) { // on a phone the same hints name the on-screen buttons
  if (!Input.touch) return t;
  return t.replace(/\[←\] \[→\]/g, '◀ ▶').replace(/\[SPACE\]/g, '▲').replace(/\[X\]/g, '✦').replace(/— \[E\] —/g, '— ☼ —').replace(/\[E\]/g, '☼').replace(/\[↓\]/g, '▼');
}
/* ---------- Play ---------- */
Scenes.list.play = {
  enter(a) { this.paused = false; World.load(a.respawn || a.resume ? Game.cp : (Game.cp = null)); if (a.god) World.god = true; },
  update(busy) {
    const w = World;
    if (busy) { if (w.player.dead || w.state === 'clear') w.update(); return; }
    if (Input.hit('pause') && w.state === 'play' && !w.player.dead && !w.card && !w.gemFx) { this.paused = !this.paused; this.armR = false; this.psel = 0; Sound.duck(this.paused); Sound.sfx('select'); return; }
    if (this.paused) {
      if (Input.hit('up')) { this.psel = ((this.psel || 0) + 3) % 4; this.armR = false; Sound.sfx('select'); }
      if (Input.hit('dn')) { this.psel = ((this.psel || 0) + 1) % 4; this.armR = false; Sound.sfx('select'); }
      let pick = Input.hit('restart') ? 1 : Input.hit('quit') ? 3 : Input.hit('enter') && !Input.hit('tap') ? (this.psel || 0) : -1;
      if (Input.hit('tap')) { const k = Math.round((Input.tapY - 96) / 14); if (k >= 0 && k < 4 && Math.abs(Input.tapX - 192) < 110) pick = k; }
      if (pick === 0) { this.paused = false; this.armR = false; Sound.duck(false); }
      else if (pick === 1) { if (this.armR) Scenes.go('play', { respawn: true }); else { this.armR = true; Sound.sfx('select'); } }
      else if (pick === 2) { Sound.toggleMute(); }
      else if (pick === 3) { Game.save(); Scenes.go('title'); }
      return;
    }
    if (!Game.seen.hello && w.state === 'play' && w.introT <= 0 && !w.fight) { Game.seen.hello = 1; w.toast(touchKeys('[←] [→]  walk      [SPACE]  leap'), true); }
    w.update();
  },
  draw(c) { World.draw(c); },
  drawHi(u) {
    const w = World, z = w.introZone;
    if (w.introT > 0 && z && w.state === 'play' && !w.card && !w.gemFx && !w.signText && !w.wonderCard && !w.warpFx) {
      const a = clamp(w.introT / 40, 0, 1) * clamp((180 - w.introT) / 30, 0, 1);
      { const gr = u.ctx.createLinearGradient(0, 34 * u.s, 0, 114 * u.s); gr.addColorStop(0, 'rgba(6,8,20,0)'); gr.addColorStop(0.5, `rgba(6,8,20,${0.42 * a})`); gr.addColorStop(1, 'rgba(6,8,20,0)'); u.ctx.fillStyle = gr; u.ctx.fillRect(0, 34 * u.s, W * u.s, 80 * u.s); }
      u.text(z.title.toUpperCase(), 192, 68, 16, { metal: true, alpha: a, title: true, ls: 8 });
      u.rule(192, 84, 96, '#c8a860', a);
      u.text(z.sub, 192, 96, 9.5, { color: '#f0e8d0', alpha: a, italic: true });
    }
    const g = u.ctx, s = u.s, showUI = !w.card && !w.gemFx && w.state !== 'clear' && !(w.wonderCard && w.wonderCard.t < 590);
    if (showUI) { // ---- the interface: crisp, quiet, one visual language ----
      const top = g.createLinearGradient(0, 0, 0, 36 * s); top.addColorStop(0, 'rgba(10,14,36,0.62)'); top.addColorStop(1, 'rgba(10,14,36,0)');
      g.fillStyle = top; g.fillRect(0, 0, W * s, 36 * s);
      const heart = (x, y, sz, full, pop) => {
        g.save(); g.translate(x * s, y * s); g.scale(sz * s * (1 + pop * 0.25) / 10, sz * s * (1 + pop * 0.25) / 10);
        g.beginPath(); g.moveTo(0, 3.6); g.bezierCurveTo(-1.2, -1.4, -6, -1.6, -6, 1.6); g.bezierCurveTo(-6, 5, -1.6, 7, 0, 9.4); g.bezierCurveTo(1.6, 7, 6, 5, 6, 1.6); g.bezierCurveTo(6, -1.6, 1.2, -1.4, 0, 3.6); g.closePath();
        if (full) { g.fillStyle = '#c4f6e2'; g.shadowColor = 'rgba(4,8,24,0.7)'; g.shadowBlur = 3; g.fill(); g.shadowColor = 'transparent'; }
        else { g.fillStyle = 'rgba(6,10,26,0.5)'; g.fill(); g.strokeStyle = 'rgba(196,246,226,0.8)'; g.lineWidth = 0.9; g.stroke(); }
        g.restore();
      };
      w.players.forEach((p, k) => {
        const y = 7 + k * 21;
        for (let i = 0; i < MAXHP; i++) heart(12 + i * 11, y, 8, i < p.hp, i === p.hp - 1 && p.inv > 116 ? 1 : 0);
        for (let i = 0; i < 3; i++) { const on = i < p.arrows; g.save(); g.translate((10 + i * 7.5) * s, (y + 15.5) * s); g.rotate(Math.PI / 4); g.fillStyle = on ? '#dffbff' : 'rgba(223,251,255,0.22)'; if (on) { g.shadowColor = '#7fd8ff'; g.shadowBlur = 3 * s; } g.fillRect(-1.9 * s, -1.9 * s, 3.8 * s, 3.8 * s); g.restore(); }
        if (p.arrows < 3) { g.fillStyle = 'rgba(223,251,255,0.25)'; g.fillRect(31 * s, (y + 15) * s, 11 * s, s); g.fillStyle = '#dffbff'; g.fillRect(31 * s, (y + 15) * s, 11 * s * p.arrowT / 48, s); }
        { // the lantern's starlight
          const lx = 48, ly = y + 15.5, full = p.lum / 100;
          g.save(); g.translate(lx * s, ly * s); g.fillStyle = p.lumOut ? 'rgba(223,242,255,0.3)' : '#ffffff'; if (p.lit) { g.shadowColor = '#bfe4ff'; g.shadowBlur = 5 * s; }
          g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU - Math.PI / 2, r = (i % 2 ? 1 : 2.8) * s; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.restore();
          g.fillStyle = 'rgba(223,242,255,0.22)'; g.fillRect((lx + 5) * s, (ly - 0.5) * s, 20 * s, s);
          g.fillStyle = p.lumOut ? '#8a96b8' : '#dff2ff'; g.fillRect((lx + 5) * s, (ly - 0.5) * s, 20 * s * full, s);
        }
        if (p.radiant > 0) { g.fillStyle = 'rgba(255,246,176,0.25)'; g.fillRect(6 * s, (y + 19.5) * s, 34 * s, s); g.fillStyle = '#fff6b0'; g.fillRect(6 * s, (y + 19.5) * s, 34 * s * p.radiant / 600, s); }
      });
      const pop = w.hudPop > 0 ? w.hudPop / 8 : 0;
      g.save(); g.scale(s, s); drawGemHi(g, W - 12, 9.5, 4.2, GEM_BY_ID.kohinoor, w.t); g.restore();
      u.text(`${Object.keys(Game.gems).length} / ${GEMS.length}`, W - 20, 9.8, 7.4, { color: '#fff3c4', align: 'right', title: true });
      g.save(); g.translate((W - 12) * s, 23 * s); g.rotate(Math.PI / 4); g.fillStyle = '#bff4ff'; g.shadowColor = '#7fd8ff'; g.shadowBlur = 3 * s; const dd = (2.6 + pop * 1.4) * s; g.fillRect(-dd / 2, -dd / 2, dd, dd); g.restore();
      u.text(String(Game.melee), W - 20, 23.2, 7.4 + pop * 1.5, { color: pop ? '#ffffff' : '#dffbff', align: 'right', title: true });
      if (w.fight && w.boss && !w.boss.dead && w.boss.st !== 'intro') {
        const bw = 170, x = (W - bw) / 2, y = 15, k = Math.max(0, w.boss.hp / w.boss.max), vul = ENT.boss.vulnerable(w.boss);
        g.fillStyle = 'rgba(4,5,14,0.75)'; g.beginPath(); g.roundRect ? g.roundRect((x - 1) * s, (y - 1) * s, (bw + 2) * s, 5 * s, 2.5 * s) : g.rect((x - 1) * s, (y - 1) * s, (bw + 2) * s, 5 * s); g.fill();
        const gr = g.createLinearGradient(x * s, 0, (x + bw) * s, 0); gr.addColorStop(0, vul ? '#fff6c8' : '#ff8a3a'); gr.addColorStop(1, vul ? '#f3d384' : '#d8341c');
        g.fillStyle = gr; g.beginPath(); g.roundRect ? g.roundRect(x * s, y * s, Math.max(3, bw * k) * s, 3 * s, 1.5 * s) : g.rect(x * s, y * s, bw * k * s, 3 * s); g.fill();
        g.strokeStyle = 'rgba(217,179,106,0.7)'; g.lineWidth = Math.max(1, s * 0.3); g.beginPath(); g.roundRect ? g.roundRect((x - 1) * s, (y - 1) * s, (bw + 2) * s, 5 * s, 2.5 * s) : g.rect((x - 1) * s, (y - 1) * s, (bw + 2) * s, 5 * s); g.stroke();
        u.text('THE HOARDER KING', 192, y - 6.5, 5.4, { color: '#f3d384', ls: 1.8, title: true });
      }
    }
    // dialogue: eases in and out, speaker set apart, keys shown as keycaps
    const wc = w.wonderCard && w.state === 'play' && !w.card && !w.gemFx && !this.paused ? w.wonderCard : null;
    if (wc) { // a wonder: the frame narrows like a film's, it is named once in gold, and then it is left alone
      const a = clamp(wc.t / 36, 0, 1) * clamp((600 - wc.t) / 50, 0, 1), ease = 1 - (1 - a) * (1 - a), lines = u.wrap(wc.def.line, 340, 8.6, { italic: true });
      const up = Input.touch, th = (31 + (up ? lines.length * 11 + 3 : 0)) * ease, bh = (up ? 9 : 13 + lines.length * 11) * ease, hair = Math.max(1, s * 0.4); // on touch the words go up top, clear of the buttons
      u.panel(0, 0, W, th, 0.9, '#04050d'); u.panel(0, H - bh, W, bh + 1, 0.9, '#04050d');
      g.fillStyle = `rgba(214,186,120,${0.55 * a})`; g.fillRect(0, th * s, W * s, hair); g.fillRect(0, (H - bh) * s - hair, W * s, hair);
      const ny = up ? 31 * ease : th;
      u.text(`A WONDER   ·   ${Object.keys(Game.wonders).length} OF ${WONDERS.length}`, 192, ny - 22.5, 5.4, { color: '#d9b566', ls: 1.8, title: true, alpha: a, shadow: false });
      u.text(wc.def.name.toUpperCase(), 192, ny - 10.5, 11.5, { metal: true, title: true, ls: 4, alpha: a });
      lines.forEach((ln, i) => u.text(ln, 192, (up ? ny + 3 : H - bh + 11.5) + i * 11, 8.4, { color: '#f4ecd6', italic: true, alpha: a, shadow: false }));
    }
    const want = w.signText && w.state === 'play' && !this.paused && !w.card && !w.gemFx && !wc;
    if (wc || w.state === 'clear') this.signA = 0;
    if (want) this.signTxt = w.signText;
    this.signA = (this.signA || 0) + ((want ? 1 : 0) - (this.signA || 0)) * 0.22;
    const top = Input.touch, base = top ? 48 : 198; // on a phone the foot of the frame belongs to the thumbs, so words go under the HUD
    const toastOn = w.toastT > 0 && w.state === 'play' && !w.card && !w.gemFx && !this.paused && !wc;
    const veil = Math.max(this.signA > 0.02 && this.signTxt ? this.signA : 0, toastOn ? clamp(w.toastT / 24, 0, 1) : 0);
    if (veil > 0.02) {
      const y0 = top ? 26 : base - 44, y1 = top ? 82 : H, gr = g.createLinearGradient(0, y0 * s, 0, y1 * s);
      if (top) { gr.addColorStop(0, 'rgba(4,6,18,0)'); gr.addColorStop(0.4, `rgba(4,6,18,${0.6 * veil})`); gr.addColorStop(1, 'rgba(4,6,18,0)'); } else { gr.addColorStop(0, 'rgba(4,6,18,0)'); gr.addColorStop(0.8, `rgba(4,6,18,${0.66 * veil})`); gr.addColorStop(1, `rgba(4,6,18,${0.66 * veil})`); }
      g.fillStyle = gr; g.fillRect(0, y0 * s, W * s, (y1 - y0) * s);
    }
    let signTop = base;
    if (this.signA > 0.02 && this.signTxt) { // words on the road: one quiet line at the foot of the frame
      let txt = this.signTxt, who = null;
      if (Input.touch) txt = touchKeys(txt);
      const m = /^(Tonttu|Mayank): /.exec(txt); if (m) { who = m[1]; txt = txt.slice(m[0].length); }
      const lines = txt.split('|'), fs = 8.8, lh = 11.5, a = this.signA, ease = 1 - (1 - a) * (1 - a), y0 = (top ? base + (who ? 6 : 0) : base - (lines.length - 1) * lh) + (1 - ease) * 4;
      if (who) u.text(who.toUpperCase(), 192, y0 - 10, 5.4, { color: '#d9b566', ls: 2, title: true, alpha: a });
      lines.forEach((ln, i) => u.rich(ln, 192, y0 + i * lh, fs, { color: '#f6f1e4', alpha: a, italic: !/\[/.test(ln) }));
      signTop = top ? y0 + lines.length * lh + 2 : y0 - (who ? 28 : 13);
    }
    if (toastOn) {
      const tm = w.toastMax || 240, a = clamp(w.toastT / 24, 0, 1) * clamp((tm - w.toastT) / 12, 0, 1), tl = w.toastText.split('|'), ease = 1 - (1 - a) * (1 - a);
      const ty = (this.signA > 0.3 ? signTop : base) - (top ? 0 : (tl.length - 1) * 11) + (1 - ease) * 4;
      tl.forEach((ln, i) => u.rich(ln, 192, ty + i * 11, i ? 8.2 : 8.6, { color: i ? '#e6dcc0' : '#fff3c4', alpha: a, italic: !/\[/.test(ln) }));
    }
    { // a key, shown above her when the place wants it, instead of a sentence
      const pr = w.prompt && w.state === 'play' && !w.card && !w.gemFx && !this.paused && !wc && !w.warpFx ? w.prompt : null;
      this.prA = (this.prA || 0) + ((pr ? 1 : 0) - (this.prA || 0)) * 0.12; if (pr) this.prK = pr;
      if (this.prA > 0.03 && this.prK) { // "hold", and the key or button to hold, on a small dark tab so it cannot be mistaken for scenery
        const pl = w.player, key = this.prK === 'light' ? (Input.touch ? '☼' : '[E]') : (Input.touch ? '▼' : '[↓]'), a = this.prA, x = pl.x + 5 - w.cam.x, y = pl.y - w.cam.y - 15 + Math.sin(w.t * 0.08) * 1.2, wd = u.width('hold', 6.6, { italic: true }) + 17;
        u.plate(x - wd / 2, y - 6, wd, 12, a * 0.9);
        u.rich('hold  ' + key, x, y, 6.6, { color: '#fff3c4', alpha: a * (0.8 + 0.2 * Math.sin(w.t * 0.1)), italic: true, shadow: false });
      }
      const hint = pr || ''; if (document.body.dataset.hint !== hint) document.body.dataset.hint = hint; // the on-screen button itself pulses
    }
    if (w.fight && w.boss && w.boss.st === 'intro') {
      const a = clamp(w.boss.t0 / 30, 0, 1) * clamp((110 - w.boss.t0) / 20, 0, 1);
      const bar = 14 * clamp(w.boss.t0 / 12, 0, 1) * clamp((112 - w.boss.t0) / 10, 0, 1); u.panel(0, 0, W, bar, 1, '#04050d'); u.panel(0, H - bar, W, bar + 1, 1, '#04050d');
      u.text('THE HOARDER KING', 192, 70, 22 * (1 + 0.4 * clamp(1 - (w.boss.t0 - 30) / 6, 0, 1)), { color: '#ffb070', glow: '#ff3a10', alpha: w.boss.t0 < 30 ? 0 : clamp((110 - w.boss.t0) / 20, 0, 1), title: true, ls: 4 });
      u.text('Thief of the Mountain of Light', 192, 90, 8.5, { color: '#e6c8b0', italic: true, alpha: a });
    }
    if (w.state === 'clear') {
      const a = clamp((w.clearT - 50) / 40, 0, 1), ease = 1 - (1 - a) * (1 - a), th = 31 * ease, bh = 30 * ease, hair = Math.max(1, s * 0.4);
      u.panel(0, 0, W, th, 0.9, '#04050d'); u.panel(0, H - bh, W, bh + 1, 0.9, '#04050d');
      g.fillStyle = `rgba(214,186,120,${0.55 * a})`; g.fillRect(0, th * s, W * s, hair); g.fillRect(0, (H - bh) * s - hair, W * s, hair);
      u.text(w.clearText.toUpperCase(), 192, th - 14, 12, { metal: true, alpha: a, title: true, ls: 4 });
      u.text('Far off, one window in Kaamos answers.', 192, H - bh + 11, 8.8, { color: '#f4ecd6', alpha: clamp((w.clearT - 100) / 40, 0, 1), italic: true, shadow: false });
      u.text(`${Game.carats().toFixed(2)} carats, two travellers, one lantern`, 192, H - bh + 22, 7.4, { color: '#d9c48a', alpha: clamp((w.clearT - 170) / 40, 0, 1), italic: true, shadow: false });
    }
    if (w.card && w.card.t < 22) u.panel(0, 0, W, H, 1 - w.card.t / 22, '#ffffff');
    if (w.card) drawGemCard(u, w.card.gem, w.card.t, clamp(w.card.t / 25, 0, 1), w.card.t > 70 ? (Input.touch ? 'TAP TO CONTINUE' : 'ENTER TO CONTINUE') : '');
    if (this.paused) {
      u.panel(0, 0, W, H, 0.66, '#04050d');
      u.text('THE ROAD WAITS', 192, 60, 15, { metal: true, title: true, ls: 6 });
      u.rule(192, 76, 80, '#c8a860', 1);
      const tt = Input.touch, rows = ['Walk on', this.armR ? 'Again, to confirm' : 'Return to the last lantern', 'Sound  ·  ' + (Sound.muted ? 'off' : 'on'), 'Save and quit to title'];
      rows.forEach((v, i) => {
        const on = i === (this.psel || 0) && !tt, y = 96 + i * 14;
        u.text(v, 192, y, 9.6, { color: on ? '#fff3c4' : '#c3cdee' });
        if (on) { const hw = u.width(v, 9.6) / 2 + 8, gg = u.ctx, ss = u.s; gg.save(); gg.fillStyle = '#f3d384'; for (const sx of [-1, 1]) { gg.save(); gg.translate((192 + sx * hw) * ss, y * ss); gg.rotate(Math.PI / 4); gg.fillRect(-0.9 * ss, -0.9 * ss, 1.8 * ss, 1.8 * ss); gg.restore(); } gg.restore(); }
      });
    }
  }
};

/* ---------- The Windowsill (once the Vault): what came home, set where the light can get at it ---------- */
const GEM_WHERE = ['Finland', 'Finland', 'the Gulf', 'Sweden', 'Sweden', 'Kiruna', 'America', 'America', 'America', 'Australia', 'the Mesa', 'the Mesa', 'the King'];
Scenes.list.vault = {
  enter() {
    this.t = 0; this.sel = 0; this.open = false; Game.loadSave();
    this.items = [];
    GEMS.forEach((gem, i) => this.items.push({ kind: 'gem', def: gem, i, row: i < 7 ? 0 : 1, x: (i < 7 ? 42 : 66) + (i % 7) * 46, y: i < 7 ? 66 : 116 }));
    KEEPS.forEach((k, i) => this.items.push({ kind: 'keep', def: k, i, row: 2, x: 32 + i * 22, y: 171 }));
    WONDERS.forEach((q, i) => this.items.push({ kind: 'wonder', def: q, i, row: 2, x: 220 + i * 22, y: 171 }));
  },
  has(it) { return !!(it.kind === 'gem' ? Game.vault : it.kind === 'keep' ? Game.shelf : Game.sights)[it.def.id]; },
  update(busy) {
    this.t++;
    if (busy) return;
    if (this.open) { if (Input.hit('enter') || Input.hit('pause')) { this.open = false; Sound.sfx('select'); } return; }
    const n = this.items.length, cur = this.items[this.sel];
    const mv = (d) => { this.sel = (this.sel + d + n) % n; Sound.sfx('select'); };
    const rowMove = (d) => { // to whatever sits nearest in the row above or below
      const row = (cur.row + d + 3) % 3; let best = -1, bd = 1e9;
      this.items.forEach((it, k) => { if (it.row === row && Math.abs(it.x - cur.x) < bd) { bd = Math.abs(it.x - cur.x); best = k; } });
      this.sel = best; Sound.sfx('select');
    };
    if (Input.hit('right') || Input.hit('right2')) mv(1);
    if (Input.hit('left') || Input.hit('left2')) mv(-1);
    if (Input.hit('dn')) rowMove(1);
    if (Input.hit('up')) rowMove(-1);
    if (Input.hit('pause') || Input.hit('vault') || Input.hit('quit')) { Scenes.go('title'); return; }
    if (Input.hit('tap')) {
      let best = -1, bd = 1e9; this.items.forEach((it, k) => { const d = Math.hypot(it.x - Input.tapX, (it.y - Input.tapY) * (it.kind === 'gem' ? 0.8 : 1)); if (d < bd) { bd = d; best = k; } });
      if (bd > (this.items[best].kind === 'gem' ? 30 : 13)) { if (Input.tapY < 40) Scenes.go('title'); return; }
      if (best !== this.sel) { this.sel = best; Sound.sfx('select'); return; }
    }
    if (Input.hit('enter') && this.t > 15) { const it = this.items[this.sel]; if (it.kind === 'gem' && this.has(it)) { this.open = true; this.ot = this.t; Sound.sfx('gem'); } else Sound.sfx(this.has(it) ? 'select' : 'empty'); }
  },
  draw(c) { Vista.draw(c, this.t, false, 0); c.fillStyle = 'rgba(5,7,20,0.87)'; c.fillRect(0, 0, W, H); c.fillStyle = Paint.vgrad(c, 138, 150, ['rgba(214,186,120,0)', 'rgba(214,186,120,0.1)']); c.fillRect(0, 138, W, 12); },
  drawHi(u) {
    const g = u.ctx, s = u.s, t = this.t, n = Object.keys(Game.vault).length, cur = this.items[this.sel];
    u.text('THE WINDOWSILL', 192, 17, 12, { metal: true, title: true, ls: 6 });
    u.text(`${n} of ${GEMS.length} diamonds   ·   ${GEMS.reduce((a, q) => a + (Game.vault[q.id] ? q.carat : 0), 0).toFixed(2)} of ${GEM_TOTAL_CT.toFixed(2)} carats`, 192, 29.5, 6.4, { color: '#a9b4d0', italic: true });
    const frame = (x, y, wd, hg) => { g.save(); g.strokeStyle = '#d6ba78'; g.lineWidth = Math.max(1, s * 0.5); g.strokeRect(x * s, y * s, wd * s, hg * s); g.restore(); };
    for (const it of this.items) {
      const has = this.has(it), on = it === cur, x = it.x, y = it.y;
      if (it.kind === 'gem') {
        const gem = it.def, r = 8 + 9 * Math.log10(gem.carat + 1) / Math.log10(531);
        if (on) frame(x - 24, y - 25, 48, 49);
        g.save(); g.scale(s, s);
        if (has) drawGemHi(g, x, y - 5, r, gem, t + it.i * 20);
        else { g.globalAlpha = 0.5; g.strokeStyle = '#3a4466'; g.lineWidth = 0.6; g.setLineDash([1.5, 1.5]); g.beginPath(); gemOutline(gem.shape, 32).forEach((p, k) => { const px = x + p[0] * r, py = y - 5 + p[1] * r; k ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.stroke(); }
        g.restore();
        u.text(has ? `${gem.carat} ct` : '—', x, y + 16, 6, { color: has ? '#fff6dc' : '#6a76a0', title: true });
      } else if (it.kind === 'keep') {
        if (on) frame(x - 9.5, y - 9.5, 19, 19);
        g.save(); g.scale(s, s); g.globalAlpha = has ? 1 : 0.18; Paint.keepsake(g, it.i, x, y, 1.25); g.restore();
      } else {
        if (on) frame(x - 9.5, y - 9.5, 19, 19);
        g.save(); g.translate(x * s, y * s); g.rotate(has ? Math.sin(t * 0.02 + it.i) * 0.12 : 0);
        g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU - Math.PI / 2, rr = (k % 2 ? 2 : 6.5) * s; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath();
        if (has) { g.fillStyle = '#f3d384'; g.shadowColor = '#ffb040'; g.shadowBlur = 5 * s; g.fill(); } else { g.strokeStyle = 'rgba(120,132,172,0.6)'; g.lineWidth = Math.max(1, s * 0.4); g.stroke(); }
        g.restore();
      }
    }
    g.save(); g.fillStyle = 'rgba(214,186,120,0.35)'; g.fillRect(24 * s, 146 * s, 336 * s, Math.max(1, s * 0.4)); g.restore();
    u.text(`KEEPSAKES   ·   ${Object.keys(Game.shelf).length} OF ${KEEPS.length}`, 24, 154.5, 5.4, { color: '#d6ba78', align: 'left', ls: 1.3, title: true });
    u.text(`WONDERS SEEN   ·   ${Object.keys(Game.sights).length} OF ${WONDERS.length}`, 211, 154.5, 5.4, { color: '#d6ba78', align: 'left', ls: 1.3, title: true });
    { // the one in hand
      const has = this.has(cur), d = cur.def, where = cur.kind === 'gem' ? GEM_WHERE[cur.i] : WONDERS[cur.i].where;
      const nm = cur.kind === 'gem' ? d.name : d.name, line = !has ? (cur.kind === 'wonder' ? `Not yet seen. It is out there, in ${where}.` : cur.kind === 'keep' ? `Not yet found. It is out there, in ${where}.` : where === 'the King' ? 'The Hoarder King has it.' : `Not yet found. It is out there, in ${where}.`)
        : cur.kind === 'gem' ? `${d.cut}  ·  ${d.color}  ·  ${d.origin}` : d.line;
      u.text(has ? nm : '—', 192, 187.5, 7.4, { color: has ? '#fff3c4' : '#7884ac', title: true, ls: 0.6 });
      let fs = 6.2, lines = u.wrap(line, 350, fs, { italic: true }); if (lines.length > 2) { fs = 5.6; lines = u.wrap(line, 356, fs, { italic: true }); }
      lines.slice(0, 2).forEach((ln, i) => u.text(ln, 192, 195.5 + i * 7, fs, { color: has ? '#c8d2ee' : '#7884ac', italic: true }));
    }
    u.text(Input.touch ? 'TAP TO CHOOSE   ·   TAP A DIAMOND TWICE TO STUDY IT   ·   TAP THE TITLE TO RETURN' : '← → ↑ ↓  CHOOSE   ·   ENTER  STUDY A DIAMOND   ·   ESC  RETURN', 192, 211, Input.touch ? 5.6 : 5, { color: '#98a6cc', ls: 1.1, title: true });
    if (this.open) drawGemCard(u, cur.def, t, clamp((t - this.ot) / 20, 0, 1), Input.touch ? 'TAP TO CLOSE' : 'ENTER TO CLOSE');
  }
};

/* ---------- Ending ---------- */
const EPILOGUE = [
  { bg: 'mesa', s: 'Under the armour there was hardly anyone. He had only wanted to be warm.' },
  { bg: 'mesa', s: 'The weather had eased with every stone. But the summer itself was still shut inside them. “I know a shore,” said Mayank, “where the sun goes last of all. Let it out there, and it has the whole world to cross.”' },
  { bg: 'kauai', rise: true, s: 'So they carried the diamonds west, over one more sea, to a green island called Kauaʻi. On the sand, at the end of the day, Ana opened her hands.' },
  { bg: 'dawn', s: 'The light went home along her road, and summer followed it. It reached Kaamos by morning. “That is the Starlight Queen,” the Tonttu tells the children. “She is from here.”' },
  { bg: 'kauai', s: '“This,” said Mayank, “is the beginning of a new adventure.”' }
];
Scenes.list.ending = {
  enter() { this.t = 0; this.i = 0; this.pt = 0; this.gt = -1; this.bg = EPILOGUE[0].bg; this.veil = 1; this.riseT = 0; Sound.music('dawn'); Sound.duck(false); Sound.setRate(1); this.g = Game.lastGrade || Game.grade(); },
  update(busy) {
    this.t++;
    { // one painting gives way to the next through a wash of light
      const want = this.gt >= 0 ? 'kauai' : EPILOGUE[this.i].bg;
      if (want !== this.bg) { this.veil = Math.min(1, this.veil + 0.045); if (this.veil >= 1) this.bg = want; } else this.veil = Math.max(0, this.veil - 0.03);
      this.riseT = this.gt < 0 && EPILOGUE[this.i].rise && this.bg === 'kauai' ? this.riseT + 1 : 0;
    }
    if (busy) return;
    if (this.gt >= 0) { this.gt++; if (Input.hit('enter') && this.gt > 150) Scenes.go('title'); return; }
    const r = Cards.step(this, EPILOGUE.length);
    if (r) { this.gt = 0; Sound.sfx('confirm'); }
  },
  draw(c) {
    if (this.bg === 'kauai') Vista.kauai(c, this.t, this.riseT); else if (this.bg === 'mesa') Vista.mesa(c, this.t); else Vista.draw(c, this.t, true, 0);
    if (this.veil > 0.01) { c.fillStyle = `rgba(255,244,214,${this.veil})`; c.fillRect(0, 0, W, H); }
  },
  drawHi(u) {
    if (this.gt < 0) {
      const g = u.ctx, s = u.s, a = clamp(this.pt / 34, 0, 1) * (1 - this.veil), card = EPILOGUE[this.i], lines = u.wrap(card.s, 296, 11, { italic: true }), lh = 15.5, cy = 58, dk = this.bg === 'kauai' ? 0.14 : 0;
      { const gr = g.createRadialGradient(192 * s, cy * s, 0, 192 * s, cy * s, 190 * s); gr.addColorStop(0, `rgba(20,16,50,${0.62 + dk})`); gr.addColorStop(0.6, `rgba(20,16,50,${0.36 + dk})`); gr.addColorStop(1, 'rgba(20,16,50,0)'); g.save(); g.translate(0, cy * s); g.scale(1, 0.42); g.translate(0, -cy * s); g.fillStyle = gr; g.fillRect(0, (cy - 200) * s, W * s, 400 * s); g.restore(); }
      lines.forEach((ln, k) => u.text(ln, 192, cy + (k - (lines.length - 1) / 2) * lh + (1 - a) * 3, 11, { color: '#fffbe8', alpha: a, italic: true }));
      Cards.hint(u, this, EPILOGUE.length, 197);
      return;
    }
    const tt = this.gt, a = clamp(tt / 60, 0, 1), G = this.g;
    u.plate(180, 30, 184, 170, 0.82 * a);
    u.text('THE JOURNEY, GRADED', 272, 43, 8, { metal: true, alpha: a, title: true, ls: 2.4 });
    u.rule(272, 53, 110, '#f6e2a0', a);
    const rows = [
      ['CARAT', `${G.carat.toFixed(2)} ct`, `${G.n} of ${GEMS.length} diamonds carried`],
      ['COLOUR', G.colour, `${G.got} of ${G.total} melee gathered`],
      ['CLARITY', G.clarity[0], `${G.seen} of ${WONDERS.length} wonders seen`],
      ['CUT', G.cut, `${G.kept} of ${KEEPS.length} keepsakes brought home`]];
    rows.forEach(([k, v, d], j) => {
      const b = clamp((tt - 50 - j * 28) / 30, 0, 1) * a, y = 68 + j * 25;
      u.text(k, 192, y, 5.4, { color: '#8f9cc0', alpha: b, align: 'left', ls: 1.8, title: true });
      u.text(v, 352, y + 8, v.length > 6 && !/\d/.test(v) ? 9.5 : 13, { color: '#fff6c8', alpha: b, align: 'right', title: true });
      u.text(d, 192, y + 10, 7.2, { color: '#e6dcff', alpha: b, align: 'left', italic: true });
    });
    const perfect = G.n === GEMS.length && G.colour === 'D' && G.clarity[0] === 'FL' && G.cut === 'Excellent';
    u.text(perfect ? 'Every light is home, and you stopped to look at everything.' : G.n < GEMS.length ? `A pale summer yet: ${GEMS.length - G.n} ${GEMS.length - G.n === 1 ? 'stone still holds its' : 'stones still hold their'} light.` : 'Every light is home. There is more out there to look at.', 272, 176, 7.2, { color: '#fffbe8', italic: true, alpha: clamp((tt - 190) / 40, 0, 1) });
    u.text(Input.touch ? 'TAP TO RETURN' : 'ENTER TO RETURN TO THE TITLE', 272, 190, 5.4, { color: '#ffe9a8', alpha: clamp((tt - 220) / 40, 0, 1) * (0.6 + 0.4 * Math.sin(this.t * 0.1)), ls: 1.4, title: true });
  }
};
