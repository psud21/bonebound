<script lang="ts">
  import type { GameRuntime } from './game';
  import { formatDuration, formatNumber } from './engine/format';
  import { buildView } from './ui/viewModel';
  import { frame, refresh } from './ui/frame.svelte';
  import { feedback } from './ui/feedback.svelte';
  import Icon from './ui/Icon.svelte';
  import ArmyPanel from './ui/ArmyPanel.svelte';
  import DescentPanel from './ui/DescentPanel.svelte';
  import SidePanel from './ui/SidePanel.svelte';
  import PathAhead from './ui/PathAhead.svelte';
  import Chronicle from './ui/Chronicle.svelte';
  import DebugPanel from './ui/DebugPanel.svelte';
  import SoulOverlay from './ui/SoulOverlay.svelte';
  import HintCard from './ui/HintCard.svelte';
  import { updateTutorial } from './systems/tutorial';
  import { watchForSounds } from './ui/sounds';
  import { dismissHint } from './systems/tutorial';
  import type { Rarity } from './content/loot';

  let { runtime }: { runtime: GameRuntime } = $props();

  const view = $derived.by(() => {
    void frame.n;
    return buildView(runtime.state);
  });
  const offline = $derived.by(() => {
    void frame.n;
    return runtime.offlineSummary;
  });

  const hint = $derived.by(() => {
    void frame.n;
    return updateTutorial(runtime.state);
  });

  // Sounds and the rare-loot flash follow changes in the game state.
  let flash = $state<{ rarity: Rarity; key: number } | null>(null);
  $effect(() => {
    void frame.n;
    const rarity = watchForSounds(runtime.state);
    if (rarity) {
      const key = Date.now();
      flash = { rarity, key };
      setTimeout(() => {
        if (flash?.key === key) flash = null;
      }, 1200);
    }
  });

  const calm = $derived(view.reduceMotion);
  $effect(() => {
    document.documentElement.classList.toggle('calm', calm);
  });

  /** Keyboard: Space siphons, 1–9 cast the spells under the enemy, Esc dismisses a hint. */
  function onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) document.querySelector<HTMLButtonElement>('[data-testid="siphon"]')?.click();
    } else if (/^Digit[1-9]$/.test(e.code)) {
      const buttons = document.querySelectorAll<HTMLButtonElement>('.spell-btn');
      buttons[Number(e.code.slice(5)) - 1]?.click();
    } else if (e.code === 'Escape' && hint) {
      dismissHint(runtime.state, hint.id);
      refresh();
    }
  }

  /** Deeper floors darken and redden the backdrop (0 at floor 1, 1 at floor 100). */
  const depth = $derived(Math.min(1, (view.floor - 1) / 99));

  function dismissOffline() {
    runtime.offlineSummary = null;
    refresh();
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="backdrop" data-layer={view.layerNumber} style:--depth={depth} aria-hidden="true"></div>
{#if flash}
  {#key flash.key}
    <div class="loot-flash loot-flash-{flash.rarity}" aria-hidden="true"></div>
  {/key}
{/if}

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
  {#if view.elites.visible}
    <div class="resource corpses-res" title="Corpses: dropped by kills, spent raising Elites">
      <Icon name="raise-zombie" size={22} />
      <span class="corpse-value">{view.elites.corpses}</span>
    </div>
  {/if}
  {#if view.lichdom.isLich}
    <div class="resource dread-res" title="Dread: spend on Lich powers (every Dread ever earned boosts damage and Bones)">
      <Icon name="crowned-skull" size={22} />
      <span class="dread-value">{view.lichdom.dread}</span>
      <span class="rate">DL {view.lichdom.darkLevel}</span>
    </div>
  {/if}
  {#if view.shardsEarned > 0}
    <div class="resource shards-res" title="Soul Shards to spend (every shard ever earned adds army damage)">
      <Icon name="soul-vessel" size={22} class="shard-res-icon" />
      <span class="shard-value">{view.phylactery.shards}</span>
      <span class="rate">+{view.phylactery.bonusPercent}%</span>
    </div>
  {/if}
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
    <HintCard {runtime} {hint} />
    <DescentPanel {runtime} {view} />
    <Chronicle log={view.log} />
  </div>
  <div class="column">
    <SidePanel {runtime} {view} />
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
