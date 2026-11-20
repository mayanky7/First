#!/usr/bin/env node
/* One-off: read the original Starlight Queen in a browser and write its content as data.
   Output: games/starlight-queen.base.json (tables + level ops) and out/sq-world.json (the original built world, for the
   equivalence check). The text table is added by tools/port-text.js. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.route(/^https?:/, r => r.abort());
  await p.goto('file://' + path.resolve(ROOT, '../starlight-queen/index.html'));
  await p.waitForFunction(() => window.__sq);
  const r = await p.evaluate(() => {
    const J = v => JSON.parse(JSON.stringify(v));
    const strip = a => J(a).map(o => { delete o.n; return o; });
    const regions = REGIONS.map(reg => {
      const ops = [];
      const L = new Proxy({}, { get: (_, op) => (...args) => { ops.push([op, ...J(args)]); } });
      reg.build(L);
      const meta = J(reg); // functions drop out
      return Object.assign(meta, { ops });
    });
    return {
      regions, gems: strip(GEMS), keeps: strip(KEEPS), wonders: strip(WONDERS), prologue: J(PROLOGUE), epilogue: J(EPILOGUE),
      places: J(PLACES), mapNames: J(MAP_NAMES), gemWhere: J(GEM_WHERE), companionLines: J(MAYANK_LINES), world: J(buildWorld())
    };
  });
  await b.close();
  const world = r.world; delete r.world;
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'out/sq-world.json'), JSON.stringify(world));
  const spec = Object.assign({
    schema: 1, id: 'starlight-queen', template: 'road-west', title: 'Starlight Queen', subtitle: 'Ana & the Mountain of Light',
    titleLines: ['STARLIGHT', 'QUEEN'], hero: 'Ana', companion: 'Mayank', speakers: ['Tonttu', 'Mayank'], finalGem: 'kohinoor'
  }, r);
  fs.writeFileSync(path.join(ROOT, 'games/starlight-queen.base.json'), JSON.stringify(spec, null, 1));
  console.log('regions', r.regions.length, 'ops', r.regions.reduce((a, x) => a + x.ops.length, 0), 'gems', r.gems.length, 'world ents', world.ents.length);
})();
