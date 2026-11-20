'use strict';
/* The one door to a language model. Everything the Story Room and the judges ask goes through ask().
   Backend: the `claude` command in print mode, with every tool turned off, run from an empty folder, so a
   model call can read nothing and do nothing: it takes words and returns words.
   Every call is written to <job>/calls/NN-<tag>.json (prompt, reply, cost, seconds), so a game can be traced
   back to exactly what was asked and answered.
   MC_MODEL_CMD overrides the command (for a different backend); MC_FAKE_MODEL=<file.js> swaps in a function for tests. */
const fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');
const log = require('../lib/log')('model');

const TOOLS_OFF = 'Bash Edit Write Read Glob Grep WebFetch WebSearch Agent Task NotebookEdit TodoWrite Skill';
let seq = 0;
const totals = { calls: 0, usd: 0, seconds: 0, inTok: 0, outTok: 0 };

function runClaude(system, prompt, timeoutMs) {
  return new Promise((resolve, reject) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-model-'));
    const cmd = process.env.MC_MODEL_CMD || 'claude';
    const a = ['-p', '--output-format', 'json', '--max-turns', '1', '--disallowedTools', TOOLS_OFF, '--system-prompt', system];
    const env = Object.assign({}, process.env); delete env.CLAUDECODE; delete env.CLAUDE_CODE_ENTRYPOINT;
    const p = spawn(cmd, a, { cwd: dir, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    const timer = setTimeout(() => { p.kill('SIGKILL'); reject(new Error('model call timed out')); }, timeoutMs);
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d);
    p.on('error', e => { clearTimeout(timer); reject(e); });
    p.on('close', code => {
      clearTimeout(timer); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { }
      const i = out.indexOf('{"type"'); // the command may print a warning line first
      try {
        const j = JSON.parse(i >= 0 ? out.slice(i) : out);
        if (j.is_error || typeof j.result !== 'string') return reject(new Error('model error: ' + String(j.result || j.subtype || code).slice(0, 300)));
        resolve({ text: j.result, usd: j.total_cost_usd || 0, usage: j.usage || {} });
      } catch (e) { reject(new Error(`model gave no JSON envelope (exit ${code}): ${(err || out).slice(0, 300)}`)); }
    });
    p.stdin.end(prompt);
  });
}

/* the first complete JSON value in a reply, fenced or not */
function parseJSON(text) {
  const fence = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  const tries = fence ? [fence[1], text] : [text];
  for (const t of tries) {
    const s = t.search(/[\[{]/); if (s < 0) continue;
    for (let e = t.length; e > s; e = Math.max(t.lastIndexOf('}', e - 1), t.lastIndexOf(']', e - 1)) + 0) {
      try { return JSON.parse(t.slice(s, e + 1)); } catch (x) { if (e <= s + 1) break; }
    }
  }
  throw new Error('no JSON in reply: ' + text.slice(0, 200));
}

/* ask({ system, prompt, tag, job, json, check, tries })
   json: parse the reply as JSON. check(value) -> list of problems; a non-empty list is sent back to the model once per try. */
async function ask(o) {
  const tries = o.tries || 3, n = ++seq, tag = o.tag || 'ask';
  let prompt = o.prompt, last = null;
  for (let t = 1; t <= tries; t++) {
    const t0 = Date.now(); let rec = { n, tag, try: t, system: o.system, prompt };
    try {
      const r = process.env.MC_FAKE_MODEL ? await require(path.resolve(process.env.MC_FAKE_MODEL))(o, prompt) : await runClaude(o.system, prompt, o.timeoutMs || 600000);
      const secs = (Date.now() - t0) / 1000;
      totals.calls++; totals.usd += r.usd || 0; totals.seconds += secs; totals.inTok += (r.usage.input_tokens || 0) + (r.usage.cache_read_input_tokens || 0) + (r.usage.cache_creation_input_tokens || 0); totals.outTok += r.usage.output_tokens || 0;
      Object.assign(rec, { reply: r.text, usd: r.usd, usage: r.usage, seconds: secs });
      let value = r.text;
      if (o.json) value = parseJSON(r.text);
      const problems = o.check ? o.check(value) : [];
      rec.problems = problems; save(o.job, rec);
      log.info(`${tag} #${n} try ${t}: ${secs.toFixed(1)}s $${(r.usd || 0).toFixed(3)}${problems.length ? ' — ' + problems.length + ' problems' : ''}`, { problems: problems.slice(0, 8) });
      if (!problems.length) return value;
      last = { value, problems };
      prompt = o.prompt + '\n\n---\nYour previous answer:\n```json\n' + JSON.stringify(value, null, 1) + '\n```\nIt had these problems, found by a program (so they are certain):\n' + problems.map(p => '- ' + p).join('\n') + '\nGive the whole answer again, corrected, in the same format. Change only what is needed to fix the problems.';
    } catch (e) { rec.error = String(e.message || e); save(o.job, rec); log.warn(`${tag} #${n} try ${t} failed: ${rec.error}`); last = last || { error: rec.error }; }
  }
  if (last && last.value !== undefined && o.lenient) { log.warn(`${tag}: kept an answer with ${last.problems.length} problems`); return last.value; }
  const err = new Error(`${tag}: no acceptable answer after ${tries} tries` + (last && last.problems ? ': ' + last.problems.slice(0, 5).join('; ') : last && last.error ? ': ' + last.error : ''));
  err.problems = last && last.problems; err.value = last && last.value; throw err;
}
function save(job, rec) {
  if (!job) return;
  const d = path.join(job, 'calls'); fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, String(rec.n).padStart(3, '0') + '-' + rec.tag + (rec.try > 1 ? '.try' + rec.try : '') + '.json'), JSON.stringify(rec, null, 1));
}
/* run tasks a few at a time */
async function pool(tasks, n) {
  const out = new Array(tasks.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, async () => { while (i < tasks.length) { const k = i++; out[k] = await tasks[k](); } }));
  return out;
}
module.exports = { ask, pool, parseJSON, totals };
