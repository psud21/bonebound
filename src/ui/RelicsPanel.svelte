<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import type { ItemView } from './sections';
  import type { AutoSalvage } from '../engine/state';
  import type { EquipSlot } from '../content/loot';
  import { empower, equipBest, equipItem, reforge, salvageAll, salvageItem, unequip } from '../systems/loot';
  import { combineAll, socketGem, unsocketGem } from '../systems/gems';
  import { refresh } from './frame.svelte';
  import { toast } from './feedback.svelte';
  import Icon from './Icon.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();

  let selectedId = $state<number | null>(null);
  const relics = $derived(view.relics);
  const gems = $derived(view.gems);
  const selected = $derived.by((): ItemView | null => {
    if (selectedId === null) return null;
    return (
      relics.inventory.find((i) => i.id === selectedId) ??
      relics.slots.find((s) => s.item?.id === selectedId)?.item ??
      null
    );
  });

  // Opening the tab marks new finds as seen.
  $effect(() => {
    if (relics.unseen > 0) runtime.state.loot.unseen = 0;
  });

  const SALVAGE_OPTIONS: { value: AutoSalvage; label: string }[] = [
    { value: 'none', label: 'Keep everything' },
    { value: 'common', label: 'Salvage Common' },
    { value: 'magic', label: 'Salvage Magic and below' },
    { value: 'rare', label: 'Salvage Rare and below' },
  ];

  function act(fn: () => boolean | number, message?: string) {
    const result = fn();
    if (result && message) toast(message);
    refresh();
  }

  function onEquip(id: number) {
    act(() => equipItem(runtime.state, id));
  }
  function onUnequip(slot: string) {
    act(() => unequip(runtime.state, slot as EquipSlot));
  }
  function onSalvage(id: number) {
    const dust = selected?.dust ?? 0;
    act(() => salvageItem(runtime.state, id), `Salvaged for ${dust} Bone Dust.`);
    selectedId = null;
  }
  function onSalvageCommons() {
    const n = salvageAll(runtime.state, 'magic');
    toast(n > 0 ? `Salvaged ${n} Common and Magic items.` : 'Nothing to salvage.');
    refresh();
  }
  function onEquipBest() {
    const n = equipBest(runtime.state);
    toast(n > 0 ? `Equipped ${n} better item${n === 1 ? '' : 's'}.` : 'You are already wearing your best.');
    refresh();
  }
  function onReforge(id: number) {
    act(() => reforge(runtime.state, id), 'Reforged. New stats rolled.');
  }
  function onEmpower(id: number) {
    act(() => empower(runtime.state, id), 'Empowered to your deepest floor.');
  }
  function onSocket(itemId: number, e: Event) {
    const key = (e.currentTarget as HTMLSelectElement).value;
    if (key) act(() => socketGem(runtime.state, itemId, key), 'Gem socketed.');
  }
  function onUnsocket(itemId: number, index: number) {
    act(() => unsocketGem(runtime.state, itemId, index), 'Gem returned to the bag.');
  }
  function onCombine() {
    const n = combineAll(runtime.state);
    toast(n > 0 ? `Combined ${n} set${n === 1 ? '' : 's'} of gems.` : 'Nothing to combine.');
    refresh();
  }
  function onAutoSalvage(e: Event) {
    runtime.state.loot.autoSalvage = (e.currentTarget as HTMLSelectElement).value as AutoSalvage;
    refresh();
  }
</script>

