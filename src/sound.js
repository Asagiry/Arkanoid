export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  unlock() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  tone({
    frequency = 440,
    duration = 0.08,
    type = "square",
    gain = 0.03,
    frequencyRamp = null,
  }) {
    if (!this.enabled || !this.ctx) {
      return;
    }
    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const envelope = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (frequencyRamp !== null) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(30, frequencyRamp),
        now + duration
      );
    }
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(gain, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(this.ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  launch() {
    this.tone({ frequency: 320, duration: 0.09, type: "triangle", gain: 0.028, frequencyRamp: 470 });
  }

  paddle() {
    this.tone({ frequency: 280, duration: 0.05, type: "square", gain: 0.025, frequencyRamp: 380 });
  }

  wall() {
    this.tone({ frequency: 180, duration: 0.04, type: "square", gain: 0.018, frequencyRamp: 130 });
  }

  brick(silver = false) {
    this.tone({
      frequency: silver ? 200 : 240,
      duration: silver ? 0.06 : 0.045,
      type: silver ? "sawtooth" : "square",
      gain: silver ? 0.028 : 0.02,
      frequencyRamp: silver ? 280 : 300,
    });
  }

  capsule() {
    this.tone({ frequency: 620, duration: 0.06, type: "triangle", gain: 0.025, frequencyRamp: 850 });
    this.tone({ frequency: 760, duration: 0.1, type: "triangle", gain: 0.018, frequencyRamp: 620 });
  }

  laser() {
    this.tone({ frequency: 700, duration: 0.04, type: "square", gain: 0.016, frequencyRamp: 420 });
  }

  enemy() {
    this.tone({ frequency: 520, duration: 0.05, type: "square", gain: 0.02, frequencyRamp: 760 });
    this.tone({ frequency: 680, duration: 0.06, type: "triangle", gain: 0.013, frequencyRamp: 520 });
  }

  loseLife() {
    this.tone({ frequency: 220, duration: 0.2, type: "sawtooth", gain: 0.03, frequencyRamp: 85 });
  }

  roundClear() {
    this.tone({ frequency: 560, duration: 0.09, type: "triangle", gain: 0.028, frequencyRamp: 840 });
    this.tone({ frequency: 740, duration: 0.13, type: "triangle", gain: 0.022, frequencyRamp: 620 });
  }

  gameOver() {
    this.tone({ frequency: 210, duration: 0.24, type: "sawtooth", gain: 0.03, frequencyRamp: 90 });
  }

  win() {
    this.tone({ frequency: 760, duration: 0.13, type: "triangle", gain: 0.028, frequencyRamp: 980 });
    this.tone({ frequency: 900, duration: 0.16, type: "triangle", gain: 0.022, frequencyRamp: 720 });
  }
}
