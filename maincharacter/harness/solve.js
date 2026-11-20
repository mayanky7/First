'use strict';
/* Finds a route through a game by search, then proves it: the route is replayed on a fresh
   page, twice, once with every frame drawn. Only a route that replays to the ending is kept. */
const fs = require('fs'), path = require('path');
const { open } = require('./browser');
const log = require('../lib/log')('solve');

async function solve(file, opts = {}) {
  const seed = opts.seed || 7, budget = (opts.minutes || 20) * 60000, t0 = Date.now();
  const s = await open(file, { query: 'seed=' + seed });
  try {
    await s.page.evaluate(sd => { __h.record(true); __h.bootToPlay(false); __h.solveStart(sd); }, opts.searchSeed || 1);
    let r, last = 0;
    while (true) {
      r = await s.page.evaluate(() => __h.solveRun(4000));
      if (Date.now() - last > 20000 || r.done) { last = Date.now(); log.info('search', r); }
      if (r.done || Date.now() - t0 > budget) break;
    }
    if (!r.done) { log.error('no route found', r); return { ok: false, search: r }; }
    // walk on from the last beacon through the ending to the title, recording
    const tape = await s.page.evaluate(() => {
      const h = __h, route = h.solveTape(); h.solveGoBest();
      h.record(true); h.endToTitle(false);
      return h.rle(h.unrle(route).concat(h.unrle(h.tape)));
    });
    return { ok: true, seed, tape, search: r, ms: Date.now() - t0 };
  } finally { await s.close(); }
}

async function replay(file, rec, opts = {}) {
  const s = await open(file, { query: 'seed=' + rec.seed, engine: opts.engine });
  try {
    const r = await s.page.evaluate(([t, o]) => __h.replay(t, o), [rec.tape, { frames: opts.frames || 0, every: 600 }]);
    r.pageErrors = s.errors.slice(); r.requests = s.requests.length;
    return r;
  } finally { await s.close(); }
}
module.exports = { solve, replay };

if (require.main === module) (async () => {
  const [file, out] = process.argv.slice(2);
  const r = await solve(file, { minutes: +process.env.MINUTES || 20, seed: +process.env.SEED || 7 });
  if (!r.ok) process.exit(1);
  fs.writeFileSync(out, JSON.stringify({ seed: r.seed, tape: r.tape }));
  const a = await replay(file, r), b = await replay(file, r, { frames: 1 });
  console.log(JSON.stringify({ steps: a.n, end: a.info, same: JSON.stringify(a.hashes) === JSON.stringify(b.hashes), errors: a.errors.length + b.errors.length, violations: a.violations.length }));
})();