<div class="relics">
  <div class="relics-bar">
    <span class="dust" title="Bone Dust, from salvaging"><Icon name="dust-cloud" size={18} /> {relics.dust} Bone Dust</span>
    <button onclick={onEquipBest} disabled={relics.upgradesAvailable === 0} data-testid="equip-best">
      Equip best{relics.upgradesAvailable > 0 ? ` (${relics.upgradesAvailable})` : ''}
    </button>
  </div>

  <h3>Equipped</h3>
  <div class="paperdoll">
    {#each relics.slots as s (s.slot)}
      <button
        class="slot rarity-{s.item?.rarity ?? 'empty'}"
        class:selected={s.item && s.item.id === selectedId}
        onclick={() => (selectedId = s.item?.id ?? null)}
        title={s.item ? s.item.name : `${s.label} (empty)`}
      >
        <Icon name={s.icon} size={28} />
        <span class="slot-label">{s.item ? `Lv ${s.item.level}` : s.label}</span>
      </button>
    {/each}
  </div>

  <h3>Bag <span class="muted">· {relics.inventory.length}/{relics.capacity}</span></h3>
  {#if relics.inventory.length === 0}
    <p class="muted small">Empty. Guardians always drop a relic; other foes sometimes do.</p>
  {:else}
    <div class="bag">
      {#each relics.inventory as item (item.id)}
        <button
          class="bag-item rarity-{item.rarity}"
          class:selected={item.id === selectedId}
          onclick={() => (selectedId = item.id)}
          title={item.name}
          data-testid="bag-item"
        >
          <Icon name={item.icon} size={26} />
          {#if item.delta > 0}<span class="up" aria-label="Upgrade">▲</span>{/if}
        </button>
      {/each}
    </div>
  {/if}

  {#if selected}
    <div class="item-card rarity-{selected.rarity}">
      <div class="item-head">
        <span class="item-icon"><Icon name={selected.icon} size={34} /></span>
        <span>
          <span class="item-name">{selected.name}</span>
          <span class="item-meta">{selected.rarityLabel} {selected.kindLabel} · Level {selected.level}{selected.empowered ? ' · Empowered' : ''}</span>
          {#if selected.effectiveLevel < selected.level}
            <span class="item-meta depth-cap">Performs at level {selected.effectiveLevel} until you descend deeper</span>
          {/if}
        </span>
      </div>
      <ul class="item-lines">
        {#each selected.lines as line, i (i)}
          <li class:implicit={line.implicit}>{line.text}</li>
        {/each}
      </ul>
      {#if selected.power}<p class="item-power"><Icon name="sparkles" size={14} /> {selected.power}</p>{/if}
      {#if selected.setName}<p class="item-set">Part of {selected.setName}</p>{/if}
      {#if selected.sockets.total > 0}
        <div class="sockets">
          {#each selected.sockets.gems as g, i (i)}
            <button class="socket filled" title={`${g.name}: ${g.text}. Click to remove.`} onclick={() => onUnsocket(selected.id, i)}>
              <Icon name={g.icon} size={16} /> <span>{g.text}</span>
            </button>
          {/each}
          {#if selected.sockets.gems.length < selected.sockets.total}
            <label class="socket empty">
              <Icon name="cut-diamond" size={14} />
              <select value="" onchange={(e) => onSocket(selected.id, e)} aria-label="Socket a gem" disabled={gems.bag.length === 0}>
                <option value="">{gems.bag.length ? 'Socket a gem…' : 'Empty socket (no gems)'}</option>
                {#each gems.bag as g (g.key)}
                  <option value={g.key}>{g.name} ×{g.count}: {g.text}</option>
                {/each}
              </select>
            </label>
          {/if}
        </div>
      {/if}
      {#if !selected.equippedSlot}
        <p class="item-compare" class:better={selected.delta > 0} class:worse={selected.delta < 0}>
          {selected.delta > 0 ? `Upgrade (+${selected.delta} score)` : selected.delta < 0 ? `Weaker (${selected.delta} score)` : 'About the same'}
          vs. your {selected.wouldReplace}
        </p>
      {/if}
      <div class="item-actions">
        {#if selected.equippedSlot}
          <button onclick={() => onUnequip(selected!.equippedSlot!)}>Unequip</button>
        {:else}
          <button class="primary" onclick={() => onEquip(selected!.id)} data-testid="equip">Equip</button>
          <button onclick={() => onSalvage(selected!.id)}><Icon name="hammer-break" size={14} /> Salvage ({selected.dust})</button>
        {/if}
        {#if selected.rarity !== 'common'}
          <button disabled={!selected.canReforge} onclick={() => onReforge(selected!.id)} title="Reroll the extra stats">
            <Icon name="anvil-impact" size={14} /> Reforge ({selected.reforgeCost})
          </button>
        {/if}
        {#if selected.level < selected.empowerTo}
          <button disabled={!selected.canEmpower} onclick={() => onEmpower(selected!.id)} title="Raise to your deepest floor">
            <Icon name="upgrade" size={14} /> Empower to {selected.empowerTo} ({selected.empowerCost})
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <div class="relics-foot">
    <label class="small">
      Auto-salvage
      <select value={relics.autoSalvage} onchange={onAutoSalvage}>
        {#each SALVAGE_OPTIONS as o (o.value)}
          <option value={o.value}>{o.label}</option>
        {/each}
      </select>
    </label>
    <button class="small-btn" onclick={onSalvageCommons}>Salvage Common &amp; Magic</button>
  </div>
  <p class="muted small">Legendaries and set pieces are never salvaged automatically.</p>

  {#if gems.visible}
    <h3 class="gems-head">
      <span>Gems</span>
      <button class="small-btn" disabled={!gems.combinable} onclick={onCombine} data-testid="combine-gems">Combine (3 → 1)</button>
    </h3>
    {#if gems.bag.length === 0}
      <p class="muted small">Guardians below floor 150 sometimes leave gems, and Rifts pay out in them. Rare, set and legendary relics have sockets; Elites carry one each.</p>
    {:else}
      <ul class="gem-bag">
        {#each gems.bag as g (g.key)}
          <li class="gem gem-{g.type}" title={g.text}>
            <Icon name={g.icon} size={20} />
            <span class="gem-body"><span class="gem-name">{g.name} ×{g.count}</span><span class="gem-desc">{g.text}</span></span>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}

  {#if relics.sets.length > 0}
    <h3>Sets</h3>
    {#each relics.sets as set (set.id)}
      <div class="set-box">
        <div class="set-name">{set.name} <span class="muted small">({set.worn}/{set.pieces} worn)</span></div>
        <ul class="set-bonuses">
          {#each set.bonuses as b (b.pieces)}
            <li class:active={b.active}><span class="set-pieces">{b.pieces}</span> {b.text}</li>
          {/each}
        </ul>
      </div>
    {/each}
  {/if}
</div>
