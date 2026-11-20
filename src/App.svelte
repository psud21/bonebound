<script lang="ts">
  import type { GameRuntime } from './game';
  import type { BuyAmount } from './engine/state';
  import type { Notation } from './engine/format';
  import { formatDuration, formatNumber } from './engine/format';
  import { buyMinion } from './systems/army';
  import { siphon } from './systems/siphon';
  import { buildView } from './ui/viewModel';
  import { frame, refresh } from './ui/frame.svelte';
  import SavePanel from './ui/SavePanel.svelte';

  let { runtime }: { runtime: GameRuntime } = $props();

  const view = $derived.by(() => {
    void frame.n;
    return buildView(runtime.state);
  });
  const offline = $derived.by(() => {
    void frame.n;
    return runtime.offlineSummary;
  });

  const BUY_AMOUNTS: BuyAmount[] = [1, 10, 100, 'max'];
  const NOTATIONS: Notation[] = ['short', 'scientific', 'engineering'];

  function onSiphon() {
    siphon(runtime.state);
    refresh();
  }

  function onBuy(id: string) {
    buyMinion(runtime.state, id, runtime.state.settings.buyAmount);
    refresh();
  }

  function setBuyAmount(amount: BuyAmount) {
    runtime.state.settings.buyAmount = amount;
    refresh();
  }

  function setNotation(n: Notation) {
    runtime.state.settings.notation = n;
    refresh();
  }

  function dismissOffline() {
    runtime.offlineSummary = null;
    refresh();
  }
</script>

<header class="topbar">
  <h1>Bonebound <span class="subtitle">The Descent · M0 debug build</span></h1>
  <div class="resource">
    <span class="label">Bones</span>
    <span class="value" data-testid="bones">{view.bones}</span>
    <span class="rate">≈ {view.bonesPerSecond}/s</span>
  </div>
</header>

{#if offline}
  <div class="banner" role="status">
    <div>
      <strong>While you slumbered</strong> ({formatDuration(offline.awaySeconds)}{offline.simulatedSeconds < offline.awaySeconds
        ? `, capped at ${formatDuration(offline.simulatedSeconds)}`
        : ''}): your army slew {formatNumber(offline.kills, view.notation)} foes and gathered
      {formatNumber(offline.bonesGained.floor(), view.notation)} Bones{offline.floorsGained > 0
        ? `, descending ${offline.floorsGained} floors`
        : ''}.
    </div>
    <button onclick={dismissOffline}>Dismiss</button>
  </div>
{/if}

{#if runtime.loadError}
  <div class="banner warn" role="alert">
    Save problem: {runtime.loadError}
    {runtime.loadSource === 'backup' ? 'Restored from backup.' : runtime.loadSource === 'new' ? 'Started a new game.' : ''}
  </div>
{/if}

<main class="layout">
  <section class="panel army">
    <h2>Army</h2>
    <div class="stat-line">Army DPS: <strong>{view.dps}</strong></div>
    <div class="buy-toggle" role="group" aria-label="Buy amount">
      {#each BUY_AMOUNTS as amount}
        <button class:active={view.buyAmount === amount} onclick={() => setBuyAmount(amount)}>
          {amount === 'max' ? 'Max' : `x${amount}`}
        </button>
      {/each}
    </div>
    <ul class="minions">
      {#each view.minions as m (m.id)}
        <li>
          <button class="minion" disabled={!m.affordable} onclick={() => onBuy(m.id)} data-testid={`buy-${m.id}`}>
            <span class="minion-head">
              <span class="minion-name">{m.name}</span>
              <span class="minion-owned">{m.owned}</span>
            </span>
            <span class="minion-desc">{m.description}</span>
            <span class="minion-foot">
              <span>Buy {m.buyCount}: {m.cost} Bones</span>
              <span>{m.dpsEach} DPS each · {m.dpsTotal} total</span>
            </span>
          </button>
        </li>
      {/each}
    </ul>
  </section>

  <section class="panel descent">
    <h2>The Descent</h2>
    <div class="floor">
      Floor <strong data-testid="floor">{view.floor}</strong>
      <span class="muted">(deepest {view.maxFloor})</span>
    </div>
    <div class="kills">Foes slain on this floor: {view.killsOnFloor} / {view.killsPerFloor}</div>
    <button class="enemy" onclick={onSiphon} data-testid="siphon" aria-label="Siphon the enemy">
      <span class="enemy-sprite" aria-hidden="true">☠</span>
      <span class="enemy-name">Crypt Rat</span>
    </button>
    <div class="hpbar" aria-label="Enemy health">
      <div class="hpfill" style:width={`${view.hpPercent}%`}></div>
      <span class="hptext">{view.enemyHp} / {view.enemyMaxHp}</span>
    </div>
    <p class="muted">Click the enemy to Siphon: {view.clickDamage} damage per click.</p>
  </section>

  <section class="panel debug">
    <h2>Debug</h2>
    <dl>
      <dt>Play time</dt><dd>{view.playTime}</dd>
      <dt>Lifetime Bones</dt><dd>{view.lifetimeBones}</dd>
      <dt>Kills</dt><dd>{view.totalKills}</dd>
      <dt>Clicks</dt><dd>{view.totalClicks}</dd>
      <dt>Save version</dt><dd>v{view.saveVersion}</dd>
      <dt>RNG state</dt><dd>{view.rngState}</dd>
      <dt>Last saved</dt><dd>{view.lastSavedAt ? new Date(view.lastSavedAt).toLocaleTimeString() : 'never'}</dd>
    </dl>

    <h3>Number format</h3>
    <div class="buy-toggle" role="group" aria-label="Number format">
      {#each NOTATIONS as n}
        <button class:active={view.notation === n} onclick={() => setNotation(n)}>{n}</button>
      {/each}
    </div>

    <SavePanel {runtime} />
  </section>
</main>
