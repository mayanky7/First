const { open } = require('../harness/browser');
(async () => {
  const [bot, seed, stall] = process.argv.slice(2);
  const s = await open('out/sq.harness.html', { query: 'seed=' + seed });
  await s.page.evaluate(([b, sd, st]) => __bots.botStart(b, { seed: +sd, stall: +st }), [bot, seed, stall || 3000]);
  let r; do { r = await s.page.evaluate(() => __bots.botRun(3000)); } while (!r.done);
  const out = await s.page.evaluate(() => {
    const w = __mc.World, p = w.player, rows = [], tr = [];
    const c0 = (p.x >> 4) - 20; for (let y = 4; y < 22; y++) rows.push(w.grid[y].slice(c0, c0 + 70).join(''));
    const R = __bots; 
    return { c0, rows, p: { x: p.x, y: p.y, safe: p.safe, fallAt: p.fallAt, onGround: p.onGround, ride: !!p.ride, hitWall: p.hitWall }, toast: w.toastText, sign: w.signText, plats: w.ents.filter(e => e.type === 'plat' && Math.abs(e.x - p.x) < 600).map(e => [e.x | 0, e.y | 0, e.dx, e.dy, e.per, e.w]), ents: w.ents.filter(e => Math.abs(e.x - p.x) < 300 && e.type !== 'shard').map(e => [e.type, e.x | 0, e.y | 0, e.dead]), doors: w.doors, doorP: w.doorP };
  });
  console.log(JSON.stringify(r).slice(0, 300)); console.log(out.rows.join('\n')); delete out.rows; console.log(JSON.stringify(out));
  await s.page.screenshot({ path: 'out/stuck.png' }).catch(() => {});
  await s.close(); process.exit(0);
})();
