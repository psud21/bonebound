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
  function toggleAuto() {
    runtime.state.magic.autoCast = !runtime.state.magic.autoCast;
    refresh();
  }
</script>

<div class="grimoire">
  <div class="essence-row">
    <Icon name="magic-swirl" size={20} />
    <div class="essence-bar">
      <div class="essence-fill" style:width={`${g.essencePercent}%`}></div>
      <span>{g.essence} / {g.essenceMax} Essence · +{g.regen}/s</span>
    </div>
  </div>

  <div class="school">
    <span class="school-icon"><Icon name={g.school.icon} size={30} /></span>
    <span class="school-body">
      <span class="school-name">{g.school.name} · Level {g.school.level}</span>
      <span class="school-desc">{g.school.description}</span>
      <span class="req">
        {g.school.xp} / {g.school.needed} experience (casting spells of this school)
        <span class="req-bar"><span style:width={`${g.school.percent}%`}></span></span>
      </span>
    </span>
  </div>

  <ul class="spells">
    {#each g.spells as s (s.id)}
      <li class="spell" class:spell-locked={!s.known}>
        <span class="spell-icon"><Icon name={s.icon} size={28} /></span>
        <span class="spell-body">
          <span class="spell-name">{s.known ? s.name : `${s.name} · learn at level ${s.unlockLevel}`}</span>
          <span class="spell-desc">{s.description}</span>
          <span class="spell-meta">{s.cost} Essence · {s.cooldown}s cooldown{s.known ? ` · power ${s.power}%` : ''}</span>
        </span>
        {#if s.known}
          <button class="cast" disabled={!s.ready} onclick={() => onCast(s.id)} data-testid={`cast-${s.id}`}>
            {s.cooldownLeft > 0 ? `${Math.ceil(s.cooldownLeft)}s` : 'Cast'}
          </button>
        {/if}
      </li>
    {/each}
  </ul>

  {#if g.autoCastOwned}
    <label class="auto-toggle">
      <input type="checkbox" checked={g.autoCast} onchange={toggleAuto} /> Auto-cast spells when ready
    </label>
  {:else}
    <p class="muted small">Spells also appear under the enemy for quick casting.</p>
  {/if}
</div>
