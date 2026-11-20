<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { BuyAmount } from '../engine/state';
  import type { GameView } from './viewModel';
  import { buyMinion } from '../systems/army';
  import { buyUpgrade } from '../systems/upgrades';
  import { refresh } from './frame.svelte';
  import { toast } from './feedback.svelte';
  import { UPGRADES_BY_ID } from '../content/upgrades';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();

  const BUY_AMOUNTS: BuyAmount[] = [1, 10, 100, 'max'];

  function onBuy(id: string) {
    buyMinion(runtime.state, id, view.buyAmount);
    refresh();
  }

  function onUpgrade(id: string) {
    if (buyUpgrade(runtime.state, id)) toast(`${UPGRADES_BY_ID[id]?.name}: ${UPGRADES_BY_ID[id]?.description}`);
    refresh();
  }

  function setBuyAmount(amount: BuyAmount) {
    runtime.state.settings.buyAmount = amount;
    refresh();
  }
</script>

<section class="panel army">
  <h2>Army</h2>
  <div class="stat-line">
    Army DPS: <strong>{view.dps}</strong>
    {#if view.bossDps !== view.dps}<span class="muted">({view.bossDps} vs bosses)</span>{/if}
  </div>

  {#if view.bulkBuyUnlocked}
    <div class="toggle" role="group" aria-label="Buy amount">
      {#each BUY_AMOUNTS as amount}
        <button class:active={view.buyAmount === amount} onclick={() => setBuyAmount(amount)}>
          {amount === 'max' ? 'Max' : `x${amount}`}
        </button>
      {/each}
    </div>
  {/if}

  {#if view.upgrades.length > 0}
    <h3>Upgrades</h3>
    <ul class="upgrades">
      {#each view.upgrades as u (u.id)}
        <li>
          <button
            class="upgrade"
            disabled={!u.affordable}
            onclick={() => onUpgrade(u.id)}
            title={u.flavor}
            data-testid={`upgrade-${u.id}`}
          >
            <span class="upgrade-name">{u.name}</span>
            <span class="upgrade-desc">{u.description}</span>
            <span class="upgrade-cost">{u.cost} Bones</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <h3>Minions</h3>
  <ul class="rows">
    {#each view.minions as m (m.id)}
      <li>
        <button class="row-buy" disabled={!m.affordable} onclick={() => onBuy(m.id)} data-testid={`buy-${m.id}`}>
          <span class="row-head">
            <span class="row-name">{m.name}</span>
            <span class="row-owned">{m.owned}</span>
          </span>
          <span class="row-desc">{m.description}</span>
          {#if m.trait}<span class="row-trait">{m.trait}</span>{/if}
          <span class="row-foot">
            <span>Buy {m.buyCount}: <strong>{m.cost}</strong></span>
            <span>{m.dpsEach} DPS each · {m.dpsTotal} total</span>
          </span>
          {#if m.nextMilestone !== null}
            <span class="milestone">
              <span class="milestone-bar" style:width={`${Math.min(100, (m.owned / m.nextMilestone) * 100)}%`}></span>
              <span class="milestone-text">×2 damage at {m.nextMilestone}</span>
            </span>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</section>
