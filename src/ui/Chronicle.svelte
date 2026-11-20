<script lang="ts">
  import type { LogEntry } from '../engine/state';
  import Icon from './Icon.svelte';

  let { log }: { log: readonly LogEntry[] } = $props();
</script>

<section class="panel chronicle">
  <h2 class="panel-title"><Icon name="evil-book" size={22} /> Chronicle</h2>
  {#if log.length === 0}
    <p class="muted">Nothing has happened yet. Something will.</p>
  {:else}
    <ol>
      {#each log as entry, i (entry.at + ':' + i)}
        <li class="log-{entry.kind}">{entry.text}</li>
      {/each}
    </ol>
  {/if}
</section>
