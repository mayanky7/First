'use strict';
/* Starlight Queen — world: one continuous road, its simulation step and rendering */
const World = (() => {
  const w = {
    t: 0, state: 'play', grid: null, rows: 0, cols: 0, ents: [], parts: [], plats: [], bumps: [], decor: [], torches: [],
    cam: { x: 0, y: 0 }, shake: 0, flash: 0, player: null, players: [], theme: null, signText: null, signNear: null,
    toastText: '', toastT: 0, introT: 0, clearT: 0, arena: null, bossAlive: false, fight: false, dawn: 0, god: false, minX: 0, maxX: 0,
    zones: [], zone: null, card: null, deadT: 0
  };
  const [lc, lg] = mk(W, H);
  const [bc, bg2] = mk(W, H);
  const [holeImg, hg] = mk(128, 128);
  { const g = hg.createRadialGradient(64, 64, 10, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); hg.fillStyle = g; hg.fillRect(0, 0, 128, 128); }
  const [hurtImg, hug] = mk(W, H);
  { const g = hug.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.62); g.addColorStop(0, 'rgba(255,40,60,0)'); g.addColorStop(1, 'rgba(255,40,60,0.6)'); hug.fillStyle = g; hug.fillRect(0, 0, W, H); }
  const [lavaImg, lvg] = mk(1, 64);
  { const g = lvg.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.9, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0.85)'); lvg.fillStyle = g; lvg.fillRect(0, 0, 1, 64); }
  let lastCamX = 0;

  const zoneAt = x => { for (const z of w.zones) if (x < z.x1) return z; return w.zones[w.zones.length - 1]; };

  function load(cp) {
    const L = buildWorld();
    Object.assign(w, {
      t: 0, state: 'play', grid: L.grid, rows: L.rows, cols: L.cols, parts: [], bumps: [], torches: L.torches, zones: L.zones,
      shake: 0, flash: 0, signText: null, signNear: null, toastT: 0, introT: 0, clearT: 0, card: null, deadT: 0, gemFx: null, signHold: null, wonderCard: null, warpFx: null, litHold: 0, marks: L.marks, moon: {}, doors: L.doors, doorP: {}, gaze: null, gazeT: 900, warpLock: false, lit: 0, hitstop: 0, combo: 0, comboT: 0, hudPop: 0, rings: [], slow: 0, hurtFx: 0,
      gemBlocks: L.gemBlocks, popN: L.popN, gemQ: [], arena: L.arena, bossAlive: !Game.bossDown, fight: false, dawn: Game.bossDown ? 1 : 0, dawning: false, minX: 0, maxX: L.cols * T, boss: null, meleeTotal: L.melee
    });
    w.colTheme = new Array(w.cols);
    for (let cx = 0; cx < w.cols; cx++) w.colTheme[cx] = THEMES[zoneAt(cx * T + 8).theme];
    for (const k in L.gemBlocks) if (Game.gems[L.gemBlocks[k]]) { const [gx, gy] = k.split(',').map(Number); w.grid[gy][gx] = 'U'; }
    for (const d of L.doors) if (Game.doors[d.id]) for (let i = 0; i < d.h; i++) w.grid[d.cy - i][d.cx] = '.';
    for (const k in L.popN) if (Game.meleeGot[L.popN[k]]) { const [gx, gy] = k.split(',').map(Number); w.grid[gy][gx] = 'U'; }
    w.ents = L.ents.filter(s => !(s.t === 'keep' && Game.keeps[s.keep]) && !(s.t === 'shard' && Game.meleeGot[s.n]) && !(s.t === 'gem' && Game.gems[s.gem]) && !(s.t === 'boss' && Game.bossDown)).map(makeEnt);
    if (Game.bossDown) { setGate(w.arena.gr, '.'); if (!Game.gems.kohinoor) w.ents.push(makeEnt({ t: 'gem', x: (w.arena.x0 + w.arena.x1) / 2, y: w.arena.floor - 6, gem: 'kohinoor' })); }
    w.plats = w.ents.filter(e => e.type === 'plat');
    w.boss = w.ents.find(e => e.type === 'boss') || null;
    const sp = cp || L.start;
    w.spawn = sp;
    w.mainEnd = (w.zones.find(z => z.warp) || { x0: L.cols * T }).x0; // the road proper ends where the lands reached only through the tear begin
    w.players = [makePlayer(sp.x, sp.y, 0)];
    w.player = w.players[0];
    if (cp) { for (const p of w.players) p.sq = 1.3; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; w.parts.push({ x: sp.x + Math.cos(a) * 26, y: sp.y - 11 + Math.sin(a) * 26, vx: -Math.cos(a) * 2, vy: -Math.sin(a) * 2, life: 13, col: i % 2 ? '#bff4ff' : '#ffffff', glow: 1, sz: 2 }); } }
    { // lanterns already passed are burning; a side-road's lanterns only count while she is on it
      const side = zoneAt(sp.x).warp, back = L.marks.canyonBack;
      for (const e of w.ents) if (e.type === 'lantern' || (e.type === 'beacon' && !e.final)) {
        const ex = e.x + e.w / 2, es = zoneAt(ex).warp;
        if (es === side ? ex <= sp.x + 1 : (side && back && ex <= back.x + 1)) { e.on = true; e.fire = 1; }
      }
    }
    w.zone = null; enterZone(zoneAt(w.player.x + 5));
    w.cam.x = clamp(w.player.x - W / 2, w.bx0, w.bx1 - W);
    w.cam.y = clamp(w.player.y - H * 0.72, 0, w.rows * T - H + 18);
    lastCamX = w.cam.x;
    scatter();
    Sound.duck(false);
  }
  function enterZone(z) {
    w.zone = z; w.theme = THEMES[z.theme];
    w.bx0 = z.warp ? z.x0 : 0; w.bx1 = z.warp ? z.x1 : (w.mainEnd || w.cols * T);
    if (!w.fight) { w.minX = w.bx0; w.maxX = w.bx1; }
    w.amb = Paint.makeAmbient(w.theme.amb);
    if (!w.fight) { Sound.music(Game.bossDown && z.theme === 'gloam' ? 'dawn' : w.theme.music); Sound.setRate(z.manic > 1 ? 0.84 : 1); }
    Game.region = z.map; Game.oz = !!z.warp;
    const key = z.title + '|' + z.sub;
    if (!Game.seen[key]) { Game.seen[key] = 1; w.introT = 180; w.introZone = z; }
  }
  function scatter() {
    w.decor = []; w.back = [];
    const keep = new Set();
    for (const e of w.ents) if (e.type === 'beacon' || e.type === 'lantern' || e.type === 'sign' || e.type === 'boy' || e.type === 'warp' || e.type === 'wonder') { const r = e.type === 'wonder' ? (e.def.id === 'kings' ? 8 : e.def.id === 'undersky' || e.def.id === 'cross' || e.def.id === 'fox' ? 0 : 5) : 2; for (let i = -r; i <= r; i++) keep.add(Math.floor((e.x + e.w / 2) / T) + i); }
    let lastTree = -20;
    for (let x = 0; x < w.cols; x++) {
      const th = w.colTheme[x];
      for (let cy = 3; cy < w.rows; cy++) {
        if (w.grid[cy][x] !== '#' || w.grid[cy - 1][x] !== '.') continue;
        const h = hash2(x * 7 + 3, cy * 13 + th.seed);
        if (th.trees && x - lastTree > 7 && h < 0.5 && !keep.has(x) && w.colTheme[Math.max(0, x - 6)] === th && w.colTheme[Math.min(w.cols - 1, x + 6)] === th && x > 1 && x < w.cols - 2 && w.grid[cy][x - 1] === '#' && w.grid[cy][x + 1] === '#'
          && (x * T < w.arena.x0 - 60 || x * T > w.arena.x1 + 30)) {
          w.back.push({ type: th.id === 'meads' && x % 5 === 0 ? 'stuga' : th.id === 'meads' && x % 2 ? 'birch' : th.trees, v: x % 3, x: x * T + 8, y: cy * T + 1 }); lastTree = x;
        }
        if (keep.has(x)) continue;
        let acc = 0; const h2 = hash2(x * 31 + 1, cy * 17 + th.seed * 3);
        for (const [type, prob] of th.scatter) { acc += prob; if (h2 < acc) { w.decor.push({ type, v: (h * 97 | 0) % 4, x: x * T + 4 + (h * 8 | 0), y: cy * T + 1 }); break; } }
      }
    }
    const A = w.arena;
    const gy = (w.rows - 3) * T + 1; // Kaamos: the last few houses, and the gate Ana has never passed
    [[2, 0], [13, 1], [21, 2], [30, 0]].forEach(([cx, v]) => w.back.push({ type: 'cottage', v, x: cx * T, y: gy }));
    w.back.push({ type: 'gate', v: 0, x: 39 * T, y: gy });
    w.back.push({ type: 'throne', v: 0, x: A.x1 - 26, y: A.floor });
    for (let i = 0; i < 5; i++) w.back.push({ type: 'banner', v: i, x: A.x0 + 40 + i * 76, y: A.floor - 62, hang: true });
    for (let i = 0; i < 4; i++) w.torches.push({ x: A.x0 + 78 + i * 76, y: A.floor - 40 });
  }

  /* ---------- effects ---------- */
  function dustCol() { const P = w.theme.tiles; return w.t & 1 ? P.capDark : P.light; }
  function dust(x, y, n, spread) { for (let i = 0; i < n; i++) w.parts.push({ x: x + rand(-4, 4), y: y - 1, vx: rand(-0.6, 0.6) + (spread ? (i % 2 ? 1.2 : -1.2) : 0), vy: rand(-0.7, -0.1), life: rand(10, 20), col: dustCol(), sz: 2 }); }
  function ring(x, y, r0, r1, frames, col) { w.rings.push({ x, y, r0, r1, life: frames, max: frames, col }); }
  function spark(x, y, col, n) { for (let i = 0; i < n; i++) w.parts.push({ x, y, vx: rand(-0.3, 0.3), vy: rand(-0.4, 0.3), life: rand(14, 26), col, glow: 1, sz: 1 }); }
  function sparkle(x, y, col, n) { for (let i = 0; i < n; i++) { const a = rand(TAU), s = rand(0.4, 1.8); w.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(14, 30), col: i % 3 ? col : '#ffffff', glow: 1, sz: 1 + (i % 2) }); } }
  function toast(s, long) { w.toastText = s; w.toastT = long ? 420 : 240; w.toastMax = w.toastT; }
  function gainShard(x, y, quiet, n) {
    if (n !== undefined) { Game.meleeGot[n] = 1; Game.melee++; }
    if (!quiet) { w.combo = w.comboT > 0 ? w.combo + 1 : 1; w.comboT = 55; w.comboX = x; w.comboY = y; w.hudPop = 8; Sound.sfx('shard', w.combo); sparkle(x, y, '#9ff4ff', 5 + Math.min(8, w.combo)); }
  }
  function gainGem(e) {
    const gem = GEM_BY_ID[e.gem];
    Game.gems[gem.id] = 1;
    const fx = { gem, x: e.x + e.w / 2, y: e.y + e.h / 2, t: 0 };
    if (w.gemFx || w.card) { (w.gemQ || (w.gemQ = [])).push(fx); Game.save(); return; }
    w.gemFx = fx;
    Sound.sfx('gem'); Sound.duck(true); w.flash = 0.5;
    sparkle(e.x + e.w / 2, e.y + e.h / 2, gem.tint, 40);
    Game.save();
  }
  function bump(cx, cy) {
    const ch = tileAt(w, cx, cy), x = cx * T + 8, y = cy * T;
    if (ch === '#' || ch === 'X') return;
    for (const e of w.ents) { const d = ENT[e.type]; if (d.foe && d.arrow && !e.dead && e.x + e.w > cx * T && e.x < cx * T + T && Math.abs(e.y + e.h - y) < 3) slay(w, e, 'bump'); }
    if (ch === 'B') {
      w.grid[cy][cx] = '.'; Sound.sfx('crumble');
      const P = w.colTheme[cx].tiles;
      for (let i = 0; i < 6; i++) w.parts.push({ x: x + rand(-6, 6), y: y + rand(4, 12), vx: rand(-1.6, 1.6), vy: rand(-3.6, -1.2), life: 50, col: i % 2 ? P.brick : P.brickDark, g: 0.25, sz: 3 + (i % 2) });
      return;
    }
    w.bumps.push({ cx, cy, t: 10 });
    if (ch === 'U') { Sound.sfx('bump'); return; }
    w.grid[cy][cx] = 'U';
    if (ch === 'G') { const id = w.gemBlocks[cx + ',' + cy]; if (id && !Game.gems[id]) { w.ents.push(makeEnt({ t: 'gem', x, y: y - 6, gem: id })); sparkle(x, y - 8, '#fff6c8', 24); Sound.sfx('power'); toast('Something bright was buried here…'); } }
    else if (ch === '?') { w.ents.push(makeEnt({ t: 'pop', x, y: y - 12 })); gainShard(x, y - 8, false, w.popN[cx + ',' + cy]); Sound.sfx('bump'); }
    else { w.ents.push(makeEnt({ t: ch === 'H' ? 'cake' : 'bloom', x, y })); Sound.sfx('item'); }
  }
  function checkpoint(x, y) { Game.cp = { x, y }; Game.save(); for (const p of w.players) if (!p.dead) p.hp = MAXHP; }
  function wonder(def, x, y) { // a thing seen: nothing gained but the having seen it
    Game.wonders[def.id] = 1; Game.save(); w.wonderCard = { def, t: 0 }; Sound.sfx('wonder'); Sound.duck(true); setTimeout(() => { if (!w.card && !w.gemFx) Sound.duck(false); }, 1600);
    ring(x, y, 6, 170, 46, '#fff3c4'); ring(x, y, 4, 100, 34, '#ffffff'); sparkle(x, y, '#fff3c4', 30);
  }
  function warp(to) { if (!w.marks[to] || w.warpFx) return; w.warpFx = { t: 0, to }; Sound.sfx('warp'); for (const p of w.players) { p.control = false; p.vx = 0; p.lit = false; } }
  function lightBeacon(e) {
    Sound.sfx('beacon'); w.flash = 0.6; w.shake = 6; ring(e.x + 20, e.y, 4, 210, 34, '#ffb040'); ring(e.x + 20, e.y, 4, 120, 26, '#fff6b0');
    if (!e.final) { checkpoint(e.x + 20, e.y + 56); toast(e.text); setTimeout(() => Sound.sfx('fanfare'), 500); return; }
    w.state = 'clear'; w.clearT = 0; w.clearText = e.text;
    for (const p of w.players) { p.control = false; p.auto = 0; p.inv = 0; }
    Sound.music(null);
    setTimeout(() => Sound.sfx('fanfare'), 700);
  }
  function setGate(col, ch) { const A = w.arena; for (let i = 0; i < 9; i++) { const r = w.rows - 1 - (A.a + i); if (r >= 0) w.grid[r][col] = ch; } }
  function startFight() {
    const A = w.arena;
    w.fight = true; setGate(A.gl, 'X'); w.minX = A.x0; w.maxX = A.x1;
    for (const p of w.players) if (p.x < A.x0 + 6) { p.x = A.x0 + 8; }
    w.boss.st = 'intro'; w.boss.t0 = 0; Sound.music('boss'); Sound.setRate(1); Sound.sfx('slam'); w.shake = 10;
  }
  function clearHazards() { for (const e of w.ents) if (e.type === 'wave' || e.type === 'fall') e.dead = true; }
  function bossDefeated(x) {
    w.fight = false; setGate(w.arena.gr, '.'); setGate(w.arena.gl, '.'); w.minX = w.bx0; w.maxX = w.bx1;
    w.dawning = true; Sound.music('dawn'); toast('The Hoarder King is fallen. The Mountain of Light is waiting.');
    Game.stats.foes++; Game.bossDown = true;
    w.ents.push(makeEnt({ t: 'gem', x: clamp(x, w.arena.x0 + 40, w.arena.x1 - 40), y: w.arena.floor - 6, gem: 'kohinoor' }));
    Game.save();
  }

  /* ---------- starlight: bridges that are only there in it, doors that only show in it ---------- */
  function starlight() {
    for (const k in w.moon) if (--w.moon[k] <= 0) delete w.moon[k];
    let any = 0;
    { // does this place want her light, or her stillness? Then show the key over her head, not a sentence.
      const p = w.player; let pr = null;
      if (w.gaze && !p.cloak) pr = 'down';
      else if (!p.lit && !p.dead && !p.lumOut) {
        const pcx = Math.floor((p.x + 5) / T), pcy = Math.floor((p.y + 10) / T);
        scan: for (let cy = Math.max(0, pcy - 4); cy <= Math.min(w.rows - 1, pcy + 4); cy++) for (let cx = Math.max(0, pcx - 6); cx <= Math.min(w.cols - 1, pcx + 6); cx++) { const ch = w.grid[cy][cx]; if (ch === 'D' || (ch === 'M' && !w.moon[cx + cy * w.cols])) { pr = 'light'; break scan; } }
        if (!pr) for (const e of w.ents) if ((e.type === 'warp' && Math.abs(e.x + 8 - p.x - 5) < 56 && Math.abs(e.y + 48 - p.y - p.h) < 50) || (e.type === 'wonder' && e.def.id === 'undersky' && !e.seen && Math.abs(e.cx - p.x - 5) < 120 && Math.abs(e.gy - p.y - p.h) < 40)) { pr = 'light'; break; }
      }
      w.prompt = pr;
    }
    for (const p of w.players) {
      if (!p.lit || p.dead) continue;
      any = 1;
      const pcx = Math.floor((p.x + 5) / T), pcy = Math.floor((p.y + 10) / T);
      for (let cy = Math.max(0, pcy - 6); cy <= Math.min(w.rows - 1, pcy + 6); cy++) for (let cx = Math.max(0, pcx - 6); cx <= Math.min(w.cols - 1, pcx + 6); cx++) {
        const ch = w.grid[cy][cx];
        if (ch !== 'M' && ch !== 'D' && ch !== '?' && ch !== 'H' && ch !== 'S' && ch !== 'G') continue;
        if (Math.hypot(cx * T + 8 - (p.x + 5), cy * T + 8 - (p.y + 10)) > 92) continue;
        if (ch !== 'M' && ch !== 'D') { if ((w.t + cx * 5 + cy * 3) % 16 === 0) bump(cx, cy); continue; } // a sleeping stone wakes to her light
        if (ch === 'M') { const k = cx + cy * w.cols; if (!w.moon[k]) { sparkle(cx * T + 8, cy * T + 3, '#dff2ff', 6); if (w.t - (w.bridgeS || 0) > 12) { Sound.sfx('bridge'); w.bridgeS = w.t; } } w.moon[k] = 170; }
        else { const d = w.doors.find(q => q.cx === cx && cy <= q.cy && cy > q.cy - q.h); if (d) d.seen = w.t; }
      }
    }
    if (w.litHold) { any = 1; w.litHold = 0; }
    w.lit += (any - w.lit) * 0.08;
    for (const d of w.doors) {
      if (Game.doors[d.id]) continue;
      const k = d.id;
      if (d.seen === w.t) { w.doorP[k] = (w.doorP[k] || 0) + 1; if (w.doorP[k] % 6 === 0) sparkle(d.cx * T + rand(16), (d.cy - rand(d.h)) * T + 8, '#dff2ff', 2); }
      else if (w.doorP[k] > 0) w.doorP[k] -= 0.5;
      if (w.doorP[k] >= 70) {
        Game.doors[k] = 1; Sound.sfx('door'); w.shake = 6; w.flash = 0.35;
        for (let i = 0; i < d.h; i++) { w.grid[d.cy - i][d.cx] = '.'; for (let j = 0; j < 6; j++) w.parts.push({ x: d.cx * T + rand(16), y: (d.cy - i) * T + rand(16), vx: rand(-1, 1), vy: rand(-1.6, 0.4), life: rand(30, 60), col: j % 2 ? '#dff2ff' : '#8fb4ff', glow: 1, sz: 1 + (j % 2) }); }
        ring(d.cx * T + 8, (d.cy - d.h / 2) * T + 8, 6, 120, 28, '#dff2ff');
        if (d.text) toast(d.text);
        Game.save();
      }
    }
  }
  /* ---------- the Hoarder's gaze: on his own ground he looks for her; a stone by the road is not looked at ---------- */
  function hoarderGaze() {
    const on = w.theme.gaze && w.bossAlive && !w.fight && w.state === 'play' && !w.card && w.player.x < w.arena.x0 - 220;
    if (!on) { w.gaze = null; return; }
    if (!w.gaze) { if (!w.wonderCard && --w.gazeT <= 0 && w.player.onGround) { w.gaze = { t: 0, caught: false }; Sound.sfx('gaze'); } return; }
    const g = w.gaze; g.t++;
    if (g.t > 100 && !g.caught) { // the sweep
      const bx = w.cam.x + W + 40 - (g.t - 100) * 3.4;
      for (const p of w.players) if (!p.dead && !p.cloak && p.radiant <= 0 && Math.abs(p.x + 5 - bx) < 22) {
        g.caught = true; Sound.sfx('seen'); toast('He has seen you.'); w.shake = 8;
        hurtPlayer(w, p, bx + 40);
      }
      if (bx < w.cam.x - 60 || g.caught) { if (g.t > 100 + (W + 100) / 3.4 || g.caught) { w.gaze = null; w.gazeT = 1500 + rand(500) | 0; } }
    }
  }

  /* ---------- simulation ---------- */
  const ALWAYS = { boss: 1, wave: 1, fall: 1 };
  function update() {
    w.fxT = (w.fxT || 0) + 1;
    if (w.gemFx) { // a held breath before the card: the stone rises in a wheel of light
      const fx = w.gemFx; fx.t++; fx.y -= 0.25;
      for (const q of w.parts) { q.x += q.vx; q.y += q.vy; q.life--; }
      w.parts = w.parts.filter(q => q.life > 0);
      if (fx.t % 3 === 0) sparkle(fx.x, fx.y, fx.gem.tint, 3);
      if (w.flash > 0) w.flash = Math.max(0, w.flash - 0.03);
      if (fx.t > 44) w.flash = Math.min(1, (fx.t - 44) / 10);
      if (fx.t >= 55) { w.card = { gem: fx.gem, t: 0 }; w.gemFx = null; w.flash = 0; }
      return;
    }
    if (w.warpFx) { // through the tear: the afternoon folds, and opens somewhere else
      const fx = w.warpFx; fx.t++;
      for (const q of w.parts) { q.x += q.vx; q.y += q.vy; q.life--; }
      w.parts = w.parts.filter(q => q.life > 0);
      if (fx.t === 46) {
        const m = w.marks[fx.to], p = w.player;
        p.x = m.x - 5; p.y = m.y - p.h; p.vx = p.vy = 0; p.safe = { x: p.x, y: p.y }; p.face = 1; p.hp = MAXHP; p.gliding = false; p.ride = null;
        w.parts = []; w.rings = []; w.signHold = null; w.signText = null; w.gaze = null;
        Game.cp = { x: m.x, y: m.y }; w.spawn = Game.cp;
        enterZone(zoneAt(p.x + 5));
        w.cam.x = clamp(p.x - W / 2 + 24, w.bx0, w.bx1 - W); w.cam.y = clamp(p.y + 11 - H * 0.72, 0, w.rows * T - H + 18); lastCamX = w.cam.x;
        Game.save();
      }
      if (fx.t >= 96) { w.warpFx = null; for (const p of w.players) p.control = true; sparkle(w.player.x + 5, w.player.y + 10, '#dff2ff', 20); }
      return;
    }
    if (w.hitstop > 0) { // a held frame: presses made during it are kept, not lost
      for (const p of w.players) { if (act(p, 'jump', true)) p.jbuf = 8 + w.hitstop; if (act(p, 'fire', true)) p.fireBuf = true; }
      w.hitstop--; return;
    }
    if (w.card) {
      w.card.t++;
      if (w.card.t > 70 && (Input.hit('enter') || Input.hit('jump') || Input.hit('jump2') || Input.hit('tap'))) { w.card = null; Sound.sfx('confirm'); if (w.gemQ && w.gemQ.length) { w.gemFx = w.gemQ.shift(); Sound.sfx('gem'); } else Sound.duck(false); }
      return;
    }
    w.t++;
    const calm = World.calm;
    if (calm) { if (w.flash > 0.2) w.flash = 0.2; if (w.shake > 3) w.shake = 3; }
    else { if (w.flash > 1) w.flash = 1; if (w.shake > 28) w.shake = 28; }
    if (w.slow > 0 && (--w.slow & 1)) return; // half speed for a held breath
    if (w.hurtFx > 0) w.hurtFx--;
    for (const q of w.rings) q.life--; if (w.rings.length) w.rings = w.rings.filter(q => q.life > 0);
    if (w.introT > 0) w.introT--;
    if (w.comboT > 0) w.comboT--; if (w.hudPop > 0) w.hudPop--;
    if (w.toastT > 0 && !w.wonderCard) w.toastT--; // a notice waits its turn behind a wonder
    if (w.wonderCard && ++w.wonderCard.t > 600) w.wonderCard = null;
    const hush = !!w.wonderCard; // while there is a wonder to look at, everything else on the road stops to look as well
    if (w.shake > 0) w.shake *= 0.86;
    if (w.flash > 0) w.flash = w.flash > 0.6 ? w.flash * 0.8 : Math.max(0, w.flash - 0.03);
    if (w.dawning && w.dawn < 1) w.dawn = Math.min(1, w.dawn + 0.004);
    w.signText = null; w.signNear = null;
    for (const pl of w.plats) ENT.plat.pre(w, pl);
    for (const p of w.players) updatePlayer(w, p);
    starlight();
    hoarderGaze();
    const alive = w.players.filter(p => !p.dead);
    w.player = alive[0] || w.players[0];
    for (const p of w.players) if (p.dead > 170 && alive.length && w.state === 'play') { // a fallen companion returns
      const q = alive[0]; Object.assign(p, makePlayer(q.x + 5, q.y + q.h, p.id)); p.hp = 2; p.inv = 150; sparkle(p.x + 5, p.y + 10, '#bff4ff', 16); Sound.sfx('heal');
    }
    if (alive.length > 1) { // keep companions together: a rider is never dragged off; a straggler is brought to the leader
      const rider = alive.find(p => p.ride), [a, b] = alive;
      if (rider || Math.abs(a.y - b.y) > H * 0.8) {
        const lead = rider || (a.y < b.y ? a : b), lag = lead === a ? b : a;
        if (lag.x < w.cam.x - 2 || lag.x > w.cam.x + W - 8 || Math.abs(a.y - b.y) > H * 0.8 || Math.abs(a.x - b.x) > W * 0.8) { lag.x = lead.x; lag.y = lead.y; lag.vx = lag.vy = 0; lag.inv = Math.max(lag.inv, 60); lag.ride = lead.ride; sparkle(lag.x + 5, lag.y + 10, '#bff4ff', 10); }
      } else for (const p of alive) p.x = clamp(p.x, w.cam.x + 3, w.cam.x + W - 13);
    }
    if (alive.length) w.deadT = 0;
    const cx = w.cam.x + W / 2;
    for (let i = 0; i < w.ents.length; i++) {
      const e = w.ents[i], d = ENT[e.type];
      if (e.dead) continue;
      if (d.foe && (hush || (!ALWAYS[e.type] && Math.abs(e.x - cx) > W / 2 + 90))) continue;
      d.update(w, e);
      if (e.flash > 0) e.flash--;
    }
    // words stay up long enough to be read, even if the walker has moved on
    if (w.signText) { if (!w.signHold || w.signHold.text !== w.signText) w.signHold = { text: w.signText, e: w.signNear, t0: w.t }; }
    else if (w.signHold) { const h = w.signHold; if (w.t - h.t0 < Math.max(170, h.text.length * 3.6)) { w.signText = h.text; w.signNear = h.e; } else w.signHold = null; }
    // foes vs the travellers
    if (w.state === 'play' && !hush && !w.warpFx) for (const p of alive) for (const e of w.ents) {
      const d = ENT[e.type];
      if (!d.foe || e.dead || p.dead || !overlap(e, p)) continue;
      const above = p.vy > 0.3 && p.y + p.h - p.vy <= e.y + Math.max(8, e.h * 0.5);
      if (e.type === 'boss') {
        if (d.vulnerable(e) && above) { bossHit(w, e, 2, p.x + 5, p.y + p.h); p.vy = -5; p.glide = GLIDE_MAX; }
        else if (!d.harmless(e)) hurtPlayer(w, p, e.x + e.w / 2);
        continue;
      }
      if (d.harmless && d.harmless(e)) continue;
      if (p.cloak && d.arrow) continue; // what the cloak covers, hungry things walk past
      if (p.radiant > 0 && d.arrow) { slay(w, e, 'radiant'); Sound.sfx('stomp'); continue; }
      if (d.stomp && above) {
        damageFoe(w, e, 1, 'stomp');
        const hold = act(p, 'jump');
        p.vy = hold ? -5.3 : -3.6; p.jumping = hold; p.glide = GLIDE_MAX; p.y = Math.min(p.y, e.y - p.h + 2);
        w.hitstop = Math.max(w.hitstop, 5); w.shake = Math.max(w.shake, 4); p.sq = 1.28;
        ring(p.x + 5, p.y + p.h, 5, 24, 9, '#ffffff');
        for (let i = 0; i < 10; i++) w.parts.push({ x: p.x + 5, y: p.y + p.h, vx: (i < 5 ? -1 : 1) * rand(0.8, 2.6), vy: rand(-1.2, -0.1), life: rand(12, 22), col: i % 2 ? '#ffffff' : dustCol(), sz: 2 });
      } else hurtPlayer(w, p, e.x + e.w / 2);
    }
    if (w.ents.some(e => e.dead)) { w.ents = w.ents.filter(e => !e.dead); }
    for (const q of w.parts) { q.x += q.vx; q.y += q.vy; if (q.g) q.vy += q.g; q.life--; }
    if (w.parts.length) w.parts = w.parts.filter(q => q.life > 0);
    if (w.parts.length > 500) w.parts.splice(0, w.parts.length - 500);
    for (const b of w.bumps) b.t--;
    if (w.bumps.length) w.bumps = w.bumps.filter(b => b.t > 0);

    const lead = w.player;
    if (w.bossAlive && w.boss && !w.fight && alive.length && lead.x > w.arena.x0 + 44 && lead.x < w.arena.x1) startFight();
    const z = zoneAt(lead.x + 5);
    if (z !== w.zone && !lead.dead) enterZone(z);

    // camera
    const fx = alive.length ? alive.reduce((a, p) => a + p.x, 0) / alive.length : lead.x;
    let tx = fx + 5 - W / 2 + (alive.length === 1 ? lead.face * 24 : 0), ty = lead.y + 11 - H * 0.72;
    if (alive.length > 1) ty = (alive[0].y + alive[1].y) / 2 + 11 - H * 0.6;
    if (w.fight) tx = w.arena.x0;
    if (w.state === 'clear') tx = lead.x + 5 - W / 2 + 30;
    w.cam.x += (clamp(tx, w.bx0, w.bx1 - W) - w.cam.x) * (w.fight ? 0.06 : 0.1);
    if (lead.onGround || Math.abs(ty - w.cam.y) > 46) w.cam.y += (clamp(ty, 0, w.rows * T - H + 18) - w.cam.y) * 0.08; // show less dead ground
    w.cam.y = clamp(w.cam.y, 0, w.rows * T - H + 18);

    if (w.state === 'clear') { w.clearT++; if (w.clearT === 330) Game.finish(); }
    else if (!alive.length) { if (++w.deadT === 62) Game.playerDied(); }
    else if (w.state === 'play') Game.stats.frames++;
  }

  /* ---------- rendering ---------- */
  // blend factor toward the neighbouring zone when the camera is near a border
  function blend() {
    const cx = w.cam.x + W / 2, z = zoneAt(cx), i = w.zones.indexOf(z), R0 = 150;
    if (z.warp) return { a: z, b: null, k: 0 };
    if (cx - z.x0 < R0 && i > 0 && w.zones[i - 1].theme !== z.theme) return { a: z, b: w.zones[i - 1], k: 0.5 - (cx - z.x0) / (R0 * 2) };
    if (z.x1 - cx < R0 && i < w.zones.length - 1 && !w.zones[i + 1].warp && w.zones[i + 1].theme !== z.theme) return { a: z, b: w.zones[i + 1], k: 0.5 - (z.x1 - cx) / (R0 * 2) };
    return { a: z, b: null, k: 0 };
  }
  function darkness(c, ox, oy, bl) {
    const A = THEMES[bl.a.theme], B = bl.b ? THEMES[bl.b.theme] : A;
    const a = lerp(A.dark, B.dark, bl.k) * (1 - w.dawn * 0.8);
    if (a <= 0.01) return;
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, W, H);
    lg.fillStyle = `rgba(${A.darkCol || B.darkCol},${a})`; lg.fillRect(0, 0, W, H);
    lg.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, k) => {
      if (x < -r || x > W + r || y < -r || y > H + r) return;
      lg.globalAlpha = k || 1; lg.drawImage(holeImg, x - r, y - r, r * 2, r * 2); lg.globalAlpha = 1;
    };
    for (const p of w.players) if (!p.dead) hole(p.x - ox + 5, p.y - oy + 10, p.lit ? 132 : p.radiant > 0 ? 120 : p.cloak ? 30 : 84 + Math.sin(w.t * 0.05) * 3, 1);
    for (const tq of w.torches) { hole(tq.x - ox, tq.y - oy, 78 + Math.sin(w.t * 0.3 + tq.x) * 3, 0.95); hole(tq.x - ox, tq.y - oy + 22, 44, 0.5); }
    for (const e of w.ents) {
      const d = ENT[e.type];
      if (d.light) { const r = d.light(e); if (r) hole(e.x - ox + e.w / 2, e.y - oy + e.h / 3, r, 0.95); }
      else if (d.glowR && !(d.harmless && d.harmless(e))) hole(e.x - ox + e.w / 2, e.y - oy + e.h / 2, d.glowR, 0.8);
      else if (e.type === 'shard') hole(e.x - ox + 4, e.y - oy + 5, 9, 0.6);
      else if (d.foe && d.arrow) hole(e.x - ox + e.w / 2, e.y - oy + e.h / 2, 22 + e.w * 0.5, 0.5);
    }
    const x0 = Math.max(0, Math.floor(ox / T)), x1 = Math.min(w.cols - 1, Math.floor((ox + W) / T));
    for (let cx = x0; cx <= x1; cx++) {
      if (!w.colTheme[cx].liquid.glow) continue;
      for (let cy = Math.max(1, Math.floor(oy / T)); cy < w.rows; cy++) {
        if (w.grid[cy][cx] === '~' && w.grid[cy - 1][cx] !== '~') {
          const x = cx * T - ox, y = cy * T - oy;
          lg.drawImage(lavaImg, x, y - 56, T, 62); lg.fillStyle = 'rgba(0,0,0,0.85)'; lg.fillRect(x, y + 6, T, T * 3);
          break;
        }
      }
    }
    c.drawImage(lc, 0, 0, W, H);
  }
  function drawParts(c, ox, oy, glow) {
    for (const q of w.parts) {
      if (!!q.glow !== glow) continue;
      const x = q.x - ox, y = q.y - oy;
      if (x < -20 || x > W + 20) continue;
      if (q.draw) q.draw(c, x, y, q);
      else { const s = (q.sz || 1) * 0.62, k = q.max ? q.life / q.max : Math.min(1, q.life / 8); c.globalAlpha = Math.min(1, k * 1.4); c.fillStyle = q.col; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
  }
  let blendCv = null;
  function draw(c) {
    const sh = w.shake > 0.5 ? w.shake : 0;
    const ox = w.cam.x + rand(-sh, sh) * 0.5, oy = w.cam.y + rand(-sh, sh) * 0.5;
    const bl = blend(), yo = w.rows * T - H - w.cam.y;
    Paint.backdrop(c, bl.a.theme, w.cam.x, yo, w.t, w.lit);
    if (bl.b && bl.k > 0.01) { // crossing a border: the next land's sky comes up through this one
      const cw = c.canvas.width, chh = c.canvas.height;
      if (!blendCv || blendCv.width !== cw || blendCv.height !== chh) { blendCv = document.createElement('canvas'); blendCv.width = cw; blendCv.height = chh; }
      const g2 = blendCv.getContext('2d'); g2.setTransform(cw / W, 0, 0, cw / W, 0, 0); g2.globalAlpha = 1;
      Paint.backdrop(g2, bl.b.theme, w.cam.x, yo, w.t, w.lit);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = bl.k; c.drawImage(blendCv, 0, 0); c.restore();
    }
    if (w.dawn > 0) { c.fillStyle = `rgba(255,190,120,${w.dawn * 0.25})`; c.fillRect(0, 0, W, H); }
    if (w.state === 'clear') { // far beacons answer, one by one
      [[60, 92], [168, 78], [318, 96]].forEach(([x, y], i) => {
        const k = clamp((w.clearT - 110 - i * 45) / 30, 0, 1);
        if (k > 0) { Paint.soft(c, x, y, (10 + Math.sin(w.t * 0.3 + i) * 2) * k, '#ffb040', 0.95); Paint.disc(c, x, y, 1.1 * k, '#fff6b0'); }
      });
    }
    for (const d of w.back) { const x = d.x - ox; if (x > W + 80 || x < -80) continue; Paint.prop(c, d.type, d.v, x, d.y - oy, w, d); }
    for (const e of w.ents) { const d = ENT[e.type]; if (d.back) d.back(c, w, e, ox, oy); }
    for (const tq of w.torches) Paint.torch(c, tq.x - ox, tq.y - oy + 14, w.t, false);
    for (const d of w.decor) { const x = d.x - ox; if (x > W + 20 || x < -20) continue; Paint.prop(c, d.type, d.v, x, d.y - oy, w, d); }
    { // mist in the deeps, where there is no ground
      const L = Paint.LOOK[w.theme.id] || Paint.LOOK.north, yb = w.rows * T - oy - 70;
      if (yb < H) { c.fillStyle = Paint.vgrad(c, yb, yb + 70, [L.pit + '00', L.pit + 'cc', L.pit]); c.fillRect(0, yb, W, H - yb + 1); }
    }
    Paint.liquid(c, w, ox, oy, false);
    Paint.terrain(c, w, ox, oy);
    Paint.tiles(c, w, ox, oy);
    for (const e of w.ents) { const d = ENT[e.type]; if (!d.lit && e.x - ox < W + 40 && e.x + e.w - ox > -40) d.draw(c, w, e, ox, oy); }
    for (let i = w.players.length - 1; i >= 0; i--) drawPlayer(c, w, w.players[i], ox, oy);
    drawParts(c, ox, oy, false);
    darkness(c, ox, oy, bl);
    Paint.liquid(c, w, ox, oy, true);
    for (const tq of w.torches) Paint.torch(c, tq.x - ox, tq.y - oy + 14, w.t, true);
    for (const e of w.ents) { const d = ENT[e.type]; if (d.lit && e.x - ox < W + 40 && e.x + e.w - ox > -40) d.draw(c, w, e, ox, oy); }
    drawParts(c, ox, oy, true);
    for (const q of w.rings) { const k = 1 - q.life / q.max, r = q.r0 + (q.r1 - q.r0) * (1 - (1 - k) * (1 - k)); c.globalAlpha = 0.22 * (1 - k); c.strokeStyle = q.col; c.lineWidth = 3 + r * 0.06; c.beginPath(); c.arc(q.x - ox, q.y - oy, Math.max(0.1, r), 0, TAU); c.stroke(); } // a soft swell of light, not a drawn circle
    c.globalAlpha = 1;
    Paint.ambient(c, w.amb, w.t, w.cam.x - lastCamX); lastCamX = w.cam.x;
    if (w.gemFx) {
      const fx = w.gemFx, x = fx.x - ox, y = fx.y - oy, k = Math.min(1, fx.t / 30);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = fx.gem.tint;
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + w.fxT * 0.02, len = (60 + (i % 3) * 40) * k, wd = 0.05 + (i % 2) * 0.04; c.globalAlpha = 0.2 * k; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - wd) * len, y + Math.sin(a - wd) * len); c.lineTo(x + Math.cos(a + wd) * len, y + Math.sin(a + wd) * len); c.fill(); }
      c.restore();
      Paint.soft(c, x, y, 34 + 20 * k, '#ffffff', 0.6);
      drawGemHi(c, x, y, 6 + 6 * k, fx.gem, w.fxT);
    }
    if (w.gaze) { // the sky warms; then the look itself crosses the road, slow and soft
      const g = w.gaze, warn = clamp(g.t / 60, 0, 1) * (0.1 + 0.03 * Math.sin(w.t * 0.12));
      c.fillStyle = `rgba(255,120,40,${warn})`; c.fillRect(0, 0, W, H);
      if (g.t > 100) {
        const bx = W + 40 - (g.t - 100) * 3.4, gr = c.createLinearGradient(bx - 70, 0, bx + 70, 0);
        gr.addColorStop(0, 'rgba(255,150,60,0)'); gr.addColorStop(0.5, 'rgba(255,170,80,0.26)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.moveTo(bx - 24, 0); c.lineTo(bx + 24, 0); c.lineTo(bx + 70, H); c.lineTo(bx - 70, H); c.fill(); c.restore();
      }
    }
    if (w.warpFx) { // the afternoon, folding
      const t = w.warpFx.t, k = t < 46 ? t / 46 : 1 - (t - 46) / 50, p = w.player, px = p.x - ox + 5, py = p.y - oy + 10;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { const r = t < 46 ? (1 - k) * 220 * (1 - i * 0.16) + 6 : (1 - k) * 260 * (1 - i * 0.16) + 6; c.globalAlpha = 0.5 * k; c.strokeStyle = i % 2 ? '#ffe6a8' : '#bfe4ff'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(px, py, r * 0.7, r, 0, 0, TAU); c.stroke(); }
      c.restore();
      c.fillStyle = World.calm ? `rgba(10,14,36,${k * k})` : `rgba(255,250,236,${k * k})`; c.fillRect(0, 0, W, H);
    }
    if (w.hurtFx > 0) { c.globalAlpha = (w.hurtFx / 16) * (w.hurtFx / 16); c.drawImage(hurtImg, 0, 0, W, H); c.globalAlpha = 1; }
    if (w.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(1, w.flash)})`; c.fillRect(0, 0, W, H); }
    // embers about to leap from lava below the screen are announced at its edge
    for (const e of w.ents) if (e.type === 'ember' && e.warn > 0 && e.x - ox > -10 && e.x - ox < W + 10) { const yy = Math.min(e.by - oy, H - 4); Paint.soft(c, e.x - ox + 4, yy, 8 + (40 - e.warn) * 0.3, '#ff7a20', 0.5 + 0.3 * Math.sin(w.t * 0.6)); }
  }

  return Object.assign(w, { load, update, draw, ring, dust, spark, sparkle, toast, gainShard, gainGem, bump, lightBeacon, checkpoint, bossDefeated, clearHazards, wonder, warp, zoneAt });
})();
