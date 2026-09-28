let audioContext = null;

/**
 * Arms the save ting on this click. Call the returned function after the note is written.
 * Leaving it uncalled stays silent.
 * @returns {() => void}
 */
export function armSavedSound() {
  if (!resumeContext()) {
    return () => {};
  }
  return playSavedSound;
}

function resumeContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
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

function playSavedSound() {
  if (!audioContext) {
    return;
  }
  const now = audioContext.currentTime;
  playStrike(now);
  playRing(1760, now, 0.2, 0.08);
  playRing(3520, now, 0.07, 0.035);
  playRing(4858, now, 0.035, 0.018);
}

function playStrike(start) {
  const length = Math.floor(audioContext.sampleRate * 0.012);
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const noise = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  noise.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 5000;
  gain.gain.setValueAtTime(0.09, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.016);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  noise.start(start);
  noise.stop(start + 0.02);
}

function playRing(frequency, start, duration, peak) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}
