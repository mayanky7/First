'use strict';
/* Starlight Queen — game state and scenes (title, prologue, map, play, game over, ending) */
const Game = {
  lives: 3, shards: 0, level: 0, cp: null, saved: null,
  stats: { shards: 0, foes: 0, deaths: 0, hits: 0, frames: 0 },
  newGame(level) {
    this.lives = 3; this.shards = 0; this.level = level || 0; this.cp = null;
    this.stats = { shards: 0, foes: 0, deaths: 0, hits: 0, frames: 0 };
  },
  loadSave() { try { this.saved = JSON.parse(localStorage.getItem('sq-save') || 'null'); } catch (e) { this.saved = null; } },
  save() { try { localStorage.setItem('sq-save', JSON.stringify({ level: this.level, shards: this.shards, lives: Math.max(3, this.lives), stats: this.stats })); } catch (e) { } this.loadSave(); },
  clearSave() { try { localStorage.removeItem('sq-save'); } catch (e) { } this.saved = null; },
  playerDied() {
    this.lives--; this.stats.deaths++;
    if (this.lives <= 0) Scenes.go('gameover');
    else Scenes.go('play', { respawn: true });
  },
  levelCleared() {
    this.cp = null;
    if (this.level >= LEVELS.length - 1) { this.clearSave(); Scenes.go('ending'); }
    else { this.level++; this.save(); Scenes.go('map'); }
  }
};

const Scenes = (() => {
  const list = {};
  let cur = null, next = null, fade = 1, dir = -1; // dir -1: fading in, 1: fading out
  function go(name, arg) { if (next) return; next = { name, arg }; dir = 1; }
  function update() {
    if (dir === 1) { fade = Math.min(1, fade + 0.06); if (fade >= 1 && next) { cur = list[next.name]; const a = next.arg; next = null; dir = -1; cur.enter && cur.enter(a || {}); } }
    else if (fade > 0) fade = Math.max(0, fade - 0.05);
    if (cur) cur.update(dir === 1);
  }
  return { list, go, update, get cur() { return cur; }, get fade() { return fade; }, get busy() { return dir === 1; } };
})();

/* ---------- shared night / dawn vista ---------- */
const Vista = (() => {
  let L = null;
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
  const STARS = [[70, 40], [112, 24], [158, 15], [204, 12], [250, 17], [294, 28], [330, 46]];
  function cliff(c, col, hi) {
    c.fillStyle = col;
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, 150); c.lineTo(40, 146); c.lineTo(96, 150); c.lineTo(132, 154); c.lineTo(146, 166); c.lineTo(160, 196); c.lineTo(190, H); c.fill();
    R(c, 0, 149, 40, 1, hi); R(c, 40, 147, 30, 1, hi); R(c, 70, 149, 30, 1, hi); R(c, 100, 151, 30, 1, hi);
  }
  function draw(c, t, dawn, scroll) {
    if (!L) build();
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
    const img = Art.S.queen.idle[(t >> 5) % 2];
    Art.glow(c, 104, 122, 44 + Math.sin(t * 0.05) * 4, dawn ? '#fff6d0' : '#9fd8ff', dawn ? 0.5 : 0.6);
    c.drawImage(img, 80, 94, 48, 56);
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
    this.items = Game.saved && Game.saved.level > 0 ? ['continue', 'new'] : ['new'];
    Sound.music('title'); Sound.duck(false); Sound.setRate(1);
  },
  update(busy) {
    this.t++;
    if (busy) return;
    if (Input.hit('up') || Input.hit('dn')) { if (this.items.length > 1) { this.sel = 1 - this.sel; Sound.sfx('select'); } }
    if (Input.hit('enter') && this.t > 20) {
      Sound.sfx('confirm');
      if (this.items[this.sel] === 'continue') { const s = Game.saved; Game.newGame(s.level); Game.shards = s.shards || 0; if (s.stats) Game.stats = s.stats; Scenes.go('map'); }
      else { Game.clearSave(); Game.newGame(0); Scenes.go('intro'); }
    }
  },
  draw(c) { Vista.draw(c, this.t, false, this.t * 0.06); },
  drawHi(u) {
    const t = this.t, a = clamp((t - 10) / 50, 0, 1);
    u.text('STARLIGHT', 254, 48, 27, { color: '#f6e2a0', glow: '#ffb040', ls: 3.5, alpha: a, title: true });
    u.text('QUEEN', 254, 78, 27, { color: '#f6e2a0', glow: '#ffb040', ls: 12, alpha: a, title: true });
    u.rule(254, 98, 110, '#c8a860', a);
    u.text('A Tale of the Seven Stars', 254, 110, 10.5, { color: '#cfe4ff', italic: true, alpha: a });
    const b = clamp((t - 60) / 40, 0, 1);
    this.items.forEach((it, i) => {
      const on = i === this.sel, y = 142 + i * 17;
      const label = it === 'new' ? (this.items.length > 1 ? 'New Journey' : 'Begin the Journey') : `Continue  ·  Chapter ${LEVELS[Game.saved.level].chapter}`;
      u.text(label, 254, y, 12, { color: on ? '#ffffff' : '#8a98b8', alpha: b * (on ? 0.75 + 0.25 * Math.sin(t * 0.1) : 0.9), glow: on ? '#9fd8ff' : null });
      if (on) { u.text('✦', 254 - u.width(label, 12) / 2 - 10, y, 8, { color: '#bff4ff', alpha: b }); u.text('✦', 254 + u.width(label, 12) / 2 + 10, y, 8, { color: '#bff4ff', alpha: b }); }
    });
    u.text(Input.touch ? 'Tap to begin' : 'ENTER to begin   ·   M sound ' + (Sound.muted ? 'off' : 'on') + '   ·   F fullscreen', 192, 204, 7, { color: '#7c8ab0', alpha: b * 0.9 });
  }
};

