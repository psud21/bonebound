<script lang="ts">
  import type { GameRuntime } from './game';
  import { formatDuration, formatNumber } from './engine/format';
  import { buildView } from './ui/viewModel';
  import { frame, refresh } from './ui/frame.svelte';
  import { feedback } from './ui/feedback.svelte';
  import Icon from './ui/Icon.svelte';
  import ArmyPanel from './ui/ArmyPanel.svelte';
  import DescentPanel from './ui/DescentPanel.svelte';
  import CryptPanel from './ui/CryptPanel.svelte';
  import PathAhead from './ui/PathAhead.svelte';
  import Chronicle from './ui/Chronicle.svelte';
  import DebugPanel from './ui/DebugPanel.svelte';
  import SoulOverlay from './ui/SoulOverlay.svelte';

  let { runtime }: { runtime: GameRuntime } = $props();

  const view = $derived.by(() => {
    void frame.n;
    return buildView(runtime.state);
  });
  const offline = $derived.by(() => {
    void frame.n;
    return runtime.offlineSummary;
  });

  /** Deeper floors darken and redden the backdrop (0 at floor 1, 1 at floor 100). */
  const depth = $derived(Math.min(1, (view.floor - 1) / 99));

  function dismissOffline() {
    runtime.offlineSummary = null;
    refresh();
  }
</script>

<div class="backdrop" style:--depth={depth} aria-hidden="true"></div>

<header class="topbar">
  <h1 class="brand">
    <Icon name="crowned-skull" size={30} class="brand-icon" />
    <span>Bonebound</span>
    <span class="subtitle">The Descent</span>
  </h1>
  <div class="buffs" aria-live="polite">
    {#each view.buffs as b (b.id)}
      <span class="buff buff-{b.id}" title={b.description}>
        <Icon name={b.icon} size={16} />
        {b.name} · {b.timeLeft}s
      </span>
    {/each}
  </div>
  <div class="resource" title="Bones">
    <Icon name="crossed-bones" size={28} class="resource-icon" />
    <span class="value" data-testid="bones">{view.bones}</span>
    <span class="rate">+{view.income}/s</span>
  </div>
</header>

{#if offline}
  <div class="banner" role="status">
    <div>
      <strong>While you slumbered</strong> ({formatDuration(offline.awaySeconds)}{offline.simulatedSeconds < offline.awaySeconds
        ? `, capped at ${formatDuration(offline.simulatedSeconds)}`
        : ''}): your army slew {formatNumber(offline.kills, view.notation)} foes, and you gathered
      {formatNumber(offline.bonesGained.floor(), view.notation)} Bones.
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
  <ArmyPanel {runtime} {view} />
  <div class="column center-col">
    <DescentPanel {runtime} {view} />
    <Chronicle log={view.log} />
  </div>
  <div class="column">
    <CryptPanel {runtime} {view} />
    <PathAhead {view} />
  </div>
</main>

<DebugPanel {runtime} {view} />

<SoulOverlay {runtime} soul={view.soul} />

<div class="toasts" aria-live="polite">
  {#each feedback.toasts as t (t.id)}
    <div class="toast">{t.text}</div>
  {/each}
</div>
