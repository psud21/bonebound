<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import { buyGraveworks, hireWarden, startCycle } from '../systems/crypt';
  import { GRAVEWORKS_BY_ID } from '../content/graveworks';
  import { refresh } from './frame.svelte';
  import { toast } from './feedback.svelte';
  import Icon from './Icon.svelte';

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

<section class="panel crypt" class:crypt-sealed={!view.cryptUnlocked}>
  <h2 class="panel-title"><Icon name="graveyard" size={22} /> The Crypt</h2>
  {#if !view.cryptUnlocked}
    <p class="locked"><Icon name="padlock" size={14} /> Sealed. {view.cryptUnlock.text} to open it.</p>
    <span class="req-bar"><span style:width={`${view.cryptUnlock.ratio * 100}%`}></span></span>
    <ul class="crypt-preview">
      {#each view.graveworks as g (g.id)}
        <li><Icon name={g.icon} size={22} /> {g.status === 'hidden' ? '???' : g.name}</li>
      {/each}
    </ul>
    <p class="muted small">Graveworks produce Bones on their own, and grow stronger the deeper you descend.</p>
  {:else}
    <div class="stat-line">Depth bonus <strong>×{view.depthBonus}</strong> <span class="muted">· grows as you descend</span></div>
    <ul class="rows">
      {#each view.graveworks as g (g.id)}
        <li class="gw" class:gw-locked={g.status !== 'open'}>
          <div class="gw-head">
            <span class="badge" class:badge-locked={g.status === 'preview'} class:badge-hidden={g.status === 'hidden'}>
              <Icon name={g.icon} size={34} />
            </span>
            <span class="row-main">
              <span class="row-head">
                <span class="row-name">{g.status === 'hidden' ? '???' : g.name}</span>
                {#if g.status === 'open'}<span class="row-owned">{g.owned}</span>{:else}<Icon name="padlock" size={16} class="lock-icon" />{/if}
              </span>
              <span class="row-desc">{g.status === 'hidden' ? 'Not yet discovered.' : g.description}</span>
            </span>
          </div>

          {#if g.status === 'open'}
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
                Build{g.buyCount > 1 ? ` ${g.buyCount}` : ''} · <Icon name="crossed-bones" size={12} /> {g.cost}
              </button>
              {#if g.wardenVisible}
                <button
                  class="warden"
                  disabled={!g.wardenAffordable}
                  onclick={() => onHire(g.id)}
                  title={g.wardenQuirk}
                  data-testid={`warden-${g.id}`}
                >
                  <Icon name="crowned-skull" size={14} /> Hire {g.wardenName} · {g.wardenCost}
                </button>
              {/if}
            </div>
            <div class="gw-foot muted">
              {#if g.warden}<span class="warden-tag"><Icon name="crowned-skull" size={12} /> Run by {g.wardenName}</span>{/if}
              {#if g.owned > 0}<span>{g.rate}/s when running</span>{/if}
              {#if g.nextMilestone !== null && g.owned > 0}<span>×2 speed at {g.nextMilestone}</span>{/if}
            </div>
          {:else if g.status === 'preview'}
            <div class="gw-foot muted">
              <span><Icon name="crossed-bones" size={12} /> {g.baseCost} to build</span>
            </div>
            <span class="req">
              {g.unlockText}
              <span class="req-bar"><span style:width={`${g.unlockRatio * 100}%`}></span></span>
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>