/* ---------- Prologue ---------- */
const PROLOGUE = [
  'Long ago, seven stars kept watch over the realm of Aurelin.',
  'But the Ashen King, lord of Mount Gloam, coveted their light. In a single night he tore them from the heavens, and bound them in a crown of cinders.',
  'Darkness crept across the land. One by one, the beacons of the free peoples fell cold.',
  'Yet one light remains — Aelara, Queen of the Silverwood, last bearer of the starlight.',
  'She must cross meadow and forest, mountain-deep and marsh, rekindle the beacons, and break the Cinder Crown.',
  'The road goes east. It begins with a single step.'
];
Scenes.list.intro = {
  enter() { this.t = 0; this.i = 0; this.pt = 0; Sound.music('title'); },
  update(busy) {
    this.t++; this.pt++;
    if (busy) return;
    if (Input.hit('pause')) { Sound.sfx('confirm'); Scenes.go('map'); return; }
    if (Input.hit('enter') && this.pt > 25 || this.pt > 400) {
      if (this.i >= PROLOGUE.length - 1) { Scenes.go('map'); return; }
      this.i++; this.pt = 0;
    }
  },
  draw(c) {
    const t = this.t;
    c.fillStyle = '#04050d'; c.fillRect(0, 0, W, H);
    const r = rng(5);
    for (let i = 0; i < 50; i++) R(c, r() * W, r() * H, 1, 1, r() < 0.3 ? '#55628e' : '#2a3458');
    // seven stars, stolen during the second verse
    const gone = this.i > 1 ? 1 : this.i === 1 ? clamp((this.pt - 60) / 180, 0, 1) : 0;
    Vista.STARS.forEach(([x, y], i) => {
      const k = clamp(gone * 7 - i, 0, 1);
      const sx = lerp(x, 400, k * k), sy = lerp(y + 20, 150, k);
      if (k >= 1) return;
      const tw = 0.7 + 0.3 * Math.sin(t * 0.07 + i * 1.9);
      if (k > 0) for (let j = 1; j < 9; j++) { const kk = Math.max(0, k - j * 0.02); R(c, lerp(x, 400, kk * kk), lerp(y + 20, 150, kk), 1, 1, `rgba(255,${200 - j * 12},${160 - j * 14},${0.6 - j * 0.06})`); }
      Art.glow(c, sx, sy, 10 + tw * 4, k > 0 ? '#ffb070' : '#ffffff', 0.8 * tw);
      R(c, sx - 1, sy - 3, 2, 6, '#fff'); R(c, sx - 3, sy - 1, 6, 2, '#fff');
    });
    if (this.i >= 1) Art.glow(c, 384, 150, 60 * clamp(gone + (this.i > 1 ? 1 : 0), 0, 1), '#ff3a10', 0.6);
    if (this.i >= 3) {
      const a = this.i === 3 ? clamp(this.pt / 80, 0, 1) : 1;
      c.globalAlpha = a;
      Art.glow(c, 192, 60, 40 + Math.sin(t * 0.05) * 4, '#9fd8ff', 0.7 * a);
      c.drawImage(Art.S.queen.idle[(t >> 5) % 2], 168, 30, 48, 56);
      c.globalAlpha = 1;
    }
  },
  drawHi(u) {
    const a = clamp(this.pt / 40, 0, 1);
    const lines = u.wrap(PROLOGUE[this.i], 270, 11.5);
    lines.forEach((ln, k) => u.text(ln, 192, 128 + k * 16 - (lines.length - 1) * 8 + 8, 11.5, { color: '#e6ecff', alpha: a, italic: true }));
    u.text(Input.touch ? 'Tap to continue' : 'ENTER  continue   ·   ESC  skip', 192, 205, 6.5, { color: '#66749c', alpha: 0.9 });
  }
};

