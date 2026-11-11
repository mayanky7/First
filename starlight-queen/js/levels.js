'use strict';
/* Starlight Queen — one long road, built from regions laid end to end.
   Coordinates inside a region use tile columns (x) and "altitude" (a): a = 0 is the bottom row,
   so ground of height h has its walking surface at altitude h. */
const ROWS = 22;
const REGIONS = [
  {
    theme: 'north', cols: 232, title: 'Finland', sub: 'Kaamos, in the long winter night', map: 0,
    build(L) {
      L.g(0, 40, 3); L.start(3, 3);
      L.sign(12, 3, 'Tonttu: “I’ll keep the porridge warm. Go.”');
      L.door(39, 3, 8, 'The last gate of Kaamos stands open.');
      
      L.s(13, 4, 4);
      L.b(20, 6, '?');
      
      L.b(31, 5, '???'); L.b(32, 8, '?'); L.gem('first', 32, 11);
      L.g(41, 47, 4); L.cp(43, 4); L.g(48, 57, 5); L.s(50, 6, 3); L.e('goblin', 53, 5);
      L.g(58, 66, 3); L.sign(60, 3, '[X]  loose a starlight arrow');
      
      L.g(70, 84, 3); L.b(74, 6, '?S?'); L.e('goblin', 79, 3);
      L.p(86, 4, 2); L.p(89, 5, 2); L.s(86, 6, 2); L.keep('himmeli', 90, 8);
      L.g(93, 104, 3); L.sign(95, 3, '[SPACE] in the air, and hold, to glide');
      L.g(100, 104, 5);
      L.arc(105, 8, 8);
      L.g(113, 146, 3); L.cp(98, 3);
      L.b(119, 6, '???'); L.e('wolf', 127, 3); L.sign(117, 3, 'Wolves. Hold [↓] and be still under your cloak.'); L.sign(123, 3, '♪ The lane goes round, the lane comes back,|but I have boots and a starlit pack.');
      L.g(128, 131, 4); L.g(132, 135, 5); L.g(136, 139, 6); L.wonder('fox', 137, 6); L.s(136, 7, 4);
      L.b(143, 6, 'H');
      L.g(150, 170, 3); L.e('goblin', 156, 3); 
      L.b(160, 6, '???'); L.b(161, 10, '?');
      
      L.p(172, 4, 3); L.p(177, 6, 3); L.p(181, 4, 3); L.s(172, 6, 3); L.s(181, 6, 3);
      L.m(180, 9, 2); L.gem('cut', 181, 12); 
      L.g(184, 231, 3); L.b(192, 6, '??'); L.sign(188, 3, 'Under this drift something small and round sleeps till spring.'); L.e('wolf', 198, 3);
      L.g(204, 206, 4); L.g(207, 209, 5); L.g(210, 231, 6); L.s(204, 6, 6);
      L.sign(214, 6, 'The last fence. Light the beacon, Ana.');
      L.beacon(221, 6, 'The beacon of Kaamos burns behind you');
    }
  },
  {
    theme: 'north', cols: 36, join: true,
    build(L) { // the frozen gulf
      L.liq(0, 35, 2); L.g(0, 2, 3);
      L.sign(1, 3, 'A cold thing crosses this ice at night. She only wants to be warm.');
      L.mp(4, 2, 3, 3, 0, 210); L.p(11, 2, 3); L.mp(15, 2, 3, 4, 0, 230, 0.5); L.p(23, 2, 2); L.mp(26, 2, 3, 4, 0, 190);
      L.s(11, 4, 3); L.gem('clarity', 17, 7); L.s(23, 4, 2); L.e('bat', 14, 9, { free: true });
      L.g(33, 35, 3);
    }
  },
  {
    theme: 'meads', cols: 252, title: 'Sweden', sub: 'The manic midsummer lands', map: 1, manic: 1.3,
    build(L) {
      L.g(0, 30, 3);
      
      L.cp(7, 3);
      L.s(11, 4, 3); L.e('goblin', 17, 3);
      L.p(20, 5, 3); L.p(25, 8, 4); L.s(25, 10, 4); L.e('spider', 27, 8, { len: 4 });
      L.g(31, 33, 5); L.g(34, 44, 3); L.e('wolf', 42, 3); L.b(37, 6, '???'); L.sign(35, 3, 'DANCE! EAT! LEAP! No sleeping till August!');
      L.g(48, 70, 3);
      L.p(49, 5, 3); L.p(53, 8, 3); L.p(57, 11, 10); L.s(58, 13, 5); L.gem('colour', 65, 14);
      L.e('spider', 61, 11, { len: 8 }); L.e('goblin', 58, 3);
      L.g(75, 95, 3); L.g(80, 82, 5); L.p(84, 9, 3); L.e('spider', 85, 9, { len: 4 }); L.b(88, 6, '?H?');
      L.s(80, 6, 3);
      L.p(97, 4, 2); L.p(101, 5, 3); L.s(97, 6, 2); L.s(101, 7, 2);
      L.g(104, 125, 3); L.cp(106, 3);
      
      L.p(107, 6, 2); L.p(110, 9, 12);
      L.e('spider', 113, 9, { len: 5 }); L.e('spider', 121, 9, { len: 5 });
      L.s(111, 4, 10); L.s(111, 11, 3); L.b(118, 13, 'S');
      L.g(126, 128, 5); L.g(129, 131, 7); L.s(129, 8, 2); L.keep('dala', 131, 9); L.wonder('frogs', 144, 3);
      L.g(132, 150, 3); L.b(133, 6, '???');
      L.g(154, 156, 3); L.s(154, 5, 3);
      L.g(160, 180, 3); L.cp(161, 3); L.e('wolf', 166, 3);
      L.p(163, 6, 2); L.p(167, 9, 4); L.e('spider', 169, 9, { len: 5 }); L.s(167, 11, 4);
      L.g(181, 184, 5); L.g(185, 188, 7); L.g(189, 200, 9); L.e('goblin', 194, 9);
      
      L.arc(201, 11, 12); L.p(205, 4, 3); L.gem('pink', 206, 7);
      L.g(213, 251, 3); L.e('goblin', 226, 3); L.b(222, 6, '?H?');
      L.g(236, 238, 4); L.g(239, 251, 5); L.beacon(244, 5, 'The midsummer beacon burns');
    }
  },
  { theme: 'meads', cols: 8, join: true, build(L) { L.g(0, 3, 7); L.g(4, 7, 9); L.s(1, 8, 2); } },
  {
    theme: 'halls', cols: 252, title: 'Sweden', sub: 'The iron deeps of Kiruna', map: 2, roof: 2,
    build(L) {
      L.ceil(0, 251, 2);
      L.g(0, 18, 10);
      L.door(5, 10, 6, 'The door into the deeps remembers how to open.');
      
      L.sign(9, 10, '♪ The dark is deep, the dark is long, and —|She stops singing here.');
      L.torch(11, 10);
      L.g(19, 22, 8); L.g(23, 26, 6); L.g(27, 50, 4); L.s(20, 9, 2); L.s(24, 7, 2);
      L.ceil(27, 50, 4);
      L.e('bat', 31, 15); L.e('goblin', 37, 4); L.b(38, 7, '???'); L.torch(34, 4); L.torch(47, 4);
      L.liq(51, 58, 2); L.mp(51, 3, 3, 5, 0, 200); L.arc(52, 6, 6);
      L.g(59, 75, 4); L.e('bat', 63, 15); L.e('goblin', 68, 4); L.torch(61, 4); L.torch(73, 4); L.b(65, 7, '?H?');
      L.g(76, 78, 6); L.liq(79, 81, 2); L.g(82, 84, 7); L.liq(85, 87, 2); L.g(88, 90, 6); L.liq(91, 93, 2); L.keep('ore', 89, 8); L.wonder('undersky', 160, 12);
      L.s(82, 8, 3);
      L.g(94, 110, 4); L.cp(96, 4); L.torch(99, 4);
      
      L.ceil(94, 126, 5);
      L.liq(111, 124, 1); L.p(111, 3, 14); L.e('troll', 119, 4);
      L.g(125, 140, 4); L.b(129, 7, '?S?'); L.e('bat', 132, 14); L.torch(127, 4); L.torch(138, 4);
      L.g(141, 143, 6); L.g(144, 146, 8); L.g(147, 149, 10); L.g(150, 170, 12);
      L.s(141, 7, 3); L.s(144, 9, 3); L.s(147, 11, 3);
      L.torch(151, 12); L.torch(168, 12); L.b(152, 15, '?');
      L.gem('deep', 152, 17);
      L.g(171, 200, 5); L.e('troll', 181, 5); L.e('bat', 176, 14); L.spk(191, 193, 5); L.b(185, 8, '?H?');
      L.torch(177, 5); L.torch(197, 5); L.cp(173, 5);
      L.liq(201, 216, 2); L.mp(201, 4, 3, 4, 0, 200); L.mp(209, 4, 3, 5, 0, 200, 0.5); L.e('ember', 208, 2, { h: 8 });
      L.g(217, 251, 5); L.e('goblin', 222, 5);
      L.g(229, 231, 6); L.g(232, 234, 7); L.g(235, 251, 8); L.torch(237, 8); L.torch(247, 8);
      L.beacon(242, 8, 'The lamp of the deeps is kindled');
    }
  },
  {
    theme: 'sea', cols: 62, title: 'The Western Sea', sub: 'Every map she owned ended here', map: 3,
    build(L) { // the sea crossing
      L.liq(0, 61, 2);
      L.g(0, 4, 8); L.g(5, 7, 5); L.g(8, 11, 3);
      
      L.cp(10, 3);
      L.mp(12, 2, 5, 37, 0, 1300); L.mp(12, 2, 5, 37, 0, 1300, 0.5); // two rafts, so one is never far
      for (let i = 0; i < 5; i++) L.arc(16 + i * 7, 6, 4);
      L.keep('compass', 34, 6); L.wonder('whale', 30, 3);
      L.g(54, 61, 3); L.sign(57, 3, '♪ The sea is wide, the raft is small,|and no one hears me sing at all.');
    }
  },
  {
    theme: 'canyon', cols: 252, title: 'United States', sub: 'A far country of red rock and rivers', map: 3,
    build(L) {
      L.liq(0, 251, 1);
      L.g(0, 22, 3); L.cp(3, 3); L.cp(19, 3, true);
      
      L.sign(10, 3, 'There is a field here where anyone may dig for diamonds.');
      L.b(16, 6, '?'); L.gemBlock('unclesam', 17, 6); L.b(18, 6, '?');
      L.s(9, 4, 3); L.e('wraith', 30, 6); L.sign(21, 3, 'A lantern, already lit. She did not light it.');
      L.g(26, 34, 3); L.e('wolf', 31, 3);
      L.p(36, 2, 2); L.p(39, 2, 2); L.s(36, 4, 2); L.s(39, 4, 2); L.e('wraith', 41, 7);
      L.g(43, 60, 3); L.b(47, 6, '???'); L.e('goblin', 49, 3); L.spk(53, 54, 3);
      L.mp(61, 2, 3, 5, 0, 230);
      L.g(69, 80, 3); L.keep('quartz', 75, 7); L.wonder('arch', 204, 3); L.g(73, 76, 5); L.e('wolf', 78, 3); L.s(73, 6, 4);
      L.p(82, 5, 2); L.p(86, 7, 2); L.p(90, 5, 3); L.gem('dresden', 87, 11);
      L.e('wraith', 84, 3);
      L.g(93, 112, 3); L.cp(95, 3);
      L.sign(98, 3, 'Dust-wraiths. Only light undoes them.');
      L.b(101, 6, '?H?'); L.mark('canyonBack', 105, 3);
      
      L.warp(110, 3, 'ozArrive');
      L.g(116, 118, 3); L.g(122, 124, 4); L.g(128, 140, 3); L.e('wolf', 133, 3);
      L.s(116, 5, 3); L.s(122, 6, 3);
      L.mp(141, 2, 3, 3, 0, 200); L.mp(147, 2, 3, 3, 0, 200, 0.5);
      L.g(153, 170, 3); L.cp(155, 3); L.b(158, 6, '?S?'); L.e('troll', 165, 3);
      L.g(171, 173, 5); L.g(174, 176, 7); L.arc(177, 9, 5); L.m(177, 6, 12); L.gem('hope', 183, 10);
      L.g(189, 215, 3);
      L.b(192, 6, '?H?');
      L.g(219, 251, 3); L.e('goblin', 224, 3); L.g(232, 234, 4); L.g(235, 251, 5); L.beacon(242, 5, 'The canyon beacon burns');
    }
  },
  {
    theme: 'gloam', cols: 232, title: 'The Hoarder’s Mesa', sub: 'Where the light was taken', map: 4,
    build(L) {
      L.liq(0, 231, 2);
      L.g(0, 20, 3);
      
      L.sign(24, 3, 'When the sky reddens, he is looking. Hold [↓]. Be a stone.');
      L.g(23, 24, 3); L.e('ember', 21, 2, { h: 6 }); L.e('ember', 26, 2, { h: 6, ph: 0.5 });
      L.g(27, 45, 3); L.e('troll', 38, 3); L.b(31, 6, '?H?');
      L.g(46, 48, 5); L.g(49, 51, 7); L.g(52, 70, 9); L.s(46, 6, 3); L.s(49, 8, 3);
      L.e('goblin', 55, 9); L.e('wraith', 66, 11); L.spk(62, 63, 9); L.sign(69, 9, '♪ The road goes west, the road goes far —|I’ll walk it home by a borrowed star.');
      L.mp(71, 8, 3, 2, 0, 180); L.mp(78, 8, 3, 2, 0, 180, 0.5); L.e('ember', 76, 2, { h: 10 }); L.arc(72, 12, 4); L.arc(79, 12, 4);
      L.g(83, 100, 9); L.cp(85, 9); L.e('troll', 93, 9); L.b(88, 12, '?S?');
      L.g(101, 103, 11); L.g(104, 118, 13); L.keep('key', 111, 15); L.wonder('kings', 9, 3); L.sign(105, 13, 'Far ahead, on the wind: somebody is singing her song.'); L.e('goblin', 108, 13); L.e('wraith', 116, 15);
      L.p(120, 11, 2); L.m(123, 9, 4); L.p(128, 10, 2); L.mp(131, 9, 3, 4, 0, 190); L.p(138, 9, 2);
      L.s(120, 13, 2); L.s(128, 12, 2); L.gem('tiffany', 125, 13);
      L.e('ember', 127, 2, { h: 11 });
      L.g(140, 165, 9); L.e('troll', 150, 9); L.b(146, 12, '?H?'); L.spk(161, 162, 9);
      L.g(166, 168, 11); L.g(169, 231, 13); L.cp(172, 13);
      L.sign(175, 13, 'The Hoarder King. Strike when his fire dims.');
      L.b(175, 15, '?H?'); L.gem('cullinan', 176, 18); L.door(179, 13, 8, 'The last door. Beyond it, only him.'); L.arc(141, 11, 5); L.s(152, 10, 4);
      L.arena(181, 204, 13);
      L.sign(207, 13, '♪ The dark is deep, the dark is long,|and someone, somewhere, knows this song.');
      L.npc(216, 13);
      L.beacon(226, 13, 'The last beacon burns', true);
    }
  },
  {
    theme: 'oz', cols: 156, title: 'Australia', sub: 'It is already tomorrow here', map: 3, warp: true,
    build(L) {
      L.liq(0, 155, 1);
      L.g(0, 60, 3); L.mark('ozArrive', 4, 3); L.cp(6, 3);
      
      L.s(13, 4, 4); L.e('goblin', 19, 3);
      L.sign(23, 3, 'Cane toads. Do not lick them.');
      L.p(27, 6, 4); L.e('spider', 29, 6, { len: 3 }); L.s(27, 8, 4);
      L.sign(33, 3, 'The drop bear is only a story. Look up anyway.');
      L.b(38, 6, '?H?');
      L.wonder('cross', 52, 3);
      L.mp(61, 2, 3, 5, 0, 230); L.arc(62, 6, 6);
      L.g(69, 100, 3); 
      L.e('bat', 78, 9, { free: true }); L.e('bat', 90, 9, { free: true });
      L.b(84, 5, '???'); L.keep('opal', 85, 9);
      L.g(96, 98, 5); L.g(99, 101, 7);
      
      L.m(102, 6, 9); L.gem('argyle', 106, 10); L.arc(103, 8, 6);
      L.g(111, 155, 3); L.e('wraith', 120, 6);
      
      L.e('wolf', 132, 3); L.b(126, 6, '?S?'); L.s(136, 4, 5);
      
      L.warp(148, 3, 'canyonBack');
    }
  }
];

