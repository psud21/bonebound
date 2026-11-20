<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { Notation } from '../engine/format';
  import type { GameView } from './viewModel';
  import { D } from '../engine/bignum';
  import { spawnSoul } from '../systems/events';
  import { refresh } from './frame.svelte';
  import SavePanel from './SavePanel.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();

  const NOTATIONS: Notation[] = ['short', 'scientific', 'engineering'];
  const isDev = import.meta.env.DEV;

  function setNotation(n: Notation) {
    runtime.state.settings.notation = n;
    refresh();
  }

  function cheatBones() {
    runtime.state.resources.bones = runtime.state.resources.bones.add(D(1e6)).mul(10);
    refresh();
  }

  function cheatSoul() {
    runtime.state.unlocks.souls = true;
    spawnSoul(runtime.state);
    refresh();
  }
</script>

<details class="panel debug">
  <summary>Settings, saves &amp; stats</summary>
  <div class="debug-grid">
    <div>
      <h3>Stats</h3>
      <dl>
        <dt>Play time</dt><dd>{view.stats.playTime}</dd>
        <dt>Lifetime Bones</dt><dd>{view.stats.lifetimeBones}</dd>
        <dt>Kills</dt><dd>{view.stats.totalKills}</dd>
        <dt>Clicks</dt><dd>{view.stats.totalClicks}</dd>
        <dt>Bosses defeated</dt><dd>{view.stats.bossesDefeated}</dd>
        <dt>Bosses failed</dt><dd>{view.stats.bossesFailed}</dd>
        <dt>Souls caught</dt><dd>{view.stats.soulsCaught}</dd>
        <dt>Save version</dt><dd>v{view.stats.saveVersion}</dd>
        <dt>Last saved</dt><dd>{view.stats.lastSavedAt ? new Date(view.stats.lastSavedAt).toLocaleTimeString() : 'never'}</dd>
      </dl>
    </div>
    <div>
      <h3>Number format</h3>
      <div class="toggle" role="group" aria-label="Number format">
        {#each NOTATIONS as n}
          <button class:active={view.notation === n} onclick={() => setNotation(n)}>{n}</button>
        {/each}
      </div>
      {#if isDev}
        <h3>Dev cheats</h3>
        <div class="toggle">
          <button onclick={cheatBones}>+Bones ×10</button>
          <button onclick={cheatSoul} data-testid="spawn-soul">Spawn soul</button>
        </div>
        <p class="muted">Next soul in {view.stats.soulCooldown}s · RNG {view.stats.rngState}</p>
      {/if}
    </div>
    <div>
      <SavePanel {runtime} />
    </div>
  </div>
</details>
