#!/usr/bin/env node
/* One-off port: starlight-queen/js -> engine/js.
   1. content tables become references into the GameSpec (SPEC)
   2. every piece of prose becomes tx('key'), and the words go to the GameSpec's text table
   Run with --dry to list the candidate strings. */
const acorn = require('acorn'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), SRC = path.resolve(ROOT, '../starlight-queen/js'), DST = path.join(ROOT, 'engine/js');
const DRY = process.argv.includes('--dry');
const TABLES = {
  GEMS: 'SPEC.gems', KEEPS: 'SPEC.keeps', WONDERS: 'SPEC.wonders', PROLOGUE: 'SPEC.prologue', EPILOGUE: 'SPEC.epilogue', PLACES: 'SPEC.places',
  MAP_NAMES: 'SPEC.mapNames', GEM_WHERE: 'SPEC.gemWhere', MAYANK_LINES: 'SPEC.companionLines', WONDER_TOTAL: 'SPEC.wonders.length',
  REGIONS: 'SPEC.regions.map(r => Object.assign({}, r, { build(L) { for (const o of r.ops) L[o[0]].apply(L, o.slice(1)); } }))'
};
const NOT_PROSE = [/^use strict$/, /^#[0-9a-f]{3,8}$/i, /rgba?\(/, /^\(.*\)$/, /"EB Garamond"|"Cinzel"/, /script\[/, /index\.html/, /window\.__sq/, /^not the game$/,
  /^[a-z][A-Za-z0-9_-]*$/, /^\s*$/, /^[^A-Za-z]*$/, /^(px|px |text\/html|2d|high|round|center|middle|left|right|alphabetic|top|lighter|source-over|screen|multiply|destination-out|bold |italic |600 |500 )/,
  /^[A-Z][a-z]+[A-Z]/, /^(Key|Arrow|Numpad|Shift|Control)[A-Z]/, /^(Enter|Escape|Space|Slash|Period)$/, /^[A-Z]$/, /^DEFGHIJK$/, /^(I|SI|VS|VVS|IF|FL)$/, /^sq-/, /minimum-scale/, /^\d/, /^,/, /^\./, /^\?HSG$/, /^w:/, /^sw\.js$/, /^\[E\]$/, /^Tonttu:$/];
