'use strict';
/* The compiler: GameSpec (data) + engine (verified code) -> one self-contained HTML file.
   It is deterministic: the same spec and engine give the same bytes. It adds nothing of its own to the game. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const log = require('../lib/log')('compile');
const ENGINE = path.resolve(__dirname, '../engine');
const ORDER = ['core', 'audio', 'gems', 'backdrops', 'paint', 'paint-props', 'paint-life', 'levels', 'entities', 'wonders', 'world', 'scenes', 'main'];
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function engineSources() { return ORDER.map(n => ({ name: n, src: fs.readFileSync(path.join(ENGINE, 'js', n + '.js'), 'utf8') })); }
function engineHash() { return sha(engineSources().map(s => s.src).join('\0') + fs.readFileSync(path.join(ENGINE, 'shell.html'), 'utf8')).slice(0, 16); }
/* every text key the engine can ask for */
function engineTextKeys() {
  const keys = new Set();
  for (const s of engineSources()) for (const m of s.src.matchAll(/\btx\('([^']+)'/g)) keys.add(m[1]);
  return keys;
}

/* Check a GameSpec before anything is built from it. Returns a list of problems; empty means it may be compiled. */
function validate(spec) {
  const bad = [], need = (c, m) => { if (!c) bad.push(m); };
  need(spec && typeof spec === 'object', 'spec is not an object'); if (bad.length) return bad;
  need(spec.schema === 1, 'schema must be 1');
  need(/^[a-z0-9][a-z0-9-]{1,60}$/.test(spec.id || ''), 'id must be a lowercase slug');
  for (const k of ['title', 'subtitle', 'description', 'turnText', 'hero', 'companion', 'finalGem']) need(typeof spec[k] === 'string' && spec[k], k + ' is missing');
  for (const k of ['regions', 'gems', 'keeps', 'wonders', 'prologue', 'epilogue', 'places', 'mapNames', 'gemWhere', 'companionLines', 'speakers']) need(Array.isArray(spec[k]) && spec[k].length, k + ' is missing or empty');
  need(spec.text && typeof spec.text === 'object', 'text table is missing');
  if (bad.length) return bad;
  for (const k of engineTextKeys()) need(typeof spec.text[k] === 'string', 'text is missing key ' + k);
  const gemIds = new Set(spec.gems.map(g => g.id)), keepIds = new Set(spec.keeps.map(g => g.id)), wonderIds = new Set(spec.wonders.map(g => g.id));
  need(gemIds.has(spec.finalGem), 'finalGem is not one of the gems');
  need(spec.gemWhere.length === spec.gems.length, 'gemWhere must have one entry per gem');
  const OPS = new Set(['g', 'ceil', 'liq', 'p', 'b', 'spk', 's', 'arc', 'e', 'keep', 'mp', 'cp', 'wonder', 'warp', 'mark', 'beacon', 'sign', 'gem', 'gemBlock', 'npc', 'torch', 'start', 'm', 'door', 'arena']);
  const placed = { gem: new Set(), keep: new Set(), wonder: new Set() }, marks = new Set(), warps = [];
  let starts = 0, arenas = 0, finals = 0, npcs = 0;
  spec.regions.forEach((r, i) => {
    need(typeof r.theme === 'string' && r.cols > 0 && Array.isArray(r.ops), `region ${i} needs theme, cols and ops`);
    for (const o of r.ops || []) {
      need(OPS.has(o[0]), `region ${i}: unknown op ${o[0]}`);
      if (o[0] === 'gem' || o[0] === 'gemBlock') { need(gemIds.has(o[1]), `region ${i}: unknown gem ${o[1]}`); need(!placed.gem.has(o[1]), `gem ${o[1]} placed twice`); placed.gem.add(o[1]); }
      if (o[0] === 'keep') { need(keepIds.has(o[1]), `region ${i}: unknown keepsake ${o[1]}`); placed.keep.add(o[1]); }
      if (o[0] === 'wonder') { need(wonderIds.has(o[1]), `region ${i}: unknown wonder ${o[1]}`); placed.wonder.add(o[1]); }
      if (o[0] === 'mark') marks.add(o[1]); if (o[0] === 'warp') warps.push(o[3]);
      if (o[0] === 'start') starts++; if (o[0] === 'arena') arenas++; if (o[0] === 'npc') npcs++; if (o[0] === 'beacon' && o[4]) finals++;
      for (const a of o.slice(1)) if (typeof a === 'number') need(Number.isFinite(a), `region ${i}: ${o[0]} has a number that is not finite`);
    }
  });
  for (const id of gemIds) need(placed.gem.has(id) || id === spec.finalGem, `gem ${id} is never placed`);
  for (const id of keepIds) need(placed.keep.has(id), `keepsake ${id} is never placed`);
  for (const id of wonderIds) need(placed.wonder.has(id), `wonder ${id} is never placed`);
  for (const w of warps) need(marks.has(w), `warp leads to unknown mark ${w}`);
  need(starts === 1, 'exactly one start is needed'); need(arenas === 1, 'exactly one arena is needed'); need(finals === 1, 'exactly one final beacon is needed'); need(npcs === 1, 'exactly one companion is needed');
  for (const [name, cards, max] of [['prologue', spec.prologue, 6], ['epilogue', spec.epilogue, 5]]) {
    need(cards.length <= max, `${name} has more than ${max} cards`);
    cards.forEach((c, i) => need(typeof c.s === 'string' && c.s.split(/\s+/).length <= 45, `${name} card ${i + 1} is over 45 words`));
  }
  return bad;
}

function compile(spec, opts = {}) {
  const bad = validate(spec);
  if (bad.length) { const e = new Error('GameSpec is not valid:\n  ' + bad.join('\n  ')); e.problems = bad; throw e; }
  let html = fs.readFileSync(path.join(ENGINE, 'shell.html'), 'utf8');
  const fonts = fs.readFileSync(path.join(ENGINE, 'fonts.css'), 'utf8');
  const json = JSON.stringify(spec).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');
  const stamp = `engine ${engineHash()} spec ${sha(JSON.stringify(spec)).slice(0, 16)}`;
  const scripts = [`<script>window.__SPEC=${json};${opts.harness ? 'window.__MC_HARNESS=true;' : ''}</script>`];
  for (const s of engineSources()) { if (/<\/script/i.test(s.src)) throw new Error(s.name + ' contains a closing script tag'); scripts.push(`<script>\n${s.src}\n</script>`); }
  html = html.replace('<style>/*FONTS*/</style>', () => `<style>\n${fonts}\n</style>`).replace('<!--SCRIPTS-->', () => scripts.join('\n'))
    .replace('{{TITLE}}', esc(spec.title + ' — ' + spec.subtitle)).replace('{{DESCRIPTION}}', esc(spec.description)).replace('{{TURN}}', esc(spec.turnText).replace(/\n/g, '<br>'))
    .split('{{NAME}}').join(esc(spec.title))
    .replace('<head>', () => `<head>\n<!-- ${esc(spec.title)}. One file: nothing to install, no internet needed. Made with Main Character (${stamp}).\n     Typefaces: Cinzel and EB Garamond, embedded under the SIL Open Font Licence 1.1. -->`);
  if (/https?:\/\//.test(html.replace(/http:\/\/www\.w3\.org/g, ''))) throw new Error('the built file must not reach for the network');
  log.info(`compiled ${spec.id}${opts.harness ? ' (harness)' : ''}`, { bytes: Buffer.byteLength(html), sha: sha(html).slice(0, 16), stamp });
  return html;
}
module.exports = { compile, validate, engineHash, engineTextKeys, sha };
