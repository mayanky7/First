'use strict';
/* Starlight Queen — themes, parallax backdrops, scenery props, ambient particles */
const THEMES = {
  meads: {
    id: 'meads', seed: 11, music: 'meads', dark: 0, amb: 'pollen', pit: '#14264a',
    tiles: { style: 'dirt', body: '#8a5a34', dark: '#6e4426', light: '#a06c40', speck: '#b8946a', cap: '#58b848', capHi: '#9ee86a', capDark: '#3a8a38', capDots: '#ffe870',
      plat: '#b07c44', platHi: '#d8a468', platDark: '#7a5028', brick: '#b8825a', brickHi: '#d8a67c', brickDark: '#7c5234', spike: '#c8c8d0', spikeHi: '#ffffff' },
    liquid: { top: '#7fd0ff', body: '#3a8ad8', deep: '#2a5eb0', glow: null },
    scatter: [['grass', 0.5], ['flower', 0.22], ['bush', 0.06]], trees: 'oak'
  },
  wood: {
    id: 'wood', seed: 23, music: 'wood', dark: 0.16, darkCol: '10,30,40', amb: 'leaves', pit: '#07140f',
    tiles: { style: 'dirt', body: '#4e3a2c', dark: '#3a2a20', light: '#66503c', speck: '#7a6448', cap: '#3f8f4e', capHi: '#7fd070', capDark: '#286838', capDots: '#f0c850',
      plat: '#7a5a38', platHi: '#a88254', platDark: '#4c3620', brick: '#6a7a5a', brickHi: '#8a9c74', brickDark: '#44523a', spike: '#5a4a3a', spikeHi: '#c0a880' },
    liquid: { top: '#8fe8d0', body: '#2f8f8a', deep: '#1f5f66', glow: null },
    scatter: [['fern', 0.3], ['mushroom', 0.14], ['grass', 0.3], ['flower', 0.08]], trees: 'elder'
  },
  halls: {
    id: 'halls', seed: 37, music: 'halls', dark: 0.7, darkCol: '4,5,14', amb: 'dust',
    tiles: { style: 'brick', body: '#4a4e62', dark: '#33374a', light: '#5e637a', speck: '#6f7590', cap: '#6f7590', capHi: '#9aa2c0', capDark: '#3d4156',
      plat: '#6a6f86', platHi: '#9aa2c0', platDark: '#3d4156', platStyle: 'stone', brick: '#5a5266', brickHi: '#7c7290', brickDark: '#3a3446', spike: '#8a8fa6', spikeHi: '#e0e4f4' },
    liquid: { top: '#ffe070', body: '#ff7a18', deep: '#c83808', glow: '#ff6a10' },
    scatter: [['crystal', 0.07], ['bones', 0.06], ['rubble', 0.2]], trees: null
  },
  fens: {
    id: 'fens', seed: 41, music: 'fens', dark: 0.5, darkCol: '6,12,24', amb: 'mist',
    tiles: { style: 'dirt', body: '#3a3a34', dark: '#28282a', light: '#4c4c40', speck: '#5c5a48', cap: '#5a7a4a', capHi: '#8aa860', capDark: '#3a5438',
      plat: '#5a4a38', platHi: '#7c6a50', platDark: '#3a2e22', brick: '#4a5a58', brickHi: '#6a7c78', brickDark: '#2e3a3a', spike: '#3a3028', spikeHi: '#8a7a60' },
    liquid: { top: '#a8e8b0', body: '#2a5a4c', deep: '#143030', glow: null },
    scatter: [['reeds', 0.3], ['skull', 0.05], ['grass', 0.25], ['deadbush', 0.08]], trees: 'dead'
  },
  gloam: {
    id: 'gloam', seed: 53, music: 'gloam', dark: 0.34, darkCol: '20,2,2', amb: 'ash',
    tiles: { style: 'rock', body: '#2e2630', dark: '#1e181f', light: '#40363f', speck: '#ff6a20', cap: '#5a5058', capHi: '#8a7e84', capDark: '#241c24',
      plat: '#4a4048', platHi: '#7a6e74', platDark: '#241c24', platStyle: 'stone', brick: '#4a2e2e', brickHi: '#6e4444', brickDark: '#2a1818', spike: '#3a3038', spikeHi: '#ff9a50' },
    liquid: { top: '#fff0a0', body: '#ff6a10', deep: '#b82800', glow: '#ff5a10' },
    scatter: [['rubble', 0.25], ['bones', 0.08], ['emberrock', 0.1]], trees: 'charred'
  }
};

