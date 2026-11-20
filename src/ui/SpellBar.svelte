<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import type { SpellId } from '../content/spells';
  import { castSpell } from '../systems/magic';
  import { refresh } from './frame.svelte';
  import Icon from './Icon.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();
  const g = $derived(view.grimoire);

  function onCast(id: SpellId) {
    castSpell(runtime.state, id);
    refresh();
  }
</script>

{#if g.visible}
  <div class="spellbar">
    <div class="essence-bar compact" title="Essence">
      <div class="essence-fill" style:width={`${g.essencePercent}%`}></div>
      <span><Icon name="magic-swirl" size={12} /> {g.essence}/{g.essenceMax}</span>
    </div>
    <div class="spellbar-buttons">
      {#each g.spells.filter((s) => s.known) as s (s.id)}
        <button
          class="spell-btn school-{s.school}"
          disabled={!s.ready}
          onclick={() => onCast(s.id)}
          title={`${s.name}: ${s.description} (${s.cost} Essence)`}
          aria-label={`Cast ${s.name}`}
        >
          <Icon name={s.icon} size={26} />
          {#if s.cooldownLeft > 0}
            <span class="spell-cd" style:height={`${s.cooldownPercent}%`}></span>
            <span class="spell-cd-text">{Math.ceil(s.cooldownLeft)}</span>
          {/if}
          <span class="spell-cost">{s.cost}</span>
        </button>
      {/each}
      {#if g.autoCast}<span class="muted small">Auto</span>{/if}
    </div>
  </div>
{/if}
