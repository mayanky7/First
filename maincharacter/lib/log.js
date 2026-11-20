'use strict';
/* Logging: every command writes structured lines to out/logs/<day>.jsonl and a readable line to stderr.
   MC_LOG=debug shows everything; MC_LOG=quiet shows only warnings and errors. */
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '../out/logs');
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const floor = process.env.MC_LOG === 'debug' ? 0 : process.env.MC_LOG === 'quiet' ? 2 : 1;
let file = null;
function write(level, scope, msg, data) {
  const rec = Object.assign({ t: new Date().toISOString(), level, scope, msg }, data ? { data } : {});
  try { if (!file) { fs.mkdirSync(DIR, { recursive: true }); file = path.join(DIR, rec.t.slice(0, 10) + '.jsonl'); } fs.appendFileSync(file, JSON.stringify(rec) + '\n'); } catch (e) { }
  if (LEVELS[level] >= floor) process.stderr.write(`[${rec.t.slice(11, 19)}] ${level.toUpperCase().padEnd(5)} ${scope}: ${msg}${data && floor === 0 ? ' ' + JSON.stringify(data) : ''}\n`);
}
module.exports = scope => ({
  debug: (m, d) => write('debug', scope, m, d), info: (m, d) => write('info', scope, m, d),
  warn: (m, d) => write('warn', scope, m, d), error: (m, d) => write('error', scope, m, d)
});