const Backdrop = (() => {
  const LW = 640;
  function noise(seed, harm) {
    const r = rng(seed), ph = [], am = []; let tot = 0;
    for (let k = 1; k <= harm; k++) { ph.push(r() * TAU); const a = (0.5 + r()) / Math.pow(k, 0.85); am.push(a); tot += a; }
    const out = new Float32Array(LW);
    for (let x = 0; x < LW; x++) {
      let v = 0;
      for (let k = 0; k < harm; k++) v += am[k] * Math.sin(TAU * (k + 1) * x / LW + ph[k]);
      out[x] = v / tot;
    }
    return out;
  }
  function sky(bands, h) {
    const [cv, g] = mk(1, h || H); const n = 28;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) * (bands.length - 1), k = Math.min(bands.length - 2, t | 0);
      g.fillStyle = mix(bands[k], bands[k + 1], t - k);
      g.fillRect(0, Math.floor(i * (h || H) / n), 1, Math.ceil((h || H) / n) + 1);
    }
    return cv;
  }
  function layer(fn) { const [cv, g] = mk(LW, H); fn(g); return cv; }
  function mountains(col, shade, snow, base, amp, seed, snowline) {
    const hh = [];
    const cv = layer(g => {
      const n1 = noise(seed, 9), n2 = noise(seed + 1, 22);
      for (let x = 0; x < LW; x++) hh.push(base + amp * (1 - Math.abs(n1[x]) * 1.6) + n2[x] * amp * 0.25);
      for (let x = 0; x < LW; x++) {
        const h = hh[x] | 0, up = hh[(x + 3) % LW] > hh[x];
        R(g, x, H - h, 1, h, col);
        R(g, x, H - h, 1, Math.min(h, up ? 3 : 26), up ? col : shade);
        if (snow && h > snowline) R(g, x, H - h, 1, Math.min((h - snowline) * 0.7 + (x * 7 % 3), 14), up ? snow : mix(snow, shade, 0.35));
      }
    });
    cv.hh = hh.map(Math.floor);
    return cv;
  }
  function hills(col, hi, base, amp, seed, deco) {
    return layer(g => {
      const n = noise(seed, 5), hh = [];
      for (let x = 0; x < LW; x++) { const h = (base + amp * n[x]) | 0; hh.push(h); R(g, x, H - h, 1, h, col); R(g, x, H - h, 1, 2, hi); }
      if (deco) deco(g, hh, rng(seed + 9));
    });
  }
  function smallTree(g, x, y, s, trunk, leaf, leaf2) {
    R(g, x, y - s, 2, s, trunk);
    R(g, x - s * 0.6, y - s * 1.9, s * 1.2 + 2, s, leaf); R(g, x - s * 0.35, y - s * 2.3, s * 0.7 + 2, s * 0.5, leaf);
    R(g, x - s * 0.6, y - s * 1.15, s * 1.2 + 2, 2, leaf2);
  }
  function trunks(col, shade, hi, count, wmin, wmax, seed, canopy) {
    return layer(g => {
      const r = rng(seed);
      for (let i = 0; i < count; i++) {
        const x = (i + r() * 0.7) * LW / count | 0, w = wmin + r() * (wmax - wmin) | 0;
        R(g, x, 0, w, H, col); R(g, x, 0, Math.max(1, w * 0.18), H, hi); R(g, x + w - Math.max(2, w * 0.3), 0, Math.max(2, w * 0.3), H, shade);
        for (let k = 0; k < w / 3; k++) R(g, x + 2 + r() * (w - 4), r() * H, 1, 6 + r() * 14, shade);
        for (let k = 0; k < 6; k++) { R(g, x - k, H - 6 + k, 1, 6 - k, col); R(g, x + w + k - 1, H - 6 + k, 1, 6 - k, shade); }
        if (r() < 0.6) { const by = 30 + r() * 90; R(g, x + w, by, 10 + r() * 16, 3, col); R(g, x + w, by + 3, 6, 1, shade); }
      }
      if (canopy) {
        for (let x = 0; x < LW; x += 5) { const h = 14 + r() * 26; R(g, x, 0, 6, h, canopy); R(g, x + 1, h, 3, 3, canopy); }
        for (let i = 0; i < 26; i++) { const x = r() * LW, l = 20 + r() * 50; R(g, x, 0, 1, l, canopy); R(g, x - 1, l, 3, 2, canopy); }
      }
    });
  }
  function pillars(col, hi, shade, period, w, seed, glint) {
    return layer(g => {
      const r = rng(seed);
      for (let x0 = 0; x0 < LW; x0 += period) {
        const x = x0 + (period - w) / 2 | 0;
        R(g, x, 0, w, H, col); R(g, x, 0, 2, H, hi); R(g, x + w - 4, 0, 4, H, shade);
        for (let fx = x + 6; fx < x + w - 6; fx += 5) R(g, fx, 26, 1, H - 60, shade);
        R(g, x - 5, 16, w + 10, 8, col); R(g, x - 5, 16, w + 10, 1, hi); R(g, x - 8, 8, w + 16, 8, col); R(g, x - 8, 8, w + 16, 1, hi); R(g, x - 8, 0, w + 16, 8, shade);
        R(g, x - 5, H - 30, w + 10, 30, col); R(g, x - 5, H - 30, w + 10, 1, hi);
        // arch to next pillar
        const gap = period - w;
        for (let i = 0; i < gap; i++) {
          const k = i / gap, hh = 8 + Math.pow(Math.abs(k - 0.5) * 2, 2.4) * 30;
          R(g, x + w + i, 0, 1, hh, shade); R(g, x + w + i, hh, 1, 1, hi);
        }
        if (glint) for (let i = 0; i < 4; i++) R(g, x + 4 + r() * (w - 8), 30 + r() * 130, 1 + r() * 2, 1, glint);
      }
    });
  }
  function deadTrees(col, count, seed, hmin, hmax, ground) {
    return layer(g => {
      const r = rng(seed);
      R(g, 0, H - ground, LW, ground, col);
      for (let x = 0; x < LW; x++) R(g, x, H - ground - (Math.sin(x * 0.05 + seed) * 3 + 3 | 0), 1, 8, col);
      for (let i = 0; i < count; i++) {
        const x = (i + r() * 0.8) * LW / count | 0, h = hmin + r() * (hmax - hmin), y = H - ground;
        const lean = (r() - 0.5) * 0.25;
        for (let k = 0; k < h; k++) R(g, x + k * lean, y - k, Math.max(1, 4 - k / h * 3), 1, col);
        for (let b = 0; b < 4; b++) {
          const by = y - h * (0.4 + r() * 0.55), dir = r() < 0.5 ? -1 : 1, len = 6 + r() * 14;
          for (let k = 0; k < len; k++) R(g, x + (y - by) * lean + dir * k, by - k * 0.6, 1, 1, col);
          const ex = x + (y - by) * lean + dir * len * 0.6, ey = by - len * 0.36;
          for (let k = 0; k < 5; k++) R(g, ex + dir * k * 0.3, ey - k, 1, 1, col);
        }
      }
    });
  }
  function ridges(col, shade, base, amp, seed, cracks) {
    return layer(g => {
      const n1 = noise(seed, 12), n2 = noise(seed + 3, 40), r = rng(seed);
      for (let x = 0; x < LW; x++) {
        const h = (base + amp * (1 - Math.abs(n1[x]) * 1.8) + n2[x] * amp * 0.3) | 0;
        R(g, x, H - h, 1, h, col); R(g, x, H - h, 1, 2, shade);
        if (cracks && r() < 0.02) { let cx = x; for (let k = 2; k < Math.min(h, 40); k += 2) { cx += r() < 0.5 ? -1 : 1; R(g, cx, H - h + k, 1, 2, cracks); } }
      }
    });
  }

  function drawLayer(c, img, camx, f, y) {
    const x = -(((camx * f) % LW + LW) % LW) | 0;
    c.drawImage(img, x, y | 0);
    if (x + LW < W) c.drawImage(img, x + LW, y | 0);
  }

  const built = {};
  function build(id) {
    if (built[id]) return built[id];
    let B;
    if (id === 'meads') {
      const s = sky(['#3f8be0', '#6cb4f4', '#a8dcff', '#e4f6ff', '#fff4d8']);
      const clouds = layer(g => {
        const r = rng(5);
        for (let i = 0; i < 9; i++) {
          const x = r() * LW, y = 14 + r() * 70, w = 30 + r() * 50;
          for (let k = 0; k < 6; k++) { const ww = w * (0.3 + r() * 0.5); R(g, x + r() * (w - ww), y - r() * 9, ww, 5 + r() * 5, '#ffffff'); }
          R(g, x, y + 3, w, 3, '#dceeff');
        }
      });
      const far = mountains('#92a8dc', '#7e92cc', '#ffffff', 60, 62, 101, 96);
      const mid = hills('#72c46c', '#96de84', 62, 20, 102, (g, hh, r) => {
        for (let i = 0; i < 26; i++) { const x = r() * LW | 0; smallTree(g, x, H - hh[x] + 2, 5 + r() * 4, '#5a8a50', '#4ea858', '#3f9048'); }
        for (let i = 0; i < 5; i++) {
          const x = 40 + i * 120 + r() * 50 | 0, y = H - hh[x % LW] + 1;
          R(g, x, y - 7, 11, 7, '#f0e4c4'); R(g, x - 2, y - 11, 15, 4, '#b06a40'); R(g, x, y - 13, 11, 2, '#b06a40'); R(g, x + 4, y - 5, 3, 5, '#7a4a2c'); R(g, x + 8, y - 5, 2, 2, '#ffe070'); R(g, x + 8, y - 17, 2, 4, '#8a7a70');
        }
      });
      const near = hills('#4fa652', '#74c868', 36, 13, 103, (g, hh, r) => {
        for (let i = 0; i < 14; i++) { const x = r() * LW | 0; smallTree(g, x, H - hh[x] + 2, 8 + r() * 6, '#4a7040', '#3a8a44', '#2c7438'); }
        for (let i = 0; i < 40; i++) { const x = r() * LW | 0; R(g, x, H - hh[x] + 3 + r() * 20, 2, 1, '#6cc060'); }
      });
      B = (c, cx, yo, t) => {
        c.drawImage(s, 0, 0, W, H);
        Art.glow(c, 300, 44, 60, '#fff6c0', 0.8); c.fillStyle = '#fffbe0'; c.beginPath(); c.arc(300, 44, 11, 0, TAU); c.fill();
        drawLayer(c, clouds, cx * 0.04 + t * 0.05, 1, yo * 0.1);
        drawLayer(c, far, cx, 0.08, yo * 0.2); drawLayer(c, mid, cx, 0.22, yo * 0.35); drawLayer(c, near, cx, 0.42, yo * 0.5);
      };
    } else if (id === 'wood') {
      const s = sky(['#1f4a44', '#3f7a58', '#8fb870', '#e8e09a', '#fff6c8']);
      const far = trunks('#6f9f70', '#5f9064', '#86b482', 13, 8, 18, 201, null);
      const mid = trunks('#3d7253', '#2f5e46', '#52896a', 9, 14, 30, 202, '#2f5e46');
      const near = trunks('#1f4634', '#163428', '#2d5a44', 5, 26, 46, 203, '#163428');
      B = (c, cx, yo, t) => {
        c.drawImage(s, 0, 0, W, H);
        drawLayer(c, far, cx, 0.1, 0);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) {
          const x = ((i * 137 - cx * 0.16) % 520 + 520) % 520 - 80, a = 0.07 + 0.035 * Math.sin(t * 0.01 + i * 2);
          c.fillStyle = `rgba(255,240,170,${a})`;
          c.beginPath(); c.moveTo(x + 70, 0); c.lineTo(x + 96, 0); c.lineTo(x + 30, H); c.lineTo(x - 14, H); c.fill();
        }
        c.restore();
        drawLayer(c, mid, cx, 0.24, 0); drawLayer(c, near, cx, 0.46, 0);
      };
    } else if (id === 'halls') {
      const s = sky(['#080a14', '#0e1226', '#181e3a', '#221e3c']);
      const far = pillars('#222a4a', '#343e68', '#161b32', 128, 30, 301, '#c8a040');
      const near = pillars('#12162a', '#222a4a', '#0a0c18', 213.34, 46, 302, null);
      B = (c, cx, yo, t) => {
        c.drawImage(s, 0, 0, W, H);
        drawLayer(c, far, cx, 0.14, 0);
        for (let i = 0; i < 5; i++) {
          const x = ((i * 128 + 64 - cx * 0.14) % LW + LW) % LW - 30, fl = 0.5 + 0.2 * Math.sin(t * 0.2 + i * 1.7);
          Art.glow(c, x, 96, 26, '#ff8a30', fl * 0.6); R(c, x - 1, 94, 3, 3, '#ffc860');
        }
        drawLayer(c, near, cx, 0.36, 0);
        const g = c.createLinearGradient(0, H - 70, 0, H);
        g.addColorStop(0, 'rgba(255,90,20,0)'); g.addColorStop(1, 'rgba(255,90,20,0.28)');
        c.fillStyle = g; c.fillRect(0, H - 70, W, 70);
      };
    } else if (id === 'fens') {
      const s = sky(['#070b1e', '#101c3c', '#1e3854', '#365a62', '#507468']);
      const stars = layer(g => { const r = rng(9); for (let i = 0; i < 70; i++) R(g, r() * LW, r() * 110, 1, 1, r() < 0.2 ? '#ffffff' : '#8fa8c8'); });
      const far = layer(g => {
        const n = noise(401, 7);
        for (let x = 0; x < LW; x++) { const h = 50 + 16 * (1 - Math.abs(n[x]) * 1.5) | 0; R(g, x, H - h, 1, h, '#12203a'); }
        // the Cinder Spire, far in the east
        const sx = 470;
        for (let y = 0; y < 86; y++) { const w = 3 + y * 0.16; R(g, sx - w / 2, H - 132 + y, w, 1, '#0c1628'); }
        R(g, sx - 5, H - 136, 2, 6, '#0c1628'); R(g, sx + 3, H - 136, 2, 6, '#0c1628'); R(g, sx - 1, H - 139, 2, 8, '#0c1628');
      });
      const mid = deadTrees('#0e1a26', 9, 402, 40, 80, 34);
      const near = deadTrees('#070f18', 5, 403, 60, 120, 16);
      B = (c, cx, yo, t) => {
        c.drawImage(s, 0, 0, W, H);
        drawLayer(c, stars, cx, 0.02, 0);
        Art.glow(c, 86, 46, 50, '#d8f0d0', 0.5); c.fillStyle = '#e8f4dc'; c.beginPath(); c.arc(86, 46, 15, 0, TAU); c.fill();
        c.fillStyle = '#c4d8c0'; c.beginPath(); c.arc(81, 42, 3, 0, TAU); c.arc(91, 51, 4, 0, TAU); c.fill();
        drawLayer(c, far, cx, 0.05, 0);
        const sx = 470 - (((cx * 0.05) % LW + LW) % LW);
        Art.glow(c, sx, H - 134, 9 + Math.sin(t * 0.07) * 2, '#ff4010', 0.9);
        mist(c, cx * 0.1, t, 120, 0.1);
        drawLayer(c, mid, cx, 0.22, 0);
        mist(c, cx * 0.3, t * 1.4, 150, 0.12);
        drawLayer(c, near, cx, 0.45, 0);
      };
    } else if (id === 'gloam') {
      const s = sky(['#070306', '#1c070a', '#4a100c', '#8a2410', '#d85a14', '#ffa030']);
      const far = ridges('#3a1410', '#5a2014', 50, 50, 501, null);
      const mid = ridges('#200c0c', '#3a1410', 34, 46, 502, '#ff6a20');
      const near = ridges('#0e0506', '#200c0c', 14, 40, 503, null);
      B = (c, cx, yo, t) => {
        c.drawImage(s, 0, 0, W, H);
        const fl = (Math.sin(t * 0.013) > 0.985 || Math.sin(t * 0.031 + 2) > 0.992) ? 0.3 : 0;
        if (fl) { c.fillStyle = `rgba(255,200,160,${fl})`; c.fillRect(0, 0, W, H); }
        // Mount Gloam
        const vx = 250 - cx * 0.03;
        c.fillStyle = '#12060a';
        c.beginPath(); c.moveTo(vx - 150, H); c.lineTo(vx - 26, 62); c.lineTo(vx - 14, 68); c.lineTo(vx, 60); c.lineTo(vx + 16, 67); c.lineTo(vx + 28, 61); c.lineTo(vx + 170, H); c.fill();
        Art.glow(c, vx, 58, 46 + Math.sin(t * 0.05) * 6, '#ff5a10', 0.85);
        for (let i = 0; i < 7; i++) {
          const k = ((t * 0.25 + i * 23) % 160) / 160, px = vx + Math.sin(i * 2.1 + k * 4) * 16 * k - 18 * k, py = 56 - k * 70;
          c.fillStyle = `rgba(40,16,18,${0.55 * (1 - k)})`; c.beginPath(); c.arc(px, py, 6 + k * 16, 0, TAU); c.fill();
        }
        R(c, vx - 12, 66, 2, 30, '#ff7a20'); R(c, vx - 13, 96, 2, 22, '#e85a10'); R(c, vx + 9, 68, 2, 20, '#ff7a20'); R(c, vx + 11, 88, 2, 34, '#e85a10'); R(c, vx - 2, 64, 2, 12, '#ffb040');
        drawLayer(c, far, cx, 0.1, 0); drawLayer(c, mid, cx, 0.24, 0); drawLayer(c, near, cx, 0.44, 0);
      };
    }
    return built[id] = B;
  }
  function mist(c, off, t, y, a) {
    c.save();
    for (let i = 0; i < 5; i++) {
      const x = ((i * 150 - off + t * 0.12 * (i % 2 ? 1 : -0.6)) % 700 + 700) % 700 - 160;
      c.fillStyle = `rgba(170,210,200,${a * (0.6 + 0.4 * Math.sin(t * 0.01 + i))})`;
      c.fillRect(x | 0, y + (i % 3) * 14, 150, 5); c.fillRect((x + 20) | 0, y + (i % 3) * 14 - 3, 100, 3); c.fillRect((x + 30) | 0, y + (i % 3) * 14 + 5, 90, 3);
    }
    c.restore();
  }

  /* ---------- ambient particles (screen space) ---------- */
  function makeAmbient(kind) {
    const n = { pollen: 16, leaves: 22, dust: 26, mist: 14, ash: 50 }[kind] || 0, ps = [];
    for (let i = 0; i < n; i++) ps.push({ x: rand(W), y: rand(H), p: rand(TAU), s: rand(0.5, 1.5) });
    return { kind, ps };
  }
  function drawAmbient(c, amb, t, dcx) {
    for (const p of amb.ps) {
      p.x -= dcx * 0.6 * p.s;
      if (amb.kind === 'pollen') {
        p.x += Math.sin(t * 0.02 + p.p) * 0.2; p.y += Math.cos(t * 0.017 + p.p) * 0.15 - 0.03;
        c.fillStyle = `rgba(255,255,220,${0.4 + 0.3 * Math.sin(t * 0.05 + p.p)})`; c.fillRect(p.x | 0, p.y | 0, 1, 1);
      } else if (amb.kind === 'leaves') {
        p.x += Math.sin(t * 0.03 + p.p) * 0.5 - 0.15; p.y += 0.28 * p.s;
        const f = Math.sin(t * 0.1 + p.p);
        c.fillStyle = p.s > 1 ? '#f0c850' : '#e89a3a'; c.fillRect(p.x | 0, p.y | 0, f > 0 ? 2 : 1, f > 0 ? 1 : 2);
      } else if (amb.kind === 'dust') {
        p.x += Math.sin(t * 0.01 + p.p) * 0.1; p.y -= 0.05 * p.s;
        c.fillStyle = `rgba(255,220,170,${0.12 + 0.12 * Math.sin(t * 0.03 + p.p)})`; c.fillRect(p.x | 0, p.y | 0, 1, 1);
      } else if (amb.kind === 'mist') {
        p.x += Math.sin(t * 0.02 + p.p) * 0.3; p.y += Math.cos(t * 0.015 + p.p) * 0.25;
        Art.glow(c, p.x, p.y, 4 + Math.sin(t * 0.04 + p.p) * 1.5, '#9fffd0', 0.2 + 0.1 * Math.sin(t * 0.05 + p.p));
      } else if (amb.kind === 'ash') {
        if (p.s > 1.1) { p.x += Math.sin(t * 0.04 + p.p) * 0.4; p.y -= 0.5 * p.s; c.fillStyle = Math.sin(t * 0.2 + p.p) > 0 ? '#ffb040' : '#ff6a20'; }
        else { p.x -= 0.25; p.y += 0.3 * p.s; c.fillStyle = 'rgba(150,140,140,0.6)'; }
        c.fillRect(p.x | 0, p.y | 0, 1, 1);
      }
      if (p.x < -4) p.x += W + 8; if (p.x > W + 4) p.x -= W + 8;
      if (p.y < -4) p.y += H + 8; if (p.y > H + 4) p.y -= H + 8;
    }
  }

  /* ---------- scenery props (world space, anchored bottom-centre) ---------- */
  const props = {};
  function prop(type, v) {
    const key = type + v;
    if (props[key]) return props[key];
    const r = rng(v * 131 + type.length * 17 + type.charCodeAt(0));
    let cv;
    const S = Art.spr;
    switch (type) {
      case 'grass': cv = S(8, 5, g => { for (let i = 0; i < 4; i++) { const h = 2 + r() * 3 | 0; R(g, i * 2 + (r() * 2 | 0), 5 - h, 1, h, i % 2 ? '#7fd060' : '#4ea848'); } }); break;
      case 'flower': cv = S(7, 9, g => { const col = ['#ff6a8a', '#ffe060', '#ffffff', '#b890ff'][v % 4]; R(g, 3, 4, 1, 5, '#3f9a48'); R(g, 4, 6, 2, 1, '#3f9a48'); R(g, 2, 1, 3, 3, col); R(g, 3, 0, 1, 5, col); R(g, 1, 2, 5, 1, col); R(g, 3, 2, 1, 1, '#ffb030'); }); break;
      case 'bush': cv = S(22, 12, g => { R(g, 2, 5, 18, 7, '#3f9048'); R(g, 5, 2, 12, 4, '#3f9048'); R(g, 0, 8, 22, 4, '#3f9048'); R(g, 6, 2, 8, 2, '#62b858'); R(g, 3, 6, 5, 2, '#62b858'); R(g, 13, 5, 5, 2, '#62b858'); for (let i = 0; i < 4; i++) R(g, 3 + r() * 16, 4 + r() * 6, 1, 1, '#ff5a6a'); }); break;
      case 'fern': cv = S(14, 9, g => { for (let i = 0; i < 6; i++) { const a = -1.2 + i * 0.48; for (let k = 0; k < 7; k++) R(g, 7 + Math.sin(a) * k, 8 - Math.cos(a) * k * 0.9 - k * 0.2, 1, 1, k % 2 ? '#4fae5a' : '#2f7a44'); } }); break;
      case 'mushroom': cv = S(9, 8, g => { const col = v % 2 ? '#e0486a' : '#d8a040'; R(g, 3, 4, 3, 4, '#f0e8d8'); R(g, 1, 1, 7, 3, col); R(g, 2, 0, 5, 1, col); R(g, 0, 3, 9, 1, col); R(g, 2, 1, 1, 1, '#fff'); R(g, 6, 2, 1, 1, '#fff'); R(g, 4, 0, 1, 1, '#fff'); }); break;
      case 'crystal': cv = S(12, 14, g => { const c1 = v % 2 ? '#7fe8ff' : '#b890ff', c2 = v % 2 ? '#3a9ac8' : '#7050c8'; for (let y = 0; y < 14; y++) { const w = y < 4 ? y + 1 : 4; R(g, 4 - w / 2, y, w, 1, c1); R(g, 4, y, w / 2, 1, c2); } for (let y = 5; y < 14; y++) { const w = y < 8 ? y - 4 : 3; R(g, 9 - w / 2, y, w, 1, c1); R(g, 9, y, w / 2, 1, c2); } R(g, 3, 2, 1, 4, '#fff'); }); break;
      case 'bones': cv = S(14, 6, g => { const b = '#d8d0c0'; R(g, 1, 4, 9, 1, b); R(g, 0, 3, 2, 3, b); R(g, 9, 3, 2, 3, b); R(g, 4, 1, 7, 1, b); R(g, 11, 0, 2, 3, b); R(g, 5, 2, 1, 2, '#a8a090'); }); break;
      case 'rubble': cv = S(12, 5, g => { for (let i = 0; i < 4; i++) { const x = r() * 9, w = 2 + r() * 3; R(g, x, 5 - w + 1, w, w, i % 2 ? '#55596c' : '#3a3d4c'); R(g, x, 5 - w + 1, w, 1, '#777c92'); } }); break;
      case 'reeds': cv = S(12, 16, g => { for (let i = 0; i < 5; i++) { const x = 1 + i * 2 + (r() * 2 | 0), h = 7 + r() * 8 | 0; R(g, x, 16 - h, 1, h, '#5a7a4a'); if (r() < 0.6) R(g, x - 0, 16 - h - 1, 2, 3, '#5a4630'); } }); break;
      case 'skull': cv = S(8, 7, g => { const b = '#c8c8b8'; R(g, 1, 0, 6, 5, b); R(g, 2, 5, 4, 2, b); R(g, 2, 2, 1, 2, '#111'); R(g, 5, 2, 1, 2, '#111'); R(g, 3, 6, 1, 1, '#111'); R(g, 5, 6, 1, 1, '#111'); }); break;
      case 'deadbush': cv = S(14, 10, g => { const b = '#3a3028'; for (let i = 0; i < 5; i++) { const a = -1 + i * 0.5; for (let k = 0; k < 9; k++) R(g, 7 + Math.sin(a) * k * 0.8, 9 - Math.cos(a) * k, 1, 1, b); } }); break;
      case 'emberrock': cv = S(12, 8, g => { R(g, 1, 3, 10, 5, '#2a2028'); R(g, 3, 1, 6, 2, '#2a2028'); R(g, 3, 1, 5, 1, '#4a3c44'); R(g, 4, 4, 1, 3, '#ff6a20'); R(g, 5, 6, 3, 1, '#ff6a20'); R(g, 8, 3, 1, 2, '#ffb040'); }); break;
      case 'oak': cv = S(54, 72, g => {
        R(g, 23, 34, 8, 38, '#6a4a2c'); R(g, 23, 34, 2, 38, '#86623c'); R(g, 28, 34, 3, 38, '#4e3420'); R(g, 20, 68, 14, 4, '#6a4a2c'); R(g, 18, 42, 6, 2, '#6a4a2c'); R(g, 30, 46, 7, 2, '#4e3420');
        const blobs = [[27, 20, 22], [14, 28, 13], [40, 28, 13], [20, 12, 12], [34, 12, 12], [27, 30, 16]];
        for (const [x, y, rad] of blobs) { g.fillStyle = '#3a8a44'; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); }
        for (const [x, y, rad] of blobs) { g.fillStyle = '#56b058'; g.beginPath(); g.arc(x - 2, y - 3, rad * 0.7, 0, TAU); g.fill(); }
        for (let i = 0; i < 22; i++) R(g, 8 + r() * 38, 4 + r() * 34, 2, 1, r() < 0.5 ? '#8fdc78' : '#2c7438');
      }); break;
      case 'elder': cv = S(60, 240, g => {
        const c1 = '#5a4638', c2 = '#40302a', c3 = '#786050';
        R(g, 14, 0, 32, 240, c1); R(g, 14, 0, 5, 240, c3); R(g, 36, 0, 10, 240, c2);
        for (let i = 0; i < 26; i++) R(g, 18 + r() * 22, r() * 230, 1, 8 + r() * 22, c2);
        for (let k = 0; k < 14; k++) { R(g, 14 - k, 226 + k, 1, 14 - k, c1); R(g, 45 + k, 226 + k, 1, 14 - k, c2); }
        R(g, 22, 150 + v * 9, 7, 9, '#2a1e1a'); R(g, 23, 149 + v * 9, 5, 1, '#2a1e1a');
        for (let i = 0; i < 9; i++) { const y = 20 + r() * 190; R(g, 15 + r() * 26, y, 3, 2, '#4fae5a'); }
        R(g, 12, 206, 6, 3, '#e0d0b0'); R(g, 11, 205, 3, 1, '#e0d0b0'); R(g, 42, 180, 7, 3, '#e0d0b0');
      }); break;
      case 'dead': cv = S(40, 60, g => {
        const b = '#2a2824', b2 = '#3e3a34';
        for (let k = 0; k < 60; k++) { const w = Math.max(2, 6 - k / 12); R(g, 18 + Math.sin(k * 0.1 + v) * 2, 59 - k, w, 1, b); R(g, 18 + Math.sin(k * 0.1 + v) * 2, 59 - k, 1, 1, b2); }
        for (let i = 0; i < 5; i++) { const y = 10 + r() * 34, d = i % 2 ? 1 : -1, len = 8 + r() * 10; for (let k = 0; k < len; k++) R(g, 20 + d * k, y - k * 0.7, 1 + (k < 3), 1, b); for (let k = 0; k < 5; k++) R(g, 20 + d * len * 0.7 + d * k * 0.4, y - len * 0.5 - k, 1, 1, b); }
      }); break;
      case 'charred': cv = S(26, 36, g => {
        const b = '#141012';
        for (let k = 0; k < 36; k++) R(g, 11 + Math.sin(k * 0.2 + v) * 1.5, 35 - k, Math.max(1, 4 - k / 10), 1, b);
        for (let i = 0; i < 3; i++) { const y = 8 + r() * 16, d = i % 2 ? 1 : -1; for (let k = 0; k < 9; k++) R(g, 12 + d * k, y - k * 0.8, 1, 1, b); }
        R(g, 12, 20, 1, 1, '#ff6a20'); R(g, 13, 27, 1, 2, '#ff6a20');
      }); break;
      case 'pillar': cv = S(22, 100, g => {
        R(g, 4, 0, 14, 100, '#3d4156'); R(g, 4, 0, 2, 100, '#5e637a'); R(g, 15, 0, 3, 100, '#2a2d3e');
        for (let x = 8; x < 14; x += 3) R(g, x, 10, 1, 80, '#2a2d3e');
        R(g, 1, 0, 20, 6, '#4a4e62'); R(g, 1, 0, 20, 1, '#6f7590'); R(g, 0, 92, 22, 8, '#4a4e62'); R(g, 0, 92, 22, 1, '#6f7590');
      }); break;
      case 'banner': cv = S(12, 30, g => {
        R(g, 0, 0, 12, 2, '#6a5a3a'); R(g, 1, 2, 10, 22, '#7a1c1c'); R(g, 1, 2, 2, 22, '#9a2c2c');
        R(g, 1, 24, 3, 3, '#7a1c1c'); R(g, 8, 24, 3, 3, '#7a1c1c'); R(g, 4, 24, 4, 1, '#7a1c1c');
        R(g, 4, 8, 4, 1, '#ffb040'); R(g, 4, 6, 1, 3, '#ffb040'); R(g, 7, 6, 1, 3, '#ffb040'); R(g, 5.5, 5, 1, 4, '#ffb040'); R(g, 4, 10, 4, 5, '#1a0a0a');
      }); break;
      case 'throne': cv = S(34, 60, g => {
        const c1 = '#1c1a22', c2 = '#2e2a36', e = '#ff6a20';
        R(g, 4, 10, 26, 50, c1); R(g, 4, 10, 3, 50, c2); R(g, 0, 36, 34, 24, c1); R(g, 0, 36, 34, 2, c2); R(g, 8, 34, 18, 4, '#4a1414');
        for (let i = 0; i < 5; i++) { const x = 4 + i * 6, h = [10, 6, 14, 6, 10][i]; R(g, x, 10 - h, 2, h, c1); R(g, x, 10 - h, 1, 2, e); }
        R(g, 15, 18, 4, 6, e); R(g, 14, 20, 6, 2, e);
      }); break;
      default: cv = S(2, 2, g => { });
    }
    return props[key] = cv;
  }
  function torch(c, x, y, t) {
    R(c, x - 1, y - 12, 2, 12, '#5a4a3a'); R(c, x - 3, y - 14, 6, 3, '#7a7f92');
  }
  function flame(c, x, y, t, s) {
    s = s || 1;
    const f = Math.sin(t * 0.4 + x) * 1.2;
    R(c, x - 2 * s, y - 5 * s, 4 * s, 5 * s, '#ff7a1a'); R(c, x - 1 * s + f * 0.5, y - 8 * s, 2 * s, 4 * s, '#ff9a2a'); R(c, x + f, y - 10 * s, 1 * s, 3 * s, '#ffc040');
    R(c, x - 1 * s, y - 4 * s, 2 * s, 4 * s, '#ffe890');
  }
  return { build, makeAmbient, drawAmbient, prop, torch, flame, sky, layer, hills, mountains, drawLayer, LW, mist };
})();
