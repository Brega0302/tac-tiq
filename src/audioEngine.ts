import { AmbientMusic } from './ambientMusic.ts';

export type AudioStatus = 'waiting' | 'ready' | 'unavailable';
export type Cue = 'move' | 'win' | 'draw';
type Options = {
  createContext?: () => AudioContext;
  onStatus?: (status: AudioStatus) => void;
  playbackSession?: () => void;
};

function createBrowserContext() {
  const browser = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  const Factory = browser.AudioContext || browser.webkitAudioContext;
  if (!Factory) throw new Error('Audio is unavailable');
  return new Factory();
}

function requestPlaybackSession() {
  // Safari supports this optional API. Other browsers continue using Web Audio.
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = 'playback';
}

/** Owns one audio graph. A denied gesture never prevents a later tap from retrying. */
export class GameAudio {
  private context: AudioContext | null = null;
  private effects: GainNode | null = null;
  private music: AmbientMusic | null = null;
  private visible = true;
  private disposed = false;
  private status: AudioStatus = 'waiting';
  private effectsEnabled = true;
  private musicEnabled = true;

  constructor(private options: Options = {}) {}

  private report(status: AudioStatus) {
    if (this.disposed || status === this.status) return;
    this.status = status;
    this.options.onStatus?.(status);
  }

  private sync = () => {
    const running = this.context?.state === 'running';
    this.report(running ? 'ready' : 'waiting');
    if (running && this.visible && this.musicEnabled) this.music?.start();
    else this.music?.stop();
  };

  setPreferences(effects: boolean, music: boolean) {
    this.effectsEnabled = effects;
    this.musicEnabled = music;
    if (this.context && this.effects && this.context.state !== 'closed') {
      this.effects.gain.setValueAtTime(effects ? 0.7 : 0, this.context.currentTime);
    }
    if (!music) this.music?.stop();
  }

  unlock(): Promise<boolean> {
    if (this.disposed || !this.visible || (!this.effectsEnabled && !this.musicEnabled)) {
      return Promise.resolve(false);
    }
    try {
      try { (this.options.playbackSession || requestPlaybackSession)(); } catch { /* Optional API. */ }
      if (!this.context || this.context.state === 'closed') {
        const ctx = (this.options.createContext || createBrowserContext)();
        this.context = ctx;
        this.effects = ctx.createGain();
        this.effects.gain.value = this.effectsEnabled ? 0.7 : 0;
        this.effects.connect(ctx.destination);
        const bus = ctx.createGain();
        bus.gain.value = 0;
        bus.connect(ctx.destination);
        this.music = new AmbientMusic(ctx, bus);
        ctx.addEventListener('statechange', this.sync);
      }
      const ctx = this.context;
      if (ctx.state === 'running') {
        this.sync();
        return Promise.resolve(true);
      }
      // Start a silent buffer and call resume synchronously inside the tap event.
      // In particular, do not await anything before these Safari unlock operations.
      const source = ctx.createBufferSource();
      source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      source.connect(ctx.destination);
      source.onended = () => source.disconnect();
      source.start(0);
      return ctx.resume().then(() => {
        if (this.disposed || ctx !== this.context) return false;
        this.sync();
        return ctx.state === 'running';
      }).catch(() => { this.sync(); return false; });
    } catch {
      this.report('unavailable');
      return Promise.resolve(false);
    }
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (!visible) {
      this.music?.stop();
      if (this.context?.state === 'running') void this.context.suspend().catch(() => {});
    } else if (this.context) {
      // May be denied until the next tap, which the persistent gesture handlers retry.
      void this.unlock();
    }
  }

  play(cue: Cue, player = 'X') {
    if (!this.effectsEnabled || !this.visible || this.disposed) return;
    const requested = Date.now();
    const ready = this.unlock();
    const sound = () => {
      const ctx = this.context, bus = this.effects;
      if (!ctx || !bus || ctx.state !== 'running' || !this.effectsEnabled || !this.visible || this.disposed) return;
      const notes = cue === 'win' ? [523.25, 659.25, 783.99, 1046.5]
        : cue === 'draw' ? [392, 329.63] : [player === 'X' ? 440 : 369.99];
      notes.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator(), envelope = ctx.createGain();
        const start = ctx.currentTime + index * (cue === 'move' ? 0 : 0.12);
        const duration = cue === 'move' ? 0.15 : cue === 'win' ? 0.32 : 0.24;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        if (cue === 'move') oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.84, start + duration);
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.exponentialRampToValueAtTime(cue === 'move' ? 0.15 : 0.13, start + 0.012);
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(envelope);
        envelope.connect(bus);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
      });
    };
    if (this.context?.state === 'running') sound();
    else void ready.then(ok => { if (ok && Date.now() - requested < 500) sound(); });
  }

  dispose() {
    this.disposed = true;
    this.music?.stop();
    this.context?.removeEventListener('statechange', this.sync);
    void this.context?.close().catch(() => {});
    this.context = null;
  }
}
