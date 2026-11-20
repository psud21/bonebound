<script lang="ts">
  import type { GameView } from './viewModel';
  import Icon from './Icon.svelte';

  let { view }: { view: GameView } = $props();
</script>

<section class="panel path">
  <h2 class="panel-title"><Icon name="scroll-unfurled" size={22} /> The Path Ahead</h2>
  {#if view.goals.length > 0}
    <ul class="goals">
      {#each view.goals as g (g.id)}
        <li>
          <span class="goal-name">{g.goal}</span>
          <span class="goal-req">{g.requirement}</span>
          <span class="req-bar"><span style:width={`${g.ratio * 100}%`}></span></span>
        </li>
      {/each}
    </ul>
  {/if}

  <h3>Sealed</h3>
  <ul class="sealed">
    {#each view.sealed as s (s.name)}
      <li title="Coming in a future update">
        <span class="sealed-icon"><Icon name={s.icon} size={22} /></span>
        <span>
          <span class="sealed-name">{s.name}</span>
          <span class="sealed-hint">{s.hint}</span>
        </span>
      </li>
    {/each}
  </ul>
  <p class="muted small">Sealed features arrive in future updates.</p>
</section>
