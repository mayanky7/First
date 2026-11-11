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
      shake: 0, flash: 0, signText: null, signNear: null, toastT: 0, introT: 0, clearT: 0, card: null, deadT: 0, gemFx: null, hitstop: 0, combo: 0, comboT: 0, hudPop: 0, rings: [], slow: 0, hurtFx: 0,
      gemBlocks: L.gemBlocks, popN: L.popN, gemQ: [], arena: L.arena, bossAlive: !Game.bossDown, fight: false, dawn: Game.bossDown ? 1 : 0, dawning: false, minX: 0, maxX: L.cols * T, boss: null, meleeTotal: L.melee
    });
    w.colTheme = new Array(w.cols);
    for (let cx = 0; cx < w.cols; cx++) w.colTheme[cx] = THEMES[zoneAt(cx * T + 8).theme];
    for (const k in L.gemBlocks) if (Game.gems[L.gemBlocks[k]]) { const [gx, gy] = k.split(',').map(Number); w.grid[gy][gx] = 'U'; }
    for (const k in L.popN) if (Game.meleeGot[L.popN[k]]) { const [gx, gy] = k.split(',').map(Number); w.grid[gy][gx] = 'U'; }
    w.ents = L.ents.filter(s => !(s.t === 'shard' && Game.meleeGot[s.n]) && !(s.t === 'gem' && Game.gems[s.gem]) && !(s.t === 'boss' && Game.bossDown)).map(makeEnt);
    if (Game.bossDown) { setGate(w.arena.gr, '.'); if (!Game.gems.kohinoor) w.ents.push(makeEnt({ t: 'gem', x: (w.arena.x0 + w.arena.x1) / 2, y: w.arena.floor - 30, gem: 'kohinoor' })); }
    w.plats = w.ents.filter(e => e.type === 'plat');
    w.boss = w.ents.find(e => e.type === 'boss') || null;
    const sp = cp || L.start;
    w.players = [makePlayer(sp.x, sp.y, 0)];
    if (Game.coop) w.players.push(makePlayer(sp.x - 14, sp.y, 1));
    w.player = w.players[0];
    if (cp) { for (const p of w.players) p.sq = 1.3; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; w.parts.push({ x: sp.x + Math.cos(a) * 26, y: sp.y - 11 + Math.sin(a) * 26, vx: -Math.cos(a) * 2, vy: -Math.sin(a) * 2, life: 13, col: i % 2 ? '#bff4ff' : '#ffffff', glow: 1, sz: 2 }); } }
    for (const e of w.ents) if ((e.type === 'lantern' || (e.type === 'beacon' && !e.final)) && e.x + e.w / 2 <= sp.x + 1) { e.on = true; e.fire = 1; }
    w.cam.x = clamp(w.player.x - W / 2, 0, w.cols * T - W);
    w.cam.y = clamp(w.player.y - H * 0.55, 0, w.rows * T - H);
    lastCamX = w.cam.x;
    w.zone = null; enterZone(zoneAt(w.player.x + 5));
    scatter();
    Sound.duck(false);
  }
  function enterZone(z) {
    w.zone = z; w.theme = THEMES[z.theme];
    w.amb = Backdrop.makeAmbient(w.theme.amb);
    if (!w.fight) { Sound.music(Game.bossDown && z.theme === 'gloam' ? 'dawn' : w.theme.music); Sound.setRate(z.manic > 1 ? 0.84 : 1); }
    Game.region = z.map;
    const key = z.title + '|' + z.sub;
    if (!Game.seen[key]) { Game.seen[key] = 1; w.introT = 180; w.introZone = z; }
  }
  function addPlayer2() {
    if (w.players.length > 1) return;
    const p = w.player, q = makePlayer(p.x + 5, p.y + p.h, 1);
    q.inv = 90; w.players.push(q); sparkle(q.x + 5, q.y + 10, '#ffd070', 20); Sound.sfx('oneup');
  }
  function dropPlayer2() { if (w.players.length > 1) { w.players.length = 1; w.player = w.players[0]; } }

  function scatter() {
    w.decor = []; w.back = [];
    const keep = new Set();
    for (const e of w.ents) if (e.type === 'beacon' || e.type === 'lantern' || e.type === 'sign' || e.type === 'boy') for (let i = -2; i <= 2; i++) keep.add(Math.floor((e.x + e.w / 2) / T) + i);
    let lastTree = -20;
    for (let x = 0; x < w.cols; x++) {
      const th = w.colTheme[x];
      for (let cy = 3; cy < w.rows; cy++) {
        if (w.grid[cy][x] !== '#' || w.grid[cy - 1][x] !== '.') continue;
        const h = hash2(x * 7 + 3, cy * 13 + th.seed);
        if (th.trees && x - lastTree > 7 && h < 0.5 && !keep.has(x) && x > 1 && x < w.cols - 2 && w.grid[cy][x - 1] === '#' && w.grid[cy][x + 1] === '#'
          && (x * T < w.arena.x0 - 60 || x * T > w.arena.x1 + 30)) {
          w.back.push({ img: Backdrop.prop(th.trees, x % 3), x: x * T + 8, y: cy * T + 1 }); lastTree = x;
        }
        if (keep.has(x)) continue;
        let acc = 0; const h2 = hash2(x * 31 + 1, cy * 17 + th.seed * 3);
        for (const [type, prob] of th.scatter) { acc += prob; if (h2 < acc) { w.decor.push({ img: Backdrop.prop(type, (h * 97 | 0) % 4), x: x * T + 4 + (h * 8 | 0), y: cy * T + 1 }); break; } }
      }
    }
    const A = w.arena;
    const gy = (w.rows - 3) * T + 1; // Kaamos: the last few houses, and the gate Ana has never passed
    [[2, 0], [13, 1], [21, 2], [30, 0]].forEach(([cx, v]) => w.back.push({ img: Backdrop.prop('cottage', v), x: cx * T, y: gy }));
    w.back.push({ img: Backdrop.prop('gate', 0), x: 39 * T, y: gy });
    w.back.push({ img: Backdrop.prop('throne', 0), x: A.x1 - 26, y: A.floor });
    for (let i = 0; i < 5; i++) w.back.push({ img: Backdrop.prop('banner', 0), x: A.x0 + 40 + i * 76, y: A.floor - 62, hang: true });
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
  function checkpoint(x, y) { Game.cp = { x, y }; Game.save(); for (const p of w.players) if (!p.dead) p.hp = 3; }
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
    w.fight = false; setGate(w.arena.gr, '.'); setGate(w.arena.gl, '.'); w.minX = 0; w.maxX = w.cols * T;
    w.dawning = true; Sound.music('dawn'); toast('The Hoarder King is fallen — set the Mountain of Light free!');
    Game.stats.foes++; Game.bossDown = true;
    w.ents.push(makeEnt({ t: 'gem', x: clamp(x, w.arena.x0 + 40, w.arena.x1 - 40), y: w.arena.floor - 30, gem: 'kohinoor' }));
    Game.save();
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
    if (w.toastT > 0) w.toastT--;
    if (w.shake > 0) w.shake *= 0.86;
    if (w.flash > 0) w.flash = w.flash > 0.6 ? w.flash * 0.8 : Math.max(0, w.flash - 0.03);
    if (w.dawning && w.dawn < 1) w.dawn = Math.min(1, w.dawn + 0.004);
    w.signText = null; w.signNear = null;
    for (const pl of w.plats) ENT.plat.pre(w, pl);
    for (const p of w.players) updatePlayer(w, p);
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
      if (d.foe && !ALWAYS[e.type] && Math.abs(e.x - cx) > W / 2 + 90) continue;
      d.update(w, e);
      if (e.flash > 0) e.flash--;
    }
    // foes vs the travellers
    if (w.state === 'play') for (const p of alive) for (const e of w.ents) {
      const d = ENT[e.type];
      if (!d.foe || e.dead || p.dead || !overlap(e, p)) continue;
      const above = p.vy > 0.3 && p.y + p.h - p.vy <= e.y + Math.max(8, e.h * 0.5);
      if (e.type === 'boss') {
        if (d.vulnerable(e) && above) { bossHit(w, e, 2, p.x + 5, p.y + p.h); p.vy = -5; p.glide = GLIDE_MAX; }
        else if (!d.harmless(e)) hurtPlayer(w, p, e.x + e.w / 2);
        continue;
      }
      if (d.harmless && d.harmless(e)) continue;
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
    if (w.bossAlive && w.boss && !w.fight && alive.length && Math.max(...alive.map(p => p.x)) > w.arena.x0 + 44) startFight();
    const z = zoneAt(lead.x + 5);
    if (z !== w.zone && !lead.dead) enterZone(z);

    // camera
    const fx = alive.length ? alive.reduce((a, p) => a + p.x, 0) / alive.length : lead.x;
    let tx = fx + 5 - W / 2 + (alive.length === 1 ? lead.face * 24 : 0), ty = lead.y + 11 - H * 0.56;
    if (alive.length > 1) ty = (alive[0].y + alive[1].y) / 2 + 11 - H * 0.5;
    if (w.fight) tx = w.arena.x0;
    if (w.state === 'clear') tx = lead.x + 5 - W / 2 + 30;
    w.cam.x += (clamp(tx, 0, w.cols * T - W) - w.cam.x) * (w.fight ? 0.06 : 0.1);
    if (lead.onGround || Math.abs(ty - w.cam.y) > 46) w.cam.y += (clamp(ty, 0, w.rows * T - H) - w.cam.y) * 0.08;
    w.cam.y = clamp(w.cam.y, 0, w.rows * T - H);

    if (w.state === 'clear') { w.clearT++; if (w.clearT === 330) Game.finish(); }
    else if (!alive.length) { if (++w.deadT === 62) Game.playerDied(); }
    else if (w.state === 'play') Game.stats.frames++;
  }

  /* ---------- rendering ---------- */
  function drawTiles(c, ox, oy) {
    const x0 = Math.max(0, Math.floor(ox / T)), x1 = Math.min(w.cols - 1, Math.floor((ox + W) / T));
    const y0 = Math.max(0, Math.floor(oy / T)), y1 = Math.min(w.rows - 1, Math.floor((oy + H) / T));
    for (let cx = x0; cx <= x1; cx++) {
      const th = w.colTheme[cx], ts = Art.tileSet(th), P = th.tiles;
      for (let cy = y0; cy <= y1; cy++) {
        const ch = w.grid[cy][cx];
        if (ch === '.' || ch === '~') continue;
        let x = cx * T - ox, y = cy * T - oy;
        if (w.bumps.length) for (const b of w.bumps) if (b.cx === cx && b.cy === cy) y -= Math.round(Math.sin(b.t / 10 * Math.PI) * 5);
        const v6 = (hash2(cx, cy) * 6) | 0, v = v6 & 3;
        if (ch === '#') {
          c.drawImage(ts.fill[v6], x, y);
          const up = cy > 0 ? w.grid[cy - 1][cx] : '#', dn = cy < w.rows - 1 ? w.grid[cy + 1][cx] : '#';
          let depth = 0; while (depth < 5 && cy - depth - 1 >= 0 && w.grid[cy - depth - 1][cx] === '#') depth++;
          if (depth) { c.fillStyle = `rgba(10,8,30,${Math.min(0.42, depth * 0.1)})`; c.fillRect(x, y, T, T); }
          if (cx > 0 && w.grid[cy][cx - 1] !== '#') { R(c, x, y, 1, T, P.light); if (v & 1) R(c, x, y + 5 + v, 1, 3, P.dark); }
          if (cx < w.cols - 1 && w.grid[cy][cx + 1] !== '#') { R(c, x + T - 2, y, 2, T, P.dark); if (v > 1) R(c, x + T - 3, y + 3 + v * 2, 1, 4, P.dark); }
          if (dn !== '#' && dn !== '~') { R(c, x, y + T - 2, T, 2, P.dark); if (v < 2) R(c, x + 4 + v * 5, y + T, 2, 2 + v, P.dark); }
          if (up !== '#') { c.fillStyle = 'rgba(10,8,30,0.22)'; c.fillRect(x, y + 6, T, 3); c.drawImage(ts.cap[v], x, y); }
        }
        else if (ch === '=') c.drawImage(ts.plat, x, y);
        else if (ch === 'B') c.drawImage(ts.brick, x, y);
        else if (ch === 'U') c.drawImage(ts.used, x, y);
        else if (ch === '^') c.drawImage(ts.spike, x, y);
        else if (ch === 'X') { R(c, x, y, T, T, '#16131a'); R(c, x + 2, y, 3, T, '#3a3440'); R(c, x + 10, y, 3, T, '#3a3440'); R(c, x, y + 6, T, 2, '#2a2530'); R(c, x + 3, y + 6, 1, 2, '#ff6a20'); }
        else c.drawImage(ts.rune[(w.t >> 3) % 4], x, y);
      }
    }
  }
  function drawLiquid(c, ox, oy, glowPass) {
    const x0 = Math.max(0, Math.floor(ox / T)), x1 = Math.min(w.cols - 1, Math.floor((ox + W) / T));
    const y0 = Math.max(0, Math.floor(oy / T)), y1 = Math.min(w.rows - 1, Math.floor((oy + H) / T));
    for (let cx = x0; cx <= x1; cx++) {
      const Lq = w.colTheme[cx].liquid;
      if (!!Lq.glow !== glowPass) continue;
      for (let cy = y0; cy <= y1; cy++) {
        if (w.grid[cy][cx] !== '~') continue;
        const x = cx * T - ox, y = cy * T - oy, top = cy === 0 || w.grid[cy - 1][cx] !== '~';
        if (top) {
          for (let i = 0; i < 4; i++) {
            const h = Math.round(4 + Math.sin(w.t * 0.07 + (cx * 4 + i) * 0.55) * 1.6);
            R(c, x + i * 4, y + h, 4, T - h, Lq.body); R(c, x + i * 4, y + h, 4, 1, Lq.top);
          }
          const b = (w.t + cx * 37) % 90; if (b < 12) R(c, x + (cx * 5 % 12), y + 7 - (b >> 2), 2, 2, Lq.top);
          if (!Lq.glow) { R(c, x, y + 7, T, 2, Lq.deep); R(c, x + ((w.t >> 3) + cx * 7) % 13, y + 10, 3, 1, Lq.top); }
        } else {
          R(c, x, y, T, T, Lq.deep); R(c, x, y, T, 3, Lq.body);
          const k = (w.t * 0.3 + cx * 9) % 32;
          R(c, x + (k | 0) % 14, y + 6 + (cx % 3) * 3, 3, 1, Lq.body);
        }
        if (top && Lq.glow && cx % 2 === 0) Art.glow(c, x + 8, y + 4, 30, Lq.glow, 0.22 + 0.05 * Math.sin(w.t * 0.1 + cx));
      }
    }
  }
  // blend factor toward the neighbouring zone when the camera is near a border
  function blend() {
    const cx = w.cam.x + W / 2, z = zoneAt(cx), i = w.zones.indexOf(z), R0 = 150;
    if (cx - z.x0 < R0 && i > 0 && w.zones[i - 1].theme !== z.theme) return { a: z, b: w.zones[i - 1], k: 0.5 - (cx - z.x0) / (R0 * 2) };
    if (z.x1 - cx < R0 && i < w.zones.length - 1 && w.zones[i + 1].theme !== z.theme) return { a: z, b: w.zones[i + 1], k: 0.5 - (z.x1 - cx) / (R0 * 2) };
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
    for (const p of w.players) if (!p.dead) hole(p.x - ox + 5, p.y - oy + 10, p.radiant > 0 ? 120 : 84 + Math.sin(w.t * 0.05) * 3, 1);
    for (const tq of w.torches) { hole(tq.x - ox, tq.y - oy, 60 + Math.sin(w.t * 0.3 + tq.x) * 3, 0.95); hole(tq.x - ox, tq.y - oy + 22, 34, 0.5); }
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
    c.drawImage(lc, 0, 0);
  }
  function drawParts(c, ox, oy, glow) {
    for (const q of w.parts) {
      if (!!q.glow !== glow) continue;
      const x = q.x - ox, y = q.y - oy;
      if (q.img) {
        if (q.squash) { const im = q.life > 17 ? Art.flashOf(q.img) : q.img, k = Math.min(1, (22 - q.life) / 4), wd = im.width * (1 + 0.6 * k), hg = im.height * (1 - 0.7 * k); c.drawImage(im, Math.round(x - wd / 2), Math.round(y + q.img.height / 2 - hg), Math.round(wd), Math.max(2, Math.round(hg))); }
        else if (q.spin) { c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(q.spin * (q.max - q.life)); c.drawImage(q.img, -q.img.width / 2, -q.img.height / 2); c.restore(); }
        else if (q.fade) { c.globalAlpha = q.life / q.max * 0.45; Art.blit(c, q.img, x - q.img.width / 2, y - q.img.height / 2, q.flip); c.globalAlpha = 1; }
        else Art.blit(c, q.img, x - q.img.width / 2, y - q.img.height / 2, q.flip, q.flipV);
      } else { c.fillStyle = q.col; const s = q.sz || 1; c.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); }
    }
  }
  function pitOf(th) {
    return th._pit || (th._pit = Art.spr(T, 64, g => { for (let i = 0; i < 8; i++) { g.globalAlpha = Math.min(1, (i + 2) / 6); g.fillStyle = th.pit || '#05060c'; g.fillRect(0, i * 8, T, 8); } }));
  }
  function draw(c) {
    const sh = w.shake > 0.5 ? w.shake : 0;
    const ox = Math.round(w.cam.x + rand(-sh, sh) * 0.5), oy = Math.round(w.cam.y + rand(-sh, sh) * 0.5);
    const bl = blend(), yo = w.rows * T - H - w.cam.y;
    Backdrop.build(bl.a.theme)(c, w.cam.x, yo, w.t);
    if (bl.b && bl.k > 0.01) {
      bg2.globalAlpha = 1; bg2.globalCompositeOperation = 'source-over';
      Backdrop.build(bl.b.theme)(bg2, w.cam.x, yo, w.t);
      c.globalAlpha = bl.k; c.drawImage(bc, 0, 0); c.globalAlpha = 1;
    }
    if (w.dawn > 0) { c.fillStyle = `rgba(255,190,120,${w.dawn * 0.25})`; c.fillRect(0, 0, W, H); }
    if (w.state === 'clear') { // far beacons answer, one by one
      [[60, 92], [168, 78], [318, 96]].forEach(([x, y], i) => {
        const k = clamp((w.clearT - 110 - i * 45) / 30, 0, 1);
        if (k > 0) { Art.glow(c, x, y, (9 + Math.sin(w.t * 0.3 + i) * 2) * k, '#ffb040', 0.95); R(c, x - 1, y - 1, 2, 2, '#fff6b0'); R(c, x, y - 2 - ((w.t >> 3) + i) % 2, 1, 1, '#ffc040'); }
      });
    }
    for (const d of w.back) {
      const x = d.x - ox - d.img.width / 2;
      if (x > W || x + d.img.width < 0) continue;
      c.drawImage(d.img, Math.round(x), Math.round(d.hang ? d.y - oy : d.y - oy - d.img.height));
    }
    for (const tq of w.torches) Backdrop.torch(c, tq.x - ox, tq.y - oy + 14, w.t);
    for (const d of w.decor) { const x = d.x - ox - d.img.width / 2; if (x > W || x < -30) continue; c.drawImage(d.img, Math.round(x), Math.round(d.y - oy - d.img.height)); }
    const yb = w.rows * T - oy - 64;
    if (yb < H) for (let cx = Math.max(0, Math.floor(ox / T)); cx <= Math.min(w.cols - 1, Math.floor((ox + W) / T)); cx++) if (w.grid[w.rows - 1][cx] === '.') c.drawImage(pitOf(w.colTheme[cx]), cx * T - ox, yb);
    drawLiquid(c, ox, oy, false);
    drawTiles(c, ox, oy);
    for (const e of w.ents) { const d = ENT[e.type]; if (!d.lit && e.x - ox < W + 40 && e.x + e.w - ox > -40) d.draw(c, w, e, ox, oy); }
    for (let i = w.players.length - 1; i >= 0; i--) drawPlayer(c, w, w.players[i], ox, oy);
    drawParts(c, ox, oy, false);
    darkness(c, ox, oy, bl);
    drawLiquid(c, ox, oy, true);
    for (const tq of w.torches) { Art.glow(c, tq.x - ox, tq.y - oy - 4, 20 + Math.sin(w.t * 0.3 + tq.x) * 2, '#ff9a30', 0.55); Backdrop.flame(c, tq.x - ox, tq.y - oy, w.t, 1); }
    for (const e of w.ents) { const d = ENT[e.type]; if (d.lit && e.x - ox < W + 40 && e.x + e.w - ox > -40) d.draw(c, w, e, ox, oy); }
    drawParts(c, ox, oy, true);
    for (const q of w.rings) { const k = 1 - q.life / q.max, r = q.r0 + (q.r1 - q.r0) * (1 - (1 - k) * (1 - k)); c.globalAlpha = 0.85 * (1 - k); c.strokeStyle = q.col; c.lineWidth = r > 60 ? 2 : 1; c.beginPath(); c.arc(Math.round(q.x - ox), Math.round(q.y - oy), r, 0, TAU); c.stroke(); }
    c.globalAlpha = 1;
    Backdrop.drawAmbient(c, w.amb, w.t, w.cam.x - lastCamX); lastCamX = w.cam.x;
    { // near silhouettes sliding past in front of everything: depth
      const f = Backdrop.fore(bl.a.theme), LWf = Backdrop.LW, sx0 = (((w.cam.x * 1.4) % LWf) + LWf) % LWf | 0, fy = H - f.height + Math.max(0, Math.round((w.rows * T - H - w.cam.y) * 0.9));
      // drawn in slices, and never over a pit, lava or water: hazards must stay readable
      if (fy < H) for (let x = 0; x < W; x += T) {
        const cxw = Math.floor((ox + x + 8) / T); if (cxw < 0 || cxw >= w.cols || w.grid[w.rows - 1][cxw] !== '#' || w.grid[w.rows - 3][cxw] !== '#') continue;
        c.drawImage(f, (sx0 + x) % LWf, 0, T, f.height, x, fy, T, f.height);
      }
    }
    if (w.gemFx) {
      const fx = w.gemFx, x = fx.x - ox, y = fx.y - oy, k = Math.min(1, fx.t / 30);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = fx.gem.tint;
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + w.fxT * 0.02, len = (60 + (i % 3) * 40) * k, wd = 0.05 + (i % 2) * 0.04; c.globalAlpha = 0.22 * k; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - wd) * len, y + Math.sin(a - wd) * len); c.lineTo(x + Math.cos(a + wd) * len, y + Math.sin(a + wd) * len); c.fill(); }
      c.restore();
      Art.glow(c, x, y, 30 + 20 * k, '#ffffff', 0.6);
      const im = Art.gemSprite(fx.gem), sc = 1 + k * 0.8; c.drawImage(im, Math.round(x - im.width * sc / 2), Math.round(y - im.height * sc / 2), Math.round(im.width * sc), Math.round(im.height * sc));
    }
    if (w.hurtFx > 0) { c.globalAlpha = (w.hurtFx / 16) * (w.hurtFx / 16); c.drawImage(hurtImg, 0, 0); c.globalAlpha = 1; }
    if (w.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(1, w.flash)})`; c.fillRect(0, 0, W, H); }
    if (!w.card) hud(c);
    // embers about to leap from lava below the screen are announced at its edge
    for (const e of w.ents) if (e.type === 'ember' && e.warn > 0 && e.x - ox > -10 && e.x - ox < W + 10) { const yy = Math.min(e.by - oy, H - 4); Art.glow(c, e.x - ox + 4, yy, 8 + (40 - e.warn) * 0.3, '#ff7a20', 0.5 + 0.3 * Math.sin(w.t * 0.6)); R(c, e.x - ox + 3, yy - 6 - (w.t >> 2) % 3, 2, 3, '#ffd070'); }
  }
  function hud(c) {
    const S = Art.S, two = w.players.length > 1;
    c.fillStyle = 'rgba(8,10,20,0.5)'; c.fillRect(3, 3, two ? 68 : 40, two ? 49 : 25); c.fillRect(W - 53, 3, 50, 25);
    if (two) R(c, 6, 28, 62, 1, 'rgba(214,186,120,0.4)');
    w.players.forEach((p, k) => {
      const y = 6 + k * 24;
      for (let i = 0; i < 3; i++) c.drawImage(i < p.hp ? S.heart : S.heartEmpty, 6 + i * 11, y);
      for (let i = 0; i < 3; i++) c.drawImage(i < p.arrows ? S.quiver : S.quiverEmpty, 8 + i * 6, y + 11);
      if (p.arrows < 3) R(c, 27, y + 17, Math.round(p.arrowT / 48 * 10), 1, '#9fe8ff');
      if (p.radiant > 0) R(c, 6, y + 20, Math.round(32 * p.radiant / 600), 1, (w.t >> 2) % 2 ? '#fff6b0' : '#9ff4ff');
    });
    c.drawImage(S.shard[0], W - 50, 5, 7, 9);
    Art.digits(c, String(Game.melee), W - 40, 7 - (w.hudPop > 4 ? 1 : 0), w.hudPop > 0 ? '#ffffff' : '#dffbff');
    c.drawImage(S.gemIcon, W - 51, 17);
    Art.digits(c, Object.keys(Game.gems).length + '/' + GEMS.length, W - 40, 19, '#fff2b0');
    if (w.fight && w.boss && !w.boss.dead && w.boss.st !== 'intro') {
      const bw = 140, x = (W - bw) / 2, k = w.boss.hp / w.boss.max;
      R(c, x - 2, H - 14, bw + 4, 7, 'rgba(8,4,6,0.8)'); R(c, x, H - 12, bw, 3, '#3a1010');
      R(c, x, H - 12, Math.round(bw * k), 3, ENT.boss.vulnerable(w.boss) ? '#fff0a0' : '#ff5a1a'); R(c, x, H - 12, Math.round(bw * k), 1, '#ffb070');
      R(c, x + bw / 2, H - 13, 1, 5, 'rgba(8,4,6,0.8)');
    }
  }

  return Object.assign(w, { load, update, draw, ring, dust, spark, sparkle, toast, gainShard, gainGem, bump, lightBeacon, checkpoint, bossDefeated, clearHazards, addPlayer2, dropPlayer2, zoneAt });
})();
