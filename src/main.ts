import { mount } from 'svelte';
import '@fontsource/cinzel/latin-600.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/latin-400-italic.css';
import './app.css';
import './panels.css';
import App from './App.svelte';
import { GameRuntime } from './game';
import { startRenderClock } from './ui/frame.svelte';
import { initAudio } from './ui/audio';

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Falls back to in-memory storage when localStorage is blocked (private mode, etc.). */
function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const runtime = new GameRuntime(getStorage() ?? memoryStorage());
runtime.boot();
startRenderClock();
initAudio();

if (import.meta.env.DEV) {
  (window as unknown as { __game: GameRuntime }).__game = runtime;
  // Console helpers for testing later content, e.g. __dev.loot.generateItem(__game.state, 80, 'legendary')
  void Promise.all([import('./systems/loot'), import('./systems/descent')]).then(([loot, descent]) => {
    (window as unknown as { __dev: unknown }).__dev = { loot, descent };
  });
}

mount(App, { target: document.getElementById('app')!, props: { runtime } });
