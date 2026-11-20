'use strict';
/* @ops puff */
/* A smoke test for the mechanic interface: a puff of wind that lifts the hero. Not part of any template. */
mechanic({
  id: 'zz-smoke',
  ops(ctx) { return { puff(x, a) { ctx.out.ents.push({ t: 'puff', x: ctx.px(x), y: ctx.py(a) }); } }; },
  init(w) { w.mech['zz-smoke'] = { lifts: 0, steps: 0 }; },
  step(w) { w.mech['zz-smoke'].steps++; },
  invariants(w) { const m = w.mech['zz-smoke']; return m && m.lifts >= 0 ? [] : ['lifts went negative']; },
  progress(w) { return 0; }, cellKey(w) { return ''; }, info(w) { return w.mech['zz-smoke']; },
  over(c, w, ox, oy) { }
});
ENT.puff = {
  init(e) { e.w = 12; e.h = 30; e.x -= 6; e.y -= 30; },
  update(w, e) { const p = touch(w, e); if (p && p.vy > -2) { p.vy = -3.2; w.mech['zz-smoke'].lifts++; } },
  draw(c, w, e, ox, oy) { c.globalAlpha = 0.25 + 0.1 * Math.sin(w.t * 0.1); c.fillStyle = '#cfe6ff'; c.fillRect(e.x - ox, e.y - oy, e.w, e.h); c.globalAlpha = 1; }
};
