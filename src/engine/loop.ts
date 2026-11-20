export const TICK_MS = 50; // 20 logic ticks per second

export interface LoopOptions {
  /** Runs once per fixed tick with dt in seconds. */
  update: (dt: number) => void;
  /** Called when the gap since the last advance is too long to tick through (tab was asleep). */
  onLongGap: (seconds: number) => void;
  tickMs?: number;
  /** Gaps longer than this go to onLongGap instead of being ticked through. */
  longGapMs?: number;
  now?: () => number;
}

/**
 * Fixed-timestep loop. `advance(now)` is the testable core: it turns elapsed
 * wall-clock time into a whole number of logic ticks and carries the remainder.
 */
export class GameLoop {
  private readonly tickMs: number;
  private readonly longGapMs: number;
  private readonly now: () => number;
  private last: number | null = null;
  private accumulator = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly options: LoopOptions) {
    this.tickMs = options.tickMs ?? TICK_MS;
    this.longGapMs = options.longGapMs ?? 10_000;
    this.now = options.now ?? (() => Date.now());
  }

  /** Returns the number of ticks run. */
  advance(now: number = this.now()): number {
    if (this.last === null) {
      this.last = now;
      return 0;
    }
    const elapsed = now - this.last;
    this.last = now;
    if (elapsed <= 0) return 0;

    if (elapsed > this.longGapMs) {
      this.accumulator = 0;
      this.options.onLongGap(elapsed / 1000);
      return 0;
    }

    this.accumulator += elapsed;
    let ticks = 0;
    while (this.accumulator >= this.tickMs) {
      this.options.update(this.tickMs / 1000);
      this.accumulator -= this.tickMs;
      ticks++;
    }
    return ticks;
  }

  /** Uses setInterval (not requestAnimationFrame) so logic keeps running in background tabs. */
  start(): void {
    if (this.timer !== null) return;
    this.last = this.now();
    this.accumulator = 0;
    this.timer = setInterval(() => this.advance(), this.tickMs);
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  get running(): boolean {
    return this.timer !== null;
  }
}
