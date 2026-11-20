<script lang="ts">
  import type { GameRuntime } from '../game';
  import { dismissHint, type HintDef } from '../systems/tutorial';
  import { refresh } from './frame.svelte';
  import Icon from './Icon.svelte';

  let { runtime, hint }: { runtime: GameRuntime; hint: HintDef | null } = $props();

  function onDismiss() {
    if (hint) dismissHint(runtime.state, hint.id);
    refresh();
  }
  function onHintsOff() {
    runtime.state.settings.hints = false;
    refresh();
  }
</script>

{#if hint}
  <aside class="hint" role="status" aria-live="polite" data-testid="hint">
    <span class="hint-icon"><Icon name="candle-skull" size={24} /></span>
    <span class="hint-body">
      <strong class="hint-title">{hint.title}</strong>
      <span>{hint.text}</span>
    </span>
    <span class="hint-actions">
      <button class="small-btn" onclick={onDismiss}>Got it</button>
      <button class="link-btn" onclick={onHintsOff}>Hide all hints</button>
    </span>
  </aside>
{/if}
