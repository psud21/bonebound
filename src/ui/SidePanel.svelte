<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import type { IconName } from './icons.generated';
  import Icon from './Icon.svelte';
  import CryptPanel from './CryptPanel.svelte';
  import RelicsPanel from './RelicsPanel.svelte';
  import GrimoirePanel from './GrimoirePanel.svelte';
  import PhylacteryPanel from './PhylacteryPanel.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();

  type TabId = 'crypt' | 'relics' | 'grimoire' | 'phylactery';
  let active = $state<TabId>('crypt');

  const tabs = $derived(
    [
      { id: 'crypt' as const, label: 'Crypt', icon: 'graveyard' as IconName, visible: true, badge: 0 },
      {
        id: 'relics' as const,
        label: 'Relics',
        icon: 'knapsack' as IconName,
        visible: view.relics.visible,
        badge: view.relics.unseen,
      },
      {
        id: 'grimoire' as const,
        label: 'Grimoire',
        icon: 'spell-book' as IconName,
        visible: view.grimoire.visible,
        badge: 0,
      },
      {
        id: 'phylactery' as const,
        label: 'Phylactery',
        icon: 'soul-vessel' as IconName,
        visible: view.phylactery.visible,
        badge: view.phylactery.canRebirth || view.phylactery.affordableNodes > 0 ? 1 : 0,
      },
    ].filter((t) => t.visible),
  );

  const current = $derived(tabs.some((t) => t.id === active) ? active : 'crypt');
</script>

<section class="panel side">
  <div class="tabs" role="tablist">
    {#each tabs as t (t.id)}
      <button
        role="tab"
        class="tab"
        class:active={current === t.id}
        aria-selected={current === t.id}
        onclick={() => (active = t.id)}
        data-testid={`tab-${t.id}`}
      >
        <Icon name={t.icon} size={18} />
        <span>{t.label}</span>
        {#if t.badge > 0 && current !== t.id}<span class="tab-badge">{t.id === 'relics' ? t.badge : '!'}</span>{/if}
      </button>
    {/each}
  </div>

  <div class="tab-body" role="tabpanel">
    {#if current === 'crypt'}
      <CryptPanel {runtime} {view} />
    {:else if current === 'relics'}
      <RelicsPanel {runtime} {view} />
    {:else if current === 'grimoire'}
      <GrimoirePanel {runtime} {view} />
    {:else}
      <PhylacteryPanel {runtime} {view} />
    {/if}
  </div>
</section>
