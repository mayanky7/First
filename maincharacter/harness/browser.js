'use strict';
/* Opens a built game in a real browser for the bots. The page gets no network at all. */
const { chromium, webkit } = require('playwright');
const path = require('path');
const log = require('../lib/log')('browser');

async function open(file, opts = {}) {
  const engine = opts.engine === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({ headless: !opts.headed });
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1152, height: 648 }, deviceScaleFactor: 1 }, opts.context || {}));
  // a save from an earlier visit, put where the game will look for it
  if (opts.storage) await ctx.addInitScript(st => { try { if (!sessionStorage.getItem('__mc_put')) { for (const k in st) localStorage.setItem(k, st[k]); sessionStorage.setItem('__mc_put', '1'); } } catch (e) { } }, opts.storage);
  const page = await ctx.newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => { errors.push(String(e && e.stack || e)); log.error('page error', { e: String(e) }); });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { errors.push('console: ' + m.text()); log.warn('console error', { text: m.text() }); } });
  await page.route(/^(https?|wss?):/, r => { requests.push(r.request().url()); r.abort(); });
  const url = 'file://' + path.resolve(file) + (opts.query ? '?' + opts.query : '');
  await page.goto(url);
  if (opts.harness !== false) await page.waitForFunction(() => window.__mc && window.__mc.Scenes.cur !== undefined, null, { timeout: 15000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  if (opts.harness !== false) { await page.addScriptTag({ path: path.join(__dirname, 'inpage.js') }); await page.addScriptTag({ path: path.join(__dirname, 'bots-inpage.js') }); }
  return { browser, page, errors, requests, close: () => browser.close() };
}
module.exports = { open };
