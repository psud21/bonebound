/**
 * The game state is plain mutable data (Decimals don't belong in Svelte proxies).
 * The UI re-reads it whenever this counter changes, about 10 times per second.
 */
export const frame = $state({ n: 0 });

const RENDER_INTERVAL_MS = 100;

export function startRenderClock(): void {
  let last = 0;
  const step = (time: number) => {
    if (time - last >= RENDER_INTERVAL_MS) {
      last = time;
      frame.n++;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Force an immediate re-render after a player action, without waiting for the next frame. */
export function refresh(): void {
  frame.n++;
}
