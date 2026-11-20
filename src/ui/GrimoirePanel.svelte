<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import type { SchoolId, SpellId } from '../content/spells';
  import { castSpell } from '../systems/magic';
  import { refresh } from './frame.svelte';
  import Icon from './Icon.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();
  const g = $derived(view.grimoire);

  let picked = $state<SchoolId>('bone');
  const school = $derived(g.schools.find((s) => s.id === picked) ?? g.schools[0]!);

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

  <div class="school-tabs" role="tablist" aria-label="Schools">
    {#each g.schools as s (s.id)}
      <button
        role="tab"
        class="school-tab school-{s.id}"
        class:active={school.id === s.id}
        class:sealed={!s.unlocked}
        aria-selected={school.id === s.id}
        onclick={() => (picked = s.id)}
        title={s.unlocked ? `${s.name}, level ${s.level}` : `${s.name}: ${s.unlockHint}`}
        data-testid={`school-${s.id}`}
      >
        <Icon name={s.unlocked ? s.icon : 'padlock'} size={18} />
        <span>{s.unlocked ? s.level : ''}</span>
      </button>
    {/each}
  </div>

  <div class="school school-{school.id}" class:spell-locked={!school.unlocked}>
    <span class="school-icon"><Icon name={school.icon} size={30} /></span>
    <span class="school-body">
      <span class="school-name">{school.name}{school.unlocked ? ` · Level ${school.level}` : ''}</span>
      <span class="school-desc">{school.description}</span>
      {#if school.unlocked}
        <span class="req">
          {school.xp} / {school.needed} experience (casting this school’s spells)
          <span class="req-bar"><span style:width={`${school.percent}%`}></span></span>
        </span>
      {:else}
        <span class="req"><Icon name="padlock" size={11} /> {school.unlockHint}</span>
      {/if}
    </span>
  </div>

  <ul class="spells">
    {#each school.spells as s (s.id)}
      <li class="spell" class:spell-locked={!s.known}>
        <span class="spell-icon"><Icon name={s.icon} size={28} /></span>
        <span class="spell-body">
          <span class="spell-name">{s.known || !school.unlocked ? s.name : `${s.name} · learn at level ${s.unlockLevel}`}</span>
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
    <p class="muted small">Known spells also appear under the enemy for quick casting.</p>
  {/if}
</div>
