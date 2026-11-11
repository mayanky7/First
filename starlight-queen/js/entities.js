'use strict';
/* Starlight Queen — Ana, the creatures of the road, items, diamonds, the Hoarder King, and Mayank at the end of it */

const SOLID = { '#': 1, 'B': 1, '?': 1, 'H': 1, 'S': 1, 'G': 1, 'U': 1, 'X': 1, 'D': 1 };
function moonOn(w, cx, cy) { return w.moon[cx + cy * w.cols] > 0; } // a bridge of light, there only while starlight has touched it
function tileAt(w, cx, cy) { if (cy < 0 || cy >= w.rows || cx < 0 || cx >= w.cols) return '.'; return w.grid[cy][cx]; }
function solidAt(w, cx, cy) { if (cx < 0 || cx >= w.cols) return true; return !!SOLID[tileAt(w, cx, cy)]; }
function standable(w, cx, cy) { const ch = tileAt(w, cx, cy); return !!SOLID[ch] || ch === '=' || (ch === 'M' && moonOn(w, cx, cy)); }
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
      if (SOLID[ch] || ((ch === '=' || (ch === 'M' && moonOn(w, cx, y1))) && oldBottom <= y1 * T + 0.01 && !(e.drop > 0))) { e.y = y1 * T - e.h; e.vy = 0; e.onGround = true; break; }
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
  return f(n) || f(n + '2'); // either hand may steer her
}
function nearP(w, e) {
  let best = w.player, bd = 1e9;
  for (const p of w.players) { if (p.dead) continue; const d = Math.abs(p.x - e.x) + Math.abs(p.y - e.y) * 0.5; if (d < bd) { bd = d; best = p; } }
  return best;
}
function touch(w, e) { for (const p of w.players) if (!p.dead && overlap(e, p)) return p; return null; }
const MAXHP = 5;
function makePlayer(x, y, id) {
  return {
    id: id || 0,
    x: x - 5, y: y - 22, w: 10, h: 22, vx: 0, vy: 0, face: 1, onGround: false, coy: 0, jbuf: 0, jumping: false,
    gliding: false, glide: 0, drop: 0, hp: MAXHP, inv: 0, hurtT: 0, radiant: 0, arrows: 3, arrowT: 0, shootT: 0,
    anim: 0, dead: 0, ride: null, control: true, stepT: 0, lum: 100, lit: false, lumOut: false, cloak: false, cloakT: 0
  };
}
const GLIDE_MAX = 44;
function updatePlayer(w, p) {
  if (p.dead) { p.dead++; return; }
  if (p.ride) { p.x += p.ride.ddx; p.y += p.ride.ddy; }
  const ctl = p.control && p.hurtT <= 0;
  const ax = ctl ? (act(p, 'right') ? 1 : 0) - (act(p, 'left') ? 1 : 0) : (p.auto || 0);
  const maxv = p.radiant > 0 ? 2.35 : 2.0;
  // the cloak: held still and low, she is a stone by the road, and unseeing things pass her by
  p.cloakT = ctl && act(p, 'down') && p.onGround && !ax && !act(p, 'jump') ? p.cloakT + 1 : 0;
  const wasCloak = p.cloak; p.cloak = p.cloakT > 7;
  if (p.cloak && !wasCloak) { Sound.sfx('cloak'); World.dust(p.x + 5, p.y + p.h, 5, true); }
  if (p.cloak) p.vx = 0;
  // the lantern: starlight, raised
  if (p.lumOut && p.lum > 30) p.lumOut = false;
  const lightNow = ctl && act(p, 'light') && !p.lumOut && !p.cloak;
  if (lightNow && !p.lit) Sound.sfx('light');
  p.lit = lightNow;
  if (p.lit) { p.lum -= 0.4; if (p.lum <= 0) { p.lum = 0; p.lit = false; p.lumOut = true; Sound.sfx('empty'); } if (w.t % 3 === 0) World.spark(p.x + 5 + rand(-14, 14), p.y - 6 + rand(-10, 10), w.t % 2 ? '#ffffff' : '#bff4ff', 1); }
  else p.lum = Math.min(100, p.lum + 0.17);
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
    p.jbuf = 0; p.coy = 0; p.onGround = false; if (p.ride) p.carry = p.ride.ddx; p.ride = null;
  } else if (jHit && !p.onGround && p.glide > 0) { p.gliding = true; Sound.sfx('glide'); }
  if (p.jumping && p.vy < 0 && !jHeld) { p.vy *= 0.45; p.jumping = false; }
  if (p.vy >= 0) p.jumping = false;
  if (!jHeld || p.glide <= 0 || p.onGround) p.gliding = false;
  p.vy += p.vy < 0 ? 0.22 : 0.32;
  if (p.gliding && p.vy > 0) { p.vy = Math.min(p.vy, 0.7); p.glide--; if (w.t % 4 === 0) World.spark(p.x + 5 - p.face * 8, p.y + 12, '#9fd8ff', 1); }
  p.vy = Math.min(p.vy, 5.5);
  if (p.drop > 0) p.drop--;

  const wasGround = p.onGround, prevBottom = p.y + p.h, fallV = p.vy, wasRide = p.ride, cv = p.carry || 0;
  p.vx += cv; moveBody(w, p); if (p.hitWall) p.carry = 0; else p.vx -= cv; // a leap from a moving raft keeps the raft's going
  p.x = clamp(p.x, w.minX, w.maxX - p.w);
  // moving platforms
  p.ride = null;
  if (p.vy >= 0 && !(p.drop > 0)) for (const pl of w.plats) {
    if (p.x + p.w > pl.x && p.x < pl.x + pl.w && prevBottom <= pl.y - pl.ddy + 4 && p.y + p.h >= pl.y) {
      p.y = pl.y - p.h; p.vy = 0; p.onGround = true; p.ride = pl; break;
    }
  }
  if (wasRide && !p.ride && !p.onGround && !p.carry) p.carry = wasRide.ddx;
  if (p.onGround) p.carry = 0;
  if (p.onGround && !wasGround && fallV > 2.5) { World.dust(p.x + 5, p.y + p.h, 6, true); p.sq = 0.78; Sound.sfx('land'); if (fallV > 4.6) w.shake = Math.max(w.shake, 2.5); }
  p.sq = p.sq ? 1 + (p.sq - 1) * 0.8 : 1;
  if (p.onGround && Math.abs(p.vx) > 1) { p.stepT += Math.abs(p.vx); if (p.stepT > 24) { p.stepT = 0; World.dust(p.x + 5 - p.face * 3, p.y + p.h, 1); Sound.sfx('step'); } }
  if ((p.gliding || p.radiant > 0) && w.t % 2 === 0) w.parts.push({ x: p.x + 5 - p.face * 7 + rand(-2, 2), y: p.y + 9 + rand(-4, 4), vx: -p.face * 0.3, vy: 0.1, life: 22, max: 22, col: p.radiant > 0 ? '#fff6b0' : '#d8463c', sz: 1.6 });
  if (p.hitCeil) World.bump(p.hitCeil.cx, p.hitCeil.cy);

  // shoot
  if (p.arrows < 3) { p.arrowT++; if (p.arrowT >= 48) { p.arrows++; p.arrowT = 0; } }
  const fireNow = ctl && !p.cloak && (act(p, 'fire', true) || p.fireBuf); p.fireBuf = false;
  if (fireNow) {
    if (p.arrows > 0) {
      p.arrows--; p.shootT = 14;
      w.ents.push(makeEnt({ t: 'arrow', x: p.x + 5 + p.face * 9, y: p.y + 10, dir: p.face }));
      p.vx -= p.face * 0.7; w.parts.push({ x: p.x + 5 + p.face * 12, y: p.y + 11, vx: 0, vy: 0, life: 3, col: '#ffffff', glow: 1, sz: 6 }, { x: p.x + 5 + p.face * 12, y: p.y + 11, vx: 0, vy: 0, life: 5, col: '#bff4ff', glow: 1, sz: 3 });
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
    if (ch === '~' && p.y + p.h > cy * T + 7) { liftPlayer(w, p); return; }
    if (ch === '^' && p.y + p.h > cy * T + 8) { if (hurtPlayer(w, p, 0)) p.vy = -4.2; }
  }
  if (p.y > w.rows * T + 24) { liftPlayer(w, p); return; }
  // the last sure footing: where starlight will set her down again if she falls
  if (p.onGround && !p.ride && p.hurtT <= 0 && w.t % 3 === 0) {
    const cy = Math.floor((p.y + p.h + 1) / T), a = Math.floor((p.x + 1) / T), b = Math.floor((p.x + p.w - 1) / T);
    if (tileAt(w, a, cy) === '#' && tileAt(w, b, cy) === '#' && tileAt(w, a, cy - 1) !== '^' && tileAt(w, b, cy - 1) !== '^') p.safe = { x: p.x, y: p.y };
  }
}
// A fall is not a death on this road: the light lifts her out and sets her back where she last stood.
function liftPlayer(w, p) {
  if (p.dead || w.state !== 'play') return;
  const s = p.safe || { x: w.spawn.x - 5, y: w.spawn.y - p.h };
  for (let i = 0; i < 12; i++) w.parts.push({ x: p.x + 5 + rand(-6, 6), y: Math.min(p.y + 10, w.cam.y + H + 4), vx: rand(-0.6, 0.6), vy: rand(-3.4, -1.2), life: rand(24, 44), col: i % 2 ? '#bff4ff' : '#ffffff', glow: 1, sz: 1 + (i % 2) });
  p.x = s.x; p.y = s.y; p.vx = p.vy = 0; p.gliding = false; p.ride = null; p.drop = 0; p.inv = Math.max(p.inv, 100); p.sq = 1.3; p.onGround = true;
  Sound.sfx('lift'); World.ring(p.x + 5, p.y + 11, 34, 5, 16, '#bff4ff'); World.sparkle(p.x + 5, p.y + 8, '#bff4ff', 18);
  if (!Game.seen.lift) { Game.seen.lift = 1; World.toast('Starlight sets her back on the road.'); }
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
  w.hitstop = 7; w.hurtFx = 16; p.inv = 130; p.hurtT = 22;
  for (let i = 0; i < 8; i++) { const a = rand(TAU); w.parts.push({ x: p.x + 5, y: p.y + 10, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2 - 0.5, life: 18, col: i % 2 ? '#ff5a6a' : '#ffffff', sz: 2, g: 0.1 }); } p.vy = -3.2; p.vx = (fromX ? Math.sign(p.x + 5 - fromX) || -p.face : -p.face) * 2.2;
  p.gliding = false; p.ride = null;
  Sound.sfx('hurt'); w.shake = 8;
  return true;
}
function killPlayer(w, p, pit) {
  if (p.dead || w.state !== 'play') return;
  if (w.god && !pit) return;
  p.dead = 1; p.hp = 0; Sound.sfx('die'); w.shake = 10; Game.stats.deaths++;
  if (w.players.every(q => q.dead)) Sound.duck(true);
  w.hitstop = 8;
  for (let i = 0; i < 26; i++) { const a = rand(TAU), s = rand(0.5, 2.6); w.parts.push({ x: p.x + 5, y: p.y + 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: rand(40, 80), col: i % 2 ? '#bff4ff' : '#fff6b0', g: -0.01, glow: 1, sz: 1 + (i % 2) }); }
}
function drawPlayer(c, w, p, ox, oy) {
  if (p.dead) return;
  if (p.inv > 0 && p.hurtT <= 0 && (p.inv >> 3) % 2) return;
  const x = p.x - ox + 5, y = p.y - oy + p.h;
  if (p.cloak) { // under the cloak she is a stone by the road, in the colours of the ground she kneels on
    const L = Paint.LOOK[w.theme.id] || Paint.LOOK.north;
    c.fillStyle = Paint.vgrad(c, y - 12, y, [mix(L.ground[0], L.ridge[2], 0.5), L.ground[0]]);
    c.beginPath(); c.moveTo(x - 8.5, y + 0.4); c.quadraticCurveTo(x - 8, y - 8, x - 1.5, y - 11.5); c.quadraticCurveTo(x + 6, y - 12, x + 8.5, y + 0.4); c.closePath(); c.fill();
    c.fillStyle = L.capCol; c.globalAlpha = L.cap === 'snow' ? 0.95 : 0.5; c.beginPath(); c.moveTo(x - 6.4, y - 6.6); c.quadraticCurveTo(x - 3, y - 11.4, x + 1, y - 11.9); c.quadraticCurveTo(x + 4.4, y - 11.4, x + 6, y - 8.4); c.quadraticCurveTo(x + 1, y - 10.6, x - 6.4, y - 6.6); c.fill(); c.globalAlpha = 1;
    if ((w.t >> 4) % 4 === 0) Paint.disc(c, x + ((w.t >> 6) % 3), y - 9, 0.5, '#ffffff');
    return;
  }
  if (p.lit) { // starlight, come down into her raised hand
    const sx = x + p.face * 4.6, sy = y - 24.5 + Math.sin(w.t * 0.12) * 0.8, k = 0.75 + 0.25 * Math.sin(w.t * 0.2);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = '#bfe4ff';
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + w.t * 0.012, len = 46 + (i % 3) * 22, wd = 0.03 + (i % 2) * 0.025; c.globalAlpha = 0.08 * k; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a - wd) * len, sy + Math.sin(a - wd) * len); c.lineTo(sx + Math.cos(a + wd) * len, sy + Math.sin(a + wd) * len); c.fill(); }
    c.restore();
    Paint.soft(c, sx, sy, 22 + k * 6, '#dff2ff', 0.7);
    Paint.star4(c, sx, sy, 4.2 + k, '#ffffff', w.t * 0.02);
  }
  if (p.radiant > 0 && (p.radiant > 90 || (p.radiant >> 2) % 2)) Paint.soft(c, x, y - 11, 26 + Math.sin(w.t * 0.3) * 3, '#fff6b0', 0.6);
  Paint.figure(c, x, y, { face: p.face, speed: p.onGround ? clamp(Math.abs(p.vx) / 2, 0, 1) : clamp(Math.abs(p.vx) / 2, 0, 1), ph: p.anim * TAU / 6, inAir: !p.onGround, air: p.vy, glide: p.gliding, hurt: p.hurtT > 0, shoot: p.shootT > 0, raise: p.lit, t: w.t, sq: p.sq || 1, crown: Game.bossDown && !!Game.gems.kohinoor });
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
// each land has its own creatures: the same habits, a different animal
function walker(w, e, speed, hold) {
  for (const q of w.players) if (q.lit && !q.dead && Math.abs(q.x - e.x) < 84 && Math.abs(q.y - e.y) < 60) { e.dir = e.x + e.w / 2 > q.x + 5 ? 1 : -1; speed = Math.max(speed, 0.7); hold = true; e.shy = 8; } // they shy from a raised light
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
  if (how !== 'lava' && how !== 'radiant') w.hitstop = Math.max(w.hitstop || 0, 3);
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; w.parts.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, life: 16, col: i % 2 ? '#fff6b0' : '#ffffff', glow: 1, sz: 2 }); }
  if (ENT[e.type].paint) { const stomp = how === 'stomp', kind = e.type, land = e.sk, dir = e.dir, mid = kind === 'bat' || kind === 'spider', hh = e.h, life = stomp ? 22 : 60;
    w.parts.push({ x: e.x + e.w / 2, y: e.y + (mid ? e.h / 2 : e.h), vx: stomp ? 0 : rand(-1, 1), vy: stomp ? 0 : -3, life, max: life, g: stomp ? 0 : 0.25, draw(c, x, y, q) {
      const k = 1 - q.life / q.max; c.save(); c.translate(x, y); c.globalAlpha = Math.min(1, q.life / 10);
      if (stomp) c.scale(1 + 0.7 * Math.min(1, k * 4), Math.max(0.18, 1 - 0.8 * Math.min(1, k * 4))); else { c.translate(0, mid ? 0 : -hh / 2); c.rotate(k * 5 * dir); c.translate(0, mid ? 0 : hh / 2); }
      Paint.creature(c, kind, land, 0, 0, 0, { dir, flash: q.life > q.max - 5 }); c.restore();
    } }); }
  for (let i = 0; i < 8; i++) w.parts.push({ x: e.x + rand(e.w), y: e.y + rand(e.h), vx: rand(-0.8, 0.8), vy: rand(-1.4, -0.2), life: rand(20, 40), col: i % 2 ? '#2a2038' : '#4a3a5a', sz: 2, g: -0.01 });
}
function damageFoe(w, e, n, how) {
  if (e.dead || e.invT > 0) return false;
  e.hp = (e.hp || 1) - n;
  if (e.hp <= 0) { slay(w, e, how); Sound.sfx(how === 'stomp' ? 'stomp' : 'hit'); }
  else { e.flash = 10; e.invT = 14; Sound.sfx('hit'); }
  if (how === 'arrow') { e.flash = Math.max(e.flash, 4); w.parts.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: 0, vy: 0, life: 4, col: '#ffffff', glow: 1, sz: 7 }); }
  return true;
}

