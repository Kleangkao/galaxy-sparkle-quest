// Playful kid-friendly sound effects using Web Audio API
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.15, ramp = true) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    if (ramp) gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playNotes(notes: { freq: number; delay: number; dur: number; type?: OscillatorType; vol?: number }[]) {
  notes.forEach(n => {
    setTimeout(() => playTone(n.freq, n.dur, n.type || "sine", n.vol || 0.12), n.delay * 1000);
  });
}

/** 💎 Crystal collect — bright ascending chime */
export function playCrystalSound() {
  playNotes([
    { freq: 880, delay: 0, dur: 0.1, type: "sine", vol: 0.1 },
    { freq: 1100, delay: 0.06, dur: 0.1, type: "sine", vol: 0.12 },
    { freq: 1320, delay: 0.12, dur: 0.15, type: "sine", vol: 0.1 },
  ]);
}

/** 🚀 Planet travel — whooshy rising sweep */
export function playTravelSound() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

/** 👽 Alien pet discovery — magical sparkle arpeggio */
export function playPetDiscoverySound() {
  playNotes([
    { freq: 523, delay: 0, dur: 0.15, type: "triangle", vol: 0.12 },
    { freq: 659, delay: 0.1, dur: 0.15, type: "triangle", vol: 0.12 },
    { freq: 784, delay: 0.2, dur: 0.15, type: "triangle", vol: 0.12 },
    { freq: 1047, delay: 0.3, dur: 0.3, type: "sine", vol: 0.15 },
    { freq: 1319, delay: 0.45, dur: 0.3, type: "sine", vol: 0.1 },
  ]);
}

/** 🔘 Button click — soft pop */
export function playClickSound() {
  playTone(600, 0.08, "sine", 0.08);
}

/** 🎉 Victory celebration — triumphant fanfare */
export function playVictorySound() {
  playNotes([
    { freq: 523, delay: 0, dur: 0.2, type: "square", vol: 0.08 },
    { freq: 659, delay: 0.15, dur: 0.2, type: "square", vol: 0.08 },
    { freq: 784, delay: 0.3, dur: 0.2, type: "square", vol: 0.08 },
    { freq: 1047, delay: 0.45, dur: 0.4, type: "square", vol: 0.1 },
    { freq: 1047, delay: 0.7, dur: 0.15, type: "sine", vol: 0.12 },
    { freq: 1175, delay: 0.85, dur: 0.15, type: "sine", vol: 0.12 },
    { freq: 1319, delay: 1.0, dur: 0.5, type: "sine", vol: 0.15 },
  ]);
}

/** 📦 Chest open — rattle and reveal */
export function playChestSound() {
  playNotes([
    { freq: 300, delay: 0, dur: 0.08, type: "square", vol: 0.06 },
    { freq: 350, delay: 0.06, dur: 0.08, type: "square", vol: 0.06 },
    { freq: 500, delay: 0.15, dur: 0.1, type: "sine", vol: 0.1 },
    { freq: 800, delay: 0.25, dur: 0.2, type: "sine", vol: 0.12 },
  ]);
}

/** 🤖 Robot beep */
export function playRobotSound() {
  playNotes([
    { freq: 440, delay: 0, dur: 0.1, type: "square", vol: 0.06 },
    { freq: 880, delay: 0.12, dur: 0.1, type: "square", vol: 0.06 },
    { freq: 660, delay: 0.24, dur: 0.15, type: "square", vol: 0.05 },
  ]);
}

/** ❌ Fail sound — descending */
export function playFailSound() {
  playNotes([
    { freq: 400, delay: 0, dur: 0.2, type: "sawtooth", vol: 0.08 },
    { freq: 300, delay: 0.15, dur: 0.2, type: "sawtooth", vol: 0.08 },
    { freq: 200, delay: 0.3, dur: 0.4, type: "sawtooth", vol: 0.06 },
  ]);
}

/** 👣 Step/move sound */
export function playStepSound() {
  playTone(220 + Math.random() * 80, 0.05, "triangle", 0.04);
}

/** 🔒 Locked sound — soft denied thud */
export function playLockedSound() {
  playNotes([
    { freq: 200, delay: 0, dur: 0.12, type: "square", vol: 0.06 },
    { freq: 150, delay: 0.1, dur: 0.15, type: "square", vol: 0.05 },
  ]);
}
