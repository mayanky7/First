'use strict';
/* Starlight Queen — core: constants, helpers, input */
const W = 384, H = 216, T = 16;

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const TAU = Math.PI * 2;

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0;
  h = Math.imul(h ^ h >>> 13, 1274126177);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function mk(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [cv, g];
}
function R(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); }
function mix(c1, c2, t) {
  const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
  const r = Math.round(lerp(a >> 16, b >> 16, t)), g = Math.round(lerp(a >> 8 & 255, b >> 8 & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
  return '#' + (1 << 24 | r << 16 | g << 8 | bl).toString(16).slice(1);
}

/* ---------- Input ---------- */
const Input = (() => {
  const KEYMAP = {
    KeyA: 'left', KeyD: 'right', KeyW: 'jump', Space: 'jump', KeyZ: 'jump', KeyS: 'down',
    KeyX: 'fire', KeyF: 'fire', ControlLeft: 'fire', KeyE: 'light', KeyC: 'light', ShiftLeft: 'light',
    ArrowLeft: 'left2', ArrowRight: 'right2', ArrowUp: 'jump2', ArrowDown: 'down2',
    KeyK: 'fire2', KeyJ: 'fire2', Slash: 'fire2', KeyL: 'light2', Period: 'light2', ShiftRight: 'light2',
    Enter: 'enter', NumpadEnter: 'enter',
    Escape: 'pause', KeyP: 'pause', KeyM: 'mute', KeyR: 'restart', KeyQ: 'quit', KeyG: 'full', KeyV: 'vault', KeyT: 'travel'
  };
  const MENU_ALIAS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'dn', KeyS: 'dn', Space: 'enter', KeyZ: 'enter', KeyX: 'enter' };
  const held = {}, queued = {}, sources = {};
  let anyQueued = false, onFirst = null, usedTouch = false, tapX = 0, tapY = 0;

  function set(action, src, on) {
    const s = sources[action] || (sources[action] = {});
    if (on) { if (!s[src]) { queued[action] = true; anyQueued = true; } s[src] = true; }
    else delete s[src];
    held[action] = Object.keys(s).length > 0;
  }
  function first() { if (onFirst) { const f = onFirst; onFirst = null; f(); } }

  window.addEventListener('keydown', e => {
    first();
    if ((e.ctrlKey || e.metaKey || e.altKey) && !/^(Control|Shift|Alt|Meta)/.test(e.code)) return;
    const a = KEYMAP[e.code], m = MENU_ALIAS[e.code];
    if (a || m) e.preventDefault();
    if (e.repeat) return;
    if (a) set(a, e.code, true);
    if (m) set(m, e.code, true);
    anyQueued = true;
  });
  window.addEventListener('keyup', e => {
    const a = KEYMAP[e.code], m = MENU_ALIAS[e.code];
    if (a) set(a, e.code, false);
    if (m) set(m, e.code, false);
  });
  window.addEventListener('blur', () => {
    for (const a in sources) { sources[a] = {}; held[a] = false; }
    for (const k in padPrev) delete padPrev[k];
  });

  function bindTouch() {
    // The buttons are read from where the fingers ARE, every time anything about a touch changes, and not from a
    // button's own down and up events: those can be lost (a finger that slides off, a system gesture, a browser that
    // sends the lift somewhere else), and a lost lift leaves her walking with nobody's thumb on the screen.
    const els = Array.from(document.querySelectorAll('.tb'));
    const press = (el, on) => {
      if (!!el._on === on) return;
      el._on = on; el.classList.toggle('on', on);
      const a = el.dataset.a; if (on) first();
      set(a, 'touch', on); if (a === 'jump') set('enter', 'touchj', on);
    };
    const release = () => els.forEach(el => press(el, false));
    // which button is this point on? The nearest one whose middle is within reach: a thumb is not a pixel
    const at = (x, y) => {
      let best = null, bd = 1e9;
      for (const el of els) { const r = el.getBoundingClientRect(); if (!r.width) continue; const d = Math.hypot(x - r.left - r.width / 2, y - r.top - r.height / 2); if (d < r.width * 0.62 && d < bd) { bd = d; best = el; } }
      return best;
    };
    const fingers = 'ontouchstart' in window;
    if (fingers) {
      const sync = e => { const hit = new Set(); for (let i = 0; i < e.touches.length; i++) { const el = at(e.touches[i].clientX, e.touches[i].clientY); if (el) hit.add(el); } els.forEach(el => press(el, hit.has(el))); };
      ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(n => document.addEventListener(n, sync, { passive: true, capture: true }));
    }
    els.forEach(el => {
      // a mouse or a pen (and touch, in a browser with no touch events) presses the button itself
      const mine = e => !(fingers && e.pointerType === 'touch');
      el.addEventListener('pointerdown', e => { e.preventDefault(); if (mine(e)) press(el, true); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => el.addEventListener(n, e => { if (mine(e)) press(el, false); }));
      el.addEventListener('contextmenu', e => e.preventDefault());
    });
    window.addEventListener('blur', release); window.addEventListener('pagehide', release);
    document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
    const cv = document.getElementById('game');
    cv.addEventListener('pointerdown', e => {
      first();
      if (e.pointerType === 'touch' && !usedTouch) { usedTouch = true; document.body.classList.add('touch'); }
      const rc = cv.getBoundingClientRect(); tapX = (e.clientX - rc.left) / rc.width * W; tapY = (e.clientY - rc.top) / rc.height * H;
      set('enter', 'tap', true); set('tap', 'tap', true);
      setTimeout(() => { set('enter', 'tap', false); set('tap', 'tap', false); }, 60);
    });
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches) { usedTouch = true; document.body.classList.add('touch'); }
    // The browser's own zoom has no place in a game: two thumbs on two buttons read as a pinch, quick taps on one as a
    // double-tap, and some browsers (iOS Safari) ignore a page that asks not to be zoomed. So stop those gestures here.
    // And if the page is ever zoomed all the same, step aside, so that a pinch can always bring it back.
    const vv = window.visualViewport, zoomed = () => !!vv && vv.scale > 1.02;
    const stop = e => { if (e.cancelable && !zoomed()) e.preventDefault(); };
    document.addEventListener('touchmove', stop, { passive: false });
    document.addEventListener('touchstart', e => { if (e.touches.length > 1) stop(e); }, { passive: false });
    let lastEnd = 0;
    document.addEventListener('touchend', e => { const now = Date.now(); if (now - lastEnd < 350) stop(e); lastEnd = now; }, { passive: false });
    ['gesturestart', 'gesturechange', 'gestureend', 'dblclick'].forEach(n => document.addEventListener(n, stop, { passive: false }));
    window.addEventListener('wheel', e => { if (e.ctrlKey) stop(e); }, { passive: false });
    if (vv) {
      const meta = document.querySelector('meta[name="viewport"]'), base = meta && meta.getAttribute('content');
      let tries = 0;
      const check = () => {
        const z = zoomed();
        document.documentElement.classList.toggle('zoomed', z); // the stylesheet lets a pinch through while this is set
        if (!z) { tries = 0; return; }
        if (meta && base && tries < 3) { tries++; meta.setAttribute('content', base + ',minimum-scale=1'); setTimeout(() => meta.setAttribute('content', base), 120); } // asking again for scale 1 snaps some browsers back
      };
      vv.addEventListener('resize', check); window.addEventListener('pageshow', check); window.addEventListener('orientationchange', () => setTimeout(check, 300)); check();
    }
  }

  /* gamepad */
  const padPrev = {}, padSfx = {};
  function pollPad() {
    const pads = (navigator.getGamepads ? Array.from(navigator.getGamepads()) : []).filter(q => q && q.connected);
    pads.slice(0, 2).forEach((p, idx) => {
      const sfx = idx === 1 ? '2' : '';
      if (padSfx[idx] !== sfx) { for (const a in sources) { delete sources[a]['pad' + idx]; held[a] = Object.keys(sources[a]).length > 0; } padPrev[idx] = {}; padSfx[idx] = sfx; }
      const b = i => !!(p.buttons[i] && p.buttons[i].pressed);
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      const st = {
        ['left' + sfx]: ax < -0.35 || b(14), ['right' + sfx]: ax > 0.35 || b(15), ['down' + sfx]: ay > 0.5 || b(13),
        ['jump' + sfx]: b(0) || b(1), ['fire' + sfx]: b(2) || b(5) || b(7), ['light' + sfx]: b(3) || b(4) || b(6),
        up: ay < -0.5 || b(12), dn: ay > 0.5 || b(13), enter: b(0), pause: idx === 0 && b(9)
      };
      const prev = padPrev[idx] || (padPrev[idx] = {});
      for (const a in st) if (st[a] !== !!prev[a]) { if (st[a]) first(); set(a, 'pad' + idx, st[a]); prev[a] = st[a]; }
    });
  }

  return {
    held: a => !!held[a],
    hit: a => !!queued[a],
    any: () => anyQueued,
    endStep() { for (const a in queued) delete queued[a]; anyQueued = false; },
    poll: pollPad,
    bindTouch,
    onFirst(f) { onFirst = f; },
    get touch() { return usedTouch; },
    get tapX() { return tapX; }, get tapY() { return tapY; },
    _set: set
  };
})();
