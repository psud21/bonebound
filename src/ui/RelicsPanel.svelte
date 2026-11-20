<script lang="ts">
  import type { GameRuntime } from '../game';
  import type { GameView } from './viewModel';
  import type { ItemView } from './sections';
  import type { AutoSalvage } from '../engine/state';
  import type { EquipSlot } from '../content/loot';
  import { empower, equipBest, equipItem, reforge, salvageAll, salvageItem, unequip } from '../systems/loot';
  import { refresh } from './frame.svelte';
  import { toast } from './feedback.svelte';
  import Icon from './Icon.svelte';

  let { runtime, view }: { runtime: GameRuntime; view: GameView } = $props();

  let selectedId = $state<number | null>(null);
  const relics = $derived(view.relics);
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
  <p class="muted small">Legendaries are never salvaged automatically.</p>
</div>
