import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Music2, Play, Volume2, VolumeX } from 'lucide-react';
import { useI18n } from './i18n.tsx';
import { GameAudio, type AudioStatus, type Cue } from './audioEngine.ts';

type SoundSettings = {
  enabled: boolean; toggle: () => void; musicEnabled: boolean; toggleMusic: () => void;
  unlock: () => void; play: (cue: Cue, player?: string) => void; status: AudioStatus;
};
const Context = createContext<SoundSettings | null>(null);
function preference(key: string) { try { return localStorage.getItem(key) !== 'off'; } catch { return true; } }
function save(key: string, value: boolean) { try { localStorage.setItem(key, value ? 'on' : 'off'); } catch {} }

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(() => preference('taktixo.sound.v1'));
  const [musicEnabled, setMusicEnabled] = useState(() => preference('tac-tiq.music.v1'));
  const [status, setStatus] = useState<AudioStatus>('waiting');
  const active = useRef(enabled), musicActive = useRef(musicEnabled);
  active.current = enabled; musicActive.current = musicEnabled;
  const engine = useRef<GameAudio | null>(null);
  const getAudio = useCallback(() => {
    if (!engine.current) engine.current = new GameAudio({ onStatus: setStatus });
    engine.current.setPreferences(active.current, musicActive.current);
    return engine.current;
  }, []);
  const unlock = useCallback(() => { void getAudio().unlock(); }, [getAudio]);
  const play = useCallback((cue: Cue, player?: string) => getAudio().play(cue, player), [getAudio]);
  const toggle = useCallback(() => {
    const next = !active.current;
    active.current = next; setEnabled(next); save('taktixo.sound.v1', next);
    const audio = getAudio();
    if (next) audio.play('move');
  }, [getAudio]);
  const toggleMusic = useCallback(() => {
    const next = !musicActive.current;
    musicActive.current = next; setMusicEnabled(next); save('tac-tiq.music.v1', next);
    const audio = getAudio();
    if (next) void audio.unlock();
  }, [getAudio]);
  useEffect(() => {
    const gesture = () => { if (active.current || musicActive.current) unlock(); };
    const keys = (event: KeyboardEvent) => { if (!event.repeat) gesture(); };
    // touch/pointer UP and click are activation events on mobile. Keep retrying after
    // a denied gesture, lock screen, app switch or Safari audio interruption.
    const events = ['touchend', 'pointerup', 'click'] as const;
    events.forEach(event => document.addEventListener(event, gesture, { capture: true, passive: true }));
    document.addEventListener('keydown', keys, true);
    const visibility = () => engine.current?.setVisible(document.visibilityState !== 'hidden');
    const pageShow = () => engine.current?.setVisible(true);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pageshow', pageShow);
    return () => {
      events.forEach(event => document.removeEventListener(event, gesture, true));
      document.removeEventListener('keydown', keys, true);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pageshow', pageShow);
      engine.current?.dispose(); engine.current = null;
    };
  }, [unlock]);
  return <Context.Provider value={{ enabled, toggle, musicEnabled, toggleMusic, unlock, play, status }}>{children}</Context.Provider>;
}

export function useSound() {
  const value = useContext(Context);
  if (!value) throw new Error('SoundProvider is required');
  return value;
}

export function SoundButton() {
  const { enabled, toggle, unlock, play, status } = useSound();
  const { t } = useI18n();
  const waiting = useRef(false);
  const label = status === 'unavailable' ? t('Zvuk nije dostupan', 'Audio unavailable')
    : enabled && status !== 'ready' ? t('Dodirni za zvuk', 'Tap to enable audio')
    : enabled ? t('Isključi zvukove poteza', 'Mute game effects') : t('Uključi zvukove poteza', 'Enable game effects');
  const remember = () => { waiting.current = enabled && status !== 'ready'; };
  return <button className="sound-button" data-audio-state={status} onPointerDown={remember}
    onKeyDown={remember} onClick={() => {
      if (waiting.current || (enabled && status !== 'ready')) { unlock(); play('move'); }
      else toggle();
      waiting.current = false;
    }} aria-label={label} title={label} aria-pressed={enabled} disabled={status === 'unavailable'}>
    {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
  </button>;
}

export function MusicButton() {
  const { musicEnabled, toggleMusic, unlock, status } = useSound();
  const { t } = useI18n();
  const waiting = useRef(false);
  const playing = musicEnabled && status === 'ready';
  const label = status === 'unavailable' ? t('Zvuk nije dostupan', 'Audio unavailable')
    : musicEnabled && !playing ? t('Dodirni za muziku', 'Tap to start music')
    : playing ? t('Isključi muziku', 'Turn music off') : t('Uključi muziku', 'Turn music on');
  const remember = () => { waiting.current = musicEnabled && status !== 'ready'; };
  return <button className="music-button" data-audio-state={status} onPointerDown={remember}
    onKeyDown={remember} onClick={() => {
      if (waiting.current || (musicEnabled && status !== 'ready')) unlock();
      else toggleMusic();
      waiting.current = false;
    }} aria-label={label} title={label} aria-pressed={playing} disabled={status === 'unavailable'}>
    {musicEnabled && !playing ? <Play size={17} /> : <Music2 size={17} />}
    <span>{t('Muzika', 'Music')}</span><i />
  </button>;
}
