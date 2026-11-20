<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import { ascend } from '../systems/prestige';
  import { buyLichPower } from '../systems/lichdom';
  import { refresh } from './frame.svelte';
  import { toast } from './feedback.svelte';
  import Icon from './Icon.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();
  const l = $derived(view.lichdom);
  let confirming = $state(false);

  function onAscend() {
    const gained = ascend(runtime.state);
    confirming = false;
    if (gained > 0) {
      runtime.save();
      toast(`You rise as a Lich with ${gained} Dread.`, 6000);
    }
    refresh();
  }
  function onBuy(id: string, name: string) {
    if (buyLichPower(runtime.state, id)) toast(`Lich power gained: ${name}.`);
    refresh();
  }
</script>

<div class="lichdom">
  <div class="lore-summary">
    <span class="dread-icon"><Icon name="crowned-skull" size={40} /></span>
    <span>
      <span class="lore-count"><strong>{l.dread}</strong> Dread to spend</span>
      <span class="muted small">
        {l.dreadEarned} earned in all · +{l.dreadPercent}% army damage and Bones · {l.ascensions} ascension{l.ascensions === 1 ? '' : 's'}
      </span>
    </span>
  </div>

  {#if l.isLich}
    <div class="school">
      <span class="school-icon"><Icon name="dread-skull" size={28} /></span>
      <span class="school-body">
        <span class="school-name">Dark Level {l.darkLevel} · +{l.darkBonusPercent}% army damage</span>
        <span class="req">
          {l.darkXp} / {l.darkNeeded} dark experience (new floors each run)
          <span class="req-bar"><span style:width={`${l.darkPercent}%`}></span></span>
        </span>
      </span>
    </div>
  {/if}

  <div class="rebirth-box" class:ready={l.canAscend}>
    {#if l.canAscend}
      <p>Ascend now for <strong>{l.pending} Dread</strong> ({l.shardsEarned} Soul Shards earned). The next Dread comes at {l.nextDreadAt} Shards.</p>
    {:else if l.deepest < l.minFloor}
      <p>Defeat the Weeping Heart (reach floor <strong>{l.minFloor}</strong>) to become a Lich. Deepest so far: {l.deepest}.</p>
    {:else}
      <p>Earn more Soul Shards to Ascend: the first Dread comes at {l.nextDreadAt} Shards ({l.shardsEarned} so far).</p>
    {/if}
    {#if !confirming}
      <button class="rebirth-btn" disabled={!l.canAscend} onclick={() => (confirming = true)} data-testid="ascend">
        <Icon name="crowned-skull" size={16} /> Ascend to Lichdom
      </button>
    {:else}
      <div class="confirm">
        <p><strong>You lose:</strong> everything a Rebirth takes, plus every Soul Shard and the whole Dark Pact.</p>
        <p><strong>You keep:</strong> relics, gems, school levels, research, feats, Rift mastery, Dread and Lich powers.</p>
        <div class="confirm-actions">
          <button class="rebirth-btn" onclick={onAscend} data-testid="confirm-ascend">Die the second death (+{l.pending})</button>
          <button onclick={() => (confirming = false)}>Not yet</button>
        </div>
      </div>
    {/if}
  </div>

  <h3>Lich Powers</h3>
  <div class="pact-tier">
    {#each l.powers as p (p.id)}
      <button
        class="pact-node lich-node"
        class:owned={p.owned}
        class:affordable={p.affordable}
        class:locked={p.locked}
        disabled={!p.affordable}
        onclick={() => onBuy(p.id, p.name)}
        data-testid={`lich-${p.id}`}
      >
        <span class="pact-icon"><Icon name={p.icon} size={24} /></span>
        <span class="pact-name">{p.name}</span>
        <span class="pact-desc">{p.description}</span>
        <span class="pact-cost">
          {#if p.owned}Bound{:else if p.locked}<Icon name="padlock" size={11} /> {p.requiresNames.join(', ')}{:else}{p.cost} Dread{/if}
        </span>
      </button>
    {/each}
  </div>
</div>
