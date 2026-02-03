// Extend Window interface for Safari's webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

/**
 * Procedural audio system using Web Audio API
 * Generates all sounds programmatically - no audio files needed!
 */

export class AudioSystem {
  private static audioContext: AudioContext | null = null;
  private static masterVolume = 0.3;
  private static sfxVolume = 0.7;
  private static musicVolume = 0.5;

  /**
   * Initialize audio context
   */
  static init(): void {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
  }

  /**
   * Play a beep/click sound
   */
  static playClick(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 800;
    osc.type = 'sine';

    gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  /**
   * Play success/achievement sound
   */
  static playSuccess(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;

    // Three ascending tones
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G major chord
    const baseTime = ctx.currentTime;

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = 'sine';

      const startTime = baseTime + i * 0.1;
      gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  /**
   * Play fail/miss sound
   */
  static playFail(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    osc.type = 'sawtooth';

    gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  /**
   * Play whoosh/swipe sound
   */
  static playWhoosh(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Create white noise buffer
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.2);
    filter.Q.value = 10;

    gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.3);
  }

  /**
   * Play bounce sound
   */
  static playBounce(intensity: number = 0.5): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const baseFreq = 200 + intensity * 300;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + 0.1);
    osc.type = 'square';

    gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.1 * intensity, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  /**
   * Play explosion sound
   */
  static playExplosion(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Create noise buffer
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.5);
  }

  /**
   * Play countdown beep
   */
  static playBeep(pitch: number = 1): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 440 * pitch;
    osc.type = 'square';

    gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /**
   * Play swoosh sound (for balls flying)
   */
  static playSwoosh(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    osc.type = 'sine';

    gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /**
   * Play timer tick sound
   */
  static playTick(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 1000;
    osc.type = 'sine';

    gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  /**
   * Play crowd cheer (layered oscillators)
   */
  static playCrowdCheer(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;

    // Create layered noise for crowd effect
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const noise = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        filter.type = 'bandpass';
        filter.frequency.value = 500 + Math.random() * 1000;
        filter.Q.value = 2;

        gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + 0.8);
      }, i * 50);
    }
  }

  /**
   * Set master volume (0-1)
   */
  static setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set SFX volume (0-1)
   */
  static setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set music volume (0-1)
   */
  static setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Mute all audio
   */
  static mute(): void {
    this.masterVolume = 0;
  }

  /**
   * Unmute audio
   */
  static unmute(): void {
    this.masterVolume = 0.3;
  }

  /**
   * Play drumroll sound for dramatic reveal
   */
  static playDrumroll(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const duration = 2.0;

    // Create noise-based drumroll
    for (let i = 0; i < 40; i++) {
      const startTime = ctx.currentTime + (i / 40) * duration;
      const intensity = 0.5 + (i / 40) * 0.5; // Build intensity

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 100 + Math.random() * 50;
      osc.type = 'triangle';

      gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.08 * intensity, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

      osc.start(startTime);
      osc.stop(startTime + 0.05);
    }
  }

  /**
   * Play triumphant fanfare for DRY reveal
   */
  static playDryReveal(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const baseTime = ctx.currentTime;

    // Triumphant ascending chord progression
    const notes = [
      { freq: 261.63, delay: 0 },      // C4
      { freq: 329.63, delay: 0.1 },    // E4
      { freq: 392.00, delay: 0.2 },    // G4
      { freq: 523.25, delay: 0.3 },    // C5
      { freq: 659.25, delay: 0.4 },    // E5 (high)
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = note.freq;
      osc.type = 'sine';

      const startTime = baseTime + note.delay;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * this.sfxVolume * 0.25, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  /**
   * Play sad trombone for WET reveal
   */
  static playWetReveal(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const baseTime = ctx.currentTime;

    // Descending sad notes (wah wah wah wahhhhh)
    const notes = [
      { startFreq: 349.23, endFreq: 329.63, delay: 0 },     // F4 -> E4
      { startFreq: 329.63, endFreq: 311.13, delay: 0.3 },   // E4 -> Eb4
      { startFreq: 311.13, endFreq: 293.66, delay: 0.6 },   // Eb4 -> D4
      { startFreq: 293.66, endFreq: 196.00, delay: 0.9 },   // D4 -> G3 (long sad drop)
    ];

    notes.forEach((note, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = baseTime + note.delay;
      const duration = i === 3 ? 0.8 : 0.25; // Last note is longer

      osc.frequency.setValueAtTime(note.startFreq, startTime);
      osc.frequency.linearRampToValueAtTime(note.endFreq, startTime + duration);
      osc.type = 'sawtooth';

      gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    });
  }

  /**
   * Play time counter click sound
   */
  static playTimeClick(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 1200;
    osc.type = 'sine';

    gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  }

  /**
   * Play urgent ticking sound for time warnings
   */
  static playUrgentTick(): void {
    this.init();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 880;
    osc.type = 'square';

    gain.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }
}
