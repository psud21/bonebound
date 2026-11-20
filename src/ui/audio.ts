/**
 * Synthesized sound effects (WebAudio, no audio files). Every sound is a few oscillators
 * or a burst of noise with an envelope, tuned to sit under the game rather than on top of it.
 * The AudioContext starts on the first user gesture, as browsers require.
 */

export type SoundId =
  | 'hit'
  | 'crit'
  | 'kill'
  | 'buy'
  | 'ui'
  | 'boss'
  | 'bossFail'
  | 'lootCommon'
  | 'lootMagic'
  | 'lootRare'
  | 'lootSet'
  | 'lootLegendary'
  | 'soul'
  | 'spell'
  | 'levelUp'
  | 'feat'
  | 'rebirth'
  | 'ascend'
  | 'rift';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = true;
let volume = 0.5;
const lastPlayed = new Map<SoundId, number>();

/** Minimum gap between two plays of the same sound, in ms (keeps busy moments from turning into noise). */
const MIN_GAP: Partial<Record<SoundId, number>> = { hit: 45, crit: 80, kill: 350, buy: 60, ui: 40, lootCommon: 150, spell: 120 };

export function configureAudio(on: boolean, vol: number): void {
  enabled = on;
  volume = Math.max(0, Math.min(1, vol));
  if (master && ctx) master.gain.setTargetAtTime(volume * 0.6, ctx.currentTime, 0.02);
}

/** Call once; starts audio on the first pointer or key press. */
export function initAudio(): void {
  const start = () => {
    if (ctx) return;
    try {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = volume * 0.6;
      master.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    } catch {
      ctx = null; // no audio available: stay silent
    }
  };
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', start, { once: true });
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, peak: number, glideTo?: number): void {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.015, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function burst(start: number, dur: number, peak: number, filterFreq: number, q = 1, type: BiquadFilterType = 'lowpass'): void {
  if (!ctx || !master || !noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(filterFreq, start);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f).connect(g).connect(master);
  src.start(start, Math.random() * 0.5);
  src.stop(start + dur + 0.02);
}

function arpeggio(notes: readonly number[], step: number, dur: number, type: OscillatorType, peak: number): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  notes.forEach((n, i) => tone(n, t + i * step, dur, type, peak));
}

export function play(id: SoundId): void {
  if (!enabled || !ctx || volume <= 0) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const now = performance.now();
  const gap = MIN_GAP[id] ?? 0;
  if (now - (lastPlayed.get(id) ?? -Infinity) < gap) return;
  lastPlayed.set(id, now);
  const t = ctx.currentTime;
  const jitter = 0.94 + Math.random() * 0.12;

  switch (id) {
    case 'hit':
      burst(t, 0.07, 0.35, 900 * jitter);
      tone(140 * jitter, t, 0.08, 'sine', 0.25, 70);
      break;
    case 'crit':
      burst(t, 0.12, 0.45, 2600, 2, 'bandpass');
      tone(330 * jitter, t, 0.18, 'triangle', 0.22, 660);
      break;
    case 'kill':
      tone(90 * jitter, t, 0.16, 'sine', 0.18, 45);
      burst(t, 0.1, 0.12, 400);
      break;
    case 'buy':
      tone(520 * jitter, t, 0.06, 'triangle', 0.12);
      tone(780 * jitter, t + 0.03, 0.07, 'triangle', 0.08);
      break;
    case 'ui':
      tone(660, t, 0.04, 'sine', 0.08);
      break;
    case 'boss':
      arpeggio([196, 247, 294, 392], 0.07, 0.6, 'sawtooth', 0.07);
      burst(t, 0.5, 0.2, 300);
      break;
    case 'bossFail':
      tone(220, t, 0.5, 'sawtooth', 0.08, 110);
      tone(165, t + 0.1, 0.5, 'sawtooth', 0.06, 82);
      break;
    case 'lootCommon':
      tone(880, t, 0.06, 'sine', 0.06);
      break;
    case 'lootMagic':
      arpeggio([660, 990], 0.06, 0.18, 'sine', 0.1);
      break;
    case 'lootRare':
      arpeggio([587, 784, 988], 0.06, 0.25, 'triangle', 0.1);
      break;
    case 'lootSet':
      arpeggio([523, 659, 784, 1047], 0.07, 0.35, 'triangle', 0.11);
      break;
    case 'lootLegendary':
      arpeggio([392, 523, 659, 784, 1047, 1319], 0.06, 0.5, 'triangle', 0.12);
      burst(t, 0.6, 0.08, 6000, 1, 'highpass');
      break;
    case 'soul':
      tone(740, t, 0.5, 'sine', 0.1, 1480);
      tone(1110, t + 0.08, 0.45, 'sine', 0.06, 1660);
      break;
    case 'spell':
      tone(300 * jitter, t, 0.35, 'triangle', 0.1, 900);
      burst(t, 0.3, 0.08, 1800, 4, 'bandpass');
      break;
    case 'levelUp':
      arpeggio([523, 659, 784], 0.08, 0.3, 'square', 0.05);
      break;
    case 'feat':
      arpeggio([659, 880, 1175], 0.09, 0.4, 'triangle', 0.1);
      break;
    case 'rebirth':
      tone(55, t, 2.2, 'sine', 0.35, 41);
      arpeggio([220, 277, 330, 440, 554], 0.18, 1.6, 'triangle', 0.06);
      break;
    case 'ascend':
      tone(41, t, 3, 'sawtooth', 0.12, 30);
      arpeggio([110, 147, 175, 220, 262, 330], 0.22, 2.2, 'triangle', 0.07);
      burst(t, 2.5, 0.1, 500);
      break;
    case 'rift':
      tone(200, t, 0.9, 'sawtooth', 0.06, 50);
      tone(300, t, 0.9, 'sine', 0.08, 1200);
      burst(t, 0.8, 0.1, 1200, 6, 'bandpass');
      break;
  }
}
