import { GameLoop } from './engine/loop';
import { simulateOffline, type OfflineSummary } from './engine/offline';
import { SaveStore, decodeSave, encodeSave, type LoadSource, type SaveStorage } from './engine/save';
import { createInitialState, type GameState } from './engine/state';
import { update } from './systems/tick';

const AUTOSAVE_MS = 30_000;
/** Absences shorter than this are simulated silently, with no "while you slumbered" summary. */
const SUMMARY_MIN_SECONDS = 60;

/**
 * Browser runtime: owns the current GameState, the loop, autosave and offline catch-up.
 * Everything in engine/ and systems/ stays DOM-free so the simulator and tests can use it.
 */
export class GameRuntime {
  state: GameState;
  readonly store: SaveStore;
  readonly loop: GameLoop;
  loadSource: LoadSource = 'new';
  loadError: string | null = null;
  offlineSummary: OfflineSummary | null = null;
  private autosaveTimer: ReturnType<typeof setInterval> | null = null;

  constructor(storage: SaveStorage) {
    this.store = new SaveStore(storage);
    this.state = createInitialState();
    this.loop = new GameLoop({
      update: (dt) => {
        update(this.state, dt);
        this.state.meta.lastActiveAt = Date.now();
      },
      onLongGap: (seconds) => this.catchUp(seconds),
    });
  }

  boot(): void {
    const result = this.store.load();
    this.state = result.state;
    this.loadSource = result.source;
    this.loadError = result.error ?? null;

    if (result.source !== 'new') {
      const away = (Date.now() - this.state.meta.lastActiveAt) / 1000;
      this.catchUp(away);
    }
    this.state.meta.lastActiveAt = Date.now();

    this.loop.start();
    this.autosaveTimer = setInterval(() => this.save(), AUTOSAVE_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.save();
    });
    window.addEventListener('pagehide', () => this.save());
  }

  private catchUp(seconds: number): void {
    if (seconds <= 0) return;
    const summary = simulateOffline(this.state, seconds);
    this.state.meta.lastActiveAt = Date.now();
    if (seconds >= SUMMARY_MIN_SECONDS) this.offlineSummary = summary;
  }

  save(): boolean {
    return this.store.save(this.state);
  }

  exportSave(): string {
    return encodeSave(this.state);
  }

  /** Replaces the current game with an imported one. Returns an error message on failure. */
  importSave(text: string): string | null {
    try {
      const state = decodeSave(text);
      state.meta.lastActiveAt = Date.now(); // no offline gains from importing
      this.state = state;
      this.offlineSummary = null;
      this.save();
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }

  hardReset(): void {
    this.store.clear();
    this.state = createInitialState();
    this.offlineSummary = null;
    this.save();
  }

  dispose(): void {
    this.loop.stop();
    if (this.autosaveTimer !== null) clearInterval(this.autosaveTimer);
  }
}
