'use strict';
/* Starlight Queen — game state and scenes (title, prologue, map, play, vault, ending) */
const Game = {
  cp: null, melee: 0, meleeGot: {}, gems: {}, seen: {}, coop: false, metBoy: false, bossDown: false, region: 0,
  stats: { foes: 0, deaths: 0, hits: 0, frames: 0 }, saved: null, vault: {}, best: null,
  newGame() {
    Object.assign(this, { cp: null, melee: 0, meleeGot: {}, gems: {}, seen: {}, coop: false, metBoy: !!this.read('sq-met'), bossDown: false, region: 0, stats: { foes: 0, deaths: 0, hits: 0, frames: 0 } });
  },
  read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
  write(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  loadSave() { this.saved = this.read('sq-run'); this.vault = this.read('sq-vault') || {}; this.best = this.read('sq-best'); },
  save() {
    Object.assign(this.vault, this.gems); this.write('sq-vault', this.vault); if (this.metBoy) this.write('sq-met', 1);
    this.saved = { cp: this.cp, melee: this.melee, meleeGot: Object.keys(this.meleeGot), gems: this.gems, seen: this.seen, coop: this.coop, metBoy: this.metBoy, bossDown: this.bossDown, region: this.region, stats: this.stats };
    this.write('sq-run', this.saved);
  },
  resume() {
    const s = this.saved; this.newGame();
    Object.assign(this, { cp: s.cp, melee: s.melee || 0, gems: s.gems || {}, seen: s.seen || {}, coop: !!s.coop, metBoy: !!s.metBoy, bossDown: !!s.bossDown, region: s.region || 0, stats: s.stats || this.stats });
    (s.meleeGot || []).forEach(n => { this.meleeGot[n] = 1; });
  },
  playerDied() { Scenes.go('play', { respawn: true }); },
  carats() { return GEMS.reduce((a, g) => a + (this.gems[g.id] ? g.carat : 0), 0); },
  grade() {
    const st = this.stats, flaws = st.hits + st.deaths * 2, got = Object.keys(this.meleeGot).length, frac = got / Math.max(1, World.meleeTotal || got);
    const min = st.frames / 3600;
    const clarity = flaws === 0 ? ['FL', 'Flawless'] : flaws <= 3 ? ['IF', 'Internally flawless'] : flaws <= 8 ? ['VVS', 'Very, very slightly included'] : flaws <= 16 ? ['VS', 'Very slightly included'] : flaws <= 30 ? ['SI', 'Slightly included'] : ['I', 'Included'];
    const ci = frac >= 0.95 ? 0 : frac >= 0.9 ? 1 : frac >= 0.84 ? 2 : frac >= 0.75 ? 3 : frac >= 0.65 ? 4 : frac >= 0.5 ? 5 : frac >= 0.35 ? 6 : 7;
    const cut = min < 9 ? 'Excellent' : min < 12 ? 'Very good' : min < 16 ? 'Good' : min < 24 ? 'Fair' : 'Poor';
    const sec = Math.floor(st.frames / 60);
    return {
      carat: this.carats(), n: Object.keys(this.gems).length, clarity, colour: 'DEFGHIJK'[ci], cut, got, total: World.meleeTotal || got,
      time: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, flaws, score: (7 - ci) + [0, 1, 2, 3, 4, 5][['I', 'SI', 'VS', 'VVS', 'IF', 'FL'].indexOf(clarity[0])] + ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'].indexOf(cut) + Object.keys(this.gems).length
    };
  },
  finish() {
    const g = this.grade(); this.lastGrade = g;
    if (!this.best || g.score > this.best.score) { this.best = g; this.write('sq-best', g); }
    Object.assign(this.vault, this.gems); this.write('sq-vault', this.vault);
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
    if (dawn && Game.metBoy) c.drawImage(Art.S.boy.idle[(t >> 5) % 2], 36, 94, 48, 56);
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
      Sound.sfx('confirm');
      if (Input.hit('tap')) { const k = Math.round((Input.tapY - 136) / 15); if (k < 0 || k >= this.items.length || Math.abs(Input.tapX - 254) > 110) return; this.sel = k; }
      const it = this.items[this.sel];
      if (it === 'continue') { Game.resume(); Scenes.go('map'); }
      else if (it === 'vault') Scenes.go('vault');
      else { Game.write('sq-run', null); Game.newGame(); Scenes.go('intro'); }
    }
  },
  draw(c) { Vista.draw(c, this.t, false, this.t * 0.06); },
  drawHi(u) {
    const t = this.t, a = clamp((t - 10) / 50, 0, 1);
    u.text('STARLIGHT', 254, 46, 27, { color: '#f6e2a0', glow: '#ffb040', ls: 3.5, alpha: a, title: true });
    u.text('QUEEN', 254, 76, 27, { color: '#f6e2a0', glow: '#ffb040', ls: 12, alpha: a, title: true });
    u.rule(254, 96, 118, '#c8a860', a);
    u.text('Ana & the Mountain of Light', 254, 108, 10.5, { color: '#cfe4ff', italic: true, alpha: a });
    const b = clamp((t - 60) / 40, 0, 1), vn = Object.keys(Game.vault).length;
    this.items.forEach((it, i) => {
      const on = i === this.sel, y = 136 + i * 15;
      const label = it === 'new' ? (Game.saved ? 'New Journey' : 'Begin the Journey') : it === 'continue' ? `Continue  ·  ${MAP_NAMES[Game.saved.region || 0]}` : `The Vault  ·  ${vn} of ${GEMS.length} diamonds`;
      u.text(label, 254, y, 10.5, { color: on ? '#ffffff' : '#8a98b8', alpha: b * (on ? 0.78 + 0.22 * Math.sin(t * 0.1) : 0.9), glow: on ? '#9fd8ff' : null });
      if (on) { const hw = u.width(label, 10.5) / 2 + 9; u.text('✦', 254 - hw, y, 7, { color: '#bff4ff', alpha: b }); u.text('✦', 254 + hw, y, 7, { color: '#bff4ff', alpha: b }); }
    });
    if (Game.best) u.text(`Finest journey  ·  ${Game.best.carat.toFixed(1)} ct  ·  ${Game.best.colour} colour  ·  ${Game.best.clarity[0]}  ·  ${Game.best.cut} cut`, 254, 188, 6.4, { color: '#d6ba78', alpha: b, italic: true });
    u.text(Input.touch ? 'TAP A LINE TO CHOOSE' : '↑ ↓  CHOOSE   ·   ENTER  BEGIN   ·   M  SOUND ' + (Sound.muted ? 'OFF' : 'ON') + '   ·   G  FULLSCREEN', 192, 205, 5.6, { color: '#98a6cc', alpha: b, ls: 1.2, title: true });
  }
};

