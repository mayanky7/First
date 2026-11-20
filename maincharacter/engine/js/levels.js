'use strict';
/* Main Character engine — one long road, built from regions laid end to end.
   Coordinates inside a region use tile columns (x) and "altitude" (a): a = 0 is the bottom row,
   so ground of height h has its walking surface at altitude h. */
const ROWS = 22;
/* Mechanic modules: one per story template, loaded after the engine proper. A module registers itself with
   mechanic({ id, ops(ctx) -> extra level ops, init(w, L, cp), step(w), back/draw/over(c, w, ox, oy),
   invariants(w) -> [problems], progress(w) -> number, cellKey(w) -> string, info(w) -> {} }).
   Modules keep their simulation state in w.mech[id] (plain data), so it is saved, restored and hashed with the world. */
const MECHS = [];
function mechanic(def) { MECHS.push(def); return def; }
const REGIONS = SPEC.regions.map(r => Object.assign({}, r, { build(L) { for (const o of r.ops) L[o[0]].apply(L, o.slice(1)); } }));

function buildWorld() {
  const rows = ROWS, cols = REGIONS.reduce((a, r) => a + r.cols, 0);
  const grid = [];
  for (let y = 0; y < rows; y++) grid.push(new Array(cols).fill('.'));
  const out = { grid, rows, cols, ents: [], torches: [], start: { x: 40, y: 0 }, arena: null, zones: [], gemBlocks: {}, popN: {}, doors: [], marks: {} };
  const row = a => rows - 1 - a;
  const set = (x, a, ch) => { const r = row(a); if (r >= 0 && r < rows && x >= 0 && x < cols) grid[r][x] = ch; };
  const py = a => (rows - a) * T;
  let ox = 0, shardN = 0;
  REGIONS.forEach((reg, ri) => {
    const px = x => (x + ox) * T + 8, X = x => x + ox;
    const x0 = ox;
    const shard = (x, y) => out.ents.push({ t: 'shard', x, y, n: shardN++ });
    const L = {
      g(a0, a1, h) { for (let x = a0; x <= a1; x++) for (let a = 0; a < h; a++) set(X(x), a, '#'); },
      ceil(a0, a1, th) { for (let x = a0; x <= a1; x++) for (let i = 0; i < th + (reg.roof || 0); i++) grid[i][X(x)] = '#'; },
      liq(a0, a1, h) { for (let x = a0; x <= a1; x++) for (let a = 0; a < h; a++) set(X(x), a, '~'); },
      p(x, a, w) { for (let i = 0; i < w; i++) set(X(x) + i, a, '='); },
      b(x, a, str) { for (let i = 0; i < str.length; i++) { set(X(x) + i, a, str[i]); if (str[i] === '?') out.popN[(X(x) + i) + ',' + row(a)] = shardN++; } },
      spk(a0, a1, a) { for (let x = a0; x <= a1; x++) set(X(x), a, '^'); },
      s(x, a, n) { for (let i = 0; i < n; i++) shard(px(x + i), py(a) - 3); },
      arc(x, a, n) { for (let i = 0; i < n; i++) shard(px(x + i), py(a) - 3 - Math.sin((i + 0.5) / n * Math.PI) * 20); },
      e(t, x, a, o) { out.ents.push(Object.assign({ t, x: px(x), y: py(a), manic: reg.manic || 1, sk: reg.theme }, o || {})); },
      keep(id, x, a) { out.ents.push({ t: 'keep', x: px(x), y: py(a), keep: id }); },
      mp(x, a, w, dx, dy, per, ph) { out.ents.push({ t: 'plat', x: X(x) * T, y: py(a) - T, w: w * T, dx: dx * T, dy: -dy * T, per, ph: ph || 0 }); },
      cp(x, a, lit) { out.ents.push({ t: 'lantern', x: px(x), y: py(a), on: !!lit }); },
      wonder(id, x, a) { out.ents.push({ t: 'wonder', x: px(x), y: py(a), wonder: id }); },
      warp(x, a, to) { out.ents.push({ t: 'warp', x: px(x), y: py(a), to }); },
      mark(id, x, a) { out.marks[id] = { x: px(x), y: py(a) }; },
      beacon(x, a, text, final) { out.ents.push({ t: 'beacon', x: px(x), y: py(a), text, final: !!final }); },
      sign(x, a, text) { out.ents.push({ t: 'sign', x: px(x), y: py(a), text }); },
      gem(id, x, a) { out.ents.push({ t: 'gem', x: px(x), y: py(a), gem: id }); },
      gemBlock(id, x, a) { set(X(x), a, 'G'); out.gemBlocks[X(x) + ',' + row(a)] = id; },
      npc(x, a) { out.ents.push({ t: 'boy', x: px(x), y: py(a) }); },
      torch(x, a) { out.torches.push({ x: px(x), y: py(a) - 22 }); },
      start(x, a) { out.start = { x: px(x), y: py(a) }; },
      m(x, a, w) { for (let i = 0; i < w; i++) set(X(x) + i, a, 'M'); },
      door(x, a, h, text) { for (let i = 0; i < h; i++) set(X(x), a + i, 'D'); out.doors.push({ id: 'd' + X(x), cx: X(x), cy: row(a), h, text }); },
      arena(a0, a1, a) {
        out.arena = { x0: X(a0) * T, x1: (X(a1) + 1) * T, floor: py(a), gl: X(a0) - 1, gr: X(a1) + 1, a };
        for (let i = 0; i < 9; i++) set(X(a1) + 1, a + i, 'X');
        out.ents.push({ t: 'boss', x: px(a1 - 5), y: py(a) });
      }
    };
    for (const m of MECHS) if (m.ops) Object.assign(L, m.ops({ out, set, px, py, X, row, reg, ri, shard }));
    reg.build(L);
    const last = out.zones[out.zones.length - 1];
    if (reg.join && last && last.theme === reg.theme) last.x1 = (x0 + reg.cols) * T;
    else out.zones.push({ x0: x0 * T, x1: (x0 + reg.cols) * T, theme: reg.theme, title: reg.title || null, sub: reg.sub, map: reg.map, manic: reg.manic || 1, warp: !!reg.warp });
    ox += reg.cols;
  });
  // a joining stretch that opens a new theme borrows the title of the region it leads into
  for (let i = 0; i < out.zones.length - 1; i++) if (!out.zones[i].title) { const n = out.zones[i + 1]; out.zones[i].title = n.title; out.zones[i].sub = n.sub; out.zones[i].map = n.map; n.quiet = true; }
  out.melee = shardN;
  return out;
}
const WONDER_TOTAL = SPEC.wonders.length;
const MAP_NAMES = SPEC.mapNames;
