// Playful kid-friendly sound effects using Web Audio API
let audioCtx: AudioContext | null = null;
let soundMode: "full" | "quiet" | "off" = "full";
let ambienceTimer: number | null = null;

export function setSoundMode(mode: "full" | "quiet" | "off") {
  soundMode = mode;
  if (mode === "off") stopModeAmbience();
}

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.15, ramp = true) {
  if (soundMode === "off") return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol * (soundMode === "quiet" ? 0.38 : 1), ctx.currentTime);
    if (ramp) gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio is an enhancement and may be blocked until the first interaction.
  }
}

export function pulseGamepad(duration = 45, strongMagnitude = 0.25) {
  try {
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      const actuator = pad?.vibrationActuator as (GamepadHapticActuator & { playEffect?: (type: string, params: object) => Promise<string> }) | undefined;
      actuator?.playEffect?.("dual-rumble", { duration, strongMagnitude, weakMagnitude: Math.min(1, strongMagnitude * 0.65) });
    }
  } catch {
    // Haptics are optional and unavailable on many browsers.
  }
}

export function stopModeAmbience() {
  if (ambienceTimer !== null) window.clearInterval(ambienceTimer);
  ambienceTimer = null;
}

export function startModeAmbience(mode: "hub" | "story" | "swarm" | "arcade" | "discovery" | "strategy" | "progress") {
  stopModeAmbience();
  if (soundMode === "off") return;
  const palettes = {
    hub: [220, 330], story: [196, 294], swarm: [110, 165], arcade: [330, 495],
    discovery: [262, 392], strategy: [147, 220], progress: [247, 370],
  } as const;
  const notes = palettes[mode];
  let flip = false;
  ambienceTimer = window.setInterval(() => {
    if (document.hidden || soundMode === "off") return;
    playTone(flip ? notes[0] : notes[1], 1.6, "sine", 0.012);
    flip = !flip;
  }, 4200);
}

export function playLaserSound() {
  if (soundMode === "off") return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(760, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime((soundMode === "quiet" ? 0.025 : 0.06), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.1);
  } catch { /* Audio is optional. */ }
}

export function playImpactSound() {
  playNotes([{ freq: 130, delay: 0, dur: 0.08, type: "square", vol: 0.08 }, { freq: 520, delay: 0.035, dur: 0.07, type: "triangle", vol: 0.05 }]);
  pulseGamepad(42, 0.22);
}

export function playReloadSound() {
  playNotes([{ freq: 260, delay: 0, dur: 0.05, type: "square", vol: 0.035 }, { freq: 420, delay: 0.12, dur: 0.06, type: "square", vol: 0.04 }]);
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
  } catch {
    // Audio is an enhancement and may be unavailable on some devices.
  }
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
