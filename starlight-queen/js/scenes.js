'use strict';
/* Starlight Queen — game state and scenes (title, prologue, map, play, vault, ending) */
const Game = {
  cp: null, melee: 0, meleeGot: {}, gems: {}, seen: {}, doors: {}, keeps: {}, wonders: {}, metBoy: false, bossDown: false, region: 0,
  stats: { foes: 0, deaths: 0, hits: 0, frames: 0 }, saved: null, vault: {}, shelf: {}, sights: {}, best: null,
  newGame() {
    Object.assign(this, { cp: null, melee: 0, meleeGot: {}, gems: {}, seen: {}, doors: {}, keeps: {}, wonders: {}, metBoy: false, bossDown: false, region: 0, stats: { foes: 0, deaths: 0, hits: 0, frames: 0 } });
  },
  read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
  write(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  loadSave() { this.saved = this.read('sq-run'); this.vault = this.read('sq-vault') || {}; this.shelf = this.read('sq-shelf') || {}; this.sights = this.read('sq-sights') || {}; this.best = this.read('sq-best'); },
  keepAll() { // what has been found stays found, whatever becomes of the journey it was found on
    Object.assign(this.vault, this.gems); this.write('sq-vault', this.vault); Object.assign(this.shelf, this.keeps); this.write('sq-shelf', this.shelf); Object.assign(this.sights, this.wonders); this.write('sq-sights', this.sights);
  },
  save() {
    this.keepAll();
    this.saved = { doors: this.doors, keeps: this.keeps, wonders: this.wonders, cp: this.cp, melee: this.melee, meleeGot: Object.keys(this.meleeGot), gems: this.gems, seen: this.seen, metBoy: this.metBoy, bossDown: this.bossDown, region: this.region, stats: this.stats };
    this.write('sq-run', this.saved);
  },
  resume() {
    const s = this.saved; this.newGame();
    Object.assign(this, { doors: s.doors || {}, keeps: s.keeps || {}, wonders: s.wonders || {}, cp: s.cp, melee: s.melee || 0, gems: s.gems || {}, seen: s.seen || {}, metBoy: !!s.metBoy, bossDown: !!s.bossDown, region: s.region || 0, stats: s.stats || this.stats });
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
      carat: this.carats(), n, clarity: cl, colour: 'DEFGHIJK'[ci], cut, got, total, seen, kept,
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
  u.text(`${gem.carat} ct`, 92, 158, 15, { color: '#fff6dc', alpha: a, title: true, ls: 1 });
  u.text(`${(gem.carat * 0.2).toFixed(gem.carat < 5 ? 2 : 1)} grams`, 92, 172, 7.5, { color: '#a9b4d0', alpha: a, italic: true });
  const x = 176, wd = 178;
  u.text(`DIAMOND ${gem.n + 1} OF ${GEMS.length}   ·   ${gem.real ? 'A REAL STONE' : 'A TEACHING STONE'}`, x, 31, 5.4, { color: '#d6ba78', alpha: a, align: 'left', ls: 1.2, title: true });
  const nameSize = u.width(gem.name, 17, { title: true }) > wd ? 12.5 : 17;
  u.text(gem.name, x, 47, nameSize, { color: '#fff6dc', alpha: a, align: 'left', title: true, glow: gem.tint });
  g.save(); g.globalAlpha = a * 0.6; g.fillStyle = '#d6ba78'; g.fillRect(x * s, 59 * s, wd * s, Math.max(1, s * 0.4)); g.restore();
  const rows = [['CARAT', gem.carat + ' ct'], ['CUT', gem.cut], ['COLOUR', gem.color], ['CLARITY', gem.clarity], ['MINED', gem.origin]];
  rows.forEach(([k, v], i) => {
    const y = 69 + i * 11.5;
    u.text(k, x, y, 5.2, { color: '#8f9cc0', alpha: a, align: 'left', ls: 1.6, title: true });
    u.text(v, x + 46, y, 8.2, { color: '#eef2ff', alpha: a, align: 'left' });
  });
  g.save(); g.globalAlpha = a * 0.6; g.fillStyle = '#d6ba78'; g.fillRect(x * s, 127 * s, wd * s, Math.max(1, s * 0.4)); g.restore();
  u.text(gem.lesson, x, 137, 9.5, { color: '#f0d896', alpha: a, align: 'left', italic: true });
  let fs = 7.7, lines = u.wrap(gem.text, wd, fs, {});
  while (lines.length * fs * 1.34 > 51 && fs > 6.4) { fs -= 0.3; lines = u.wrap(gem.text, wd, fs, {}); }
  lines.forEach((ln, i) => u.text(ln, x, 149 + i * fs * 1.34, fs, { color: '#d8e0f2', alpha: a, align: 'left' }));
  if (footer) u.text(footer, 92, 189, 5.4, { color: '#f0d896', alpha: a * (0.7 + 0.3 * Math.sin(t * 0.1)), ls: 1.3, title: true });
}

const Vista = (() => {
  let L = null, snow = null;
  function build() {
    L = {
      night: Backdrop.sky(['#04050d', '#0a1030', '#18244e', '#2a3868', '#4a4a78']),
      dawn: Backdrop.sky(['#28306e', '#5a4a8c', '#b86a8a', '#f09a6a', '#ffd890', '#fff6d8']),
      mN: Backdrop.mountains('#141c3c', '#0e1430', null, 50, 60, 901, 999),
      hN: Backdrop.hills('#0b1226', '#141c3c', 44, 16, 902),
      mD: Backdrop.mountains('#7a6aa8', '#5c4e90', '#ffe8e0', 50, 60, 901, 92),
      hD: Backdrop.hills('#4a7a5a', '#7ab070', 44, 16, 902),
      stars: Backdrop.layer(g => { const r = rng(77); for (let i = 0; i < 46; i++) R(g, r() * Backdrop.LW, r() * 120, 1, 1, r() < 0.2 ? '#7a88b8' : '#3a4670'); })
    };
  }
  /* ---- the title painting: Kaamos under the aurora, Ana and the Tonttu on the ridge above it ---- */
  let N = null;
  function spruce(g, x, base, hgt, body, lit, snowc) { // tiered, snow on the upper side of each bough
    const tiers = Math.max(3, hgt / 9 | 0);
    for (let y = 0; y < hgt; y++) {
      const k = y / hgt, ph = (y % (hgt / tiers)) / (hgt / tiers), wd = Math.max(1, Math.round((k * 0.75 + ph * 0.3) * hgt * 0.42));
      R(g, x - wd, base - hgt + y, wd * 2 + 1, 1, body);
      const rows = Math.max(1, hgt / tiers * 0.16);
      if (ph * hgt / tiers < rows && y > 2) { R(g, x - wd, base - hgt + y, Math.max(1, Math.round(wd * 0.8)), 1, snowc); R(g, x + 1, base - hgt + y, Math.max(1, Math.round(wd * 0.45)), 1, lit); }
      else if (wd > 5) R(g, x + Math.round(wd * 0.35), base - hgt + y, Math.round(wd * 0.5), 1, lit === '#3a4c86' ? '#0f1a40' : body);
    }
    R(g, x, base - hgt - 1, 1, 2, snowc); R(g, x - 1, base, 3, 3, '#1a1420');
  }
  function buildNight() {
    N = { smoke: [] };
    N.sky = Backdrop.sky(['#02030c', '#050c2c', '#0b1f52', '#1b3d78', '#3d5c96', '#7c78a6', '#c79aa8']);
    N.stars = Art.spr(W, 150, g => {
      const r = rng(31);
      for (let i = 0; i < 230; i++) { const x = r() * W, y = r() * r() * 150, b = r(); R(g, x, y, 1, 1, b > 0.9 ? '#ffffff' : b > 0.6 ? '#b9c8f0' : '#5f73a8'); }
      for (let i = 0; i < 90; i++) { const k = r(), x = 40 + k * 330 + (r() - 0.5) * 50, y = 96 - k * 84 + (r() - 0.5) * 22; R(g, x, y, 1, 1, r() > 0.5 ? '#8ea4dc' : '#465a92'); }
    });
    N.far2 = Backdrop.mountains('#3a548e', '#30477c', '#aebfe6', 44, 34, 811, 58);
    N.far = Backdrop.mountains('#22346a', '#19274f', '#dfe8ff', 34, 58, 812, 52);
    N.valley = Art.spr(W, H, g => {
      const r = rng(77), snow = ['#dfe8ff', '#b7c6ee', '#8fa1d6', '#6c7cb8', '#4f5c98'];
      // snowfield, darkening toward the viewer
      for (let x = 0; x < W; x++) { const top = 150 + Math.round(Math.sin(x * 0.021) * 3 + Math.sin(x * 0.057 + 1) * 1.5); for (let y = top; y < H; y++) { const k = (y - top) / 62, d = ([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.24; R(g, x, y, 1, 1, snow[clamp(Math.floor((k + d) * 4.4), 0, 4)]); } R(g, x, top, 1, 1, '#f4f8ff'); }
      // frozen lake
      for (let y = 160; y < 174; y++) { const k = Math.sin((y - 160) / 14 * Math.PI), hw = 30 + k * 62; R(g, 250 - hw, y, hw * 2, 1, y < 162 ? '#31467e' : '#16234c'); }
      R(g, 196, 173, 108, 1, '#eef4ff'); R(g, 222, 160, 60, 1, '#c9d6f2');
      // road west, with lantern posts
      for (let i = 0; i < 110; i++) { const k = i / 110, x = 176 - k * 176, y = 180 - Math.sin(k * 2.2) * 16 + k * 4; R(g, x, y, 3, 2, '#9fb0e0'); R(g, x, y + 2, 3, 1, '#7c8cc6'); }
      // the town
      const house = (x, y, wd, hg, wall, lit) => {
        R(g, x, y - hg, wd, hg, wall); R(g, x, y - hg, 1, hg, '#00000030'); R(g, x + wd - 1, y - hg, 1, hg, '#00000040');
        for (let i = 0; i < 4; i++) R(g, x - 1 + i, y - hg - 1 - i, wd + 2 - i * 2, 1, i < 2 ? '#f4f8ff' : '#cbd8f4');
        R(g, x + 2, y - hg + 3, 2, 2, lit ? '#ffd56a' : '#27345e'); if (wd > 9) R(g, x + wd - 4, y - hg + 3, 2, 2, '#ffd56a');
        R(g, x + (wd >> 1), y - 3, 2, 3, '#3a2418'); R(g, x + wd - 3, y - hg - 5, 2, 3, '#5a5060');
        N.smoke.push([x + wd - 2, y - hg - 6]);
      };
      [[150, 158, 11, 7, '#a82c26', 1], [166, 160, 13, 8, '#c8a43e', 1], [184, 157, 10, 7, '#a82c26', 0], [199, 159, 12, 8, '#b8322a', 1], [312, 158, 12, 8, '#b8322a', 1], [329, 160, 13, 8, '#d0ae48', 1], [347, 157, 10, 7, '#a82c26', 1], [364, 160, 12, 8, '#b8322a', 0]].forEach(h => house(...h));
      // church
      R(g, 294, 147, 9, 12, '#ece4d2'); R(g, 296, 135, 5, 12, '#ece4d2'); for (let i = 0; i < 7; i++) R(g, 298 - (i >> 1), 128 + i, 1 + i, 1, '#31406e'); R(g, 298, 124, 1, 4, '#dfe8ff'); R(g, 297, 125, 3, 1, '#dfe8ff'); R(g, 297, 139, 3, 4, '#ffd56a'); R(g, 293, 146, 11, 1, '#f4f8ff'); R(g, 297, 153, 3, 6, '#3a2418');
      // little spruces across the valley
      for (let i = 0; i < 46; i++) { const x = r() * W | 0, y = 152 + r() * 30 | 0; if (y > 158 && y < 176 && x > 186 && x < 316) continue; spruce(g, x, y, 7 + r() * 9 | 0, '#152450', '#c5d2f2', '#eaf0ff'); }
    });
    N.fg = Art.spr(W, H, g => {
      // the ridge: in shadow, moon-rimmed
      const ridge = x => x < 70 ? 170 - x * 0.1 : x < 120 ? 163 + (x - 70) * 0.06 : 166 + Math.pow((x - 120) / 62, 2) * 52;
      for (let x = 0; x < 184; x++) { const top = Math.round(ridge(x)); R(g, x, top, 1, H - top, '#1c2550'); R(g, x, top + 3, 1, 5, '#263264'); R(g, x, top, 1, 2, '#f4f8ff'); R(g, x, top + 2, 1, 1, '#8fa1d6'); }
      for (let i = 0; i < 26; i++) { const r = hash2(i, 5), x = r * 170, top = ridge(x); R(g, x, top + 8 + hash2(i, 9) * 30, 3 + hash2(i, 2) * 5, 1, '#263264'); }
      // framing spruces, close to the lens
      spruce(g, 4, 220, 156, '#060b22', '#3a4c86', '#6f82bc'); spruce(g, 30, 224, 92, '#0a1230', '#3a4c86', '#8a9cd0');
      spruce(g, 376, 222, 172, '#060b22', '#3a4c86', '#6f82bc'); spruce(g, 348, 226, 100, '#0a1230', '#3a4c86', '#8a9cd0'); spruce(g, 322, 228, 58, '#0d1638', '#3a4c86', '#a4b4e0');
      for (let x = 170; x < W; x++) { const h = 6 + Math.sin(x * 0.11) * 2 + Math.sin(x * 0.37) * 1.5; R(g, x, H - h, 1, h + 1, '#0a1230'); }
    });
  }
  function nightScene(c, t) {
    if (!N) buildNight();
    c.drawImage(N.sky, 0, 0);
    c.drawImage(N.stars, 0, 0);
    for (let i = 0; i < 9; i++) { const x = (i * 97 + 31) % W, y = (i * 53 + 11) % 100, k = Math.sin(t * 0.05 + i * 1.7); if (k > 0.55) { R(c, x - 1, y, 3, 1, '#ffffff'); R(c, x, y - 1, 1, 3, '#ffffff'); } }
    { const k = (t % 900) / 40; if (k < 1) { const x = 300 - k * 90, y = 20 + k * 34; for (let j = 0; j < 9; j++) R(c, x + j * 2.2, y - j * 0.85, 2, 1, `rgba(255,255,255,${(1 - j / 9) * (1 - k)})`); } }
    // moon
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(190,224,255,0.07)'; c.beginPath(); c.moveTo(188, 18); c.lineTo(196, 18); c.lineTo(276, 172); c.lineTo(224, 172); c.fill(); c.restore();
    Backdrop.aurora(c, t, 0, 0, 1);
    c.drawImage(N.far2, 0, 0); c.drawImage(N.far, 0, 6);
    c.drawImage(N.valley, 0, 0);
    // the lake keeps a faint copy of the sky's fire
    c.save(); c.beginPath(); for (let y = 162; y < 173; y++) { const k = Math.sin((y - 160) / 14 * Math.PI), hw = 30 + k * 62; c.rect(250 - hw, y, hw * 2, 1); } c.clip();
    c.translate(0, 172); c.scale(1, -0.24); Backdrop.aurora(c, t, 0, -8, 0.55); c.restore();
    for (let i = 0; i < 6; i++) R(c, 248 + Math.sin(t * 0.04 + i * 2) * 4, 162 + i * 1.8, 4 + (i % 2) * 3, 1, 'rgba(223,240,255,0.6)');
    // chimney smoke, window glow
    N.smoke.forEach(([x, y], i) => { for (let j = 0; j < 5; j++) { const k = ((t * 0.5 + i * 17 + j * 12) % 60) / 60; R(c, x + Math.sin(k * 5 + i) * 2 + k * 5, y - k * 16, 1 + (k > 0.5), 1, `rgba(200,208,232,${0.5 * (1 - k)})`); } if (i % 3 !== 2) Art.glow(c, x - 4, y + 10, 6, '#ffb84a', 0.25 + 0.05 * Math.sin(t * 0.07 + i)); });
    Art.glow(c, 298, 140, 6, '#ffb84a', 0.35);
    c.drawImage(N.fg, 0, 0);
    // the two of them
    const ay = 163;
    Art.glow(c, 60, ay - 22, 22, '#ffb84a', 0.3 + 0.05 * Math.sin(t * 0.09));
    c.drawImage(Art.S.tonttu[(t >> 5) % 2], 40, ay - 33, 30, 34);
    R(c, 71, ay - 20, 1, 8, '#6a5a4a'); R(c, 69, ay - 13, 5, 6, '#ffd56a'); R(c, 70, ay - 12, 3, 4, '#fff6c8'); R(c, 69, ay - 14, 5, 1, '#3a2c20');
    c.drawImage(Art.S.anaBig[(t >> 5) % 2], 80, ay - 68);
    if (!snow) snow = Backdrop.makeAmbient('snow');
    Backdrop.drawAmbient(c, snow, t, 0.25);
  }
  const STARS = [[70, 40], [112, 24], [158, 15], [204, 12], [250, 17], [294, 28], [330, 46]];
  function cliff(c, col, hi) {
    c.fillStyle = col;
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, 150); c.lineTo(40, 146); c.lineTo(96, 150); c.lineTo(132, 154); c.lineTo(146, 166); c.lineTo(160, 196); c.lineTo(190, H); c.fill();
    R(c, 0, 149, 40, 1, hi); R(c, 40, 147, 30, 1, hi); R(c, 70, 149, 30, 1, hi); R(c, 100, 151, 30, 1, hi);
  }
  function draw(c, t, dawn, scroll) {
    if (!L) build();
    if (!dawn) { nightScene(c, t); return; }
    c.drawImage(dawn ? L.dawn : L.night, 0, 0, W, H);
    if (!dawn) {
      Backdrop.drawLayer(c, L.stars, scroll * 0.2, 1, 0);
      Art.glow(c, 322, 150, 70 + Math.sin(t * 0.03) * 6, '#ff3a10', 0.55);
    } else {
      const sy = 150 - Math.min(40, t * 0.05);
      Art.glow(c, 318, sy, 90, '#fff0b0', 0.9); c.fillStyle = '#fffbe6'; c.beginPath(); c.arc(318, sy, 14, 0, TAU); c.fill();
      STARS.forEach(([x, y], i) => {
        const tw = 0.6 + 0.4 * Math.sin(t * 0.08 + i * 1.7);
        Art.glow(c, x, y, 9 + tw * 4, '#ffffff', 0.7 * tw);
        R(c, x - 1, y - 3, 2, 6, '#fff'); R(c, x - 3, y - 1, 6, 2, '#fff');
      });
    }
    Backdrop.drawLayer(c, dawn ? L.mD : L.mN, dawn ? 0 : scroll, 1, 6);
    if (!dawn) { // Mount Gloam, smouldering in the east
      c.fillStyle = '#080a18'; c.beginPath(); c.moveTo(262, 180); c.lineTo(312, 112); c.lineTo(320, 116); c.lineTo(330, 111); c.lineTo(384, 176); c.lineTo(384, 190); c.fill();
      Art.glow(c, 321, 112, 16 + Math.sin(t * 0.06) * 3, '#ff5a10', 0.9); R(c, 318, 114, 2, 12, '#ff6a20'); R(c, 325, 113, 1, 18, '#d84a10');
    } else {
      [176, 222, 262, 300, 356].forEach((x, i) => {
        const y = H - L.mD.hh[x] + 6;
        R(c, x - 1, y - 5, 3, 5, '#4a3e78'); R(c, x - 2, y - 6, 5, 1, '#4a3e78');
        Art.glow(c, x, y - 8, 8 + Math.sin(t * 0.3 + i) * 2, '#ffb040', 0.95); R(c, x - 1, y - 9, 2, 3, '#fff6b0'); R(c, x, y - 10 - ((t >> 3) + i) % 2, 1, 1, '#ffc040');
      });
    }
    Backdrop.drawLayer(c, dawn ? L.hD : L.hN, dawn ? 0 : scroll * 1.6, 1, 4);
    cliff(c, dawn ? '#2a5a3c' : '#05080f', dawn ? '#6ab868' : '#1a2440');
    // the Queen
    const img = Art.S.anaBigCrown[(t >> 5) % 2];
    if (dawn) c.drawImage(Art.S.boy.idle[(t >> 5) % 2], 36, 94, 48, 56);
    Art.glow(c, 104, 122, 44 + Math.sin(t * 0.05) * 4, dawn ? '#fff6d0' : '#9fd8ff', dawn ? 0.5 : 0.6);
    c.drawImage(img, 82, 82);
    for (let i = 0; i < 8; i++) {
      const k = ((t * 0.5 + i * 31) % 120) / 120;
      c.fillStyle = `rgba(200,240,255,${(1 - k) * 0.8})`; c.fillRect(Math.round(104 + Math.sin(i * 2.4 + k * 5) * 22), Math.round(146 - k * 70), 1, 1);
    }
  }
  return { draw, STARS };
})();

/* ---------- Title ---------- */
Scenes.list.title = {
  enter() {
    Game.loadSave(); this.t = 0; this.sel = 0;
    this.items = (Game.saved ? ['continue'] : []).concat(['new', 'vault']);
    Sound.music('title'); Sound.duck(false); Sound.setRate(1);
  },
  update(busy) {
    this.t++;
    if (busy) return;
    const n = this.items.length;
    if (Input.hit('up')) { this.sel = (this.sel + n - 1) % n; Sound.sfx('select'); }
    if (Input.hit('dn')) { this.sel = (this.sel + 1) % n; Sound.sfx('select'); }
    if (Input.hit('vault')) { Scenes.go('vault'); return; }
    if (Input.hit('enter') && this.t > 20) {
      if (Input.hit('tap')) { const k = Math.round((Input.tapY - 122) / 13); if (k < 0 || k >= this.items.length || Math.abs(Input.tapX - 192) > 110) return; this.sel = k; }
      Sound.sfx('confirm');
      const it = this.items[this.sel];
      if (it === 'continue') { Game.resume(); Scenes.go('map'); }
      else if (it === 'vault') Scenes.go('vault');
      else { Game.write('sq-run', null); Game.newGame(); Scenes.go('intro'); }
    }
  },
  noBloom: true,
  draw(c) { Vista.draw(c, this.t, false, this.t * 0.06); },
  drawHi(u) {
    const t = this.t, a = clamp((t - 10) / 50, 0, 1), g = u.ctx, s = u.s;
    // lockup: a small cut stone, two lines of engraved gold in one tracking, a hairline, the subtitle
    if (a > 0.05) { g.save(); g.globalAlpha = a; g.scale(s, s); drawGemHi(g, 192, 19, 6, GEM_BY_ID.kohinoor, t); g.restore(); }
    u.text('STARLIGHT', 192, 46, 26.5, { metal: true, ls: 2.7, alpha: a, title: true });
    u.text('QUEEN', 192, 74, 26.5, { metal: true, ls: 4.3, alpha: a, title: true });
    g.save(); g.globalAlpha = a * 0.9; g.fillStyle = '#d9b566';
    { const hw = u.width('Ana & the Mountain of Light', 9.5, { italic: true }) / 2 + 7, th = Math.max(1, s * 0.35); g.fillRect((192 - hw - 40) * s, 97 * s, 40 * s, th); g.fillRect((192 + hw) * s, 97 * s, 40 * s, th); } g.restore();
    u.text('Ana & the Mountain of Light', 192, 96.5, 9.5, { color: '#eef2ff', italic: true, alpha: a });
    const b = clamp((t - 60) / 40, 0, 1), vn = Object.keys(Game.vault).length;
    { const cy = (118 + this.items.length * 6.5) * s, gr = g.createRadialGradient(192 * s, cy, 0, 192 * s, cy, 96 * s); gr.addColorStop(0, 'rgba(6,9,25,0.72)'); gr.addColorStop(0.55, 'rgba(6,9,25,0.5)'); gr.addColorStop(1, 'rgba(6,9,25,0)'); g.save(); g.globalAlpha = b; g.translate(0, cy); g.scale(1, 0.34); g.translate(0, -cy); g.fillStyle = gr; g.fillRect(0, cy - 110 * s, W * s, 220 * s); g.restore();
      const bg = g.createLinearGradient(0, (H - 24) * s, 0, H * s); bg.addColorStop(0, 'rgba(4,6,26,0)'); bg.addColorStop(1, 'rgba(4,6,26,0.85)'); g.save(); g.globalAlpha = b; g.fillStyle = bg; g.fillRect(0, (H - 24) * s, W * s, 24 * s); g.restore(); }
    this.items.forEach((it, i) => {
      const on = i === this.sel, y = 122 + i * 13;
      const label = it === 'new' ? (Game.saved ? 'New journey' : 'Begin the journey') : it === 'continue' ? `Continue  ·  ${MAP_NAMES[Game.saved.region || 0]}` : `The vault  ·  ${vn} of ${GEMS.length} diamonds`;
      u.text(label, 192, y, on ? 10 : 8.4, { color: on ? '#ffe9a8' : '#aab3d4', alpha: b * (on ? 1 : 0.8) });
      if (on) { const hw = u.width(label, 10) / 2 + 8, d = 1.7 + 0.3 * Math.sin(t * 0.12); g.save(); g.globalAlpha = b; g.fillStyle = '#f3d384'; for (const sx of [-1, 1]) { g.save(); g.translate((192 + sx * hw) * s, y * s); g.rotate(Math.PI / 4); g.fillRect(-d * s / 2, -d * s / 2, d * s, d * s); g.restore(); } g.restore(); }
    });
    if (Game.best) u.text(`Finest journey  ·  ${Game.best.carat.toFixed(1)} ct  ·  ${Game.best.colour} colour  ·  ${Game.best.clarity[0]}  ·  ${Game.best.cut} cut`, 192, 122 + this.items.length * 13 + 4, 6.6, { color: '#d9b566', alpha: b, italic: true });
    u.text(Input.touch ? 'TAP A LINE TO CHOOSE' : '↑ ↓  CHOOSE   ·   ENTER  BEGIN   ·   M  SOUND ' + (Sound.muted ? 'OFF' : 'ON') + '   ·   G  FULLSCREEN', 192, 208.5, 4.4, { color: '#cfd5ea', alpha: b * 0.85, ls: 1.6, title: true });
  }
};

/* ---------- Prologue ---------- */
const PROLOGUE = [
  { s: 'Kaamos is at the top of Finland. After us there is Norway, and after Norway, weather.' },
  { s: 'The town is named for the dark. The sun goes down in November and is not expected back until January. We don’t take it personally. We have stars.' },
  { s: 'Every child here wears a reflector on the coat: a plastic snowflake. It makes no light of its own. It waits for yours, and hands it back.' },
  { s: 'Ana wore hers and waited. Winters, she stood where the road leaves town and shone at every pair of headlamps. It was always the snowplough.' },
  { s: 'At eleven she left her window open all night for an owl. We have owls. None had post. Towards morning, at thirty below, somebody quietly shut it.' },
  { s: 'She tried the back of the wardrobe. It was the back of a wardrobe.' },
  { s: 'What did come was the library bus, every second Thursday, engine running. Two weeks a book. She read the way other people pack.' },
  { s: 'We were good to her; let that be written down. We knew her shoe size. We knew how she took her coffee before she had tasted any.' },
  { s: 'She grew up, which here is done mostly in the dark, and kept the reflector on. For the traffic, she said.' },
  { s: 'It was the one who had shut the window who spoke, in the end. The Tonttu: red cap, low opinion of everything. He cannot cross the threshold and has never seen the need. Somebody has to be in.' },
  { s: 'News reaches a Tonttu by chimney. Far in the west a Hoarder King is shutting the world’s great diamonds in a room without windows. For every stone he shuts away, a star goes out. Up here, we notice.', fx: 'gems' },
  { s: '“A diamond is a reflector with airs,” said the Tonttu. “Shut it in the dark and you have bought a pebble. Somebody should go and tell him.”' },
  { s: 'The greatest is the Koh-i-Noor, the Mountain of Light. It ruins every king who holds it, the old story says. A woman may carry it unharmed. The Tonttu looked at Ana.' },
  { s: 'Over the frozen gulf, then. Through the manic lands of Sweden, where at midsummer nobody, including the sun, goes to bed. Down the iron mines. Over the sea to a far country called America.' },
  { s: 'He looked at her coat on its hook, and the snowflake pinned to it. “That only works,” he said, “on a road.”' },
  { s: 'She goes this morning, in the dark, which narrows it down very little. We shall watch her reflector as far as the last street lamp. After that it wants somebody else’s light.' }
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
    if (Input.touch) { u.text('TAP TO GO ON', 192, y + 8, 4.4, { color: '#cfd5ea', alpha: a * (0.55 + 0.3 * Math.sin(sc.t * 0.08)), ls: 1.6, title: true }); u.text('SKIP', 366, 12, 4.4, { color: '#cfd5ea', alpha: 0.6, ls: 1.4, title: true }); }
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
        for (let j = 1; j < 10; j++) R(c, x + j * 3, y + j * 0.3, 2, 1, `rgba(255,255,255,${0.5 - j * 0.05})`);
        Art.glow(c, x, y, 9, gem.tint, 0.7); c.drawImage(Art.gemSprite(gem, 9), Math.round(x - 4), Math.round(y - 4));
      }
      Art.glow(c, 0, 120, 70 * k0, '#ff3a10', 0.45);
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
    u.text('from Kaamos to the Mountain of Light', 192, 37, 6.8, { color: '#6a4a28', italic: true, shadow: false });
    const lbl = [['Kaamos', 'FINLAND', 350, 150], ['Midsummer Lands', 'SWEDEN', 262, 84], ['Iron Deeps', 'KIRUNA', 192, 152], ['Red Rock Country', 'UNITED STATES', 126, 76], ['The Hoarder’s Mesa', '', 62, 137]];
    lbl.forEach(([a, b, x, y], i) => {
      const lw = Math.max(u.width(a, 7.2, { italic: true }), b ? u.width(b, 5, { title: true }) + b.length * 0.8 : 0) + 8;
      u.panel(x - lw / 2, y - 5.5, lw, b ? 18 : 11, 0.88, '#dcc79a');
      u.text(a, x, y, 7.2, { color: i <= this.to ? ink : '#7a6240', italic: true, shadow: false });
      if (b) u.text(b, x, y + 8, 5, { color: i <= this.to ? '#6a4a28' : '#8a7250', shadow: false, ls: 0.8, title: true });
    });
    const [mx, my] = MAP_NODES[this.to];
    g.save(); g.imageSmoothingEnabled = false; g.shadowColor = '#fff8d0'; g.shadowBlur = 6 * s;
    g.drawImage(Art.S.queen.idle[(t >> 5) % 2], (mx - 12) * s, (my - 27 + Math.sin(t * 0.08)) * s, 24 * s, 28 * s);
    g.restore();
    const a = clamp((t - 30) / 40, 0, 1);
    u.plate(72, 166, 240, 34, 0.95 * a);
    u.text(MAP_NAMES[this.to], 192, 177, 10, { color: '#f6e2a0', alpha: a, title: true, ls: 1 });
    u.text(`${Object.keys(Game.gems).length} of ${GEMS.length} diamonds   ·   ${Game.carats().toFixed(2)} carats carried`, 192, 187, 6.6, { color: '#e6dcc0', italic: true, alpha: a });
    u.text(Input.touch ? 'TAP TO SET FORTH' : 'ENTER TO SET FORTH', 192, 195.5, 5.6, { color: '#f0d896', alpha: a * (0.85 + 0.15 * Math.sin(t * 0.1)), ls: 1.2, title: true });
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
    if (!Game.seen.hello && w.state === 'play' && w.introT <= 0 && !w.fight) { Game.seen.hello = 1; w.toast(touchKeys('[←] [→]  walk      [SPACE]  leap      [X]  arrow      [E]  reflector'), true); }
    w.update();
  },
  draw(c) { World.draw(c); },
  drawHi(u) {
    const w = World, z = w.introZone;
    if (w.introT > 0 && z && w.state === 'play' && !w.card && !w.gemFx && !w.signText && !w.wonderCard && !w.warpFx) {
      const a = clamp(w.introT / 40, 0, 1) * clamp((180 - w.introT) / 30, 0, 1);
      u.panel(0, 46, W, 60, 0.3 * a, '#060814');
      u.text(z.title.toUpperCase(), 192, 66, 24, { metal: true, alpha: a, title: true, ls: 7 });
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
        if (full) { const gr = g.createLinearGradient(0, -1, 0, 9); gr.addColorStop(0, '#b8ffe4'); gr.addColorStop(1, '#33c391'); g.fillStyle = gr; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 3; g.fill(); g.shadowColor = 'transparent'; g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.arc(-3, 1.4, 1.1, 0, TAU); g.fill(); }
        else { g.fillStyle = 'rgba(6,10,26,0.55)'; g.fill(); g.strokeStyle = 'rgba(184,255,228,0.45)'; g.lineWidth = 0.9; g.stroke(); }
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
        u.text('THE HOARDER KING', 192, y - 6.5, 4.6, { color: '#f3d384', ls: 1.8, title: true });
      }
    }
    // dialogue: eases in and out, speaker set apart, keys shown as keycaps
    const wc = w.wonderCard && w.state === 'play' && !w.card && !w.gemFx && !this.paused ? w.wonderCard : null;
    if (wc) { // a wonder: the frame narrows like a film's, it is named once in gold, and then it is left alone
      const a = clamp(wc.t / 36, 0, 1) * clamp((600 - wc.t) / 50, 0, 1), ease = 1 - (1 - a) * (1 - a), lines = u.wrap(wc.def.line, 340, 8.4, { italic: true });
      const th = 31 * ease, bh = (13 + lines.length * 11) * ease, hair = Math.max(1, s * 0.4);
      u.panel(0, 0, W, th, 0.9, '#04050d'); u.panel(0, H - bh, W, bh + 1, 0.9, '#04050d');
      g.fillStyle = `rgba(214,186,120,${0.55 * a})`; g.fillRect(0, th * s, W * s, hair); g.fillRect(0, (H - bh) * s - hair, W * s, hair);
      u.text(`A WONDER   ·   ${Object.keys(Game.wonders).length} OF ${WONDERS.length}`, 192, th - 22.5, 4.6, { color: '#d9b566', ls: 2.2, title: true, alpha: a, shadow: false });
      u.text(wc.def.name.toUpperCase(), 192, th - 10.5, 13, { metal: true, title: true, ls: 3, alpha: a });
      lines.forEach((ln, i) => u.text(ln, 192, H - bh + 11.5 + i * 11, 8.4, { color: '#f4ecd6', italic: true, alpha: a, shadow: false }));
    }
    const want = w.signText && w.state === 'play' && !this.paused && !w.card && !w.gemFx && !wc;
    if (wc || w.state === 'clear') this.signA = 0;
    if (want) { this.signTxt = w.signText; this.signLow = w.player.y - w.cam.y > 96; }
    this.signA = (this.signA || 0) + ((want ? 1 : 0) - (this.signA || 0)) * 0.22;
    if (this.signA > 0.02 && this.signTxt) {
      let txt = this.signTxt, who = null;
      if (Input.touch) txt = touchKeys(txt);
      const m = /^(Tonttu|Mayank): /.exec(txt); if (m) { who = m[1]; txt = txt.slice(m[0].length); }
      const lines = txt.split('|'), fs = 8.2, lh = 11.5, a = this.signA, ease = 1 - (1 - a) * (1 - a);
      const wd = Math.min(352, Math.max(...lines.map(l => u.width(l.replace(/[\[\]]/g, '  '), fs))) + 30), hgt = lines.length * lh + 11 + (who ? 5 : 0);
      const y0 = (this.signLow ? 40 : 170 - hgt / 2) + (1 - ease) * (this.signLow ? -6 : 6);
      u.plate(192 - wd / 2, y0, wd, hgt, a);
      if (who) u.text(who.toUpperCase(), 192, y0 + 7, 4.6, { color: '#d9b566', ls: 2, title: true, alpha: a, shadow: false });
      lines.forEach((ln, i) => u.rich(ln, 192, y0 + (who ? 16.5 : 11) + i * lh, fs, { color: '#eef2ff', alpha: a, shadow: false }));
    }
    if (w.toastT > 0 && w.state === 'play' && !w.card && !w.gemFx && !this.paused && !wc && !(this.signA > 0.3 && /\[/.test(w.toastText))) {
      const tm = w.toastMax || 240, a = clamp(w.toastT / 24, 0, 1) * clamp((tm - w.toastT) / 12, 0, 1), tl = w.toastText.split('|'), ease = 1 - (1 - a) * (1 - a);
      const wd = Math.max(...tl.map(l => u.width(l, 8.4, { italic: tl.length === 1 }))) + 26, hgt = tl.length * 11.5 + 8;
      const ty = (this.signA > 0.3 && !this.signLow ? 34 : 190 - hgt / 2) + (1 - ease) * 5;
      u.plate(192 - wd / 2, ty, wd, hgt, a * 0.92);
      tl.forEach((ln, i) => u.rich(ln, 192, ty + 10 + i * 11.5, 8.4, { color: '#fff3c4', alpha: a, italic: tl.length === 1, shadow: false }));
    }
    if (w.fight && w.boss && w.boss.st === 'intro') {
      const a = clamp(w.boss.t0 / 30, 0, 1) * clamp((110 - w.boss.t0) / 20, 0, 1);
      const bar = 14 * clamp(w.boss.t0 / 12, 0, 1) * clamp((112 - w.boss.t0) / 10, 0, 1); u.panel(0, 0, W, bar, 1, '#04050d'); u.panel(0, H - bar, W, bar + 1, 1, '#04050d');
      u.text('THE HOARDER KING', 192, 70, 22 * (1 + 0.4 * clamp(1 - (w.boss.t0 - 30) / 6, 0, 1)), { color: '#ffb070', glow: '#ff3a10', alpha: w.boss.t0 < 30 ? 0 : clamp((110 - w.boss.t0) / 20, 0, 1), title: true, ls: 4 });
      u.text('Thief of the Mountain of Light', 192, 90, 8.5, { color: '#e6c8b0', italic: true, alpha: a });
    }
    if (w.state === 'clear') {
      const a = clamp((w.clearT - 50) / 40, 0, 1);
      u.text(w.clearText.toUpperCase(), 192, 52, 17, { metal: true, alpha: a, title: true, ls: 3 });
      u.rule(192, 66, 90, '#c8a860', a);
      u.text('Far off, one window in Kaamos answers.', 192, 77, 9, { color: '#fff3d8', alpha: clamp((w.clearT - 100) / 40, 0, 1), italic: true });
      u.text(`${Game.carats().toFixed(2)} carats, two travellers, one lantern`, 192, 90, 7.4, { color: '#dffbff', alpha: clamp((w.clearT - 170) / 40, 0, 1), italic: true });
    }
    if (w.combo >= 2 && w.comboT > 0 && !w.card) u.text('×' + w.combo, w.comboX - w.cam.x, w.comboY - 12 - w.cam.y - (55 - w.comboT) * 0.15, Math.round((7 + Math.min(5, w.combo * 0.35)) * (1 + 0.6 * clamp((w.comboT - 47) / 8, 0, 1)) * 2) / 2, { color: w.combo >= 8 ? '#ffe9a0' : '#dffbff', glow: w.combo >= 8 ? '#ffb040' : '#7fd8ff', alpha: clamp(w.comboT / 20, 0, 1), title: true });
    if (w.card && w.card.t < 22) u.panel(0, 0, W, H, 1 - w.card.t / 22, '#ffffff');
    if (w.card) drawGemCard(u, w.card.gem, w.card.t, clamp(w.card.t / 25, 0, 1), w.card.t > 70 ? (Input.touch ? 'TAP TO CONTINUE' : 'ENTER TO CONTINUE') : '');
    if (this.paused) {
      u.panel(0, 0, W, H, 0.66, '#04050d');
      u.text('THE ROAD WAITS', 192, 60, 18, { metal: true, title: true, ls: 5 });
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

/* ---------- The Vault: the diamonds, and under them what else came home ---------- */
const GEM_WHERE = ['Finland', 'Finland', 'the Gulf', 'Sweden', 'Sweden', 'Kiruna', 'America', 'America', 'America', 'Australia', 'the Mesa', 'the Mesa', 'the King'];
Scenes.list.vault = {
  enter() {
    this.t = 0; this.sel = 0; this.open = false; Game.loadSave();
    this.items = [];
    GEMS.forEach((gem, i) => this.items.push({ kind: 'gem', def: gem, i, row: i < 7 ? 0 : 1, x: (i < 7 ? 36 : 62) + (i % 7) * 52, y: i < 7 ? 66 : 116 }));
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
  draw(c) { c.fillStyle = '#05060f'; c.fillRect(0, 0, W, H); const r = rng(3); for (let i = 0; i < 40; i++) R(c, r() * W, r() * H, 1, 1, '#1c2440'); },
  drawHi(u) {
    const g = u.ctx, s = u.s, t = this.t, n = Object.keys(Game.vault).length, cur = this.items[this.sel];
    u.text('THE VAULT', 192, 17, 13.5, { metal: true, title: true, ls: 5 });
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
        g.save(); g.imageSmoothingEnabled = false; g.globalAlpha = has ? 1 : 0.16; g.drawImage(Art.S.keep[it.i], (x - 7.5) * s, (y - 7.5) * s, 15 * s, 15 * s); g.restore();
      } else {
        if (on) frame(x - 9.5, y - 9.5, 19, 19);
        g.save(); g.translate(x * s, y * s); g.rotate(has ? Math.sin(t * 0.02 + it.i) * 0.12 : 0);
        g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU - Math.PI / 2, rr = (k % 2 ? 2 : 6.5) * s; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath();
        if (has) { g.fillStyle = '#f3d384'; g.shadowColor = '#ffb040'; g.shadowBlur = 5 * s; g.fill(); } else { g.strokeStyle = 'rgba(120,132,172,0.6)'; g.lineWidth = Math.max(1, s * 0.4); g.stroke(); }
        g.restore();
      }
    }
    g.save(); g.fillStyle = 'rgba(214,186,120,0.35)'; g.fillRect(24 * s, 146 * s, 336 * s, Math.max(1, s * 0.4)); g.restore();
    u.text(`KEEPSAKES   ·   ${Object.keys(Game.shelf).length} OF ${KEEPS.length}`, 24, 154.5, 4.6, { color: '#d6ba78', align: 'left', ls: 1.6, title: true });
    u.text(`WONDERS SEEN   ·   ${Object.keys(Game.sights).length} OF ${WONDERS.length}`, 211, 154.5, 4.6, { color: '#d6ba78', align: 'left', ls: 1.6, title: true });
    { // the one in hand
      const has = this.has(cur), d = cur.def, where = cur.kind === 'gem' ? GEM_WHERE[cur.i] : WONDERS[cur.i].where;
      const nm = cur.kind === 'gem' ? d.name : d.name, line = !has ? (cur.kind === 'wonder' ? `Not yet seen. It is out there, in ${where}.` : cur.kind === 'keep' ? `Not yet found. It is out there, in ${where}.` : where === 'the King' ? 'The Hoarder King has it.' : `Not yet found. It is out there, in ${where}.`)
        : cur.kind === 'gem' ? `${d.cut}  ·  ${d.color}  ·  ${d.origin}` : d.line;
      u.text(has ? nm : '—', 192, 187.5, 7.4, { color: has ? '#fff3c4' : '#7884ac', title: true, ls: 0.6 });
      let fs = 6.2, lines = u.wrap(line, 350, fs, { italic: true }); if (lines.length > 2) { fs = 5.6; lines = u.wrap(line, 356, fs, { italic: true }); }
      lines.slice(0, 2).forEach((ln, i) => u.text(ln, 192, 195.5 + i * 7, fs, { color: has ? '#c8d2ee' : '#7884ac', italic: true }));
    }
    u.text(Input.touch ? 'TAP TO CHOOSE   ·   TAP A DIAMOND TWICE TO STUDY IT   ·   TAP THE TITLE TO RETURN' : '← → ↑ ↓  CHOOSE   ·   ENTER  STUDY A DIAMOND   ·   ESC  RETURN', 192, 211, 4.4, { color: '#98a6cc', ls: 1.3, title: true });
    if (this.open) drawGemCard(u, cur.def, t, clamp((t - this.ot) / 20, 0, 1), Input.touch ? 'TAP TO CLOSE' : 'ENTER TO CLOSE');
  }
};

/* ---------- Ending ---------- */
const EPILOGUE = [
  { s: 'The Hoarder King fell as such kings do: all at once, and surprised. His room had no windows. It was full of pebbles. He had guarded them for years.' },
  { s: 'Beyond the mesa, on the red rock, in the dark: a lantern, and somebody singing the verse she had lost under the mountain. She has never asked where he learned it.' },
  { s: 'His name was Mayank. He had walked from India on the word of a dream, which had promised him an elf queen in a distant land. He considers the dream broadly accurate.' },
  { s: 'He says his lantern found her reflector first. She says she saw his lantern. We have stopped asking. They have gone everywhere since side by side, each quite sure of the way.' },
  { s: 'In the sun the largest pebble was the Mountain of Light again. Ana kept it a fortnight, the usual loan. Then, there being no desk, she returned it upward, where every star can get at it.' },
  { s: 'Then the long road home. At the top of Finland, Mayank asked what time the sun came up. “January,” said Ana.' },
  { s: 'They came up our road at four in the afternoon, which in December is night. The last street lamp found her reflector first. Then a lantern, walking beside it.' },
  { s: 'The Tonttu had kept her porridge warm the whole time. It was terrible. He found a second spoon without being asked. They ate all of it.' },
  { s: '“An elf queen,” said the Tonttu. “Queen of what?” Mayank pointed up.' },
  { s: 'It is on the sign at the gate now: STARLIGHT QUEEN. We used ink. The population above it we keep in pencil. She comes and goes.' }
];
Scenes.list.ending = {
  enter() { this.t = 0; this.i = 0; this.pt = 0; this.gt = -1; Sound.music('dawn'); Sound.duck(false); Sound.setRate(1); this.g = Game.lastGrade || Game.grade(); },
  update(busy) {
    this.t++;
    if (busy) return;
    if (this.gt >= 0) { this.gt++; if (Input.hit('enter') && this.gt > 150) Scenes.go('title'); return; }
    const r = Cards.step(this, EPILOGUE.length);
    if (r) { this.gt = 0; Sound.sfx('confirm'); }
  },
  draw(c) { Vista.draw(c, this.t, true, 0); },
  drawHi(u) {
    if (this.gt < 0) {
      const a = clamp(this.pt / 34, 0, 1), card = EPILOGUE[this.i];
      const lines = u.wrap(card.s, 206, 9.8, { italic: true }), y0 = 186 - lines.length * 13.5;
      u.plate(154, y0 - 11, 224, lines.length * 13.5 + 15, 0.92);
      lines.forEach((ln, k) => u.text(ln, 266, y0 + k * 13.5 + (1 - a) * 2, 9.8, { color: '#fffbe8', italic: true, alpha: a }));
      Cards.hint(u, this, EPILOGUE.length, 197);
      return;
    }
    const tt = this.gt, a = clamp(tt / 60, 0, 1), G = this.g;
    u.plate(164, 26, 208, 178, 0.94 * a);
    u.text('THE JOURNEY, GRADED', 268, 40, 8.5, { color: '#fff0b0', glow: '#ff8a20', alpha: a, title: true, ls: 2.4 });
    u.rule(268, 51, 120, '#f6e2a0', a);
    const rows = [
      ['CARAT', `${G.carat.toFixed(2)} ct`, `${G.n} of ${GEMS.length} diamonds carried`],
      ['COLOUR', G.colour, `${G.got} of ${G.total} melee gathered`],
      ['CLARITY', G.clarity[0], `${G.seen} of ${WONDERS.length} wonders seen`],
      ['CUT', G.cut, `${G.kept} of ${KEEPS.length} keepsakes brought home`]];
    rows.forEach(([k, v, d], j) => {
      const b = clamp((tt - 50 - j * 28) / 30, 0, 1) * a, y = 66 + j * 26;
      u.text(k, 178, y, 5.4, { color: '#b9a4e0', alpha: b, align: 'left', ls: 1.8, title: true });
      u.text(v, 358, y + 8, v.length > 6 && !/\d/.test(v) ? 10 : 14, { color: '#fff6c8', alpha: b, align: 'right', title: true });
      u.text(d, 178, y + 10, 7.2, { color: '#e6dcff', alpha: b, align: 'left', italic: true });
    });
    const perfect = G.n === GEMS.length && G.colour === 'D' && G.clarity[0] === 'FL' && G.cut === 'Excellent';
    u.text(perfect ? 'A perfect stone. You looked at everything. That was the point.' : 'There is more out there to look at. The road will wait.', 268, 178, 7.6, { color: '#fffbe8', italic: true, alpha: clamp((tt - 190) / 40, 0, 1) });
    u.text(Input.touch ? 'TAP TO RETURN' : 'ENTER TO RETURN TO THE TITLE', 268, 193, 5, { color: '#ffe9a8', alpha: clamp((tt - 220) / 40, 0, 1) * (0.6 + 0.4 * Math.sin(this.t * 0.1)), ls: 1.4, title: true });
  }
};