const FILES = fs.readdirSync(SRC).filter(f => f.endsWith('.js'));
const TEXT_FILES = new Set(['world.js', 'entities.js', 'wonders.js', 'scenes.js', 'main.js', 'backdrops.js']);
const text = {}, used = {};
function keyFor(file, s) {
  const base = file.replace('.js', '') + '.' + (s.replace(/\{\d\}/g, ' ').replace(/[^A-Za-z0-9 ]/g, '').trim().split(/\s+/).slice(0, 4).join('-').toLowerCase() || 'x');
  let k = base, i = 2;
  while (used[k] !== undefined && used[k] !== s) k = base + '-' + i++;
  used[k] = s; return k;
}
function walk(node, fn, parent) {
  if (!node || typeof node.type !== 'string') return;
  if (fn(node, parent) === false) return;
  for (const k in node) { const v = node[k]; if (Array.isArray(v)) v.forEach(c => walk(c, fn, node)); else if (v && typeof v.type === 'string') walk(v, fn, node); }
}
const isProse = s => !NOT_PROSE.some(r => r.test(s));
for (const f of FILES) {
  let src = fs.readFileSync(path.join(SRC, f), 'utf8');
  // 1. tables
  { const ast = acorn.parse(src, { ecmaVersion: 2022 }); const reps = [];
    for (const n of ast.body) if (n.type === 'VariableDeclaration') for (const d of n.declarations) if (TABLES[d.id.name]) reps.push([d.init.start, d.init.end, TABLES[d.id.name]]);
    reps.sort((a, b) => b[0] - a[0]).forEach(([s, e, t]) => { src = src.slice(0, s) + t + src.slice(e); }); }
  // 2. prose, innermost first, until none is left
  if (TEXT_FILES.has(f)) for (let pass = 0; pass < 6; pass++) {
    const ast = acorn.parse(src, { ecmaVersion: 2022 }); const cands = [];
    walk(ast, (n, par) => {
      if (n.type === 'CallExpression' && n.callee.name === 'tx') return false;
      if (par && par.type === 'Property' && par.key === n && !par.computed) return;
      if (n.type === 'Literal' && typeof n.value === 'string' && isProse(n.value)) cands.push({ n, s: n.value, args: [] });
      if (n.type === 'TemplateLiteral') {
        const s = n.quasis.map((q, i) => q.value.cooked + (i < n.expressions.length ? '{' + i + '}' : '')).join('');
        if (isProse(s.replace(/\{\d\}/g, ''))) cands.push({ n, s, args: n.expressions.map(e => [e.start, e.end]) });
      }
    });
    const leaf = cands.filter(c => !cands.some(o => o !== c && o.n.start >= c.n.start && o.n.end <= c.n.end));
    if (!leaf.length) break;
    leaf.sort((a, b) => b.n.start - a.n.start).forEach(c => {
      if (DRY) { console.log(f + ':', JSON.stringify(c.s)); }
      const k = keyFor(f, c.s); text[k] = c.s;
      const args = c.args.length ? ', [' + c.args.map(([s, e]) => src.slice(s, e)).join(', ') + ']' : '';
      src = src.slice(0, c.n.start) + "tx('" + k + "'" + args + ')' + src.slice(c.n.end);
    });
  }

  // 3. the engine's own changes: seeded randomness in two streams, storage per game, no story names in code
  const P = (from, to, n) => { const parts = src.split(from); if (parts.length - 1 !== (n || 1)) throw new Error(f + ': expected ' + (n || 1) + ' of ' + from + ', found ' + (parts.length - 1)); src = parts.join(to); };
  if (f === 'core.js') {
    P("const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);",
      "/* The game is data: SPEC is the GameSpec the compiler embedded. HARNESS is set only in a build made for the bots. */\n" +
      "const SPEC = window.__SPEC, HARNESS = !!window.__MC_HARNESS;\n" +
      "function tx(k, a) { let s = SPEC.text[k]; if (s === undefined) { tx.missing[k] = 1; return k; } if (HARNESS) tx.used[k] = 1; return a ? s.replace(/\\{(\\d)\\}/g, (m, i) => a[+i]) : s; }\n" +
      "tx.missing = {}; tx.used = {};\n" +
      "/* Two streams of randomness from one seed. The simulation draws from one; everything painted draws from the other,\n" +
      "   so how often the picture is drawn can never change what happens. */\n" +
      "const RNG = (() => {\n  let seed = 1, sim, dec, cur;\n  function reseed(s) { seed = s >>> 0; sim = rng(seed); dec = rng(seed ^ 0x9E3779B9); cur = sim; }\n" +
      "  reseed(1);\n  return { reseed, get seed() { return seed; }, sim() { cur = sim; }, decor() { cur = dec; }, next() { return cur(); } };\n})();\n" +
      "const rand = (a = 1, b) => b === undefined ? RNG.next() * a : a + RNG.next() * (b - a);");
  }
  if (f === 'audio.js') { P("localStorage.getItem('sq-mute')", "localStorage.getItem(SPEC.id + '-mute')"); P("localStorage.setItem('sq-mute'", "localStorage.setItem(SPEC.id + '-mute'"); }
  if (f === 'scenes.js') {
    src = src.replace(/'sq-(\w+)'/g, "'$1'");
    P("JSON.parse(localStorage.getItem(k) || 'null')", "JSON.parse(localStorage.getItem(SPEC.id + '-' + k) || 'null')");
    P("v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v))", "v === null ? localStorage.removeItem(SPEC.id + '-' + k) : localStorage.setItem(SPEC.id + '-' + k, JSON.stringify(v))");
    P("/^(Tonttu|Mayank): /.exec(txt)", "SPEAKER.exec(txt)");
    P("const Scenes = (() => {", "const SPEAKER = new RegExp('^(' + SPEC.speakers.join('|') + '): ');\nconst Scenes = (() => {");
    P("/^https?:$/.test(location.protocol) && !document.querySelector('script[src$=\"js/main.js\"]')", "/^https?:$/.test(location.protocol)");
    P("fetch('./index.html', { credentials: 'same-origin' })", "fetch(location.href.split('#')[0], { credentials: 'same-origin' })");
    P("html.indexOf('window.__sq') < 0", "html.indexOf('window.__SPEC') < 0");
  }
  if (f === 'entities.js') P("e.text.startsWith('Tonttu:')", "e.text.startsWith(SPEC.speakers[0] + ':')");
  src = src.replace(/Game\.gems\.kohinoor/g, 'Game.gems[SPEC.finalGem]').replace(/GEM_BY_ID\.kohinoor/g, 'GEM_BY_ID[SPEC.finalGem]').replace(/'kohinoor'/g, 'SPEC.finalGem');
  if (f === 'main.js') {
    P("  function frame() {", "  function frame() { RNG.decor(); try { paint(); } finally { RNG.sim(); } }\n  function paint() {");
    P("  window.__sq = { Game, World, Scenes, Input, Sound, step, frame };\n", "");
    P("  Game.loadSave();\n", "  const q0 = new URLSearchParams(location.search);\n  RNG.reseed(q0.has('seed') ? +q0.get('seed') : (Date.now() ^ Math.floor(Math.random() * 4294967296)));\n  Game.loadSave();\n");
    P("\n  requestAnimationFrame(loop);\n})();", "\n  /* The bots' build: nothing moves unless the harness steps it, and the harness can see inside. */\n" +
      "  if (HARNESS) { window.__mc = { SPEC, Game, World, Scenes, Input, Sound, RNG, tx, step, frame, T, ROWS, W, H }; return; }\n  requestAnimationFrame(loop);\n})();");
    P("navigator.serviceWorker.register('sw.js')", "navigator.serviceWorker.register('sw.js')");
  }
  src = src.replace(/^\/\* Starlight Queen — /m, '/* Main Character engine — ');
  if (!DRY) fs.writeFileSync(path.join(DST, f), src);
}
if (!DRY) {
  const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'games/starlight-queen.base.json'), 'utf8'));
  spec.text = text;
  spec.description = 'A side-scrolling story. For anyone who waited at eleven for a letter that never came. Ana walks out of a small Finnish town and west across the world, after the Mountain of Light, and towards somebody carrying a lantern.';
  spec.turnText = 'Turn your screen sideways\nto walk the road west.';
  fs.writeFileSync(path.join(ROOT, 'games/starlight-queen.json'), JSON.stringify(spec, null, 1));
  console.log('text keys', Object.keys(text).length);
}
