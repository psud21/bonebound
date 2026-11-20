import { mount } from 'svelte';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/400-italic.css';
import './app.css';
import App from './App.svelte';
import { GameRuntime } from './game';
import { startRenderClock } from './ui/frame.svelte';

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

if (import.meta.env.DEV) {
  (window as unknown as { __game: GameRuntime }).__game = runtime;
}

mount(App, { target: document.getElementById('app')!, props: { runtime } });
