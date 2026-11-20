#!/usr/bin/env node
'use strict';
/* mc — everything Main Character does, from a terminal. Logs go to out/logs/<day>.jsonl. */
const fs = require('fs'), path = require('path');
const log = require('../lib/log')('mc');
const args = process.argv.slice(2), cmd = args.shift();
const flag = (name, dflt) => { const i = args.indexOf('--' + name); if (i < 0) return dflt; const v = args[i + 1]; args.splice(i, v === undefined || v.startsWith('--') ? 1 : 2); return v === undefined || v.startsWith('--') ? true : v; };
const readSpec = f => {
  const s = fs.readFileSync(f, 'utf8');
  if (/\.html?$/.test(f)) { const m = s.match(/<script>window\.__SPEC=(.*?);(?:window\.__MC_HARNESS=true;)?<\/script>/s); if (!m) throw new Error('no GameSpec found inside ' + f); return JSON.parse(m[1]); }
  return JSON.parse(s);
};
const USAGE = `mc <command>
  build <gamespec.json> [-o game.html] [--harness]   compile a GameSpec into one HTML file
  validate <gamespec.json>                           check a GameSpec without building
  verify <gamespec.json|game.html> [--json] [--monkeys N] [--monkey-steps N] [--fresh] [--waive ID:reason]
                                                     the play gate; exit 0 only if every check passes
  play <gamespec.json|game.html> --bot NAME [--seed N] [--steps N] [--shot file.png]
                                                     one bot run (naive careful masher tapper pacifist faller monkey)
  solve <gamespec.json|game.html> [-o tape.json] [--seed N]   search for a route to the ending and prove it by replay
  replay <gamespec.json|game.html> <tape.json> [--frames N] [--engine webkit]   re-run a recorded tape, print state hashes
  hash                                               the engine's hash
  scan                                               static scan of the simulation for clocks and dice
MC_LOG=debug|quiet controls console logging.`;

