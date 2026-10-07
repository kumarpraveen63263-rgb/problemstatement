'use client';

// Web Audio API Synthesizer for 100% reliable zero-dependency sound effects
let audioCtx: AudioContext | null = null;
let isMutedState = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isAudioMuted(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('kp_audio_muted');
    if (saved !== null) return saved === 'true';
  }
  return isMutedState;
}

export function setAudioMuted(muted: boolean): void {
  isMutedState = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('kp_audio_muted', String(muted));
  }
}

/**
 * High-tech mechanical click sound for wheel segment passing
 */
export function playTickSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Audio context may require user interaction
  }
}

/**
 * Uplifting harmonic chime chord for result reveal
 */
export function playCelebrationSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Chords: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const frequencies = [523.25, 659.25, 783.99, 1046.50];
    const startTime = ctx.currentTime;

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

      gain.gain.setValueAtTime(0.12, startTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.08);
      osc.stop(startTime + 2.4);
    });
  } catch (e) {
    // Ignore audio fail
  }
}

/**
 * Cyber click interaction sound
 */
export function playClickSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {}
}

export function playSuccessSound(): void {
  playCelebrationSound();
}

export function playErrorSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.setValueAtTime(140, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

/**
 * Hyper-Realistic VIP Inauguration Audio:
 * - Metallic blade snip & fabric shearing sound
 * - Grand royal orchestral brass & crystal chime fanfare
 * - Live audience celebratory applause simulation
 */
export function playRibbonCutSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Blade Friction & Fabric Shearing Snip
    const snipOsc = ctx.createOscillator();
    const snipGain = ctx.createGain();
    snipOsc.type = 'sawtooth';
    snipOsc.frequency.setValueAtTime(3200, now);
    snipOsc.frequency.exponentialRampToValueAtTime(350, now + 0.07);
    snipGain.gain.setValueAtTime(0.4, now);
    snipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    snipOsc.connect(snipGain);
    snipGain.connect(ctx.destination);
    snipOsc.start(now);
    snipOsc.stop(now + 0.09);

    // 2. Heavy Silk Tension Release Thump
    const thumpOsc = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(140, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    thumpGain.gain.setValueAtTime(0.35, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    thumpOsc.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.16);

    // 3. Grand Royal Fanfare Chords (Majestic Brass + Crystalline Bells)
    const fanfareChords = [
      523.25, // C5
      659.25, // E5
      783.99, // G5
      1046.50, // C6
      1318.51, // E6
      1567.98, // G6
      2093.00, // C7 (sparkle)
    ];

    fanfareChords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.04 + idx * 0.045);

      gain.gain.setValueAtTime(0.12, now + 0.04 + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.04 + idx * 0.045);
      osc.stop(now + 4.0);
    });

    // 4. Hall Audience Applause Simulation (White/Pink noise cluster + rhythmic handclaps)
    const bufferSize = ctx.sampleRate * 3.5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(1.8, now);

    const applauseGain = ctx.createGain();
    applauseGain.gain.setValueAtTime(0.001, now + 0.1);
    applauseGain.gain.exponentialRampToValueAtTime(0.18, now + 0.6);
    applauseGain.gain.setValueAtTime(0.18, now + 2.2);
    applauseGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

    whiteNoise.connect(filter);
    filter.connect(applauseGain);
    applauseGain.connect(ctx.destination);

    whiteNoise.start(now + 0.1);
    whiteNoise.stop(now + 3.7);

  } catch (e) {
    // Graceful fallback
  }
}
