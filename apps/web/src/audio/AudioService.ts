interface RattleNodes {
  readonly oscillator: OscillatorNode;
  readonly gain: GainNode;
}

export class AudioService {
  private context: AudioContext | null = null;
  private rattle: RattleNodes | null = null;
  private muted = false;

  async unlock(): Promise<void> {
    if (typeof window === "undefined") return;
    if (!this.context) {
      const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return;
      this.context = new AudioContextConstructor();
    }
    if (this.context.state === "suspended") {
      await this.context.resume().catch(() => undefined);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.rattle && this.context) {
      this.rattle.gain.gain.setTargetAtTime(muted ? 0 : 0.035, this.context.currentTime, 0.02);
    }
  }

  startRattle(intensity: number): void {
    if (!this.context || this.muted) return;
    if (!this.rattle) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = 82;
      gain.gain.value = 0;
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start();
      this.rattle = { oscillator, gain };
    }
    const volume = 0.018 + Math.max(0, Math.min(1, intensity)) * 0.04;
    this.rattle.gain.gain.setTargetAtTime(volume, this.context.currentTime, 0.04);
  }

  stopRattle(): void {
    if (!this.rattle || !this.context) return;
    const { oscillator, gain } = this.rattle;
    gain.gain.setTargetAtTime(0, this.context.currentTime, 0.04);
    oscillator.stop(this.context.currentTime + 0.16);
    this.rattle = null;
  }

  playReveal(): void {
    if (!this.context || this.muted) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 440;
    gain.gain.setValueAtTime(0.08, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.22);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.24);
  }

  vibrate(pattern: number | number[]): void {
    if (this.muted || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Haptics are optional and never block gameplay.
    }
  }

  dispose(): void {
    this.stopRattle();
    void this.context?.close().catch(() => undefined);
    this.context = null;
  }
}