ENT.goblin = {
  foe: true, stomp: true, arrow: true,
  paint: true,
  init(e) { e.w = 12; e.h = 13; e.x -= 6; e.y -= 13; },
  update(w, e) { walker(w, e, 0.45 * e.manic); },
  draw(c, w, e, ox, oy) { Paint.creature(c, 'goblin', e.sk, e.x - ox + 6, e.y - oy + 13, w.t * (e.manic > 1 ? 1.5 : 1) + e.x * 0.1, { dir: e.dir, flash: e.flash > 0 }); }
};
ENT.wolf = {
  foe: true, stomp: true, arrow: true,
  init(e) { e.w = 20; e.h = 12; e.x -= 10; e.y -= 12; e.charge = 0; },
  update(w, e) {
    const p = nearP(w, e), dx = p.x - e.x, near = Math.abs(dx) < 120 && Math.abs(p.y + p.h - e.y - e.h) < 30 && !p.dead && !p.cloak;
    if (near) { if (!e.charge) { Sound.sfx('growl'); e.wait = 18; } e.charge = 50; e.dir = dx > 0 ? 1 : -1; }
    else if (e.charge > 0) e.charge--;
    if (e.wait > 0) { e.wait--; walker(w, e, 0, true); }
    else walker(w, e, (e.charge ? 1.75 : 0.5) * (e.manic > 1 ? 1.12 : 1), e.charge > 0);
  },
  paint: true,
  draw(c, w, e, ox, oy) { Paint.creature(c, 'wolf', e.sk, e.x - ox + 10, e.y - oy + 12, w.t, { dir: e.dir, flash: e.flash > 0, fast: e.charge > 0, still: e.wait > 0 }); }
};
ENT.spider = {
  foe: true, stomp: true, arrow: true,
  init(e) { e.w = 14; e.h = 11; e.ax = e.x; e.ay = e.y; e.x -= 7; e.off = 4; e.st = 0; e.max = (e.len || 4) * T - 14; },
  update(w, e) {
    const p = nearP(w, e);
    if (e.st === 0) { e.off = Math.max(4, e.off - 0.6); if (e.off <= 4 && Math.abs(p.x + 5 - e.ax) < 46 && p.y > e.ay - 8 && !p.cloak) e.st = 1; }
    else if (e.st === 1) { e.off += 2.4; if (e.off >= e.max) { e.off = e.max; e.st = 2; e.hold = 50; } }
    else if (--e.hold <= 0) e.st = 0;
    e.y = e.ay + e.off;
  },
  paint: true,
  draw(c, w, e, ox, oy) {
    c.strokeStyle = 'rgba(230,236,255,0.5)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(e.ax - ox, e.ay - oy); c.lineTo(e.ax - ox, e.y - oy + 3); c.stroke();
    Paint.creature(c, 'spider', e.sk, e.x - ox + 7, e.y - oy + 5, w.t, { dir: 1, flash: e.flash > 0 });
  }
};
ENT.bat = {
  foe: true, stomp: true, arrow: true,
  init(e) { e.w = 12; e.h = 9; e.x -= 6; e.st = 0; e.needAttach = true; },
  update(w, e) {
    if (e.needAttach && e.free) { e.needAttach = false; e.y -= 20; e.st = 1; }
    if (e.needAttach) {
      e.needAttach = false;
      let cy = Math.floor((e.y - 8) / T); const cx = Math.floor((e.x + 6) / T);
      while (cy > 0 && !solidAt(w, cx, cy)) cy--;
      e.y = (cy + 1) * T;
    }
    const p = nearP(w, e), dx = p.x + 5 - (e.x + 6), dy = p.y + 6 - e.y;
    if (e.st === 0) { if (Math.abs(dx) < 110 && dy > -10 && dy < 240 && !p.cloak) { e.st = 1; e.t0 = 0; } return; }
    e.t0++;
    e.vx = clamp(e.vx + Math.sign(dx) * 0.05, -1.25, 1.25);
    const ty = p.y + 2 + Math.sin(e.t0 * 0.08) * 16;
    e.vy = clamp(e.vy + Math.sign(ty - e.y) * 0.06, -1.2, 1.5);
    e.x += e.vx; e.y += e.vy; e.dir = e.vx > 0 ? 1 : -1;
  },
  paint: true,
  draw(c, w, e, ox, oy) { Paint.creature(c, 'bat', e.sk, e.x - ox + 6, e.y - oy + 4.5, w.t + e.x, { dir: e.dir, flash: e.flash > 0, st: e.st }); }
};
ENT.wraith = {
  foe: true, stomp: false, arrow: true, always: false,
  init(e) { e.w = 12; e.h = 20; e.x -= 6; e.y -= 22; e.by = e.y; e.st = 0; e.hp = 2; e.fade = 0; },
  update(w, e) {
    const p = nearP(w, e), dx = p.x + 5 - (e.x + 6), dy = p.y - e.y;
    if (e.invT > 0) e.invT--;
    if (e.st === 0) {
      e.y = e.by + Math.sin(w.t * 0.05 + e.x) * 3;
      if (Math.abs(dx) < 74 && Math.abs(dy) < 80 && !p.cloak) { e.st = 1; Sound.sfx('wraith'); }
      return;
    }
    if (e.st > 0) { // raised starlight undoes them
      let lit = false; for (const q of w.players) if (q.lit && !q.dead && Math.hypot(q.x + 5 - (e.x + 6), q.y + 8 - (e.y + 10)) < 78) { lit = true; e.vx = Math.sign(e.x - q.x) * 0.9; e.vy = -0.2; }
      if (lit) { e.burn = (e.burn || 0) + 1; e.flash = 2; if (w.t % 2 === 0) w.parts.push({ x: e.x + rand(12), y: e.y + rand(20), vx: rand(-0.4, 0.4), vy: rand(-1.2, -0.3), life: 20, col: '#dff2ff', glow: 1, sz: 1 }); if (e.burn > 34) { slay(w, e, 'radiant'); Sound.sfx('wraith'); World.ring(e.x + 6, e.y + 10, 4, 40, 16, '#dff2ff'); return; } }
      else if (e.burn > 0) e.burn--;
    }
    if (e.fade < 1) { e.fade = Math.min(1, e.fade + 0.025); return; }
    const d = Math.hypot(dx, dy) || 1;
    if (d < 230 && !p.dead) { e.vx = lerp(e.vx, dx / d * 0.55, 0.04); e.vy = lerp(e.vy, dy / d * 0.5, 0.04); }
    else { e.vx *= 0.95; e.vy *= 0.95; }
    e.x += e.vx; e.y += e.vy + Math.sin(w.t * 0.06) * 0.2;
    if (Math.abs(e.vx) > 0.05) e.dir = e.vx > 0 ? 1 : -1;
  },
  harmless(e) { return e.fade < 1; },
  draw(c, w, e, ox, oy) {
    if (e.st === 0 || e.fade < 1) {
      const a = 1 - e.fade;
      Paint.soft(c, e.x - ox + 6, e.y - oy + 10, 9 + Math.sin(w.t * 0.1 + e.x) * 2, '#9fffd0', 0.7 * a);
      c.globalAlpha = a; Paint.disc(c, e.x - ox + 6, e.y - oy + 10, 0.9, '#e6fff0'); c.globalAlpha = 1;
    }
    if (e.fade > 0) { Paint.soft(c, e.x - ox + 6, e.y - oy + 8, 16, '#9fffd0', 0.25 * e.fade); Paint.wraith(c, e.x - ox + 6, e.y - oy + 10, w.t + e.x, e.fade * 0.9, e.flash > 0, e.dir); }
  },
  lit: true
};
ENT.troll = {
  foe: true, stomp: true, arrow: true,
  init(e) { e.w = 20; e.h = 30; e.x -= 10; e.y -= 30; e.hp = 3; },
  update(w, e) {
    if (e.invT > 0) e.invT--;
    const p = nearP(w, e), dx = p.x - e.x, near = Math.abs(dx) < 90 && Math.abs(p.y + p.h - e.y - e.h) < 40 && !p.cloak;
    if (near && e.onGround && w.t % 30 === 0) e.dir = dx > 0 ? 1 : -1;
    walker(w, e, near ? 0.6 : 0.3, near);
  },
  paint: true,
  draw(c, w, e, ox, oy) { Paint.creature(c, 'troll', e.sk, e.x - ox + 10, e.y - oy + 30, w.t, { dir: e.dir, flash: e.flash > 0 }); }
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
    Paint.emberDrop(c, e.x - ox + 4, e.y - oy + 5, w.t, e.vy > 0);
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
    Paint.shard(c, e.x - ox + 4.5, e.y - oy + 5.5, w.t, e.x * 0.07);
  }
};
ENT.pop = { // shard popping out of a rune block
  lit: true,
  init(e) { e.vy = -4; e.w = 9; e.h = 11; e.x -= 4; },
  update(w, e) { e.vy += 0.3; e.y += e.vy; if (e.vy > 1.5) { e.dead = true; World.sparkle(e.x + 4, e.y + 5, '#bff4ff', 6); } },
  draw(c, w, e, ox, oy) { Paint.shard(c, e.x - ox + 4.5, e.y - oy + 5.5, w.t * 4, 0); }
};
function pickup(kind) {
  return {
    lit: true,
    init(e) { const th = World.colTheme ? World.colTheme[clamp(Math.floor(e.x / T), 0, World.cols - 1)] : null; e.land = th ? th.id : 'north'; e.food = kind === 'cake' && th ? th.food : null; e.w = 12; e.h = 10; e.x -= 6; e.rise = 16; e.ty = e.y - e.h; e.y = e.ty + 16; },
    update(w, e) {
      if (e.rise > 0) { e.rise -= 0.5; e.y = e.ty + e.rise; return; }
      e.y = e.ty + Math.sin(w.t * 0.08) * 1.2 - 1;
      const p = touch(w, e);
      if (p) {
        e.dead = true;
        if (kind === 'cake') { if (p.hp < MAXHP) { p.hp++; Sound.sfx('heal'); } else { Sound.sfx('item'); p.arrows = 3; p.radiant = Math.max(p.radiant, 150); } p.lum = 100; p.lumOut = false; if (e.food) World.toast(e.food); World.sparkle(e.x + 6, e.y + 5, '#7af0c0', 10); }
        if (kind === 'bloom') { p.radiant = 600; Sound.sfx('power'); World.sparkle(e.x + 7, e.y + 6, '#fff6b0', 18); w.flash = 0.4; }
      }
    },
    draw(c, w, e, ox, oy) {
      const clip = e.rise > 0;
      if (clip) { c.save(); c.beginPath(); c.rect(e.x - ox - 2, e.ty - oy - 4, e.w + 4, e.h + 4); c.clip(); }
      if (kind === 'cake') { if (!clip) Paint.soft(c, e.x - ox + 6, e.y - oy + 5, 12, '#ffe0a0', 0.4); Paint.food(c, e.land, e.x - ox + 6, e.y - oy + 5); }
      else Paint.bloom(c, e.x - ox + 6, e.y - oy + 5, w.t);
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
    if (e.life <= 0 || solidAt(w, cx, cy)) { e.dead = true; World.sparkle(e.x + 5, e.y + 1, '#bff4ff', 5); if ('?HSG'.includes(tileAt(w, cx, cy))) World.bump(cx, cy); return; } // an arrow wakes a runestone
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
  draw(c, w, e, ox, oy) { Paint.arrow(c, e.x - ox + 5, e.y - oy + 1.5, e.dir); }
};

/* ----- props ----- */
ENT.plat = {
  init(e) { e.h = 6; e.bx = e.x; e.by = e.y; e.ddx = 0; e.ddy = 0; },
  pre(w, e) {
    const k = 0.5 - 0.5 * Math.cos((w.t / e.per + e.ph) * TAU);
    const nx = e.bx + e.dx * k, ny = e.by + e.dy * k;
    e.ddx = nx - e.x; e.ddy = ny - e.y; e.x = nx; e.y = ny;
  },
  update() { },
  draw(c, w, e, ox, oy) {
    const th = w.colTheme[clamp(Math.floor(e.bx / T), 0, w.cols - 1)], L = Paint.LOOK[th.id] || Paint.LOOK.north, x = e.x - ox, y = e.y - oy;
    if (th.liquid.glow) Paint.soft(c, x + e.w / 2, y + 8, 18, th.liquid.glow, 0.22);
    c.fillStyle = L.plat[1]; c.beginPath(); Paint.rr(c, x + 0.5, y + 1.2, e.w - 1, 5.4, 2.4); c.fill();
    c.fillStyle = L.plat[0]; c.beginPath(); Paint.rr(c, x, y, e.w, 4.6, 2.3); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.24)'; c.beginPath(); Paint.rr(c, x + 2, y + 0.7, e.w - 4, 0.9, 0.45); c.fill();
    if (L.cap === 'snow') { c.fillStyle = L.capCol; c.beginPath(); Paint.rr(c, x - 0.5, y - 1.3, e.w + 1, 2.5, 1.2); c.fill(); }
  }
};
ENT.lantern = {
  lit: true,
  init(e) { e.w = 12; e.h = 26; e.x -= 6; e.y -= 26; e.warm = !!e.on; e.on = false; },
  update(w, e) {
    if (!e.on && touch(w, e)) {
      e.on = true; World.checkpoint(e.x + 6, e.y + 26); World.ring(e.x + 6, e.y + 5, 3, 44, 18, e.warm ? '#ffd070' : '#bff4ff'); Sound.sfx('lantern'); World.sparkle(e.x + 6, e.y + 4, e.warm ? '#ffd070' : '#bff4ff', 16);
      if (e.warm) World.toast('Somebody has kept this one burning.');
    }
  },
  draw(c, w, e, ox, oy) {
    Paint.lantern(c, e.x - ox + 4, e.y - oy + 26, w.t, e.on || e.warm, e.warm);
  },
  light(e) { return e.on || e.warm ? 62 : 0; }
};
ENT.sign = {
  init(e) { e.w = 14; e.h = 16; e.x -= 7; e.y -= 16; },
  update(w, e) { const p = nearP(w, e); if (Math.abs(p.x + 5 - (e.x + 7)) < 30 && Math.abs(p.y + p.h - (e.y + 16)) < 30) { w.signText = e.text; w.signNear = e; } },
  draw(c, w, e, ox, oy) {
    if (e.text.startsWith('Tonttu:')) { Paint.soft(c, e.x - ox + 10, e.y - oy + 10, 10, '#ffcf70', 0.35); Paint.tonttu(c, e.x - ox + 7, e.y - oy + 16, w.t, w.player.x > e.x ? 1 : -1); }
    else Paint.waystone(c, e.x - ox + 7, e.y - oy + 16, w.t, w.signNear === e);
  },
  light() { return 22; }
};
ENT.beacon = {
  init(e) { e.w = 40; e.h = 56; e.x -= 20; e.y -= 56; e.on = false; e.fire = 0; },
  update(w, e) {
    const p = nearP(w, e);
    const at = !p.dead && p.x + p.w > e.x + 2 && p.x < e.x + e.w - 2 && Math.abs(p.y + p.h - (e.y + 56)) < 40;
    if (!e.on && at && e.final) { const boy = w.ents.find(q => q.type === 'boy'); if (w.bossAlive) return; if (!Game.gems.kohinoor) { if (w.toastT <= 0) World.toast('The beacon is waiting for the Mountain of Light.'); return; } if (boy && (!boy.met || w.t - boy.metT < 430)) return; }
    if (!e.on && at) { e.on = true; World.lightBeacon(e); }
    if (e.on) {
      e.fire = Math.min(1, e.fire + 0.012);
      if (Math.abs(e.x - w.cam.x - W / 2) < W) for (let i = 0; i < 2; i++) w.parts.push({ x: e.x + 20 + rand(-7, 7) * e.fire, y: e.y + 2, vx: rand(-0.3, 0.3), vy: rand(-2.6, -0.8) * (0.4 + e.fire), life: rand(18, 44), col: ['#fff6b0', '#ffc040', '#ff7a1a', '#ff4a10'][i + (w.t % 2) * 2 & 3], g: -0.02, glow: 1, sz: 2 + (rand() < 0.4) });
    }
  },
  draw(c, w, e, ox, oy) {
    Paint.beacon(c, e.x - ox + 20, e.y - oy + 56, w.t, e.on ? Math.max(0.05, e.fire) : 0);
  },
  light(e) { return 30 + e.fire * 110; }
};

/* ============ The Hoarder King ============ */
ENT.boss = {
  foe: true, stomp: false, arrow: false,
  init(e) { e.w = 22; e.h = 44; e.x -= 11; e.y -= 44; e.max = 10; e.hp = clamp(Game.bossHp || 10, 3, 10); e.st = 'wait'; e.t0 = 0; e.dir = -1; e.last = ''; e.stunDmg = 0; e.p2 = false; },
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
        for (const q of w.players) { q.control = e.t0 > 105; if (e.t0 <= 105) q.vx *= 0.8; }
        if (e.t0 === 30) { Sound.sfx('roar'); w.shake = 24; World.ring(e.x + 11, e.y + 10, 6, 160, 30, '#ff6a20'); }
        if (e.t0 > 110) go('idle');
        break;
      case 'idle': {
        face();
        e.vx = e.dir * (p2 ? 0.5 : 0.35);
        if (Math.abs(p.x - e.x) < 64) e.vx = 0;
        e.x = clamp(e.x + e.vx, A.x0 + 4, A.x1 - e.w - 4);
        if (e.t0 > (p2 ? 70 : 96)) {
          const opts = ['slam', 'embers', 'charge'].filter(o => o !== e.last);
          const pick = opts[Math.floor(rand(opts.length))];
          e.last = pick; e.slams = p2 ? 2 : 1; go('tele_' + pick);
          Sound.sfx('warn');
        }
        break;
      }
      case 'tele_slam': if (e.t0 > (p2 ? 44 : 54)) go('slam'); break;
      case 'slam':
        if (e.t0 === 1) {
          Sound.sfx('slam'); w.shake = 14;
          const fx = e.x + 11 + e.dir * 18;
          for (const d of [-1, 1]) w.ents.push(makeEnt({ t: 'wave', x: fx, y: A.floor, dir: d, sp: p2 ? 2.1 : 1.8 }));
          for (let i = 0; i < 12; i++) w.parts.push({ x: fx + rand(-8, 8), y: A.floor, vx: rand(-2, 2), vy: rand(-3, -1), life: 30, col: i % 2 ? '#ff7a20' : '#5a5058', g: 0.15, sz: 2, glow: i % 2 });
        }
        if (e.t0 > 34) { if (--e.slams > 0) { face(); go('tele_slam'); e.t0 = 10; } else { e.stunLen = 150; go('stun'); } }
        break;
      case 'tele_embers': if (e.t0 > (p2 ? 46 : 56)) go('embers'); break;
      case 'embers':
        if (e.t0 === 1) {
          const n = p2 ? 5 : 4, span = A.x1 - A.x0 - 40;
          for (let i = 0; i < n; i++) {
            const tx = i === 0 ? p.x + 5 : i === 1 ? p.x + 5 + p.face * 40 : A.x0 + 20 + rand(span);
            w.ents.push(makeEnt({ t: 'fall', x: clamp(tx, A.x0 + 10, A.x1 - 10), y: A.floor, delay: 30 + i * (p2 ? 16 : 20) }));
          }
        }
        if (e.t0 > 50) { e.stunLen = 130; go('stun'); }
        break;
      case 'tele_charge': face(); if (e.t0 > (p2 ? 48 : 58)) { go('charge'); Sound.sfx('roar'); } break;
      case 'charge': {
        e.x += e.dir * (p2 ? 3.0 : 2.6);
        if (w.t % 3 === 0) w.parts.push({ x: e.x + 11 - e.dir * 10, y: A.floor - 2, vx: -e.dir * rand(1), vy: rand(-1.5, -0.3), life: 24, col: '#ff7a20', g: 0.05, sz: 2, glow: 1 });
        if (e.x <= A.x0 + 2 || e.x + e.w >= A.x1 - 2) {
          e.x = clamp(e.x, A.x0 + 2, A.x1 - e.w - 2);
          Sound.sfx('slam'); w.shake = 18; e.stunLen = 170; go('stun');
          for (let i = 0; i < 2; i++) w.ents.push(makeEnt({ t: 'fall', x: A.x0 + 30 + rand(A.x1 - A.x0 - 60), y: A.floor, delay: 30 + i * 22 }));
        }
        break;
      }
      case 'stun':
        if (e.t0 === 1) e.stunDmg = 0;
        if (e.t0 > e.stunLen || e.stunDmg >= 4) go('recover');
        break;
      case 'recover':
        if (e.t0 === 1 && !e.p2 && e.hp <= e.max / 2) {
          e.p2 = true; Sound.sfx('roar'); w.shake = 24; Sound.setRate(0.88); w.flash = 0.5;
          w.ents.push(makeEnt({ t: 'cake', x: (A.x0 + A.x1) / 2, y: A.floor - 44 }));
          World.toast('The crown burns brighter. He is afraid.');
        }
        if (e.t0 > 26) go('idle');
        break;
      case 'dying':
        if (e.t0 % 7 === 0) { Sound.sfx('bosshit'); w.shake = 8; for (let i = 0; i < 8; i++) w.parts.push({ x: e.x + rand(22), y: e.y + rand(44), vx: rand(-2, 2), vy: rand(-3, 0), life: 40, col: ['#ff7a20', '#ffc040', '#2a2a36'][i % 3], g: 0.08, sz: 2 + (i % 2), glow: i % 3 < 2 }); }
        if (e.t0 === 130) {
          Sound.sfx('shatter'); w.flash = 1; w.shake = 30; e.dead = true;
          for (let i = 0; i < 7; i++) w.ents.push(makeEnt({ t: 'star', x: e.x + 11, y: e.y + 2, i }));
          World.ring(e.x + 11, e.y + 20, 8, 150, 24, '#ffffff'); World.ring(e.x + 11, e.y + 20, 4, 90, 30, '#ffb040');
          for (let i = 0; i < 70; i++) { const a = rand(TAU), s = rand(1, 5); w.parts.push({ x: e.x + 11, y: e.y + 20, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(40, 90), col: i % 2 ? '#3a3a4a' : '#ff7a20', g: 0.05, sz: 2, glow: i % 2 }); }
          World.bossDefeated(e.x + 11);
        }
        break;
    }
  },
  vulnerable(e) { return e.st === 'stun' && e.t0 > 4; },
  harmless(e) { return e.st === 'wait' || e.st === 'dying' || e.st === 'intro' || e.st === 'stun' || e.st === 'recover'; },
  draw(c, w, e, ox, oy) { Paint.king(c, w, e, e.x - ox + 11, e.y - oy + 44); },
  light(e) { return e.st === 'wait' ? 30 : 70; }
};
function bossHit(w, e, n, hx, hy) {
  if (!ENT.boss.vulnerable(e) || e.invT > 0) return false;
  e.hp -= n; Game.bossHp = Math.max(3, e.hp); e.stunDmg += n; e.flash = 10; e.invT = 12; Sound.sfx('bosshit'); w.shake = 8; w.hitstop = 6;
  World.sparkle(hx, hy, '#ffc040', 10);
  if (e.hp <= 0) { e.hp = 0; e.st = 'dying'; e.t0 = 0; Sound.music(null); w.bossAlive = false; World.clearHazards(); w.hitstop = 18; w.slow = 80; w.flash = 1; World.ring(hx, hy, 6, 140, 26, '#ffffff'); Sound.sfx('slam'); }
  return true;
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
    Paint.soft(c, e.x - ox + 5, e.y - oy + 6, 12, '#ff7a20', 0.5); Paint.flame(c, e.x - ox + 5, e.y - oy + 12, w.t * 1.4 + e.x, 1.25);
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
    c.fillStyle = `rgba(255,120,40,${pulse})`; c.beginPath(); c.ellipse(e.x - ox + 4, e.fy - oy, 8, 1, 0, 0, TAU); c.fill();
    Paint.soft(c, e.x - ox + 4, e.fy - oy, 11, '#ff5a10', pulse);
    if (e.started) Paint.emberDrop(c, e.x - ox + 4, e.y - oy + 5, w.t, true);
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
    Paint.soft(c, x, y, 15, '#ffffff', 0.8); Paint.star4(c, x, y, 5, '#ffffff', w.t * 0.04);
  }
};