/* ---------- Map ---------- */
const MAP_NODES = [[58, 150], [122, 108], [192, 138], [258, 100], [322, 124]];
Scenes.list.map = {
  enter() {
    this.t = 0; this.to = Game.level; this.from = Math.max(0, Game.level - 1);
    Sound.music('title'); Sound.duck(false); Sound.setRate(1);
    if (!this.tex) this.tex = this.parchment();
  },
  parchment() {
    const [cv, g] = mk(768, 432), r = rng(42);
    g.fillStyle = '#dcc79a'; g.fillRect(0, 0, 768, 432);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,84,40' : '255,240,200'},${r() * 0.09})`; const s = 1 + r() * 5; g.fillRect(r() * 768, r() * 432, s, s * (0.4 + r())); }
    for (let i = 0; i < 9; i++) { const x = r() * 768, y = r() * 432, rad = 30 + r() * 80; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(140,96,44,0.12)'); gr.addColorStop(1, 'rgba(140,96,44,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    const v = g.createRadialGradient(384, 216, 150, 384, 216, 470); v.addColorStop(0, 'rgba(90,50,10,0)'); v.addColorStop(1, 'rgba(70,36,8,0.62)');
    g.fillStyle = v; g.fillRect(0, 0, 768, 432);
    return cv;
  },
  pos(k) { // position along the road, k in [0, nodes-1]
    const i = Math.min(MAP_NODES.length - 2, Math.floor(k)), f = k - i, a = MAP_NODES[i], b = MAP_NODES[i + 1];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + (i % 2 ? -16 : 16);
    return [(1 - f) * (1 - f) * a[0] + 2 * f * (1 - f) * mx + f * f * b[0], (1 - f) * (1 - f) * a[1] + 2 * f * (1 - f) * my + f * f * b[1]];
  },
  update(busy) {
    this.t++;
    if (busy) return;
    if (this.t === 150 || (this.from === this.to && this.t === 40)) Sound.sfx('lantern');
    if (Input.hit('enter') && this.t > 50) { Sound.sfx('confirm'); Scenes.go('play', {}); }
  },
  draw(c) { c.fillStyle = '#1a1208'; c.fillRect(0, 0, W, H); },
  drawHi(u) {
    const g = u.ctx, s = u.s, t = this.t;
    g.save();
    g.imageSmoothingEnabled = true;
    g.drawImage(this.tex, 0, 0, W * s, H * s);
    g.scale(s, s);
    const ink = '#4a3018';
    g.strokeStyle = ink; g.fillStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = 1.2; g.strokeRect(8, 8, W - 16, H - 16); g.lineWidth = 0.4; g.strokeRect(11, 11, W - 22, H - 22);
    const r = rng(7);
    // hills (Greenmeads)
    g.lineWidth = 0.6;
    for (let i = 0; i < 9; i++) { const x = 24 + r() * 70, y = 128 + r() * 52; g.beginPath(); g.arc(x, y + 4, 6 + r() * 3, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    // forest (Silverwood)
    for (let i = 0; i < 34; i++) {
      const x = 92 + r() * 62, y = 78 + r() * 56;
      if (Math.hypot(x - 122, y - 108) < 9) continue;
      g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x, y); g.stroke(); g.beginPath(); g.arc(x, y - 2.2, 2.6, 0, TAU); g.stroke();
    }
    // mountains (the Sunken Halls lie beneath)
    for (let i = 0; i < 17; i++) {
      const x = 172 + r() * 40 + Math.sin(i) * 6, y = 52 + i * 8.4, hgt = 9 + r() * 6;
      if (Math.abs(y - 134) < 9 && Math.abs(x - 192) < 12) continue;
      g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - hgt * 0.8, y + hgt * 0.5); g.lineTo(x, y - hgt * 0.6); g.lineTo(x + hgt * 0.8, y + hgt * 0.5); g.stroke();
      g.lineWidth = 0.35; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + k * 1.6, y - hgt * 0.6 + k * 2.6); g.lineTo(x + k * 1.6 + 1.5, y + hgt * 0.5); g.stroke(); }
    }
    // fens
    g.lineWidth = 0.5;
    for (let i = 0; i < 26; i++) { const x = 228 + r() * 58, y = 76 + r() * 52; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.stroke(); if (i % 3 === 0) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y - 4); g.moveTo(x + 2, y); g.lineTo(x + 3, y - 3); g.stroke(); } }
    // Mount Gloam
    g.lineWidth = 0.9; g.beginPath(); g.moveTo(300, 118); g.lineTo(318, 84); g.lineTo(322, 88); g.lineTo(327, 83); g.lineTo(348, 120); g.stroke();
    g.lineWidth = 0.4; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(329 + k * 2.6, 88 + k * 5); g.lineTo(331 + k * 2.6, 118); g.stroke(); }
    g.beginPath(); for (let k = 0; k < 30; k++) { const a = k * 0.5, rr = 2 + k * 0.28; g.lineTo(322 + Math.cos(a) * rr + k * 0.4, 76 - k * 0.9 + Math.sin(a) * rr * 0.6); } g.stroke();
    // river
    g.lineWidth = 0.6; g.beginPath(); g.moveTo(160, 20); for (let y = 20; y < 196; y += 6) g.lineTo(156 + Math.sin(y * 0.09) * 7 - y * 0.06, y); g.stroke();
    // compass
    g.save(); g.translate(44, 44); g.lineWidth = 0.5; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.stroke();
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -15); g.lineTo(2.4, 0); g.lineTo(-2.4, 0); g.closePath(); k % 2 ? g.stroke() : g.fill(); }
    g.restore();
    g.restore();
    u.text('N', 44, 23, 6.5, { color: ink, shadow: false });
    u.text('AURELIN', 192, 25, 13, { color: ink, ls: 6, shadow: false, title: true });
    u.text('— the road east —', 192, 37, 6.5, { color: '#6a4a28', italic: true, shadow: false });
    // road
    g.save(); g.scale(s, s);
    g.strokeStyle = '#8a2c1c'; g.lineWidth = 1.1; g.setLineDash([3, 2.5]);
    g.beginPath(); for (let k = 0; k <= (MAP_NODES.length - 1) * 20; k++) { const [x, y] = this.pos(k / 20); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.setLineDash([]);
    MAP_NODES.forEach(([x, y], i) => {
      g.fillStyle = '#dcc79a'; g.strokeStyle = ink; g.lineWidth = 0.9; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); g.stroke();
      if (i < this.to) { // lit beacon
        const f = Math.sin(t * 0.25 + i) * 0.6;
        g.fillStyle = '#e8651a'; g.beginPath(); g.moveTo(x - 2.4, y); g.quadraticCurveTo(x - 2.6, y - 4, x + f * 0.5, y - 7.5 - f); g.quadraticCurveTo(x + 2.8, y - 4, x + 2.4, y); g.fill();
        g.fillStyle = '#ffd060'; g.beginPath(); g.arc(x, y - 1.6, 1.4, 0, TAU); g.fill();
      }
    });
    g.restore();
    const lbl = [[58, 164], [122, 122], [192, 152], [258, 84], [330, 138]];
    LEVELS.forEach((L, i) => u.text(L.name, lbl[i][0], lbl[i][1], 6.6, { color: i <= this.to ? ink : '#7a6240', italic: true, shadow: false, halo: '#dcc79a' }));
    // the Queen's marker
    const k = this.from === this.to ? this.to : lerp(this.from, this.to, clamp((t - 40) / 110, 0, 1) ** 0.8 * 1);
    const kk = this.from + (this.to - this.from) * (0.5 - 0.5 * Math.cos(Math.PI * clamp((t - 40) / 110, 0, 1)));
    const [mx, my] = this.pos(this.from === this.to ? k : kk);
    const moving = this.from !== this.to && t > 40 && t < 150;
    const img = moving ? Art.S.queen.run[(t >> 2) % 6] : Art.S.queen.idle[(t >> 5) % 2];
    g.save(); g.imageSmoothingEnabled = false;
    g.shadowColor = '#fff8d0'; g.shadowBlur = 6 * s;
    g.drawImage(img, (mx - 12) * s, (my - 27) * s, 24 * s, 28 * s);
    g.restore();
    // chapter card
    const a = clamp((t - (this.from === this.to ? 30 : 140)) / 40, 0, 1);
    if (a > 0) {
      const L = LEVELS[this.to];
      u.panel(72, 170, 240, 38, 0.82 * a, '#2a1a0a');
      u.text(`Chapter ${L.chapter}  ·  ${L.name}`, 192, 181, 10.5, { color: '#f6e2a0', alpha: a, title: true, ls: 1 });
      u.text(L.verse, 192, 193.5, 7, { color: '#e6dcc0', italic: true, alpha: a });
      u.text(Input.touch ? 'Tap to set forth' : 'ENTER to set forth', 192, 203, 5.5, { color: '#c8a860', alpha: a * (0.6 + 0.4 * Math.sin(t * 0.1)) });
    }
  }
};

