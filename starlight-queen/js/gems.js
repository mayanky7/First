'use strict';
/* Starlight Queen — the thirteen diamonds. The first six are teaching stones invented for the game;
   the last seven are real, famous diamonds described with their real figures. */
const GEMS = [
  {
    id: 'first', name: 'The First Light', real: false, carat: 0.30, cut: 'Round brilliant', shape: 'round',
    color: 'G · near colourless', tint: '#eaf6ff', clarity: 'VS1', origin: 'Kaavi kimberlite, eastern Finland',
    lesson: 'Carat',
    text: 'Carat is weight, not size: one carat is exactly 0.2 grams. The word comes from the carob seeds once used to balance jewellers’ scales.'
  },
  {
    id: 'cut', name: 'The Lantern Square', real: false, carat: 1.00, cut: 'Princess', shape: 'princess',
    color: 'F · colourless', tint: '#f2f8ff', clarity: 'VS2', origin: 'Jwaneng, Botswana',
    lesson: 'Cut',
    text: 'Cut is the only one of the four Cs made by human hands. Its angles decide how much light comes back to the eye.'
  },
  {
    id: 'clarity', name: 'The Ice Window', real: false, carat: 2.00, cut: 'Emerald (step cut)', shape: 'emerald',
    color: 'E · colourless', tint: '#e6fbff', clarity: 'VVS1', origin: 'Diavik, Northwest Territories, Canada',
    lesson: 'Clarity',
    text: 'Clarity counts the tiny crystals and feathers trapped inside, judged at ten-power magnification: FL, IF, VVS, VS, SI, I. A step cut hides nothing.'
  },
  {
    id: 'colour', name: 'Midsummer White', real: false, carat: 5.00, cut: 'Oval brilliant', shape: 'oval',
    color: 'D · colourless', tint: '#ffffff', clarity: 'IF', origin: 'Mir pipe, Yakutia, Russia',
    lesson: 'Colour',
    text: 'For white diamonds, less colour is worth more. The scale starts at D, colourless, and runs to Z, a light yellow.'
  },
  {
    id: 'pink', name: 'The Savannah Rose', real: false, carat: 6.00, cut: 'Cushion', shape: 'cushion',
    color: 'Fancy vivid pink', tint: '#ff9ac8', clarity: 'VS1', origin: 'Williamson mine, Tanzania',
    lesson: 'Fancy colour',
    text: 'Past Z the rules turn over: strong colour becomes rare and precious. Pink comes from no impurity at all. The crystal itself was bent under pressure.'
  },
  {
    id: 'deep', name: 'The Deep One', real: false, carat: 10.00, cut: 'Pear brilliant', shape: 'pear',
    color: 'H · near colourless', tint: '#f4f0e6', clarity: 'SI1', origin: 'Kimberley, South Africa',
    lesson: 'Where diamonds come from',
    text: 'A diamond is pure carbon, crystallised about 150 kilometres down, most of them one to three billion years ago. Volcanoes carried them up in pipes of kimberlite.'
  },
  {
    id: 'unclesam', name: 'Uncle Sam', real: true, carat: 12.42, cut: 'Emerald (step cut)', shape: 'emerald',
    color: 'M · faint brown', tint: '#f6e6cc', clarity: 'VVS', origin: 'Crater of Diamonds, Arkansas, USA',
    lesson: 'A real American find',
    text: 'The largest diamond ever found in the United States: 40.23 carats in the rough, found by a mine worker in 1924. The field is now a park where anyone may dig, and keep what they find.'
  },
  {
    id: 'dresden', name: 'The Dresden Green', real: true, carat: 41, cut: 'Pear brilliant', shape: 'pear',
    color: 'Natural fancy green', tint: '#8fe6a8', clarity: 'VS1, seen in its setting', origin: 'Probably Golconda, India',
    lesson: 'Colour by radiation',
    text: 'The largest naturally green diamond known. Its colour was made by natural radiation in the earth, over millions of years. It came to Dresden in the 1740s.'
  },
  {
    id: 'hope', name: 'The Hope Diamond', real: true, carat: 45.52, cut: 'Antique cushion', shape: 'cushion',
    color: 'Fancy deep greyish blue', tint: '#6f9ae8', clarity: 'VS1', origin: 'Probably the Kollur mine, India',
    lesson: 'Blue from boron',
    text: 'A trace of boron makes it blue. After ultraviolet light it glows red for a while, like an ember. It rests in the Smithsonian in Washington.'
  },
  {
    id: 'argyle', name: 'The Argyle Alpha', real: true, carat: 3.14, cut: 'Emerald shape', shape: 'emerald',
    color: 'Fancy vivid purplish pink', tint: '#ff7ab8', clarity: 'Not published', origin: 'Argyle mine, East Kimberley, Western Australia',
    lesson: 'Rarity',
    text: 'Small, and the largest vivid pink the Argyle mine ever offered. Argyle gave the world about nine in ten of its pink diamonds. It stood on Gija and Miriwoong country, and closed in 2020.'
  },
  {
    id: 'tiffany', name: 'The Tiffany Yellow', real: true, carat: 128.54, cut: 'Cushion brilliant, 82 facets', shape: 'cushion',
    color: 'Fancy yellow', tint: '#ffe26a', clarity: 'VS1, by Tiffany', origin: 'Kimberley, South Africa',
    lesson: 'Cut for colour',
    text: 'Cut from a 287.42-carat crystal with 82 facets, two dozen more than a standard brilliant, to make the yellow blaze. Nitrogen gives it its colour.'
  },
  {
    id: 'cullinan', name: 'Cullinan I · The Great Star of Africa', real: true, carat: 530.2, cut: 'Pear brilliant, 74 facets', shape: 'pear',
    color: 'Colourless', tint: '#ffffff', clarity: 'Not formally graded', origin: 'Premier Mine, Cullinan, South Africa',
    lesson: 'The largest crystal',
    text: 'Cut from the Cullinan, at 3,106 carats the largest gem diamond crystal ever found. It is set in the Sovereign’s Sceptre of the British Crown Jewels.'
  },
  {
    id: 'kohinoor', name: 'The Koh-i-Noor', real: true, carat: 105.6, cut: 'Oval brilliant', shape: 'oval',
    color: 'Colourless', tint: '#fffdf4', clarity: 'Not formally graded', origin: 'Probably Golconda, India',
    lesson: 'The Mountain of Light',
    text: 'Its name is Persian for “Mountain of Light”. Won and lost by Mughal, Persian, Afghan and Sikh rulers, it was taken by Britain in 1849. India and others have asked for its return.'
  }
];
const GEM_BY_ID = {}; GEMS.forEach((g, i) => { g.n = i; GEM_BY_ID[g.id] = g; });
const GEM_TOTAL_CT = GEMS.reduce((a, g) => a + g.carat, 0);

