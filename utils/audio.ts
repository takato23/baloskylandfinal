
// Simple Web Audio Synth to avoid external asset dependencies
let audioCtx: AudioContext | null = null;

// Track if we've set up the visibility listener
let visibilityListenerSetup = false;

// Setup visibility change handler to save battery on mobile
const setupVisibilityHandler = () => {
  if (visibilityListenerSetup) return;
  visibilityListenerSetup = true;

  document.addEventListener('visibilitychange', () => {
    if (!audioCtx) return;

    if (document.hidden) {
      // Suspend audio when app goes to background
      audioCtx.suspend().catch(() => {});
    } else {
      // Resume audio when app comes back
      audioCtx.resume().catch(() => {});
    }
  });
};

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Setup visibility handler after creating context
    setupVisibilityHandler();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Update the Audio Listener position for 3D spatial audio
export const updateListener = (pos: [number, number, number], dir: [number, number, number], up: [number, number, number] = [0, 1, 0]) => {
  const ctx = getContext();
  const listener = ctx.listener;

  // Clamp values to safe range to prevent errors if physics glitch
  const safePos = pos.map(v => isFinite(v) ? Math.max(-1000, Math.min(1000, v)) : 0) as [number, number, number];
  const safeDir = dir.map(v => isFinite(v) ? v : 0) as [number, number, number];

  if (listener.positionX) {
    // Standard Web Audio API
    listener.positionX.setTargetAtTime(safePos[0], ctx.currentTime, 0.1);
    listener.positionY.setTargetAtTime(safePos[1], ctx.currentTime, 0.1);
    listener.positionZ.setTargetAtTime(safePos[2], ctx.currentTime, 0.1);
    listener.forwardX.setTargetAtTime(safeDir[0], ctx.currentTime, 0.1);
    listener.forwardY.setTargetAtTime(safeDir[1], ctx.currentTime, 0.1);
    listener.forwardZ.setTargetAtTime(safeDir[2], ctx.currentTime, 0.1);
    listener.upX.setTargetAtTime(up[0], ctx.currentTime, 0.1);
    listener.upY.setTargetAtTime(up[1], ctx.currentTime, 0.1);
    listener.upZ.setTargetAtTime(up[2], ctx.currentTime, 0.1);
  } else {
    // Legacy support
    listener.setPosition(safePos[0], safePos[1], safePos[2]);
    listener.setOrientation(safeDir[0], safeDir[1], safeDir[2], up[0], up[1], up[2]);
  }
};

// NPC Car Engine Sound Generator (lighter, distant car sounds)
export const createCarEngineSound = (initialPosition?: [number, number, number]) => {
  const ctx = getContext();
  const gainNode = ctx.createGain();

  // Create panner for 3D positioning
  const panner = ctx.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'exponential';
  panner.refDistance = 8;
  panner.maxDistance = 40;
  panner.rolloffFactor = 1.5;

  if (initialPosition) {
    panner.positionX.setValueAtTime(initialPosition[0], ctx.currentTime);
    panner.positionY.setValueAtTime(initialPosition[1], ctx.currentTime);
    panner.positionZ.setValueAtTime(initialPosition[2], ctx.currentTime);
  }

  panner.connect(ctx.destination);
  gainNode.connect(panner);
  gainNode.gain.value = 0;

  // Low rumble oscillator
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 35; // Very low idle

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 80;

  osc.connect(filter);
  filter.connect(gainNode);
  osc.start();

  let isRunning = true;

  return {
    setPosition: (pos: [number, number, number]) => {
      if (!isRunning) return;
      const safePos = pos.map(v => isFinite(v) ? Math.max(-1000, Math.min(1000, v)) : 0) as [number, number, number];
      panner.positionX.setTargetAtTime(safePos[0], ctx.currentTime, 0.1);
      panner.positionY.setTargetAtTime(safePos[1], ctx.currentTime, 0.1);
      panner.positionZ.setTargetAtTime(safePos[2], ctx.currentTime, 0.1);
    },
    setSpeed: (speed: number) => {
      if (!isRunning || !isFinite(speed)) return;
      const safeSpeed = Math.max(0, Math.min(speed, 10));

      // Frequency increases with speed (35-80 Hz)
      const targetFreq = 35 + (safeSpeed / 4) * 45;
      // Filter opens with speed
      const targetFilter = 80 + (safeSpeed / 4) * 150;

      osc.frequency.setTargetAtTime(Math.min(targetFreq, 120), ctx.currentTime, 0.15);
      filter.frequency.setTargetAtTime(Math.min(targetFilter, 300), ctx.currentTime, 0.15);
    },
    setVolume: (vol: number) => {
      if (!isRunning || !isFinite(vol)) return;
      gainNode.gain.setTargetAtTime(Math.max(0, Math.min(vol, 0.15)), ctx.currentTime, 0.1);
    },
    stop: () => {
      if (!isRunning) return;
      isRunning = false;
      gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      setTimeout(() => {
        try {
          osc.stop();
          gainNode.disconnect();
          panner.disconnect();
        } catch (e) {
          // Already stopped
        }
      }, 400);
    }
  };
};