/* ---------- Play ---------- */
Scenes.list.play = {
  enter(a) {
    this.paused = false;
    World.load(Game.level, a.respawn ? Game.cp : (Game.cp = null), !!a.respawn);
    if (a.god) World.god = true;
  },
  update(busy) {
    if (busy) { if (World.player.dead || World.state === 'clear') World.update(); return; }
    if (Input.hit('pause') && World.state === 'play' && !World.player.dead) { this.paused = !this.paused; Sound.duck(this.paused); Sound.sfx('select'); }
    if (this.paused) {
      if (Input.hit('enter')) { this.paused = false; Sound.duck(false); }
      else if (Input.hit('restart')) { Scenes.go('play', { respawn: true }); }
      else if (Input.hit('quit')) { Scenes.go('title'); }
      return;
    }
    World.update();
  },
  draw(c) { World.draw(c); },
  drawHi(u) {
    const w = World, L = w.def;
    if (w.introT > 0 && w.state === 'play') {
      const a = clamp(w.introT / 40, 0, 1) * clamp((230 - w.introT) / 30, 0, 1);
      u.text(`Chapter ${L.chapter}`, 192, 62, 9, { color: '#e6dcc0', alpha: a, ls: 3, title: true });
      u.text(L.name, 192, 82, 22, { color: '#f6e2a0', glow: '#ffb040', alpha: a, title: true, ls: 2 });
      u.rule(192, 98, 80, '#c8a860', a);
    }
    if (w.signText && w.state === 'play' && !this.paused) {
      let txt = w.signText;
      if (Input.touch) txt = txt.replace('[←] [→] to walk  ·  [SPACE] to leap — hold it to leap higher', '◀ ▶ to walk  ·  ▲ to leap — hold it to leap higher').replace('[X] looses', '✦ looses').replace('Press [SPACE] again', 'Press ▲ again');
      const lines = txt.split('|');
      const hgt = 12 + lines.length * 11;
      u.panel(52, 166 - (lines.length - 1) * 5.5, 280, hgt, 0.78, '#0a1020');
      lines.forEach((ln, i) => u.text(ln, 192, 178 + i * 11 - (lines.length - 1) * 5.5, 8, { color: '#e8f4ff' }));
    }
    if (w.toastT > 0 && w.state === 'play') {
      const a = clamp(w.toastT / 30, 0, 1) * clamp((200 - w.toastT) / 15, 0, 1);
      u.text(w.toastText, 192, 44, 9, { color: '#fff6c8', alpha: a, glow: '#ffb040', italic: true });
    }
    if (w.fight && w.boss && w.boss.st === 'intro') {
      const a = clamp(w.boss.t0 / 30, 0, 1) * clamp((110 - w.boss.t0) / 20, 0, 1);
      u.text('THE ASHEN KING', 192, 70, 22, { color: '#ffb070', glow: '#ff3a10', alpha: a, title: true, ls: 4 });
      u.text('Lord of Mount Gloam, Thief of Stars', 192, 90, 8, { color: '#e6c8b0', italic: true, alpha: a });
    } else if (w.fight && w.boss && !w.boss.dead) {
      u.text('The Ashen King', 192, H - 21, 6.5, { color: '#ffc8a0', alpha: 0.9 });
    }
    if (w.state === 'clear') {
      const a = clamp((w.clearT - 50) / 40, 0, 1);
      u.text(L.beaconName, 192, 56, 16, { color: '#fff0b0', glow: '#ff8a20', alpha: a, title: true, ls: 1 });
      const b = clamp((w.clearT - 120) / 40, 0, 1);
      u.text(`Starshards gathered  ·  ${Game.stats.shards}`, 192, 78, 8, { color: '#dffbff', alpha: b, italic: true });
    }
    if (this.paused) {
      u.panel(0, 0, W, H, 0.6, '#04050d');
      u.text('The Road Waits', 192, 76, 20, { color: '#f6e2a0', glow: '#ffb040', title: true, ls: 2 });
      u.rule(192, 92, 70, '#c8a860', 1);
      const rows = Input.touch ? ['Tap II to resume'] : ['ENTER   resume', 'R   return to the last lantern', 'Q   quit to title', 'M   sound ' + (Sound.muted ? 'off' : 'on')];
      rows.forEach((r, i) => u.text(r, 192, 112 + i * 14, 9, { color: '#dfe8ff' }));
      u.text('Walk  ← →  /  A D      Leap  SPACE  (again in the air: glide)      Arrow  X', 192, 186, 6.5, { color: '#8a98b8' });
    }
  }
};

