// audio.js — every sound is synthesized with WebAudio oscillators; no audio files.
// Short beeps and sweeps: footsteps stay silent (a thief is quiet), but the
// alarm, the loot, the tools and the win/caught stings all have a voice.

export function createAudio() {
  const audio = {
    ctx: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AC();
        } catch (e) {
          this.ctx = null;
        }
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    beep(freq, dur, type, vol, when = 0, slideTo = 0) {
      if (this.muted) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    },
    tick() {
      this.beep(1180, 0.07, "square", 0.05);
    },
    loot() {
      this.beep(660, 0.12, "sine", 0.14);
      this.beep(880, 0.12, "sine", 0.14, 0.1);
      this.beep(1320, 0.22, "sine", 0.14, 0.2);
    },
    emp() {
      this.beep(1400, 0.35, "sawtooth", 0.08, 0, 180);
    },
    noise() {
      this.beep(520, 0.1, "triangle", 0.12);
      this.beep(520, 0.1, "triangle", 0.12, 0.14);
    },
    caught() {
      this.beep(220, 0.5, "sawtooth", 0.14, 0, 55);
      this.beep(110, 0.7, "square", 0.1, 0.25, 55);
    },
    win() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => this.beep(f, 0.22, "triangle", 0.13, i * 0.13));
    },
    click() {
      this.beep(900, 0.05, "sine", 0.08);
    },
  };
  return audio;
}
