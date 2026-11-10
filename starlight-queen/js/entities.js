'use strict';
/* Starlight Queen — Ana and Sam, their foes, items, diamonds, and the Hoarder King */

const SOLID = { '#': 1, 'B': 1, '?': 1, 'H': 1, 'S': 1, 'G': 1, 'U': 1, 'X': 1 };
function tileAt(w, cx, cy) { if (cy < 0 || cy >= w.rows || cx < 0 || cx >= w.cols) return '.'; return w.grid[cy][cx]; }
function solidAt(w, cx, cy) { if (cx < 0 || cx >= w.cols) return true; return !!SOLID[tileAt(w, cx, cy)]; }
function standable(w, cx, cy) { const ch = tileAt(w, cx, cy); return !!SOLID[ch] || ch === '='; }
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function moveBody(w, e) {
  e.hitWall = 0; e.hitCeil = null;
  e.x += e.vx;
  let x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.001) / T);
  let y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 0.001) / T);
  if (e.vx > 0) { for (let cy = y0; cy <= y1; cy++) if (solidAt(w, x1, cy)) { e.x = x1 * T - e.w; e.vx = 0; e.hitWall = 1; break; } }
  else if (e.vx < 0) { for (let cy = y0; cy <= y1; cy++) if (solidAt(w, x0, cy)) { e.x = (x0 + 1) * T; e.vx = 0; e.hitWall = -1; break; } }
  const oldBottom = e.y + e.h;
  e.y += e.vy; e.onGround = false;
  x0 = Math.floor(e.x / T); x1 = Math.floor((e.x + e.w - 0.001) / T);
  y0 = Math.floor(e.y / T); y1 = Math.floor((e.y + e.h - 0.001) / T);
  if (e.vy >= 0) {
    for (let cx = x0; cx <= x1; cx++) {
      const ch = tileAt(w, cx, y1);
      if (SOLID[ch] || (ch === '=' && oldBottom <= y1 * T + 0.01 && !(e.drop > 0))) { e.y = y1 * T - e.h; e.vy = 0; e.onGround = true; break; }
    }
  } else {
    const mid = Math.floor((e.x + e.w / 2) / T);
    let hit = -1;
    for (let cx = x0; cx <= x1; cx++) if (solidAt(w, cx, y0)) { if (hit < 0 || cx === mid) hit = cx; }
    if (hit >= 0) { e.y = (y0 + 1) * T; e.vy = 0; e.hitCeil = { cx: hit, cy: y0 }; }
  }
}

