import { describe, expect, it } from 'vitest';
import { D } from '../src/engine/bignum';
import { decodeSave, encodeSave } from '../src/engine/save';
import { simulateOffline } from '../src/engine/offline';
import { createInitialState, SAVE_VERSION, type GameState, type Item } from '../src/engine/state';
import { BALANCE } from '../src/content/balance';
import { INVENTORY_SIZE } from '../src/content/loot';
import { shardsForFloor } from '../src/content/pact';
import { schoolXpForLevel } from '../src/content/spells';
import { armyDps } from '../src/systems/army';
import { enemyMaxHp, enterFloor, dealDamage } from '../src/systems/descent';
import { DEPTH_LEEWAY, affixValue, gearStat, itemScore } from '../src/systems/gear';
import {
  empower,
  equipBest,
  equipItem,
  generateItem,
  receiveItem,
  reforge,
  rollDrops,
  salvageAll,
  salvageItem,
  unequip,
} from '../src/systems/loot';
import { castSpell, essenceMax, spellReady, updateMagic } from '../src/systems/magic';
import { allDamageMultiplier, bossTimerSeconds } from '../src/systems/modifiers';
import { autoBuy, buyPact, canBuyPact, canRebirth, offlineCapSeconds, rebirth, shardMultiplier } from '../src/systems/prestige';

function deepState(): GameState {
  const s = createInitialState(0, 7);
  s.descent.maxFloor = 50;
  enterFloor(s, 50);
  return s;
}

function item(s: GameState, overrides: Partial<Item> = {}): Item {
  return { ...generateItem(s, 40, 'rare', 'staff'), ...overrides };
}

describe('item generation', () => {
  it('is deterministic for a seed', () => {
    const a = generateItem(createInitialState(0, 3), 30, 'rare');
    const b = generateItem(createInitialState(0, 3), 30, 'rare');
    expect(a).toEqual(b);
  });

  it('gives each rarity the right number of extra stats, without duplicates', () => {
    const s = createInitialState(0, 11);
    for (let i = 0; i < 200; i++) {
      const common = generateItem(s, 20, 'common');
      expect(common.affixes).toHaveLength(0);
      const rare = generateItem(s, 20, 'rare');
      expect(rare.affixes.length).toBeGreaterThanOrEqual(3);
      const stats = [rare.implicit.stat, ...rare.affixes.map((a) => a.stat)];
      expect(new Set(stats).size).toBe(stats.length);
    }
  });

  it('legendaries carry a power that matches their slot', () => {
    const s = createInitialState(0, 5);
    const leg = generateItem(s, 40, 'legendary', 'staff');
    expect(leg.legendary).toBe('gravecallersStaff');
    expect(leg.kind).toBe('staff');
  });

  it('values grow with item level and rarity', () => {
    const affix = { stat: 'minionDamage', roll: 1 };
    expect(affixValue(affix, 80, 'magic')).toBeGreaterThan(affixValue(affix, 10, 'magic'));
    expect(affixValue(affix, 40, 'rare')).toBeGreaterThan(affixValue(affix, 40, 'common'));
  });
});

describe('drops', () => {
  it('guardians always drop an item once loot is unlocked', () => {
    const s = deepState();
    expect(rollDrops(s, 50, 1, true)).toHaveLength(1);
    expect(s.loot.inventory).toHaveLength(1);
  });

  it('nothing drops before the first guardian', () => {
    const s = createInitialState(0, 1);
    expect(rollDrops(s, 5, 100_000, false)).toHaveLength(0);
  });

  it('huge kill batches are capped', () => {
    const s = deepState();
    expect(rollDrops(s, 50, 1e9, false).length).toBeLessThanOrEqual(3);
  });

  it('killing a guardian through combat drops a relic', () => {
    const s = createInitialState(0, 2);
    s.descent.maxFloor = 10;
    enterFloor(s, 10);
    dealDamage(s, enemyMaxHp(10));
    expect(s.stats.itemsFound).toBe(1);
  });

  it('auto-salvage turns filtered items into Bone Dust', () => {
    const s = deepState();
    s.loot.autoSalvage = 'magic';
    expect(receiveItem(s, generateItem(s, 20, 'magic'))).toBe('salvaged');
    expect(receiveItem(s, generateItem(s, 20, 'rare'))).toBe('kept');
    expect(s.loot.dust).toBeGreaterThan(0);
  });

  it('a full bag never destroys a legendary', () => {
    const s = deepState();
    for (let i = 0; i < INVENTORY_SIZE; i++) s.loot.inventory.push(generateItem(s, 10, 'common'));
    expect(receiveItem(s, generateItem(s, 40, 'legendary'))).toBe('kept');
    expect(s.loot.inventory).toHaveLength(INVENTORY_SIZE);
    expect(s.loot.inventory.some((i) => i.legendary)).toBe(true);
  });
});

