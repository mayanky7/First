'use strict';
/* The play gate for one game. Every check is run for real, in a browser, on the built file;
   each returns pass or fail with its evidence. Criteria ids are those of QUALITY-BAR.md. */
const fs = require('fs'), path = require('path');
const { compile, validate, engineHash, sha } = require('../compiler/compile');
const { open } = require('./browser');
const { solve, replay } = require('./solve');
const log = require('../lib/log')('verify');

const OUT = path.resolve(__dirname, '../out');
const SIM = ['core.js', 'gems.js', 'levels.js', 'entities.js', 'wonders.js', 'world.js', 'scenes.js', 'main.js']; // modules the simulation runs in

/* P-6, static half: the simulation may ask no clock and no dice but its own. */
function staticScan(mechanics) {
  const dir = path.resolve(__dirname, '../engine/js'), found = [];
  // each line the scan lets through, and why it cannot change what a step does
  const ALLOW = [
    /RNG\.reseed\(q0\.has\('seed'\)/,                       // the one seed, taken at boot
    /performance\.now\(\)/,                                 // the frame loop's clock: decides how many steps to run, never what a step does
    /usedTouch|lastTouch|tapAt|lastEnd/,                    // touch plumbing: telling a touch from the mouse event after it, stopping double-tap zoom
    /set\('enter', 'tap', false\)/,                         // a tap is a short press: input arrives between steps, like any key
    /setTimeout\(\(\) => (Sound\.sfx|\{ if \(!w\.card && !w\.gemFx\) Sound\.duck)/, // a sound a moment later: heard, never simulated
    /minimum-scale|addEventListener\('resize', check\)/,   // the page's zoom, outside the game
    /URL\.revokeObjectURL/                                 // tidying up after the download
  ];

  for (const f of SIM.concat((mechanics || []).map(m => '../mechanics/' + m + '.js'))) {
    fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((line, i) => {
      if (/Math\.random|Date\.now|new Date|performance\.now|setTimeout|setInterval/.test(line) && !ALLOW.some(a => a.test(line))) found.push(`${f}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  return found;
}

async function runBot(file, name, o = {}) {
  const s = await open(file, { query: (o.query ? o.query + '&' : '') + 'seed=' + (o.seed || 7), storage: o.storage, engine: o.engine });
  try {
    await s.page.evaluate(([n, opt]) => __bots.botStart(n, opt), [name, o]);
    let r; do { r = await s.page.evaluate(() => __bots.botRun(2500)); } while (!r.done);
    r.pageErrors = s.errors.slice(); r.requests = s.requests.length;
    return r;
  } finally { await s.close(); }
}
const clean = r => r.errors.length === 0 && r.nViolations === 0 && r.pageErrors.length === 0 && r.requests === 0;
const brief = r => ({ done: r.done, min: r.minutes, deaths: r.deaths, worstSpot: r.deathsWorstSpot, stallSec: r.maxStallSec, quietSec: r.maxQuietSec, minCard: r.minCard, errors: r.errors.length + r.pageErrors.length, violations: r.nViolations, firstError: r.errors[0] || r.pageErrors[0], firstViolation: r.violations[0] });

async function verify(spec, opts = {}) {
  const t0 = Date.now(), checks = [], seeds = opts.seeds || [7, 8];
  const waive = opts.waive || {};
  const add = (id, name, pass, detail) => { const c = { id, name, pass: !!pass, detail }; if (!pass && waive[id]) c.waived = waive[id]; checks.push(c); log[pass ? 'info' : 'error'](`${pass ? 'PASS' : 'FAIL'} ${id} ${name}`, detail); };
  fs.mkdirSync(path.join(OUT, 'build'), { recursive: true });

  /* ---- build ---- */
  const bad = validate(spec);
  add('S-1', 'the GameSpec is valid', bad.length === 0, { problems: bad });
  if (bad.length) return finish();
  const release = compile(spec, {}), harness = compile(spec, { harness: true });
  const fileR = path.join(OUT, 'build', spec.id + '.html'), fileH = path.join(OUT, 'build', spec.id + '.harness.html');
  fs.writeFileSync(fileR, release); fs.writeFileSync(fileH, harness);
  add('S-2', 'one file, and the build is repeatable', compile(spec, {}) === release && !/window\.__MC_HARNESS/.test(release.replace(/typeof window\.__MC_HARNESS|window\.__MC_HARNESS === true|!!window\.__MC_HARNESS/g, '')), { bytes: Buffer.byteLength(release), sha: sha(release).slice(0, 16) });
  // the bots' build differs from the one people get by the one flag that hands the loop to the bots, and nothing else
  const flag = 'window.__MC_HARNESS=true;';
  add('V-1', 'the bots play the same game people get', harness.split(flag).join('') === release && harness.split(flag).length === 2, { flag });
  const scan = staticScan(spec.mechanics);
  add('P-6a', 'simulation asks no clock and no dice but its own (static scan)', scan.length === 0, { found: scan });

  /* ---- the expert: find a route, then prove it by replaying it on fresh pages ---- */
  const stamp = sha(harness).slice(0, 16), tapeFile = path.join(OUT, 'build', spec.id + '.expert.' + stamp + '.json');
  let rec = fs.existsSync(tapeFile) && !opts.fresh ? JSON.parse(fs.readFileSync(tapeFile, 'utf8')) : null;
  if (!rec) {
    const r = await solve(fileH, { seed: seeds[0], minutes: opts.solveMinutes || 20 });
    if (r.ok) { rec = { seed: r.seed, tape: r.tape, search: r.search }; fs.writeFileSync(tapeFile, JSON.stringify(rec)); }
    else { add('P-1', 'expert finishes', false, { search: r.search }); return finish(); }
  }
  const A = await replay(fileH, rec), B = await replay(fileH, rec, { frames: 7 }), A2 = await replay(fileH, rec);
  const finished = r => r.info.scene === 'title' && (r.scenes.ending || 0) > 0;
  add('P-1', 'expert finishes: the game can be finished', finished(A), { steps: A.n, minutes: +(A.n / 3600).toFixed(2), last: A.peak && { col: A.peak.col, gems: A.peak.gems, keeps: A.peak.keeps, wonders: A.peak.wonders, deaths: A.peak.deaths }, scenes: A.scenes });
  const same = (x, y) => JSON.stringify(x.hashes) === JSON.stringify(y.hashes);
  add('P-6', 'deterministic: same seed and buttons, same state hash every 600 steps and at the end', same(A, A2) && same(A, B) && A.hashes.length > 10, { hashes: A.hashes.length, end: A.hashes[A.hashes.length - 1], twice: same(A, A2), withFramesDrawn: same(A, B), firstDifference: A.hashes.findIndex((h, i) => h !== B.hashes[i]) });
  add('P-3', 'expert run: no errors', [A, B].every(r => r.errors.length === 0 && r.pageErrors.length === 0 && r.requests === 0), { errors: A.errors.concat(B.errors).slice(0, 3), page: A.pageErrors.concat(B.pageErrors).slice(0, 3), requests: A.requests + B.requests });
  add('P-5', 'expert run: invariants hold every step', A.violations.length === 0 && B.violations.length === 0, { violations: A.violations.slice(0, 3) });
  let wk = null;
  try { wk = await replay(fileH, rec, { engine: 'webkit' }); } catch (e) { wk = { failed: String(e).slice(0, 200) }; }
  if (wk.failed) add('P-6x', 'the same tape in WebKit ends in the same place', false, wk);
  else add('P-6x', 'the same tape in WebKit ends in the same place', finished(wk) && wk.errors.length === 0, { sameHashes: same(A, wk), end: wk.info.scene, errors: wk.errors.slice(0, 2) });

  /* ---- the roster, from the first screen ---- */
  const HUMAN = { naive: 1, careful: 1 };
  for (const name of ['naive', 'careful', 'masher', 'tapper', 'pacifist']) {
    const runs = []; for (const seed of seeds) runs.push(await runBot(fileH, name, { seed }));
    add('P-1', `${name} finishes`, runs.every(r => r.done === 'finished' && clean(r)), runs.map(brief));
    if (HUMAN[name]) add('P-11', `${name}: fair (dies ≤ 12 times, ≤ 4 at one spot)`, runs.every(r => r.deaths <= 12 && r.deathsWorstSpot <= 4), runs.map(r => ({ deaths: r.deaths, worstSpot: r.deathsWorstSpot })));
    if (name === 'naive') {
      add('P-2', 'naive is never stuck two minutes', runs.every(r => r.maxStallSec < 120), runs.map(r => r.maxStallSec));
      const p8 = runs.every(r => r.minutes >= 15 && r.minutes <= 25 && r.maxQuietSec <= 90);
      add('P-8', 'pace: 15–25 minutes, something new every 90 seconds', p8, runs.map(r => ({ minutes: r.minutes, longestQuietSec: r.maxQuietSec })));
    }
    if (name === 'masher') add('P-9', 'no card can be mashed away in under 0.75 s', runs.every(r => r.minCard === null || r.minCard >= 45), runs.map(r => ({ cards: r.cards, shortestSteps: r.minCard })));
  }
  {
    const runs = []; for (const seed of seeds) runs.push(await runBot(fileH, 'faller', { seed, stall: 0, steps: 30000 }));
    add('P-7b', 'faller: every death returns her to her checkpoint with everything banked', runs.every(r => r.respawns >= 5 && r.badRespawns.length === 0 && clean(r)), runs.map(r => ({ deaths: r.deaths, respawns: r.respawns, bad: r.badRespawns, errors: r.errors.length, violations: r.nViolations })));
  }

  /* ---- from a save at every checkpoint ---- */
  const saves = A.saves || [];
  add('P-7a', 'the expert passed checkpoints, and each wrote a save', saves.length >= 2 && saves.every(s => Object.keys(s.storage).length > 0), { checkpoints: saves.map(s => s.banked.cp) });
  const resumed = [], idled = [], onward = [];
  for (const sv of saves) {
    // reload from the save alone: is what was banked still there?
    const s = await open(fileH, { query: 'seed=' + seeds[0], storage: sv.storage });
    try {
      const got = await s.page.evaluate(() => { __h.bootToPlay(false); const b = __h.banked(); const p = __mc.World.player; return { b, x: Math.round(p.x) }; });
      const eq = ['gems', 'keeps', 'wonders', 'cp', 'shards'].every(k => JSON.stringify(got.b[k]) === JSON.stringify(sv.banked[k]));
      resumed.push({ cp: sv.banked.cp, same: eq, atHome: Math.abs(got.x + 5 - sv.banked.cp[0]) < 40, got: eq ? undefined : got.b, want: eq ? undefined : sv.banked });
      // and standing there a minute hurts no one
      const idle = await s.page.evaluate(() => __bots.idle(3600));
      idled.push(Object.assign({ cp: sv.banked.cp }, idle));
    } finally { await s.close(); }
    const r = await runBot(fileH, 'naive', { seed: seeds[0], storage: sv.storage, untilCp: true });
    onward.push({ cp: sv.banked.cp, done: r.done, stallSec: r.maxStallSec, deaths: r.deaths, errors: r.errors.length, violations: r.nViolations });
  }
  add('P-7', 'save and resume: reloading from each checkpoint gives back what was banked', resumed.length > 0 && resumed.every(r => r.same && r.atHome), resumed);
  add('P-2g', 'from a save at every checkpoint, naive reaches the next one or the ending', onward.length > 0 && onward.every(r => (r.done === 'checkpoint' || r.done === 'finished') && !r.errors && !r.violations), onward);
  {
    const s = await open(fileH, { query: 'seed=' + seeds[0] });
    try { const idle = await s.page.evaluate(() => { __h.bootToPlay(false); return __bots.idle(3600); }); idled.unshift(Object.assign({ cp: 'start' }, idle)); } finally { await s.close(); }
  }
  add('P-idle', 'idler: a minute standing at the start and at every checkpoint costs nothing', idled.every(r => r.hits === 0 && r.deaths === 0 && r.hp >= r.hp0 && r.responsive && r.errors === 0), idled.map(r => ({ cp: r.cp, hits: r.hits, hp: r.hp, responsive: r.responsive })));

  /* ---- the monkey, with the takeover test every 600 steps ---- */
  {
    // each monkey is set down a little further along the expert's run, so that between them they are let loose on the whole road
    const n = opts.monkeys || 12, steps = opts.monkeySteps || 30000, runs = [], cols = new Set(), playSteps = A.n - (A.scenes.ending || 0);
    for (let i = 0; i < n; i++) {
      const at = Math.floor(i / n * playSteps);
      const r = await runBot(fileH, 'monkey', { seed: 100 + i, steps, stall: 0, takeoverEvery: 600, prefix: at ? { tape: rec.tape, steps: at } : undefined });
      r.startStep = at; r.colsSeen.forEach(c => cols.add(c)); runs.push(r);
    }
    const road = A.peak ? A.peak.col : 1;
    const cover = [...cols].filter(c => c <= road).length / road;
    add('P-4', `monkey: ${n} × ${steps} steps, no errors, no broken invariants`, runs.every(clean), runs.map(r => ({ seed: r.seed, from: r.startStep, cols: r.tiles, errors: r.errors.length + r.pageErrors.length, violations: r.nViolations, first: r.errors[0] || r.violations[0] })));
    add('P-2m', 'monkey: taken over every 600 steps, a person could always still get on', runs.every(r => r.softlocks.length === 0 && r.takeovers > 0), { takeovers: runs.reduce((a, r) => a + r.takeovers, 0), softlocks: runs.flatMap(r => r.softlocks).slice(0, 3) });
    add('P-4c', 'monkey: the test is not void (≥ 60 % of the road visited)', cover >= 0.6, { covered: +cover.toFixed(3), columns: cols.size, road });
  }

  /* ---- every screen drawn, and the file people get, with a real keyboard ---- */
  {
    const s = await open(fileH, { query: 'seed=' + seeds[0] });
    try {
      const r = await s.page.evaluate(() => {
        const h = __h, B = h.BIT, seen = {}, go = (m, n) => { for (let i = 0; i < n; i++) { h.step(i < 2 ? m : 0, true); seen[h.sceneName()] = 1; } };
        go(0, 40); go(B.vault, 40); go(B.right, 12); go(B.enter, 30); go(B.enter, 20); go(B.dn, 12); go(B.pause, 40);
        go(B.travel, 40); go(B.dn, 12); go(B.up, 12); go(B.pause, 40);
        go(B.dn, 10); go(B.up, 10);
        return { seen: Object.keys(seen), errors: h.errors.slice(0, 3), frameErrors: h.errors.filter(e => e.where === 'frame').length };
      });
      add('P-3s', 'title, vault and travel screens draw without error (the rest are drawn in the expert run)', r.errors.length === 0 && s.errors.length === 0 && ['title', 'vault', 'places'].every(k => r.seen.includes(k)) && (B.scenes.ending || 0) > 0 && B.frames > 1000, { seen: r.seen, errors: r.errors, page: s.errors.slice(0, 3), framesDrawnInExpertRun: B.frames });
    } finally { await s.close(); }
  }
  {
    const s = await open(fileR, { harness: false, query: 'seed=' + seeds[0] });
    try {
      const page = s.page, shot = async () => sha((await page.screenshot()).toString('base64'));
      await page.waitForTimeout(1200);
      const hooked = await page.evaluate(() => typeof window.__mc !== 'undefined' || typeof window.__h !== 'undefined');
      const a = await shot();
      for (let i = 0; i < 14; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(700); }
      const b = await shot();
      await page.keyboard.down('KeyD'); await page.waitForTimeout(2500); await page.keyboard.press('Space'); await page.waitForTimeout(600); await page.keyboard.up('KeyD');
      const c = await shot();
      const saved = await page.evaluate(() => Object.keys(localStorage));
      fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true }); await page.screenshot({ path: path.join(OUT, 'shots', spec.id + '.release.png') });
      add('P-3r', 'the file people get: opens, takes a real keyboard, moves, asks the network for nothing', !hooked && a !== b && b !== c && s.errors.length === 0 && s.requests.length === 0, { testHookPresent: hooked, titleChanged: a !== b, playMoved: b !== c, errors: s.errors.slice(0, 3), requests: s.requests.length, storageKeys: saved });
    } finally { await s.close(); }
  }

  /* ---- cost ---- */
  add('P-12a', 'step cost leaves room (headless; the real-time test on devices is P-12)', A.ms / A.n < 2, { msPerStep: +(A.ms / A.n).toFixed(4), msPerFrameDrawn: +B.frameMs.toFixed(2) });
  return finish();

  function finish() {
    const failed = checks.filter(c => !c.pass && !c.waived), waived = checks.filter(c => c.waived);
    const report = { game: spec.id, title: spec.title, engine: engineHash(spec.mechanics), spec: sha(JSON.stringify(spec)).slice(0, 16), when: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), pass: failed.length === 0, passed: checks.length - failed.length - waived.length, failed: failed.length, waived: waived.map(c => ({ id: c.id, why: c.waived })), checks };
    fs.mkdirSync(path.join(OUT, 'reports'), { recursive: true });
    const f = path.join(OUT, 'reports', spec.id + '.verify.json'); fs.writeFileSync(f, JSON.stringify(report, null, 1)); report.file = f;
    return report;
  }
}
module.exports = { verify, runBot, staticScan };
