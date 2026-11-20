const { open } = require('../harness/browser');
(async () => {
  const s = await open('out/sq.harness.html', { query: 'seed=7' });
  const r = await s.page.evaluate(() => {
    __h.bootToPlay(false); const w = __mc.World, c = {};
    for (const e of w.ents) { c[e.type] = c[e.type] || { n: 0, keys: Object.keys(e).join(',') , cols: []}; c[e.type].n++; if (c[e.type].cols.length < 12) c[e.type].cols.push(Math.floor(e.x / 16)); }
    return { c, pk: Object.keys(w.player).join(','), wk: Object.keys(w).join(','), gk: Object.keys(__mc.Game).join(','), ls: Object.keys(localStorage) };
  });
  console.log(JSON.stringify(r, null, 0).replace(/\},/g, '},\n'));
  await s.close();
})();