// Engine Sound Generator
export const createEngineSound = () => {
  const ctx = getContext();
  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  gainNode.gain.value = 0;

  // Rumble (LFO modulating noise/saw)
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 40; // Base idle rumble

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 120;

  osc.connect(filter);
  filter.connect(gainNode);
  osc.start();

  // Noise layer for texture
  const bufferSize = ctx.sampleRate * 2.0;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.2;
  noise.connect(noiseGain);
  noiseGain.connect(filter);
  noise.start();

  return {
    setPitch: (throttle: number) => {
      if (!isFinite(throttle)) return;

      // Throttle 0 to 1 (but can technically go higher, so we clamp)
      const safeThrottle = Math.max(0, Math.min(throttle, 3.0));

      const baseFreq = 40;
      let targetFreq = baseFreq + (safeThrottle * 120);
      let targetFilter = 100 + (safeThrottle * 400);

      // Absolute safety clamps
      targetFreq = Math.max(20, Math.min(targetFreq, 20000));
      targetFilter = Math.max(50, Math.min(targetFilter, 20000));

      osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
      filter.frequency.setTargetAtTime(targetFilter, ctx.currentTime, 0.1);

      // Jitter for idle irregularity
      if (safeThrottle < 0.1) {
        osc.frequency.setValueAtTime(baseFreq + Math.random() * 5, ctx.currentTime);
      }
    },
    setVolume: (vol: number) => {
      if (!isFinite(vol)) return;
      gainNode.gain.setTargetAtTime(Math.max(0, Math.min(vol, 1)), ctx.currentTime, 0.1);
    },
    stop: () => {
      gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      setTimeout(() => {
        osc.stop();
        noise.stop();
        gainNode.disconnect();
      }, 600);
    }
  };
};

