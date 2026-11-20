<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import { closeRift, openRift } from '../systems/rifts';
  import { refresh } from './frame.svelte';
  import { toast } from './feedback.svelte';
  import Icon from './Icon.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();
  const r = $derived(view.rift);

  function onOpen() {
    if (openRift(runtime.state)) toast('The Rift tears open. Your army pours through.');
    refresh();
  }
  function onClose() {
    const result = closeRift(runtime.state);
    if (result) toast(`Rift closed at depth ${result.depth}.`);
    refresh();
  }
</script>

<div class="rifts">
  <div class="lore-summary">
    <span class="rift-icon"><Icon name="magic-portal" size={40} /></span>
    <span>
      <span class="lore-count"><strong>{r.keys}</strong> Rift Key{r.keys === 1 ? '' : 's'}</span>
      <span class="muted small">Best depth {r.best} · Rift Mastery +{r.masteryPercent}% army damage · {r.runs} opened</span>
    </span>
  </div>

  <p class="muted small">
    A Rift lasts {Math.round(r.seconds / 60)} minutes. Each depth is one foe as tough as the guardian of floor
    100 + 10 × depth, so your best depth measures your real strength, and each level of it adds 3% army damage forever.
    The descent waits while you are inside. Guardians from floor 301 leave a key the first time they fall each run.
  </p>

  {#if r.active}
    <div class="rift-box active">
      <div class="rift-status"><strong>Depth {r.depth}</strong> · as tough as floor {r.enemyFloor} · {Math.ceil(r.timeLeft)}s left</div>
      <div class="boss-timer"><div class="boss-timer-fill rift-timer" style:width={`${r.timePercent}%`}></div></div>
      <button class="small-btn" onclick={onClose}>Close the Rift early</button>
    </div>
  {:else}
    <div class="rift-box">
      <button class="rebirth-btn rift-btn" disabled={!r.canOpen} onclick={onOpen} data-testid="open-rift">
        <Icon name="magic-portal" size={16} /> Open a Rift
      </button>
      <p class="muted small">
        Rewards on closing: Bone Dust and gems by depth, finer gems deeper, and a legendary from depth {r.legendaryDepth}.
      </p>
    </div>
  {/if}
</div>
