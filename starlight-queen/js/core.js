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
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyZ: 'jump',
    ArrowDown: 'down', KeyS: 'down',
    KeyX: 'fire', KeyJ: 'fire', KeyK: 'fire', ShiftLeft: 'fire', ShiftRight: 'fire', ControlLeft: 'fire',
    Enter: 'enter', NumpadEnter: 'enter',
    Escape: 'pause', KeyP: 'pause', KeyM: 'mute', KeyR: 'restart', KeyQ: 'quit', KeyF: 'full'
  };
  const MENU_ALIAS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'dn', KeyS: 'dn', Space: 'enter', KeyZ: 'enter', KeyX: 'enter' };
  const held = {}, queued = {}, sources = {};
  let anyQueued = false, onFirst = null, usedTouch = false;

  function set(action, src, on) {
    const s = sources[action] || (sources[action] = {});
    if (on) { if (!s[src]) { queued[action] = true; anyQueued = true; } s[src] = true; }
    else delete s[src];
    held[action] = Object.keys(s).length > 0;
  }
  function first() { if (onFirst) { const f = onFirst; onFirst = null; f(); } }

  window.addEventListener('keydown', e => {
    first();
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
  });

  function bindTouch() {
    const els = document.querySelectorAll('.tb');
    els.forEach(el => {
      const a = el.dataset.a;
      const on = e => { e.preventDefault(); first(); el.classList.add('on'); set(a, 'touch', true); if (a === 'jump') set('enter', 'touchj', true); };
      const off = e => { e.preventDefault(); el.classList.remove('on'); set(a, 'touch', false); if (a === 'jump') set('enter', 'touchj', false); };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('pointerleave', off);
      el.addEventListener('contextmenu', e => e.preventDefault());
    });
    const cv = document.getElementById('game');
    cv.addEventListener('pointerdown', e => {
      first();
      if (e.pointerType === 'touch' && !usedTouch) { usedTouch = true; document.body.classList.add('touch'); }
      set('enter', 'tap', true); set('tap', 'tap', true);
      setTimeout(() => { set('enter', 'tap', false); set('tap', 'tap', false); }, 60);
    });
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches) { usedTouch = true; document.body.classList.add('touch'); }
  }

  /* gamepad */
  const padPrev = {};
  function pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let p = null;
    for (const q of pads) if (q && q.connected) { p = q; break; }
    if (!p) return;
    const b = i => !!(p.buttons[i] && p.buttons[i].pressed);
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    const st = {
      left: ax < -0.35 || b(14), right: ax > 0.35 || b(15),
      up: ay < -0.5 || b(12), dn: ay > 0.5 || b(13), down: ay > 0.5 || b(13),
      jump: b(0) || b(1), fire: b(2) || b(3) || b(5) || b(7), enter: b(0) || b(9), pause: b(9)
    };
    for (const a in st) {
      if (st[a] !== !!padPrev[a]) { if (st[a]) first(); set(a, 'pad', st[a]); padPrev[a] = st[a]; }
    }
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
    _set: set
  };
})();