(async () => {
  const { compile, validate, engineHash, sha } = require('../compiler/compile');
  const OUT = path.resolve(__dirname, '../out'); fs.mkdirSync(path.join(OUT, 'build'), { recursive: true });
  const harnessFile = spec => { const f = path.join(OUT, 'build', spec.id + '.harness.html'); fs.writeFileSync(f, compile(spec, { harness: true })); return f; };
  switch (cmd) {
    case 'build': {
      const out = flag('o') || (() => { const i = args.indexOf('-o'); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; })(), harness = flag('harness', false);
      const spec = readSpec(args[0]), html = compile(spec, { harness: !!harness }), f = out || path.join(OUT, 'build', spec.id + (harness ? '.harness' : '') + '.html');
      fs.writeFileSync(f, html); console.log(`${f}  ${Buffer.byteLength(html)} bytes  sha ${sha(html).slice(0, 16)}`); break;
    }
    case 'validate': { const bad = validate(readSpec(args[0])); bad.forEach(b => console.log('  ' + b)); console.log(bad.length ? `${bad.length} problems` : 'valid'); process.exit(bad.length ? 1 : 0); break; }
    case 'verify': {
      const json = flag('json', false), monkeys = +flag('monkeys', 12), monkeySteps = +flag('monkey-steps', 30000), fresh = !!flag('fresh', false);
      // a waiver never turns a failure into a pass: the check still reads FAIL, the reason is written into the report, and only the owner gives one
      const waive = {}; for (let w; (w = flag('waive')) && w !== true;) { const [id, ...why] = w.split(':'); waive[id] = why.join(':') || 'no reason given'; }
      const spec = readSpec(args[0]);
      if (/\.html?$/.test(args[0]) && fs.readFileSync(args[0], 'utf8') !== compile(spec, {})) { console.error('this file is not what the compiler makes from the GameSpec inside it: it has been edited, or was built by another engine'); process.exit(1); }
      const r = await require('../harness/verify').verify(spec, { monkeys, monkeySteps, fresh, waive });
      if (json) console.log(JSON.stringify(r, null, 1));
      else {
        for (const c of r.checks) { console.log(`${c.pass ? 'PASS' : c.waived ? 'FAIL*' : 'FAIL'}  ${c.id.padEnd(7)} ${c.name}${c.waived ? '   [waived: ' + c.waived + ']' : ''}`); if (!c.pass) console.log('        ' + JSON.stringify(c.detail).slice(0, 700)); }
        console.log(`\n${r.pass ? 'PASS' : 'FAIL'}  ${r.title}: ${r.passed}/${r.checks.length} checks${r.waived.length ? ', ' + r.waived.length + ' failing but waived' : ''} in ${r.seconds}s  (engine ${r.engine}, spec ${r.spec})\nreport: ${r.file}`);
      }
      process.exit(r.pass ? 0 : 1); break;
    }
    case 'play': {
      const bot = flag('bot', 'naive'), seed = +flag('seed', 7), steps = +flag('steps', 108000), shot = flag('shot'), takeover = +flag('takeover', 0);
      const { open } = require('../harness/browser'), file = harnessFile(readSpec(args[0]));
      const s = await open(file, { query: 'seed=' + seed });
      await s.page.evaluate(([n, o]) => __bots.botStart(n, o), [bot, { seed, steps, stall: bot === 'monkey' || bot === 'faller' ? 0 : 7200, takeoverEvery: takeover, frames: shot ? 30 : 0 }]);
      let r; do { r = await s.page.evaluate(() => __bots.botRun(2500)); log.debug('play', { steps: r.steps, progress: r.progress }); } while (!r.done);
      if (shot) { await s.page.evaluate(() => __mc.frame()); await s.page.screenshot({ path: shot }); }
      delete r.colsSeen; r.pageErrors = s.errors; console.log(JSON.stringify(r, null, 1)); await s.close();
      process.exit(r.errors.length || r.nViolations ? 1 : 0); break;
    }
    case 'solve': {
      const i = args.indexOf('-o'), out = i >= 0 ? args.splice(i, 2)[1] : null, seed = +flag('seed', 7);
      const { solve, replay } = require('../harness/solve'), spec = readSpec(args[0]), file = harnessFile(spec);
      const r = await solve(file, { seed, minutes: +flag('minutes', 20) });
      if (!r.ok) { console.log('no route found', JSON.stringify(r.search)); process.exit(1); }
      const a = await replay(file, r), ok = a.info.scene === 'title' && a.scenes.ending > 0;
      const f = out || path.join(OUT, 'build', spec.id + '.tape.json'); fs.writeFileSync(f, JSON.stringify({ seed: r.seed, tape: r.tape }));
      console.log(`${ok ? 'route found and replayed to the ending' : 'route did NOT replay'}: ${a.n} steps (${(a.n / 3600).toFixed(1)} min), searched ${r.search.simSteps} steps in ${r.ms} ms → ${f}`);
      process.exit(ok ? 0 : 1); break;
    }
    case 'replay': {
      const frames = +flag('frames', 0), engine = flag('engine');
      const { replay } = require('../harness/solve'), file = harnessFile(readSpec(args[0]));
      const r = await replay(file, JSON.parse(fs.readFileSync(args[1], 'utf8')), { frames, engine });
      console.log(JSON.stringify({ steps: r.n, end: r.info, scenes: r.scenes, hashes: r.hashes, errors: r.errors, violations: r.violations, pageErrors: r.pageErrors }, null, 1));
      process.exit(r.errors.length || r.violations.length ? 1 : 0); break;
    }
    case 'hash': console.log(engineHash()); break;
    case 'scan': { const f = require('../harness/verify').staticScan(); f.forEach(x => console.log(x)); console.log(f.length ? `${f.length} found` : 'clean'); process.exit(f.length ? 1 : 0); break; }
    default: console.log(USAGE); process.exit(cmd ? 1 : 0);
  }
  process.exit(0);
})().catch(e => { log.error('failed', { e: String(e && e.stack || e) }); console.error(String(e && e.message || e)); process.exit(2); });
