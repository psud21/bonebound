<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { BuyAmount } from '../engine/state';
  import type { GameView } from './viewModel';
  import { buyMinion } from '../systems/army';
  import { buyUpgrade } from '../systems/upgrades';
  import { raiseElite } from '../systems/elites';
  import { refresh } from './frame.svelte';
  import { toast } from './feedback.svelte';
  import { UPGRADES_BY_ID } from '../content/upgrades';
  import Icon from './Icon.svelte';

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

  function onElite(id: string) {
    raiseElite(runtime.state, id);
    refresh();
  }

  function toggleAutoBuy() {
    runtime.state.prestige.autoBuy = !runtime.state.prestige.autoBuy;
    refresh();
  }

  function setBuyAmount(amount: BuyAmount) {
    runtime.state.settings.buyAmount = amount;
    refresh();
  }
</script>

<section class="panel army">
  <h2 class="panel-title"><Icon name="raise-skeleton" size={22} /> Army</h2>
  <div class="stat-line">
    <Icon name="sparkling-sabre" size={16} class="inline-icon" />
    <strong>{view.dps}</strong> DPS
    {#if view.bossDps !== view.dps}<span class="muted">· {view.bossDps} vs guardians</span>{/if}
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

  {#if view.autoBuyOwned}
    <label class="auto-toggle">
      <input type="checkbox" checked={view.autoBuy} onchange={toggleAutoBuy} /> Raise minions automatically
    </label>
  {/if}

  {#if view.upgrades.length > 0 || view.lockedUpgrades.length > 0}
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
            <span class="upgrade-icon"><Icon name={u.icon} size={26} /></span>
            <span class="upgrade-body">
              <span class="upgrade-name">{u.name}</span>
              <span class="upgrade-desc">{u.description}</span>
              <span class="upgrade-cost"><Icon name="crossed-bones" size={12} /> {u.cost}</span>
            </span>
          </button>
        </li>
      {/each}
      {#each view.lockedUpgrades as u (u.id)}
        <li>
          <div class="upgrade upgrade-locked" title={u.description}>
            <span class="upgrade-icon"><Icon name={u.icon} size={26} /></span>
            <span class="upgrade-body">
              <span class="upgrade-name">{u.name}</span>
              <span class="upgrade-desc">{u.description}</span>
              <span class="req">
                <Icon name="padlock" size={11} /> {u.requirement}
                <span class="req-bar"><span style:width={`${u.ratio * 100}%`}></span></span>
              </span>
            </span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}

  <h3>Minions</h3>
  <ul class="rows">
    {#each view.minions as m (m.id)}
      <li>
        {#if m.status === 'open'}
          <button class="row-buy" disabled={!m.affordable} onclick={() => onBuy(m.id)} data-testid={`buy-${m.id}`}>
            <span class="badge"><Icon name={m.icon} size={38} /></span>
            <span class="row-main">
              <span class="row-head">
                <span class="row-name">{m.name}</span>
                <span class="row-owned">{m.owned}</span>
              </span>
              <span class="row-desc">{m.description}</span>
              {#if m.trait}<span class="row-trait">{m.trait}</span>{/if}
              <span class="row-foot">
                <span class="cost"><Icon name="crossed-bones" size={12} /> {m.cost}{m.buyCount > 1 ? ` (x${m.buyCount})` : ''}</span>
                <span>{m.dpsEach} DPS each · {m.dpsTotal} total</span>
              </span>
              {#if m.nextMilestone !== null}
                <span class="milestone">
                  <span class="milestone-bar" style:width={`${Math.min(100, (m.owned / m.nextMilestone) * 100)}%`}></span>
                  <span class="milestone-text">×2 damage at {m.nextMilestone}</span>
                </span>
              {/if}
            </span>
          </button>
        {:else if m.status === 'preview'}
          <div class="row-buy row-locked">
            <span class="badge badge-locked"><Icon name={m.icon} size={38} /></span>
            <span class="row-main">
              <span class="row-head">
                <span class="row-name">{m.name}</span>
                <Icon name="padlock" size={16} class="lock-icon" />
              </span>
              <span class="row-foot">
                <span class="cost"><Icon name="crossed-bones" size={12} /> {m.baseCost}</span>
                <span>{m.dpsEach} DPS each</span>
              </span>
              <span class="req">
                {m.unlockText}
                <span class="req-bar"><span style:width={`${m.unlockRatio * 100}%`}></span></span>
              </span>
            </span>
          </div>
        {:else}
          <div class="row-buy row-hidden">
            <span class="badge badge-hidden"><Icon name={m.icon} size={38} /></span>
            <span class="row-main"><span class="row-name">???</span><span class="row-desc">Something stirs deeper in the crypt.</span></span>
          </div>
        {/if}
      </li>
    {/each}
  </ul>

  {#if view.elites.visible}
    <h3 class="elites-head">
      <span>Elites</span>
      <span class="corpses" title="Corpses: dropped by kills, spent on Elites"><Icon name="raise-zombie" size={16} /> {view.elites.corpses}</span>
    </h3>
    <ul class="rows elites">
      {#each view.elites.list as e (e.id)}
        <li>
          {#if e.unlocked}
            <button class="row-buy elite" disabled={!e.affordable} onclick={() => onElite(e.id)} data-testid={`elite-${e.id}`}>
              <span class="badge badge-elite"><Icon name={e.icon} size={34} /></span>
              <span class="row-main">
                <span class="row-head">
                  <span class="row-name">{e.name}</span>
                  <span class="row-owned">Lv {e.level}</span>
                </span>
                <span class="row-desc">{e.description}</span>
                <span class="row-trait">{e.effect}</span>
                <span class="row-foot">
                  <span class="cost"><Icon name="raise-zombie" size={12} /> {e.cost} Corpses</span>
                  <span>next level</span>
                </span>
              </span>
            </button>
          {:else}
            <div class="row-buy row-locked">
              <span class="badge badge-locked"><Icon name={e.icon} size={34} /></span>
              <span class="row-main">
                <span class="row-head"><span class="row-name">{e.name}</span><Icon name="padlock" size={16} class="lock-icon" /></span>
                <span class="req">Reach floor {e.unlockFloor}</span>
              </span>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>
