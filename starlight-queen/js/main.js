'use strict';
/* Starlight Queen — boot, main loop, presentation (pixel buffer + crisp serif overlay text) */
(() => {
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  const [buf, c] = mk(W, H);
  let s = 1; // device pixels per game pixel

  const SERIF = '"EB Garamond","Palatino Linotype","Book Antiqua",Palatino,"URW Palladio L","Iowan Old Style",Georgia,"Times New Roman",serif';
  const TITLE = '"Cinzel","Trajan Pro","Palatino Linotype","Book Antiqua",Palatino,"URW Palladio L",Georgia,serif';
  const UI = {
    ctx, get s() { return s; },
    font(size, o) { ctx.font = `${o && o.italic ? 'italic ' : ''}${o && o.title ? '600 ' : ''}${size * s}px ${o && o.title ? TITLE : SERIF}`; },
    width(str, size, o) { this.font(size, o); return ctx.measureText(str).width / s; },
    text(str, x, y, size, o) {
      o = o || {};
      const a = o.alpha === undefined ? 1 : o.alpha;
      if (a <= 0.01) return;
      ctx.save();
      this.font(size, o);
      ctx.globalAlpha = a; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
      let px = x * s;
      if (o.ls && 'letterSpacing' in ctx) { ctx.letterSpacing = (o.ls * s) + 'px'; if (!o.align) px += o.ls * s / 2; }
      if (o.halo) { ctx.strokeStyle = o.halo; ctx.lineWidth = size * s * 0.32; ctx.lineJoin = 'round'; ctx.strokeText(str, px, y * s); }
      if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = size * s * 0.55; ctx.fillStyle = o.color || '#fff'; ctx.fillText(str, px, y * s); }
      if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = Math.max(2, size * s * 0.18); ctx.shadowOffsetY = Math.max(1, s * 0.5); }
      else { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; }
      ctx.fillStyle = o.color || '#fff';
      ctx.fillText(str, px, y * s);
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
    s = Math.max(1, k);
    cv.width = Math.round(W * s); cv.height = Math.round(H * s);
    cv.style.width = (cv.width / dpr) + 'px'; cv.style.height = (cv.height / dpr) + 'px';
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
    if (sc.drawHi) sc.drawHi(UI);
    // soft vignette
    const v = ctx.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.45, cv.width / 2, cv.height / 2, cv.width * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, cv.width, cv.height);
    if (Scenes.fade > 0) { ctx.fillStyle = `rgba(4,5,13,${Scenes.fade})`; ctx.fillRect(0, 0, cv.width, cv.height); }
    if (muteT > 0) { muteT--; UI.text(Sound.muted ? 'Sound off' : 'Sound on', W - 8, H - 8, 7, { color: '#dfe8ff', align: 'right', alpha: Math.min(1, muteT / 20) }); }
  }

  let muteT = 0;
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
    if (document.hidden && sc === Scenes.list.play && !sc.paused && World.state === 'play' && !World.player.dead && !World.card) { sc.paused = true; }
  });

  Art.init();
  Input.bindTouch();
  Input.onFirst(() => Sound.init());
  window.addEventListener('pointerdown', () => Sound.init());
  window.addEventListener('keydown', () => Sound.init());
  Game.loadSave();

  const q = new URLSearchParams(location.search);
  if (document.fonts && document.fonts.load) ['600 20px Cinzel', '20px "EB Garamond"', 'italic 20px "EB Garamond"'].forEach(f => document.fonts.load(f).catch(() => { }));
  if (q.has('at')) { Game.newGame(); Game.cp = { x: (+q.get('at') || 3) * T + 8, y: (ROWS - (+q.get('alt') || 3)) * T }; if (q.has('met')) Game.metBoy = true; if (q.has('coop')) Game.coop = Game.metBoy = true; Scenes.go('play', { resume: true, god: q.has('god') }); }
  else Scenes.go(q.get('scene') || 'title');
  window.__sq = { Game, World, Scenes, Input, Sound, step, frame };
  requestAnimationFrame(loop);
})();
