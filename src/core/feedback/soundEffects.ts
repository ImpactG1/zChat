/**
 * ZENYTH // DUELING GROUNDS
 * Synthesized Audio & Haptic Feedback Engine
 * Ultra-low-latency Web Audio API synthesis (0 network overhead)
 */

class SoundFeedbackEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Razor blade metallic strike / click on message transmission
   */
  public playBladeTick(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Sharp metallic high frequency transient
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(4200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.045);

      // High-pass band to simulate sharp blade strike
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(4, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);

      // Mobile haptic tap
      this.triggerHaptic(6);
    } catch {
      // AudioContext unavailable or blocked by autoplay policy
    }
  }

  /**
   * Resonant low celestial chime on keypair forge / identity seal
   */
  public playSealChime(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);

      this.triggerHaptic([12, 40, 12]);
    } catch {}
  }

  /**
   * Haptic pulse for mobile touch targets
   */
  public triggerHaptic(pattern: number | number[] = 8): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }
}

export const SoundEngine = new SoundFeedbackEngine();
