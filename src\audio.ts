/**
 * Procedural 8-bit Sound Synthesizer & Audio Manager for Terminal Runner (Web Audio API)
 * Synthesizes all sound effects mathematically in memory using Web Audio API AudioBuffers.
 * 100% self-contained with zero external audio assets required.
 */

export class AudioManager {
  private ctx: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sampleRate: number = 22050;
  private initialized: boolean = false;

  constructor() {
    // AudioContext will be initialized or resumed on first user gesture
  }

  public init(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.sampleRate = this.ctx.sampleRate || 22050;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.generateAllBuffers();
      this.initialized = true;
    } catch {
      console.warn("Web Audio API not supported or blocked in this browser environment.");
    }
  }

  private createBuffer(duration: number, sampleGenerator: (t: number, p: number) => number): AudioBuffer | null {
    if (!this.ctx) return null;
    const numSamples = Math.floor(this.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, numSamples, this.sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / this.sampleRate;
      const p = i / Math.max(1, numSamples - 1);
      let val = sampleGenerator(t, p);
      // Clamp between -1.0 and 1.0
      val = Math.max(-1.0, Math.min(1.0, val));
      channelData[i] = val;
    }

    return buffer;
  }

  private generateAllBuffers(): void {
    if (!this.ctx) return;

    // 1. JUMP SOUND (Upward frequency sweep with soft square harmonics)
    const jumpBuf = this.createBuffer(0.16, (t, p) => {
      const freq = 220.0 + 580.0 * Math.pow(p, 0.8);
      const env = Math.pow(1.0 - p, 0.5);
      const phase = 2.0 * Math.PI * freq * t;
      const waveVal = 0.7 * (Math.sin(phase) > 0 ? 1.0 : -1.0) + 0.3 * Math.sin(phase);
      return waveVal * env;
    });
    if (jumpBuf) this.buffers.set("jump", jumpBuf);

    // 2. DUCK / SLIDE SOUND (Low whoosh with slight grit)
    const duckBuf = this.createBuffer(0.14, (t, p) => {
      const freq = 320.0 * (1.0 - p * 0.7);
      const env = Math.sin(p * Math.PI);
      const noise = (Math.random() * 2.0 - 1.0) * 0.25;
      const tone = Math.sin(2.0 * Math.PI * freq * t);
      return (tone * 0.75 + noise) * env;
    });
    if (duckBuf) this.buffers.set("duck", duckBuf);

    // 3. COLLECT DATA PACKET (High crisp 3-step arpeggio chime: C6 -> E6 -> G6)
    const collectBuf = this.createBuffer(0.20, (t, p) => {
      let freq = 1046.50;
      if (p >= 0.33 && p < 0.66) {
        freq = 1318.51;
      } else if (p >= 0.66) {
        freq = 1567.98;
      }
      const env = (1.0 - (p % 0.33) / 0.33) * (1.0 - p * 0.4);
      return Math.sin(2.0 * Math.PI * freq * t) * env;
    });
    if (collectBuf) this.buffers.set("collect", collectBuf);

    // 4. POWER-UP SOUND (Heroic 4-note ascending fanfare: C5 -> E5 -> G5 -> C6)
    const powerupBuf = this.createBuffer(0.36, (t, p) => {
      let freq = 523.25;
      if (p >= 0.25 && p < 0.50) freq = 659.25;
      else if (p >= 0.50 && p < 0.75) freq = 783.99;
      else if (p >= 0.75) freq = 1046.50;

      const localP = (p * 4.0) % 1.0;
      const env = 1.0 - localP * 0.4;
      const phase = 2.0 * Math.PI * freq * t;
      const waveVal = 0.6 * Math.sin(phase) + 0.4 * (Math.sin(phase) > 0 ? 1.0 : -1.0);
      return waveVal * env;
    });
    if (powerupBuf) this.buffers.set("powerup", powerupBuf);

    // 5. SHIELD BREAK SOUND (Glass / laser shatter noise)
    const shieldBreakBuf = this.createBuffer(0.28, (t, p) => {
      const env = Math.pow(1.0 - p, 1.8);
      const freq = 1600.0 * (1.0 - p * 0.8);
      const tone = Math.sin(2.0 * Math.PI * freq * t) * (1.0 - p);
      const noise = (Math.random() * 2.0 - 1.0) * 0.7;
      return (tone * 0.4 + noise * 0.6) * env;
    });
    if (shieldBreakBuf) this.buffers.set("shield_break", shieldBreakBuf);

    // 6. CRASH / EXPLOSION SOUND (Heavy bitcrushed impact)
    const crashBuf = this.createBuffer(0.45, (t, p) => {
      const env = Math.pow(1.0 - p, 1.5);
      const freq = 180.0 * (1.0 - p * 0.8);
      const tone = Math.sin(2.0 * Math.PI * freq * t);
      const noise = (Math.random() * 2.0 - 1.0);
      return (tone * 0.35 + noise * 0.65) * env;
    });
    if (crashBuf) this.buffers.set("crash", crashBuf);

    // 7. UI BEEP / CLICK (Short high-pitch terminal blip)
    const uiBeepBuf = this.createBuffer(0.05, (t, p) => {
      const freq = 980.0;
      const env = 1.0 - p;
      return Math.sin(2.0 * Math.PI * freq * t) * env;
    });
    if (uiBeepBuf) this.buffers.set("ui_beep", uiBeepBuf);

    // 8. PAUSE SOUND (Dual blip)
    const pauseBuf = this.createBuffer(0.18, (t, p) => {
      const freq = p < 0.5 ? 880.0 : 440.0;
      const env = 1.0 - (p % 0.5) / 0.5;
      return Math.sin(2.0 * Math.PI * freq * t) * env;
    });
    if (pauseBuf) this.buffers.set("pause", pauseBuf);
  }

  public play(name: string): void {
    if (this.isMuted) return;
    if (!this.initialized || !this.ctx || !this.masterGain) {
      this.init();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const buffer = this.buffers.get(name);
    if (!buffer || !this.ctx || !this.masterGain) return;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.masterGain);
      source.start();
    } catch {
      // Audio playback failed or blocked
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public get muted(): boolean {
    return this.isMuted;
  }
}
