// ============================================================
// Romantic Piano BGM Generator v2 — 富有变化的浪漫纯音乐
// Features: varied melody, arpeggios, dynamics, counter-melody
// ============================================================

const RomanticBGM = (function () {
  let ctx = null;
  let masterGain = null, reverbGain = null;
  let playing = false;
  let schedulerTimer = null;
  let reverbNode = null;

  // Note frequencies
  const NF = {};
  const NN = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  for (let o = 0; o <= 8; o++)
    NN.forEach((n, i) => { NF[n + o] = 440 * Math.pow(2, (o * 12 + i - 69) / 12); });
  // Flat aliases
  for (let o = 1; o <= 7; o++) {
    [['Db','C#'],['Eb','D#'],['Fb','E'],['Gb','F#'],['Ab','G#'],['Bb','A#']].forEach(([f,n]) => {
      if (NF[n+o]) NF[f+o] = NF[n+o];
    });
  }
  NF['Cb2']=NF['B1']; NF['Cb3']=NF['B2']; NF['Cb4']=NF['B3'];

  const F = n => NF[n] || 440;

  // Reverb impulse
  function makeReverb(dur, decay) {
    const sr = ctx.sampleRate, len = sr * dur;
    const buf = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, decay);
    }
    const conv = ctx.createConvolver(); conv.buffer = buf; return conv;
  }

  // Piano voice: richer harmonics + hammer attack
  function piano(time, note, dur, vel) {
    const f = F(note), v = vel * 0.3;
    // Fundamental
    const o1 = ctx.createOscillator(); o1.type='sine'; o1.frequency.value=f;
    // 2nd harmonic (soft)
    const o2 = ctx.createOscillator(); o2.type='triangle'; o2.frequency.value=f*2; o2.detune.value=4;
    // 3rd harmonic (very soft)
    const o3 = ctx.createOscillator(); o3.type='sine'; o3.frequency.value=f*3;
    // 4th harmonic (barely audible, adds shimmer)
    const o4 = ctx.createOscillator(); o4.type='sine'; o4.frequency.value=f*4;
    // Hammer noise burst
    const noise = ctx.createBufferSource();
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i=0;i<nd.length;i++) nd[i]=(Math.random()*2-1)*Math.pow(1-i/nd.length, 8);
    noise.buffer = noiseBuf;

    const g1=ctx.createGain(), g2=ctx.createGain(), g3=ctx.createGain(), g4=ctx.createGain(), gn=ctx.createGain();
    const env=ctx.createGain();
    g1.gain.value=1; g2.gain.value=0.2; g3.gain.value=0.07; g4.gain.value=0.03; gn.gain.value=0.12*vel;

    // ADSR
    const a=0.015, d=0.25, s=v*0.35, r=Math.min(dur*0.55, 1.5);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(v, time+a);
    env.gain.linearRampToValueAtTime(s, time+a+d);
    env.gain.setValueAtTime(Math.max(s, 0.001), time+dur-r);
    env.gain.linearRampToValueAtTime(0, time+dur);

    [o1,o2,o3,o4].forEach((o,i)=>{[g1,g2,g3,g4][i].connect(env); o.connect([g1,g2,g3,g4][i]);});
    gn.connect(env); noise.connect(gn);
    env.connect(masterGain); env.connect(reverbNode);

    const end = time+dur+0.1;
    [o1,o2,o3,o4].forEach(o=>{o.start(time);o.stop(end);});
    noise.start(time); noise.stop(time+0.05);
  }

  // Soft pad (sine waves, slow attack, for sustained tones)
  function pad(time, note, dur, vel) {
    const f=F(note), v=vel*0.15;
    const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
    const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=f*1.002; // gentle chorus
    const env=ctx.createGain();
    const a=Math.min(0.4, dur*0.3), r=Math.min(0.8, dur*0.4);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(v, time+a);
    env.gain.setValueAtTime(v, time+dur-r);
    env.gain.linearRampToValueAtTime(0, time+dur);
    o.connect(env); o2.connect(env);
    env.connect(masterGain); env.connect(reverbNode);
    [o,o2].forEach(x=>{x.start(time);x.stop(time+dur+0.1);});
  }

  // --- Timing ---
  const BPM = 66;
  const Q = 60/BPM;
  const E = Q/2;
  const S = Q/4;
  const T = Q/3;  // triplet eighth
  const DOT = d => d*1.5;
  const BAR = Q*3;

  // --- Chord library ---
  const C = {
    Fmaj7:  ['F2','A2','C3','E3'],
    Fmaj:   ['F2','A2','C3'],
    Fmaj9:  ['F2','A2','C3','E3','G3'],
    Dm7:    ['D3','F3','A3','C4'],
    Dm:     ['D3','F3','A3'],
    Bbmaj7: ['Bb2','D3','F3','A3'],
    Bb:     ['Bb2','D3','F3'],
    Bbsus4: ['Bb2','Eb3','F3'],
    C7:     ['C3','E3','G3','Bb3'],
    Cmaj:   ['C3','E3','G3'],
    Csus4:  ['C3','F3','G3'],
    Am7:    ['A2','C3','E3','G3'],
    Am:     ['A2','C3','E3'],
    Gm7:    ['G2','Bb2','D3','F3'],
    Gm:     ['G2','Bb2','D3'],
    Eb:     ['Eb3','G3','Bb3'],
    Ebmaj7: ['Eb3','G3','Bb3','D4'],
    G7:     ['G2','B2','D3','F3'],
    G7sus4: ['G2','C3','D3','F3'],
    Edim:   ['E3','G3','Bb3'],
    Adim:   ['A2','C3','Eb3'],
  };

  // --- Section definitions ---
  // Each bar: { bass, chord, melody[], counter[], bassPattern, chordPattern, vel }

  // INTRO — gentle, spacious
  const intro = [
    {bass:'F3',ch:'Fmaj7',  mel:['A4','G4','A4'],      cnt:[],                bp:'sus', cp:'arp_up',   vel:0.3},
    {bass:'Bb2',ch:'Bbmaj7', mel:['D5','C5','Bb4'],     cnt:['F4'],            bp:'sus', cp:'arp_up',   vel:0.32},
    {bass:'D3',ch:'Dm7',     mel:['F4','E4','D4'],       cnt:['A4'],            bp:'sus', cp:'arp_up',   vel:0.3},
    {bass:'C3',ch:'C7',      mel:['E4','G4','F4'],       cnt:[],                bp:'sus', cp:'arp_up',   vel:0.28},
  ];

  // SECTION A — main theme, warm
  const secA = [
    {bass:'F2',ch:'Fmaj7',  mel:['C5','A4','F4','A4'],  cnt:['E4','C4'],       bp:'root',cp:'arp_up',   vel:0.4},
    {bass:'D3',ch:'Dm7',    mel:['A4','F4','D4','F4'],   cnt:['C4'],            bp:'root',cp:'arp_up',   vel:0.38},
    {bass:'Bb2',ch:'Bbmaj7',mel:['D5','F5','E5','D5'],   cnt:['A4','F4'],       bp:'root',cp:'arp_roll', vel:0.42},
    {bass:'C3',ch:'C7',     mel:['E5','D5','C5','Bb4'],  cnt:['G4'],            bp:'root',cp:'arp_roll', vel:0.4},
    {bass:'F2',ch:'Fmaj9',  mel:['A4','C5','F5','E5'],   cnt:['G4','E4'],       bp:'root',cp:'arp_up',   vel:0.42},
    {bass:'A2',ch:'Am7',    mel:['E5','C5','A4','G4'],   cnt:[],                bp:'root',cp:'arp_up',   vel:0.38},
    {bass:'Bb2',ch:'Bbmaj7',mel:['F5','D5','Bb4','D5'],  cnt:['A4'],            bp:'root',cp:'arp_roll', vel:0.42},
    {bass:'C3',ch:'Csus4',  mel:['G4','F4','E4','G4'],   cnt:[],                bp:'root',cp:'block_q',  vel:0.36},
  ];

  // SECTION A' — variation, higher register, more ornate
  const secA2 = [
    {bass:'F2',ch:'Fmaj7',  mel:['F5','E5','C5','A4'],  cnt:['C5'],            bp:'root',cp:'arp_roll', vel:0.45},
    {bass:'D3',ch:'Dm7',    mel:['A4','C5','F5','E5'],   cnt:['F4'],            bp:'root',cp:'arp_up',   vel:0.42},
    {bass:'Bb2',ch:'Bbsus4',mel:['F5','Eb5','D5','Bb4'], cnt:['F4'],            bp:'root',cp:'arp_roll', vel:0.45},
    {bass:'C3',ch:'C7',     mel:['G5','F5','E5','D5'],   cnt:['Bb4'],           bp:'root',cp:'arp_roll', vel:0.44},
    {bass:'F2',ch:'Fmaj7',  mel:['A5','G5','F5','C5'],   cnt:['E4','A4'],       bp:'sus', cp:'arp_up',   vel:0.46},
    {bass:'A2',ch:'Am7',    mel:['C5','E5','G5','F5'],   cnt:[],                bp:'root',cp:'arp_up',   vel:0.42},
    {bass:'Bb2',ch:'Bbmaj7',mel:['D5','F5','A5','G5'],   cnt:['F4'],            bp:'root',cp:'arp_roll', vel:0.44},
    {bass:'G2',ch:'G7sus4', mel:['D5','C5','Bb4','A4'],  cnt:[],                bp:'root',cp:'block_q',  vel:0.4},
  ];

  // SECTION B — expressive, wider range, emotional peak
  const secB = [
    {bass:'Eb3',ch:'Ebmaj7',mel:['D5','Bb4','G4','Bb4'],cnt:['D4'],            bp:'pedal',cp:'arp_up',  vel:0.48},
    {bass:'Bb2',ch:'Bbmaj7',mel:['F5','D5','Bb4','D5'],  cnt:['A4','F4'],       bp:'pedal',cp:'arp_roll',vel:0.5},
    {bass:'G2',ch:'Gm7',    mel:['Bb4','D5','F5','D5'],  cnt:['G4'],            bp:'root',cp:'arp_up',   vel:0.46},
    {bass:'C3',ch:'C7',     mel:['A4','G4','F4','E4'],   cnt:['Bb4'],           bp:'root',cp:'arp_roll', vel:0.44},
    {bass:'A2',ch:'Am7',    mel:['C5','E5','G5','E5'],   cnt:['A4'],            bp:'root',cp:'arp_up',   vel:0.48},
    {bass:'D3',ch:'Dm7',    mel:['F5','E5','D5','C5'],   cnt:['A4'],            bp:'root',cp:'arp_roll', vel:0.46},
    {bass:'Bb2',ch:'Bbmaj7',mel:['D5','F5','Bb5','A5'],  cnt:['F4'],            bp:'pedal',cp:'arp_up',  vel:0.5},
    {bass:'C3',ch:'Cmaj',   mel:['G4','E4','C4','E4'],   cnt:[],                bp:'root',cp:'block_h',  vel:0.4},
  ];

  // BRIDGE — tension and release
  const bridge = [
    {bass:'G2',ch:'G7',     mel:['B4','D5','F5','D5'],  cnt:['G4'],            bp:'root',cp:'arp_up',   vel:0.44},
    {bass:'G2',ch:'G7sus4', mel:['C5','D5','F5','D5'],  cnt:[],                bp:'root',cp:'arp_up',   vel:0.42},
    {bass:'A2',ch:'Adim',   mel:['C5','Eb5','C5','A4'], cnt:[],                bp:'root',cp:'arp_roll', vel:0.44},
    {bass:'Bb2',ch:'Bbmaj7',mel:['D5','F5','D5','Bb4'], cnt:['A4'],            bp:'root',cp:'arp_up',   vel:0.46},
    {bass:'C3',ch:'C7',     mel:['E5','G5','F5','E5'],  cnt:['Bb4'],           bp:'root',cp:'arp_roll', vel:0.48},
    {bass:'F2',ch:'Fmaj9',  mel:['A4','C5','F5','A5'],  cnt:['G4','E4'],       bp:'sus', cp:'arp_up',   vel:0.5},
    {bass:'D3',ch:'Dm7',    mel:['F5','A5','G5','F5'],  cnt:['C5'],            bp:'root',cp:'arp_roll', vel:0.46},
    {bass:'C3',ch:'Csus4',  mel:['G4','F4','G4','C5'],  cnt:[],                bp:'root',cp:'block_q',  vel:0.42},
  ];

  // OUTRO — fading, spacious
  const outro = [
    {bass:'F3',ch:'Fmaj7',  mel:['C5','A4'],            cnt:['E4'],            bp:'sus', cp:'arp_slow',  vel:0.3},
    {bass:'Bb2',ch:'Bbmaj7',mel:['D5','F5'],            cnt:['A4'],            bp:'sus', cp:'arp_slow',  vel:0.28},
    {bass:'F2',ch:'Fmaj',   mel:['A4','C5'],            cnt:[],                bp:'sus', cp:'arp_slow',  vel:0.25},
    {bass:'F2',ch:'Fmaj',   mel:['F4'],                 cnt:['A4','C5'],       bp:'sus', cp:'long',      vel:0.22},
  ];

  // Full structure: intro -> A -> B -> A' -> bridge -> A -> B -> A' -> outro
  const song = [
    ...intro,
    ...secA, ...secB,
    ...secA2, ...bridge,
    ...secA, ...secB,
    ...secA2,
    ...outro,
  ];

  // --- Pattern schedulers ---
  function schedulePattern(bar, t) {
    const ch = C[bar.ch] || C.Fmaj7;
    const v = bar.vel;
    const pattern = bar.cp;
    const bp = bar.bp;

    // Bass
    if (bp === 'pedal') {
      pad(t, bar.bass, BAR*0.95, v*0.6);
    } else if (bp === 'sus') {
      piano(t, bar.bass, BAR*0.9, v*0.5);
    } else {
      piano(t, bar.bass, DOT(Q), v*0.55);
    }

    // Chord pattern
    const chordNotes = ch.slice(0, 3);
    if (pattern === 'arp_up') {
      // Ascending arpeggio across beats
      chordNotes.forEach((n, i) => {
        piano(t + Q*0.0 + i*E*0.15, n, Q*0.7, v*0.45);
      });
    } else if (pattern === 'arp_roll') {
      // Rolling arpeggio spread across 2 beats
      chordNotes.forEach((n, i) => {
        piano(t + i*T, n, Q*0.6, v*0.42);
      });
    } else if (pattern === 'arp_slow') {
      // Slow arpeggio, whole bar
      chordNotes.forEach((n, i) => {
        piano(t + i*Q*0.4, n, Q*1.2, v*0.35);
      });
    } else if (pattern === 'block_q') {
      // Block chord on beat 2
      chordNotes.forEach(n => piano(t+Q, n, Q*0.8, v*0.4));
    } else if (pattern === 'block_h') {
      // Block chord sustained
      chordNotes.forEach(n => piano(t+Q*0.5, n, Q*2, v*0.38));
    } else {
      // Default: gentle chord
      chordNotes.forEach((n, i) => piano(t+Q+i*E*0.1, n, Q*0.7, v*0.4));
    }

    // Melody — varied rhythm
    const mel = bar.mel;
    if (mel.length >= 4) {
      // 4 notes: sixteenth or eighth pattern
      const rhythms = [
        [E, E, E, E],         // even eighths
        [DOT(E), S, E, E],    // dotted + short
        [E, DOT(E), S, E],    // varied
        [S, S, E, DOT(E)],    // short-short-long
      ];
      const rIdx = Math.floor((t / Q) * 0.1) % rhythms.length;
      const r = rhythms[rIdx];
      let mt = t + Q*0.5; // melody starts beat 2
      mel.forEach((n, i) => {
        const noteDur = Math.min(r[i]*0.85, Q*0.9);
        const noteVel = v + (i===0?0.1:i===mel.length-1?-0.05:0);
        piano(mt, n, noteDur, Math.min(noteVel, 0.65));
        mt += r[i];
      });
    } else if (mel.length === 3) {
      // 3 notes: triplet or dotted pattern
      const patterns = [
        [Q, Q, Q],            // quarter notes
        [DOT(E), DOT(E), Q],  // dotted eighths
        [Q, DOT(Q), E],       // long + short
      ];
      const rIdx = Math.floor((t / Q) * 0.07) % patterns.length;
      const r = patterns[rIdx];
      let mt = t + Q*1.5;
      mel.forEach((n, i) => {
        piano(mt, n, Math.min(r[i]*0.8, Q), v + 0.08);
        mt += r[i];
      });
    } else if (mel.length === 2) {
      // 2 notes: call and response
      piano(t + Q*1, mel[0], Q*0.85, v+0.05);
      piano(t + Q*2, mel[1], Q*0.8, v);
    } else if (mel.length === 1) {
      // Single sustained note
      piano(t + Q*1.5, mel[0], Q*1.3, v+0.05);
    }

    // Counter-melody (subtle, on off-beats)
    if (bar.cnt && bar.cnt.length > 0) {
      bar.cnt.forEach((n, i) => {
        const ct = t + Q*0.75 + i*Q*0.5;
        pad(ct, n, Q*0.6, v*0.25);
      });
    }
  }

  // --- Scheduler ---
  let nextTime = 0, barIdx = 0;
  const LOOK = 0.12;
  const INTERVAL = 40;

  function tick() {
    while (nextTime < ctx.currentTime + LOOK) {
      schedulePattern(song[barIdx % song.length], nextTime);
      nextTime += BAR;
      barIdx++;
    }
  }

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    reverbNode = makeReverb(4, 2.8);
    reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);
    reverbNode.connect(reverbGain);
    reverbGain.connect(ctx.destination);
  }

  return {
    start() {
      init();
      if (ctx.state === 'suspended') ctx.resume();
      if (masterGain) masterGain.gain.value = 0.55;
      if (reverbGain) reverbGain.gain.value = 0.35;
      if (playing) return;
      playing = true;
      nextTime = ctx.currentTime + 0.05;
      barIdx = 0;
      schedulerTimer = setInterval(tick, INTERVAL);
    },
    stop() {
      if (!playing) return;
      playing = false;
      clearInterval(schedulerTimer);
      schedulerTimer = null;
      if (masterGain) {
        masterGain.gain.cancelScheduledValues(ctx.currentTime);
        masterGain.gain.value = 0;
      }
      if (reverbGain) {
        reverbGain.gain.cancelScheduledValues(ctx.currentTime);
        reverbGain.gain.value = 0;
      }
    },
    setVolume(v) { if (masterGain) masterGain.gain.value = Math.max(0,Math.min(1,v)); },
    isPlaying() { return playing; },
  };
})();