/* ---------- Prologue ---------- */
const PROLOGUE = [
  'In Kaamos, a small town at the top of Finland, the winter night lasts more than fifty days.',
  'Ana lives at the end of the last lane. The town calls her the quiet girl. The forest calls her what she is — the last queen of the elves of the north.',
  'Far to the west a Hoarder King sits upon a mesa, gathering the great diamonds of the world one by one, so that their light is his alone.',
  'The greatest of them is the Koh-i-Noor — the Mountain of Light.',
  'So Ana laces her boots and leaves the small town behind. Across the frozen gulf lie the manic midsummer lands of Sweden; beyond the sea, a faraway world called America.',
  'The road goes west. Gather every light you can.'
];
Scenes.list.intro = {
  enter() { this.t = 0; this.i = 0; this.pt = 0; Sound.music('title'); },
  update(busy) {
    this.t++; this.pt++;
    if (busy) return;
    if (Input.hit('pause')) { Sound.sfx('confirm'); Scenes.go('map'); return; }
    if (Input.hit('enter') && this.pt > 25 || this.pt > 420) {
      if (this.i >= PROLOGUE.length - 1) { Scenes.go('map'); return; }
      this.i++; this.pt = 0;
    }
  },
  draw(c) {
    const t = this.t;
    c.fillStyle = '#04050d'; c.fillRect(0, 0, W, H);
    const r = rng(5);
    for (let i = 0; i < 60; i++) R(c, r() * W, r() * H, 1, 1, r() < 0.3 ? '#55628e' : '#2a3458');
    // the great diamonds, drawn west into the Hoarder's keeping during the third verse
    const gone = this.i > 2 ? 1 : this.i === 2 ? clamp((this.pt - 60) / 200, 0, 1) : 0;
    Vista.STARS.forEach(([x, y], i) => {
      const k = clamp(gone * 7 - i, 0, 1);
      if (k >= 1) return;
      const sx = lerp(x, -20, k * k), sy = lerp(y + 18, 150, k), gem = GEMS[5 + i] || GEMS[11];
      const tw = 0.7 + 0.3 * Math.sin(t * 0.07 + i * 1.9);
      Art.glow(c, sx, sy, 11 + tw * 4, gem.tint, 0.7 * tw);
      const img = Art.gemSprite(gem, 11); c.drawImage(img, Math.round(sx - 5), Math.round(sy - 5));
    });
    if (this.i >= 2) Art.glow(c, 0, 150, 60 * clamp(gone + (this.i > 2 ? 1 : 0), 0, 1), '#ff3a10', 0.6);
    if (this.i === 1 || this.i >= 4) {
      const a = clamp(this.pt / 80, 0, 1);
      c.globalAlpha = a;
      Art.glow(c, 192, 66, 40 + Math.sin(t * 0.05) * 4, '#9fd8ff', 0.7 * a);
      c.drawImage(Art.S.queen.idle[(t >> 5) % 2], 168, 36, 48, 56);
      c.globalAlpha = 1;
    }
  },
  drawHi(u) {
    const a = clamp(this.pt / 40, 0, 1);
    const lines = u.wrap(PROLOGUE[this.i], 268, 11.5, { italic: true });
    lines.forEach((ln, k) => u.text(ln, 192, 136 + k * 16 - (lines.length - 1) * 8 + 8, 11.5, { color: '#e6ecff', alpha: a, italic: true }));
    u.text(Input.touch ? 'TAP TO CONTINUE' : 'ENTER  CONTINUE   ·   ESC  SKIP', 192, 205, 5.6, { color: '#98a6cc', ls: 1.2, title: true });
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
    u.panel(72, 166, 240, 34, 0.9 * a, '#2a1a0a');
    u.text(MAP_NAMES[this.to], 192, 177, 10, { color: '#f6e2a0', alpha: a, title: true, ls: 1 });
    u.text(`${Object.keys(Game.gems).length} of ${GEMS.length} diamonds   ·   ${Game.carats().toFixed(2)} carats carried`, 192, 187, 6.6, { color: '#e6dcc0', italic: true, alpha: a });
    u.text(Input.touch ? 'TAP TO SET FORTH' : 'ENTER TO SET FORTH', 192, 195.5, 5.6, { color: '#f0d896', alpha: a * (0.85 + 0.15 * Math.sin(t * 0.1)), ls: 1.2, title: true });
  }
};

