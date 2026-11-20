const { open } = require('../harness/browser');
(async () => {
  const [name, seed, opt, query] = process.argv.slice(2);
  const s = await open('out/sq.harness.html', { query: (query ? query + '&' : '') + 'seed=' + (seed || 7) });
  await s.page.evaluate(([n, sd, o]) => __bots.botStart(n, Object.assign({ seed: +sd }, o)), [name, seed || 7, JSON.parse(opt || '{}')]);
  let r; do { r = await s.page.evaluate(() => __bots.botRun(3000)); } while (!r.done);
  r.cols = r.colsSeen.length; delete r.colsSeen;
  console.log(JSON.stringify(r)); await s.close(); process.exit(0);
})();
