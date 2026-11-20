#!/usr/bin/env node
/* Equivalence: the world the engine builds from the GameSpec must be the world the original game built. */
const fs = require('fs'), path = require('path');
const { open } = require('../harness/browser');
(async () => {
  const b = await open(path.resolve(__dirname, '../out/sq.harness.html'));
  const world = await b.page.evaluate(() => JSON.stringify(buildWorld()));
  const miss = await b.page.evaluate(() => Object.keys(__mc.tx.missing));
  await b.close();
  const orig = fs.readFileSync(path.resolve(__dirname, '../out/sq-world.json'), 'utf8');
  console.log('world identical:', world === orig, 'bytes', world.length, 'errors', b.errors.length, 'missing text', miss.length, 'network', b.requests.length);
  process.exit(world === orig && !b.errors.length ? 0 : 1);
})();
