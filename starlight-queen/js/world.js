'use strict';
/* Starlight Queen — world: level state, simulation step, rendering */
const World = (() => {
  const w = {
    t: 0, state: 'play', grid: null, rows: 0, cols: 0, ents: [], parts: [], plats: [], bumps: [], decor: [], torches: [],
    cam: { x: 0, y: 0 }, shake: 0, flash: 0, player: null, theme: null, tiles: null, signText: null, signNear: null,
    toastText: '', toastT: 0, introT: 0, clearT: 0, arena: null, bossAlive: false, fight: false, dawn: 0, god: false, minX: 0, maxX: 0
  };
  const [lc, lg] = mk(W, H);
  let lastCamX = 0;

  function load(idx, cp, respawn) {
    const def = LEVELS[idx], L = buildLevel(def);
    Object.assign(w, {
      t: 0, state: 'play', def, idx, grid: L.grid, rows: L.rows, cols: L.cols, parts: [], bumps: [], torches: L.torches,
      theme: THEMES[def.theme], shake: 0, flash: 0, signText: null, signNear: null, toastT: 0, introT: respawn ? 0 : 230, clearT: 0,
      arena: L.arena, bossAlive: !!L.arena, fight: false, dawn: 0, minX: 0, maxX: L.cols * T, boss: null
    });
    w.tiles = Art.tileSet(w.theme);
    w.pit = Art.spr(T, 64, g => { for (let i = 0; i < 8; i++) { g.globalAlpha = Math.min(1, (i + 2) / 6); g.fillStyle = w.theme.pit || '#05060c'; g.fillRect(0, i * 8, T, 8); } });
    w.bg = Backdrop.build(w.theme.id);
    w.amb = Backdrop.makeAmbient(w.theme.amb);
    w.ents = L.ents.map(makeEnt);
    w.plats = w.ents.filter(e => e.type === 'plat');
    w.boss = w.ents.find(e => e.type === 'boss') || null;
    const sp = cp || L.start;
    w.player = makePlayer(sp.x, sp.y);
    if (cp) for (const e of w.ents) if (e.type === 'lantern' && e.x + 6 <= cp.x + 1) e.on = true;
    w.cam.x = clamp(w.player.x - W / 2, 0, w.cols * T - W);
    w.cam.y = clamp(w.player.y - H * 0.55, 0, w.rows * T - H);
    lastCamX = w.cam.x;
    scatter(L);
    Sound.music(w.theme.music); Sound.duck(false); Sound.setRate(1);
  }

  function scatter(L) {
    w.decor = []; w.back = [];
    const th = w.theme, keep = new Set();
    for (const e of w.ents) if (e.type === 'beacon' || e.type === 'lantern' || e.type === 'sign') for (let i = -2; i <= 2; i++) keep.add(Math.floor((e.x + e.w / 2) / T) + i);
    let lastTree = -20;
    for (let x = 0; x < w.cols; x++) {
      for (let cy = 3; cy < w.rows; cy++) {
        if (w.grid[cy][x] !== '#' || w.grid[cy - 1][x] !== '.') continue;
        const h = hash2(x * 7 + 3, cy * 13 + th.seed);
        if (th.trees && x - lastTree > 7 && h < 0.5 && !keep.has(x) && x > 1 && x < w.cols - 2 && w.grid[cy][x - 1] === '#' && w.grid[cy][x + 1] === '#'
          && (!w.arena || x * T < w.arena.x0 - 60 || x * T > w.arena.x1 + 30)) {
          w.back.push({ img: Backdrop.prop(th.trees, x % 3), x: x * T + 8, y: cy * T + 1 }); lastTree = x + (th.trees === 'elder' ? 5 : 0);
        }
        if (keep.has(x)) continue;
        let acc = 0; const h2 = hash2(x * 31 + 1, cy * 17 + th.seed * 3);
        for (const [type, prob] of th.scatter) { acc += prob; if (h2 < acc) { w.decor.push({ img: Backdrop.prop(type, (h * 97 | 0) % 4), x: x * T + 4 + (h * 8 | 0), y: cy * T + 1 }); break; } }
      }
    }
    if (w.arena) {
      const A = w.arena;
      w.back.push({ img: Backdrop.prop('throne', 0), x: A.x1 - 26, y: A.floor });
      for (let i = 0; i < 5; i++) w.back.push({ img: Backdrop.prop('banner', 0), x: A.x0 + 40 + i * 76, y: A.floor - 62, hang: true });
      for (let i = 0; i < 4; i++) w.torches.push({ x: A.x0 + 78 + i * 76, y: A.floor - 40 });
    }
  }

  /* ---------- effects ---------- */
  function dust(x, y, n) { for (let i = 0; i < n; i++) w.parts.push({ x: x + rand(-4, 4), y: y - 1, vx: rand(-0.6, 0.6), vy: rand(-0.6, -0.1), life: rand(10, 20), col: 'rgba(230,230,220,0.7)', sz: 2 }); }
  function spark(x, y, col, n) { for (let i = 0; i < n; i++) w.parts.push({ x, y, vx: rand(-0.3, 0.3), vy: rand(-0.4, 0.3), life: rand(14, 26), col, glow: 1, sz: 1 }); }
  function sparkle(x, y, col, n) { for (let i = 0; i < n; i++) { const a = rand(TAU), s = rand(0.4, 1.8); w.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(14, 30), col: i % 3 ? col : '#ffffff', glow: 1, sz: 1 + (i % 2) }); } }
  function toast(s) { w.toastText = s; w.toastT = 200; }
  function gainShard(x, y, quiet) {
    Game.shards++; Game.stats.shards++;
    if (!quiet) { Sound.sfx('shard'); sparkle(x, y, '#9ff4ff', 5); }
    if (Game.shards >= 100) { Game.shards -= 100; Game.lives++; Sound.sfx('oneup'); toast('A hundred starshards — +1 life'); }
  }
  function bump(cx, cy) {
    const ch = tileAt(w, cx, cy), x = cx * T + 8, y = cy * T;
    if (ch === '#' || ch === 'X') return;
    // anything standing on the block is toppled
    for (const e of w.ents) { const d = ENT[e.type]; if (d.foe && d.arrow && !e.dead && e.x + e.w > cx * T && e.x < cx * T + T && Math.abs(e.y + e.h - y) < 3) slay(w, e, 'bump'); }
    if (ch === 'B') {
      w.grid[cy][cx] = '.'; Sound.sfx('crumble');
      const P = w.theme.tiles;
      for (let i = 0; i < 6; i++) w.parts.push({ x: x + rand(-6, 6), y: y + rand(4, 12), vx: rand(-1.6, 1.6), vy: rand(-3.6, -1.2), life: 50, col: i % 2 ? P.brick : P.brickDark, g: 0.25, sz: 3 + (i % 2) });
      return;
    }
    w.bumps.push({ cx, cy, t: 10 });
    if (ch === 'U') { Sound.sfx('bump'); return; }
    w.grid[cy][cx] = 'U';
    if (ch === '?') { w.ents.push(makeEnt({ t: 'pop', x, y: y - 12 })); gainShard(x, y - 8); Sound.sfx('bump'); }
    else { w.ents.push(makeEnt({ t: ch === 'H' ? 'cake' : ch === 'S' ? 'bloom' : 'leaf', x, y })); Sound.sfx('item'); }
  }
  function lightBeacon(e) {
    w.state = 'clear'; w.clearT = 0; w.player.control = false; w.player.auto = 0; w.player.inv = 0;
    Sound.music(null); Sound.sfx('beacon'); w.flash = 0.6; w.shake = 6;
    setTimeout(() => Sound.sfx('fanfare'), 700);
  }
  function setGate(col, ch) { const A = w.arena; for (let i = 0; i < 9; i++) { const r = w.rows - 1 - (A.a + i); if (r >= 0) w.grid[r][col] = ch; } }
  function startFight() {
    const A = w.arena;
    w.fight = true; setGate(A.gl, 'X'); w.minX = A.x0; w.maxX = A.x1;
    w.boss.st = 'intro'; w.boss.t0 = 0; Sound.music('boss'); Sound.sfx('slam'); w.shake = 10;
  }
  function clearHazards() { for (const e of w.ents) if (e.type === 'wave' || e.type === 'fall') e.dead = true; }
  function bossDefeated() {
    w.fight = false; setGate(w.arena.gr, '.'); setGate(w.arena.gl, '.'); w.minX = 0; w.maxX = w.cols * T;
    w.dawning = true; Sound.music('dawn'); toast('The Cinder Crown is broken! Kindle the last beacon.');
    Game.stats.foes++;
  }

  /* ---------- simulation ---------- */
  const ALWAYS = { boss: 1, wave: 1, fall: 1 };
  function update() {
    w.t++;
    if (w.introT > 0) w.introT--;
    if (w.toastT > 0) w.toastT--;
    if (w.shake > 0) w.shake *= 0.86;
    if (w.flash > 0) w.flash = Math.max(0, w.flash - 0.03);
    if (w.dawning && w.dawn < 1) w.dawn = Math.min(1, w.dawn + 0.004);
    w.signText = null; w.signNear = null;
    const p = w.player;
    for (const pl of w.plats) ENT.plat.pre(w, pl);
    updatePlayer(w, p);
    const cx = w.cam.x + W / 2;
    for (let i = 0; i < w.ents.length; i++) {
      const e = w.ents[i], d = ENT[e.type];
      if (e.dead) continue;
      if (d.foe && !ALWAYS[e.type] && Math.abs(e.x - cx) > W / 2 + 90) continue;
      d.update(w, e);
      if (e.flash > 0) e.flash--;
    }
    // foes vs the Queen
    if (!p.dead && w.state === 'play') for (const e of w.ents) {
      const d = ENT[e.type];
      if (!d.foe || e.dead || !overlap(e, p)) continue;
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
        p.vy = Input.held('jump') ? -5.3 : -3.6; p.jumping = Input.held('jump'); p.glide = GLIDE_MAX; p.y = Math.min(p.y, e.y - p.h + 2);
        sparkle(p.x + 5, p.y + p.h, '#ffffff', 4);
      } else hurtPlayer(w, p, e.x + e.w / 2);
    }
    if (w.ents.some(e => e.dead)) { w.ents = w.ents.filter(e => !e.dead); }
    for (const q of w.parts) { q.x += q.vx; q.y += q.vy; if (q.g) q.vy += q.g; q.life--; }
    if (w.parts.length) w.parts = w.parts.filter(q => q.life > 0);
    if (w.parts.length > 500) w.parts.splice(0, w.parts.length - 500);
    for (const b of w.bumps) b.t--;
    if (w.bumps.length) w.bumps = w.bumps.filter(b => b.t > 0);

    // boss fight trigger
    if (w.arena && w.bossAlive && !w.fight && !p.dead && p.x > w.arena.x0 + 44) startFight();

    // camera
    let tx = p.x + 5 - W / 2 + p.face * 24, ty = p.y + 11 - H * 0.56;
    if (w.fight) tx = w.arena.x0;
    if (w.state === 'clear') tx = p.x + 5 - W / 2 + 30;
    w.cam.x += (clamp(tx, 0, w.cols * T - W) - w.cam.x) * (w.fight ? 0.06 : 0.1);
    if (p.onGround || Math.abs(ty - w.cam.y) > 46 || w.rows <= 14) w.cam.y += (clamp(ty, 0, w.rows * T - H) - w.cam.y) * 0.08;
    w.cam.y = clamp(w.cam.y, 0, w.rows * T - H);

    if (w.state === 'clear') { w.clearT++; if (w.clearT === 330) Game.levelCleared(); }
    else if (p.dead === 105) Game.playerDied();
    else if (w.state === 'play' && !p.dead) Game.stats.frames++;
  }

  /* ---------- rendering ---------- */
  function drawTiles(c, ox, oy) {
    const x0 = Math.max(0, Math.floor(ox / T)), x1 = Math.min(w.cols - 1, Math.floor((ox + W) / T));
    const y0 = Math.max(0, Math.floor(oy / T)), y1 = Math.min(w.rows - 1, Math.floor((oy + H) / T));
    const ts = w.tiles, P = w.theme.tiles;
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const ch = w.grid[cy][cx];
      if (ch === '.' || ch === '~') continue;
      let x = cx * T - ox, y = cy * T - oy;
      if (w.bumps.length) for (const b of w.bumps) if (b.cx === cx && b.cy === cy) y -= Math.round(Math.sin(b.t / 10 * Math.PI) * 5);
      const v = (hash2(cx, cy) * 4) | 0;
      if (ch === '#') {
        c.drawImage(ts.fill[v], x, y);
        const up = cy > 0 ? w.grid[cy - 1][cx] : '#', dn = cy < w.rows - 1 ? w.grid[cy + 1][cx] : '#';
        if (cx > 0 && w.grid[cy][cx - 1] !== '#') R(c, x, y, 1, T, P.dark);
        if (cx < w.cols - 1 && w.grid[cy][cx + 1] !== '#') R(c, x + T - 1, y, 1, T, P.dark);
        if (dn !== '#' && dn !== '~') { R(c, x, y + T - 2, T, 2, P.dark); if (v < 2) R(c, x + 4 + v * 5, y + T, 2, 2 + v, P.dark); }
        if (up !== '#') c.drawImage(ts.cap[v], x, y);
      }
      else if (ch === '=') c.drawImage(ts.plat, x, y);
      else if (ch === 'B') c.drawImage(ts.brick, x, y);
      else if (ch === 'U') c.drawImage(ts.used, x, y);
      else if (ch === '^') c.drawImage(ts.spike, x, y);
      else if (ch === 'X') { R(c, x, y, T, T, '#16131a'); R(c, x + 2, y, 3, T, '#3a3440'); R(c, x + 10, y, 3, T, '#3a3440'); R(c, x, y + 6, T, 2, '#2a2530'); R(c, x + 3, y + 6, 1, 2, '#ff6a20'); }
      else c.drawImage(ts.rune[(w.t >> 3) % 4], x, y);
    }
  }
  function drawLiquid(c, ox, oy) {
    const x0 = Math.max(0, Math.floor(ox / T)), x1 = Math.min(w.cols - 1, Math.floor((ox + W) / T));
    const y0 = Math.max(0, Math.floor(oy / T)), y1 = Math.min(w.rows - 1, Math.floor((oy + H) / T));
    const Lq = w.theme.liquid;
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      if (w.grid[cy][cx] !== '~') continue;
      const x = cx * T - ox, y = cy * T - oy, top = cy === 0 || w.grid[cy - 1][cx] !== '~';
      if (top) {
        for (let i = 0; i < 4; i++) {
          const h = Math.round(4 + Math.sin(w.t * 0.07 + (cx * 4 + i) * 0.55) * 1.6);
          R(c, x + i * 4, y + h, 4, T - h, Lq.body); R(c, x + i * 4, y + h, 4, 1, Lq.top);
        }
        if (Lq.glow) { const b = (w.t + cx * 37) % 90; if (b < 12) R(c, x + (cx * 5 % 12), y + 7 - (b >> 2), 2, 2, Lq.top); }
      } else {
        R(c, x, y, T, T, Lq.deep); R(c, x, y, T, 3, Lq.body);
        const k = (w.t * 0.3 + cx * 9) % 32;
        R(c, x + (k | 0) % 14, y + 6 + (cx % 3) * 3, 3, 1, Lq.body);
      }
      if (top && Lq.glow && cx % 2 === 0) Art.glow(c, x + 8, y + 4, 30, Lq.glow, 0.22 + 0.05 * Math.sin(w.t * 0.1 + cx));
    }
  }
  function darkness(c, ox, oy) {
    const th = w.theme, a = th.dark * (1 - w.dawn);
    if (a <= 0.01) return;
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, W, H);
    lg.fillStyle = `rgba(${th.darkCol},${a})`; lg.fillRect(0, 0, W, H);
    lg.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, k) => {
      if (x < -r || x > W + r || y < -r || y > H + r) return;
      const g = lg.createRadialGradient(x, y, r * 0.15, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${k || 1})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = g; lg.fillRect(x - r, y - r, r * 2, r * 2);
    };
    const p = w.player;
    if (!p.dead) hole(p.x - ox + 5, p.y - oy + 10, p.radiant > 0 ? 120 : 84 + Math.sin(w.t * 0.05) * 3, 1);
    for (const tq of w.torches) hole(tq.x - ox, tq.y - oy, 60 + Math.sin(w.t * 0.3 + tq.x) * 3, 0.95);
    for (const e of w.ents) {
      const d = ENT[e.type];
      if (d.light) { const r = d.light(e); if (r) hole(e.x - ox + e.w / 2, e.y - oy + e.h / 3, r, 0.95); }
      else if (d.glowR && !(d.harmless && d.harmless(e))) hole(e.x - ox + e.w / 2, e.y - oy + e.h / 2, d.glowR, 0.8);
      else if (e.type === 'shard') hole(e.x - ox + 4, e.y - oy + 5, 9, 0.6);
    }
    if (th.liquid.glow) {
      const x0 = Math.max(0, Math.floor(ox / T)), x1 = Math.min(w.cols - 1, Math.floor((ox + W) / T));
      for (let cx = x0; cx <= x1; cx++) for (let cy = Math.max(1, Math.floor(oy / T)); cy < w.rows; cy++) {
        if (w.grid[cy][cx] === '~' && w.grid[cy - 1][cx] !== '~') {
          const x = cx * T - ox, y = cy * T - oy;
          const g = lg.createLinearGradient(0, y - 56, 0, y + 6);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)');
          lg.fillStyle = g; lg.fillRect(x, y - 56, T, 62 + T * 3);
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
        if (q.squash) c.drawImage(q.img, Math.round(x - q.img.width / 2 - 2), Math.round(y + q.img.height / 2 - 5), q.img.width + 4, 5);
        else Art.blit(c, q.img, x - q.img.width / 2, y - q.img.height / 2, q.flip, q.flipV);
      } else { c.fillStyle = q.col; const s = q.sz || 1; c.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); }
    }
  }
  function draw(c) {
    const sh = w.shake > 0.5 ? w.shake : 0;
    const ox = Math.round(w.cam.x + rand(-sh, sh) * 0.5), oy = Math.round(w.cam.y + rand(-sh, sh) * 0.5);
    w.bg(c, w.cam.x, w.rows * T - H - w.cam.y, w.t);
    if (w.dawn > 0) { c.fillStyle = `rgba(255,190,120,${w.dawn * 0.25})`; c.fillRect(0, 0, W, H); }
    if (w.state === 'clear' && w.theme.id !== 'halls') { // far beacons answer, one by one
      [[60, 92], [168, 78], [318, 96]].forEach(([x, y], i) => {
        const k = clamp((w.clearT - 110 - i * 45) / 30, 0, 1);
        if (k > 0) { Art.glow(c, x, y, (9 + Math.sin(w.t * 0.3 + i) * 2) * k, '#ffb040', 0.95); R(c, x - 1, y - 1, 2, 2, '#fff6b0'); R(c, x, y - 2 - ((w.t >> 3) + i) % 2, 1, 1, '#ffc040'); }
      });
    }
    for (const d of w.back) {
      const x = d.x - ox - d.img.width / 2;
      if (x > W || x + d.img.width < 0) continue;
      c.globalAlpha = w.theme.trees === 'elder' && !d.hang ? 0.8 : 1;
      c.drawImage(d.img, Math.round(x), Math.round(d.hang ? d.y - oy : d.y - oy - d.img.height));
    }
    c.globalAlpha = 1;
    for (const tq of w.torches) Backdrop.torch(c, tq.x - ox, tq.y - oy + 14, w.t);
    for (const d of w.decor) { const x = d.x - ox - d.img.width / 2; if (x > W || x < -30) continue; c.drawImage(d.img, Math.round(x), Math.round(d.y - oy - d.img.height)); }
    const yb = w.rows * T - oy - 64;
    if (yb < H) for (let cx = Math.max(0, Math.floor(ox / T)); cx <= Math.min(w.cols - 1, Math.floor((ox + W) / T)); cx++) if (w.grid[w.rows - 1][cx] === '.') c.drawImage(w.pit, cx * T - ox, yb);
    if (!w.theme.liquid.glow) drawLiquid(c, ox, oy);
    drawTiles(c, ox, oy);
    for (const e of w.ents) { const d = ENT[e.type]; if (!d.lit && e.x - ox < W + 40 && e.x + e.w - ox > -40) d.draw(c, w, e, ox, oy); }
    drawPlayer(c, w, w.player, ox, oy);
    drawParts(c, ox, oy, false);
    darkness(c, ox, oy);
    if (w.theme.liquid.glow) drawLiquid(c, ox, oy);
    for (const tq of w.torches) { Art.glow(c, tq.x - ox, tq.y - oy - 4, 20 + Math.sin(w.t * 0.3 + tq.x) * 2, '#ff9a30', 0.55); Backdrop.flame(c, tq.x - ox, tq.y - oy, w.t, 1); }
    for (const e of w.ents) { const d = ENT[e.type]; if (d.lit && e.x - ox < W + 40 && e.x + e.w - ox > -40) d.draw(c, w, e, ox, oy); }
    drawParts(c, ox, oy, true);
    Backdrop.drawAmbient(c, w.amb, w.t, w.cam.x - lastCamX); lastCamX = w.cam.x;
    if (w.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(1, w.flash)})`; c.fillRect(0, 0, W, H); }
    hud(c);
  }
  function hud(c) {
    const p = w.player, S = Art.S;
    c.fillStyle = 'rgba(8,10,20,0.45)'; c.fillRect(3, 3, 38, 25); c.fillRect(W - 49, 3, 46, 25);
    for (let i = 0; i < 3; i++) c.drawImage(i < p.hp ? S.heart : S.heartEmpty, 6 + i * 11, 6);
    for (let i = 0; i < 3; i++) c.drawImage(i < p.arrows ? S.quiver : S.quiverEmpty, 8 + i * 6, 17);
    if (p.arrows < 3) R(c, 27, 23, Math.round(p.arrowT / 48 * 10), 1, '#9fe8ff');
    if (p.radiant > 0) { R(c, 3, 30, 38, 3, 'rgba(8,10,20,0.6)'); R(c, 4, 31, Math.round(36 * p.radiant / 600), 1, (w.t >> 2) % 2 ? '#fff6b0' : '#9ff4ff'); }
    c.drawImage(S.shard[0], W - 46, 5, 7, 9);
    Art.digits(c, String(Game.shards).padStart(2, '0'), W - 36, 7, '#dffbff');
    // tiny crown for lives
    R(c, W - 46, 20, 7, 3, '#fff2b0'); R(c, W - 46, 18, 1, 2, '#fff2b0'); R(c, W - 43, 17, 1, 3, '#fff2b0'); R(c, W - 40, 18, 1, 2, '#fff2b0'); R(c, W - 43, 21, 1, 1, '#7df4ff');
    Art.digits(c, 'x' + Game.lives, W - 36, 19, '#fff2b0');
    if (w.fight && w.boss && !w.boss.dead && w.boss.st !== 'intro') {
      const bw = 140, x = (W - bw) / 2, k = w.boss.hp / w.boss.max;
      R(c, x - 2, H - 14, bw + 4, 7, 'rgba(8,4,6,0.8)'); R(c, x, H - 12, bw, 3, '#3a1010');
      R(c, x, H - 12, Math.round(bw * k), 3, ENT.boss.vulnerable(w.boss) ? '#fff0a0' : '#ff5a1a'); R(c, x, H - 12, Math.round(bw * k), 1, '#ffb070');
      R(c, x + bw / 2, H - 13, 1, 5, 'rgba(8,4,6,0.8)');
    }
  }

  return Object.assign(w, { load, update, draw, dust, spark, sparkle, toast, gainShard, bump, lightBeacon, bossDefeated, clearHazards });
})();