/* ============ Players ============ */
function act(p, n, hit) {
  const f = hit ? Input.hit : Input.held;
  if (!Game.coop) return f(n) || f(n + '2');
  return f(p.id ? n + '2' : n);
}
function nearP(w, e) {
  let best = w.player, bd = 1e9;
  for (const p of w.players) { if (p.dead) continue; const d = Math.abs(p.x - e.x) + Math.abs(p.y - e.y) * 0.5; if (d < bd) { bd = d; best = p; } }
  return best;
}
function touch(w, e) { for (const p of w.players) if (!p.dead && overlap(e, p)) return p; return null; }
function makePlayer(x, y, id) {
  return {
    id: id || 0,
    x: x - 5, y: y - 22, w: 10, h: 22, vx: 0, vy: 0, face: 1, onGround: false, coy: 0, jbuf: 0, jumping: false,
    gliding: false, glide: 0, drop: 0, hp: 3, inv: 0, hurtT: 0, radiant: 0, arrows: 3, arrowT: 0, shootT: 0,
    anim: 0, dead: 0, ride: null, control: true, stepT: 0
  };
}
const GLIDE_MAX = 44;
function updatePlayer(w, p) {
  if (p.dead) { p.dead++; return; }
  if (p.ride) { p.x += p.ride.ddx; p.y += p.ride.ddy; }
  const ctl = p.control && p.hurtT <= 0;
  const ax = ctl ? (act(p, 'right') ? 1 : 0) - (act(p, 'left') ? 1 : 0) : (p.auto || 0);
  const maxv = p.radiant > 0 ? 2.35 : 2.0;
  if (ax) { p.vx += ax * (p.onGround ? 0.2 : 0.15); p.face = ax; }
  else if (p.hurtT <= 0) p.vx *= p.onGround ? 0.76 : 0.95;
  p.vx = clamp(p.vx, -maxv, maxv);
  if (Math.abs(p.vx) < 0.03) p.vx = 0;

  const jHeld = ctl && act(p, 'jump'), jHit = ctl && act(p, 'jump', true);
  if (p.onGround) { p.coy = 7; p.glide = GLIDE_MAX; p.gliding = false; } else p.coy--;
  if (jHit) p.jbuf = 7; else p.jbuf--;
  if (p.jbuf > 0 && p.coy > 0) {
    if (act(p, 'down') && p.onGround && standingOnPlat(w, p)) { p.drop = 10; p.y += 1; }
    else { p.vy = -5.6; p.jumping = true; p.sq = 1.22; Sound.sfx('jump'); World.dust(p.x + 5, p.y + p.h, 4); }
    p.jbuf = 0; p.coy = 0; p.onGround = false; p.ride = null;
  } else if (jHit && !p.onGround && p.glide > 0) { p.gliding = true; Sound.sfx('glide'); }
  if (p.jumping && p.vy < 0 && !jHeld) { p.vy *= 0.45; p.jumping = false; }
  if (p.vy >= 0) p.jumping = false;
  if (!jHeld || p.glide <= 0 || p.onGround) p.gliding = false;
  p.vy += p.vy < 0 ? 0.22 : 0.32;
  if (p.gliding && p.vy > 0) { p.vy = Math.min(p.vy, 0.7); p.glide--; if (w.t % 4 === 0) World.spark(p.x + 5 - p.face * 8, p.y + 12, '#9fd8ff', 1); }
  p.vy = Math.min(p.vy, 5.5);
  if (p.drop > 0) p.drop--;

  const wasGround = p.onGround, prevBottom = p.y + p.h, fallV = p.vy;
  moveBody(w, p);
  p.x = clamp(p.x, w.minX, w.maxX - p.w);
  // moving platforms
  p.ride = null;
  if (p.vy >= 0 && !(p.drop > 0)) for (const pl of w.plats) {
    if (p.x + p.w > pl.x && p.x < pl.x + pl.w && prevBottom <= pl.y - pl.ddy + 4 && p.y + p.h >= pl.y) {
      p.y = pl.y - p.h; p.vy = 0; p.onGround = true; p.ride = pl; break;
    }
  }
  if (p.onGround && !wasGround && fallV > 2.5) { World.dust(p.x + 5, p.y + p.h, 6); p.sq = 0.78; Sound.sfx('land'); }
  p.sq = p.sq ? 1 + (p.sq - 1) * 0.8 : 1;
  if (p.onGround && Math.abs(p.vx) > 1) { p.stepT += Math.abs(p.vx); if (p.stepT > 24) { p.stepT = 0; World.dust(p.x + 5 - p.face * 3, p.y + p.h, 1); Sound.sfx('step'); } }
  if ((p.gliding || p.radiant > 0) && w.t % 3 === 0) { const im = drawPlayer.last && drawPlayer.last[p.id]; if (im) w.parts.push({ x: p.x + 5, y: p.y + 8, vx: 0, vy: 0, life: 14, max: 14, img: im, flip: p.face < 0, fade: 1 }); }
  if (p.hitCeil) World.bump(p.hitCeil.cx, p.hitCeil.cy);

  // shoot
  if (p.arrows < 3) { p.arrowT++; if (p.arrowT >= 48) { p.arrows++; p.arrowT = 0; } }
  if (ctl && act(p, 'fire', true)) {
    if (p.arrows > 0) {
      p.arrows--; p.shootT = 14;
      w.ents.push(makeEnt({ t: 'arrow', x: p.x + 5 + p.face * 9, y: p.y + 10, dir: p.face }));
      Sound.sfx('arrow');
    } else Sound.sfx('empty');
  }
  if (p.shootT > 0) p.shootT--;
  if (p.inv > 0) p.inv--;
  if (p.hurtT > 0) p.hurtT--;
  if (p.radiant > 0) {
    p.radiant--;
    if (w.t % 3 === 0) World.spark(p.x + rand(10), p.y + rand(22), w.t % 2 ? '#fff6b0' : '#9ff4ff', 1);
    if (p.radiant === 90) Sound.sfx('warn');
  }
  if (p.onGround && Math.abs(p.vx) > 0.4) p.anim += Math.abs(p.vx) * 0.11; else if (p.onGround) p.anim = 0;

  // hazards
  const cx0 = Math.floor((p.x + 2) / T), cx1 = Math.floor((p.x + p.w - 2) / T);
  const cy0 = Math.floor((p.y + 4) / T), cy1 = Math.floor((p.y + p.h - 1) / T);
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const ch = tileAt(w, cx, cy);
    if (ch === '~' && p.y + p.h > cy * T + 7) { killPlayer(w, p, true); return; }
    if (ch === '^' && p.y + p.h > cy * T + 8) { if (hurtPlayer(w, p, 0)) p.vy = -4.2; }
  }
  if (p.y > w.rows * T + 24) killPlayer(w, p, true);
}
function standingOnPlat(w, p) {
  if (p.ride) return false;
  const cy = Math.floor((p.y + p.h + 1) / T);
  for (let cx = Math.floor(p.x / T); cx <= Math.floor((p.x + p.w - 0.01) / T); cx++) if (SOLID[tileAt(w, cx, cy)]) return false;
  return true;
}
function hurtPlayer(w, p, fromX) {
  if (p.inv > 0 || p.dead || p.radiant > 0 || w.state !== 'play' || w.god) return false;
  p.hp--; Game.stats.hits++;
  if (p.hp <= 0) { killPlayer(w, p); return true; }
  w.hitstop = 5; p.inv = 110; p.hurtT = 22; p.vy = -3.2; p.vx = (fromX ? Math.sign(p.x + 5 - fromX) || -p.face : -p.face) * 2.2;
  p.gliding = false; p.ride = null;
  Sound.sfx('hurt'); w.shake = 8; w.flash = 0.35;
  return true;
}
function killPlayer(w, p, pit) {
  if (p.dead || w.state !== 'play') return;
  if (w.god && !pit) return;
  p.dead = 1; p.hp = 0; Sound.sfx('die'); w.shake = 10; Game.stats.deaths++;
  if (w.players.every(q => q.dead)) Sound.duck(true);
  for (let i = 0; i < 26; i++) { const a = rand(TAU), s = rand(0.5, 2.6); w.parts.push({ x: p.x + 5, y: p.y + 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: rand(40, 80), col: i % 2 ? '#bff4ff' : '#fff6b0', g: -0.01, glow: 1, sz: 1 + (i % 2) }); }
}
function drawPlayer(c, w, p, ox, oy) {
  if (p.dead) return;
  if (p.inv > 0 && p.hurtT <= 0 && (p.inv >> 3) % 2) return;
  const set = p.id ? (p.shootT > 0 ? Art.S.boyShoot : Art.S.boy) : (p.shootT > 0 ? Art.S.queenShoot : Art.S.queen);
  let img;
  if (p.hurtT > 0) img = set.hurt[0];
  else if (!p.onGround) img = p.gliding ? set.glide[(w.t >> 3) % 2] : p.vy < 0 ? set.jump[0] : set.fall[(w.t >> 3) % 2];
  else if (Math.abs(p.vx) > 0.4) img = set.run[Math.floor(p.anim) % 6];
  else img = set.idle[(w.t >> 5) % 2];
  const x = p.x - ox + 5 - 12, y = p.y - oy + 22 - 28;
  (drawPlayer.last || (drawPlayer.last = {}))[p.id] = img;
  if (p.radiant > 0 && (p.radiant > 90 || (p.radiant >> 2) % 2)) {
    Art.glow(c, p.x - ox + 5, p.y - oy + 11, 26 + Math.sin(w.t * 0.3) * 3, '#fff6b0', 0.7);
    img = (w.t >> 1) % 3 === 0 ? Art.flashOf(img) : img;
  }
  const sq = p.sq || 1;
  if (Math.abs(sq - 1) > 0.03) { // squash and stretch, anchored at the feet
    const sx = 2 - sq, wd = img.width * sx, hg = img.height * sq;
    c.save(); c.translate(Math.round(x + 12), Math.round(y + 28)); c.scale(p.face < 0 ? -1 : 1, 1);
    c.drawImage(img, -wd / 2, -hg, wd, hg); c.restore();
  } else Art.blit(c, img, x, y, p.face < 0);
}

