<script lang="ts">
  import type { GameView } from './viewModel';
  import Icon from './Icon.svelte';

  let { depth, floor }: { depth: GameView['depth']; floor: number } = $props();

  const pos = (f: number) => ((f - depth.from + 0.5) / (depth.to - depth.from + 1)) * 100;
</script>

<div class="depth">
  <div class="depth-track">
    <div class="depth-reached" style:width={`${depth.reachedPercent}%`}></div>
    {#each depth.guardians as g (g.floor)}
      <span
        class="depth-guardian"
        class:defeated={g.defeated}
        class:current={g.current}
        style:left={`${pos(g.floor)}%`}
        title={`Floor ${g.floor}: ${g.name}${g.defeated ? ' (defeated)' : ''}`}
      >
        <Icon name={g.icon} size={16} />
      </span>
    {/each}
    <span class="depth-marker" style:left={`${depth.currentPercent}%`} title={`You are on floor ${floor}`}></span>
  </div>
  <div class="depth-labels">
    <span>{depth.from}</span>
    <span class="depth-next">
      Next guardian: <strong>{depth.nextGuardian.name}</strong> · floor {depth.nextGuardian.floor}
    </span>
    <span>{depth.to}</span>
  </div>
</div>