/* ---------- Game over ---------- */
Scenes.list.gameover = {
  enter() { this.t = 0; Sound.music(null); },
  update(busy) {
    this.t++;
    if (busy) return;
    if (Input.hit('enter') && this.t > 40) { Sound.sfx('confirm'); Game.lives = 3; Game.cp = null; Scenes.go('play', {}); }
    else if (Input.hit('quit')) Scenes.go('title');
  },
  draw(c) {
    c.fillStyle = '#04050d'; c.fillRect(0, 0, W, H);
    const k = clamp(this.t / 120, 0, 1);
    Art.glow(c, 192, 96, 50 * (1 - k * 0.7) + Math.sin(this.t * 0.2) * 2, '#9fd8ff', 0.5 * (1 - k * 0.6));
    R(c, 191, 92, 2, 8, '#fff'); R(c, 188, 95, 8, 2, '#fff');
  },
  drawHi(u) {
    const a = clamp(this.t / 50, 0, 1);
    u.text('The starlight gutters…', 192, 134, 16, { color: '#cfe4ff', italic: true, alpha: a });
    u.text('but it is not yet spent.', 192, 152, 9, { color: '#8a98b8', italic: true, alpha: clamp((this.t - 50) / 50, 0, 1) });
    u.text(Input.touch ? 'Tap to rise again' : 'ENTER  rise again   ·   Q  title', 192, 186, 7.5, { color: '#f6e2a0', alpha: clamp((this.t - 90) / 40, 0, 1) * (0.7 + 0.3 * Math.sin(this.t * 0.1)) });
  }
};