describe('equipment', () => {
  it('equipping moves the old item back to the bag and changes stats', () => {
    const s = deepState();
    const a = item(s);
    const b = item(s);
    s.loot.inventory.push(a, b);
    expect(gearStat(s, 'minionDamage')).toBe(0);
    expect(equipItem(s, a.id)).toBe(true);
    expect(gearStat(s, 'minionDamage')).toBeGreaterThan(0);
    expect(equipItem(s, b.id)).toBe(true);
    expect(s.loot.inventory.map((i) => i.id)).toEqual([a.id]);
    expect(unequip(s, 'staff')).toBe(true);
    expect(s.loot.inventory).toHaveLength(2);
  });

  it('rings fill both ring slots', () => {
    const s = deepState();
    const r1 = generateItem(s, 20, 'magic', 'ring');
    const r2 = generateItem(s, 20, 'magic', 'ring');
    s.loot.inventory.push(r1, r2);
    equipItem(s, r1.id);
    equipItem(s, r2.id);
    expect(s.loot.equipped.ring1?.id).toBe(r1.id);
    expect(s.loot.equipped.ring2?.id).toBe(r2.id);
  });

  it('Equip Best picks the highest score per slot', () => {
    const s = deepState();
    const weak = generateItem(s, 5, 'common', 'helm');
    const strong = generateItem(s, 50, 'rare', 'helm');
    s.loot.inventory.push(weak, strong);
    equipBest(s);
    expect(s.loot.equipped.helm?.id).toBe(strong.id);
    expect(itemScore(strong)).toBeGreaterThan(itemScore(weak));
  });

  it('gear performs at most a little deeper than this run has reached', () => {
    const s = createInitialState(0, 4);
    const big = generateItem(s, 200, 'rare', 'staff');
    s.loot.inventory.push(big);
    equipItem(s, big.id);
    const shallow = gearStat(s, 'minionDamage');
    s.descent.maxFloor = 200;
    const deep = gearStat(s, 'minionDamage');
    expect(deep).toBeGreaterThan(shallow);
    expect(shallow).toBeCloseTo(affixValue(big.implicit, 1 + DEPTH_LEEWAY, 'rare') + 0, 0);
  });
});

describe('salvage, reforge, empower', () => {
  it('salvaging gives dust and Salvage All skips legendaries', () => {
    const s = deepState();
    const c = generateItem(s, 10, 'common');
    const l = generateItem(s, 10, 'legendary');
    s.loot.inventory.push(c, l);
    expect(salvageAll(s, 'rare')).toBe(1);
    expect(s.loot.inventory.map((i) => i.id)).toEqual([l.id]);
    expect(salvageItem(s, l.id)).toBe(true);
    expect(s.loot.dust).toBeGreaterThan(0);
  });

  it('reforge rerolls extra stats for dust but keeps the main stat', () => {
    const s = deepState();
    const it = item(s);
    s.loot.inventory.push(it);
    s.loot.dust = 0;
    expect(reforge(s, it.id)).toBe(false);
    s.loot.dust = 10_000;
    expect(reforge(s, it.id)).toBe(true);
    const after = s.loot.inventory[0]!;
    expect(after.implicit).toEqual(it.implicit);
    expect(s.loot.dust).toBeLessThan(10_000);
  });

  it('empower raises an item to the deepest floor ever reached', () => {
    const s = deepState();
    s.prestige.bestFloor = 90;
    const it = item(s, { level: 30 });
    s.loot.inventory.push(it);
    s.loot.dust = 100_000;
    expect(empower(s, it.id)).toBe(true);
    expect(s.loot.inventory[0]!.level).toBe(90);
    expect(empower(s, it.id)).toBe(false); // already there
  });
});