/* ============ Entities ============ */
const ENT = {};
function makeEnt(s) {
  const d = ENT[s.t];
  const e = Object.assign({ vx: 0, vy: 0, t0: 0, dir: -1, flash: 0, dead: false, w: 8, h: 8 }, s);
  e.type = s.t;
  if (d.init) d.init(e);
  return e;
}
function walker(w, e, speed, hold) {
  let ledge = false;
  if (e.onGround) {
    const fx = e.dir > 0 ? e.x + e.w + 1 : e.x - 1;
    ledge = !standable(w, Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T));
  }
  if (ledge) { if (hold) speed = 0; else e.dir = -e.dir; }
  e.vx = e.dir * speed; e.vy = Math.min(e.vy + 0.3, 5);
  moveBody(w, e);
  if (e.hitWall) { if (!hold) e.dir = -e.dir; }
  if (e.y > w.rows * T + 40) e.dead = true;
  const cy = Math.floor((e.y + e.h - 2) / T), cx = Math.floor((e.x + e.w / 2) / T);
  if (tileAt(w, cx, cy) === '~') slay(World, e, 'lava');
}
function slay(w, e, how) {
  if (e.dead) return;
  e.dead = true; Game.stats.foes++;
  const img = e.img || Art.S.goblin[0];
  w.hitstop = Math.max(w.hitstop || 0, 3);
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; w.parts.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, life: 16, col: i % 2 ? '#fff6b0' : '#ffffff', glow: 1, sz: 2 }); }
  w.parts.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: how === 'stomp' ? 0 : rand(-1, 1), vy: how === 'stomp' ? 0 : -3, life: how === 'stomp' ? 22 : 60, img, flipV: how !== 'stomp', squash: how === 'stomp', g: how === 'stomp' ? 0 : 0.25, flip: e.dir < 0 });
  for (let i = 0; i < 8; i++) w.parts.push({ x: e.x + rand(e.w), y: e.y + rand(e.h), vx: rand(-0.8, 0.8), vy: rand(-1.4, -0.2), life: rand(20, 40), col: i % 2 ? '#2a2038' : '#4a3a5a', sz: 2, g: -0.01 });
}
function damageFoe(w, e, n, how) {
  if (e.dead || e.invT > 0) return false;
  e.hp = (e.hp || 1) - n;
  if (e.hp <= 0) { slay(w, e, how); Sound.sfx(how === 'stomp' ? 'stomp' : 'hit'); }
  else { e.flash = 10; e.invT = 14; Sound.sfx('hit'); }
  return true;
}

ENT.goblin = {
  foe: true, stomp: true, arrow: true,
  init(e) { e.w = 12; e.h = 13; e.x -= 6; e.y -= 13; e.img = Art.S.goblin[0]; },
  update(w, e) { walker(w, e, 0.45 * e.manic); e.img = Art.S.goblin[(w.t >> (e.manic > 1 ? 2 : 3)) % 2]; },
  draw(c, w, e, ox, oy) { Art.blit(c, e.img, e.x - ox - 2, e.y - oy - 3, e.dir < 0); }
};
ENT.wolf = {
  foe: true, stomp: true, arrow: true,
  init(e) { e.w = 20; e.h = 12; e.x -= 10; e.y -= 12; e.charge = 0; e.img = Art.S.wolf[0]; },
  update(w, e) {
    const p = nearP(w, e), dx = p.x - e.x, near = Math.abs(dx) < 120 && Math.abs(p.y + p.h - e.y - e.h) < 30 && !p.dead;
    if (near) { if (!e.charge) { Sound.sfx('growl'); e.wait = 18; } e.charge = 50; e.dir = dx > 0 ? 1 : -1; }
    else if (e.charge > 0) e.charge--;
    if (e.wait > 0) { e.wait--; walker(w, e, 0, true); }
    else walker(w, e, (e.charge ? 1.75 : 0.5) * (e.manic > 1 ? 1.12 : 1), e.charge > 0);
    e.img = Art.S.wolf[e.wait > 0 ? 0 : (w.t >> (e.charge ? 2 : 3)) % 2];
  },
  draw(c, w, e, ox, oy) { Art.blit(c, e.img, e.x - ox - 3, e.y - oy - 4, e.dir < 0); }
};
ENT.spider = {
  foe: true, stomp: true, arrow: true,
  init(e) { e.w = 14; e.h = 11; e.ax = e.x; e.ay = e.y; e.x -= 7; e.off = 4; e.st = 0; e.max = (e.len || 4) * T - 14; e.img = Art.S.spider[0]; },
  update(w, e) {
    const p = nearP(w, e);
    if (e.st === 0) { e.off = Math.max(4, e.off - 0.6); if (e.off <= 4 && Math.abs(p.x + 5 - e.ax) < 46 && p.y > e.ay - 8) e.st = 1; }
    else if (e.st === 1) { e.off += 2.4; if (e.off >= e.max) { e.off = e.max; e.st = 2; e.hold = 50; } }
    else if (--e.hold <= 0) e.st = 0;
    e.y = e.ay + e.off;
    e.img = Art.S.spider[(w.t >> 3) % 2];
  },
  draw(c, w, e, ox, oy) {
    R(c, e.ax - ox, e.ay - oy, 1, e.off + 2, 'rgba(230,230,255,0.55)');
    Art.blit(c, e.img, e.x - ox - 2, e.y - oy - 1);
  }
};
ENT.bat = {
  foe: true, stomp: true, arrow: true,
  init(e) { e.w = 12; e.h = 9; e.x -= 6; e.st = 0; e.img = Art.S.bat[2]; e.needAttach = true; },
  update(w, e) {
    if (e.needAttach && e.free) { e.needAttach = false; e.y -= 20; e.st = 1; }
    if (e.needAttach) {
      e.needAttach = false;
      let cy = Math.floor((e.y - 8) / T); const cx = Math.floor((e.x + 6) / T);
      while (cy > 0 && !solidAt(w, cx, cy)) cy--;
      e.y = (cy + 1) * T;
    }
    const p = nearP(w, e), dx = p.x + 5 - (e.x + 6), dy = p.y + 6 - e.y;
    if (e.st === 0) { if (Math.abs(dx) < 110 && dy > -10 && dy < 240) { e.st = 1; e.t0 = 0; } e.img = Art.S.bat[2]; return; }
    e.t0++;
    e.vx = clamp(e.vx + Math.sign(dx) * 0.05, -1.25, 1.25);
    const ty = p.y + 2 + Math.sin(e.t0 * 0.08) * 16;
    e.vy = clamp(e.vy + Math.sign(ty - e.y) * 0.06, -1.2, 1.5);
    e.x += e.vx; e.y += e.vy; e.dir = e.vx > 0 ? 1 : -1;
    e.img = Art.S.bat[(w.t >> 2) % 2];
  },
  draw(c, w, e, ox, oy) { Art.blit(c, e.img, e.x - ox - 3, e.y - oy - 2); }
};
ENT.wraith = {
  foe: true, stomp: false, arrow: true, always: false,
  init(e) { e.w = 12; e.h = 20; e.x -= 6; e.y -= 22; e.by = e.y; e.st = 0; e.hp = 2; e.fade = 0; e.img = Art.S.wraith[0]; },
  update(w, e) {
    const p = nearP(w, e), dx = p.x + 5 - (e.x + 6), dy = p.y - e.y;
    if (e.invT > 0) e.invT--;
    if (e.st === 0) {
      e.y = e.by + Math.sin(w.t * 0.05 + e.x) * 3;
      if (Math.abs(dx) < 74 && Math.abs(dy) < 80) { e.st = 1; Sound.sfx('wraith'); }
      return;
    }
    if (e.fade < 1) { e.fade = Math.min(1, e.fade + 0.025); return; }
    const d = Math.hypot(dx, dy) || 1;
    if (d < 230 && !p.dead) { e.vx = lerp(e.vx, dx / d * 0.55, 0.04); e.vy = lerp(e.vy, dy / d * 0.5, 0.04); }
    else { e.vx *= 0.95; e.vy *= 0.95; }
    e.x += e.vx; e.y += e.vy + Math.sin(w.t * 0.06) * 0.2;
    if (Math.abs(e.vx) > 0.05) e.dir = e.vx > 0 ? 1 : -1;
    e.img = Art.S.wraith[(w.t >> 4) % 2];
  },
  harmless(e) { return e.fade < 1; },
  draw(c, w, e, ox, oy) {
    if (e.st === 0 || e.fade < 1) {
      const a = 1 - e.fade;
      Art.glow(c, e.x - ox + 6, e.y - oy + 10, 9 + Math.sin(w.t * 0.1 + e.x) * 2, '#9fffd0', 0.8 * a);
      R(c, e.x - ox + 5, e.y - oy + 9, 2, 2, `rgba(230,255,240,${a})`);
    }
    if (e.fade > 0) {
      c.save(); c.globalAlpha = e.fade * 0.9;
      Art.blit(c, e.flash > 0 ? Art.flashOf(e.img) : e.img, e.x - ox - 4, e.y - oy - 4, e.dir < 0);
      c.restore();
    }
  },
  lit: true
};
ENT.troll = {
  foe: true, stomp: true, arrow: true,
  init(e) { e.w = 20; e.h = 30; e.x -= 10; e.y -= 30; e.hp = 3; e.img = Art.S.troll[0]; },
  update(w, e) {
    if (e.invT > 0) e.invT--;
    const p = nearP(w, e), dx = p.x - e.x, near = Math.abs(dx) < 90 && Math.abs(p.y + p.h - e.y - e.h) < 40;
    if (near && e.onGround && w.t % 30 === 0) e.dir = dx > 0 ? 1 : -1;
    walker(w, e, near ? 0.6 : 0.3, near);
    e.img = Art.S.troll[(w.t >> 4) % 2];
  },
  draw(c, w, e, ox, oy) { Art.blit(c, e.flash > 0 ? Art.flashOf(e.img) : e.img, e.x - ox - 5, e.y - oy - 4, e.dir < 0); }
};
ENT.ember = {
  foe: true, stomp: false, arrow: false, lit: true, glowCol: '#ff7a20', glowR: 20,
  init(e) { e.jump = e.h; e.w = 8; e.h = 10; e.x -= 4; e.by = e.y - 2; e.y = e.by; e.per = 170; e.t0 = Math.floor((e.ph || 0) * 170); e.up = 0; },
  update(w, e) {
    e.t0++;
    e.warn = e.up === 0 ? Math.max(0, 40 - (e.per - e.t0 % e.per)) : 0;
    if (e.up === 0 && e.t0 % e.per === 0) {
      e.up = 1; e.vy = -Math.sqrt(2 * 0.13 * (e.jump || 7) * T);
      if (Math.abs(e.x - w.player.x) < 220) Sound.sfx('ember');
      for (let i = 0; i < 5; i++) w.parts.push({ x: e.x + 4, y: e.by, vx: rand(-1, 1), vy: rand(-2.5, -1), life: 30, col: '#ffb040', g: 0.12, glow: 1, sz: 2 });
    }
    if (e.up) { e.vy += 0.13; e.y += e.vy; if (e.y >= e.by) { e.y = e.by; e.up = 0; } }
  },
  harmless(e) { return !e.up; },
  draw(c, w, e, ox, oy) {
    if (!e.up) return;
    Art.blit(c, Art.S.ember[(w.t >> 2) % 3], e.x - ox - 2, e.y - oy - 4, false, e.vy > 0);
  }
};

