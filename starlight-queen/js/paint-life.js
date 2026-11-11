'use strict';
/* Starlight Queen — painted life: the creatures of each land, the Hoarder King, and the small things found along the road */
(() => {
  const { rr, vgrad, disc, soft, star4 } = Paint;
  const ell = (g, x, y, rx, ry, rot) => { g.moveTo(x + rx, y); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };
  const tri = (g, x0, y0, x1, y1, x2, y2) => { g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath(); };
  const W1 = '#ffffff';

  /* Each land has its own creatures: the same habits, a different animal. [kind][land] -> colours and a shape. */
  const SKIN = {
    goblin: {
      north: { shape: 'imp', body: '#6276ae', dark: '#3a4878', eye: '#ffe36a', ears: 1 },            // hiisi
      meads: { shape: 'imp', body: '#5f9150', dark: '#3a6238', eye: '#20301c', crown: 1, nose: 1 },  // småtroll, in a midsummer crown
      halls: { shape: 'imp', body: '#646a8c', dark: '#3a3f5c', eye: '#ffe9a0', lamp: 1 },            // gruvrå, the mine-folk
      canyon: { shape: 'hare', body: '#cfa878', dark: '#96724a', eye: '#2a1a14' },                   // jackalope
      gloam: { shape: 'imp', body: '#6a4450', dark: '#40262e', eye: '#ffb060', ears: 1, cinder: 1 },
      oz: { shape: 'toad', body: '#8f8c4c', dark: '#5e5c2c', eye: '#20180a', belly: '#dcd090' }      // cane toad
    },
    wolf: {
      north: { body: '#7484b4', dark: '#4a5680', eye: '#ffe36a' }, meads: { body: '#6a6f86', dark: '#444860', eye: '#ffe36a' }, halls: { body: '#4a5070', dark: '#2c3048', eye: '#ffe9a0' },
      canyon: { body: '#c79c68', dark: '#8e6a40', eye: '#2a1a14', slim: 1 }, gloam: { body: '#6a4450', dark: '#40262e', eye: '#ffb060' }, oz: { body: '#e2ac5e', dark: '#aa7a34', eye: '#2a1808', slim: 1, curl: 1 }
    },
    bat: {
      north: { shape: 'owl', body: '#f1f4ff', dark: '#b7c3e4', eye: '#ffcf40' }, meads: { shape: 'bat', body: '#5a4a86', dark: '#392f5c', eye: '#ffd0d0' }, halls: { shape: 'bat', body: '#4a4470', dark: '#2a2648', eye: '#ffd0d0' },
      canyon: { shape: 'gull', body: '#f7f7f4', dark: '#a9b0bf', eye: '#20202a' }, gloam: { shape: 'bat', body: '#6a4450', dark: '#40262e', eye: '#ffb060' }, oz: { shape: 'gull', body: '#17171d', dark: '#f1f1f1', eye: '#c84a30', pied: 1 }
    },
    spider: {
      north: { body: '#3a3560', dark: '#231f40', eye: '#ff7a8a' }, meads: { body: '#3f3a66', dark: '#262246', eye: '#ff7a8a' }, halls: { body: '#34304f', dark: '#1c1a30', eye: '#ff7a8a' },
      canyon: { body: '#6a3a40', dark: '#3c1c24', eye: '#ffd070' }, gloam: { body: '#6a4450', dark: '#40262e', eye: '#ffb060' }, oz: { shape: 'bear', body: '#8f94a0', dark: '#666b7a', eye: '#201410' }
    },
    troll: {
      north: { body: '#6c7594', dark: '#434a66', eye: '#ffe36a', snow: 1 }, meads: { body: '#6f7f6a', dark: '#46543f', eye: '#ffe36a', moss: 1 }, halls: { body: '#646a88', dark: '#3a3f5a', eye: '#ffe9a0' },
      canyon: { body: '#8a5a3c', dark: '#573620', eye: '#ffe9a0', shag: 1 }, gloam: { body: '#6a5a70', dark: '#3a3046', eye: '#ffb060', helm: 1 }, oz: { body: '#a8683c', dark: '#6a3c20', eye: '#ffe9a0', shag: 1, moss: 0 }
    }
  };
  const skin = (kind, land) => (SKIN[kind] && (SKIN[kind][land === 'sea' ? 'canyon' : land] || SKIN[kind].north)) || {};
  const WHITE = { body: W1, dark: W1, eye: W1, belly: W1 };

  // (x, y) is the middle of the creature's feet; o: dir, flash, fast, st, squash
  Paint.creature = function (g, kind, land, x, y, t, o) {
    o = o || {};
    let K = skin(kind, land); if (o.flash) K = Object.assign({}, K, WHITE);
    g.save(); g.translate(x, y); g.scale(o.dir < 0 ? -1 : 1, 1); g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'goblin') {
      if (K.shape === 'toad') {
        const hop = Math.max(0, Math.sin(t * 0.16)), yy = -hop * 3;
        g.fillStyle = K.dark; g.beginPath(); ell(g, -4.6, -1, 2.6, 1.2); ell(g, 4.4, -1, 2.4, 1.2); g.fill();
        g.fillStyle = K.body; g.beginPath(); ell(g, 0, -4.6 + yy, 6.6, 4.4); ell(g, 2.2, -8.6 + yy, 1.9, 1.7); ell(g, 5, -8 + yy, 1.7, 1.6); g.fill();
        g.fillStyle = K.belly; g.beginPath(); ell(g, 1, -3 + yy, 4.6, 2.2); g.fill();
        g.fillStyle = K.dark; for (const [a, b] of [[-3, -6], [-1, -7.4], [-4.4, -3.6]]) { g.beginPath(); ell(g, a, b + yy, 0.7, 0.6); g.fill(); }
        disc(g, 2.4, -8.8 + yy, 0.7, K.eye); disc(g, 5.2, -8.2 + yy, 0.7, K.eye);
      } else if (K.shape === 'hare') {
        const hop = Math.abs(Math.sin(t * 0.2)), yy = -hop * 2.4;
        g.fillStyle = K.dark; g.beginPath(); ell(g, -3.4, -1 - hop, 2.8, 1.2); ell(g, 3, -1, 1.8, 1); g.fill();
        g.fillStyle = K.body; g.beginPath(); ell(g, -0.6, -5 + yy, 5.4, 4.2); ell(g, 3.8, -8.4 + yy, 2.9, 2.6); ell(g, 2.4, -13 + yy, 0.9, 3, -0.25); ell(g, 4.4, -13 + yy, 0.9, 3, 0.2); g.fill();
        disc(g, -5.6, -6 + yy, 1.6, '#f6ead6'); disc(g, 5, -8.8 + yy, 0.6, K.eye);
        g.strokeStyle = '#f0e6d2'; g.lineWidth = 0.6; g.beginPath(); for (const s of [-1, 1]) { const ax = 3.4 + s * 1.2; g.moveTo(ax, -10.8 + yy); g.lineTo(ax + s * 1.6, -15 + yy); g.moveTo(ax + s * 0.8, -13 + yy); g.lineTo(ax + s * 2.6, -13.6 + yy); g.moveTo(ax + s * 1.2, -14 + yy); g.lineTo(ax + s * 0.6, -16.2 + yy); } g.stroke();
      } else {
        const st = Math.sin(t * 0.28) * 1.6, bob = Math.abs(Math.cos(t * 0.28)) * 0.7;
        g.fillStyle = K.dark; g.beginPath(); ell(g, -2.6 + st, -0.9, 2.3, 1.1); ell(g, 2.6 - st, -0.9, 2.3, 1.1); g.fill();
        g.fillStyle = K.body; g.beginPath(); ell(g, 0, -6.8 - bob, 5.7, 6);
        if (K.ears) { tri(g, -4.6, -9 - bob, -8.6, -13.4 - bob, -2.6, -11.6 - bob); tri(g, 4.6, -9 - bob, 8.2, -13.8 - bob, 2.4, -11.8 - bob); }
        g.fill();
        g.fillStyle = K.dark; g.globalAlpha = 0.5; g.beginPath(); ell(g, -1.6, -4.8 - bob, 3.6, 3.4); g.fill(); g.globalAlpha = 1;
        if (K.nose) disc(g, 4.6, -6.4 - bob, 1.5, mix(K.body, '#ffffff', 0.18));
        if (K.eye !== W1 && (K.cinder || K.lamp || K.ears)) soft(g, 2.6, -8.4 - bob, 4, K.eye, 0.35);
        disc(g, 1.2, -8.4 - bob, 0.85, K.eye); disc(g, 4, -8.4 - bob, 0.85, K.eye);
        if (K.crown) { g.fillStyle = '#4ea848'; g.beginPath(); rr(g, -4.6, -13.2 - bob, 9.2, 1.5, 0.7); g.fill(); disc(g, -3, -13.6 - bob, 1.1, '#ffe36a'); disc(g, 0, -14 - bob, 1.2, '#ff8aa8'); disc(g, 3, -13.6 - bob, 1.1, '#ffffff'); }
        if (K.lamp) { g.fillStyle = '#3a3f5c'; g.beginPath(); rr(g, -4.4, -13.4 - bob, 8.8, 2.6, 1.2); g.fill(); soft(g, 3.4, -12.4 - bob, 7, '#ffe9a0', 0.5); disc(g, 3.4, -12.3 - bob, 1.1, '#fff3c4'); }
        if (K.cinder) { g.strokeStyle = '#ff7a20'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(-2, -3.4 - bob); g.lineTo(-0.6, -5.4 - bob); g.lineTo(-2.2, -6.6 - bob); g.stroke(); }
      }
    } else if (kind === 'wolf') {
      const sp = o.fast ? 0.5 : 0.24, a = t * sp, h = K.slim ? 3 : 3.7, still = o.still;
      g.strokeStyle = K.dark; g.lineWidth = 1.5; g.beginPath();
      for (const [lx, ph] of [[-6, 0], [-4.4, Math.PI], [4.4, Math.PI * 0.5], [6, Math.PI * 1.5]]) { const s = still ? 0 : Math.sin(a + ph) * (o.fast ? 3.4 : 1.8); g.moveTo(lx, -5); g.lineTo(lx + s, -0.6); }
      g.stroke();
      g.fillStyle = K.body; g.beginPath(); ell(g, 0, -6.8, 8.2, h); ell(g, 6.6, -8.8, 3.6, 2.9, -0.3); tri(g, 8, -9.6, 12.6, -7.8, 8.4, -6.6); tri(g, 5, -10.6, 5.6, -14, 7.6, -10.8); tri(g, 7, -10.8, 8.4, -13.6, 9.2, -10.4);
      if (K.curl) { g.moveTo(-7.4, -8.4); g.quadraticCurveTo(-12, -9, -11, -13.4); g.quadraticCurveTo(-9, -12, -7, -6.4); } else { g.moveTo(-7.4, -8.4); g.quadraticCurveTo(-11.6, -8.6, -13.4, -4.4 + Math.sin(a) * 0.6); g.quadraticCurveTo(-10.4, -5, -7, -5.6); }
      g.fill();
      g.fillStyle = K.dark; g.globalAlpha = 0.45; g.beginPath(); ell(g, -1, -5.4, 6.4, 1.8); g.fill(); g.globalAlpha = 1;
      if (o.fast && K.eye !== W1) soft(g, 8.4, -9.4, 3.6, K.eye, 0.5);
      disc(g, 8.4, -9.4, 0.7, K.eye); disc(g, 12.3, -7.8, 0.6, K.dark);
    } else if (kind === 'bat') { // (x, y) is the middle of the body
      const roost = o.st === 0, f = roost ? 0 : Math.sin(t * 0.42), wy = f * 4.4;
      if (K.shape === 'owl') {
        g.fillStyle = K.dark; g.beginPath(); if (roost) { ell(g, -3.4, 0.6, 1.8, 4.4); ell(g, 3.4, 0.6, 1.8, 4.4); } else { g.moveTo(-2, -1); g.quadraticCurveTo(-8, -4 - wy, -11, -1 - wy * 1.2); g.quadraticCurveTo(-7, 0.6, -2, 2.4); g.moveTo(2, -1); g.quadraticCurveTo(8, -4 - wy, 11, -1 - wy * 1.2); g.quadraticCurveTo(7, 0.6, 2, 2.4); } g.fill();
        g.fillStyle = K.body; g.beginPath(); ell(g, 0, 0.4, 3.6, 4.6); ell(g, 0, -3, 3.4, 2.9); g.fill();
        disc(g, -1.3, -3.2, 1, K.eye); disc(g, 1.3, -3.2, 1, K.eye); disc(g, -1.3, -3.2, 0.45, '#20202a'); disc(g, 1.3, -3.2, 0.45, '#20202a'); g.fillStyle = '#e8b040'; g.beginPath(); tri(g, -0.5, -2.4, 0.5, -2.4, 0, -1.4); g.fill();
      } else if (K.shape === 'gull') {
        g.fillStyle = K.pied ? K.body : K.dark; g.beginPath(); for (const sd of [-1, 1]) { g.moveTo(sd * 1, -0.8); g.quadraticCurveTo(sd * 5, -4 - wy, sd * 10.4, -0.6 - wy * 1.3); g.quadraticCurveTo(sd * 5.6, -1 - wy * 0.5, sd * 1, 1.4); g.closePath(); } g.fill();
        g.fillStyle = K.body; g.beginPath(); ell(g, 0, 0.4, 4.2, 2.2); ell(g, 3.6, -1, 1.8, 1.6); g.fill();
        if (K.pied) { g.fillStyle = K.dark; g.beginPath(); ell(g, -1.6, 0.2, 2, 1.2); ell(g, 2.6, -1.9, 1.1, 0.6); g.fill(); }
        g.fillStyle = K.pied ? '#d8dbe4' : '#f0a030'; g.beginPath(); tri(g, 5, -1.4, 7.4, -0.6, 5, -0.2); g.fill(); disc(g, 4.1, -1.3, 0.45, K.eye);
      } else {
        g.fillStyle = K.dark; g.beginPath();
        if (roost) { ell(g, -2.2, 2, 1.6, 4); ell(g, 2.2, 2, 1.6, 4); }
        else for (const s of [-1, 1]) { g.moveTo(s * 1.4, -1.6); g.quadraticCurveTo(s * 6, -5 - wy, s * 10.4, -2 - wy * 1.3); g.quadraticCurveTo(s * 8.6, 0.4 - wy * 0.5, s * 7.4, 2 - wy * 0.6); g.quadraticCurveTo(s * 6, 0.4, s * 4.6, 2.6); g.quadraticCurveTo(s * 3.4, 1, s * 1.4, 2); g.closePath(); }
        g.fill();
        g.fillStyle = K.body; g.beginPath(); ell(g, 0, 0.6, 2.6, 3.4); tri(g, -2.2, -1.6, -2.6, -4.8, -0.6, -2.4); tri(g, 2.2, -1.6, 2.6, -4.8, 0.6, -2.4); g.fill();
        disc(g, -1, -0.4, 0.55, K.eye); disc(g, 1, -0.4, 0.55, K.eye);
      }
    } else if (kind === 'spider') { // (x, y) is the middle of the body
      if (K.shape === 'bear') { // the drop bear: mostly ears and intent
        const rk = Math.sin(t * 0.1) * 0.12; g.rotate(rk);
        g.fillStyle = K.dark; g.beginPath(); ell(g, -6.6, -2.4, 2.6, 2.6); ell(g, 6.6, -2.4, 2.6, 2.6); g.fill(); g.fillStyle = '#d6dae6'; g.beginPath(); ell(g, -6.6, -2.4, 1.4, 1.4); ell(g, 6.6, -2.4, 1.4, 1.4); g.fill();
        g.fillStyle = K.body; g.beginPath(); ell(g, 0, 1, 6.4, 5.4); g.fill(); g.fillStyle = '#d6dae6'; g.beginPath(); ell(g, 0, 3.4, 3.4, 2.6); g.fill();
        g.fillStyle = K.eye; g.beginPath(); ell(g, 0, 0.6, 1.5, 2); ell(g, -2.8, -0.8, 0.6, 0.6); ell(g, 2.8, -0.8, 0.6, 0.6); g.fill();
        g.strokeStyle = K.dark; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-5.4, 3); g.lineTo(-8.4, 6.4); g.moveTo(5.4, 3); g.lineTo(8.4, 6.4); g.stroke();
      } else {
        g.strokeStyle = K.dark; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const wig = Math.sin(t * 0.3 + i * 1.3) * 0.8, a0 = -0.9 + i * 0.5; g.moveTo(s * 2, 0.6); g.quadraticCurveTo(s * (5 + i * 0.4), -3.4 + i * 1.5 + wig, s * (7.4 - Math.abs(a0) * 0.6), 2.4 + i * 1.5 + wig); } g.stroke();
        g.fillStyle = K.body; g.beginPath(); ell(g, 0, 0.4, 4.4, 3.8); ell(g, 0, 4, 2.6, 2.2); g.fill();
        g.fillStyle = K.dark; g.globalAlpha = 0.5; g.beginPath(); ell(g, -1, -0.6, 2.2, 1.8); g.fill(); g.globalAlpha = 1;
        disc(g, -1.1, 4.2, 0.6, K.eye); disc(g, 1.1, 4.2, 0.6, K.eye);
      }
    } else if (kind === 'troll') {
      const sw = Math.sin(t * 0.1), bob = Math.abs(sw) * 0.8;
      g.fillStyle = K.dark; g.beginPath(); rr(g, -8.4 + sw, -3, 7, 3.2, 1.4); rr(g, 1.4 - sw, -3, 7, 3.2, 1.4); g.fill();
      g.strokeStyle = K.dark; g.lineWidth = 3.6; g.beginPath(); g.moveTo(-8.4, -20 - bob); g.quadraticCurveTo(-12.4, -12, -10 - sw * 2, -5); g.stroke();
      g.fillStyle = vgrad(g, -31, 0, [K.body, K.dark]); g.beginPath(); g.moveTo(-9.4, -2);
      if (K.shag) { for (let i = 0; i < 6; i++) g.lineTo(-9.4 + i * 3.4 + 1.7, -0.2 + (i % 2) * 1.6); }
      g.lineTo(9.4, -2); g.quadraticCurveTo(11.6, -16, 6.4, -26 - bob); g.quadraticCurveTo(1, -31.6 - bob, -5, -26.4 - bob); g.quadraticCurveTo(-11.6, -16, -9.4, -2); g.closePath(); g.fill();
      g.fillStyle = K.dark; g.globalAlpha = 0.45; g.beginPath(); ell(g, 2.6, -21 - bob, 6, 2.2); g.fill(); g.globalAlpha = 1;
      disc(g, 6.6, -18.6 - bob, 2.2, mix(K.body, '#ffffff', 0.12));
      if (K.eye !== W1) soft(g, 4, -21.6 - bob, 5, K.eye, 0.4); disc(g, 2.2, -21.6 - bob, 0.9, K.eye); disc(g, 5.6, -21.6 - bob, 0.9, K.eye);
      g.strokeStyle = K.body; g.lineWidth = 3.8; g.beginPath(); g.moveTo(7.4, -20 - bob); g.quadraticCurveTo(12.6, -13, 10.6 + sw * 2, -5.4); g.stroke();
      if (K.snow) { g.fillStyle = '#edf3ff'; g.beginPath(); g.moveTo(-6.4, -24.6 - bob); g.quadraticCurveTo(0.6, -32.4 - bob, 6.8, -25.4 - bob); g.quadraticCurveTo(1, -28.6 - bob, -6.4, -24.6 - bob); g.fill(); }
      if (K.moss) { g.fillStyle = '#7fd46a'; g.beginPath(); ell(g, -3.6, -27 - bob, 3.4, 1.5); ell(g, 3.4, -28 - bob, 2.4, 1.2); g.fill(); disc(g, -4, -28.4 - bob, 0.8, '#ffe36a'); }
      if (K.helm) { g.fillStyle = '#16121c'; g.beginPath(); g.moveTo(-5.6, -25.4 - bob); g.quadraticCurveTo(0.6, -32.6 - bob, 7, -25.6 - bob); g.lineTo(7, -23.4 - bob); g.lineTo(-5.6, -23.4 - bob); g.closePath(); tri(g, -0.6, -30 - bob, 0.6, -36 - bob, 1.8, -30 - bob); g.fill(); }
    }
    g.restore();
  };
  Paint.wraith = function (g, x, y, t, a, flash, dir) { // a dust-wraith: something kindly that is not there
    g.save(); g.translate(x, y); g.scale(dir < 0 ? -1 : 1, 1); g.globalAlpha = a;
    const s1 = Math.sin(t * 0.09) * 1.6, s2 = Math.sin(t * 0.09 + 1.6) * 2;
    g.fillStyle = flash ? '#ffffff' : vgrad(g, -12, 14, ['rgba(214,255,238,0.95)', 'rgba(150,230,210,0.6)', 'rgba(120,200,200,0)']);
    g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(6.4, -11.4, 6, -3.4); g.quadraticCurveTo(5.6, 3, 3 + s1, 8); g.quadraticCurveTo(1.6 + s2, 12, -1 + s2, 15); g.quadraticCurveTo(-2 + s1, 9, -5, 5); g.quadraticCurveTo(-7, -1, -6, -5); g.quadraticCurveTo(-5.6, -11.6, 0, -12); g.fill();
    g.fillStyle = 'rgba(20,40,50,0.8)'; g.beginPath(); ell(g, 0.2, -6, 0.9, 1.5); ell(g, 3.4, -6, 0.9, 1.5); g.fill();
    g.restore();
  };
  Paint.emberDrop = function (g, x, y, t, down) { g.save(); g.translate(x, y); if (down) g.scale(1, -1); soft(g, 0, 0, 9, '#ff7a20', 0.5); Paint.flame(g, 0, 4, t, 0.62); g.restore(); };

  /* ---------- the Hoarder King ---------- */
  Paint.king = function (g, w, e, fx, fy) {
    const st = e.st, t = w.t, stun = st === 'stun', kneel = stun ? 6 : 0, lean = st === 'tele_charge' ? -3 : st === 'charge' ? 4 : 0;
    const E = stun ? '#7a3a1a' : (t >> 2) % 2 ? '#ff7a20' : '#ffa040', by = -50 + kneel;
    g.save(); g.translate(fx + (st === 'dying' ? rand(-2, 2) : 0), fy); g.scale(e.dir, 1); g.lineCap = 'round'; g.lineJoin = 'round';
    // cape
    const cw = Math.sin(t * 0.08) * 2 + (st === 'charge' ? 9 : 0);
    g.fillStyle = vgrad(g, by + 12, 0, ['#5a141c', '#2a0810']); g.beginPath(); g.moveTo(-6, by + 13); g.quadraticCurveTo(-15 - cw * 0.4, by + 30, -17 - cw, -2 - kneel * 0.4); g.quadraticCurveTo(-11 - cw * 0.5, 1, -5, -3); g.closePath(); g.fill();
    // legs
    g.fillStyle = '#17131d';
    if (stun) { g.beginPath(); rr(g, -8, -10, 7, 10, 2); rr(g, 0, -6, 13, 6, 2); g.fill(); }
    else { const s = st === 'idle' || st === 'charge' ? Math.sin(t * (st === 'charge' ? 0.6 : 0.15)) * 2 : 0; g.beginPath(); rr(g, -8 + s, -15, 7, 15, 2); rr(g, 2 - s, -15, 7, 15, 2); g.fill(); }
    g.translate(lean, 0);
    // body
    g.fillStyle = vgrad(g, by + 12, by + 38, ['#3a3848', '#201c28']); g.beginPath(); g.moveTo(-10.6, by + 15); g.quadraticCurveTo(0, by + 11.6, 10.6, by + 15); g.lineTo(9, by + 38); g.lineTo(-9, by + 38); g.closePath(); g.fill();
    g.fillStyle = '#4a4860'; g.beginPath(); ell(g, -11.4, by + 15.6, 5.4, 4); ell(g, 11.4, by + 15.6, 5.4, 4); tri(g, -14.6, by + 13, -13.4, by + 7, -11, by + 12.4); tri(g, 14.6, by + 13, 13.4, by + 7, 11, by + 12.4); g.fill();
    if (!stun) soft(g, 0, by + 25, 10, '#ff6a20', 0.5); g.fillStyle = E; g.beginPath(); tri(g, -3.4, by + 22, 0, by + 30, 3.4, by + 22); g.fill();
    // head and the Cinder Crown
    g.fillStyle = '#16121c'; g.beginPath(); rr(g, -5.4, by + 1.6, 11.6, 12.6, 3); g.fill();
    g.fillStyle = stun ? '#5a2a10' : '#ff5a1a'; g.beginPath(); rr(g, 0, by + 6.6, 6, 1.7, 0.8); g.fill();
    g.fillStyle = '#5a4e46'; g.beginPath(); rr(g, -6.4, by - 0.4, 13.6, 3.2, 1); for (const [x, h] of [[-5.6, 6], [-2.6, 4], [0.4, 8.4], [3.4, 4], [6.4, 6]]) tri(g, x - 1.1, by, x, by - h, x + 1.1, by); g.fill();
    for (const [x, h] of [[-5.6, 6], [-2.6, 4], [0.4, 8.4], [3.4, 4], [6.4, 6]]) disc(g, x, by - h, 0.9, E);
    // arm and mace
    let ang = 0.3;
    if (st === 'tele_slam') ang = -2.2 - Math.sin(e.t0 * 0.5) * 0.08; else if (st === 'slam') ang = 1.5; else if (st === 'tele_embers' || st === 'embers') ang = -2.9; else if (st === 'tele_charge' || st === 'charge') ang = 1.1; else if (stun) ang = 1.75; else if (st === 'intro') ang = -2.6;
    g.save(); g.translate(9, by + 17); g.rotate(ang);
    g.strokeStyle = '#3a3848'; g.lineWidth = 4.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 11); g.stroke();
    g.strokeStyle = '#6a5642'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(0.6, 9); g.lineTo(0.6, 32); g.stroke();
    g.fillStyle = '#5c5c74'; g.beginPath(); ell(g, 0.6, 35, 4.6, 4.6); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; tri(g, 0.6 + Math.cos(a - 0.3) * 4, 35 + Math.sin(a - 0.3) * 4, 0.6 + Math.cos(a) * 7.4, 35 + Math.sin(a) * 7.4, 0.6 + Math.cos(a + 0.3) * 4, 35 + Math.sin(a + 0.3) * 4); } g.fill(); disc(g, 0.6, 35, 1.5, E);
    g.restore();
    g.strokeStyle = '#3a3848'; g.lineWidth = 4.2; g.beginPath(); g.moveTo(-11, by + 18); g.lineTo(-11.6, by + 31); g.stroke();
    g.restore();
    if (e.flash > 6) soft(g, fx, fy - 26, 28, '#ffffff', 0.5);
    if (!stun && st !== 'wait' && st !== 'dying') soft(g, fx + e.dir * lean, fy - 55 + kneel, 16 + Math.sin(t * 0.2) * 3, '#ff6a20', 0.7);
    if (st === 'tele_embers' || st === 'embers') soft(g, fx, fy - 60, 30, '#ff4a10', 0.7);
    if (stun) for (let i = 0; i < 3; i++) { const a = t * 0.1 + i * 2.1; star4(g, fx + Math.cos(a) * 10, fy - 54 + kneel + Math.sin(a) * 3, 1.6, '#fff6b0', a); }
  };

  /* ---------- small things ---------- */
  Paint.shard = function (g, x, y, t, ph) { // melee: a chip of starlight
    const k = Math.abs(Math.cos(t * 0.07 + ph)), wd = 1 + 2.6 * k;
    soft(g, x, y, 6.5, '#9fe8ff', 0.3);
    g.fillStyle = vgrad(g, y - 5, y + 5, ['#ffffff', '#9fe0ff', '#5fb4f0']); g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + wd, y - 0.6); g.lineTo(x, y + 5); g.lineTo(x - wd, y - 0.6); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + wd * 0.2, y - 0.6); g.lineTo(x, y + 5); g.lineTo(x - wd * 0.5, y - 0.6); g.closePath(); g.fill();
  };
  const FOODS = {
    north: g => { g.fillStyle = '#c88a44'; g.beginPath(); ell(g, 0, 0, 5.6, 4.2); g.fill(); g.strokeStyle = '#7e4c1e'; g.lineWidth = 0.9; g.beginPath(); g.arc(0, 0, 3, 0.4, 5.2); g.moveTo(1.2, 0); g.arc(0, 0, 1.2, 0, 4.4); g.stroke(); for (const [a, b] of [[-3.4, -2], [2.6, -2.8], [0, 3], [3.8, 1.4]]) disc(g, a, b, 0.5, W1); }, // korvapuusti
    meads: g => { g.fillStyle = '#eef4fa'; g.beginPath(); g.moveTo(-5.4, 0); g.quadraticCurveTo(0, 7, 5.4, 0); g.closePath(); g.fill(); g.fillStyle = '#e23c4c'; g.beginPath(); ell(g, -2, -1.2, 2, 2.3); ell(g, 2.2, -0.8, 1.9, 2.1); g.fill(); g.fillStyle = '#4ea848'; g.beginPath(); ell(g, -2, -3.4, 1.2, 0.6); ell(g, 2.2, -2.8, 1.2, 0.6); g.fill(); }, // strawberries and cream
    halls: g => { g.fillStyle = '#b07a44'; g.beginPath(); g.moveTo(-4.4, -2.4); g.lineTo(3.6, -2.4); g.quadraticCurveTo(3.4, 4, -0.4, 4); g.quadraticCurveTo(-4.2, 4, -4.4, -2.4); g.closePath(); g.fill(); g.strokeStyle = '#b07a44'; g.lineWidth = 1.1; g.beginPath(); g.arc(4.4, 0, 1.7, -1.4, 1.5); g.stroke(); g.fillStyle = '#3a2010'; g.beginPath(); ell(g, -0.4, -2.4, 3.8, 1); g.fill(); g.strokeStyle = 'rgba(230,236,250,0.7)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-1.6, -4); g.quadraticCurveTo(-2.6, -5.6, -1.4, -7); g.moveTo(0.8, -4); g.quadraticCurveTo(1.8, -5.6, 0.6, -7.4); g.stroke(); }, // boiled coffee in a kuksa
    canyon: g => { g.fillStyle = '#e8b860'; g.beginPath(); tri(g, -5.6, 3.6, 5.6, 3.6, 3.4, -3.4); g.fill(); g.fillStyle = '#c8843c'; g.beginPath(); rr(g, -6, 2.6, 12, 2, 1); g.fill(); g.fillStyle = '#c8502c'; g.beginPath(); tri(g, -1.6, 1.8, 3.6, 1.8, 2.6, -1.2); g.fill(); }, // apple pie
    gloam: g => { g.fillStyle = '#eec44c'; g.beginPath(); rr(g, -5, -3, 10, 6.6, 1.4); g.fill(); g.fillStyle = '#fbe58c'; g.beginPath(); rr(g, -5, -3, 10, 1.6, 0.8); g.fill(); for (const [a, b] of [[-2, 0.6], [1.6, -0.4], [3, 2]]) disc(g, a, b, 0.5, '#b08a20'); }, // cornbread
    oz: g => { g.fillStyle = '#4c2c1a'; g.beginPath(); rr(g, -4.6, -3.4, 9.2, 7, 1.2); g.fill(); g.fillStyle = '#fff4e0'; g.fillRect(-4.6, -0.4, 9.2, 1); for (const [a, b] of [[-3, -2], [0, -2.6], [3, -1.6], [-2, 2], [1.6, 2.6], [3.4, 1.4]]) disc(g, a, b, 0.5, W1); } // lamington
  };
  Paint.food = function (g, land, x, y) { g.save(); g.translate(x, y); (FOODS[land] || FOODS.north)(g); g.restore(); };
  Paint.bloom = function (g, x, y, t) { // a starbloom: for a while, nothing can touch her
    soft(g, x, y, 13, '#fff6b0', 0.5); g.save(); g.translate(x, y); g.rotate(Math.sin(t * 0.05) * 0.2);
    g.fillStyle = '#fff3c4'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; ell(g, Math.cos(a) * 3.2, Math.sin(a) * 3.2, 2.9, 1.7, a); } g.fill(); star4(g, 0, 0, 2.6, '#ffffff', t * 0.03); g.restore();
  };
  Paint.arrow = function (g, x, y, dir) { g.save(); g.translate(x, y); g.scale(dir, 1); const gr = g.createLinearGradient(-12, 0, 6, 0); gr.addColorStop(0, 'rgba(160,220,255,0)'); gr.addColorStop(1, '#ffffff'); g.strokeStyle = gr; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-12, 0); g.lineTo(6, 0); g.stroke(); star4(g, 6, 0, 2.6, '#ffffff'); g.restore(); soft(g, x + dir * 6, y, 8, '#bff4ff', 0.5); };
  Paint.lantern = function (g, x, y, t, on, warm) { // a wayside lantern on its post: (x, y) is the foot of the post
    const col = warm ? '#ffc868' : '#bff0ff';
    g.strokeStyle = '#2c2a3c'; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 24); g.quadraticCurveTo(x, y - 27, x + 4, y - 27); g.stroke();
    const sw = Math.sin(t * 0.04 + x) * 0.5, lx = x + 4.6 + sw, ly = y - 22.4;
    g.strokeStyle = '#2c2a3c'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x + 4.4, y - 27); g.lineTo(lx, ly - 3); g.stroke();
    if (on) soft(g, lx, ly, 15 + Math.sin(t * 0.1) * 1.5, col, 0.6);
    g.fillStyle = on ? col : '#3a4058'; g.beginPath(); rr(g, lx - 2.2, ly - 3, 4.4, 6, 1.2); g.fill(); if (on) { g.fillStyle = '#ffffff'; g.beginPath(); rr(g, lx - 0.9, ly - 1.6, 1.8, 3.2, 0.8); g.fill(); }
    g.fillStyle = '#2c2a3c'; g.fillRect(lx - 2.6, ly - 3.6, 5.2, 0.9); g.fillRect(lx - 2.6, ly + 2.7, 5.2, 0.9);
  };
  Paint.waystone = function (g, x, y, t, near) { // a small cairn by the road: it has something to say only when she is close
    g.fillStyle = vgrad(g, y - 11, y, ['#98a0be', '#5a6280']);
    g.beginPath(); g.ellipse(x - 0.4, y - 1.8, 5.2, 2.4, 0, 0, TAU); g.ellipse(x + 0.6, y - 5, 3.8, 2, 0.12, 0, TAU); g.ellipse(x - 0.2, y - 7.8, 2.5, 1.5, -0.1, 0, TAU); g.ellipse(x + 0.2, y - 9.9, 1.4, 1, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(x - 1.6, y - 2.6, 2.6, 0.8, 0, 0, TAU); g.ellipse(x - 0.4, y - 5.6, 1.8, 0.6, 0.12, 0, TAU); g.fill();
    if (near) { soft(g, x, y - 13, 9, '#bfe4ff', 0.5); star4(g, x, y - 13.4 + Math.sin(t * 0.08) * 0.6, 1.9, '#eaf6ff', t * 0.02); }
  };
  Paint.beacon = function (g, x, y, t, fire) { // a signal tower: (x, y) is the middle of its foot
    g.fillStyle = vgrad(g, y - 54, y, ['#8a90a8', '#4a4e66']); g.beginPath(); g.moveTo(x - 12, y + 0.4); g.lineTo(x - 9, y - 46); g.lineTo(x - 12.6, y - 46); g.lineTo(x - 12.6, y - 52); g.lineTo(x - 8.6, y - 52); g.lineTo(x - 8.6, y - 49.4); g.lineTo(x - 4.2, y - 49.4); g.lineTo(x - 4.2, y - 52); g.lineTo(x + 4.2, y - 52); g.lineTo(x + 4.2, y - 49.4); g.lineTo(x + 8.6, y - 49.4); g.lineTo(x + 8.6, y - 52); g.lineTo(x + 12.6, y - 52); g.lineTo(x + 12.6, y - 46); g.lineTo(x + 9, y - 46); g.lineTo(x + 12, y + 0.4); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.1)'; g.beginPath(); g.moveTo(x - 12, y); g.lineTo(x - 9, y - 46); g.lineTo(x - 5.6, y - 46); g.lineTo(x - 8, y); g.closePath(); g.fill();
    g.fillStyle = '#1c1c2c'; g.beginPath(); g.moveTo(x - 3.6, y + 0.4); g.lineTo(x - 3.6, y - 9); g.quadraticCurveTo(x, y - 14, x + 3.6, y - 9); g.lineTo(x + 3.6, y + 0.4); g.closePath(); rr(g, x - 1.4, y - 34, 2.8, 5.6, 1.4); g.fill();
    g.fillStyle = '#3a3440'; g.beginPath(); rr(g, x - 7, y - 55.6, 14, 3.6, 1.2); g.fill();
    if (fire > 0) { soft(g, x, y - 60, 30 + 50 * fire + Math.sin(t * 0.3) * 4, '#ff9a30', 0.7); Paint.flame(g, x, y - 55, t, 1 + fire * 1.2); }
  };
  const KEEPSAKES = [
    g => { g.strokeStyle = '#f2da7a'; g.lineWidth = 0.7; g.lineJoin = 'round'; g.beginPath(); g.moveTo(0, -5.6); g.lineTo(4, 0); g.lineTo(0, 5.6); g.lineTo(-4, 0); g.closePath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.moveTo(0, -5.6); g.lineTo(0, 5.6); g.moveTo(0, -5.6); g.lineTo(-1.6, 0); g.lineTo(0, 5.6); g.lineTo(1.6, 0); g.closePath(); g.stroke(); }, // himmeli
    g => { g.fillStyle = '#da3c2e'; g.beginPath(); rr(g, -4.4, -1.6, 8, 3.6, 1.4); rr(g, 1.6, -5.4, 2.8, 5, 1.2); tri(g, 3.2, -5.2, 6, -3.4, 3.6, -2.6); rr(g, -4.2, 1, 1.9, 4.6, 0.8); rr(g, 1.2, 1, 1.9, 4.6, 0.8); tri(g, -4.2, -1.2, -5.8, 2, -3.6, 0.6); g.fill(); disc(g, -0.6, 0.2, 1.1, W1); disc(g, -0.6, 0.2, 0.5, '#3a6ab0'); g.fillStyle = '#f0d040'; g.fillRect(1.8, -2, 2.6, 0.7); }, // Dala horse
    g => { g.fillStyle = vgrad(g, -5, 5, ['#5a6078', '#2a2e3c']); g.beginPath(); g.moveTo(-4.6, 2.6); g.lineTo(-3.4, -3); g.lineTo(0.6, -4.8); g.lineTo(4.4, -2); g.lineTo(4.8, 3); g.lineTo(0.4, 4.6); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); tri(g, -3.4, -3, 0.6, -4.8, -0.4, -0.6); g.fill(); disc(g, 2, 1.4, 0.6, '#c8703a'); disc(g, -1.6, 2.4, 0.5, '#c8703a'); }, // magnetite
    g => { disc(g, 0, 0.4, 5, '#d8a848'); disc(g, 0, 0.4, 3.7, '#f6f1e2'); g.fillStyle = '#c8362c'; g.beginPath(); tri(g, -0.9, 0.4, 0.9, 0.4, 0, -3.2); g.fill(); g.fillStyle = '#3a4a6a'; g.beginPath(); tri(g, -0.9, 0.4, 0.9, 0.4, 0, 4); g.fill(); g.fillStyle = '#96701c'; g.beginPath(); rr(g, -1, -6, 2, 1.6, 0.6); g.fill(); }, // a ship's compass
    g => { g.fillStyle = vgrad(g, -6, 5, ['#ffffff', '#b9cdea']); g.beginPath(); g.moveTo(-3.6, 5); g.lineTo(-3.6, -2); g.lineTo(-1.6, -5.8); g.lineTo(0.4, -2); g.lineTo(0.4, 5); g.closePath(); g.moveTo(1, 5); g.lineTo(1, 0.6); g.lineTo(2.6, -2); g.lineTo(4.2, 0.6); g.lineTo(4.2, 5); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(-3, -1.6, 0.8, 6); }, // quartz
    g => { g.strokeStyle = '#8a90a8'; g.lineWidth = 1.3; g.lineCap = 'round'; g.beginPath(); g.arc(-2.8, -2.4, 2.1, 0, TAU); g.moveTo(-1.2, -1); g.lineTo(4.4, 4.2); g.moveTo(2.4, 2.4); g.lineTo(1, 3.8); g.moveTo(3.8, 3.6); g.lineTo(2.6, 4.8); g.stroke(); }, // a small iron key
    g => { g.fillStyle = '#eaf1ff'; g.beginPath(); ell(g, 0, 0, 5, 3.8); g.fill(); for (const [a, b, c] of [[-2.4, -0.8, '#ff7a9a'], [-0.4, -1.8, '#6af0c0'], [1.6, 0.2, '#6aa8ff'], [-0.6, 1.6, '#ffe36a'], [2.4, -1.4, '#c88aff'], [-2.6, 1, '#6af0c0']]) { g.fillStyle = c; g.beginPath(); ell(g, a, b, 1.2, 0.6, 0.4); g.fill(); } g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); ell(g, -1.6, -2.2, 1.3, 0.5, -0.3); g.fill(); } // opal
  ];
  Paint.keepsake = function (g, n, x, y, k) { g.save(); g.translate(x, y); if (k) g.scale(k, k); KEEPSAKES[n](g); g.restore(); };
  Paint.note = function (g, x, y, a) { g.save(); g.globalAlpha = a === undefined ? 1 : a; g.fillStyle = '#ffe9a8'; g.beginPath(); ell(g, x - 0.8, y + 2, 1.5, 1.1, -0.4); g.fill(); g.fillRect(x + 0.2, y - 3, 0.6, 5); g.beginPath(); g.moveTo(x + 0.2, y - 3); g.quadraticCurveTo(x + 2.6, y - 2.4, x + 2.4, y - 0.4); g.quadraticCurveTo(x + 1.6, y - 1.6, x + 0.2, y - 1.6); g.fill(); g.restore(); };
})();
