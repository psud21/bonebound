<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import { cancelResearch, startResearch } from '../systems/library';
  import { RESEARCH_BY_ID } from '../content/research';
  import { refresh } from './frame.svelte';
  import { toast } from './feedback.svelte';
  import Icon from './Icon.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();
  const lib = $derived(view.library);

  function onStart(id: string) {
    if (startResearch(runtime.state, id)) toast(`Research begun: ${RESEARCH_BY_ID[id]?.name}.`);
    refresh();
  }
  function onCancel(id: string) {
    cancelResearch(runtime.state, id);
    refresh();
  }
</script>

<div class="library">
  <div class="lore-summary">
    <span class="lore-icon"><Icon name="open-book" size={36} /></span>
    <span>
      <span class="lore-count"><strong>{lib.lore}</strong> Lore</span>
      <span class="muted small">
        Desks in use: {lib.busy} / {lib.slots} · {lib.completed} of {lib.total} studied
      </span>
      <span class="muted small">Guardians leave Lore the first time they fall each run. Tomes turn up among ordinary kills.</span>
    </span>
  </div>

  {#each lib.branches as b (b.id)}
    <h3 class="branch-head"><Icon name={b.icon} size={16} /> {b.name}</h3>
    <ul class="research">
      {#each b.projects as r (r.id)}
        <li class="project" class:done={r.done} class:active={r.active} class:locked={r.locked}>
          <span class="project-body">
            <span class="project-name">
              {#if r.done}<Icon name="laurels-trophy" size={13} />{:else if r.locked}<Icon name="padlock" size={12} />{/if}
              {r.name}
            </span>
            <span class="project-desc">{r.description}</span>
            {#if r.active}
              <span class="req">
                {r.remaining} left
                <span class="req-bar"><span style:width={`${r.percent}%`}></span></span>
              </span>
            {:else if r.locked}
              <span class="project-meta">Requires {r.requires.join(', ')}</span>
            {:else if !r.done}
              <span class="project-meta"><Icon name="open-book" size={11} /> {r.cost} Lore · <Icon name="hourglass" size={11} /> {r.duration}</span>
            {/if}
          </span>
          {#if r.active}
            <button class="small-btn" onclick={() => onCancel(r.id)} title="Stop and get the Lore back (progress is lost)">Stop</button>
          {:else if !r.done && !r.locked}
            <button class="small-btn study" disabled={!r.canStart} onclick={() => onStart(r.id)} data-testid={`research-${r.id}`}>Study</button>
          {/if}
        </li>
      {/each}
    </ul>
  {/each}
</div>