/* ----- items ----- */
ENT.shard = {
  lit: true,
  init(e) { e.w = 9; e.h = 11; e.x -= 4; e.y -= 11; e.by = e.y; },
  update(w, e) {
    e.y = e.by + Math.sin(w.t * 0.08 + e.x * 0.05) * 1.5;
    if (touch(w, e)) { e.dead = true; World.gainShard(e.x + 4, e.y + 5, false, e.n); }
  },
  draw(c, w, e, ox, oy) {
    if (w.theme.dark > 0.3) Art.glow(c, e.x - ox + 4, e.y - oy + 5, 8, '#9ff4ff', 0.35);
    Art.blit(c, Art.S.shard[((w.t + (e.x | 0)) >> 3) % 4], e.x - ox, e.y - oy);
  }
};
ENT.pop = { // shard popping out of a rune block
  lit: true,
  init(e) { e.vy = -4; e.w = 9; e.h = 11; e.x -= 4; },
  update(w, e) { e.vy += 0.3; e.y += e.vy; if (e.vy > 1.5) { e.dead = true; World.sparkle(e.x + 4, e.y + 5, '#bff4ff', 6); } },
  draw(c, w, e, ox, oy) { Art.blit(c, Art.S.shard[(w.t >> 1) % 4], e.x - ox, e.y - oy); }
};
function pickup(kind) {
  return {
    lit: true,
    init(e) { const im = Art.S[kind]; e.img = im.length ? im[0] : im; e.w = e.img.width; e.h = e.img.height; e.x -= e.w / 2; e.rise = 16; e.ty = e.y - e.h; e.y = e.ty + 16; },
    update(w, e) {
      if (e.rise > 0) { e.rise -= 0.5; e.y = e.ty + e.rise; return; }
      e.y = e.ty + Math.sin(w.t * 0.08) * 1.2 - 1;
      if (kind === 'bloom') e.img = Art.S.bloom[(w.t >> 4) % 2];
      const p = touch(w, e);
      if (p) {
        e.dead = true;
        if (kind === 'cake') { if (p.hp < 3) { p.hp++; Sound.sfx('heal'); } else { Sound.sfx('item'); for (let i = 0; i < 5; i++) World.gainShard(e.x + 6, e.y, true); } World.sparkle(e.x + 6, e.y + 5, '#7af0c0', 10); }
        if (kind === 'bloom') { p.radiant = 600; Sound.sfx('power'); World.sparkle(e.x + 7, e.y + 6, '#fff6b0', 18); w.flash = 0.4; }
      }
    },
    draw(c, w, e, ox, oy) {
      const clip = e.rise > 0;
      if (clip) { c.save(); c.beginPath(); c.rect(e.x - ox - 2, e.ty - oy - 4, e.w + 4, e.h + 4); c.clip(); }
      if (!clip) Art.glow(c, e.x - ox + e.w / 2, e.y - oy + e.h / 2, 12, kind === 'cake' ? '#ffe0a0' : '#bff4ff', 0.4);
      Art.blit(c, e.img, e.x - ox, e.y - oy);
      if (clip) c.restore();
    }
  };
}
ENT.cake = pickup('cake'); ENT.bloom = pickup('bloom');

