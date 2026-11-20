<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import { buyGraveworks, hireWarden, startCycle } from '../systems/crypt';
  import { GRAVEWORKS_BY_ID } from '../content/graveworks';
  import { refresh } from './frame.svelte';
  import { toast } from './feedback.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();

  function onBuy(id: string) {
    buyGraveworks(runtime.state, id, view.buyAmount);
    refresh();
  }

  function onStart(id: string) {
    startCycle(runtime.state, id);
    refresh();
  }

  function onHire(id: string) {
    const def = GRAVEWORKS_BY_ID[id];
    if (hireWarden(runtime.state, id) && def) toast(`${def.warden.name} now runs your ${def.name}.`);
    refresh();
  }
</script>

<section class="panel crypt">
  <h2>The Crypt</h2>
  {#if !view.cryptUnlocked}
    <p class="muted locked">Sealed. Gather more Bones.</p>
  {:else}
    <div class="stat-line">Depth bonus: <strong>×{view.depthBonus}</strong> <span class="muted">(grows as you descend)</span></div>
    <ul class="rows">
      {#each view.graveworks as g (g.id)}
        <li class="gw">
          <div class="row-head">
            <span class="row-name">{g.name}</span>
            <span class="row-owned">{g.owned}</span>
          </div>
          <span class="row-desc">{g.description}</span>

          <button
            class="cycle"
            class:cycle-running={g.running}
            disabled={!g.canStart}
            onclick={() => onStart(g.id)}
            data-testid={`start-${g.id}`}
            aria-label={g.canStart ? `Start ${g.name}` : `${g.name} cycle`}
          >
            <span class="cycle-fill" class:cycle-fast={g.fast && g.running} style:width={`${g.fast && g.running ? 100 : g.progress}%`}></span>
            <span class="cycle-text">
              {#if g.owned === 0}
                Build one to start
              {:else if g.canStart}
                Raise! +{g.revenue} Bones
              {:else}
                +{g.revenue} per {g.cycle}
              {/if}
            </span>
          </button>

          <div class="gw-actions">
            <button disabled={!g.affordable} onclick={() => onBuy(g.id)} data-testid={`buy-${g.id}`}>
              Build {g.buyCount}: {g.cost}
            </button>
            {#if g.wardenVisible}
              <button
                class="warden"
                disabled={!g.wardenAffordable}
                onclick={() => onHire(g.id)}
                title={g.wardenQuirk}
                data-testid={`warden-${g.id}`}
              >
                Hire {g.wardenName}: {g.wardenCost}
              </button>
            {/if}
          </div>
          <div class="gw-foot muted">
            {#if g.warden}<span class="warden-tag">Run by {g.wardenName}</span>{/if}
            {#if g.owned > 0}<span>{g.rate}/s when running</span>{/if}
            {#if g.nextMilestone !== null && g.owned > 0}<span>×2 speed at {g.nextMilestone}</span>{/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>