/* ---------- Play ---------- */
Scenes.list.play = {
  enter(a) { this.paused = false; World.load(a.respawn || a.resume ? Game.cp : (Game.cp = null)); if (a.god) World.god = true; },
  update(busy) {
    const w = World;
    if (busy) { if (w.player.dead || w.state === 'clear') w.update(); return; }
    if (Input.hit('pause') && w.state === 'play' && !w.player.dead && !w.card) { this.paused = !this.paused; this.armR = false; Sound.duck(this.paused); Sound.sfx('select'); return; }
    if (this.paused) {
      let pick = Input.hit('restart') ? 1 : Input.hit('quit') ? 3 : Input.hit('enter') && !Input.hit('tap') ? 0 : -1;
      if (Input.hit('tap')) { const k = Math.round((Input.tapY - 96) / 14); if (k >= 0 && k < 4 && Math.abs(Input.tapX - 192) < 110) pick = k; }
      if (pick === 0) { this.paused = false; Sound.duck(false); }
      else if (pick === 1) { if (this.armR) Scenes.go('play', { respawn: true }); else { this.armR = true; Sound.sfx('select'); } }
      else if (pick === 2) { Sound.toggleMute(); }
      else if (pick === 3) { Game.save(); Scenes.go('title'); }
      return;
    }
    if (Input.hit('join') && Game.metBoy && w.state === 'play' && !w.card && w.players.every(p => !p.dead)) {
      Game.coop = !Game.coop;
      if (Game.coop) { w.addPlayer2(); w.toast('ANA   A D walk  ·  W leap  ·  X arrow|SAM   ← → walk  ·  ↑ leap  ·  K sling', true); } else { w.dropPlayer2(); w.toast('Sam waves, and falls behind. Press [2] to call him back.'); }
      Game.save();
    }
    if (!Game.seen.hello && w.state === 'play') { Game.seen.hello = 1; w.toast(Input.touch ? '◀ ▶ walk   ·   ▲ leap   ·   ✦ arrow' : '← → walk   ·   SPACE leap   ·   X arrow', true); }
    w.update();
  },
  draw(c) { World.draw(c); },
  drawHi(u) {
    const w = World, z = w.introZone;
    if (w.introT > 0 && z && w.state === 'play' && !w.card) {
      const a = clamp(w.introT / 40, 0, 1) * clamp((250 - w.introT) / 30, 0, 1);
      u.panel(0, 46, W, 60, 0.3 * a, '#060814');
      u.text(z.title.toUpperCase(), 192, 66, 24, { color: '#f6e2a0', glow: '#ffb040', alpha: a, title: true, ls: 6 });
      u.rule(192, 84, 96, '#c8a860', a);
      u.text(z.sub, 192, 96, 9.5, { color: '#f0e8d0', alpha: a, italic: true });
    }
    if (w.signText && w.state === 'play' && !this.paused && !w.card) {
      let txt = w.signText;
      if (Input.touch) txt = txt.replace('[←] [→] to walk  ·  [SPACE] to leap — hold it to leap higher', '◀ ▶ to walk  ·  ▲ to leap — hold it to leap higher').replace('[X] looses', '✦ looses').replace('Press [SPACE] again', 'Press ▲ again');
      const lines = txt.split('|'), hgt = 12 + lines.length * 11;
      const wd = Math.min(340, Math.max(...lines.map(l => u.width(l, 8))) + 24);
      const cy = w.player.y - w.cam.y > 96 ? 62 : 178;
      u.panel(192 - wd / 2, cy - 12 - (lines.length - 1) * 5.5, wd, hgt, 0.82, '#0a1020');
      lines.forEach((ln, i) => u.text(ln, 192, cy + i * 11 - (lines.length - 1) * 5.5, 8, { color: '#e8f4ff' }));
    }
    if (w.toastT > 0 && w.state === 'play' && !w.card) {
      const a = clamp(w.toastT / 30, 0, 1) * clamp(((w.toastMax || 240) - w.toastT) / 15, 0, 1), tl = w.toastText.split('|');
      const ty = w.signText && w.player.y - w.cam.y > 96 ? 112 : 40;
      if (tl.length > 1) u.panel(192 - 120, ty - 9, 240, tl.length * 12 + 6, 0.55 * a, '#080a14');
      tl.forEach((ln, i) => u.text(ln, 192, ty + i * 12, 9, { color: '#fff6c8', alpha: a, glow: tl.length > 1 ? null : '#ffb040', italic: tl.length === 1 }));
    }
    if (w.fight && w.boss && w.boss.st === 'intro') {
      const a = clamp(w.boss.t0 / 30, 0, 1) * clamp((110 - w.boss.t0) / 20, 0, 1);
      u.text('THE HOARDER KING', 192, 70, 22, { color: '#ffb070', glow: '#ff3a10', alpha: a, title: true, ls: 4 });
      u.text('Keeper of the Mountain of Light', 192, 90, 8.5, { color: '#e6c8b0', italic: true, alpha: a });
    } else if (w.fight && w.boss && !w.boss.dead) u.text('THE HOARDER KING', 192, H - 21, 5, { color: '#ffc8a0', alpha: 0.9, ls: 1.5, title: true });
    if (Game.metBoy && !Game.coop && w.state === 'play' && !w.card && !this.paused && !Input.touch) { u.panel(W - 109, 30, 106, 10, 0.5, '#080a14'); u.text('PLAYER 2  ·  PRESS 2 TO JOIN', W - 7, 35.2, 4.8, { color: '#ffd070', align: 'right', ls: 0.9, title: true }); }
    if (w.players.length > 1 && !w.card) { u.text('ANA', 57.5, 9.5, 4.8, { color: '#bff4ff', align: 'right', ls: 0.4, title: true }); u.text('SAM', 57.5, 33.5, 4.8, { color: '#ffd070', align: 'right', ls: 0.6, title: true }); }
    if (w.state === 'clear') {
      const a = clamp((w.clearT - 50) / 40, 0, 1);
      u.text(w.clearText, 192, 56, 16, { color: '#fff0b0', glow: '#ff8a20', alpha: a, title: true, ls: 1 });
      u.text(`${Game.carats().toFixed(2)} carats carried home`, 192, 78, 8.5, { color: '#dffbff', alpha: clamp((w.clearT - 120) / 40, 0, 1), italic: true });
    }
    if (w.card) drawGemCard(u, w.card.gem, w.card.t, clamp(w.card.t / 25, 0, 1), w.card.t > 70 ? (Input.touch ? 'TAP TO CONTINUE' : 'ENTER TO CONTINUE') : '');
    if (this.paused) {
      u.panel(0, 0, W, H, 0.66, '#04050d');
      u.text('THE ROAD WAITS', 192, 60, 18, { color: '#f6e2a0', glow: '#ffb040', title: true, ls: 4 });
      u.rule(192, 76, 80, '#c8a860', 1);
      const tt = Input.touch, rows = [[tt ? '›' : 'ENTER', 'resume'], [tt ? '›' : 'R', this.armR ? (tt ? 'tap again to confirm' : 'press R again to confirm') : 'return to the last lantern'], [tt ? '›' : 'M', 'sound ' + (Sound.muted ? 'off' : 'on')], [tt ? '›' : 'Q', 'save and quit to title']];
      rows.forEach(([k, v], i) => { u.text(k, 172, 96 + i * 14, 5.6, { color: '#d6ba78', align: 'right', ls: 1.4, title: true }); u.text(v, 182, 96 + i * 14, 9, { color: '#dfe8ff', align: 'left' }); });
      const ctl = Game.coop ? [['ANA', 'A D walk   ·   W or SPACE leap   ·   X or F arrow'], ['SAM', '← → walk   ·   ↑ leap   ·   K or / sling']] : [['WALK', '← →  or  A D'], ['LEAP', 'SPACE or ↑   ·   again in the air, held: glide'], ['ARROW', 'X or K']];
      if (!tt) ctl.forEach(([k, v], i) => { u.text(k, 132, 160 + i * 11, 5, { color: '#8f9cc0', align: 'right', ls: 1.4, title: true }); u.text(v, 140, 160 + i * 11, 7.4, { color: '#aeb9d6', align: 'left' }); });
    }
  }
};