/* ---------- Ending ---------- */
const EPILOGUE = [
  'The Cinder Crown is broken.',
  'Seven stars return to the sky above Aurelin, and from peak to peak the beacons answer one another.',
  'In the Greenmeads the hillfolk wake to a true dawn. Under the mountain, the old lamps burn again.',
  'And in the Silverwood they still sing of the Queen who walked into the dark, and carried the morning home.'
];
Scenes.list.ending = {
  enter() { this.t = 0; Sound.music('dawn'); Sound.duck(false); Sound.setRate(1); },
  update(busy) {
    this.t++;
    if (busy) return;
    if (Input.hit('enter') && this.t > 120) {
      if (this.t < EPILOGUE.length * 330) this.t = (Math.floor(this.t / 330) + 1) * 330;
      else if (this.t > EPILOGUE.length * 330 + 90) Scenes.go('title');
    }
  },
  draw(c) { Vista.draw(c, this.t, true, this.t * 0.04); },
  drawHi(u) {
    const i = Math.floor(this.t / 330), pt = this.t % 330;
    if (i < EPILOGUE.length) {
      const a = clamp(pt / 50, 0, 1) * clamp((330 - pt) / 40, 0, 1);
      const lines = u.wrap(EPILOGUE[i], 200, 10);
      u.panel(160, 172 - lines.length * 7 - 8, 216, lines.length * 14 + 14, 0.45 * a, '#1a1030');
      lines.forEach((ln, k) => u.text(ln, 268, 172 + k * 14 - lines.length * 7 + 6, 10, { color: '#fffbe8', italic: true, alpha: a }));
    } else {
      const tt = this.t - EPILOGUE.length * 330, a = clamp(tt / 60, 0, 1), st = Game.stats;
      u.panel(170, 62, 196, 132, 0.5 * a, '#1a1030');
      u.text('THE END', 268, 80, 22, { color: '#fff0b0', glow: '#ff8a20', alpha: a, title: true, ls: 4 });
      u.rule(268, 96, 70, '#f6e2a0', a);
      const sec = Math.floor(st.frames / 60), rows = [
        ['Starshards gathered', st.shards], ['Foes unmade', st.foes], ['Times fallen', st.deaths],
        ['Time upon the road', `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`]];
      rows.forEach(([k, v], j) => {
        const b = clamp((tt - 50 - j * 18) / 30, 0, 1) * a;
        u.text(k, 196, 112 + j * 13, 8, { color: '#e6dcff', alpha: b, align: 'left', italic: true });
        u.text(String(v), 340, 112 + j * 13, 8.5, { color: '#fff6c8', alpha: b, align: 'right' });
      });
      u.text('Thank you for walking the road.', 268, 170, 8, { color: '#fffbe8', italic: true, alpha: clamp((tt - 140) / 40, 0, 1) });
      u.text(Input.touch ? 'Tap to return' : 'ENTER to return to the title', 268, 184, 6, { color: '#f6e2a0', alpha: clamp((tt - 170) / 40, 0, 1) * (0.6 + 0.4 * Math.sin(this.t * 0.1)) });
    }
  }
};
