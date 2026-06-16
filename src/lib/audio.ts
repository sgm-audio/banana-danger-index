let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const ACtor = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ACtor) return null!;
    audioCtx = new ACtor();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function playSlipSound(intensity: number) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200 + intensity * 300, now);
  osc.frequency.exponentialRampToValueAtTime(40 + intensity * 60, now + 0.4);

  filter.type = "lowpass";
  filter.frequency.value = 800;
  filter.Q.value = 2;

  gain.gain.setValueAtTime(0.15 * intensity, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(filter).connect(gain).connect(masterGain!);
  osc.start(now);
  osc.stop(now + 0.6);
}

export function playImpactBoom(wordIndex: number, intensity: number) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Fundamental "thud"
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(60 + wordIndex * 15, now);
  gain1.gain.setValueAtTime(0.25 * intensity, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc1.connect(gain1).connect(masterGain!);
  osc1.start(now);
  osc1.stop(now + 0.4);

  // Harmonic "ring"
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(180 + wordIndex * 25, now);
  gain2.gain.setValueAtTime(0.1 * intensity, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  osc2.connect(gain2).connect(masterGain!);
  osc2.start(now);
  osc2.stop(now + 1);

  // Noise burst for "crack"
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 1000);
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noise.buffer = buffer;
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 1000;
  noiseGain.gain.setValueAtTime(0.08 * intensity, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  noise.connect(noiseFilter).connect(noiseGain).connect(masterGain!);
  noise.start(now);
}

export function playCrowdMurmur() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  for (let i = 0; i < 6; i++) {
    const delay = i * 0.15 + Math.random() * 0.1;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120 + Math.random() * 200, now + delay);
    gain.gain.setValueAtTime(0.03, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);
    osc.connect(gain).connect(masterGain!);
    osc.start(now + delay);
    osc.stop(now + delay + 0.6);
  }
}

export function playSlowmoWhoosh() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = "sine";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 2);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 2);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
  osc.connect(filter).connect(gain).connect(masterGain!);
  osc.start(now);
  osc.stop(now + 2.5);
}

export function playConfettiChime() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);
    osc.connect(gain).connect(masterGain!);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.8);
  });
}

export function setMasterVolume(vol: number) {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, vol));
}