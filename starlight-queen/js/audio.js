'use strict';
/* Starlight Queen — audio: WebAudio chiptune sequencer + sound effects. All music is original. */
const Sound = (() => {
  let ac = null, master, musicBus, sfxBus, hornLP, noiseBuf;
  let muted = false;
  try { muted = localStorage.getItem('sq-mute') === '1'; } catch (e) { }

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(n) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(n);
    if (!m) return null;
    return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ac) { if (ac.state !== 'running') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.9;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 5;
    master.connect(comp); comp.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    // gentle echo for a "great hall" feel
    const d = ac.createDelay(1); d.delayTime.value = 0.31;
    const fb = ac.createGain(); fb.gain.value = 0.3;
    const wet = ac.createGain(); wet.gain.value = 0.28;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    musicBus.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(master);
    hornLP = ac.createBiquadFilter(); hornLP.type = 'lowpass'; hornLP.frequency.value = 1100; hornLP.connect(musicBus);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    if (pending) { const p = pending; pending = null; curName = null; music(p); }
  }

  function tone(o) {
    if (!ac) return;
    const t0 = (o.at || ac.currentTime) + (o.delay || 0), dur = o.dur || 0.1, vol = o.vol || 0.2;
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
    if (o.vib) {
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = 5.5; lg.gain.value = o.f * 0.006;
      l.connect(lg); lg.connect(osc.frequency); l.start(t0 + 0.08); l.stop(t0 + dur + 0.05);
    }
    const a = o.attack || 0.006;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + a);
    if (o.sustain) {
      g.gain.setValueAtTime(vol, t0 + Math.max(a, dur * 0.75));
      g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    } else g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    osc.connect(g); g.connect(o.dest || sfxBus);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }
  function noise(o) {
    if (!ac) return;
    const t0 = (o.at || ac.currentTime) + (o.delay || 0), dur = o.dur || 0.1;
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = o.ftype || 'highpass'; f.frequency.setValueAtTime(o.freq || 4000, t0);
    if (o.freq2) f.frequency.exponentialRampToValueAtTime(o.freq2, t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(o.vol || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || sfxBus);
    src.start(t0, Math.random()); src.stop(t0 + dur + 0.02);
  }

  /* ---------- sound effects ---------- */
  const FX = {
    jump() { tone({ type: 'triangle', f: 330, f2: 660, dur: 0.16, vol: 0.22 }); },
    glide() { noise({ ftype: 'bandpass', freq: 900, freq2: 1600, dur: 0.25, vol: 0.16 }); },
    shard() { tone({ type: 'triangle', f: 1319, dur: 0.07, vol: 0.2 }); tone({ type: 'triangle', f: 1760, dur: 0.2, vol: 0.2, delay: 0.06 }); },
    stomp() { tone({ type: 'square', f: 300, f2: 90, dur: 0.14, vol: 0.2 }); noise({ ftype: 'lowpass', freq: 900, dur: 0.08, vol: 0.2 }); },
    arrow() { tone({ type: 'triangle', f: 1400, f2: 500, dur: 0.13, vol: 0.16 }); noise({ freq: 5000, dur: 0.06, vol: 0.06 }); },
    empty() { tone({ type: 'square', f: 140, dur: 0.05, vol: 0.08 }); },
    hit() { tone({ type: 'square', f: 520, f2: 180, dur: 0.1, vol: 0.14 }); },
    hurt() { tone({ type: 'sawtooth', f: 400, f2: 110, dur: 0.3, vol: 0.2 }); noise({ ftype: 'lowpass', freq: 1500, dur: 0.15, vol: 0.15 }); },
    die() { [659, 587, 494, 440, 330, 247].forEach((f, i) => tone({ type: 'triangle', f, dur: 0.3, vol: 0.22, delay: i * 0.13, vib: true })); },
    bump() { tone({ type: 'square', f: 170, f2: 120, dur: 0.07, vol: 0.14 }); },
    crumble() { noise({ ftype: 'lowpass', freq: 1800, freq2: 300, dur: 0.22, vol: 0.3 }); tone({ type: 'square', f: 130, f2: 60, dur: 0.12, vol: 0.14 }); },
    item() { [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', f, dur: 0.1, vol: 0.18, delay: i * 0.05 })); },
    heal() { [784, 988, 1175].forEach((f, i) => tone({ type: 'triangle', f, dur: 0.16, vol: 0.2, delay: i * 0.08 })); },
    power() { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => tone({ type: 'triangle', f, dur: 0.16, vol: 0.2, delay: i * 0.06 })); },
    oneup() { [659, 784, 1319, 1047, 1175, 1568].forEach((f, i) => tone({ type: 'square', f, dur: 0.12, vol: 0.1, delay: i * 0.1 })); },
    lantern() { [587, 880, 1175, 1760].forEach((f, i) => tone({ type: 'triangle', f, dur: 0.35, vol: 0.18, delay: i * 0.09 })); },
    beacon() {
      noise({ ftype: 'lowpass', freq: 300, freq2: 2400, dur: 1.2, vol: 0.3 });
      tone({ type: 'sawtooth', f: 60, f2: 180, dur: 1.1, vol: 0.2 });
    },
    fanfare() {
      const seq = [[587, 0, .18], [587, .2, .18], [587, .4, .18], [784, .6, .5], [698, 1.15, .18], [784, 1.35, .18], [880, 1.55, .9]];
      seq.forEach(([f, d, l]) => {
        tone({ type: 'square', f, dur: l, vol: 0.11, delay: d, sustain: true });
        tone({ type: 'triangle', f: f / 2, dur: l, vol: 0.2, delay: d, sustain: true });
        tone({ type: 'triangle', f: f * 1.5, dur: l, vol: 0.08, delay: d, sustain: true });
      });
    },
    deflect() { tone({ type: 'square', f: 1800, f2: 2400, dur: 0.06, vol: 0.18 }); },
    bosshit() { tone({ type: 'sawtooth', f: 220, f2: 55, dur: 0.3, vol: 0.25 }); noise({ ftype: 'lowpass', freq: 2500, dur: 0.2, vol: 0.2 }); },
    slam() { tone({ type: 'sine', f: 110, f2: 30, dur: 0.5, vol: 0.5 }); noise({ ftype: 'lowpass', freq: 700, freq2: 100, dur: 0.45, vol: 0.4 }); },
    roar() { tone({ type: 'sawtooth', f: 90, f2: 50, dur: 1.1, vol: 0.3 }); tone({ type: 'sawtooth', f: 134, f2: 70, dur: 1.1, vol: 0.2 }); noise({ ftype: 'lowpass', freq: 600, dur: 1.0, vol: 0.2 }); },
    warn() { tone({ type: 'square', f: 196, dur: 0.12, vol: 0.2 }); tone({ type: 'square', f: 185, dur: 0.2, vol: 0.2, delay: 0.14 }); },
    ember() { noise({ ftype: 'bandpass', freq: 1200, freq2: 300, dur: 0.25, vol: 0.3 }); },
    wraith() { tone({ type: 'sine', f: 700, f2: 300, dur: 0.6, vol: 0.12, vib: true }); tone({ type: 'sine', f: 740, f2: 280, dur: 0.6, vol: 0.08 }); },
    growl() { tone({ type: 'sawtooth', f: 110, f2: 80, dur: 0.25, vol: 0.12 }); },
    select() { tone({ type: 'triangle', f: 660, dur: 0.06, vol: 0.14 }); },
    confirm() { tone({ type: 'triangle', f: 660, dur: 0.08, vol: 0.18 }); tone({ type: 'triangle', f: 990, dur: 0.22, vol: 0.18, delay: 0.07 }); },
    shatter() {
      noise({ freq: 3000, freq2: 8000, dur: 1.4, vol: 0.3 });
      [2093, 1568, 2637, 1760, 3136, 2349].forEach((f, i) => tone({ type: 'triangle', f, dur: 0.5, vol: 0.14, delay: i * 0.09 }));
    },
    gem() {
      [1047, 1319, 1568, 2093, 2637, 3136].forEach((f, i) => { tone({ type: 'triangle', f, dur: 0.5, vol: 0.2, delay: i * 0.085, vib: i > 3 }); tone({ type: 'sine', f: f / 2, dur: 0.6, vol: 0.12, delay: i * 0.085 }); });
      noise({ freq: 6000, freq2: 9000, dur: 0.9, vol: 0.06 });
    },
    star() { tone({ type: 'triangle', f: 1568, f2: 2093, dur: 0.6, vol: 0.16, vib: true }); }
  };
  function sfx(name) { if (ac && FX[name]) FX[name](); }

  /* ---------- music ---------- */
  // Each song: step (seconds per eighth), bar (steps per bar), chords per bar, melody per bar ("N4.2" = note, length in steps).
  const SONGS = {
    title: {
      step: 0.36, bar: 6, lead: 'flute', arp: [0, 1, 2, 3, 2, 1], bass: 'long',
      chords: ['Dm', 'Dm', 'C', 'Am', 'Bb', 'F', 'C', 'Dm', 'Dm', 'Bb', 'F', 'C', 'Gm', 'Dm', 'A', 'Dm'],
      mel: ['A4.2 D5.2 E5.2', 'F5.4 E5.2', 'E5.2 D5.2 C5.2', 'C5.2 A4.4', 'Bb4.2 D5.2 F5.2', 'A5.4 G5.2', 'G5.2 E5.2 C5.2', 'D5.6',
        'D5.2 F5.2 A5.2', 'Bb5.4 A5.2', 'A5.2 F5.2 C5.2', 'E5.4 G5.2', 'G5.2 Bb5.2 A5.2', 'F5.4 D5.2', 'E5.2 C#5.2 E5.2', 'D5.6']
    },
    meads: {
      step: 0.17, bar: 6, lead: 'whistle', arp: [0, 2, 3, 1, 2, 3], bass: 'jig', drums: 'jig', vary: true,
      chords: ['G', 'G', 'C', 'G', 'Em', 'C', 'D', 'G', 'C', 'G', 'D', 'G', 'C', 'G', 'D', 'G'],
      mel: ['G4 B4 D5 G5.2 D5', 'B4 D5 B4 A4 B4 G4', 'E5.2 C5 E5 G5 E5', 'D5.3 B4.2 D5', 'E5.2 G5 F#5 E5 D5', 'C5 E5 G5 E5.2 C5', 'D5 F#5 A5 F#5 E5 D5', 'G5.3 G4.3',
        'E5 G5 E5 C5.2 E5', 'D5 G5 D5 B4.2 D5', 'A4 D5 F#5 A5.2 F#5', 'G5.2 D5 B4.3', 'C5 E5 G5 C6.2 G5', 'B5.2 G5 D5.2 G5', 'A5 F#5 D5 E5 F#5 A5', 'G5.6']
    },
    wood: {
      step: 0.27, bar: 8, lead: 'flute', arp: [0, 1, 2, 3, 4, 3, 2, 1], bass: 'long',
      chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Am', 'F', 'C', 'Dm', 'E', 'Am', 'F', 'E', 'Am'],
      mel: ['E5.3 A5 G5.2 E5.2', 'F5.3 E5 C5.4', 'E5.2 G5.2 C6.3 B5', 'B5.2 G5.2 D5.4', 'E5.3 A5 C6.2 B5.2', 'A5.4 F5.2 A5.2', 'G5.2 B5.2 D6.2 B5.2', 'A5.8',
        'C6.3 A5 F5.2 A5.2', 'G5.3 E5 C5.4', 'F5.2 A5.2 D6.3 C6', 'B5.4 G#5.4', 'A5.3 E5 C5.2 E5.2', 'F5.2 A5.2 C6.4', 'B5.2 G#5.2 E5.2 G#5.2', 'A5.8']
    },
    halls: {
      step: 0.25, bar: 8, lead: 'horn', arp: [0, -1, 1, -1, 2, -1, 1, -1], bass: 'march', drums: 'march',
      chords: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'A', 'Dm', 'F', 'C', 'Gm', 'A', 'Dm', 'Bb', 'A', 'Dm'],
      mel: ['D4.3 D4 F4.2 E4.2', 'D4.4 A3.4', 'Bb3.3 D4 F4.2 D4.2', 'E4.4 C#4.4', 'D4.3 D4 F4.2 A4.2', 'Bb4.4 G4.2 Bb4.2', 'A4.2 G4.2 E4.2 C#4.2', 'D4.8',
        'F4.3 F4 A4.2 C5.2', 'C5.4 G4.4', 'Bb4.3 A4 G4.2 D4.2', 'E4.4 A4.4', 'D4.3 D4 F4.2 A4.2', 'D5.4 Bb4.2 F4.2', 'E4.2 A4.2 E4.2 C#4.2', 'D4.4 F4.2 E4.2']
    },
    fens: {
      step: 0.33, bar: 8, lead: 'flute', arp: [0, -1, 2, -1, 3, -1, 2, -1], bass: 'long',
      chords: ['Em', 'F', 'Em', 'Dm', 'Em', 'F', 'Dm', 'Em'],
      mel: ['B4.4 -.2 E5.2', 'F5.4 E5.2 C5.2', 'B4.6 G4.2', 'A4.4 F4.4', 'B4.4 -.2 E5.2', 'F5.2 A5.4 F5.2', 'E5.2 D5.2 A4.4', 'B4.8']
    },
    gloam: {
      step: 0.172, bar: 8, lead: 'lead', arp: [0, 2, 1, 2, 0, 2, 1, 2], bass: 'pulse', drums: 'drive', vary: true,
      chords: ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Ab', 'G', 'Fm', 'Cm', 'Ab', 'G', 'Fm', 'Cm', 'G', 'Cm'],
      mel: ['C5.2 Eb5 G5 C5.2 Eb5 G5', 'G5.3 F5 Eb5.2 D5.2', 'C5.2 Eb5 Ab5 C5.2 Eb5 Ab5', 'Bb5.3 Ab5 G5.2 F5.2', 'C5.2 Eb5 G5 C6.2 Bb5 G5', 'Eb5.2 D5.2 C5.4', 'Ab5.2 G5 F5 Eb5.2 C5.2', 'D5.2 G5.2 B5.4',
        'F5.2 Ab5 C6 F5.2 Ab5 C6', 'Eb6.3 D6 C6.2 G5.2', 'Ab5.2 C6 Eb6 Ab5.2 C6 Eb6', 'D6.3 C6 B5.2 G5.2', 'F5.2 Ab5.2 C6.2 Ab5.2', 'G5.2 Eb5.2 C5.4', 'D5.2 G5.2 B5.2 D6.2', 'C6.4 Eb6.2 D6.2']
    },
    boss: {
      step: 0.135, bar: 8, lead: 'lead', arp: [0, 0, 2, 0, 1, 0, 2, 0], bass: 'pulse', drums: 'drive',
      chords: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'A', 'Gm', 'Gm', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'],
      mel: ['D5 D5 A5 D5 F5 D5 A5 D5', 'D5 D5 A5 D5 G5 F5 E5 D5', 'Bb4 Bb4 F5 Bb4 D5 Bb4 F5 Bb4', 'C5 C5 G5 C5 E5 G5 C6.2',
        'D5 D5 A5 D5 F5 D5 A5 D5', 'F5.2 E5.2 D5.2 A4.2', 'Bb4 D5 F5 Bb5 F5 D5 Bb4.2', 'A4 C#5 E5 A5 G5 E5 C#5.2',
        'D6 Bb5 G5 Bb5 D6.2 Bb5.2', 'G5 G5 D6 G5 Bb5 G5 D6 G5', 'A5 A5 D6 A5 F5 A5 D6 A5', 'F5.2 E5.2 D5.2 A4.2',
        'Bb4 D5 F5 Bb5 D6.2 Bb5.2', 'C5 E5 G5 C6 E6.2 C6.2', 'A5 E5 C#5 E5 A5 E5 C#5 E5', 'A4 C#5 E5 A5 C#6.2 A5.2']
    },
    canyon: {
      step: 0.2, bar: 8, lead: 'whistle', arp: [0, 2, 1, 2, 3, 2, 1, 2], bass: 'march', drums: 'jig', vary: true,
      chords: ['Em', 'G', 'D', 'Em', 'C', 'G', 'D', 'Em', 'G', 'D', 'Am', 'Em', 'C', 'G', 'B', 'Em'],
      mel: ['E5.2 G5 A5 B5.2 A5 G5', 'B5.3 A5 G5.2 D5.2', 'F#5.2 A5 D6 A5.2 F#5.2', 'E5.4 B4.4', 'E5.2 G5 C6 B5.2 G5 E5', 'D5.2 G5.2 B5.4', 'A5.2 F#5 D5 F#5.2 A5.2', 'E5.8',
        'G5.2 B5 D6 B5.2 G5.2', 'A5.3 F#5 D5.4', 'E5.2 A5 C6 A5.2 E5.2', 'G5.3 E5 B4.4', 'E5 G5 C6 G5 E6.2 C6.2', 'D6.3 B5 G5.4', 'F#5.2 B5.2 D#6.2 B5.2', 'E6.8']
    },
    dawn: {
      step: 0.33, bar: 6, lead: 'flute', arp: [0, 1, 2, 3, 2, 1], bass: 'long',
      chords: ['D', 'D', 'G', 'A', 'Bm', 'G', 'A', 'D', 'G', 'D', 'Em', 'A', 'Bm', 'G', 'A', 'D'],
      mel: ['A4.2 D5.2 E5.2', 'F#5.4 E5.2', 'G5.2 B5.2 G5.2', 'A5.4 E5.2', 'F#5.2 D5.2 B4.2', 'B4.2 D5.2 G5.2', 'A5.2 G5.2 E5.2', 'D5.6',
        'B5.2 A5.2 G5.2', 'A5.4 F#5.2', 'G5.2 E5.2 B4.2', 'C#5.2 E5.4', 'F#5.2 B5.2 D6.2', 'D6.2 B5.2 G5.2', 'A5.2 C#6.2 E6.2', 'D6.6']
    }
  };

  function compile(song) {
    const ev = [];
    const bars = song.chords.length, len = bars * song.bar;
    const add = (s, d, m, inst, vol) => ev.push({ s, d, f: hz(m), inst, vol });
    song.chords.forEach((ch, bi) => {
      const m = /^([A-G][#b]?)(m?)$/.exec(ch);
      const pc = (midi(m[1] + '2') - 36) % 12;
      const third = m[2] ? 3 : 4;
      const vp = pc > 7 ? pc - 12 : pc;
      const tones = [48 + vp, 55 + vp, 60 + vp, 60 + vp + third, 67 + vp, 72 + vp];
      const s0 = bi * song.bar, root = 36 + pc + (pc > 7 ? -12 : 0) + 12;
      if (song.bass === 'long') { add(s0, song.bar, root, 'bass', 0.3); }
      else if (song.bass === 'jig') { add(s0, 2, root, 'bass', 0.3); add(s0 + 3, 2, root + 7, 'bass', 0.22); }
      else if (song.bass === 'march') { add(s0, 3, root, 'bass', 0.34); add(s0 + 4, 3, root + 7 - 12, 'bass', 0.28); }
      else if (song.bass === 'pulse') { for (let i = 0; i < song.bar; i++) add(s0 + i, 1, root + (i % 4 === 3 ? 12 : 0), 'bass', i % 2 ? 0.2 : 0.3); }
      if (song.arp) song.arp.forEach((ti, i) => { if (ti >= 0) add(s0 + i, 1.6, tones[ti], 'pluck', 0.11); });
      if (song.drums === 'jig') { ev.push({ s: s0, inst: 'tom', vol: 0.22 }, { s: s0 + 3, inst: 'hat', vol: 0.07 }, { s: s0 + 5, inst: 'hat', vol: 0.04 }); }
      if (song.drums === 'march') { ev.push({ s: s0, inst: 'kick', vol: 0.5 }, { s: s0 + 4, inst: 'tom', vol: 0.25 }, { s: s0 + 6, inst: 'tom', vol: 0.14 }, { s: s0 + 7, inst: 'tom', vol: 0.14 }); }
      if (song.drums === 'drive') {
        ev.push({ s: s0, inst: 'kick', vol: 0.5 }, { s: s0 + 4, inst: 'kick', vol: 0.5 }, { s: s0 + 2, inst: 'snare', vol: 0.16 }, { s: s0 + 6, inst: 'snare', vol: 0.16 });
        for (let i = 1; i < 8; i += 2) ev.push({ s: s0 + i, inst: 'hat', vol: 0.05 });
      }
      let s = s0;
      for (const tok of song.mel[bi].split(/\s+/)) {
        const [n, d] = tok.split('.');
        const dur = d ? +d : 1;
        if (n !== '-') { add(s, dur, midi(n), song.lead, 1); ev[ev.length - 1].lead = bi < 8; }
        s += dur;
      }
    });
    const byStep = [];
    for (let i = 0; i < len; i++) byStep.push([]);
    ev.forEach(e => byStep[e.s].push(e));
    return { step: song.step, len, byStep, vary: !!song.vary };
  }

  function playNote(e, t, step) {
    const dur = (e.d || 1) * step;
    switch (e.inst) {
      case 'flute': tone({ at: t, type: 'triangle', f: e.f, dur: dur * 0.98, vol: 0.34, attack: 0.03, sustain: true, vib: dur > 0.5, dest: musicBus }); break;
      case 'whistle': tone({ at: t, type: 'triangle', f: e.f, dur: dur * 0.9, vol: 0.3, attack: 0.012, sustain: true, dest: musicBus });
        tone({ at: t, type: 'square', f: e.f, dur: dur * 0.6, vol: 0.035, dest: musicBus }); break;
      case 'horn': tone({ at: t, type: 'sawtooth', f: e.f, dur: dur * 0.95, vol: 0.3, attack: 0.05, sustain: true, dest: hornLP });
        tone({ at: t, type: 'triangle', f: e.f / 2, dur: dur * 0.95, vol: 0.09, attack: 0.05, sustain: true, dest: musicBus }); break;
      case 'lead': tone({ at: t, type: 'square', f: e.f, dur: dur * 0.9, vol: 0.085, sustain: true, dest: musicBus });
        tone({ at: t, type: 'triangle', f: e.f, dur: dur * 0.9, vol: 0.17, sustain: true, dest: musicBus }); break;
      case 'pluck': tone({ at: t, type: 'triangle', f: e.f, dur: Math.max(0.25, dur), vol: e.vol, dest: musicBus }); break;
      case 'bass': tone({ at: t, type: 'triangle', f: e.f, dur: dur * 0.96, vol: e.vol, attack: 0.01, sustain: true, dest: musicBus }); break;
      case 'kick': tone({ at: t, type: 'sine', f: 130, f2: 38, dur: 0.22, vol: e.vol, dest: musicBus }); break;
      case 'tom': tone({ at: t, type: 'sine', f: 170, f2: 70, dur: 0.2, vol: e.vol, dest: musicBus }); break;
      case 'snare': noise({ at: t, ftype: 'bandpass', freq: 1800, dur: 0.12, vol: e.vol, dest: musicBus }); break;
      case 'hat': noise({ at: t, freq: 7000, dur: 0.04, vol: e.vol, dest: musicBus }); break;
    }
  }

  let cur = null, curName = null, timer = null, pending = null;
  const cache = {};
  function tick() {
    if (!ac || !cur) return;
    if (cur.next < ac.currentTime) { const st = cur.c.step * cur.rate, k = Math.ceil((ac.currentTime - cur.next) / st); cur.i = (cur.i + k) % cur.c.len; cur.next += k * st; }
    while (cur.next < ac.currentTime + 0.28) {
      if (cur.i === 0) cur.pass = (cur.pass || 0) + 1;
      for (const e of cur.c.byStep[cur.i]) { if (e.lead && cur.c.vary && cur.pass % 2 === 0) continue; playNote(e, cur.next, cur.c.step * cur.rate); }
      cur.next += cur.c.step * cur.rate;
      cur.i = (cur.i + 1) % cur.c.len;
    }
  }
  function music(name, rate) {
    if (name === curName) { if (cur && rate) cur.rate = rate; return; }
    curName = name;
    if (!ac) { pending = name; return; }
    cur = null;
    if (!name) return;
    const c = cache[name] || (cache[name] = compile(SONGS[name]));
    cur = { c, i: 0, next: ac.currentTime + 0.12, rate: rate || 1 };
    if (!timer) timer = setInterval(tick, 60);
  }
  function setRate(r) { if (cur) cur.rate = r; }
  function duck(on) { if (ac) musicBus.gain.setTargetAtTime(on ? 0.14 : 0.5, ac.currentTime, 0.1); }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem('sq-mute', muted ? '1' : '0'); } catch (e) { }
    if (ac) master.gain.setTargetAtTime(muted ? 0 : 0.9, ac.currentTime, 0.02);
    return muted;
  }
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend();
    else { ac.resume(); if (cur) cur.next = ac.currentTime + 0.1; }
  });

  return { init, sfx, music, setRate, duck, toggleMute, get muted() { return muted; }, get song() { return curName; }, SONGS, compile };
})();