describe('spells', () => {
  function caster() {
    const s = createInitialState(0, 9);
    s.unlocks.essence = true;
    s.army.minions.ghoul!.owned = 10;
    return s;
  }

  it('Essence regenerates up to the cap', () => {
    const s = caster();
    updateMagic(s, 10_000);
    expect(s.magic.essence).toBe(essenceMax(s));
  });

  it('casting costs Essence, starts a cooldown and grants school experience', () => {
    const s = caster();
    s.magic.essence = 100;
    const before = s.stats.totalKills + s.descent.enemyHp.toNumber();
    expect(castSpell(s, 'boneSpear')).toBe(true);
    expect(s.magic.essence).toBe(80);
    expect(spellReady(s, 'boneSpear')).toBe(false);
    expect(s.magic.schools.bone.xp).toBe(20);
    expect(s.stats.totalKills + s.descent.enemyHp.toNumber()).not.toBe(before);
  });

  it('spells unlock with school level and level up from casting', () => {
    const s = caster();
    s.magic.essence = 1000;
    expect(castSpell(s, 'raiseLegion')).toBe(false); // needs level 3
    s.magic.schools.bone.xp = schoolXpForLevel(0) - 1;
    castSpell(s, 'boneSpear');
    expect(s.magic.schools.bone.level).toBe(1);
  });

  it('Raise Legion multiplies army damage while active', () => {
    const s = caster();
    s.magic.schools.bone.level = 3;
    s.magic.essence = 100;
    const before = allDamageMultiplier(s);
    castSpell(s, 'raiseLegion');
    expect(allDamageMultiplier(s)).toBeGreaterThan(before * 1.5);
  });

  it('auto-cast needs both the Dark Pact node and the toggle', () => {
    const s = caster();
    s.magic.essence = 100;
    s.magic.autoCast = true;
    updateMagic(s, 0.01);
    expect(s.stats.spellsCast).toBe(0);
    s.prestige.pact.push('autoCast');
    updateMagic(s, 0.01);
    expect(s.stats.spellsCast).toBe(1);
  });
});

describe('Phylactery Rebirth', () => {
  it('shards scale with depth and need floor 75', () => {
    expect(shardsForFloor(74)).toBe(0);
    expect(shardsForFloor(75)).toBeGreaterThan(0);
    expect(shardsForFloor(110)).toBeGreaterThan(shardsForFloor(90));
  });

  it('resets the run but keeps relics, school, shards and the Chronicle', () => {
    const s = deepState();
    s.descent.maxFloor = 100;
    s.resources.bones = D(1e12);
    s.army.minions.wraith!.owned = 40;
    s.crypt.graveworks.ossuary!.owned = 20;
    s.upgrades.purchased.push('sharpenedPhalanges');
    s.magic.schools.bone.level = 7;
    const relic = generateItem(s, 90, 'legendary');
    s.loot.inventory.push(relic);
    s.log.push({ at: 1, kind: 'story', text: 'old' });

    expect(canRebirth(s)).toBe(true);
    const gained = rebirth(s, 0);
    expect(gained).toBe(shardsForFloor(100));
    expect(s.resources.bones.eq(0)).toBe(true);
    expect(s.army.minions.wraith!.owned).toBe(0);
    expect(s.crypt.graveworks.ossuary!.owned).toBe(0);
    expect(s.upgrades.purchased).toEqual([]);
    expect(s.descent.floor).toBe(1);
    expect(s.loot.inventory).toContainEqual(relic);
    expect(s.magic.schools.bone.level).toBe(7);
    expect(s.prestige.shards).toBe(gained);
    expect(s.prestige.bestFloor).toBe(100);
    expect(s.log.some((l) => l.text === 'old')).toBe(true);
  });

  it('cannot rebirth before floor 75', () => {
    const s = deepState();
    expect(rebirth(s, 0)).toBe(0);
    expect(s.descent.floor).toBe(50);
  });

  it('shards boost army damage', () => {
    const s = createInitialState(0, 1);
    s.army.minions.ghoul!.owned = 1;
    const before = armyDps(s).toNumber();
    s.prestige.shardsEarned = 50;
    expect(shardMultiplier(s)).toBeCloseTo(2);
    expect(armyDps(s).toNumber()).toBeCloseTo(before * 2);
  });
});