/* Hi-res faceted gem, drawn with canvas paths. g: 2D context, already scaled; r: radius in its units. */
function gemOutline(shape, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU - Math.PI / 2;
    let x = Math.cos(a), y = Math.sin(a);
    if (shape === 'oval') { x *= 0.78; }
    else if (shape === 'cushion') { const p = 0.72; x = Math.sign(x) * Math.pow(Math.abs(x), p) * 0.92; y = Math.sign(y) * Math.pow(Math.abs(y), p) * 0.92; }
    else if (shape === 'princess') { const m = Math.max(Math.abs(x), Math.abs(y)); x = x / m * 0.8; y = y / m * 0.8; }
    else if (shape === 'emerald') { const m = Math.max(Math.abs(x) * 1.35, Math.abs(y), (Math.abs(x) * 1.35 + Math.abs(y)) / 1.72); x = x / m; y = y / m; }
    else if (shape === 'pear') { const t = (1 - y) / 2; const wdt = 0.78 * Math.pow(Math.sin(Math.PI * Math.pow(1 - t, 0.72)), 0.85); x = Math.sign(x) * Math.min(Math.abs(x) / Math.max(0.001, Math.sqrt(1 - y * y)), 1) * wdt; y = y * 1.02 + 0.02; }
    pts.push([x, y]);
  }
  return pts;
}
function drawGemHi(g, cx, cy, r, gem, t) {
  const N = gem.shape === 'emerald' || gem.shape === 'princess' ? 32 : 32;
  const out = gemOutline(gem.shape, N);
  const sc = (k, p) => [cx + p[0] * r * k, cy + p[1] * r * k];
  const tint = gem.tint;
  const shade = (i, ring) => {
    const a = i / N * TAU + ring * 0.9;
    const v = 0.5 + 0.5 * Math.sin(a * 2 + t * 0.02 + ring * 1.7) * Math.cos(a * 3 - t * 0.013 + i * 0.37);
    const h = hash2(i * 7 + ring * 31, gem.n * 13 + 5);
    const k = clamp(v * 0.75 + h * 0.45, 0, 1);
    return k > 0.62 ? mix(tint, '#ffffff', (k - 0.62) / 0.38 * 0.95) : mix('#10182c', tint, 0.25 + k / 0.62 * 0.75);
  };
  g.save();
  g.lineJoin = 'round';
  // glow
  const gl = g.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.1);
  gl.addColorStop(0, tint + 'aa'); gl.addColorStop(0.45, tint + '33'); gl.addColorStop(1, tint + '00');
  g.fillStyle = gl; g.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
  const tri = (a, b, c2, col) => { g.fillStyle = col; g.strokeStyle = col; g.lineWidth = r * 0.012; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c2[0], c2[1]); g.closePath(); g.fill(); g.stroke(); };
  if (gem.shape === 'emerald') {
    // step cut: concentric bands
    const rings = [1, 0.84, 0.68, 0.52];
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, col = shade(Math.floor(i / 4), k);
      const a = sc(rings[k], out[i]), b = sc(rings[k], out[j]), c2 = sc(rings[k + 1], out[j]), d = sc(rings[k + 1], out[i]);
      g.fillStyle = col; g.strokeStyle = col; g.lineWidth = r * 0.012; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c2[0], c2[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill(); g.stroke();
    }
    g.fillStyle = mix(tint, '#ffffff', 0.55 + 0.25 * Math.sin(t * 0.03)); g.beginPath(); out.forEach((p, i) => { const q = sc(0.52, p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.fill();
  } else {
    // brilliant: girdle -> mid ring -> table
    const M = 8, step = N / M;
    for (let m = 0; m < M; m++) {
      const i0 = m * step, i1 = i0 + step / 2, i2 = (i0 + step) % N;
      const g0 = sc(1, out[i0]), g1 = sc(1, out[i1]), g2 = sc(1, out[i2]);
      const m1 = sc(0.74, out[i1]), t0 = sc(0.5, out[i0]), t2 = sc(0.5, out[i2]);
      tri(g0, g1, m1, shade(m * 4, 0)); tri(g1, g2, m1, shade(m * 4 + 1, 0));
      tri(g0, m1, t0, shade(m * 4 + 2, 1)); tri(g2, m1, t2, shade(m * 4 + 3, 1));
      tri(t0, m1, t2, shade(m * 4 + 1, 2));
    }
    // table with pavilion star seen through it
    g.fillStyle = mix(tint, '#ffffff', 0.5 + 0.2 * Math.sin(t * 0.03)); g.beginPath();
    for (let m = 0; m < M; m++) { const q = sc(0.5, out[m * step]); m ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.closePath(); g.fill();
    for (let m = 0; m < M; m++) { const a = sc(0.5, out[m * step]), b = sc(0.5, out[((m + 1) * step) % N]); tri(a, b, [cx, cy + (gem.shape === 'pear' ? r * 0.12 : 0)], shade(m * 3, 3) + ''); }
    g.globalAlpha = 0.35; g.fillStyle = '#ffffff'; g.beginPath();
    for (let m = 0; m < M; m++) { const q = sc(0.5, out[m * step]); m ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.closePath(); g.fill(); g.globalAlpha = 1;
  }
  // rim light
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = r * 0.02; g.beginPath(); out.forEach((p, i) => { const q = sc(1, p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.stroke();
  // sparkles
  for (let i = 0; i < 4; i++) {
    const ph = (t * 0.02 + i * 0.27) % 1, a = Math.sin(ph * Math.PI);
    const p = out[(i * 9 + 3 + gem.n) % N], k = 0.55 + 0.4 * hash2(i, gem.n);
    const x = cx + p[0] * r * k, y = cy + p[1] * r * k, s = r * 0.22 * a;
    g.fillStyle = `rgba(255,255,255,${a})`;
    g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill();
  }
  g.restore();
}
