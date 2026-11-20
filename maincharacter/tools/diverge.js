'use strict';
/* Where does drawing frames change the simulation? Runs a tape twice, with and without frames,
   and reports the first step where the detailed state hashes differ, and which part. */
const fs = require('fs');
const { open } = require('../harness/browser');
(async () => {
  const [file, tapeF, frames = 7] = process.argv.slice(2), rec = JSON.parse(fs.readFileSync(tapeF, 'utf8'));
  const run = async fr => {
    const s = await open(file, { query: 'seed=' + rec.seed });
    const r = await s.page.evaluate(([t, fr]) => { const a = __h.unrle(t), out = []; for (let i = 0; i < a.length; i++) { __h.step(a[i], fr && i % fr === 0); out.push(__h.hash()); } return out; }, [rec.tape, fr]);
    await s.close(); return r;
  };
  const A = await run(0), B = await run(+frames), k = A.findIndex((h, i) => h !== B[i]);
  console.log('first differing step', k, 'of', A.length);
  if (k < 0) return;
  const det = async fr => {
    const s = await open(file, { query: 'seed=' + rec.seed });
    const r = await s.page.evaluate(([t, fr, k]) => { const a = __h.unrle(t); for (let i = 0; i <= k; i++) __h.step(a[i], fr && i % fr === 0); const w = __mc.World; return { d: __h.hash(true), info: __h.info(), ents: JSON.stringify(w.ents.map(e => [e.t, Math.round(e.x * 256), Math.round(e.y * 256), e.dead ? 1 : 0])), n: w.ents.length }; }, [rec.tape, fr, k]);
    await s.close(); return r;
  };
  const a = await det(0), b = await det(+frames);
  console.log(a.info);
  for (const p of Object.keys(a.d.parts)) if (a.d.parts[p] !== b.d.parts[p]) console.log('differs:', p);
  console.log('ents', a.n, b.n, a.ents === b.ents);
  if (a.ents !== b.ents) { const x = JSON.parse(a.ents), y = JSON.parse(b.ents); for (let i = 0; i < Math.max(x.length, y.length); i++) if (JSON.stringify(x[i]) !== JSON.stringify(y[i])) { console.log(i, x[i], y[i]); break; } }
})();
