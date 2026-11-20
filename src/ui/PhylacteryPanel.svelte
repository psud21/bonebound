<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import { buyPact, rebirth } from '../systems/prestige';
  import { chooseCoven } from '../systems/covens';
  import { refresh } from './frame.svelte';
  import { toast } from './feedback.svelte';
  import Icon from './Icon.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();
  const p = $derived(view.phylactery);
  const c = $derived(view.covens);

  let confirming = $state(false);

  function onRebirth() {
    const gained = rebirth(runtime.state);
    confirming = false;
    if (gained > 0) {
      runtime.save();
      toast(`Reborn with ${gained} new Soul Shards.`, 6000);
    }
    refresh();
  }

  function onCoven(id: string, name: string) {
    if (chooseCoven(runtime.state, id)) toast(`You swear yourself to ${name}.`);
    refresh();
  }

  function onBuy(id: string, name: string) {
    if (buyPact(runtime.state, id)) toast(`Pact sealed: ${name}.`);
    refresh();
  }
</script>

<div class="phylactery">
  <div class="shard-summary">
    <span class="shard-icon"><Icon name="soul-vessel" size={40} /></span>
    <span>
      <span class="shard-count"><strong>{p.shards}</strong> Soul Shards to spend</span>
      <span class="muted small">{p.shardsEarned} earned in all · +{p.bonusPercent}% army damage · {p.rebirths} rebirths</span>
    </span>
  </div>

  <div class="rebirth-box" class:ready={p.canRebirth}>
    {#if p.canRebirth}
      <p>
        Rebirth now for <strong>{p.gain} Soul Shards</strong> (deepest floor this run: {p.maxFloor}).
        Reach floor {p.nextFloor} for {p.nextGain}.
      </p>
    {:else}
      <p>Reach floor <strong>{p.minFloor}</strong> to perform the Rebirth. Deepest this run: {p.maxFloor}.</p>
    {/if}

    {#if !confirming}
      <button class="rebirth-btn" disabled={!p.canRebirth} onclick={() => (confirming = true)} data-testid="rebirth">
        <Icon name="gothic-cross" size={16} /> Perform the Rebirth
      </button>
    {:else}
      <div class="confirm">
        <p><strong>You lose:</strong> Bones, minions, graveworks, upgrades, floors, Essence, Corpses, Elites and your coven.</p>
        <p>
          <strong>You keep:</strong> relics and Bone Dust, school levels, Soul Shards, the Dark Pact, Lore and research, feats
          and your Chronicle.
        </p>
        <div class="confirm-actions">
          <button class="rebirth-btn" onclick={onRebirth} data-testid="confirm-rebirth">Die and rise again (+{p.gain})</button>
          <button onclick={() => (confirming = false)}>Not yet</button>
        </div>
      </div>
    {/if}
    <p class="muted small">This run: {p.runTime}. Deepest ever: floor {p.bestFloor}.</p>
  </div>

  <h3>Covens</h3>
  {#if !c.unlocked}
    <p class="muted small">
      <Icon name="padlock" size={11} /> Four covens are watching. Perform {c.rebirthsNeeded} Rebirths to swear to one ({p.rebirths} so far).
    </p>
  {:else}
    <p class="muted small">
      {#if c.swornName}Sworn to <strong>{c.swornName}</strong> until your next death.{:else}Choose one coven for this run. The choice lasts until you Rebirth.{/if}
    </p>
    <div class="covens">
      {#each c.list as cv (cv.id)}
        <button
          class="coven"
          class:chosen={cv.chosen}
          disabled={!!c.sworn}
          onclick={() => onCoven(cv.id, cv.name)}
          data-testid={`coven-${cv.id}`}
        >
          <span class="coven-head"><Icon name={cv.icon} size={24} /> <span class="coven-name">{cv.name}</span></span>
          <span class="coven-motto">{cv.motto}</span>
          {#each cv.boons as b}<span class="coven-boon">+ {b}</span>{/each}
          {#each cv.costs as b}<span class="coven-cost">− {b}</span>{/each}
        </button>
      {/each}
    </div>
  {/if}

  <h3>The Dark Pact</h3>
  <div class="pact">
    {#each p.tiers as tier, t (t)}
      <div class="pact-tier">
        {#each tier as n (n.id)}
          <button
            class="pact-node"
            class:owned={n.owned}
            class:affordable={n.affordable}
            class:locked={n.locked}
            disabled={!n.affordable}
            onclick={() => onBuy(n.id, n.name)}
            title={n.locked ? `Requires ${n.requires.join(' and ')}` : n.description}
            data-testid={`pact-${n.id}`}
          >
            <span class="pact-icon"><Icon name={n.icon} size={24} /></span>
            <span class="pact-name">{n.name}</span>
            <span class="pact-desc">{n.description}</span>
            <span class="pact-cost">
              {#if n.owned}Sealed{:else if n.locked}<Icon name="padlock" size={11} /> {n.requires.join(', ')}{:else}{n.cost} shard{n.cost === 1 ? '' : 's'}{/if}
            </span>
          </button>
        {/each}
      </div>
    {/each}
  </div>
</div>