function buildWorld() {
  const rows = ROWS, cols = REGIONS.reduce((a, r) => a + r.cols, 0);
  const grid = [];
  for (let y = 0; y < rows; y++) grid.push(new Array(cols).fill('.'));
  const out = { grid, rows, cols, ents: [], torches: [], start: { x: 40, y: 0 }, arena: null, zones: [], gemBlocks: {}, popN: {}, doors: [], marks: {} };
  const row = a => rows - 1 - a;
  const set = (x, a, ch) => { const r = row(a); if (r >= 0 && r < rows && x >= 0 && x < cols) grid[r][x] = ch; };
  const py = a => (rows - a) * T;
  let ox = 0, shardN = 0;
  REGIONS.forEach((reg, ri) => {
    const px = x => (x + ox) * T + 8, X = x => x + ox;
    const x0 = ox;
    const shard = (x, y) => out.ents.push({ t: 'shard', x, y, n: shardN++ });
    const L = {
      g(a0, a1, h) { for (let x = a0; x <= a1; x++) for (let a = 0; a < h; a++) set(X(x), a, '#'); },
      ceil(a0, a1, th) { for (let x = a0; x <= a1; x++) for (let i = 0; i < th + (reg.roof || 0); i++) grid[i][X(x)] = '#'; },
      liq(a0, a1, h) { for (let x = a0; x <= a1; x++) for (let a = 0; a < h; a++) set(X(x), a, '~'); },
      p(x, a, w) { for (let i = 0; i < w; i++) set(X(x) + i, a, '='); },
      b(x, a, str) { for (let i = 0; i < str.length; i++) { set(X(x) + i, a, str[i]); if (str[i] === '?') out.popN[(X(x) + i) + ',' + row(a)] = shardN++; } },
      spk(a0, a1, a) { for (let x = a0; x <= a1; x++) set(X(x), a, '^'); },
      s(x, a, n) { for (let i = 0; i < n; i++) shard(px(x + i), py(a) - 3); },
      arc(x, a, n) { for (let i = 0; i < n; i++) shard(px(x + i), py(a) - 3 - Math.sin((i + 0.5) / n * Math.PI) * 20); },
      e(t, x, a, o) { out.ents.push(Object.assign({ t, x: px(x), y: py(a), manic: reg.manic || 1, sk: reg.theme }, o || {})); },
      keep(id, x, a) { out.ents.push({ t: 'keep', x: px(x), y: py(a), keep: id }); },
      mp(x, a, w, dx, dy, per, ph) { out.ents.push({ t: 'plat', x: X(x) * T, y: py(a) - T, w: w * T, dx: dx * T, dy: -dy * T, per, ph: ph || 0 }); },
      cp(x, a, lit) { out.ents.push({ t: 'lantern', x: px(x), y: py(a), on: !!lit }); },
      wonder(id, x, a) { out.ents.push({ t: 'wonder', x: px(x), y: py(a), wonder: id }); },
      warp(x, a, to) { out.ents.push({ t: 'warp', x: px(x), y: py(a), to }); },
      mark(id, x, a) { out.marks[id] = { x: px(x), y: py(a) }; },
      beacon(x, a, text, final) { out.ents.push({ t: 'beacon', x: px(x), y: py(a), text, final: !!final }); },
      sign(x, a, text) { out.ents.push({ t: 'sign', x: px(x), y: py(a), text }); },
      gem(id, x, a) { out.ents.push({ t: 'gem', x: px(x), y: py(a), gem: id }); },
      gemBlock(id, x, a) { set(X(x), a, 'G'); out.gemBlocks[X(x) + ',' + row(a)] = id; },
      npc(x, a) { out.ents.push({ t: 'boy', x: px(x), y: py(a) }); },
      torch(x, a) { out.torches.push({ x: px(x), y: py(a) - 22 }); },
      start(x, a) { out.start = { x: px(x), y: py(a) }; },
      m(x, a, w) { for (let i = 0; i < w; i++) set(X(x) + i, a, 'M'); },
      door(x, a, h, text) { for (let i = 0; i < h; i++) set(X(x), a + i, 'D'); out.doors.push({ id: 'd' + X(x), cx: X(x), cy: row(a), h, text }); },
      arena(a0, a1, a) {
        out.arena = { x0: X(a0) * T, x1: (X(a1) + 1) * T, floor: py(a), gl: X(a0) - 1, gr: X(a1) + 1, a };
        for (let i = 0; i < 9; i++) set(X(a1) + 1, a + i, 'X');
        out.ents.push({ t: 'boss', x: px(a1 - 5), y: py(a) });
      }
    };
    reg.build(L);
    const last = out.zones[out.zones.length - 1];
    if (reg.join && last && last.theme === reg.theme) last.x1 = (x0 + reg.cols) * T;
    else out.zones.push({ x0: x0 * T, x1: (x0 + reg.cols) * T, theme: reg.theme, title: reg.title || null, sub: reg.sub, map: reg.map, manic: reg.manic || 1, warp: !!reg.warp });
    ox += reg.cols;
  });
  // a joining stretch that opens a new theme borrows the title of the region it leads into
  for (let i = 0; i < out.zones.length - 1; i++) if (!out.zones[i].title) { const n = out.zones[i + 1]; out.zones[i].title = n.title; out.zones[i].sub = n.sub; out.zones[i].map = n.map; n.quiet = true; }
  out.melee = shardN;
  return out;
}
const WONDER_TOTAL = 7;
const MAP_NAMES = ['Kaamos · Finland', 'The Midsummer Lands · Sweden', 'The Iron Deeps of Kiruna', 'Red Rock Country · United States', 'The Hoarder’s Mesa'];
