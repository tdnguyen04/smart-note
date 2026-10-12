let audioContext: AudioContext | null = null;

export function armSavedSound(): () => void {
  if (!resumeContext()) {
    return () => undefined;
  }
  return playSavedSound;
}

function resumeContext(): boolean {
  if (typeof AudioContext === "undefined") {
    return false;
  }
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return true;
}

function playSavedSound(): void {
  const context = audioContext;
  if (!context) {
    return;
  }
  const now = context.currentTime;
  playStrike(context, now);
  playRing(context, 1760, now, 0.2, 0.08);
  playRing(context, 3520, now, 0.07, 0.035);
  playRing(context, 4858, now, 0.035, 0.018);
}

function playStrike(context: AudioContext, start: number): void {
  const length = Math.floor(context.sampleRate * 0.012);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  noise.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 5000;
  gain.gain.setValueAtTime(0.09, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.016);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  noise.start(start);
  noise.stop(start + 0.02);
}

function playRing(context: AudioContext, frequency: number, start: number, duration: number, peak: number): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}