ENT.arrow = {
  lit: true, glowCol: '#bff4ff', glowR: 22,
  init(e) { e.w = 10; e.h = 3; e.x -= 5; e.vx = e.dir * 5.6; e.life = 38; },
  update(w, e) {
    e.x += e.vx; e.life--;
    if (w.t % 2 === 0) w.parts.push({ x: e.x + 5, y: e.y + 1, vx: 0, vy: rand(-0.2, 0.2), life: 12, col: '#9fe8ff', glow: 1, sz: 1 });
    const cx = Math.floor((e.x + (e.dir > 0 ? 10 : 0)) / T), cy = Math.floor((e.y + 1) / T);
    if (e.life <= 0 || solidAt(w, cx, cy)) { e.dead = true; World.sparkle(e.x + 5, e.y + 1, '#bff4ff', 5); return; }
    for (const f of w.ents) {
      const d = ENT[f.type];
      if (!d.foe || f.dead || !overlap(e, f)) continue;
      if (f.type === 'wraith' && f.fade < 1) continue;
      if (f.type === 'boss') { if (bossHit(w, f, 1, e.x + 5, e.y)) { e.dead = true; } else if (f.st !== 'wait' && f.st !== 'dying') { e.dead = true; Sound.sfx('deflect'); World.sparkle(e.x + 5, e.y, '#ffb040', 5); } if (e.dead) return; continue; }
      if (!d.arrow) continue;
      if (damageFoe(w, f, 1, 'arrow')) { if (f.type === 'wraith' && !f.dead) { f.vx = e.dir * 1.6; } }
      e.dead = true; World.sparkle(e.x + 5, e.y + 1, '#bff4ff', 6); return;
    }
  },
  draw(c, w, e, ox, oy) { Art.blit(c, Art.S.arrow, e.x - ox - 1, e.y - oy, e.dir < 0); }
};

/* ----- props ----- */
ENT.plat = {
  init(e) { e.h = 6; e.bx = e.x; e.by = e.y; e.ddx = 0; e.ddy = 0; },
  pre(w, e) {
    const k = 0.5 - 0.5 * Math.cos((w.t / e.per + e.ph) * TAU);
    const nx = Math.round(e.bx + e.dx * k), ny = Math.round(e.by + e.dy * k);
    e.ddx = nx - e.x; e.ddy = ny - e.y; e.x = nx; e.y = ny;
  },
  update() { },
  draw(c, w, e, ox, oy) {
    const img = Art.tileSet(w.colTheme[clamp(Math.floor(e.bx / T), 0, w.cols - 1)]).plat;
    for (let i = 0; i < e.w; i += T) c.drawImage(img, e.x - ox + i, e.y - oy);
    R(c, e.x - ox, e.y - oy, 1, 6, 'rgba(0,0,0,0.35)'); R(c, e.x + e.w - 1 - ox, e.y - oy, 1, 6, 'rgba(0,0,0,0.35)');
    if (w.theme.liquid.glow) Art.glow(c, e.x - ox + e.w / 2, e.y - oy + 8, 16, w.theme.liquid.glow, 0.25);
  }
};
ENT.lantern = {
  lit: true,
  init(e) { e.w = 12; e.h = 26; e.x -= 6; e.y -= 26; e.on = false; },
  update(w, e) {
    if (!e.on && touch(w, e)) {
      e.on = true; World.checkpoint(e.x + 6, e.y + 26); Sound.sfx('lantern'); World.sparkle(e.x + 6, e.y + 4, '#bff4ff', 16); World.toast('Lantern kindled — you will return here if you fall');
    }
  },
  draw(c, w, e, ox, oy) {
    if (e.on) Art.glow(c, e.x - ox + 6, e.y - oy + 5, 13 + Math.sin(w.t * 0.1) * 1.5, '#bff4ff', 0.5);
    Art.blit(c, Art.S.lantern[e.on ? 1 : 0], e.x - ox, e.y - oy);
  },
  light(e) { return e.on ? 62 : 0; }
};
ENT.sign = {
  init(e) { e.w = 14; e.h = 16; e.x -= 7; e.y -= 16; },
  update(w, e) { const p = nearP(w, e); if (Math.abs(p.x + 5 - (e.x + 7)) < 22 && Math.abs(p.y + p.h - (e.y + 16)) < 26) { w.signText = e.text; w.signNear = e; } },
  draw(c, w, e, ox, oy) {
    Art.blit(c, Art.S.tonttu[(w.t >> 5) % 2], e.x - ox, e.y - oy);
    if (w.signNear === e) Art.glow(c, e.x - ox + 7, e.y - oy + 8, 12, '#9ff4ff', 0.5);
  },
  light() { return 22; }
};
ENT.beacon = {
  init(e) { e.w = 40; e.h = 56; e.x -= 20; e.y -= 56; e.on = false; e.fire = 0; },
  update(w, e) {
    const p = nearP(w, e);
    if (!e.on && (!e.final || (!w.bossAlive && Game.gems.kohinoor)) && !p.dead && p.x + p.w > e.x + 2 && p.x < e.x + e.w - 2 && Math.abs(p.y + p.h - (e.y + 56)) < 40) { e.on = true; World.lightBeacon(e); }
    if (e.on) {
      e.fire = Math.min(1, e.fire + 0.012);
      if (Math.abs(e.x - w.cam.x - W / 2) < W) for (let i = 0; i < 2; i++) w.parts.push({ x: e.x + 20 + rand(-7, 7) * e.fire, y: e.y + 2, vx: rand(-0.3, 0.3), vy: rand(-2.6, -0.8) * (0.4 + e.fire), life: rand(18, 44), col: ['#fff6b0', '#ffc040', '#ff7a1a', '#ff4a10'][i + (w.t % 2) * 2 & 3], g: -0.02, glow: 1, sz: 2 + (rand() < 0.4) });
    }
  },
  draw(c, w, e, ox, oy) {
    Art.blit(c, Art.S.beacon, e.x - ox, e.y - oy);
    if (e.on) {
      Art.glow(c, e.x - ox + 20, e.y - oy - 4, 30 + 50 * e.fire + Math.sin(w.t * 0.3) * 4, '#ff9a30', 0.75);
      Backdrop.flame(c, e.x - ox + 20, e.y - oy + 3, w.t, 1 + e.fire);
    }
  },
  light(e) { return 30 + e.fire * 110; }
};

