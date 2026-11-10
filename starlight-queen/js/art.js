'use strict';
/* Starlight Queen — art: every sprite and tile is drawn in code (no image assets). */
const Art = (() => {
  const S = {};

  function spr(w, h, fn) { const [cv, g] = mk(w, h); fn(g); return cv; }
  function frames(n, w, h, fn) { const a = []; for (let i = 0; i < n; i++) a.push(spr(w, h, g => fn(g, i))); return a; }
  const flashCache = new WeakMap();
  function flashOf(img) {
    let f = flashCache.get(img);
    if (!f) {
      f = spr(img.width, img.height, g => {
        g.drawImage(img, 0, 0);
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = '#fff'; g.fillRect(0, 0, img.width, img.height);
      });
      flashCache.set(img, f);
    }
    return f;
  }
  function outlined(img, col) {
    return spr(img.width, img.height, g => {
      const [tc, tg] = mk(img.width, img.height);
      tg.drawImage(img, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = col || '#231d3a'; tg.fillRect(0, 0, img.width, img.height);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.drawImage(tc, dx, dy);
      g.drawImage(img, 0, 0);
    });
  }
  function blit(c, img, x, y, flip, flipV) {
    x = Math.round(x) - (img.pad || 0); y = Math.round(y) - (img.pad || 0);
    if (flip || flipV) {
      c.save();
      c.translate(x + (flip ? img.width : 0), y + (flipV ? img.height : 0));
      c.scale(flip ? -1 : 1, flipV ? -1 : 1);
      c.drawImage(img, 0, 0);
      c.restore();
    } else c.drawImage(img, x, y);
  }

  /* ---------- glow ---------- */
  const glowCache = {};
  function glowSprite(col) {
    if (glowCache[col]) return glowCache[col];
    const [cv, g] = mk(64, 64);
    g.fillStyle = col;
    for (let i = 0; i < 24; i++) { g.globalAlpha = 0.022 + i * 0.006; g.beginPath(); g.arc(32, 32, 32 - i * 1.3, 0, TAU); g.fill(); }
    return glowCache[col] = cv;
  }
  function glow(c, x, y, r, col, a) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = a === undefined ? 0.6 : a;
    c.imageSmoothingEnabled = false;
    c.drawImage(glowSprite(col), Math.round(x - r), Math.round(y - r), Math.round(r * 2), Math.round(r * 2));
    c.restore();
  }

  /* ---------- the Queen ---------- */
  const Q = {
    HAIR: '#f6dc8c', HAIRD: '#c8963e', SKIN: '#f8e2c8', SKIND: '#d9b493', GOWN: '#2aa59c', GOWND: '#1c7d80', GOWNDD: '#145c62',
    TRIM: '#f2c14e', CROWN: '#fff2b0', GEM: '#7df4ff', CLOAK: '#d8343c', CLOAKD: '#9c2230', SHOE: '#6b4a2e', EYE: '#27386e'
  };
  function drawQueen(g, pose, f, shoot, crown) {
    const bob = (pose === 'idle' && f === 1) || (pose === 'run' && (f === 1 || f === 4)) ? 1 : 0;
    const air = pose === 'jump' || pose === 'fall' || pose === 'glide';
    const y0 = 2 + bob + (pose === 'hurt' ? 1 : 0);
    const lift = pose === 'jump' ? -0.5 : pose === 'fall' ? 2.4 : pose === 'glide' ? 3 : pose === 'run' ? 1.3 : pose === 'hurt' ? 1.8 : 0;
    const yEnd = pose === 'jump' ? 19 : air ? 20 : 21; // a travelling tunic, cut for running
    // cloak
    if (pose === 'glide') {
      for (let i = 0; i < 10; i++) {
        const xl = Math.round(10 - i * 1.05), yy = y0 + 8 + Math.round(i * 0.45 + Math.sin(i * 0.9 + f * 2) * 0.6);
        R(g, xl, yy, 11 - xl + 2, 3, i % 3 === 2 ? Q.CLOAKD : Q.CLOAK);
      }
      R(g, 1, y0 + 12, 3, 1, Q.CLOAKD);
    } else {
      const k = pose === 'run' ? 0.32 : pose === 'jump' ? 0.16 : pose === 'fall' ? 0.3 : pose === 'hurt' ? 0.3 : 0.1;
      const rise = pose === 'fall' ? 0.45 : 0;
      for (let i = 0; i < 15; i++) {
        const sway = pose === 'run' ? Math.sin(i * 0.5 + f * 1.05) * 0.7 : pose === 'idle' ? (f ? 0.3 : 0) * (i / 14) : 0;
        const xl = Math.round(9 - i * k + sway), yy = Math.round(y0 + 9 + i * (1 - rise));
        if (yy > yEnd + 2) break;
        R(g, xl, yy, 11 - xl, 1, Q.CLOAK); R(g, xl, yy, 1, 1, Q.CLOAKD);
      }
    }
    // hair
    for (let i = 0; i < 12; i++) {
      const wave = Math.sin(i * 0.7 + f * 1.05) * (pose === 'idle' ? 0.35 : 0.7);
      const hx = Math.round(8 - i * (0.1 + Math.max(0, lift) * 0.16) + wave);
      const hy = Math.round(y0 + 3 + i * (1 - Math.max(-0.2, lift) * 0.28));
      R(g, hx, hy, 3, 2, i > 8 ? Q.HAIRD : Q.HAIR);
      R(g, hx, hy, 1, 2, Q.HAIRD);
    }
    // skirt
    const yS = y0 + 14, n = yEnd - yS;
    for (let r = 0; r <= n; r++) {
      const fl = pose === 'jump' ? -0.08 : air ? 0.28 : 0;
      const sw = pose === 'run' ? Math.sin(f * 1.05) * r * 0.07 : 0;
      const xl = Math.round(9 - r * (0.3 + fl) + sw), xr = Math.round(14 + r * (0.16 + fl * 0.6) + sw);
      R(g, xl, yS + r, xr - xl, 1, r === n ? Q.TRIM : Q.GOWN);
      if (r < n) {
        R(g, xl, yS + r, 2, 1, Q.GOWND);
        if (r > 2) R(g, xl + 3 + (((r + f) >> 1) % 2), yS + r, 1, 1, Q.GOWND);
        if (r > 4) R(g, xr - 2 - (((r + f * 2) >> 2) % 2), yS + r, 1, 1, Q.GOWND);
        if (r === n - 1) { R(g, xl + 1, yS + r, 1, 1, Q.TRIM); R(g, xl + 4, yS + r, 1, 1, Q.TRIM); R(g, xr - 2, yS + r, 1, 1, Q.TRIM); }
      }
    }
    // feet
    const LEG = '#35477e', LEGD = '#26345e', BOOT = '#7a4a2a', BOOTD = '#553218';
    if (!air) {
      const o = pose === 'run' ? [0, 2, 3, 1, -1, -2][f] : 0, lift = pose === 'run' ? [0, 1, 2, 0, 0, 1][f] : 0;
      R(g, 9 - o, yEnd, 2, 25 - yEnd, LEGD); R(g, 8 - o, 25, 4, 3, BOOTD); R(g, 8 - o, 25, 4, 1, '#e8eefc');
      R(g, 12 + o, yEnd, 2, 25 - yEnd - lift, LEG); R(g, 12 + o, 25 - lift, 4, 3, BOOT); R(g, 12 + o, 25 - lift, 4, 1, '#ffffff');
    } else if (pose === 'jump') { R(g, 9, yEnd, 2, 3, LEGD); R(g, 8, yEnd + 3, 4, 3, BOOTD); R(g, 13, yEnd - 1, 2, 2, LEG); R(g, 13, yEnd + 1, 4, 3, BOOT); }
    else { R(g, 8, yEnd, 2, 4, LEGD); R(g, 7, yEnd + 4, 4, 3, BOOTD); R(g, 13, yEnd, 2, 4, LEG); R(g, 13, yEnd + 4, 4, 3, BOOT); }
    // torso
    R(g, 9, y0 + 9, 5, 5, Q.GOWN); R(g, 9, y0 + 9, 1, 5, Q.GOWND);
    R(g, 9, y0 + 8, 5, 2, Q.CLOAK); R(g, 9, y0 + 9, 5, 1, Q.CLOAKD); R(g, 9, y0 + 13, 5, 1, Q.TRIM); R(g, 12, y0 + 13, 1, 1, '#fff6c8'); R(g, 10, y0 + 10, 1, 3, Q.TRIM);
    R(g, 11, y0 + 8, 2, 1, Q.SKIND);
    // head
    R(g, 9, y0 + 2, 6, 6, Q.SKIN); R(g, 14, y0 + 7, 1, 1, Q.SKIND);
    R(g, 8, y0 + 1, 6, 2, Q.HAIR); R(g, 8, y0 + 1, 2, 7, Q.HAIR); R(g, 10, y0 + 2, 3, 1, Q.HAIR); R(g, 8, y0 + 3, 1, 5, Q.HAIRD);
    R(g, 13, y0 + 4, 1, 2, Q.EYE); R(g, 10, y0 + 4, 1, 2, Q.SKIND); R(g, 9, y0 + 3, 1, 1, Q.SKIN);
    R(g, 13, y0 + 7, 1, 1, '#d98a8a');
    // circlet
    if (crown) { R(g, 9, y0 + 1, 6, 1, Q.CROWN); R(g, 10, y0, 1, 1, Q.CROWN); R(g, 12, y0 - 1, 1, 2, Q.CROWN); R(g, 14, y0, 1, 1, Q.CROWN); R(g, 12, y0, 1, 1, Q.GEM); }
    else { R(g, 8, y0 + 1, 7, 2, '#d8343c'); R(g, 8, y0 + 2, 7, 1, '#9c2230'); R(g, 13, y0 + 1, 1, 1, Q.GEM); } // a red wool band and one star pin
    if (!air || pose === 'jump') { R(g, 7, y0 + 13, 3, 4, '#8a5a2b'); R(g, 7, y0 + 13, 3, 1, '#b07a44'); R(g, 8, y0 + 15, 1, 1, Q.TRIM); } // satchel
    // arms
    if (shoot) {
      R(g, 12, y0 + 10, 6, 2, Q.GOWND); R(g, 18, y0 + 10, 1, 2, Q.SKIN);
      R(g, 20, y0 + 5, 1, 12, '#e9c75e'); R(g, 19, y0 + 4, 1, 2, '#e9c75e'); R(g, 19, y0 + 16, 1, 2, '#e9c75e'); R(g, 18, y0 + 3, 1, 1, '#b8923a'); R(g, 18, y0 + 18, 1, 1, '#b8923a');
      R(g, 10, y0 + 10, 2, 2, Q.GOWND); R(g, 9, y0 + 10, 1, 2, Q.SKIN);
    } else if (pose === 'jump') {
      R(g, 13, y0 + 8, 2, 3, Q.GOWND); R(g, 14, y0 + 7, 2, 1, Q.SKIN);
      R(g, 8, y0 + 10, 2, 3, Q.GOWND);
    } else if (air) {
      R(g, 13, y0 + 9, 4, 2, Q.GOWND); R(g, 17, y0 + 8, 1, 2, Q.SKIN);
      R(g, 6, y0 + 9, 3, 2, Q.GOWND); R(g, 5, y0 + 8, 1, 2, Q.SKIN);
    } else if (pose === 'hurt') {
      R(g, 13, y0 + 7, 2, 4, Q.GOWND); R(g, 14, y0 + 6, 1, 1, Q.SKIN);
    } else {
      const ax = 11 + (pose === 'run' ? [-1, 0, 1, 1, 0, -1][f] : 0);
      R(g, ax, y0 + 10, 2, 4, Q.GOWND); R(g, ax, y0 + 14, 2, 1, Q.SKIN);
    }
  }
  function buildQueen() {
    const mkset = shoot => ({
      idle: frames(2, 24, 28, (g, f) => drawQueen(g, 'idle', f, shoot)),
      run: frames(6, 24, 28, (g, f) => drawQueen(g, 'run', f, shoot)),
      jump: frames(1, 24, 28, g => drawQueen(g, 'jump', 0, shoot)),
      fall: frames(2, 24, 28, (g, f) => drawQueen(g, 'fall', f, shoot)),
      glide: frames(2, 24, 28, (g, f) => drawQueen(g, 'glide', f, shoot)),
      hurt: frames(1, 24, 28, g => drawQueen(g, 'hurt', 0, false))
    });
    S.queen = mkset(false); S.queenShoot = mkset(true);
    S.queenCrown = frames(2, 24, 28, (g, f) => drawQueen(g, 'idle', f, false, true)).map(im => outlined(im));
    const bset = shoot => ({
      idle: frames(2, 24, 28, (g, f) => drawBoy(g, 'idle', f, shoot)),
      run: frames(6, 24, 28, (g, f) => drawBoy(g, 'run', f, shoot)),
      jump: frames(1, 24, 28, g => drawBoy(g, 'jump', 0, shoot)),
      fall: frames(2, 24, 28, (g, f) => drawBoy(g, 'fall', f, shoot)),
      glide: frames(2, 24, 28, (g, f) => drawBoy(g, 'glide', f, shoot)),
      hurt: frames(1, 24, 28, g => drawBoy(g, 'hurt', 0, false))
    });
    S.boy = bset(false); S.boyShoot = bset(true);
    for (const k of ['queen', 'queenShoot', 'boy', 'boyShoot']) for (const pose in S[k]) S[k][pose] = S[k][pose].map(im => outlined(im));
  }
  /* ---------- diamonds ---------- */
  const gemCache = {};
  function gemSprite(gem, size) {
    const key = gem.id + (size || '');
    if (gemCache[key]) return gemCache[key];
    const wd = size || Math.round(11 + gem.n * 1.2) | 1, crown = Math.max(3, Math.round(wd * 0.3)), hg = Math.round(wd * 0.86);
    const dk = mix(gem.tint, '#1c2a52', 0.62), cxm = (wd - 1) / 2;
    return gemCache[key] = spr(wd, hg, g => {
      for (let y = 0; y < hg; y++) {
        const half = y < crown ? wd * 0.3 + (wd * 0.2) * (y / (crown - 1 || 1)) : (wd / 2) * (1 - (y - crown) / (hg - crown));
        for (let x = 0; x < wd; x++) {
          const u = (x - cxm) / Math.max(0.5, half);
          if (Math.abs(u) > 1) continue;
          const fi = Math.min(3, Math.floor((u + 1) * 2)), edge = Math.abs(u) > 1 - 1.2 / Math.max(1, half);
          const sh = y < crown ? [0.72, 0.98, 0.6, 0.42][fi] : [0.5, 0.28, 0.86, 0.16][(fi + ((y - crown) > (hg - crown) * 0.45 ? 1 : 0)) % 4];
          let col = sh > 0.5 ? mix(gem.tint, '#ffffff', (sh - 0.5) * 1.7) : mix(dk, gem.tint, sh * 2);
          if (edge || y === hg - 1) col = dk;
          if (y === 0) col = '#ffffff';
          if (y === crown) col = mix(col, '#ffffff', 0.45);
          g.fillStyle = col; g.fillRect(x, y, 1, 1);
        }
      }
    });
  }

  function unused() { }

  /* ---------- Sam ---------- */
  const B = { HAIR: '#6a4428', SKIN: '#f2c9a2', SKIND: '#d09a78', HAT: '#8f6238', HATD: '#6a4424', SH: '#c9432e', SHD: '#96301f', OV: '#3d5fa3', OVD: '#2a4379', BT: '#4a3020', SC: '#ffd070', SCD: '#d89a30' };
  function drawBoy(g, pose, f, shoot) {
    const bob = (pose === 'idle' && f === 1) || (pose === 'run' && (f === 1 || f === 4)) ? 1 : 0;
    const air = pose === 'jump' || pose === 'fall' || pose === 'glide';
    const y0 = 5 + bob + (pose === 'hurt' ? 1 : 0);
    // scarf tail
    const fl = pose === 'run' ? 1 : air ? 1.6 : 0.3;
    if (pose === 'glide') { for (let i = 0; i < 9; i++) R(g, 9 - i, y0 + 8 + Math.round(Math.sin(i * 0.9 + f * 2) * 0.8 + i * 0.3), 2, 4 + (i < 6 ? 2 : 0), i % 3 === 2 ? B.SCD : B.SC); }
    else for (let i = 0; i < 6; i++) R(g, 8 - Math.round(i * fl), y0 + 8 + Math.round(i * (1.1 - fl * 0.5) + Math.sin(i + f * 1.05) * 0.6), 2, 2, i > 3 ? B.SCD : B.SC);
    // legs
    if (!air) {
      const o = pose === 'run' ? [0, 2, 3, 1, -1, -2][f] : 0, lift = pose === 'run' ? [0, 1, 0, 0, 1, 0][f] : 0;
      R(g, 9 - o, y0 + 16, 3, 22 - y0 - 16 + 4, B.OVD); R(g, 8 - o, 26, 4, 2, B.BT);
      R(g, 12 + o, y0 + 16, 3, 22 - y0 - 16 + 4 - lift, B.OV); R(g, 12 + o, 26 - lift, 4, 2, B.BT);
    } else if (pose === 'jump') { R(g, 9, y0 + 16, 3, 4, B.OVD); R(g, 8, y0 + 20, 4, 2, B.BT); R(g, 13, y0 + 15, 3, 3, B.OV); R(g, 13, y0 + 18, 4, 2, B.BT); }
    else { R(g, 8, y0 + 16, 3, 5, B.OVD); R(g, 7, y0 + 21, 4, 2, B.BT); R(g, 13, y0 + 16, 3, 5, B.OV); R(g, 13, y0 + 21, 4, 2, B.BT); }
    // torso
    R(g, 8, y0 + 8, 7, 9, B.SH); R(g, 8, y0 + 8, 1, 9, B.SHD); R(g, 9, y0 + 11, 5, 6, B.OV); R(g, 9, y0 + 9, 1, 3, B.OV); R(g, 13, y0 + 9, 1, 3, B.OV); R(g, 11, y0 + 12, 2, 1, B.SC);
    R(g, 8, y0 + 7, 7, 2, B.SC); R(g, 8, y0 + 8, 7, 1, B.SCD);
    // head + hat
    R(g, 9, y0 + 1, 6, 6, B.SKIN); R(g, 14, y0 + 6, 1, 1, B.SKIND); R(g, 8, y0 + 1, 2, 5, B.HAIR); R(g, 10, y0 + 1, 2, 1, B.HAIR);
    R(g, 13, y0 + 3, 1, 2, '#2a2a3a'); R(g, 13, y0 + 6, 1, 1, '#c87a6a'); R(g, 10, y0 + 3, 1, 2, B.SKIND);
    R(g, 6, y0, 12, 1, B.HAT); R(g, 5, y0, 1, 1, B.HATD); R(g, 8, y0 - 3, 7, 3, B.HAT); R(g, 8, y0 - 1, 7, 1, B.SH); R(g, 8, y0 - 3, 1, 3, B.HATD); R(g, 9, y0 - 4, 5, 1, B.HAT);
    // arms
    if (shoot) {
      R(g, 12, y0 + 10, 6, 2, B.SH); R(g, 18, y0 + 10, 1, 2, B.SKIN);
      R(g, 19, y0 + 8, 1, 6, '#8a5a34'); R(g, 18, y0 + 6, 1, 3, '#8a5a34'); R(g, 20, y0 + 6, 1, 3, '#8a5a34'); R(g, 18, y0 + 6, 3, 1, '#e8e0d0');
    } else if (pose === 'jump') { R(g, 13, y0 + 7, 2, 4, B.SH); R(g, 14, y0 + 6, 2, 1, B.SKIN); R(g, 7, y0 + 10, 2, 3, B.SHD); }
    else if (air) { R(g, 13, y0 + 9, 4, 2, B.SH); R(g, 17, y0 + 8, 1, 2, B.SKIN); R(g, 5, y0 + 9, 3, 2, B.SHD); R(g, 4, y0 + 8, 1, 2, B.SKIN); }
    else if (pose === 'hurt') { R(g, 13, y0 + 6, 2, 4, B.SH); R(g, 14, y0 + 5, 1, 1, B.SKIN); }
    else { const ax = 11 + (pose === 'run' ? [-1, 0, 1, 1, 0, -1][f] : 0); R(g, ax, y0 + 10, 2, 4, B.SHD); R(g, ax, y0 + 14, 2, 1, B.SKIN); }
  }

  /* ---------- foes ---------- */
  function buildFoes() {
    S.goblin = frames(2, 16, 16, (g, f) => {
      const sk = '#6fa044', skd = '#4c7a30';
      R(g, 4, 7, 8, 6, skd); R(g, 5, 8, 5, 4, '#7a5a34'); R(g, 5, 11, 6, 1, '#4a3520');
      R(g, 3, 2, 10, 6, sk); R(g, 3, 7, 10, 1, skd);
      R(g, 1, 3, 2, 2, sk); R(g, 0, 2, 1, 1, sk); R(g, 13, 3, 2, 2, sk); R(g, 15, 2, 1, 1, sk);
      R(g, 6, 4, 2, 2, '#ffe14a'); R(g, 11, 4, 2, 2, '#ffe14a'); R(g, 7, 5, 1, 1, '#301'); R(g, 12, 5, 1, 1, '#301');
      R(g, 7, 7, 5, 1, '#1e2a12'); R(g, 8, 7, 1, 1, '#fff'); R(g, 11, 7, 1, 1, '#fff');
      R(g, 4, 0, 8, 2, '#6b6258'); R(g, 4, 2, 9, 1, '#4a433c'); R(g, 7, -1, 2, 1, '#6b6258');
      if (f === 0) { R(g, 4, 13, 3, 3, '#3e5e28'); R(g, 9, 13, 3, 3, '#3e5e28'); }
      else { R(g, 3, 13, 3, 2, '#3e5e28'); R(g, 10, 14, 3, 2, '#3e5e28'); }
      R(g, 13, 5 + f, 2, 7, '#7a5230'); R(g, 13, 4 + f, 3, 3, '#5d3c20');
    });
    S.wolf = frames(2, 26, 16, (g, f) => {
      const c1 = '#4b4a5c', c2 = '#33323f', c3 = '#6a697c';
      R(g, 4, 5, 15, 6, c1); R(g, 5, 4, 12, 1, c3); R(g, 5, 10, 12, 1, c2);
      R(g, 0, 4 + f, 5, 2, c1); R(g, 0, 3 + f, 2, 1, c3);
      R(g, 17, 3, 6, 6, c1); R(g, 22, 6, 4, 3, c1); R(g, 25, 6, 1, 1, '#111'); R(g, 22, 9, 3, 1, c2); R(g, 23, 9, 1, 1, '#fff');
      R(g, 17, 1, 2, 2, c1); R(g, 20, 1, 2, 2, c1); R(g, 21, 5, 1, 1, '#ff4030'); R(g, 17, 3, 5, 1, c3);
      if (f === 0) { R(g, 5, 11, 2, 5, c2); R(g, 9, 11, 2, 4, c2); R(g, 14, 11, 2, 4, c2); R(g, 17, 11, 2, 5, c2); }
      else { R(g, 3, 11, 3, 3, c2); R(g, 8, 11, 2, 5, c2); R(g, 13, 11, 2, 5, c2); R(g, 18, 11, 3, 3, c2); }
    });
    S.spider = frames(2, 18, 13, (g, f) => {
      const b = '#241a33', b2 = '#3a2b52';
      for (let i = 0; i < 4; i++) {
        const yy = 3 + i * 2 + ((i + f) % 2);
        R(g, 1 + (i % 2), yy, 5, 1, b); R(g, 0 + (i % 2), yy + 1, 1, 3, b);
        R(g, 12 - (i % 2), yy, 5, 1, b); R(g, 17 - (i % 2), yy + 1, 1, 3, b);
      }
      R(g, 5, 2, 8, 7, b); R(g, 6, 1, 6, 1, b); R(g, 6, 9, 6, 2, b2);
      R(g, 8, 3, 2, 3, '#d0306a'); R(g, 7, 4, 4, 1, '#d0306a');
      R(g, 6, 9, 2, 1, '#ff5050'); R(g, 10, 9, 2, 1, '#ff5050'); R(g, 7, 11, 1, 1, '#ddd'); R(g, 10, 11, 1, 1, '#ddd');
    });
    S.bat = frames(3, 18, 12, (g, f) => {
      const b = '#6a4fa0', b2 = '#8e72c8';
      R(g, 7, 4, 4, 6, b); R(g, 7, 2, 1, 2, b); R(g, 10, 2, 1, 2, b);
      R(g, 7, 6, 1, 1, '#ff4040'); R(g, 10, 6, 1, 1, '#ff4040');
      if (f === 2) { R(g, 6, 4, 1, 7, b2); R(g, 11, 4, 1, 7, b2); R(g, 5, 6, 1, 4, b); R(g, 12, 6, 1, 4, b); }
      else if (f === 0) { R(g, 1, 2, 6, 3, b); R(g, 0, 1, 3, 2, b2); R(g, 11, 2, 6, 3, b); R(g, 15, 1, 3, 2, b2); R(g, 2, 5, 1, 1, b); R(g, 15, 5, 1, 1, b); }
      else { R(g, 1, 6, 6, 3, b); R(g, 0, 8, 3, 2, b2); R(g, 11, 6, 6, 3, b); R(g, 15, 8, 3, 2, b2); }
    });
    S.wraith = frames(2, 20, 26, (g, f) => {
      const c1 = '#15152a', c2 = '#2c2c50', c3 = '#454578';
      for (let y = 0; y < 24; y++) {
        const w = y < 6 ? 4 + y : y < 16 ? 10 + (y - 6) * 0.3 : 13 + (y - 16) * 0.2;
        const xl = Math.round(10 - w / 2 + Math.sin(y * 0.5 + f * 3) * (y > 12 ? 1 : 0));
        R(g, xl, y, Math.round(w), 1, c1); R(g, xl, y, 1, 1, c2); R(g, xl + Math.round(w) - 1, y, 1, 1, c2);
      }
      for (let i = 0; i < 5; i++) R(g, 4 + i * 3 + f, 24, 2, 2 - ((i + f) % 2), c1);
      R(g, 7, 3, 7, 5, '#07070f'); R(g, 8, 5, 2, 1, '#c8fbff'); R(g, 12, 5, 2, 1, '#c8fbff');
      R(g, 6, 1, 8, 1, c3); R(g, 5, 2, 1, 3, c3);
      R(g, 14, 11 + f, 5, 2, c2); R(g, 18, 12 + f, 2, 1, '#9db'); R(g, 1, 12 - f, 4, 2, c2);
    });
    S.troll = frames(2, 30, 34, (g, f) => {
      const c1 = '#7d8291', c2 = '#5b5f6d', c3 = '#9aa0b0', lo = '#5a3d28';
      R(g, 7, 11, 16, 14, c1); R(g, 8, 11, 14, 2, c3); R(g, 7, 22, 16, 3, c2); R(g, 10, 15, 3, 2, c2); R(g, 17, 18, 4, 2, c2);
      R(g, 8, 23, 14, 4, lo); R(g, 9, 27, 3, 1, lo); R(g, 14, 27, 4, 2, lo);
      R(g, 11, 3, 10, 9, c1); R(g, 11, 3, 10, 1, c3); R(g, 11, 6, 10, 2, c2);
      R(g, 13, 8, 2, 1, '#ffd040'); R(g, 18, 8, 2, 1, '#ffd040'); R(g, 20, 9, 2, 2, c2);
      R(g, 12, 10, 8, 2, c2); R(g, 13, 9, 1, 2, '#fff'); R(g, 18, 9, 1, 2, '#fff');
      R(g, 9, 5, 2, 3, c1); R(g, 21, 5, 1, 3, c1);
      R(g, 3, 12, 5, 12 + f, c1); R(g, 3, 23 + f, 5, 3, c2);
      R(g, 22, 12, 5, 9, c1); R(g, 23, 19 - f, 5, 4, c2);
      R(g, 25, 2 - f + 1, 4, 18, '#6b4a2a'); R(g, 24, 1, 6, 7, '#553a20'); R(g, 25, 2, 1, 4, '#8a6a44'); R(g, 29, 4, 1, 1, '#ccc'); R(g, 24, 3, 1, 1, '#ccc');
      if (f === 0) { R(g, 8, 27, 6, 7, c2); R(g, 16, 27, 6, 7, c2); R(g, 8, 32, 7, 2, c1); R(g, 16, 32, 7, 2, c1); }
      else { R(g, 7, 27, 6, 6, c2); R(g, 17, 28, 6, 6, c2); R(g, 7, 31, 7, 2, c1); R(g, 17, 32, 7, 2, c1); }
      R(g, 9, 13, 2, 1, '#6f8f52'); R(g, 19, 12, 2, 1, '#6f8f52'); R(g, 15, 4, 2, 1, '#6f8f52');
    });
    S.ember = frames(3, 12, 16, (g, f) => {
      const o = [0, 1, 0][f];
      R(g, 3, 5, 6, 9, '#ff7a1a'); R(g, 2, 7, 8, 6, '#ff7a1a'); R(g, 4, 3 - o, 3, 3, '#ff7a1a'); R(g, 5 + (f === 2 ? 1 : 0), 0 + o, 2, 3, '#ff5010'); R(g, 8, 4 + o, 2, 2, '#ff5010'); R(g, 1, 5 - o, 2, 2, '#ff5010');
      R(g, 4, 7, 4, 6, '#ffd040'); R(g, 5, 9, 2, 4, '#fff6b0');
      R(g, 4, 8, 1, 2, '#401000'); R(g, 7, 8, 1, 2, '#401000');
    });
  }

  /* ---------- items & props ---------- */
  function buildItems() {
    S.shard = frames(4, 9, 11, (g, f) => {
      const w = [7, 5, 1, 5][f], x0 = 4 - (w >> 1);
      for (let y = 0; y < 11; y++) {
        const k = 1 - Math.abs(y - 5) / 5.5, ww = Math.max(1, Math.round(w * k));
        R(g, 4 - (ww >> 1), y, ww, 1, y < 5 ? '#d8fbff' : '#7fd8f0');
      }
      if (w > 3) { R(g, x0 + 2, 3, 1, 3, '#ffffff'); R(g, 4, 6, 1, 3, '#4fb0d8'); }
      R(g, 4, 0, 1, 1, '#fff');
    });
    S.cake = spr(12, 10, g => {
      R(g, 1, 3, 10, 6, '#e8b860'); R(g, 2, 2, 8, 1, '#f4d088'); R(g, 1, 8, 10, 1, '#b88838'); R(g, 0, 4, 1, 4, '#c89848'); R(g, 11, 4, 1, 4, '#c89848');
      R(g, 3, 4, 6, 1, '#fff0c0'); R(g, 5, 3, 2, 4, '#fff0c0'); R(g, 2, 6, 1, 1, '#b88838'); R(g, 9, 6, 1, 1, '#b88838');
      R(g, 3, 0, 5, 2, '#5cae4e'); R(g, 6, 1, 4, 1, '#3f8a3a');
    });
    S.bloom = frames(2, 14, 16, (g, f) => {
      R(g, 6, 8, 2, 8, '#3f9a5a'); R(g, 3, 11, 3, 2, '#3f9a5a'); R(g, 8, 12, 3, 2, '#56b870');
      const p = f ? '#ffffff' : '#d8f8ff', p2 = '#8fe0ff';
      R(g, 5, 0, 4, 3, p); R(g, 5, 7, 4, 3, p); R(g, 1, 3, 3, 4, p); R(g, 10, 3, 3, 4, p);
      R(g, 2, 1, 3, 3, p2); R(g, 9, 1, 3, 3, p2); R(g, 2, 6, 3, 3, p2); R(g, 9, 6, 3, 3, p2);
      R(g, 4, 3, 6, 4, '#fff6a8'); R(g, 6, 4, 2, 2, '#ffc840');
    });
    S.leaf = spr(12, 12, g => {
      const c = '#e6f2ff', d = '#9fb6d8';
      for (let i = 0; i < 9; i++) { const w = [2, 4, 6, 7, 7, 6, 5, 3, 1][i]; R(g, 10 - i - (w >> 1), i + 1, w, 1, c); }
      for (let i = 0; i < 8; i++) R(g, 9 - i, 2 + i, 1, 1, d);
      R(g, 1, 10, 2, 1, d); R(g, 0, 11, 1, 1, d); R(g, 7, 2, 2, 1, '#fff');
    });
    S.arrow = spr(12, 3, g => { R(g, 0, 1, 9, 1, '#fff'); R(g, 9, 0, 2, 3, '#bff4ff'); R(g, 11, 1, 1, 1, '#fff'); R(g, 0, 0, 2, 1, '#8fe0ff'); R(g, 0, 2, 2, 1, '#8fe0ff'); });
    S.heart = spr(9, 8, g => {
      const c = '#7af0c0', d = '#2fa57e';
      R(g, 1, 0, 3, 1, c); R(g, 5, 0, 3, 1, c); R(g, 0, 1, 9, 3, c); R(g, 1, 4, 7, 1, c); R(g, 2, 5, 5, 1, c); R(g, 3, 6, 3, 1, c); R(g, 4, 7, 1, 1, c);
      R(g, 5, 3, 3, 1, d); R(g, 5, 4, 3, 1, d); R(g, 4, 5, 3, 1, d); R(g, 4, 6, 2, 1, d); R(g, 2, 1, 1, 1, '#fff');
    });
    S.heartEmpty = spr(9, 8, g => {
      const c = '#46587c';
      R(g, 1, 0, 3, 1, c); R(g, 5, 0, 3, 1, c); R(g, 0, 1, 9, 3, c); R(g, 1, 4, 7, 1, c); R(g, 2, 5, 5, 1, c); R(g, 3, 6, 3, 1, c); R(g, 4, 7, 1, 1, c);
    });
    S.quiver = spr(3, 8, g => { R(g, 1, 0, 1, 8, '#e8fbff'); R(g, 0, 1, 3, 1, '#9fe8ff'); R(g, 0, 6, 1, 2, '#9fe8ff'); R(g, 2, 6, 1, 2, '#9fe8ff'); });
    S.quiverEmpty = spr(3, 8, g => { R(g, 1, 0, 1, 8, '#2a3a48'); });
    S.lantern = frames(2, 12, 26, (g, f) => {
      R(g, 5, 8, 2, 18, '#7b8496'); R(g, 4, 24, 4, 2, '#5a6272'); R(g, 5, 8, 1, 18, '#a9b2c4');
      R(g, 2, 0, 8, 1, '#a9b2c4'); R(g, 3, 1, 6, 7, f ? '#dffbff' : '#39424f'); R(g, 2, 1, 1, 7, '#7b8496'); R(g, 9, 1, 1, 7, '#7b8496'); R(g, 2, 8, 8, 1, '#a9b2c4');
      R(g, 5, -1, 2, 1, '#a9b2c4');
      if (f) { R(g, 5, 3, 2, 4, '#fff'); R(g, 4, 4, 4, 2, '#aef4ff'); }
    });
    S.tonttu = frames(2, 14, 16, (g, f) => {
      const red = '#c8362c', redD = '#8e2420';
      for (let y = 0; y < 7; y++) { const wdt = 1 + y * 1.3 | 0; R(g, 7 - (wdt >> 1) + (y < 2 ? 1 + f : 0), y, wdt, 1, y % 3 === 2 ? redD : red); }
      R(g, 9 + f, 0, 1, 1, '#ffffff'); R(g, 2, 7, 10, 1, redD);
      R(g, 4, 8, 6, 2, '#f2c9a2'); R(g, 5, 8, 1, 1, '#2a2a3a'); R(g, 8, 8, 1, 1, '#2a2a3a'); R(g, 6, 9, 2, 2, '#e09a84');
      R(g, 3, 10, 8, 4, '#f6f6f6'); R(g, 4, 14, 6, 1, '#e0e0e8'); R(g, 6, 11, 2, 1, '#e0e0e8');
      R(g, 2, 11, 1, 4, '#6a7488'); R(g, 11, 11, 1, 4, '#6a7488'); R(g, 1, 12 + f, 1, 2, '#f2c9a2'); R(g, 12, 12, 1, 2, '#f2c9a2');
      R(g, 3, 15, 3, 1, '#3a2a20'); R(g, 8, 15, 3, 1, '#3a2a20');
    });
    S.gemIcon = spr(7, 7, g => { const c1 = '#fff2b0', c2 = '#c8a040'; R(g, 1, 0, 5, 1, '#ffffff'); R(g, 0, 1, 7, 2, c1); R(g, 1, 3, 5, 1, c1); R(g, 2, 4, 3, 1, c2); R(g, 3, 5, 1, 2, c2); R(g, 3, 1, 1, 3, '#ffffff'); });
    S.rune = spr(14, 16, g => {
      R(g, 2, 2, 10, 14, '#767c8c'); R(g, 3, 1, 8, 1, '#767c8c'); R(g, 4, 0, 6, 1, '#8d93a3'); R(g, 2, 2, 1, 14, '#9aa0b0'); R(g, 11, 3, 1, 13, '#565b69');
      R(g, 6, 4, 1, 8, '#9ff4ff'); R(g, 5, 5, 3, 1, '#9ff4ff'); R(g, 8, 7, 1, 2, '#9ff4ff'); R(g, 4, 9, 2, 1, '#9ff4ff');
      R(g, 1, 15, 12, 1, '#565b69');
    });
    S.beacon = spr(40, 56, g => {
      const s1 = '#8a8f9c', s2 = '#6a6f7c', s3 = '#aab0bd', s4 = '#4c505c';
      for (let y = 14; y < 56; y++) {
        const w = 22 + Math.round((y - 14) * 0.22), xl = 20 - (w >> 1);
        R(g, xl, y, w, 1, s1); R(g, xl, y, 2, 1, s3); R(g, xl + w - 3, y, 3, 1, s2);
      }
      for (let y = 18; y < 56; y += 6) for (let x = 8 + ((y / 6 | 0) % 2) * 4; x < 32; x += 8) { R(g, x, y, 1, 6, s2); }
      for (let y = 17; y < 56; y += 6) R(g, 7, y, 26, 1, s2);
      R(g, 5, 10, 30, 5, s1); R(g, 5, 10, 30, 1, s3); R(g, 5, 14, 30, 1, s4);
      for (let x = 5; x < 35; x += 6) { R(g, x, 6, 4, 4, s1); R(g, x, 6, 4, 1, s3); }
      R(g, 16, 40, 8, 16, '#23242c'); R(g, 17, 38, 6, 2, '#23242c'); R(g, 18, 37, 4, 1, '#23242c');
      R(g, 12, 5, 16, 3, '#6b4a2a'); R(g, 14, 2, 12, 3, '#553a20'); R(g, 13, 4, 3, 1, '#8a6a44'); R(g, 20, 1, 3, 1, '#8a6a44'); R(g, 17, 0, 6, 2, '#6b4a2a');
    });
  }

  /* ---------- tiles ---------- */
  const tileSets = {};
  function tileSet(th) {
    if (tileSets[th.id]) return tileSets[th.id];
    const P = th.tiles, r = rng(th.seed || 7);
    const set = { fill: [], cap: [], left: null, right: null };
    for (let v = 0; v < 6; v++) set.fill.push(spr(T, T, g => {
      R(g, 0, 0, T, T, P.body);
      if (P.style === 'brick') {
        R(g, 0, 7, T, 1, P.dark); R(g, 0, 15, T, 1, P.dark);
        R(g, 4 + v * 2, 0, 1, 7, P.dark); R(g, (11 + v * 3) % 16, 8, 1, 7, P.dark);
        R(g, 0, 0, T, 1, P.light); R(g, 0, 8, T, 1, P.light);
        if (v === 2) { R(g, 9, 10, 3, 2, P.speck); R(g, 11, 12, 2, 1, P.speck); R(g, 8, 11, 1, 1, '#e08a50'); } if (v === 5) { R(g, 3, 3, 2, 2, P.speck); R(g, 4, 2, 2, 1, '#e08a50'); }
      } else if (P.style === 'rock') {
        for (let i = 0; i < 3; i++) R(g, r() * 12, r() * 14, 3 + r() * 3, 1 + r() * 2, r() < 0.5 ? P.dark : P.light);
        if (v === 1) { const vein = [[4, 2], [4, 3], [5, 4], [5, 5], [6, 6], [7, 7], [7, 8], [8, 9], [6, 7], [5, 8], [4, 9], [9, 10], [9, 11]]; for (const [x, y] of vein) R(g, x - 1, y, 3, 1, '#6a2010'); for (const [x, y] of vein) R(g, x, y, 1, 1, P.speck); }
        if (v === 3) { R(g, 10, 3, 1, 3, P.dark); }
      } else {
        for (let i = 0; i < 3; i++) R(g, r() * 13, r() * 15, 2 + r() * 2, 1, r() < 0.6 ? P.dark : P.light);
        if (v === 0) { R(g, 3, 5, 5, 3, P.speck); R(g, 4, 4, 3, 1, P.speck); R(g, 3, 5, 4, 1, P.light); R(g, 4, 8, 4, 1, P.dark); }
        if (v === 2) { R(g, 9, 10, 4, 2, P.speck); R(g, 9, 10, 3, 1, P.light); R(g, 10, 12, 3, 1, P.dark); }
        if (v === 3) { R(g, 1, 12, 7, 1, P.dark); R(g, 8, 13, 5, 1, P.dark); }
      }
    }));
    for (let v = 0; v < 4; v++) set.cap.push(spr(T, 8, g => {
      R(g, 0, 0, T, 3, P.cap);
      R(g, 0, 0, T, 1, P.capHi);
      for (let x = 0; x < T; x++) { const d = 1 + (r() * 3 | 0); R(g, x, 3, 1, d, P.capDark); if (r() < 0.25) R(g, x, 1, 1, 1, P.capHi); }
      if (P.capDots) for (let i = 0; i < 2; i++) R(g, r() * 15, 1 + r() * 2, 1, 1, P.capDots);
    }));
    set.plat = spr(T, 8, g => {
      if (P.platStyle === 'stone') {
        R(g, 0, 0, T, 6, P.plat); R(g, 0, 0, T, 1, P.platHi); R(g, 0, 5, T, 1, P.platDark); R(g, 7, 1, 1, 4, P.platDark); R(g, 1, 6, 3, 1, P.platDark); R(g, 11, 6, 4, 1, P.platDark);
      } else {
        R(g, 0, 0, T, 5, P.plat); R(g, 0, 0, T, 1, P.platHi); R(g, 0, 4, T, 1, P.platDark); R(g, 7, 0, 1, 5, P.platDark); R(g, 2, 2, 3, 1, P.platDark); R(g, 10, 2, 4, 1, P.platDark);
        R(g, 3, 5, 2, 2, P.platDark); R(g, 11, 5, 2, 2, P.platDark);
      }
    });
    set.brick = spr(T, T, g => {
      R(g, 0, 0, T, T, P.brick); R(g, 0, 0, T, 1, P.brickHi); R(g, 0, 0, 1, T, P.brickHi);
      R(g, 0, 7, T, 1, P.brickDark); R(g, 0, 15, T, 1, P.brickDark); R(g, 15, 0, 1, T, P.brickDark);
      R(g, 7, 0, 1, 7, P.brickDark); R(g, 3, 8, 1, 7, P.brickDark); R(g, 11, 8, 1, 7, P.brickDark);
      R(g, 8, 1, 6, 1, P.brickHi); R(g, 4, 9, 6, 1, P.brickHi);
    });
    set.rune = frames(4, T, T, (g, f) => {
      R(g, 0, 0, T, T, '#c9a44a'); R(g, 0, 0, T, 1, '#f4dc8a'); R(g, 0, 0, 1, T, '#f4dc8a'); R(g, 0, 15, T, 1, '#7a5c1e'); R(g, 15, 0, 1, T, '#7a5c1e');
      R(g, 1, 1, 1, 1, '#7a5c1e'); R(g, 14, 1, 1, 1, '#7a5c1e'); R(g, 1, 14, 1, 1, '#7a5c1e'); R(g, 14, 14, 1, 1, '#7a5c1e');
      const c = ['#fffbe0', '#bff4ff', '#7fe0ff', '#bff4ff'][f];
      // eight-pointed star rune
      R(g, 7, 3, 2, 10, c); R(g, 3, 7, 10, 2, c); R(g, 5, 5, 1, 1, c); R(g, 10, 5, 1, 1, c); R(g, 5, 10, 1, 1, c); R(g, 10, 10, 1, 1, c);
      R(g, 6, 6, 4, 4, c); R(g, 7, 7, 2, 2, '#fff');
    });
    set.used = spr(T, T, g => {
      R(g, 0, 0, T, T, '#6c6252'); R(g, 0, 0, T, 1, '#8a7e6a'); R(g, 0, 0, 1, T, '#8a7e6a'); R(g, 0, 15, T, 1, '#463e32'); R(g, 15, 0, 1, T, '#463e32');
      R(g, 7, 5, 2, 6, '#544a3c'); R(g, 5, 7, 6, 2, '#544a3c');
    });
    set.spike = spr(T, T, g => {
      for (let i = 0; i < 4; i++) for (let y = 0; y < 10; y++) {
        const w = Math.max(1, Math.round(y * 0.4));
        R(g, i * 4 + 2 - (w >> 1), 6 + y, w, 1, y < 3 ? P.spikeHi : P.spike);
      }
    });
    return tileSets[th.id] = set;
  }

  /* ---------- small pixel digits for HUD ---------- */
  const DIG = ['010101101101010', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
  function digits(c, str, x, y, col) {
    c.fillStyle = col || '#fff';
    for (const chr of String(str)) {
      if (chr === '/') { c.fillRect(x + 2, y - 1, 1, 2); c.fillRect(x + 1, y + 1, 1, 3); c.fillRect(x, y + 4, 1, 2); x += 4; continue; }
      if (chr === 'x') { c.fillRect(x, y + 1, 1, 1); c.fillRect(x + 2, y + 1, 1, 1); c.fillRect(x + 1, y + 2, 1, 1); c.fillRect(x, y + 3, 1, 1); c.fillRect(x + 2, y + 3, 1, 1); x += 4; continue; }
      const d = DIG[+chr];
      if (d) for (let i = 0; i < 15; i++) if (d[i] === '1') c.fillRect(x + i % 3, y + (i / 3 | 0), 1, 1);
      x += 4;
    }
    return x;
  }

  function padded(img, col) { const o = outlined(spr(img.width + 2, img.height + 2, g => g.drawImage(img, 1, 1)), col); o.pad = 1; return o; }
  function init() { buildQueen(); buildFoes(); buildItems();
    for (const k of ['goblin', 'wolf', 'spider', 'bat', 'troll', 'tonttu', 'bloom']) S[k] = S[k].map(im => padded(im, '#0e0c1c'));
    S.cake = padded(S.cake, '#3a2410'); S.shard = S.shard.map(im => { const o = spr(11, 13, g => g.drawImage(im, 1, 1)); return outlined(o, '#1c3a6a'); }); }

  return { S, init, spr, blit, glow, flashOf, tileSet, digits, drawQueen, Q, gemSprite, outlined };
})();