export const playSound = (type: 'coin' | 'jump' | 'step' | 'gem' | 'rustle' | 'bird' | 'cricket' | 'car' | 'horn' | 'skid' | 'rolling' | 'grind' | 'land' | 'trick_success' | 'combo' | 'car_horn_short' | 'splash' | 'reel' | 'catch' | 'net_swing' | 'bug_catch' | 'dig' | 'fossil_found' | 'camera_shutter' | 'daily_reward' | 'achievement', position?: [number, number, number]) => {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const now = ctx.currentTime;

  // Spatial Audio Setup
  let targetNode: AudioNode = ctx.destination;
  if (position) {
    // Clamp position
    const safePos = position.map(v => isFinite(v) ? Math.max(-1000, Math.min(1000, v)) : 0) as [number, number, number];
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'exponential';
    panner.refDistance = 5;
    panner.maxDistance = 50;
    panner.rolloffFactor = 1;
    panner.positionX.setValueAtTime(safePos[0], now);
    panner.positionY.setValueAtTime(safePos[1], now);
    panner.positionZ.setValueAtTime(safePos[2], now);
    panner.connect(ctx.destination);
    targetNode = panner;
  }

  // Connect
  osc.connect(gainNode);
  gainNode.connect(targetNode);

  if (type === 'coin') {
    // High pitch ding
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'gem') {
    // Magical sparkles
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
    osc.frequency.linearRampToValueAtTime(1800, now + 0.2);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'jump') {
    // Cartoon slide up
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.2);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'step') {
    // Short low thud
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'rustle') {
    osc.disconnect();
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.connect(gainNode);
    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.start(now);
  } else if (type === 'bird') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.linearRampToValueAtTime(2500, now + 0.1);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.05, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'cricket') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(4000, now);
    const pulses = 3; const duration = 0.05; const gap = 0.02;
    for (let i = 0; i < pulses; i++) {
      const start = now + i * (duration + gap);
      gainNode.gain.setValueAtTime(0, start);
      gainNode.gain.linearRampToValueAtTime(0.03, start + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, start + duration);
    }
    osc.start(now);
    osc.stop(now + (pulses * (duration + gap)));
  } else if (type === 'car') {
    osc.disconnect();
    const bufferSize = ctx.sampleRate * 3.0;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      data[i] = lastOut * 3.5;
      data[i] *= 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 400;
    noise.connect(filter); filter.connect(gainNode);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 1.5);
    gainNode.gain.linearRampToValueAtTime(0, now + 3.0);
    noise.playbackRate.setValueAtTime(0.8, now);
    noise.playbackRate.linearRampToValueAtTime(1.2, now + 3.0);
    noise.start(now);
  } else if (type === 'horn') {
    osc.type = 'sawtooth';
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    const gain2 = ctx.createGain();
    osc.connect(gainNode); osc2.connect(gain2); gain2.connect(targetNode);
    osc.frequency.setValueAtTime(349, now);
    osc2.frequency.setValueAtTime(440, now);
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    gain2.gain.setValueAtTime(0.3, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc.start(now); osc2.start(now);
    osc.stop(now + 0.6); osc2.stop(now + 0.6);
  } else if (type === 'skid') {
    // Screeching noise
    osc.disconnect();
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 2;

    noise.connect(filter);
    filter.connect(gainNode);

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    noise.start(now);
  }
  else if (type === 'rolling') {
    // Rolling sound (white noise with low pass)
    osc.disconnect();
    const bufferSize = ctx.sampleRate * 2.0;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200; // Start low

    noise.connect(filter);
    filter.connect(gainNode);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);

    noise.start(now);
    // Return the nodes so we can control them
    return { noise, filter, gainNode, ctx };
  }
  else if (type === 'grind') {
    // Metallic grinding sound - harsh noise with metallic resonance
    osc.disconnect();
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500; // Metallic mid-high frequency
    filter.Q.value = 5; // Sharp resonance

    noise.connect(filter);
    filter.connect(gainNode);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    noise.start(now);
  }
  else if (type === 'land') {
    // Landing impact - short punchy thud with bass
    osc.type = 'sine';
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    const gain2 = ctx.createGain();

    osc.connect(gainNode);
    osc2.connect(gain2);
    gain2.connect(targetNode);

    // Low thump
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // Mid crack
    osc2.frequency.setValueAtTime(200, now);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.15);
    osc2.stop(now + 0.1);
  }
  else if (type === 'trick_success') {
    // Satisfying trick completion - ascending chime
    osc.type = 'sine';
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    const osc3 = ctx.createOscillator();
    osc3.type = 'triangle';

    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();

    osc.connect(gainNode);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain2.connect(targetNode);
    gain3.connect(targetNode);

    // Three-note ascending arpeggio
    osc.frequency.setValueAtTime(523, now); // C5
    osc2.frequency.setValueAtTime(659, now + 0.08); // E5
    osc3.frequency.setValueAtTime(784, now + 0.16); // G5

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.12, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    gain3.gain.setValueAtTime(0, now);
    gain3.gain.setValueAtTime(0.15, now + 0.16);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.start(now);
    osc2.start(now + 0.08);
    osc3.start(now + 0.16);
    osc.stop(now + 0.3);
    osc2.stop(now + 0.38);
    osc3.stop(now + 0.5);
  }
  else if (type === 'combo') {
    // Combo multiplier - bright ascending sweep with sparkle
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    const gain2 = ctx.createGain();

    osc.connect(gainNode);
    osc2.connect(gain2);
    gain2.connect(targetNode);

    // Sparkle layer
    osc2.frequency.setValueAtTime(2400, now);
    osc2.frequency.exponentialRampToValueAtTime(3200, now + 0.1);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.2);
    osc2.stop(now + 0.15);
  }
  else if (type === 'car_horn_short') {
    // Short friendly car horn beep - like a polite "excuse me"
    osc.type = 'sine';
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    const gain2 = ctx.createGain();

    osc.connect(gainNode);
    osc2.connect(gain2);
    gain2.connect(targetNode);

    // Two-tone horn (common car horn frequencies)
    osc.frequency.setValueAtTime(420, now);
    osc2.frequency.setValueAtTime(520, now);

    // Short beep
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    gain2.gain.setValueAtTime(0.12, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.25);
    osc2.stop(now + 0.25);
  }
  // ============================================
  // Animal Crossing Activity Sounds
  // ============================================
  else if (type === 'splash') {
    // Water splash for fishing cast
    osc.disconnect();
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * (1 + Math.sin(t * 200));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    noise.start(now);
  }
  else if (type === 'reel') {
    // Fishing reel clicking sound
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    const pulses = 6;
    const duration = 0.03;
    const gap = 0.04;
    for (let i = 0; i < pulses; i++) {
      const start = now + i * (duration + gap);
      gainNode.gain.setValueAtTime(0, start);
      gainNode.gain.linearRampToValueAtTime(0.1, start + 0.005);
      gainNode.gain.linearRampToValueAtTime(0, start + duration);
    }
    osc.start(now);
    osc.stop(now + pulses * (duration + gap));
  }
  else if (type === 'catch') {
    // Successful catch - triumphant jingle (Animal Crossing style)
    osc.type = 'sine';
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();

    osc.connect(gainNode);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain2.connect(targetNode);
    gain3.connect(targetNode);

    // Da-da-da-DAAAA! (catch jingle)
    osc.frequency.setValueAtTime(392, now);      // G4
    osc.frequency.setValueAtTime(440, now + 0.1); // A4
    osc.frequency.setValueAtTime(494, now + 0.2); // B4
    osc2.frequency.setValueAtTime(587, now + 0.3); // D5
    osc3.frequency.setValueAtTime(784, now + 0.3); // G5 (harmony)

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.setValueAtTime(0.15, now + 0.29);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.18, now + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    gain3.gain.setValueAtTime(0, now);
    gain3.gain.setValueAtTime(0.1, now + 0.3);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.start(now);
    osc2.start(now + 0.3);
    osc3.start(now + 0.3);
    osc.stop(now + 0.6);
    osc2.stop(now + 0.7);
    osc3.stop(now + 0.7);
  }
  else if (type === 'net_swing') {
    // Bug net whoosh
    osc.disconnect();
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.8;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 400;
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    noise.start(now);
  }
  else if (type === 'bug_catch') {
    // Bug caught - quick playful boop
    osc.type = 'sine';
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    const gain2 = ctx.createGain();

    osc.connect(gainNode);
    osc2.connect(gain2);
    gain2.connect(targetNode);

    // Boop-boop!
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1100, now + 0.08);
    osc2.frequency.setValueAtTime(660, now + 0.15);

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.15, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.start(now);
    osc2.start(now + 0.15);
    osc.stop(now + 0.2);
    osc2.stop(now + 0.35);
  }
  else if (type === 'dig') {
    // Shovel digging sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    // Add dirt noise
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    noise.connect(noiseGain);
    noiseGain.connect(targetNode);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.15);
  }
  else if (type === 'fossil_found') {
    // Fossil discovery - mysterious ascending arpeggio
    osc.type = 'sine';
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    const osc3 = ctx.createOscillator();
    osc3.type = 'triangle';
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();

    osc.connect(gainNode);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain2.connect(targetNode);
    gain3.connect(targetNode);

    // Mysterious discovery chord
    osc.frequency.setValueAtTime(262, now);       // C4
    osc2.frequency.setValueAtTime(330, now + 0.15); // E4
    osc3.frequency.setValueAtTime(392, now + 0.3);  // G4

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.12, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    gain3.gain.setValueAtTime(0, now);
    gain3.gain.setValueAtTime(0.15, now + 0.3);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc.start(now);
    osc2.start(now + 0.15);
    osc3.start(now + 0.3);
    osc.stop(now + 0.5);
    osc2.stop(now + 0.6);
    osc3.stop(now + 0.8);
  }
  else if (type === 'camera_shutter') {
    // Camera shutter click
    osc.disconnect();
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    noise.start(now);
  }
  else if (type === 'daily_reward') {
    // Daily reward fanfare - celebratory ascending scale
    osc.type = 'sine';
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    const gain2 = ctx.createGain();

    osc.connect(gainNode);
    osc2.connect(gain2);
    gain2.connect(targetNode);

    // Ascending celebration: C-E-G-C (octave up)
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    const noteDuration = 0.12;

    notes.forEach((freq, i) => {
      const noteStart = now + i * noteDuration;
      osc.frequency.setValueAtTime(freq, noteStart);
      gainNode.gain.setValueAtTime(0.15, noteStart);
      gainNode.gain.setValueAtTime(0.12, noteStart + noteDuration * 0.8);
    });

    // Harmony on last note
    osc2.frequency.setValueAtTime(784, now + 3 * noteDuration); // G5
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.1, now + 3 * noteDuration);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.start(now);
    osc2.start(now + 3 * noteDuration);
    osc.stop(now + 0.7);
    osc2.stop(now + 0.7);
  }
  else if (type === 'achievement') {
    // Achievement unlocked - grand triumphant fanfare
    osc.type = 'sine';
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();

    osc.connect(gainNode);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain2.connect(targetNode);
    gain3.connect(targetNode);

    // Triumphant fanfare: G-C-E-G (major chord arpeggio)
    osc.frequency.setValueAtTime(392, now);       // G4
    osc.frequency.setValueAtTime(523, now + 0.1); // C5
    osc.frequency.setValueAtTime(659, now + 0.2); // E5
    osc2.frequency.setValueAtTime(784, now + 0.35); // G5
    osc3.frequency.setValueAtTime(1047, now + 0.35); // C6 (sparkle)

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.setValueAtTime(0.15, now + 0.34);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.18, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    gain3.gain.setValueAtTime(0, now);
    gain3.gain.setValueAtTime(0.08, now + 0.35);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

    osc.start(now);
    osc2.start(now + 0.35);
    osc3.start(now + 0.35);
    osc.stop(now + 0.8);
    osc2.stop(now + 1.0);
    osc3.stop(now + 0.9);
  }
};

/**
 * Cleanup audio resources - call when unmounting
 */
export const cleanupAudio = () => {
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
};