/* ============ The Hoarder King ============ */
ENT.boss = {
  foe: true, stomp: false, arrow: false,
  init(e) { e.w = 22; e.h = 44; e.x -= 11; e.y -= 44; e.hp = 12; e.max = 12; e.st = 'wait'; e.t0 = 0; e.dir = -1; e.last = ''; e.stunDmg = 0; e.p2 = false; },
  update(w, e) {
    const A = w.arena, p = nearP(w, e);
    e.t0++;
    if (e.invT > 0) e.invT--;
    const face = () => { e.dir = p.x + 5 > e.x + 11 ? 1 : -1; };
    const go = (s) => { e.st = s; e.t0 = 0; };
    const p2 = e.p2;
    switch (e.st) {
      case 'wait': return;
      case 'intro':
        if (e.t0 === 30) { Sound.sfx('roar'); w.shake = 20; }
        if (e.t0 > 110) go('idle');
        break;
      case 'idle': {
        face();
        e.vx = e.dir * (p2 ? 0.6 : 0.4);
        if (Math.abs(p.x - e.x) < 64) e.vx = 0;
        e.x = clamp(e.x + e.vx, A.x0 + 4, A.x1 - e.w - 4);
        if (e.t0 > (p2 ? 46 : 74)) {
          const opts = ['slam', 'embers', 'charge'].filter(o => o !== e.last);
          const pick = opts[Math.floor(rand(opts.length))];
          e.last = pick; e.slams = p2 ? 2 : 1; go('tele_' + pick);
          Sound.sfx('warn');
        }
        break;
      }
      case 'tele_slam': if (e.t0 > (p2 ? 30 : 42)) go('slam'); break;
      case 'slam':
        if (e.t0 === 1) {
          Sound.sfx('slam'); w.shake = 14;
          const fx = e.x + 11 + e.dir * 18;
          for (const d of [-1, 1]) w.ents.push(makeEnt({ t: 'wave', x: fx, y: A.floor, dir: d, sp: p2 ? 2.7 : 2.2 }));
          for (let i = 0; i < 12; i++) w.parts.push({ x: fx + rand(-8, 8), y: A.floor, vx: rand(-2, 2), vy: rand(-3, -1), life: 30, col: i % 2 ? '#ff7a20' : '#5a5058', g: 0.15, sz: 2, glow: i % 2 });
        }
        if (e.t0 > 34) { if (--e.slams > 0) { face(); go('tele_slam'); e.t0 = 14; } else { e.stunLen = 105; go('stun'); } }
        break;
      case 'tele_embers': if (e.t0 > (p2 ? 34 : 46)) go('embers'); break;
      case 'embers':
        if (e.t0 === 1) {
          const n = p2 ? 8 : 5, span = A.x1 - A.x0 - 40;
          for (let i = 0; i < n; i++) {
            const tx = i === 0 ? p.x + 5 : i === 1 ? p.x + 5 + p.face * 40 : A.x0 + 20 + rand(span);
            w.ents.push(makeEnt({ t: 'fall', x: clamp(tx, A.x0 + 10, A.x1 - 10), y: A.floor, delay: 20 + i * (p2 ? 11 : 15) }));
          }
        }
        if (e.t0 > 50) { e.stunLen = 80; go('stun'); }
        break;
      case 'tele_charge': face(); if (e.t0 > (p2 ? 32 : 44)) { go('charge'); Sound.sfx('roar'); } break;
      case 'charge': {
        e.x += e.dir * (p2 ? 3.7 : 3.1);
        if (w.t % 3 === 0) w.parts.push({ x: e.x + 11 - e.dir * 10, y: A.floor - 2, vx: -e.dir * rand(1), vy: rand(-1.5, -0.3), life: 24, col: '#ff7a20', g: 0.05, sz: 2, glow: 1 });
        if (e.x <= A.x0 + 2 || e.x + e.w >= A.x1 - 2) {
          e.x = clamp(e.x, A.x0 + 2, A.x1 - e.w - 2);
          Sound.sfx('slam'); w.shake = 18; e.stunLen = 125; go('stun');
          for (let i = 0; i < 3; i++) w.ents.push(makeEnt({ t: 'fall', x: A.x0 + 30 + rand(A.x1 - A.x0 - 60), y: A.floor, delay: 16 + i * 14 }));
        }
        break;
      }
      case 'stun':
        if (e.t0 === 1) e.stunDmg = 0;
        if (e.t0 > e.stunLen || e.stunDmg >= 3) go('recover');
        break;
      case 'recover':
        if (e.t0 === 1 && !e.p2 && e.hp <= e.max / 2) {
          e.p2 = true; Sound.sfx('roar'); w.shake = 24; Sound.setRate(0.88); w.flash = 0.5;
          w.ents.push(makeEnt({ t: 'cake', x: (A.x0 + A.x1) / 2, y: A.floor - 44 }));
          World.toast('The Hoarder’s crown blazes with wrath!');
        }
        if (e.t0 > 26) go('idle');
        break;
      case 'dying':
        if (e.t0 % 7 === 0) { Sound.sfx('bosshit'); w.shake = 8; for (let i = 0; i < 8; i++) w.parts.push({ x: e.x + rand(22), y: e.y + rand(44), vx: rand(-2, 2), vy: rand(-3, 0), life: 40, col: ['#ff7a20', '#ffc040', '#2a2a36'][i % 3], g: 0.08, sz: 2 + (i % 2), glow: i % 3 < 2 }); }
        if (e.t0 === 130) {
          Sound.sfx('shatter'); w.flash = 1; w.shake = 30; e.dead = true;
          for (let i = 0; i < 7; i++) w.ents.push(makeEnt({ t: 'star', x: e.x + 11, y: e.y + 2, i }));
          for (let i = 0; i < 40; i++) { const a = rand(TAU), s = rand(1, 4); w.parts.push({ x: e.x + 11, y: e.y + 20, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(40, 90), col: i % 2 ? '#3a3a4a' : '#ff7a20', g: 0.05, sz: 2, glow: i % 2 }); }
          World.bossDefeated(e.x + 11);
        }
        break;
    }
  },
  vulnerable(e) { return e.st === 'stun' && e.t0 > 4; },
  harmless(e) { return e.st === 'wait' || e.st === 'dying' || e.st === 'intro' || e.st === 'stun' || e.st === 'recover'; },
  draw(c, w, e, ox, oy) { drawBoss(c, w, e, e.x - ox + 11, e.y - oy + 44); },
  light(e) { return e.st === 'wait' ? 30 : 70; }
};
function bossHit(w, e, n, hx, hy) {
  if (!ENT.boss.vulnerable(e) || e.invT > 0) return false;
  e.hp -= n; e.stunDmg += n; e.flash = 10; e.invT = 12; Sound.sfx('bosshit'); w.shake = 8; w.hitstop = 6;
  World.sparkle(hx, hy, '#ffc040', 10);
  if (e.hp <= 0) { e.hp = 0; e.st = 'dying'; e.t0 = 0; Sound.music(null); w.bossAlive = false; World.clearHazards(); }
  return true;
}
function drawBoss(c, w, e, fx, fy) {
  const st = e.st, t = w.t;
  c.save();
  c.translate(Math.round(fx), Math.round(fy));
  if (st === 'dying') c.translate(Math.round(rand(-2, 2)), 0);
  c.scale(e.dir, 1);
  const stun = st === 'stun', kneel = stun ? 6 : 0;
  const lean = st === 'tele_charge' ? -3 : st === 'charge' ? 4 : 0;
  const A = '#2b2b3a', A2 = '#1b1b26', A3 = '#44445a', E = stun ? '#7a3a1a' : (t >> 2) % 2 ? '#ff7a20' : '#ffa040';
  const by = -50 + kneel;
  // cape
  for (let i = 0; i < 34 - kneel; i++) { const sw = Math.sin(i * 0.3 + t * 0.12) * (1 + i * 0.05) + (st === 'charge' ? i * 0.3 : 0); R(c, -13 - i * 0.12 - sw, by + 14 + i, 12, 1, i % 6 < 3 ? '#4a1016' : '#3a0c12'); }
  // legs
  if (stun) { R(c, -8, -10, 7, 10, A2); R(c, 1, -6, 12, 6, A2); R(c, -9, -3, 9, 3, '#0e0e14'); }
  else { const s = st === 'idle' || st === 'charge' ? Math.sin(t * (st === 'charge' ? 0.6 : 0.15)) * 2 : 0; R(c, -8 + s, -14, 7, 12, A2); R(c, 2 - s, -14, 7, 12, A2); R(c, -9 + s, -3, 9, 3, '#0e0e14'); R(c, 1 - s, -3, 9, 3, '#0e0e14'); }
  c.translate(lean, 0);
  // torso
  R(c, -10, by + 15, 20, 22, A); R(c, -8, by + 17, 16, 3, A3); R(c, -10, by + 34, 20, 3, A2); R(c, 6, by + 15, 4, 22, A2);
  R(c, -2, by + 22, 4, 7, E); R(c, -4, by + 24, 8, 3, E);
  // pauldrons
  R(c, -15, by + 12, 9, 7, A3); R(c, -14, by + 8, 2, 4, A3); R(c, -10, by + 9, 2, 3, A3); R(c, 7, by + 12, 9, 7, A3); R(c, 13, by + 8, 2, 4, A3);
  // head
  R(c, -5, by + 2, 11, 12, A2); R(c, -5, by + 2, 2, 12, A); R(c, 0, by + 7, 6, 2, stun ? '#5a2a10' : '#ff5a1a'); R(c, -1, by + 10, 7, 1, '#0a0a10'); R(c, 1, by + 11, 1, 3, '#0a0a10'); R(c, 4, by + 11, 1, 3, '#0a0a10');
  // the Cinder Crown
  R(c, -6, by, 13, 3, '#4a4038'); R(c, -6, by, 13, 1, '#6a5c50');
  const sp = [[-6, 6], [-3, 4], [0, 8], [3, 4], [6, 6]];
  for (const [x, h] of sp) { R(c, x, by - h, 1, h, '#4a4038'); R(c, x, by - h, 1, 2, E); }
  // arm + mace
  let ang = 0.3;
  if (st === 'tele_slam') ang = -2.2 - Math.sin(e.t0 * 0.5) * 0.08;
  else if (st === 'slam') ang = 1.5;
  else if (st === 'tele_embers' || st === 'embers') ang = -2.9;
  else if (st === 'tele_charge' || st === 'charge') ang = 1.1;
  else if (stun) ang = 1.75;
  else if (st === 'intro') ang = -2.6;
  c.save(); c.translate(9, by + 17); c.rotate(ang);
  R(c, -2, -2, 5, 13, A); R(c, -1, 10, 3, 3, '#1b1b26');
  R(c, 0, 8, 2, 26, '#5a4a3a'); R(c, -3, 30, 8, 8, '#55556a'); R(c, -3, 30, 8, 2, '#77778e'); R(c, -5, 33, 2, 2, '#55556a'); R(c, 5, 33, 2, 2, '#55556a'); R(c, 0, 38, 2, 2, '#55556a'); R(c, 0, 33, 2, 2, E);
  c.restore();
  R(c, -13, by + 18, 4, 12, A); R(c, -13, by + 30, 4, 3, A2);
  c.restore();
  if (e.flash > 0) { Art.glow(c, fx, fy - 26, 34, '#ffffff', 0.7); }
  if (!stun && st !== 'wait' && st !== 'dying') Art.glow(c, fx + e.dir * lean, fy - 54 + kneel, 16 + Math.sin(t * 0.2) * 3, '#ff6a20', 0.75);
  if (st === 'tele_embers' || st === 'embers') Art.glow(c, fx, fy - 60, 30, '#ff4a10', 0.8);
  if (stun && (t >> 3) % 2) { for (let i = 0; i < 3; i++) { const a = t * 0.1 + i * 2.1; R(c, fx + Math.cos(a) * 10, fy - 52 + Math.sin(a) * 3, 2, 2, '#fff6b0'); } }
}
ENT.wave = {
  foe: true, lit: true, glowCol: '#ff7a20', glowR: 18,
  init(e) { e.w = 10; e.h = 12; e.x -= 5; e.y -= 12; },
  update(w, e) {
    e.x += e.dir * e.sp;
    if (w.t % 2 === 0) w.parts.push({ x: e.x + 5, y: e.y + 10, vx: -e.dir * 0.5, vy: rand(-1.5, -0.5), life: 16, col: '#ffb040', glow: 1, sz: 2 });
    if (e.x < w.arena.x0 || e.x + e.w > w.arena.x1) e.dead = true;
  },
  draw(c, w, e, ox, oy) {
    const x = e.x - ox, y = e.y - oy, f = (w.t >> 1) % 2;
    R(c, x + 1, y + 4 - f, 8, 8 + f, '#ff6a10'); R(c, x + 3, y - f * 2, 4, 6, '#ff9a2a'); R(c, x + 3, y + 5, 4, 7, '#ffe890'); R(c, x + (e.dir > 0 ? 7 : 1), y + 1, 2, 4, '#ffc040');
  }
};
ENT.fall = {
  foe: true, lit: true, glowCol: '#ff7a20', glowR: 18,
  init(e) { e.w = 8; e.h = 10; e.x -= 4; e.fy = e.y; e.y = -999; e.started = false; },
  update(w, e) {
    if (e.delay > 0) { e.delay--; if (e.delay === 0) { e.y = w.cam.y - 14; e.started = true; e.vy = 2.3; Sound.sfx('ember'); } return; }
    e.vy = Math.min(e.vy + 0.06, 3.6); e.y += e.vy;
    if (w.t % 2 === 0) w.parts.push({ x: e.x + 4, y: e.y, vx: rand(-0.3, 0.3), vy: -0.5, life: 14, col: '#ff7a20', glow: 1, sz: 2 });
    if (e.y + e.h >= e.fy) {
      e.dead = true;
      for (let i = 0; i < 8; i++) w.parts.push({ x: e.x + 4, y: e.fy - 2, vx: rand(-1.6, 1.6), vy: rand(-2.4, -0.6), life: 24, col: i % 2 ? '#ffc040' : '#ff6a10', g: 0.14, glow: 1, sz: 2 });
    }
  },
  harmless(e) { return !e.started; },
  draw(c, w, e, ox, oy) {
    const pulse = 0.4 + 0.3 * Math.sin(w.t * 0.5);
    R(c, e.x - ox - 3, e.fy - oy - 1, 14, 1, `rgba(255,120,40,${pulse})`);
    Art.glow(c, e.x - ox + 4, e.fy - oy, 10, '#ff5a10', pulse);
    if (e.started) Art.blit(c, Art.S.ember[(w.t >> 2) % 3], e.x - ox - 2, e.y - oy - 4, false, true);
  }
};
ENT.star = { // the seven stars, freed
  lit: true, glowCol: '#bff4ff', glowR: 40,
  init(e) { e.w = 4; e.h = 4; const a = -Math.PI / 2 + (e.i - 3) * 0.32; e.vx = Math.cos(a) * 1.4; e.vy = Math.sin(a) * 2.2; },
  update(w, e) {
    e.t0++; e.vx *= 0.985; e.vy = lerp(e.vy, -1.1, 0.02); e.x += e.vx; e.y += e.vy;
    if (e.t0 === 10 + e.i * 9) Sound.sfx('star');
    if (w.t % 2 === 0) w.parts.push({ x: e.x + 2, y: e.y + 2, vx: rand(-0.2, 0.2), vy: rand(0.2, 0.8), life: 30, col: '#bff4ff', glow: 1, sz: 1 });
    if (e.y < w.cam.y - 40) e.dead = true;
  },
  draw(c, w, e, ox, oy) {
    const x = e.x - ox + 2, y = e.y - oy + 2;
    Art.glow(c, x, y, 14, '#ffffff', 0.9);
    R(c, x - 1, y - 4, 2, 8, '#fff'); R(c, x - 4, y - 1, 8, 2, '#fff'); R(c, x - 2, y - 2, 4, 4, '#dffbff');
  }
};

