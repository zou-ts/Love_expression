// ============================================================
// Romantic Piano Music Generator v2 - 温柔浪漫答题背景音乐
// Uses absolute time tracking for correct MIDI timing
// ============================================================

const fs = require('fs');

// --- MIDI binary helpers ---
function varLen(n) {
  if (n < 0) n = 0;
  const buf = [];
  buf.push(n & 0x7F);
  n >>= 7;
  while (n > 0) {
    buf.push((n & 0x7F) | 0x80);
    n >>= 7;
  }
  return buf.reverse();
}
function str(s) { return [...Buffer.from(s, 'ascii')]; }
function u32(n) { return [(n>>24)&0xFF,(n>>16)&0xFF,(n>>8)&0xFF,n&0xFF]; }
function u16(n) { return [(n>>8)&0xFF, n&0xFF]; }

// Note helper
const N = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function n(name, oct) {
  const m = name.match(/^([A-G])(b|bb|#|x)?$/);
  let v = N[m[1]];
  if (m[2]==='#') v++; if (m[2]==='x') v+=2;
  if (m[2]==='b') v--; if (m[2]==='bb') v-=2;
  return v + (oct+1)*12;
}

// --- Time constants (PPQ=480) ---
const PPQ = 480;
const Q = PPQ;         // quarter
const H = Q*2;         // half
const W = Q*4;         // whole
const E = Q/2;         // eighth
const S = Q/4;         // sixteenth
const DOT = d => d + d/2;
const TRIP = d => d*2/3; // triplet

// --- Event scheduler ---
// Collects (absTime, bytes[]) then sorts and converts to delta
const events = [];
function ev(time, ...bytes) { events.push({t: Math.round(time), b: bytes}); }

function noteOn(time, ch, pitch, vel) { ev(time, 0x90|ch, pitch, vel); }
function noteOff(time, ch, pitch) { ev(time, 0x80|ch, pitch, 0); }
function controlChange(time, ch, ctrl, val) { ev(time, 0xB0|ch, ctrl, val); }
function programChange(time, ch, prog) { ev(time, 0xC0|ch, prog); }
function metaEvent(time, type, data) { ev(time, 0xFF, type, ...varLen(data.length), ...data); }
function setTempo(time, bpm) { metaEvent(time, 0x51, u32(Math.round(60000000/bpm)).slice(1)); }
function timeSig(time, num, den) { metaEvent(time, 0x58, [num, Math.log2(den)|0, 24, 8]); }
function keySig(time, sf, mi=0) { metaEvent(time, 0x59, [sf & 0xFF, mi]); }
function endOfTrack(time) { metaEvent(time, 0x2F, []); }

// Play a note: on at `t`, off at `t+dur`
function play(t, ch, pitch, vel, dur) {
  noteOn(t, ch, pitch, vel);
  noteOff(t + dur, ch, pitch);
}

// Play chord (block)
function chord(t, ch, notes, vel, dur) {
  notes.forEach(p => { noteOn(t, ch, p, vel); noteOff(t+dur, ch, p); });
}

// Arpeggiated chord: each note staggered by `gap`
function arpeggio(t, ch, notes, vel, dur, gap=E) {
  notes.forEach((p, i) => {
    noteOn(t + i*gap, ch, p, vel);
    noteOff(t + i*gap + dur, ch, p);
  });
}

// --- Compose piece ---
const CH = 0; // piano channel

// Metadata at time 0
setTempo(0, 68);         // 68 BPM - slow, gentle
timeSig(0, 3, 4);        // 3/4 waltz
keySig(-1, 0);           // F major (1 flat = -1)
programChange(0, CH, 0); // Acoustic Grand Piano

// Velocity layers
const V_BASS = 38;
const V_CHORD = 42;
const V_MELODY = 55;
const V_SOLO = 60;
const V_SOFT = 35;

// Chord voicings (root position, some inversions for smooth voice leading)
const Fmaj7  = [n('F',2), n('A',2), n('C',3), n('E',3)];
const Fmaj   = [n('F',2), n('A',2), n('C',3)];
const Dm7    = [n('D',3), n('F',3), n('A',3), n('C',4)];
const Bbmaj7 = [n('Bb',2), n('D',3), n('F',3), n('A',3)];
const Bb     = [n('Bb',2), n('D',3), n('F',3)];
const C7     = [n('C',3), n('E',3), n('G',3), n('Bb',3)];
const Cmaj   = [n('C',3), n('E',3), n('G',3)];
const Am7    = [n('A',2), n('C',3), n('E',3), n('G',3)];
const Am     = [n('A',2), n('C',3), n('E',3)];
const Gm7    = [n('G',2), n('Bb',2), n('D',3), n('F',3)];
const Gm     = [n('G',2), n('Bb',2), n('D',3)];
const Eb     = [n('Eb',3), n('G',3), n('Bb',3)];
const Ebmaj7 = [n('Eb',3), n('G',3), n('Bb',3), n('D',4)];

// Melody notes in F major
const F5=n('F',5), E5=n('E',5), D5=n('D',5), C5=n('C',5), Bb4=n('Bb',4);
const A4=n('A',4), G4=n('G',4), F4=n('F',4), E4=n('E',4), D4=n('D',4);
const C4=n('C',4), Bb3=n('Bb',3), A3=n('A',3);

let t = 0; // current absolute time

// ============================================================
// INTRO (8 bars) - Gentle arpeggios, setting the mood
// ============================================================
function intro() {
  const bars = [
    { bass: Fmaj7[0], ch: Fmaj7, mel: [A4, G4, A4] },
    { bass: Bbmaj7[0], ch: Bbmaj7, mel: [D5, C5, D5] },
    { bass: Dm7[0], ch: Dm7, mel: [F4, E4, F4] },
    { bass: C7[0], ch: C7, mel: [E4, D4, E4] },
    { bass: Fmaj7[0], ch: Fmaj7, mel: [C5, Bb4, A4] },
    { bass: Bbmaj7[0], ch: Bbmaj7, mel: [D5, F5, E5] },
    { bass: Am7[0], ch: Am7, mel: [E5, C5, A4] },
    { bass: Cmaj[0], ch: Cmaj, mel: [G4, E4, C4] },
  ];
  
  bars.forEach(({bass, ch: c, mel}) => {
    // Beat 1: bass note, very soft
    play(t, CH, bass - 12, V_SOFT, Q);
    // Beat 1-2: arpeggiated chord
    arpeggio(t + E, CH, c.slice(0, 3), V_CHORD - 8, Q, TRIP(E));
    // Beat 3: melody note, gentle
    play(t + H, CH, mel[0], V_MELODY - 10, Q - S);
    t += W; // 3 beats = 1 bar in 3/4 (but W=4Q, we need 3Q)
    // Actually in 3/4, a bar = 3 quarter notes
    t -= Q; // correction: was W (4Q), should be 3Q
  });
}

// ============================================================
// SECTION A (8 bars) - Main theme, waltz feel
// ============================================================
function sectionA() {
  const progression = [
    { bass: Fmaj7[0], ch: Fmaj7,  mel: [C5, A4, F4] },
    { bass: Dm7[0],   ch: Dm7,    mel: [A4, F4, D4] },
    { bass: Bbmaj7[0],ch: Bbmaj7, mel: [D5, Bb4, F4] },
    { bass: C7[0],    ch: C7,     mel: [E5, D5, C5] },
    { bass: Fmaj7[0], ch: Fmaj7,  mel: [F5, E5, C5] },
    { bass: Am7[0],   ch: Am7,    mel: [E5, C5, A4] },
    { bass: Bbmaj7[0],ch: Bbmaj7, mel: [F5, D5, Bb4] },
    { bass: Cmaj[0],  ch: Cmaj,   mel: [G4, E4, C4] },
  ];

  progression.forEach(({bass, ch: c, mel}, barIdx) => {
    // Beat 1: bass
    play(t, CH, bass - 12, V_BASS, H);
    // Beat 2: chord
    chord(t + Q, CH, c.slice(0, 3), V_CHORD, Q);
    // Beat 3: melody
    play(t + H, CH, mel[0], V_MELODY, Q - S);
    // Grace: approach to next bar
    if (barIdx < progression.length - 1) {
      play(t + H + Q - S, CH, mel[1], V_MELODY - 12, S);
    }
    t += Q * 3; // 3/4 bar
  });
}

// ============================================================
// SECTION B (8 bars) - More expressive, higher register
// ============================================================
function sectionB() {
  const progression = [
    { bass: Eb[0],    ch: Ebmaj7, mel: [D5, Bb4, G4] },
    { bass: Bbmaj7[0],ch: Bbmaj7, mel: [F5, D5, Bb4] },
    { bass: Gm7[0],   ch: Gm7,    mel: [Bb4, G4, D4] },
    { bass: C7[0],    ch: C7,     mel: [A4, G4, F4] },
    { bass: Am7[0],   ch: Am7,    mel: [C5, A4, E4] },
    { bass: Dm7[0],   ch: Dm7,    mel: [F4, D4, A3] },
    { bass: Bbmaj7[0],ch: Bbmaj7, mel: [D5, F5, E5] },
    { bass: Cmaj[0],  ch: Cmaj,   mel: [G4, E4, C4] },
  ];

  progression.forEach(({bass, ch: c, mel}) => {
    // Beat 1: bass + lower chord tone
    play(t, CH, bass - 12, V_BASS, DOT(Q));
    play(t + E, CH, c[0], V_SOFT, Q);
    // Beat 2: arpeggiated chord
    arpeggio(t + Q, CH, c.slice(0, 3), V_CHORD, Q, TRIP(E));
    // Beat 3: expressive melody (longer, with vibrato feel via two notes)
    play(t + H, CH, mel[0], V_MELODY + 5, DOT(E));
    play(t + H + DOT(E), CH, mel[1], V_MELODY - 8, E);
    t += Q * 3;
  });
}

// ============================================================
// SECTION A' (8 bars) - Reprise, slightly embellished
// ============================================================
function sectionAprime() {
  const progression = [
    { bass: Fmaj7[0], ch: Fmaj7,  mel: [C5, A4, G4, F4] },
    { bass: Dm7[0],   ch: Dm7,    mel: [A4, F4, E4, D4] },
    { bass: Bbmaj7[0],ch: Bbmaj7, mel: [F5, D5, C5, Bb4] },
    { bass: C7[0],    ch: C7,     mel: [E5, D5, C5, Bb4] },
    { bass: Fmaj7[0], ch: Fmaj7,  mel: [A4, C5, F5, E5] },
    { bass: Am7[0],   ch: Am7,    mel: [C5, E5, D5, C5] },
    { bass: Bbmaj7[0],ch: Bbmaj7, mel: [D5, F5, E5, D5] },
    { bass: Cmaj[0],  ch: Cmaj,   mel: [E4, G4, C5, G4] },
  ];

  progression.forEach(({bass, ch: c, mel}) => {
    // Beat 1: bass
    play(t, CH, bass - 12, V_BASS, H);
    // Beat 1+: chord enters softly
    chord(t + E, CH, c.slice(0, 3), V_CHORD - 5, Q + E);
    // Beat 3: melody run (4 notes in 1 beat = sixteenths)
    mel.forEach((p, i) => {
      play(t + H + i*S, CH, p, V_MELODY + (i===0?5:0) - i*3, S + 2);
    });
    t += Q * 3;
  });
}

// ============================================================
// INTRO REPRISE (4 bars) - Calming down
// ============================================================
function introReprise() {
  const bars = [
    { bass: Fmaj7[0], ch: Fmaj7, mel: A4 },
    { bass: Bbmaj7[0], ch: Bbmaj7, mel: D5 },
    { bass: Dm7[0], ch: Dm7, mel: F4 },
    { bass: Fmaj7[0], ch: Fmaj7, mel: C5 },
  ];
  
  bars.forEach(({bass, ch: c, mel}) => {
    play(t, CH, bass - 12, V_SOFT - 5, W);
    arpeggio(t + Q, CH, c.slice(0, 3), V_CHORD - 12, DOT(Q), E);
    play(t + H + Q, CH, mel, V_MELODY - 15, DOT(Q));
    t += Q * 3;
  });
}

// ============================================================
// OUTRO (4 bars) - Fade to silence
// ============================================================
function outro() {
  // Very soft, sustained chords
  const chords = [Fmaj7, Bbmaj7, Fmaj, Fmaj];
  chords.forEach((c, i) => {
    const vel = V_SOFT - 10 - i * 4;
    play(t, CH, c[0] - 12, Math.max(vel, 20), W + Q);
    chord(t + Q, CH, c.slice(0, 3), Math.max(vel, 20), W);
    // Let last chord ring extra long
    const barLen = i === chords.length - 1 ? Q * 6 : Q * 3;
    t += barLen;
  });
}

// ============================================================
// BUILD THE FULL PIECE
// ============================================================
// Repeat structure for ~4-5 minutes:
// Intro(8) -> A(8) -> A(8) -> B(8) -> A'(8) -> Intro(4) -> Outro(4)
// Total: 48 bars * ~2.65s/bar @ 68bpm = ~2:07
// Add repeats: Intro -> A -> A -> B -> A' -> A -> B -> A' -> Intro -> Outro = 80 bars ~3:30

intro();
sectionA();
sectionA();
sectionB();
sectionAprime();
sectionA();     // repeat A
sectionB();     // repeat B  
sectionAprime(); // repeat A'
introReprise();
outro();

endOfTrack(t);

// ============================================================
// Sort events by time, convert to delta, build track bytes
// ============================================================
events.sort((a, b) => a.t - b.t || 0);

const trackData = [];
let lastTime = 0;
events.forEach(({t: absT, b}) => {
  const delta = absT - lastTime;
  trackData.push(...varLen(Math.max(0, delta)), ...b);
  lastTime = absT;
});

// Build track chunk
const trackBytes = [...str('MTrk'), ...u32(trackData.length), ...trackData];

// Build file header
const headerBytes = [
  ...str('MThd'), ...u32(6),
  ...u16(0),    // format 0
  ...u16(1),    // 1 track
  ...u16(PPQ),  // ticks per quarter
];

const midi = Buffer.from([...headerBytes, ...trackBytes]);
const outPath = __dirname + '/温柔浪漫_答题背景音乐.mid';
fs.writeFileSync(outPath, midi);

console.log('=== Generated ===');
console.log('File: ' + outPath);
console.log('Size: ' + midi.length + ' bytes');
console.log('Tempo: 68 BPM');
console.log('Key: F major');
console.log('Time: 3/4 waltz');
console.log('Duration: ~4 minutes');
console.log('Instrument: Acoustic Grand Piano');
console.log('Structure: Intro -> A -> A -> B -> A\' -> A -> B -> A\' -> Intro -> Outro');
