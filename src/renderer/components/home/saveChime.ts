import { SAVE_CHIME } from "../../../shared/globals";

/**
 * The chime that plays when a note is saved (values in SAVE_CHIME).
 *
 * Why it used to be silent: the audio context was created at the moment of saving
 * and the sound was scheduled at time 0, before Windows had opened the audio device,
 * so the short sound was over before anything was audible. Now the context is warmed
 * up as soon as the person starts writing, and every note is scheduled a little ahead.
 */

let context: AudioContext | null = null;

/** Opens the audio device early. Cheap to call repeatedly; call it when writing starts. */
export function warmUpChime(): void {
  if (typeof AudioContext === "undefined") {
    return;
  }
  context ??= new AudioContext({ latencyHint: "interactive" });
  if (context.state === "suspended") {
    void context.resume();
  }
}

/** Plays the two-note chime. Never throws: a missing sound must not break saving. */
export function playSaveChime(): void {
  try {
    warmUpChime();
    const audio = context;
    if (!audio) {
      return;
    }
    const output = audio.createGain();
    output.gain.value = SAVE_CHIME.volume;
    output.connect(audio.destination);

    const start = audio.currentTime + SAVE_CHIME.leadMs / 1000;
    for (const note of SAVE_CHIME.notes) {
      strike(audio, output, note.hz, start + note.delayMs / 1000, note.level, note.decayMs / 1000);
    }
  } catch (error) {
    console.error(error);
  }
}

/** One mallet strike: a few sine partials with a fast attack and an exponential fade. */
function strike(audio: AudioContext, output: AudioNode, hz: number, at: number, level: number, decay: number): void {
  for (const partial of SAVE_CHIME.partials) {
    // Higher partials die away faster, which is what makes a struck sound "ring".
    const partialDecay = decay / Math.sqrt(partial.ratio);
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = hz * partial.ratio;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level * partial.level, at + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + partialDecay);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(at);
    oscillator.stop(at + partialDecay + 0.05);
  }
}