/* ----- the twelve diamonds ----- */
ENT.gem = {
  lit: true,
  init(e) { e.def = GEM_BY_ID[e.gem]; e.img = Art.gemSprite(e.def); e.w = e.img.width; e.h = e.img.height; e.x -= e.w / 2; e.y -= e.h + 4; e.by = e.y; },
  update(w, e) {
    e.y = e.by + Math.sin(w.t * 0.05) * 2.5;
    if (w.t % 9 === 0) w.parts.push({ x: e.x + rand(e.w), y: e.y + rand(e.h), vx: 0, vy: -0.25, life: 26, col: w.t % 18 ? '#ffffff' : e.def.tint, glow: 1, sz: 1 });
    if (touch(w, e)) { e.dead = true; World.gainGem(e); }
  },
  draw(c, w, e, ox, oy) {
    const x = e.x - ox + e.w / 2, y = e.y - oy + e.h / 2, r = e.w * 0.9 + 6;
    Art.glow(c, x, y, r + Math.sin(w.t * 0.08) * 3, e.def.tint, 0.55);
    for (let i = 0; i < 4; i++) { const a = w.t * 0.03 + i * TAU / 4, d = e.w * 0.75 + 4; R(c, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, 1, 1, '#ffffff'); }
    Art.blit(c, e.img, e.x - ox, e.y - oy);
    const k = (w.t + e.def.n * 13) % 70;
    if (k < 8) { const sx = e.x - ox + 2 + (k > 3 ? 1 : 0), sy = e.y - oy + 1; R(c, sx - 2, sy, 5, 1, '#fff'); R(c, sx, sy - 2, 1, 5, '#fff'); }
  },
  light(e) { return 34 + e.def.n * 2; }
};
/* ----- Sam, met in America ----- */
ENT.boy = {
  init(e) { e.w = 10; e.h = 22; e.x -= 5; e.y -= 22; },
  update(w, e) {
    if (Game.coop) return;
    const p = nearP(w, e), near = Math.abs(p.x - e.x) < 34 && Math.abs(p.y - e.y) < 30;
    e.dir = p.x < e.x ? -1 : 1;
    if (near) {
      if (!Game.metBoy) { Game.metBoy = true; Sound.sfx('oneup'); World.sparkle(e.x + 5, e.y + 6, '#ffd070', 14); Game.save(); }
      w.signText = 'Sam: “You came all the way from Finland? I dig for diamonds here.|Let’s go together!”' + (Input.touch ? '' : '   ·   Player 2 — press [2] to join'); w.signNear = e;
    }
  },
  draw(c, w, e, ox, oy) {
    if (Game.coop) return;
    Art.blit(c, Art.S.boy.idle[(w.t >> 5) % 2], e.x - ox + 5 - 12, e.y - oy + 22 - 28, e.dir < 0);
    if (!Game.metBoy && (w.t >> 4) % 2) { R(c, e.x - ox + 4, e.y - oy - 12, 2, 5, '#ffd070'); R(c, e.x - ox + 4, e.y - oy - 5, 2, 2, '#ffd070'); }
  },
  light() { return 40; }
};