/* ---------- The Vault ---------- */
Scenes.list.vault = {
  enter() { this.t = 0; this.sel = 0; this.open = false; Game.loadSave(); },
  update(busy) {
    this.t++;
    if (busy) return;
    if (this.open) { if (Input.hit('enter') || Input.hit('pause')) { this.open = false; Sound.sfx('select'); } return; }
    const mv = (d) => { this.sel = (this.sel + d + GEMS.length) % GEMS.length; Sound.sfx('select'); };
    if (Input.hit('right') || Input.hit('right2')) mv(1);
    if (Input.hit('left') || Input.hit('left2')) mv(-1);
    if (Input.hit('dn')) mv(6);
    if (Input.hit('up')) mv(-6);
    if (Input.hit('pause') || Input.hit('vault') || Input.hit('quit')) { Scenes.go('title'); return; }
    if (Input.hit('tap')) { const col = Math.round((Input.tapX - 42) / 60), rw = Math.round((Input.tapY - 80) / 68); if (col < 0 || col > 5 || rw < 0 || rw > 1 || Input.tapY < 46) { Scenes.go('title'); return; } this.sel = rw * 6 + col; }
    if (Input.hit('enter') && this.t > 15) { if (Game.vault[GEMS[this.sel].id]) { this.open = true; this.ot = this.t; Sound.sfx('gem'); } else Sound.sfx('empty'); }
  },
  draw(c) { c.fillStyle = '#05060f'; c.fillRect(0, 0, W, H); const r = rng(3); for (let i = 0; i < 40; i++) R(c, r() * W, r() * H, 1, 1, '#1c2440'); },
  drawHi(u) {
    const g = u.ctx, s = u.s, t = this.t, n = Object.keys(Game.vault).length;
    u.text('THE VAULT', 192, 22, 15, { color: '#f6e2a0', glow: '#ffb040', title: true, ls: 5 });
    u.text(`${n} of ${GEMS.length} diamonds   ·   ${GEMS.reduce((a, q) => a + (Game.vault[q.id] ? q.carat : 0), 0).toFixed(2)} of ${GEM_TOTAL_CT.toFixed(2)} carats`, 192, 36, 7, { color: '#a9b4d0', italic: true });
    GEMS.forEach((gem, i) => {
      const x = 42 + (i % 6) * 60, y = 80 + Math.floor(i / 6) * 68, has = Game.vault[gem.id], on = i === this.sel;
      if (on) { g.save(); g.strokeStyle = '#d6ba78'; g.lineWidth = Math.max(1, s * 0.5); g.strokeRect((x - 26) * s, (y - 30) * s, 52 * s, 62 * s); g.restore(); }
      const r = 9 + 11 * Math.log10(gem.carat + 1) / Math.log10(531);
      g.save(); g.scale(s, s);
      if (has) drawGemHi(g, x, y - 4, r, gem, t + i * 20);
      else { g.globalAlpha = 0.5; g.strokeStyle = '#3a4466'; g.lineWidth = 0.6; g.setLineDash([1.5, 1.5]); g.beginPath(); gemOutline(gem.shape, 32).forEach((p, k) => { const px = x + p[0] * r, py = y - 4 + p[1] * r; k ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.stroke(); }
      g.restore();
      const where = ['Finland', 'Finland', 'the Gulf', 'Sweden', 'Sweden', 'Kiruna', 'America', 'America', 'America', 'the Mesa', 'the Mesa', 'the King'][i];
      const nm = gem.name.replace('Cullinan I · ', '').replace('The Great Star of Africa', 'Cullinan I');
      u.text(has ? `${gem.carat} ct` : '—', x, y + 20, 6.6, { color: has ? '#fff6dc' : '#6a76a0', title: true });
      u.text(has ? nm : 'Found in ' + where, x, y + 28.5, u.width(has ? nm : '', 5.6, { italic: true }) > 56 ? 4.6 : 5.6, { color: has ? '#b4c0e0' : '#7884ac', italic: true });
    });
    u.text(Input.touch ? 'TAP A STONE TO STUDY IT   ·   TAP THE TITLE TO RETURN' : '← →  CHOOSE   ·   ENTER  STUDY   ·   ESC  RETURN', 192, 205, 5.6, { color: '#98a6cc', ls: 1.4, title: true });
    if (this.open) drawGemCard(u, GEMS[this.sel], t, clamp((t - this.ot) / 20, 0, 1), Input.touch ? 'TAP TO CLOSE' : 'ENTER TO CLOSE');
  }
};

/* ---------- Ending ---------- */
const EPILOGUE = [
  'The Hoarder King is fallen, and the Mountain of Light shines for everyone again.',
  'Ana does not keep it. Great diamonds, she has learned, are only ever borrowed — from the deep earth, and from everyone who comes after.',
  'In Kaamos the long night ends. The tonttu at the end of the lane sets a lantern in the window, in case she should come home.',
  'But the road is long, and the world is wide, and Ana has only just begun.'
];
Scenes.list.ending = {
  enter() { this.t = 0; Sound.music('dawn'); Sound.duck(false); Sound.setRate(1); this.g = Game.lastGrade || Game.grade(); },
  update(busy) {
    this.t++;
    if (busy) return;
    if (Input.hit('enter') && this.t > 120) {
      if (this.t < EPILOGUE.length * 330) this.t = (Math.floor(this.t / 330) + 1) * 330;
      else if (this.t > EPILOGUE.length * 330 + 120) Scenes.go('title');
    }
  },
  draw(c) { Vista.draw(c, this.t, true, 0); },
  drawHi(u) {
    const i = Math.floor(this.t / 330), pt = this.t % 330;
    if (i < EPILOGUE.length) {
      const a = clamp(pt / 50, 0, 1) * clamp((330 - pt) / 40, 0, 1);
      const lines = u.wrap(EPILOGUE[i], 200, 10, { italic: true });
      u.panel(160, 172 - lines.length * 7 - 8, 216, lines.length * 14 + 14, 0.5 * a, '#1a1030');
      lines.forEach((ln, k) => u.text(ln, 268, 172 + k * 14 - lines.length * 7 + 6, 10, { color: '#fffbe8', italic: true, alpha: a }));
      return;
    }
    const tt = this.t - EPILOGUE.length * 330, a = clamp(tt / 60, 0, 1), G = this.g;
    u.panel(164, 26, 208, 178, 0.86 * a, '#140c28');
    u.text('YOUR JOURNEY, GRADED', 268, 40, 8.5, { color: '#fff0b0', glow: '#ff8a20', alpha: a, title: true, ls: 2.4 });
    u.rule(268, 51, 120, '#f6e2a0', a);
    const rows = [
      ['CARAT', `${G.carat.toFixed(2)} ct`, `${G.n} of ${GEMS.length} diamonds found`],
      ['COLOUR', G.colour, `${G.got} of ${G.total} melee gathered`],
      ['CLARITY', G.clarity[0], G.flaws === 0 ? 'Flawless — not a scratch' : `${G.flaws} flaws upon the road`],
      ['CUT', G.cut, `${G.time} upon the road`]];
    rows.forEach(([k, v, d], j) => {
      const b = clamp((tt - 50 - j * 28) / 30, 0, 1) * a, y = 66 + j * 26;
      u.text(k, 178, y, 5.4, { color: '#b9a4e0', alpha: b, align: 'left', ls: 1.8, title: true });
      u.text(v, 358, y + 8, v.length > 6 && !/\d/.test(v) ? 10 : 14, { color: '#fff6c8', alpha: b, align: 'right', title: true });
      u.text(d, 178, y + 10, 7.2, { color: '#e6dcff', alpha: b, align: 'left', italic: true });
    });
    const perfect = G.n === GEMS.length && G.colour === 'D' && G.clarity[0] === 'FL' && G.cut === 'Excellent';
    u.text(perfect ? 'A perfect stone. There is nothing left to teach you.' : 'A finer grade is always possible. The road will wait.', 268, 178, 7.6, { color: '#fffbe8', italic: true, alpha: clamp((tt - 190) / 40, 0, 1) });
    u.text(Input.touch ? 'TAP TO RETURN' : 'ENTER TO RETURN TO THE TITLE', 268, 193, 5, { color: '#ffe9a8', alpha: clamp((tt - 220) / 40, 0, 1) * (0.6 + 0.4 * Math.sin(this.t * 0.1)), ls: 1.4, title: true });
  }
};
