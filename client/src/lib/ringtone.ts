export class Ringtone {
  private ctx: AudioContext;
  private osc1: OscillatorNode;
  private osc2: OscillatorNode;
  private gain: GainNode;
  private interval?: ReturnType<typeof setInterval>;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.osc1 = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();
    this.gain = this.ctx.createGain();

    this.osc1.type = 'sine';
    this.osc2.type = 'sine';
    this.osc1.frequency.value = 440;
    this.osc2.frequency.value = 480;

    this.osc1.connect(this.gain);
    this.osc2.connect(this.gain);
    this.gain.connect(this.ctx.destination);

    this.gain.gain.value = 0;

    this.osc1.start();
    this.osc2.start();
  }

  start() {
    const play = () => {
      const t = this.ctx.currentTime;
      this.gain.gain.setValueAtTime(0.001, t);
      this.gain.gain.linearRampToValueAtTime(0.5, t + 0.01);
      this.gain.gain.setValueAtTime(0.5, t + 0.4);
      this.gain.gain.linearRampToValueAtTime(0.001, t + 0.45);
    };
    play();
    this.interval = setInterval(play, 1000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
    this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
  }

  dispose() {
    this.stop();
    this.osc1.stop();
    this.osc2.stop();
    this.ctx.close();
  }
}