describe('Dark Pact', () => {
  it('nodes need shards and their prerequisites', () => {
    const s = createInitialState(0, 1);
    s.prestige.shards = 100;
    expect(canBuyPact(s, 'risenVanguard')).toBe(false); // needs Grave Memory
    expect(buyPact(s, 'graveMemory')).toBe(true);
    expect(buyPact(s, 'risenVanguard')).toBe(true);
    expect(buyPact(s, 'risenVanguard')).toBe(false); // already owned
    expect(s.prestige.shards).toBe(100 - 1 - 3);
  });

  it('head starts apply on Rebirth', () => {
    const s = deepState();
    s.descent.maxFloor = 100;
    s.prestige.pact.push('graveMemory', 'risenVanguard', 'cryptMemory', 'deepStart');
    rebirth(s, 0);
    expect(s.resources.bones.toNumber()).toBe(1000);
    expect(s.army.minions.skeletonWarrior!.owned).toBe(15);
    expect(s.crypt.graveworks.shallowGraves!.owned).toBe(10);
    expect(s.descent.floor).toBe(11);
  });

  it('Lingering Wardens keeps Wardens through Rebirth', () => {
    const s = deepState();
    s.descent.maxFloor = 100;
    s.crypt.graveworks.shallowGraves!.warden = true;
    s.prestige.pact.push('lingeringWardens');
    rebirth(s, 0);
    expect(s.crypt.graveworks.shallowGraves!.warden).toBe(true);
  });

  it('auto-raise buys minions only when owned and enabled', () => {
    const s = createInitialState(0, 1);
    s.resources.bones = D(10_000);
    s.prestige.autoBuy = true;
    expect(autoBuy(s)).toBe(0);
    s.prestige.pact.push('autoRaise');
    expect(autoBuy(s)).toBeGreaterThan(0);
    expect(s.resources.bones.toNumber()).toBeGreaterThan(4_000); // keeps about half
  });

  it('pact effects extend the offline cap and boss timer', () => {
    const s = createInitialState(0, 1);
    const cap = offlineCapSeconds(s);
    const timer = bossTimerSeconds(s);
    s.prestige.pact.push('patientDead', 'eternalPatience');
    expect(offlineCapSeconds(s)).toBe(cap + 4 * 3600);
    expect(bossTimerSeconds(s)).toBe(timer + 10);
    expect(cap).toBe(BALANCE.BASE_OFFLINE_CAP_SECONDS);
  });

  it('offline progress uses the pact cap', () => {
    const s = createInitialState(0, 1);
    s.prestige.pact.push('patientDead');
    expect(simulateOffline(s, 20 * 3600).simulatedSeconds).toBe(12 * 3600);
  });
});

describe('saves with M2 data', () => {
  it('round-trip items, magic and prestige', () => {
    const s = deepState();
    const relic = generateItem(s, 60, 'legendary', 'gloves');
    s.loot.inventory.push(relic);
    equipItem(s, relic.id);
    s.loot.dust = 321;
    s.magic.essence = 42.5;
    s.magic.schools.bone.level = 4;
    s.prestige.shards = 9;
    s.prestige.shardsEarned = 20;
    s.prestige.pact = ['graveMemory'];
    const back = decodeSave(encodeSave(s));
    expect(back.loot.equipped.gloves).toEqual(relic);
    expect(back.loot.dust).toBe(321);
    expect(back.magic.essence).toBe(42.5);
    expect(back.magic.schools.bone.level).toBe(4);
    expect(back.prestige).toMatchObject({ shards: 9, shardsEarned: 20, pact: ['graveMemory'] });
    expect(back.loot.nextId).toBeGreaterThan(relic.id);
  });

  it('drop malformed items, unknown pact nodes and wrongly-slotted gear', () => {
    const s = deepState();
    const good = generateItem(s, 20, 'magic', 'helm');
    const raw = JSON.parse(atob(encodeSave(s).slice(4)));
    raw.loot.inventory = [good, { id: 'x' }, null];
    raw.loot.equipped = { staff: good };
    raw.prestige.pact = ['graveMemory', 'notARealNode'];
    const back = decodeSave('BB1:' + btoa(JSON.stringify(raw)));
    expect(back.loot.inventory).toHaveLength(1);
    expect(back.loot.equipped.staff).toBeUndefined();
    expect(back.prestige.pact).toEqual(['graveMemory']);
  });

  it('M1 (v2) saves load with empty M2 systems', () => {
    const v2 = { version: 2, descent: { floor: 40, maxFloor: 41 }, resources: { bones: { __d: '99' } } };
    const s = decodeSave('BB1:' + btoa(JSON.stringify(v2)));
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.loot.inventory).toEqual([]);
    expect(s.magic.schools.bone).toEqual({ level: 0, xp: 0 });
    expect(s.prestige.bestFloor).toBe(41);
  });
});
