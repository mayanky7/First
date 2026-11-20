/* The roster: players with different habits. Each is a function from what is on screen to
   which buttons are down this step. They read state; they never write it. Runs in the page. */
(() => {
  'use strict';
  const mc = window.__mc, h = window.__h, { World: w, Game, Scenes, T, ROWS } = mc;
  const { left: LEFT, right: RIGHT, down: DOWN, jump: JUMP, fire: FIRE, light: LIGHT, enter: ENTER, up: UP, dn: DN, pause: PAUSE } = h.BIT;
  const rng = seed => { let a = seed >>> 0 || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const SOLID = { '#': 1, 'B': 1, '?': 1, 'H': 1, 'S': 1, 'G': 1, 'U': 1, 'X': 1, 'D': 1 };
  const tile = (cx, cy) => cy < 0 || cy >= w.rows || cx < 0 || cx >= w.cols ? ' ' : w.grid[cy][cx];
  const hard = (cx, cy) => !!SOLID[tile(cx, cy)];
  const floorAt = (cx, cy) => { const ch = tile(cx, cy); return hard(cx, cy) || ch === '=' || ch === 'M'; };
  const FOES = { goblin: 1, wolf: 1, bat: 1, spider: 1, troll: 1, ember: 1, wraith: 1 };
  const HINTS = window.__botHints || []; // from mechanic modules: (ctx) => buttons, or undefined to leave the habit alone

  /* The person every other habit is built on: goes forward, jumps at what is in the way,
     tries the light when stuck, backs up when that fails. Reacts a quarter of a second late,
     a few frames off, and fumbles one press in twenty. */
  function human(o) {
    const r = rng(o.seed || 1), S = { jump: 0, glideAt: -1, react: 0, want: null, stall: 0, lastX: 0, light: 0, back: 0, fireCd: 0, cloak: 0, read: 0, idle: 0, menu: 0, seenSign: {}, seenBeacon: {}, t: 0 };
    const late = () => 15 + Math.floor((r() * 2 - 1) * 4);
    const fumble = () => r() < 0.05;
    return function () {
      S.t++;
      const sc = h.sceneName();
      if (sc !== 'play') { // menus and cards: read, then Enter
        S.menu++;
        const wait = o.careful ? 150 : 45;
        if (Scenes.busy || S.menu < wait) return 0;
        if (S.menu > wait + 2) S.menu = 0;
        const cur = Scenes.cur;
        if (sc === 'title' && cur.items[cur.sel] !== 'continue' && cur.items[cur.sel] !== 'new') return UP; // not what she came for
        if (sc === 'vault') return cur.open ? ENTER : PAUSE;
        if (sc === 'places') return PAUSE;
        return ENTER;
      }
      S.menu = 0;
      const p = w.player;
      if (Scenes.cur.paused) return S.t % 30 === 0 ? PAUSE : 0;
      if (w.card) { S.read++; return S.read > (o.careful ? 200 : 100) && S.read % 12 < 2 ? JUMP : 0; }
      S.read = 0;
      if (p.dead || w.state !== 'play') return 0;
      const fin = mc.SPEC.finalGem;
      let dir = 1;
      const gem = !w.bossAlive && !Game.gems[fin] ? w.ents.find(e => e.type === 'gem' && e.gem === fin && !e.dead) : null;
      if (gem) dir = gem.x < p.x + 5 ? -1 : 1;
      // careful: stops at signs to read them, rests at each lit beacon
      if (o.careful) {
        for (const e of w.ents) {
          if (e.type === 'sign' && !S.seenSign[e.x] && Math.abs(e.x - p.x) < 14 && p.onGround) { S.seenSign[e.x] = 1; S.idle = 100; }
          if (e.type === 'beacon' && e.on && !S.seenBeacon[e.x] && Math.abs(e.x - p.x) < 24 && p.onGround) { S.seenBeacon[e.x] = 1; S.idle = 120; }
        }
      }
      if (S.idle > 0) { S.idle--; return 0; }
      // the gaze: stand still under the cloak (taught on the road before it is needed)
      if (w.gaze && p.onGround) { if (S.cloak++ > 15) return DOWN; } else S.cloak = 0;
      // the fight: keep off him, shoot when he is down
      let fire = false;
      if (w.fight && w.boss && w.bossAlive) {
        const b = w.boss, dx = (b.x + b.w / 2) - (p.x + 5);
        if (b.st === 'stun') { dir = dx > 0 ? 1 : -1; fire = S.t % 14 === 0; if (Math.abs(dx) < 46) dir = 0; }
        else { dir = Math.abs(dx) < 90 ? (dx > 0 ? -1 : 1) : 0; if ((b.st === 'slam' || b.st === 'charge' || b.st === 'embers') && p.onGround && !S.want && r() < 0.06) S.want = { what: 'jump', at: S.t + 4 }; }
        const a = w.arena; if (p.x < a.x0 + 26 && dir < 0) dir = 1; if (p.x > a.x1 - 30 && dir > 0) dir = -1;
      }
      // creatures ahead: an arrow
      if (S.fireCd > 0) S.fireCd--;
      if (!w.fight && !S.fireCd && p.arrows > 0) for (const e of w.ents) if (FOES[e.type] && !e.dead && (e.x - p.x) * p.face > 0 && Math.abs(e.x - p.x) < 96 && Math.abs(e.y - p.y) < 26) { S.fireCd = 30 + late(); if (!fumble()) S.want = S.want || { what: 'fire', at: S.t + late() }; break; }
      // stuck?
      if (Math.abs(p.x - S.lastX) < 0.25) S.stall++; else S.stall = 0; S.lastX = p.x;
      if (S.back > 0) { S.back--; return LEFT | (S.back % 40 < 18 && S.back > 20 ? JUMP : 0); }
      if (S.stall > 420 && !w.fight) { S.stall = 0; S.back = 50 + Math.floor(r() * 50); }
      if (S.stall > 80 && !w.fight && !S.light) S.light = 110;
      // what is in the way: a wall, or nothing to stand on
      if (p.onGround && !S.jump && !S.want && dir) {
        const cx = Math.floor((p.x + 5 + dir * 13) / T), fy = Math.floor((p.y + p.h + 1) / T), my = Math.floor((p.y + p.h - 3) / T);
        const wall = hard(cx, my) || hard(cx, my - 1);
        let gap = true; for (let d = 0; d < 4; d++) if (floorAt(cx, fy + d)) { gap = false; break; }
        const cx2 = Math.floor((p.x + 5 + dir * 4) / T); let edge = true; for (let d = 0; d < 4; d++) if (floorAt(cx2, fy + d)) { edge = false; break; }
        if (wall || p.hitWall) S.want = { what: 'jump', at: S.t + (S.stall > 30 ? 2 : late()) };
        else if (gap && !edge) S.want = { what: 'jump', at: S.t + 3 + Math.floor(r() * 5), glide: true }; // seen coming: she has been watching the edge
        else if (S.stall > 24) S.want = { what: 'jump', at: S.t + late() };
      }
      let m = dir > 0 ? RIGHT : dir < 0 ? LEFT : 0;
      if (S.want && S.t >= S.want.at) {
        const k = S.want; S.want = null;
        if (!fumble()) { if (k.what === 'jump') { S.jump = 16 + Math.floor(r() * 10); S.glideAt = k.glide || r() < 0.5 ? S.jump + 1 : -1; S.air = 0; } else if (k.what === 'fire') fire = true; }
      }
      if (S.jump > 0) { S.jump--; m |= JUMP; if (S.jump === 0 && S.glideAt < 0) S.glideAt = -1; }
      else if (S.glideAt >= 0 && !p.onGround) { S.air = (S.air || 0) + 1; if (S.air > 1) m |= JUMP; } // let go one step, press again, hold: the glide
      else { S.glideAt = -1; S.air = 0; }
      if (p.onGround && S.jump === 0) { S.glideAt = -1; S.air = 0; }
      if (S.light > 0) { S.light--; m |= LIGHT; }
      if (fire) m |= FIRE;
      for (const hint of HINTS) { const v = hint({ w, p, S, o, r, mask: m, dir, BIT: h.BIT, tile, hard, floorAt, Game, T }); if (v !== undefined) m = v; }
      return m;
    };
  }

  const BOTS = {
    naive: o => human(o),
    careful: o => human(Object.assign({ careful: true }, o)),
    // every button, 8 to 15 times a second, while going forward like anyone
    masher(o) {
      const base = human(o), r = rng((o.seed || 1) * 31 + 5), ph = [JUMP, FIRE, LIGHT, ENTER].map(b => ({ b, per: 4 + Math.floor(r() * 4), off: Math.floor(r() * 8) }));
      let t = 0;
      return () => { t++; let m = base() & (LEFT | RIGHT | DOWN); for (const k of ph) if (((t + k.off) % k.per) < (k.per >> 1)) m |= k.b; return m; };
    },
    // never holds anything longer than 4 frames
    tapper(o) {
      const base = human(o); const held = {};
      return () => { let m = base(), out = 0; for (const a of h.ACT) { const b = h.BIT[a]; if (m & b) { held[a] = (held[a] || 0) + 1; if (held[a] > 4) { held[a] = 0; } else out |= b; } else held[a] = 0; } return out; };
    },
    // random buttons for random lengths (geometric, mean 20 frames)
    monkey(o) {
      const r = rng((o.seed || 1) * 977 + 3); let m = 0;
      return () => { for (let i = 0; i < h.ACT.length; i++) if (r() < 1 / 20) { const b = 1 << i; if (m & b) m &= ~b; else if (r() < (b === RIGHT ? 0.9 : b === PAUSE ? 0.02 : b > PAUSE ? 0.03 : b === LEFT ? 0.3 : 0.5)) m |= b; } return m; };
    },
    // walks into everything that can hurt her, to see that dying costs nothing she had banked
    faller(o) {
      const base = human(o);
      return () => { let m = base() & ~FIRE & ~DOWN; const p = w.player; if (h.sceneName() === 'play' && p && !w.card) for (const e of w.ents) if (FOES[e.type] && !e.dead && Math.abs(e.x - p.x) < 60 && Math.abs(e.y - p.y) < 40) { m = (m & ~(LEFT | RIGHT | JUMP)) | (e.x > p.x ? RIGHT : LEFT); break; } return m; };
    },
    // never attacks
    pacifist(o) { const base = human(o); return () => base() & ~FIRE; }
  };

  /* One run of one bot. Called again and again in slices, so the page stays answerable. */
  const R = {};
  function botStart(name, o) {
    o = o || {};
    // some bots are set down part-way along a recorded run, so that between them they reach the whole road
    if (o.prefix) { const a = h.unrle(o.prefix.tape); for (let i = 0; i < o.prefix.steps && i < a.length; i++) h.step(a[i]); }
    R.name = name; R.f = BOTS[name](o); R.o = o; R.n = 0; R.done = null; R.best = -1; R.bestAt = 0; R.maxStall = 0; R.cols = {}; R.deathsAt = {}; R.lastDeaths = 0;
    R.cards = []; R.cardT = 0; R.lastNew = 0; R.maxQuiet = 0; R.newCount = 0; R.cpStart = Game.cp ? Game.cp.x : -1; R.reached = null; R.mem = 0; R.t0 = performance.now();
    R.seen = { zone: {}, gems: 0, wonders: 0, keeps: 0 };
    R.takeovers = 0; R.softlocks = []; R.dying = null; R.respawns = 0; R.badRespawns = [];
  }
  function botRun(ms, o) {
    o = o || {};
    const t0 = performance.now(), limit = R.o.steps || 108000, stallLimit = R.o.stall === undefined ? 7200 : R.o.stall;
    while (!R.done && performance.now() - t0 < ms) {
      const wasCard = !!w.card, sc0 = h.sceneName();
      h.step(R.f(), R.o.frames && R.n % R.o.frames === 0); R.n++;
      const sc = h.sceneName();
      if (sc === 'play' && w.player) {
        const p = w.player;
        // P-9: how long each card stood before it could be sent away
        if (w.card) R.cardT++; else { if (wasCard) R.cards.push(R.cardT); R.cardT = 0; }
        const pr = h.progress();
        if (pr > R.best + 0.5) { R.best = pr; R.bestAt = R.n; } else R.maxStall = Math.max(R.maxStall, R.n - R.bestAt);
        R.cols[p.x >> 4] = 1;
        // a death: afterwards she must stand at her last checkpoint with everything banked still hers
        if (p.dead && !R.dying) R.dying = { banked: h.banked() };
        if (!p.dead && R.dying && w.t > 2) { const b = h.banked(), a0 = R.dying.banked; R.dying = null; R.respawns++; const home = Game.cp ? Math.abs(p.x + 5 - Game.cp.x) < 40 : p.x < 200; if (!home || JSON.stringify(b.gems) !== JSON.stringify(a0.gems) || JSON.stringify(b.keeps) !== JSON.stringify(a0.keeps) || JSON.stringify(b.wonders) !== JSON.stringify(a0.wonders) || JSON.stringify(b.cp) !== JSON.stringify(a0.cp)) R.badRespawns.push({ step: R.n, home, before: a0, after: b, x: Math.round(p.x) }); }
        if (Game.stats.deaths > R.lastDeaths) { R.lastDeaths = Game.stats.deaths; const k = Math.round(p.x / 320); R.deathsAt[k] = (R.deathsAt[k] || 0) + 1; }
        // P-8: something new at least every 90 seconds
        const g = Object.keys(Game.gems).length, wo = Object.keys(Game.wonders).length, ke = Object.keys(Game.keeps).length, z = w.zone && w.zone.title;
        if (g !== R.seen.gems || wo !== R.seen.wonders || ke !== R.seen.keeps || !R.seen.zone[z] || (w.card && !wasCard)) { R.seen.gems = g; R.seen.wonders = wo; R.seen.keeps = ke; R.seen.zone[z] = 1; R.maxQuiet = Math.max(R.maxQuiet, R.n - R.lastNew); R.lastNew = R.n; R.newCount++; }
        if (R.o.untilCp && Game.cp && Game.cp.x !== R.cpStart) { R.reached = 'checkpoint'; R.done = 'checkpoint'; }
        if (stallLimit > 0 && R.n - R.bestAt > stallLimit) R.done = 'stalled';
      }
      if (sc0 === 'ending' && sc === 'title') R.done = 'finished';
      if (sc === 'ending') R.sawEnding = true;
      if (R.o.takeoverEvery && R.n % R.o.takeoverEvery === 0) { const t = takeover({ seed: R.o.seed }); R.takeovers++; if (!t.ok) { R.softlocks.push(Object.assign({ step: R.n }, t)); if (R.softlocks.length >= 3) R.done = 'softlock'; } }
      if (R.n >= limit) R.done = R.done || 'out of time';
      if (h.errors.length) R.done = 'error';
    }
    return botReport();
  }
  function botReport() {
    return {
      bot: R.name, seed: R.o.seed, done: R.done, steps: R.n, minutes: +(R.n / 3600).toFixed(2), progress: Math.round(R.best), maxStallSec: Math.round(R.maxStall / 60), maxQuietSec: Math.round(R.maxQuiet / 60),
      tiles: Object.keys(R.cols).length, deaths: Game.stats.deaths, hits: Game.stats.hits, deathsWorstSpot: Math.max(0, ...Object.values(R.deathsAt)), minCard: R.cards.length ? Math.min(...R.cards) : null, cards: R.cards.length,
      sawEnding: !!R.sawEnding, respawns: R.respawns, badRespawns: R.badRespawns.slice(0, 3), banked: h.banked(), takeovers: R.takeovers, softlocks: R.softlocks.slice(0, 3), colsSeen: Object.keys(R.cols).map(Number), info: h.info(), errors: h.errors.slice(0, 5), violations: h.violations.slice(0, 5), nViolations: h.violations.length, wallMs: Math.round(performance.now() - R.t0)
    };
  }

  /* The takeover test (the definition of a softlock): from this very moment, can a person still
     get anywhere? The naive bot is given two minutes of game time; if she cannot raise progress,
     the solver is given a turn. Afterwards the moment is put back exactly as it was. */
  function takeover(o) {
    o = o || {};
    const snap = h.snapshot(), e0 = h.errors.length, v0 = h.violations.length;
    const inPlay = () => h.sceneName() === 'play' && w.player;
    const base = inPlay() ? h.progress() : -1, f = human({ seed: (o.seed || 1) + h.steps });
    let ok = false, n = 0, how = null;
    for (; n < (o.steps || 7200); n++) {
      h.step(f());
      const sc = h.sceneName();
      if (sc === 'ending') { ok = true; how = 'ending'; break; }
      if (inPlay() && base >= 0 && h.progress() > base + 24) { ok = true; how = 'naive'; break; }
      if (inPlay() && base < 0 && n > 600 && h.progress() > 400) { ok = true; how = 'naive from a menu'; break; }
    }
    if (!ok && inPlay() && !w.player.dead && !Scenes.busy) {
      h.restore(snap);
      if (inPlay() && !w.player.dead && !Scenes.cur.paused) { const b0 = h.progress(); h.solveStart(11); let r; for (let i = 0; i < 6 && !ok; i++) { r = h.solveRun(1500); if (r.best > b0 + 24 || r.done) { ok = true; how = 'solver'; } } }
    }
    const res = { ok, how, n, base: Math.round(base), at: h.info(), errors: h.errors.length - e0, violations: h.violations.length - v0 };
    h.restore(snap);
    return res;
  }

  /* The idler: stands still a minute of game time, wherever she has been set down. */
  function idle(n) {
    const hp0 = w.player.hp, hits0 = Game.stats.hits, d0 = Game.stats.deaths, x0 = w.player.x;
    for (let i = 0; i < n; i++) h.step(0);
    // and she can still move afterwards
    const x1 = w.player.x; for (let i = 0; i < 40; i++) h.step(LEFT); const moved = Math.abs(w.player.x - x1) > 4 || w.player.hitWall;
    for (let i = 0; i < 40; i++) h.step(RIGHT);
    return { hp0, hp: w.player.hp, hits: Game.stats.hits - hits0, deaths: Game.stats.deaths - d0, drift: Math.round(x1 - x0), responsive: !!moved || Math.abs(w.player.x - x1) > 0, errors: h.errors.length, violations: h.violations.slice(0, 3) };
  }
  window.__bots = { botStart, botRun, botReport, idle, takeover, names: Object.keys(BOTS) };
})();
