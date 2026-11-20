<script lang="ts">
  import type { GameView } from './viewModel';
  import Icon from './Icon.svelte';

  let { view }: { view: GameView } = $props();
  const f = $derived(view.feats);
</script>

<div class="feats">
  <div class="lore-summary">
    <span class="feat-icon"><Icon name="trophy" size={36} /></span>
    <span>
      <span class="lore-count"><strong>{f.earned}</strong> of {f.total} feats</span>
      <span class="muted small">Each feat adds 1% army damage, forever: +{f.bonusPercent}% so far.</span>
    </span>
  </div>

  <ul class="feat-grid">
    {#each f.list as a (a.id)}
      <li class="feat" class:earned={a.earned} title={a.description}>
        <span class="feat-badge"><Icon name={a.earned ? a.icon : 'padlock'} size={22} /></span>
        <span class="feat-body">
          <span class="feat-name">{a.earned ? a.name : '???'}</span>
          <span class="feat-desc">{a.description}</span>
        </span>
      </li>
    {/each}
  </ul>

  <h3>Records</h3>
  <dl class="records">
    {#each f.stats as s (s.label)}
      <div><dt>{s.label}</dt><dd>{s.value}</dd></div>
    {/each}
  </dl>
</div>
