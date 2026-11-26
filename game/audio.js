/* FRAGILE: The Great Server Rescue — procedural Web Audio synth (no external files) */

export class Sfx {
  constructor() {
    this._ctx = null;
    this._master = null;
    this._muted = true; // opt-in: engine unmutes via toggle()/setMuted(false)
  }

  unlock() {
    try {
      if (!this._ctx) {
        const AC =
          (typeof window !== "undefined" &&
            (window.AudioContext || window.webkitAudioContext)) ||
          null;
        if (!AC) return;
        this._ctx = new AC();
        this._master = this._ctx.createGain();
        this._master.gain.value = 0.5;
        this._master.connect(this._ctx.destination);
      }
      if (this._ctx.state === "suspended") {
        const p = this._ctx.resume();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    } catch (e) {
      /* AudioContext unavailable — stay silent */
    }
  }

  toggle() {
    return this.setMuted(!this._muted);
  }

  setMuted(m) {
    this._muted = !!m;
    return this._muted;
  }

  isMuted() {
    return this._muted;
  }

  _tone({ freq = 440, freqEnd = null, type = "sine", at = 0, dur = 0.15, vol = 0.25 }) {
    const ctx = this._ctx;
    if (!ctx || !this._master) return;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(freq, 1), t);
    if (freqEnd != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t + dur);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this._master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  play(name) {
    try {
      if (this._muted) return;
      if (!this._ctx || !this._master) return;
      if (this._ctx.state === "suspended") {
        const p = this._ctx.resume();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
      switch (name) {
        case "jump":
          this._tone({ freq: 330, freqEnd: 660, type: "square", dur: 0.12, vol: 0.16 });
          break;
        case "double":
          this._tone({ freq: 440, freqEnd: 660, type: "square", at: 0, dur: 0.09, vol: 0.15 });
          this._tone({ freq: 660, freqEnd: 990, type: "square", at: 0.07, dur: 0.11, vol: 0.15 });
          break;
        case "land":
          this._tone({ freq: 150, freqEnd: 60, type: "sine", dur: 0.08, vol: 0.32 });
          break;
        case "collect":
          this._tone({ freq: 880, type: "triangle", at: 0, dur: 0.1, vol: 0.22 });
          this._tone({ freq: 1318, type: "triangle", at: 0.09, dur: 0.13, vol: 0.22 });
          break;
        case "invoice":
          this._tone({ freq: 659, type: "triangle", at: 0, dur: 0.09, vol: 0.2 });
          this._tone({ freq: 880, type: "triangle", at: 0.08, dur: 0.09, vol: 0.2 });
          this._tone({ freq: 1175, type: "triangle", at: 0.16, dur: 0.14, vol: 0.2 });
          break;
        case "death":
          this._tone({ freq: 220, freqEnd: 55, type: "sawtooth", dur: 0.4, vol: 0.24 });
          break;
        case "complete":
          this._tone({ freq: 523, type: "triangle", at: 0, dur: 0.12, vol: 0.2 });
          this._tone({ freq: 659, type: "triangle", at: 0.11, dur: 0.12, vol: 0.2 });
          this._tone({ freq: 784, type: "triangle", at: 0.22, dur: 0.12, vol: 0.2 });
          this._tone({ freq: 1047, type: "triangle", at: 0.33, dur: 0.22, vol: 0.22 });
          break;
        case "win":
          this._tone({ freq: 523, type: "triangle", at: 0, dur: 0.14, vol: 0.22 });
          this._tone({ freq: 659, type: "triangle", at: 0.13, dur: 0.14, vol: 0.22 });
          this._tone({ freq: 784, type: "triangle", at: 0.26, dur: 0.14, vol: 0.22 });
          this._tone({ freq: 1047, type: "triangle", at: 0.39, dur: 0.16, vol: 0.24 });
          this._tone({ freq: 784, type: "triangle", at: 0.55, dur: 0.12, vol: 0.2 });
          this._tone({ freq: 1319, type: "triangle", at: 0.66, dur: 0.24, vol: 0.24 });
          break;
        case "ui":
          this._tone({ freq: 1200, type: "square", dur: 0.05, vol: 0.1 });
          break;
        default:
          break;
      }
    } catch (e) {
      /* never throw */
    }
  }
}

export const sfx = new Sfx();
