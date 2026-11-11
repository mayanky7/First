'use strict';
/* Starlight Queen — boot, main loop, presentation (pixel buffer + crisp serif overlay text) */
(() => {
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  const [buf, c] = mk(W, H);
  const bcv = document.createElement('canvas'); bcv.width = 96; bcv.height = 54; const bx = bcv.getContext('2d');
  let s = 1; // device pixels per game pixel

  const SERIF = '"EB Garamond","Palatino Linotype","Book Antiqua",Palatino,"URW Palladio L","Iowan Old Style",Georgia,"Times New Roman",serif';
  const TITLE = '"Cinzel","Trajan Pro","Palatino Linotype","Book Antiqua",Palatino,"URW Palladio L",Georgia,serif';
  const cache = new Map();
  const dropCache = () => { for (const e of cache.values()) e.tc.width = 0; cache.clear(); };
  if (document.fonts) { document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', dropCache); document.fonts.ready && document.fonts.ready.then(dropCache); }
  const UI = {
    ctx, get s() { return s; },
    font(size, o) { ctx.font = `${o && o.italic ? 'italic ' : ''}${o && o.title ? '600 ' : ''}${size * s}px ${o && o.title ? TITLE : SERIF}`; },
    width(str, size, o) { this.font(size, o); return ctx.measureText(str).width / s; },
    text(str, x, y, size, o) {
      o = o || {};
      const a = o.alpha === undefined ? 1 : o.alpha;
      if (a <= 0.01 || !str) return;
      // text is rendered once (with its glow and shadow) and re-used; blurred shadows are costly per frame
      const key = str + '|' + size + '|' + (o.metal ? 'M' : '') + (o.color || '') + (o.glow || '') + (o.halo || '') + (o.italic ? 'i' : '') + (o.title ? 't' : '') + (o.ls || 0) + (o.shadow === false ? 'n' : '');
      let e = cache.get(key);
      if (!e) {
        if (cache.size > 120) dropCache();
        this.font(size, o);
        const ls = o.ls && 'letterSpacing' in ctx ? o.ls * s : 0;
        ctx.save(); if (ls) ctx.letterSpacing = ls + 'px'; const tw = ctx.measureText(str).width; ctx.restore();
        const pad = Math.ceil(size * s * 0.75 + 4), cw = Math.ceil(tw + pad * 2), ch = Math.ceil(size * s * 1.7 + pad * 2);
        const tc = document.createElement('canvas'); tc.width = cw; tc.height = ch;
        const g = tc.getContext('2d');
        g.font = ctx.font; g.textAlign = 'left'; g.textBaseline = 'middle'; if (ls) g.letterSpacing = ls + 'px';
        const px = pad, py = ch / 2;
        if (o.metal) { // engraved gold: hard shadow, dark keyline, vertical metal gradient, a lit upper edge
          const hgt = size * s, gr = g.createLinearGradient(0, py - hgt * 0.42, 0, py + hgt * 0.4);
          gr.addColorStop(0, '#fff4cf'); gr.addColorStop(0.46, '#f3c768'); gr.addColorStop(0.54, '#a8681f'); gr.addColorStop(1, '#e2aa4e');
          g.lineJoin = 'round';
          g.fillStyle = 'rgba(7,10,30,0.85)'; g.fillText(str, px, py + 1.2 * s); // hard shadow
          g.strokeStyle = '#2e1a06'; g.lineWidth = Math.max(1.5, s * 1); g.strokeText(str, px, py);
          g.fillStyle = '#fffbe6'; g.fillText(str, px, py - 0.4 * s); // lit upper edge
          g.fillStyle = gr; g.fillText(str, px, py);
          e = { tc, pad, tw: tw - ls, ch }; cache.set(key, e);
        } else {
        if (o.halo) { g.strokeStyle = o.halo; g.lineWidth = size * s * 0.32; g.lineJoin = 'round'; g.strokeText(str, px, py); }
        if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = size * s * 0.3; g.fillStyle = o.color || '#fff'; g.fillText(str, px, py); }
        if (o.shadow !== false) { g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = Math.max(2, size * s * 0.18); g.shadowOffsetY = Math.max(1, s * 0.5); }
        else { g.shadowColor = 'transparent'; g.shadowBlur = 0; }
        g.fillStyle = o.color || '#fff'; g.fillText(str, px, py);
        e = { tc, pad, tw: tw - ls, ch }; cache.set(key, e);
        }
      }
      const al = o.align || 'center';
      const x0 = x * s - e.pad - (al === 'center' ? e.tw / 2 : al === 'right' ? e.tw : 0);
      ctx.globalAlpha = a; ctx.drawImage(e.tc, Math.round(x0), Math.round(y * s - e.ch / 2)); ctx.globalAlpha = 1;
    },
    // a line of text in which [KEY] tokens are drawn as keycaps
    rich(line, cx, y, size, o) {
      o = o || {};
      const parts = line.split(/(\[[^\]]+\])/).filter(Boolean), a = o.alpha === undefined ? 1 : o.alpha;
      const seg = parts.map(p => { const key = p[0] === '[' && p[p.length - 1] === ']'; const label = key ? p.slice(1, -1) : p; const tw = key ? Math.max(size * 1.35, this.width(label, size * 0.62, { title: true }) + size * 0.9) : this.width(label, size, o); return { key, label, tw }; });
      let x = cx - seg.reduce((t, q) => t + q.tw, 0) / 2;
      for (const q of seg) {
        if (q.key) {
          const h = size * 1.3, r = Math.min(2.2, h / 3) * s;
          ctx.save(); ctx.globalAlpha = a;
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect((x + 0.6) * s, (y - h / 2 + 0.9) * s, (q.tw - 1.2) * s, h * s, r); else ctx.rect((x + 0.6) * s, (y - h / 2 + 0.9) * s, (q.tw - 1.2) * s, h * s);
          ctx.fillStyle = 'rgba(4,6,18,0.9)'; ctx.fill();
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect((x + 0.6) * s, (y - h / 2) * s, (q.tw - 1.2) * s, h * s, r); else ctx.rect((x + 0.6) * s, (y - h / 2) * s, (q.tw - 1.2) * s, h * s);
          ctx.fillStyle = 'rgba(38,46,82,0.95)'; ctx.fill(); ctx.strokeStyle = 'rgba(217,181,102,0.85)'; ctx.lineWidth = Math.max(1, s * 0.3); ctx.stroke();
          ctx.restore();
          this.text(q.label, x + q.tw / 2, y + 0.2, size * 0.62, { color: '#fff3c4', title: true, alpha: a, shadow: false });
        } else this.text(q.label, x, y, size, Object.assign({}, o, { align: 'left' }));
        x += q.tw;
      }
    },
    // a soft dark plate with a gold hairline: the one container used for dialogue and notices
    plate(x, y, w, h, a) {
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a;
      const r = Math.min(5 * s, h * s / 2);
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x * s, y * s, w * s, h * s, r); else ctx.rect(x * s, y * s, w * s, h * s);
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 6 * s; ctx.shadowOffsetY = 1.5 * s;
      ctx.fillStyle = 'rgba(9,13,34,0.9)'; ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(217,181,102,0.55)'; ctx.lineWidth = Math.max(1, s * 0.3); ctx.stroke();
      ctx.restore();
    },
    wrap(str, maxW, size, o) {
      this.font(size, o || { italic: true });
      const words = str.split(' '), lines = []; let cur = '';
      for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (ctx.measureText(t).width / s > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; }
      if (cur) lines.push(cur);
      return lines;
    },
    panel(x, y, w, h, a, col) {
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col || '#000';
      const r = Math.min(4 * s, h * s / 2);
      ctx.beginPath();
      if (ctx.roundRect && w < W) ctx.roundRect(x * s, y * s, w * s, h * s, r); else ctx.rect(x * s, y * s, w * s, h * s);
      ctx.fill(); ctx.restore();
    },
    rule(x, y, w, col, a) {
      if (a <= 0.01) return;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1, s * 0.4);
      ctx.beginPath(); ctx.moveTo((x - w / 2) * s, y * s); ctx.lineTo((x - 5) * s, y * s); ctx.moveTo((x + 5) * s, y * s); ctx.lineTo((x + w / 2) * s, y * s); ctx.stroke();
      ctx.translate(x * s, y * s); ctx.rotate(Math.PI / 4); ctx.fillRect(-1.6 * s, -1.6 * s, 3.2 * s, 3.2 * s);
      ctx.restore();
    }
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const ww = window.innerWidth, wh = window.innerHeight;
    let k = Math.min(ww / W, wh / H) * dpr; // device px per game px
    if (k >= 2 && Math.floor(k) / k > 0.9) k = Math.floor(k); // integer scaling keeps pixels even, unless it wastes much screen
    s = Math.max(1, Math.min(k, 5));
    cv.width = Math.round(W * s); cv.height = Math.round(H * s);
    const cssK = Math.min(ww / W, wh / H) >= 2 && k >= 2 && Math.floor(k) === k ? k / dpr : Math.min(ww / W, wh / H);
    cv.style.width = (W * cssK) + 'px'; cv.style.height = (H * cssK) + 'px';
    dropCache();
    const vg = document.getElementById('vig'); if (vg) { vg.style.width = cv.style.width; vg.style.height = cv.style.height; }
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();

  function frame() {
    const sc = Scenes.cur;
    if (!sc) return;
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    sc.draw(c);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    ctx.drawImage(buf, 0, 0, cv.width, cv.height);
    // soft bloom: a small, contrast-boosted copy of the frame laid back over it
    bx.globalCompositeOperation = 'source-over'; bx.drawImage(buf, 0, 0, 96, 54);
    bx.globalCompositeOperation = 'multiply'; bx.drawImage(bcv, 0, 0); bx.drawImage(bcv, 0, 0); // keep only the brightest lights
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = sc.noBloom ? 0 : 0.13;
    ctx.drawImage(bcv, 0, 0, cv.width, cv.height); ctx.restore();
    if (sc.drawHi) sc.drawHi(UI);
    // soft vignette
    const mode = sc === Scenes.list.play && !World.card && !sc.paused ? 'play' : 'menu';
    if (mode !== lastMode) { document.body.classList.toggle('menu', mode === 'menu'); lastMode = mode; }
    if (Scenes.fade > 0) { // iris wipe, closing on the traveller
      const f = Scenes.fade; let ix = cv.width / 2, iy = cv.height / 2;
      if (sc === Scenes.list.play && World.player) { ix = (World.player.x + 5 - World.cam.x) * s; iy = (World.player.y + 10 - World.cam.y) * s; }
      ctx.fillStyle = '#04050d'; ctx.beginPath(); ctx.rect(0, 0, cv.width, cv.height);
      ctx.arc(ix, iy, Math.hypot(cv.width, cv.height) * (1 - f) * (1 - f), 0, Math.PI * 2); ctx.fill('evenodd');
    }
    if (muteT > 0) { muteT--; UI.text(Sound.muted ? 'Sound off' : 'Sound on', W - 8, H - 8, 7, { color: '#dfe8ff', align: 'right', alpha: Math.min(1, muteT / 20) }); }
  }

  let muteT = 0, vig = null, lastMode = '';
  World.calm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function step() {
    Input.poll();
    if (Input.hit('mute')) { Sound.toggleMute(); muteT = 90; }
    if (Input.hit('full')) {
      const el = document.documentElement;
      if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen || (() => { })).call(el);
      else (document.exitFullscreen || document.webkitExitFullscreen || (() => { })).call(document);
    }
    Scenes.update();
    Input.endStep();
  }

  const STEP = 1000 / 60;
  let last = 0, acc = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!last) last = now;
    acc += Math.min(100, now - last); last = now;
    let n = 0;
    while (acc >= STEP && n < 5) { step(); acc -= STEP; n++; }
    if (n === 5) acc = 0;
    frame();
  }

  // pause when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    last = 0;
    const sc = Scenes.cur;
    if (document.hidden && sc === Scenes.list.play && !sc.paused && World.state === 'play' && !World.player.dead && !World.card && !World.gemFx) { sc.paused = true; sc.armR = false; Sound.duck(true); }
  });

  Art.init();
  Input.bindTouch();
  Input.onFirst(() => Sound.init());
  window.addEventListener('pointerdown', () => Sound.init());
  window.addEventListener('keydown', () => Sound.init());
  Game.loadSave();

  const q = new URLSearchParams(location.search);
  if (document.fonts && document.fonts.load) ['600 20px Cinzel', '20px "EB Garamond"', 'italic 20px "EB Garamond"'].forEach(f => document.fonts.load(f).catch(() => { }));
  if (q.has('at')) { Game.newGame(); Game.cp = { x: (+q.get('at') || 3) * T + 8, y: (ROWS - (+q.get('alt') || 3)) * T }; if (q.has('down')) { Game.bossDown = true; Game.gems.kohinoor = 1; } Scenes.go('play', { resume: true, god: q.has('god') }); }
  else Scenes.go(q.get('scene') || 'title');
  window.__sq = { Game, World, Scenes, Input, Sound, step, frame };
  requestAnimationFrame(loop);
})();
