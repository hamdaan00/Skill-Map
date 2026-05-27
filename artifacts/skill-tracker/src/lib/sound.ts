let ctx: AudioContext | null = null;
let userInteracted = false;

if (typeof window !== 'undefined') {
  const markInteracted = () => { userInteracted = true; };
  window.addEventListener('click', markInteracted, { once: true });
  window.addEventListener('keydown', markInteracted, { once: true });
}

function getCtx(): AudioContext | null {
  if (!userInteracted) return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function isEnabled(): boolean {
  try {
    const val = localStorage.getItem('pst_sound_enabled');
    return val === null ? true : JSON.parse(val);
  } catch { return true; }
}

function playTone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', gain = 0.3) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration + 0.05);
}

export const sound = {
  targetComplete() {
    if (!isEnabled()) return;
    // C-E-G ascending chime
    playTone(523, 0, 0.3);
    playTone(659, 0.15, 0.3);
    playTone(784, 0.3, 0.4);
  },

  badgeUnlock() {
    if (!isEnabled()) return;
    // Triumphant 5-note arpeggio
    [523, 659, 784, 988, 1047].forEach((f, i) => playTone(f, i * 0.1, 0.35, 'sine', 0.4));
  },

  levelUp() {
    if (!isEnabled()) return;
    // Rising synth sweep
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    g.connect(c.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.5);
    g.gain.setValueAtTime(0.2, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.85);
    // sparkle
    setTimeout(() => { [1047, 1319, 1568].forEach((f, i) => playTone(f, i * 0.08, 0.2, 'sine', 0.15)); }, 400);
  },

  logSession() {
    if (!isEnabled()) return;
    playTone(880, 0, 0.2, 'sine', 0.2);
  },

  timerStart() {
    if (!isEnabled()) return;
    playTone(220, 0, 0.4, 'sine', 0.25);
  },

  timerComplete() {
    if (!isEnabled()) return;
    // Three descending bells
    playTone(1047, 0, 0.5);
    playTone(880, 0.3, 0.5);
    playTone(698, 0.6, 0.6);
  },

  allTargets() {
    if (!isEnabled()) return;
    // Celebratory 8-note jingle
    const notes = [523, 659, 784, 988, 784, 988, 1047, 1319];
    notes.forEach((f, i) => playTone(f, i * 0.12, 0.25, 'sine', 0.35));
  },

  navClick() {
    if (!isEnabled()) return;
    playTone(440, 0, 0.05, 'sine', 0.05);
  },

  streakMilestone() {
    if (!isEnabled()) return;
    // Rhythmic beat
    [0, 0.2, 0.4, 0.5, 0.7].forEach(t => playTone(150, t, 0.15, 'square', 0.2));
    [0.1, 0.3, 0.6].forEach(t => playTone(220, t, 0.1, 'sine', 0.15));
  },

  test() {
    // Force enable for test button
    userInteracted = true;
    this.badgeUnlock();
  },
};
