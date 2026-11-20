<script lang="ts">
  import { scale } from 'svelte/transition';
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import { formatNumber } from '../engine/format';
  import { challengeBoss } from '../systems/descent';
  import { siphon } from '../systems/siphon';
  import { refresh } from './frame.svelte';
  import { feedback, floatText } from './feedback.svelte';
  import Icon from './Icon.svelte';
  import DepthTrack from './DepthTrack.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();

  let hit = $state(false);
  let hitTimer: ReturnType<typeof setTimeout> | undefined;

  function onSiphon() {
    const result = siphon(runtime.state);
    floatText(`-${formatNumber(result.damage, view.notation)}`, result.kills > 0);
    hit = false;
    // Restart the hit animation on every click.
    requestAnimationFrame(() => {
      hit = true;
      clearTimeout(hitTimer);
      hitTimer = setTimeout(() => (hit = false), 160);
    });
    refresh();
  }

  function onChallenge() {
    challengeBoss(runtime.state);
    refresh();
  }
</script>

<section class="panel descent" class:boss={view.isBoss}>
  <h2 class="panel-title"><Icon name="stairs" size={22} /> The Descent</h2>
  <div class="layer"><Icon name="crypt-entrance" size={14} /> {view.layerName}</div>
  <div class="floor">
    Floor <strong data-testid="floor">{view.floor}</strong>
    <span class="muted">· deepest {view.maxFloor}</span>
  </div>

  <DepthTrack depth={view.depth} floor={view.floor} />

  {#if view.isBoss}
    <div class="boss-timer" aria-label="Guardian timer">
      <div class="boss-timer-fill" style:width={`${view.bossTimerPercent}%`}></div>
      <span class="boss-timer-text"><Icon name="sands-of-time" size={13} /> {view.bossTimeLeft.toFixed(1)}s</span>
    </div>
  {:else}
    <div class="kills" aria-label="Foes slain on this floor">
      {#each Array(view.killsPerFloor) as _, i}
        <span class="pip" class:pip-done={i < view.killsOnFloor}></span>
      {/each}
    </div>
  {/if}

  <div class="enemy-wrap">
    <button
      class="enemy"
      class:enemy-boss={view.isBoss}
      class:hit
      onclick={onSiphon}
      data-testid="siphon"
      aria-label="Siphon {view.enemyName}"
    >
      {#key view.enemyKey}
        <span class="enemy-sprite" in:scale={{ start: 0.7, opacity: 1, duration: 140 }}>
          <Icon name={view.enemyIcon} size={view.isBoss ? 120 : 100} />
        </span>
      {/key}
    </button>
    {#each feedback.floats as f (f.id)}
      <span class="float" class:float-crit={f.crit} style:--dx={`${f.dx}px`} aria-hidden="true">{f.text}</span>
    {/each}
  </div>
  <div class="enemy-name" class:boss-name={view.isBoss}>{view.enemyName}</div>

  <div class="hpbar" aria-label="Enemy health">
    <div class="hpfill" style:width={`${view.hpPercent}%`}></div>
    <span class="hptext">{view.enemyHp} / {view.enemyMaxHp}</span>
  </div>

  {#if view.canChallenge}
    <p class="farm-note">Your army is farming this floor.</p>
    <button class="challenge" onclick={onChallenge} data-testid="challenge">Challenge {view.depth.nextGuardian.name}</button>
  {:else}
    <p class="muted hint"><Icon name="skeletal-hand" size={14} /> Click to Siphon · {view.clickDamage} damage</p>
  {/if}
</section>
