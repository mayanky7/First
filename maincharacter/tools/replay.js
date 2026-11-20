const fs = require('fs'), { replay } = require('../harness/solve');
(async () => {
  const rec = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), frames = +process.argv[4] || 0;
  const t = Date.now(), r = await replay(process.argv[2], rec, { frames });
  console.log(JSON.stringify({ n: r.n, wall: Date.now() - t, ms: Math.round(r.ms), hashes: r.hashes.length, last: r.hashes.slice(-2), info: r.info, errors: r.errors, violations: r.violations.slice(0, 5), pageErrors: r.pageErrors }));
  process.exit(0);
})();
