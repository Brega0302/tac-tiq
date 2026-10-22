import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio, type AudioStatus } from '../src/audioEngine.ts';

function fakeContext() {
  const calls: string[] = [];
  const listeners = new Set<() => void>();
  const param = () => ({ value: 0, setValueAtTime() {}, cancelScheduledValues() {},
    setTargetAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect() {}, disconnect() {}, onended: null as null | (() => void) });
  const context = {
    state: 'suspended', currentTime: 0, sampleRate: 44100, destination: {}, blocked: false,
    createGain: () => ({ ...node(), gain: param() }),
    createBuffer: () => ({}),
    createBufferSource: () => ({ ...node(), buffer: {}, start: () => calls.push('prime') }),
    createOscillator: () => ({ ...node(), type: '', frequency: param(),
      start: () => calls.push('tone'), stop() {} }),
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    resume: () => {
      calls.push('resume');
      if (context.blocked) return Promise.reject(new Error('Gesture denied'));
      context.state = 'running'; listeners.forEach(fn => fn());
      return Promise.resolve();
    },
    suspend: () => { context.state = 'suspended'; listeners.forEach(fn => fn()); return Promise.resolve(); },
    close: () => { context.state = 'closed'; return Promise.resolve(); },
  };
  return { context, calls, listeners, asAudio: () => context as unknown as AudioContext };
}

test('a rejected mobile unlock is retried on the next tap, with priming and resume called synchronously', async t => {
  const f = fakeContext(), statuses: AudioStatus[] = [];
  const audio = new GameAudio({ createContext: f.asAudio, playbackSession: () => f.calls.push('playback'),
    onStatus: state => statuses.push(state) });
  t.after(() => audio.dispose());
  audio.setPreferences(true, false);
  f.context.blocked = true;
  const denied = audio.unlock();
  assert.deepEqual(f.calls, ['playback', 'prime', 'resume']);
  assert.equal(await denied, false);
  assert.ok(!statuses.includes('ready'));
  f.context.blocked = false;
  assert.equal(await audio.unlock(), true);
  assert.equal(f.calls.filter(call => call === 'resume').length, 2);
  assert.equal(statuses.at(-1), 'ready');
  audio.play('move');
  assert.equal(f.calls.filter(call => call === 'tone').length, 1);
});

test('Safari interruptions and returning from the background recover without creating another context', async t => {
  const f = fakeContext(), statuses: AudioStatus[] = [];
  let created = 0;
  const audio = new GameAudio({ createContext: () => { created++; return f.asAudio(); }, playbackSession() {},
    onStatus: state => statuses.push(state) });
  t.after(() => audio.dispose());
  audio.setPreferences(true, false);
  await audio.unlock();
  f.context.state = 'interrupted'; f.listeners.forEach(fn => fn());
  assert.equal(statuses.at(-1), 'waiting');
  audio.play('move');
  await Promise.resolve();
  assert.equal(statuses.at(-1), 'ready');
  const tones = f.calls.filter(call => call === 'tone').length;
  audio.setVisible(false); audio.play('win');
  assert.equal(f.calls.filter(call => call === 'tone').length, tones);
  assert.equal(f.context.state, 'suspended');
  audio.setVisible(true);
  await Promise.resolve();
  assert.equal(f.context.state, 'running');
  assert.equal(created, 1);
});

test('muting effects does not stop music, and disabling both prevents gesture playback', async t => {
  const f = fakeContext();
  const audio = new GameAudio({ createContext: f.asAudio, playbackSession() {} });
  t.after(() => audio.dispose());
  audio.setPreferences(false, true);
  await audio.unlock();
  const musicTones = f.calls.filter(call => call === 'tone').length;
  assert.ok(musicTones > 0);
  audio.play('win');
  assert.equal(f.calls.filter(call => call === 'tone').length, musicTones);
  audio.setPreferences(false, false);
  const count = f.calls.length;
  assert.equal(await audio.unlock(), false);
  assert.equal(f.calls.length, count);
});

test('audio unavailability and disposal are safe and never report false readiness', async () => {
  const statuses: AudioStatus[] = [];
  const audio = new GameAudio({ createContext: () => { throw new Error('Unsupported'); },
    playbackSession() {}, onStatus: status => statuses.push(status) });
  assert.equal(await audio.unlock(), false);
  assert.deepEqual(statuses, ['unavailable']);
  audio.dispose();
  assert.equal(await audio.unlock(), false);
  audio.play('win');
});
