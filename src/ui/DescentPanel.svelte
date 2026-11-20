<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import { formatNumber } from '../engine/format';
  import { challengeBoss } from '../systems/descent';
  import { siphon } from '../systems/siphon';
  import { refresh } from './frame.svelte';
  import { feedback, floatText } from './feedback.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();

  function onSiphon() {
    const result = siphon(runtime.state);
    floatText(`-${formatNumber(result.damage, view.notation)}`);
    refresh();
  }

  function onChallenge() {
    challengeBoss(runtime.state);
    refresh();
  }
</script>

<section class="panel descent" class:boss={view.isBoss}>
  <h2>The Descent</h2>
  <div class="layer">{view.layerName}</div>
  <div class="floor">
    Floor <strong data-testid="floor">{view.floor}</strong>
    <span class="muted">(deepest {view.maxFloor})</span>
  </div>

  {#if view.isBoss}
    <div class="boss-timer" aria-label="Boss timer">
      <div class="boss-timer-fill" style:width={`${view.bossTimerPercent}%`}></div>
      <span class="boss-timer-text">{view.bossTimeLeft.toFixed(1)}s</span>
    </div>
  {:else}
    <div class="kills">Foes slain: {view.killsOnFloor} / {view.killsPerFloor}</div>
  {/if}

  <div class="enemy-wrap">
    <button class="enemy" class:enemy-boss={view.isBoss} onclick={onSiphon} data-testid="siphon" aria-label="Siphon {view.enemyName}">
      <span class="enemy-sprite" aria-hidden="true">{view.isBoss ? '👹' : '☠'}</span>
      <span class="enemy-name">{view.enemyName}</span>
    </button>
    {#each feedback.floats as f (f.id)}
      <span class="float" style:--dx={`${f.dx}px`} aria-hidden="true">{f.text}</span>
    {/each}
  </div>

  <div class="hpbar" aria-label="Enemy health">
    <div class="hpfill" style:width={`${view.hpPercent}%`}></div>
    <span class="hptext">{view.enemyHp} / {view.enemyMaxHp}</span>
  </div>

  {#if view.canChallenge}
    <p class="farm-note">Your army is farming this floor.</p>
    <button class="challenge" onclick={onChallenge} data-testid="challenge">Challenge the guardian</button>
  {:else}
    <p class="muted">Click the enemy to Siphon: {view.clickDamage} damage per click.</p>
  {/if}
</section>