/* ----- the diamonds ----- */
ENT.gem = {
  lit: true,
  init(e) { e.def = GEM_BY_ID[e.gem]; e.w = Math.round(11 + e.def.n * 1.2) | 1; e.h = Math.round(e.w * 0.86); e.x -= e.w / 2; e.y -= e.h + 4; e.by = e.y; },
  update(w, e) {
    e.y = e.by + Math.sin(w.t * 0.05) * 2.5;
    if (w.t % 9 === 0) w.parts.push({ x: e.x + rand(e.w), y: e.y + rand(e.h), vx: 0, vy: -0.25, life: 26, col: w.t % 18 ? '#ffffff' : e.def.tint, glow: 1, sz: 1 });
    if (touch(w, e)) { e.dead = true; World.gainGem(e); }
  },
  draw(c, w, e, ox, oy) {
    const x = e.x - ox + e.w / 2, y = e.y - oy + e.h / 2, r = e.w * 0.9 + 6;
    Paint.soft(c, x, y, r + Math.sin(w.t * 0.08) * 3, e.def.tint, 0.5);
    for (let i = 0; i < 4; i++) { const a = w.t * 0.03 + i * TAU / 4, d = e.w * 0.75 + 4; Paint.disc(c, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, 0.5, '#ffffff'); }
    drawGemHi(c, x, y, e.w * 0.52, e.def, w.t);
    const k = (w.t + e.def.n * 13) % 70; if (k < 10) Paint.star4(c, x - e.w * 0.3, y - e.h * 0.4, 1 + Math.sin(k / 10 * Math.PI) * 2.4, '#ffffff');
  },
  light(e) { return 34 + e.def.n * 2; }
};
/* ----- Mayank: he walked from India on the word of a dream, and waits past the mesa with a lantern ----- */
const MAYANK_LINES = [
  'Mayank: “A dream promised me an elf queen in a distant land. I walked|from India to find her. It was right about the ears.”',
  'He holds up his lantern. She holds up her starlight.'
];
ENT.boy = {
  init(e) { e.w = 10; e.h = 22; e.x -= 5; e.y -= 22; e.dir = -1; e.anim = 0; e.met = !!Game.metBoy; e.metT = e.met ? -9999 : 0; e.walk = false; },
  update(w, e) {
    if (w.bossAlive) return; // he is past the mesa. She has to get there.
    const p = nearP(w, e), dx = p.x - e.x, near = Math.abs(dx) < 42 && Math.abs(p.y - e.y) < 30 && !p.dead;
    if (!e.met) {
      e.dir = dx < 0 ? -1 : 1;
      if (Math.abs(dx) < 300 && w.t % 64 === 0) { w.parts.push({ x: e.x + 5 + e.dir * 6, y: e.y - 4, vx: e.dir * 0.25, vy: -0.4, life: 80, max: 80, draw(c, x, y, q) { Paint.note(c, x, y, Math.min(1, q.life / 20)); } }); if (w.t % 256 === 0) Sound.sfx('hum'); }
      if (near && w.state === 'play') { e.met = true; e.metT = w.t; Game.metBoy = true; Game.save(); Sound.sfx('wonder'); World.ring(p.x + 5, p.y + 9, 4, 120, 40, '#fff3c4'); World.sparkle(p.x + 5, p.y + 9, '#fff3c4', 30); w.flash = 0.3; }
      return;
    }
    const age = w.t - e.metT;
    if (w.state === 'play' && age >= 0 && age < 700) { w.signText = MAYANK_LINES[age < 400 ? 0 : 1]; w.signNear = e; }
    // from here he walks beside her
    if (w.zone.warp) { e.walk = false; return; } // he waits on this side of the tear
    const tx = clamp(p.x - 18, w.arena.x0 + 8, w.mainEnd - 24), d = tx - e.x;
    e.walk = Math.abs(d) > 5 && age > 60;
    if (e.walk) { e.x += clamp(d * 0.12, -1.7, 1.7); e.dir = d < 0 ? -1 : 1; e.anim += 0.2; } else if (Math.abs(dx) > 4) e.dir = dx < 0 ? -1 : 1;
  },
  draw(c, w, e, ox, oy) {
    if (w.bossAlive) return;
    const x = e.x - ox + 5, y = e.y - oy + 22, lx = x + e.dir * 5.6, ly = y - 9.4;
    Paint.soft(c, lx, ly, 17 + Math.sin(w.t * 0.13) * 2, '#ffc060', 0.6);
    Paint.figure(c, x, y, { face: e.dir, speed: e.walk ? 0.8 : 0, ph: e.anim * 1.6, t: w.t, lantern: true }, Paint.MAYANK);
    if (e.met) { // his lantern, her starlight
      const p = w.player, age = w.t - e.metT, k = clamp(age / 60, 0, 1) * (0.75 + 0.25 * Math.sin(w.t * 0.1)), px = p.x - ox + 5 + p.face * 1.6, py = p.y - oy + 6;
      Paint.soft(c, px, py, 10 + 5 * k, '#dff2ff', 0.7 * k); Paint.star4(c, px, py, 1.8 + k, '#ffffff', w.t * 0.02);
      if (age < 760) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,236,190,${0.28 * k})`; c.lineWidth = 1.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(lx, ly); c.lineTo(px, py); c.stroke(); c.restore(); }
    }
  },
  light(e) { return World.bossAlive ? 0 : 58; }
};

/* ----- keepsakes: one small true thing from each land ----- */
const KEEPS = [
  { id: 'himmeli', name: 'A himmeli', line: 'Straw, thread and geometry. It turns in the slightest breath.' },
  { id: 'dala', name: 'A Dala horse', line: 'Carved in Dalarna, painted red. It has never run anywhere.' },
  { id: 'ore', name: 'A lump of Kiruna magnetite', line: 'Iron ore. Hold a compass near and it changes its mind.' },
  { id: 'compass', name: 'A ship’s compass', line: 'It points north, which is home, which is no help.' },
  { id: 'quartz', name: 'An Arkansas quartz crystal', line: 'Not a diamond. Quite honest about it.' },
  { id: 'key', name: 'A small iron key', line: 'It opens a room with no windows.' },
  { id: 'opal', name: 'An opal', line: 'From Coober Pedy. Fire, kept in a stone, and nobody shut it in.' }
];
const KEEP_BY_ID = {}; KEEPS.forEach((k, i) => { k.n = i; KEEP_BY_ID[k.id] = k; });
ENT.keep = {
  lit: true,
  init(e) { e.def = KEEP_BY_ID[e.keep]; e.w = 12; e.h = 12; e.x -= 6; e.y -= 14; e.by = e.y; },
  update(w, e) {
    e.y = e.by + Math.sin(w.t * 0.06 + e.x) * 2;
    if (touch(w, e)) { e.dead = true; Game.keeps[e.def.id] = 1; Sound.sfx('item'); World.sparkle(e.x + 6, e.y + 6, '#ffe9a8', 16); World.ring(e.x + 6, e.y + 6, 3, 30, 14, '#ffe9a8'); World.toast(e.def.name + '.|' + e.def.line, true); Game.save(); }
  },
  draw(c, w, e, ox, oy) { Paint.soft(c, e.x - ox + 6, e.y - oy + 6, 12 + Math.sin(w.t * 0.1) * 2, '#ffe9a8', 0.4); Paint.keepsake(c, e.def.n, e.x - ox + 6, e.y - oy + 6); },
  light() { return 30; }
};
