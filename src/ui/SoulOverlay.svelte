<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { SoulState } from '../engine/state';
  import { catchSoul } from '../systems/events';
  import { refresh } from './frame.svelte';
  import { toast } from './feedback.svelte';
  import Icon from './Icon.svelte';

  let { runtime, soul }: { runtime: GameRuntime; soul: SoulState | null } = $props();

  function onCatch() {
    const outcome = catchSoul(runtime.state);
    if (outcome) toast(outcome.message);
    refresh();
  }
</script>

{#if soul}
  <button
    class="soul"
    class:soul-fading={soul.timeLeft < 3}
    style:left={`${soul.x}%`}
    style:top={`${soul.y}%`}
    onclick={onCatch}
    aria-label="Catch the Wandering Soul"
    data-testid="soul"
  >
    <Icon name="soul" size={34} />
  </button>
{/if}
