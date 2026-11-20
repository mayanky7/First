/* Runs inside the page, in a harness build only. Everything a bot may do goes through here:
   it presses buttons, steps the game, and reads state. It never writes game state, with one
   exception that is the solver's alone: keeping a moment and returning to it while it searches.
   A route the solver finds is only believed once it has been replayed from a fresh page. */
(() => {
  'use strict';
  const mc = window.__mc, { World: w, Game, Scenes, Input, RNG, T } = mc, MECHS = mc.MECHS || [];
  const ACT = ['left', 'right', 'down', 'jump', 'fire', 'light', 'enter', 'up', 'dn', 'pause', 'vault', 'travel', 'quit', 'restart', 'mute'];
  const BIT = {}; ACT.forEach((a, i) => { BIT[a] = 1 << i; });
  const { left: LEFT, right: RIGHT, down: DOWN, jump: JUMP, fire: FIRE, light: LIGHT, enter: ENTER } = BIT;

  let prev = 0, steps = 0, tape = null;
  const errors = [], violations = [];
  function setMask(m) {
    for (let i = 0; i < ACT.length; i++) { const on = !!(m >> i & 1); if (on !== !!(prev >> i & 1)) Input._set(ACT[i], 'bot', on); }
    prev = m;
  }
  function sceneName() { for (const k in Scenes.list) if (Scenes.list[k] === Scenes.cur) return k; return null; }
  function step(m, draw) {
    setMask(m);
    try { mc.step(); } catch (e) { if (errors.length < 50) errors.push({ step: steps, where: 'step', scene: sceneName(), e: String(e && e.stack || e) }); }
    if (draw) { try { mc.frame(); } catch (e) { if (errors.length < 50) errors.push({ step: steps, where: 'frame', scene: sceneName(), e: String(e && e.stack || e) }); } }
    if (tape) tape.push(m);
    steps++;
    check();
  }

  /* ---------- invariants, every step (P-5) ---------- */
  function bad(what, v) { if (violations.length < 50) violations.push({ step: steps, scene: sceneName(), what, v: String(v) }); }
  function check() {
    if (!Scenes.cur) { bad('no scene', ''); return; }
    if (Scenes.cur !== Scenes.list.play || !w.player) return;
    const p = w.player;
    for (const k of ['x', 'y', 'vx', 'vy', 'hp', 'lum', 'inv', 'glide']) if (!Number.isFinite(p[k])) bad('player.' + k, p[k]);
    if (!Number.isFinite(w.cam.x) || !Number.isFinite(w.cam.y)) bad('camera', w.cam.x + ',' + w.cam.y);
    if (p.hp < 0 || p.hp > 5) bad('hp range', p.hp);
    if (p.lum < 0 || p.lum > 100) bad('lum range', p.lum);
    if (p.arrows < 0 || p.arrows > 3) bad('arrows range', p.arrows);
    if (p.x < w.minX - 1 || p.x + p.w > w.maxX + 1) bad('player outside road', p.x);
    if (p.y < -400) bad('player above the sky', p.y);
    if (w.cam.x < w.bx0 - 0.5 || w.cam.x > w.bx1 - mc.W + 0.5) bad('camera outside road', w.cam.x);
    for (const m of MECHS) if (m.invariants) { let r; try { r = m.invariants(w) || []; } catch (e) { r = ['invariants threw: ' + e]; } for (const s of r) bad('mechanic ' + m.id, s); }
  }

  /* ---------- walking the state: copy, hash ---------- */
  // Things that never change after the world is built, or are only painted: kept by reference, left out of the hash.
  const BYREF = { decor: 1, back: 1, snow: 1, amb: 1, torches: 1, zones: 1, colTheme: 1, theme: 1, gemBlocks: 1, popN: 1, marks: 1, arena: 1, zone: 1, introZone: 1 };
  const PAINT = { parts: 1, rings: 1, bumps: 1, shake: 1, flash: 1, fxT: 1, hurtFx: 1, hudPop: 1, toastText: 1, toastT: 1, toastSmall: 1, thawT: 1, thaw: 1 };
  const KEEP = new Set();
  (function seed(o) { if (!o || typeof o !== 'object' || KEEP.has(o)) return; KEEP.add(o); for (const k in o) seed(o[k]); })(mc.SPEC);
  const plain = o => { const pr = Object.getPrototypeOf(o); return pr === Object.prototype || pr === null; };
  function clone(o, map) {
    if (o === null || typeof o !== 'object' || KEEP.has(o)) return o;
    const seen = map.get(o); if (seen) return seen;
    if (Array.isArray(o)) { const a = new Array(o.length); map.set(o, a); for (let i = 0; i < o.length; i++) a[i] = clone(o[i], map); return a; }
    if (!plain(o)) return o; // canvases, gradients: paint
    const c = {}; map.set(o, c);
    for (const k in o) c[k] = clone(o[k], map);
    return c;
  }
  const dataKeys = o => Object.keys(o).filter(k => typeof o[k] !== 'function' && !(Object.getOwnPropertyDescriptor(o, k) || {}).get);
  let frozen = null; // the last copy made of each row of the ground: rows are shared between kept moments until one changes
  function freezeGrid() {
    if (!w.grid) return null;
    if (!frozen || frozen.src !== w.grid) frozen = { src: w.grid, rows: w.grid.map(r => r.slice()) };
    else for (let r = 0; r < w.grid.length; r++) { const a = w.grid[r], b = frozen.rows[r]; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { frozen.rows[r] = a.slice(); break; } }
    return frozen.rows.slice();
  }
  function snapshot() {
    const map = new Map(), s = { w: {}, ref: {}, game: {}, grid: freezeGrid(), gridSrc: w.grid, rng: RNG.state(), prev, steps };
    for (const k of dataKeys(w)) { if (k === 'grid') continue; if (BYREF[k]) s.ref[k] = w[k]; else s.w[k] = clone(w[k], map); }
    for (const k of dataKeys(Game)) s.game[k] = clone(Game[k], map);
    s.sc = Scenes._state(); s.scenes = {};
    for (const n in Scenes.list) { const o = Scenes.list[n], c = s.scenes[n] = {}; for (const k of dataKeys(o)) c[k] = clone(o[k], map); }
    s.ls = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); s.ls[k] = localStorage.getItem(k); } } catch (e) { }
    return s;
  }
  function restore(s) {
    const map = new Map();
    for (const k of dataKeys(w)) if (k !== 'grid' && !(k in s.w) && !(k in s.ref)) delete w[k];
    for (const k in s.ref) w[k] = s.ref[k];
    for (const k in s.w) w[k] = clone(s.w[k], map);
    for (const k of dataKeys(Game)) if (!(k in s.game)) delete Game[k];
    for (const k in s.game) Game[k] = clone(s.game[k], map);
    Scenes._restore(s.sc);
    for (const n in s.scenes) { const o = Scenes.list[n]; for (const k of dataKeys(o)) if (!(k in s.scenes[n])) delete o[k]; for (const k in s.scenes[n]) o[k] = clone(s.scenes[n][k], map); }
    try { localStorage.clear(); for (const k in s.ls) localStorage.setItem(k, s.ls[k]); } catch (e) { }
    w.grid = s.gridSrc;
    if (s.grid) for (let r = 0; r < s.grid.length; r++) { const a = w.grid[r], b = s.grid[r]; for (let i = 0; i < b.length; i++) if (a[i] !== b[i]) a[i] = b[i]; }
    RNG.restore(s.rng);
    for (let i = 0; i < ACT.length; i++) Input._set(ACT[i], 'bot', !!(s.prev >> i & 1));
    Input.endStep(); prev = s.prev; steps = s.steps;
  }

  // The simulation state hash: what happened, not how it looked. Positions to 1/256 px.
  function hash(detail) {
    let h = 0x811c9dc5, nan = [];
    const put = str => { for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } };
    const ids = new Map(), parts = detail ? {} : null;
    function walk(o, path) {
      const t = typeof o;
      if (t === 'number') { if (!Number.isFinite(o)) nan.push(path); put((Math.round(o * 256) / 256) + ';'); return; }
      if (t === 'string' || t === 'boolean') { put(o + ';'); return; }
      if (o === null || o === undefined) { put('~;'); return; }
      if (t === 'function') return;
      if (ids.has(o)) { put('#' + ids.get(o) + ';'); return; }
      ids.set(o, ids.size);
      if (Array.isArray(o)) { put('['); for (let i = 0; i < o.length; i++) walk(o[i], path + '.' + i); put(']'); return; }
      if (!plain(o)) return;
      put('{');
      for (const k of Object.keys(o).sort()) { if (typeof o[k] === 'function') continue; put(k + ':'); walk(o[k], path + '.' + k); }
      put('}');
    }
    const sc = sceneName(), ss = Scenes._state(); put(sc + ';' + ss.fade.toFixed(3) + ';' + ss.dir + ';' + (ss.next ? ss.next.name : '') + ';');
    const cur = Scenes.cur || {};
    for (const k of ['t', 'i', 'pt', 'gt', 'sel', 'paused']) if (typeof cur[k] !== 'object') walk(cur[k], 'scene.' + k);
    if (sc === 'play') {
      for (const k of dataKeys(w).sort()) {
        if (BYREF[k] || PAINT[k] || k === 'grid') continue;
        const h0 = h; put(k + '='); walk(w[k], 'w.' + k); if (parts) parts['w.' + k] = (h ^ h0) >>> 0;
      }
      if (w.grid) for (const r of w.grid) put(r.join(''));
      if (parts) parts.grid = h >>> 0;
    }
    for (const k of dataKeys(Game).sort()) { const h0 = h; put(k + '='); walk(Game[k], 'Game.' + k); if (parts) parts['G.' + k] = (h ^ h0) >>> 0; }
    put('rng' + RNG.state()[0]);
    for (const n of nan) bad('not a number in state', n);
    const out = (h >>> 0).toString(16).padStart(8, '0');
    return detail ? { hash: out, parts } : out;
  }

  /* ---------- what a bot can see ---------- */
  function info() {
    const sc = sceneName(), o = { scene: sc, busy: Scenes.busy, steps, errors: errors.length, violations: violations.length };
    if (sc === 'play' && w.player) {
      const p = w.player;
      Object.assign(o, {
        t: w.t, x: Math.round(p.x), y: Math.round(p.y), col: Math.floor((p.x + 5) / T), hp: p.hp, dead: !!p.dead, state: w.state, zone: w.zone && w.zone.title, theme: w.zone && w.zone.theme,
        fight: w.fight, bossAlive: w.bossAlive, bossHp: w.boss ? w.boss.hp : 0, gems: Object.keys(Game.gems).length, wonders: Object.keys(Game.wonders).length, keeps: Object.keys(Game.keeps).length,
        shards: Object.keys(Game.meleeGot).length, deaths: Game.stats.deaths, hits: Game.stats.hits, metBoy: !!Game.metBoy, card: !!w.card, paused: !!Scenes.cur.paused
      });
      for (const m of MECHS) if (m.info) o[m.id] = m.info(w);
    }
    return o;
  }

  /* ---------- tapes: a whole session as button states, one per step ---------- */
  const rle = a => { const out = []; for (const m of a) { const l = out[out.length - 1]; if (l && l[0] === m) l[1]++; else out.push([m, 1]); } return out; };
  const unrle = r => { const out = []; for (const [m, n] of r) for (let i = 0; i < n; i++) out.push(m); return out; };
  // Replay: the same buttons on the same steps. Returns the state hash every `every` steps and at the end.
  function replay(r, o) {
    o = o || {};
    const a = unrle(r), hashes = [], every = o.every || 600, t0 = performance.now();
    const saves = [], scenes = {}; let cp = '', peak = null, frameMs = 0, frames = 0;
    for (let i = 0; i < a.length; i++) {
      const draw = o.frames && i % o.frames === 0, f0 = draw ? performance.now() : 0;
      step(a[i], draw); if (draw) { frameMs += performance.now() - f0; frames++; }
      if ((i + 1) % every === 0) hashes.push(hash());
      const sc = sceneName(); scenes[sc] = (scenes[sc] || 0) + 1;
      if (sc === 'play') {
        peak = info();
        // every checkpoint: what was written to storage there, to start again from later
        const c = Game.cp ? Game.cp.x + ',' + Game.cp.y : '';
        if (c !== cp) { cp = c; if (Game.cp) saves.push({ step: i, cp: Game.cp, banked: banked(), storage: storage() }); }
      }
    }
    hashes.push(hash());
    return { hashes, n: a.length, ms: performance.now() - t0, frameMs: frames ? frameMs / frames : 0, frames, info: info(), peak, scenes, saves, errors: errors.slice(), violations: violations.slice() };
  }

  function storage() { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } } catch (e) { } return o; }
  // what the game promises to keep
  function banked() { return { cp: Game.cp ? [Math.round(Game.cp.x), Math.round(Game.cp.y)] : null, gems: Object.keys(Game.gems).sort(), keeps: Object.keys(Game.keeps).sort(), wonders: Object.keys(Game.wonders).sort(), shards: Object.keys(Game.meleeGot).length, bossDown: !!Game.bossDown, metBoy: !!Game.metBoy }; }

  /* ---------- scripted stretches every bot shares ---------- */
  function press(m, hold, then) { for (let i = 0; i < (hold || 2); i++) step(m); for (let i = 0; i < (then || 0); i++) step(0); }
  // from the title to the first step of play, the way a person would: Enter, read, Enter
  function bootToPlay(draw) {
    let guard = 0;
    while (sceneName() !== 'play' || Scenes.busy || Scenes.fade > 0) {
      if (++guard > 4000) throw new Error('never reached play; scene ' + sceneName());
      const sc = sceneName();
      if (Scenes.busy || Scenes.fade > 0 || guard % 30) step(0, draw); else if (sc === 'title' || sc === 'intro' || sc === 'map') { step(ENTER, draw); step(ENTER, draw); } else step(0, draw);
    }
  }
  // from the last beacon to the title again
  function endToTitle(draw) {
    let guard = 0, seenEnding = false;
    while (true) {
      if (++guard > 6000) throw new Error('never came back to the title; scene ' + sceneName());
      const sc = sceneName();
      if (sc === 'ending') seenEnding = true;
      if (sc === 'title' && seenEnding && !Scenes.busy) return;
      if (sc === 'ending' && !Scenes.busy && guard % 40 === 0) { step(ENTER, draw); step(ENTER, draw); } else step(0, draw);
    }
  }

  /* ---------- the solver: keep moments, try things from them, keep whatever gets further ---------- */
  const X = {
    cells: new Map(), best: null, iters: 0, simSteps: 0, done: false, tapeEnd: null, rnd: null, log: []
  };
  function progress() { // only rises as the game advances
    const p = w.player, z = w.zone, fin = mc.SPEC.finalGem;
    let x = p.x;
    if (z.warp) { x = 0; for (const e of w.ents) if (e.type === 'warp' && !w.zoneAt(e.x).warp) x = Math.max(x, e.x - 40); }
    let s = x;
    s += w.bossAlive ? (w.fight && w.boss ? (w.boss.max - w.boss.hp) * 400 : 0) : 4400;
    if (Game.gems[fin]) s += 1500;
    if (Game.metBoy) { s += 1500; const boy = w.ents.find(e => e.type === 'boy'); if (boy) s += Math.min(720, w.t - boy.metT) * 1.2; }
    for (const k in w.doorP) s += Math.min(70, w.doorP[k]) * 0.5;
    for (const m of MECHS) if (m.progress) s += m.progress(w) || 0;
    if (w.state === 'clear') s += 1e5;
    return s;
  }
  function cellKey() {
    const p = w.player, boy = Game.metBoy ? w.ents.find(e => e.type === 'boy') : null;
    return [w.zone.warp ? 1 : 0, p.x >> 5, Math.floor(p.y / 40), w.bossAlive ? (w.fight ? w.boss.hp : 99) : 0, Game.gems[mc.SPEC.finalGem] ? 1 : 0, boy ? Math.min(6, Math.floor((w.t - boy.metT) / 120)) : -1, w.state].concat(MECHS.map(m => m.cellKey ? m.cellKey(w) : '')).join('|');
  }
  const MACROS = [
    [3, 'R', n => i => RIGHT, [8, 16, 30, 50]],
    [3, 'RJ', n => i => i === 0 ? RIGHT : RIGHT | JUMP, [10, 20, 34]],
    [3, 'RJG', n => i => i === 0 || i === 17 ? RIGHT : RIGHT | JUMP, [36, 50, 64]],
    [1.5, 'RL', n => i => RIGHT | LIGHT, [30, 60]],
    [1.2, 'RJL', n => i => (i === 0 || i === 17 ? RIGHT : RIGHT | JUMP) | LIGHT, [36, 60]],
    [0.8, 'NL', n => i => LIGHT, [80]],
    [1.5, 'RF', n => i => i === 1 ? RIGHT | FIRE : RIGHT, [8, 14]],
    [0.6, 'RJF', n => i => (i === 0 ? RIGHT : RIGHT | JUMP) | (i === 8 ? FIRE : 0), [24]],
    [1, 'N', n => i => 0, [10, 30, 60]],
    [0.7, 'L', n => i => LEFT, [8, 20]],
    [0.7, 'LJ', n => i => i === 0 ? LEFT : LEFT | JUMP, [20, 34]],
    [0.4, 'LJG', n => i => i === 0 || i === 17 ? LEFT : LEFT | JUMP, [40]],
    [0.7, 'J', n => i => i === 0 ? 0 : JUMP, [20]],
    [0.4, 'JF', n => i => (i === 0 ? 0 : JUMP) | (i === 10 ? FIRE : 0), [26]],
    [0.6, 'C', n => i => DOWN, [70, 150]],
    [0.3, 'DROP', n => i => i === 0 ? DOWN : DOWN | JUMP, [12]],
    [0.3, 'LF', n => i => i === 4 ? LEFT | FIRE : i < 4 ? LEFT : 0, [10]],
    [0.3, 'F', n => i => i === 1 ? FIRE : 0, [6]]
  ];
  const MW = MACROS.reduce((a, m) => a + m[0], 0);
  function pickMacro(r) { let v = r() * MW; for (const m of MACROS) { v -= m[0]; if (v <= 0) { const n = m[3][Math.floor(r() * m[3].length)]; return { name: m[1], f: m[2](n), n }; } } }
  function consider(parent, chunk) {
    const p = w.player;
    if (p.dead || Scenes.cur !== Scenes.list.play || Scenes.busy) return null;
    const key = cellKey(), score = progress() - (5 - p.hp) * 30, old = X.cells.get(key);
    if (old && old.score >= score) return null;
    const c = { key, score, snap: snapshot(), parent, chunk: chunk.slice(), visits: 0, n: (parent ? parent.n : 0) + chunk.length };
    X.cells.set(key, c);
    if (!X.best || score > X.best.score) X.best = c;
    return c;
  }
  // Start the search from wherever the game is now (the first step of play), with the tape so far.
  function solveStart(seed) {
    X.cells.clear(); X.best = null; X.iters = 0; X.simSteps = 0; X.done = false; X.tapeEnd = null;
    X.rnd = (() => { let a = seed >>> 0 || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();
    X.prefix = tape ? tape.slice() : [];
    const keep = tape; tape = null;
    consider(null, []);
    tape = keep;
  }
  function solveRun(ms) {
    const t0 = performance.now(), r = X.rnd, keepTape = tape; tape = null;
    while (!X.done && performance.now() - t0 < ms) {
      X.iters++;
      // which moment to go back to: mostly the furthest few, sometimes anywhere near the front
      if (X.iters % 200 === 1) { const cut = X.best.score - 3000; for (const [k, c] of X.cells) if (c.score < cut) X.cells.delete(k); X.sorted = Array.from(X.cells.values()).sort((a, b) => b.score - a.score); }
      const pool = X.sorted, top = r() < 0.75 ? Math.min(8, pool.length) : Math.min(80, pool.length);
      let cell = null, bw = -1;
      for (let i = 0; i < 3; i++) { const c = pool[Math.floor(r() * top)], wgt = 1 / (1 + c.visits); if (wgt > bw) { bw = wgt; cell = c; } }
      if (X.iters % 7 === 0) cell = X.best;
      cell.visits++;
      restore(cell.snap);
      let parent = cell;
      for (let k = 0; k < 5 && !X.done; k++) {
        const m = pickMacro(r), chunk = [];
        for (let i = 0; i < m.n; i++) {
          let mask = m.f(i);
          if (w.card) mask = w.card.t > 70 && (steps & 1) ? JUMP : 0; // a card is up: read it, then go on
          step(mask); chunk.push(mask); X.simSteps++;
          if (w.player.dead) break;
          if (w.state === 'clear') break;
        }
        if (w.player.dead) break;
        const c = consider(parent, chunk);
        if (c) { parent = c; if (X.sorted.length < 80 || c.score > X.sorted[Math.min(X.sorted.length, 8) - 1].score) { X.sorted.push(c); X.sorted.sort((a, b) => b.score - a.score); } }
        else { /* nothing new here: carry on from it all the same, as one longer try */ parent = { key: null, score: 0, parent, chunk, n: parent.n + chunk.length, ghost: true }; }
        if (w.state === 'clear') { X.done = true; X.tapeEnd = parent; }
      }
    }
    tape = keepTape;
    const b = X.best, p = b.snap.w.player;
    return { done: X.done, iters: X.iters, cells: X.cells.size, simSteps: X.simSteps, best: Math.round(b.score), col: Math.floor(p.x / T), hp: p.hp, n: b.n, ms: performance.now() - t0 };
  }
  // The route found, as a tape from boot: the prefix, then every chunk from the first moment to the last.
  function solveTape() {
    const chain = []; for (let c = X.tapeEnd || X.best; c; c = c.parent) chain.push(c.chunk);
    let a = X.prefix.slice(); for (let i = chain.length - 1; i >= 0; i--) a = a.concat(chain[i]);
    return rle(a);
  }
  function solveGoBest() { restore((X.tapeEnd && !X.tapeEnd.ghost ? X.tapeEnd : X.best).snap); }

  window.__h = {
    ACT, BIT, step, setMask, storage, banked, press, info, hash, snapshot, restore, replay, rle, unrle, bootToPlay, endToTitle, sceneName, progress,
    solveStart, solveRun, solveTape, solveGoBest, X,
    errors, violations,
    record(on) { tape = on ? [] : null; }, get tape() { return tape ? rle(tape) : null; }, get steps() { return steps; }
  };
})();
