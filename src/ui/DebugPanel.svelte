<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { Notation } from '../engine/format';
  import type { GameView } from './viewModel';
  import { D } from '../engine/bignum';
  import { spawnSoul } from '../systems/events';
  import { enterFloor } from '../systems/descent';
  import { refresh } from './frame.svelte';
  import SavePanel from './SavePanel.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();

  const NOTATIONS: Notation[] = ['short', 'scientific', 'engineering'];
  const isDev = import.meta.env.DEV;

  const version = __APP_VERSION__;
  const s = $derived(view.settings);

  function setSetting<K extends 'sound' | 'hints' | 'reduceMotion'>(key: K, value: boolean) {
    runtime.state.settings[key] = value;
    refresh();
  }
  function setVolume(e: Event) {
    runtime.state.settings.volume = Number((e.currentTarget as HTMLInputElement).value) / 100;
    refresh();
  }
  function resetHints() {
    runtime.state.tutorial.seen = [];
    runtime.state.settings.hints = true;
    refresh();
  }

  function setNotation(n: Notation) {
    runtime.state.settings.notation = n;
    refresh();
  }

  function cheatBones() {
    runtime.state.resources.bones = runtime.state.resources.bones.add(D(1e6)).mul(10);
    refresh();
  }

  /** Skips 50 floors ahead (testing deeper layers). */
  function cheatDive() {
    const s = runtime.state;
    s.descent.maxFloor = s.descent.floor + 50;
    enterFloor(s, s.descent.floor + 50);
    refresh();
  }

  function cheatCorpsesLore() {
    runtime.state.resources.corpses += 500;
    runtime.state.unlocks.library = true;
    runtime.state.library.lore += 200;
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
        <dt>Game version</dt><dd>{version}</dd>
        <dt>Save version</dt><dd>v{view.stats.saveVersion}</dd>
        <dt>Last saved</dt><dd>{view.stats.lastSavedAt ? new Date(view.stats.lastSavedAt).toLocaleTimeString() : 'never'}</dd>
      </dl>
    </div>
    <div>
      <h3>Sound and display</h3>
      <label class="auto-toggle"><input type="checkbox" checked={s.sound} onchange={(e) => setSetting('sound', e.currentTarget.checked)} /> Sound effects</label>
      <label class="auto-toggle volume">
        Volume
        <input type="range" min="0" max="100" value={Math.round(s.volume * 100)} oninput={setVolume} disabled={!s.sound} aria-label="Volume" />
      </label>
      <label class="auto-toggle"><input type="checkbox" checked={s.hints} onchange={(e) => setSetting('hints', e.currentTarget.checked)} /> Tutorial hints</label>
      <button class="small-btn" onclick={resetHints}>Show all hints again</button>
      <label class="auto-toggle"><input type="checkbox" checked={s.reduceMotion} onchange={(e) => setSetting('reduceMotion', e.currentTarget.checked)} /> Reduce motion</label>
      <p class="muted small">Keys: Space to Siphon, 1–9 to cast, Esc to dismiss a hint.</p>
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
          <button onclick={cheatDive}>+50 floors</button>
          <button onclick={cheatCorpsesLore}>+Corpses &amp; Lore</button>
        </div>
        <p class="muted">Next soul in {view.stats.soulCooldown}s · RNG {view.stats.rngState}</p>
      {/if}
    </div>
    <div>
      <SavePanel {runtime} />
    </div>
  </div>
</details>
