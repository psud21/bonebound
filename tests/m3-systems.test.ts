import { describe, expect, it } from 'vitest';
import { D } from '../src/engine/bignum';
import { decodeSave, encodeSave } from '../src/engine/save';
import { simulateOffline } from '../src/engine/offline';
import { createInitialState, type GameState, type Item } from '../src/engine/state';
import { layerForFloor } from '../src/content/layers';
import { RESEARCH_BY_ID } from '../src/content/research';
import { buyMinion, minionVisible, unitDps } from '../src/systems/army';
import { chooseCoven, covensUnlocked } from '../src/systems/covens';
import { dealDamage, enemyMaxHp, enterFloor, floorBaseHp, updateRegen } from '../src/systems/descent';
import { eliteCost, eliteUnlocked, gainCorpses, raiseElite } from '../src/systems/elites';
import { checkFeats, featMultiplier } from '../src/systems/feats';
import { setCounts } from '../src/systems/gear';
import { cancelResearch, gainLore, startResearch, updateLibrary } from '../src/systems/library';
import { generateItem, receiveItem, rollDrops } from '../src/systems/loot';
import { castSpell, schoolUnlocked, spellCost, spellKnown } from '../src/systems/magic';
import { allDamageMultiplier, guardianShred, lowerTierBoost } from '../src/systems/modifiers';
import { rebirth } from '../src/systems/prestige';
import { applyBuff } from '../src/systems/events';

function at(floor: number, seed = 3): GameState {
  const s = createInitialState(0, seed);
  s.descent.maxFloor = floor;
  enterFloor(s, floor);
  return s;
}

function withMagic(s: GameState): GameState {
  s.unlocks.essence = true;
  s.magic.essence = 500;
  return s;
}

describe('layers and hazards', () => {
  it('names the new layers', () => {
    expect(layerForFloor(150).name).toBe('The Drowned Catacombs');
    expect(layerForFloor(250).name).toBe('The Ashen Wastes');
    expect(layerForFloor(350).name).toBe('The Weeping Glacier');
    expect(layerForFloor(450).id).toBe('uncharted');
  });

  it('keeps enemy HP rising floor to floor', () => {
    for (const f of [99, 100, 101, 200, 300]) expect(floorBaseHp(f + 1).gt(floorBaseHp(f))).toBe(true);
  });

  it('heals wounded enemies in the Drowned Catacombs, and only there', () => {
    const drowned = at(151);
    drowned.descent.enemyHp = enemyMaxHp(151).mul(0.5);
    updateRegen(drowned, 1);
    expect(drowned.descent.enemyHp.div(enemyMaxHp(151)).toNumber()).toBeCloseTo(0.54);

    const crypts = at(51);
    crypts.descent.enemyHp = enemyMaxHp(51).mul(0.5);
    updateRegen(crypts, 1);
    expect(crypts.descent.enemyHp.div(enemyMaxHp(51)).toNumber()).toBeCloseTo(0.5);
  });

  it('stops healing under Plague Wind and halves it with Tide Tables', () => {
    const s = at(151);
    s.descent.enemyHp = enemyMaxHp(151).mul(0.5);
    applyBuff(s, 'plagueWind');
    updateRegen(s, 1);
    expect(s.descent.enemyHp.div(enemyMaxHp(151)).toNumber()).toBeCloseTo(0.5);

    const t = at(151);
    t.library.completed.push('tideTables');
    t.descent.enemyHp = enemyMaxHp(151).mul(0.5);
    updateRegen(t, 1);
    expect(t.descent.enemyHp.div(enemyMaxHp(151)).toNumber()).toBeCloseTo(0.52);
  });

  it('burns every minion but Bone Golems in the Ashen Wastes', () => {
    const cool = at(199);
    const hot = at(251);
    hot.prestige.bestFloor = cool.prestige.bestFloor = 251;
    const ratio = (id: string) => unitDps(hot, id).div(unitDps(cool, id)).toNumber();
    expect(ratio('skeletonWarrior')).toBeCloseTo(0.65);
    expect(ratio('boneGolem')).toBeCloseTo(1);
  });

  it('slows the army in the Weeping Glacier', () => {
    expect(unitDps(at(351), 'ghoul').div(unitDps(at(199), 'ghoul')).toNumber()).toBeCloseTo(0.7);
  });
});

describe('new minions', () => {
  it('keeps the Dracolich sealed until the Drowned King falls', () => {
    const s = at(150);
    s.stats.lifetimeBones = D(1e20);
    s.resources.bones = D(1e20);
    expect(minionVisible(s, 'dracolich')).toBe(false);
    expect(buyMinion(s, 'dracolich', 1)).toBe(0);
    s.prestige.bestFloor = 201;
    expect(buyMinion(s, 'dracolich', 1)).toBe(1);
  });

  it('lets Death Knights strengthen lower tiers only', () => {
    const s = at(50);
    s.army.minions.deathKnight!.owned = 10;
    expect(lowerTierBoost(s, 'skeletonWarrior')).toBeCloseTo(1.2);
    expect(lowerTierBoost(s, 'banshee')).toBe(1);
  });

  it('lets Banshees strip guardian HP, up to the cap', () => {
    const s = at(49);
    s.army.minions.banshee!.owned = 20;
    expect(guardianShred(s)).toBeCloseTo(0.1);
    enterFloor(s, 50);
    expect(s.descent.enemyHp.div(enemyMaxHp(50)).toNumber()).toBeCloseTo(0.9);
    s.army.minions.banshee!.owned = 500;
    expect(guardianShred(s)).toBeCloseTo(0.4);
  });
});

describe('corpses and elites', () => {
  it('yields Corpses from floor 15, ten per guardian', () => {
    const early = at(10);
    expect(gainCorpses(early, 5, false)).toBe(0);
    const s = at(20);
    expect(gainCorpses(s, 5, false)).toBe(5);
    expect(gainCorpses(s, 1, true)).toBe(10);
    s.army.minions.ghoul!.owned = 50;
    expect(gainCorpses(s, 10, false)).toBeCloseTo(15);
  });

  it('raises Elites with Corpses, each level dearer and stronger', () => {
    const s = at(40);
    expect(eliteUnlocked(s, 'graveChampion')).toBe(true);
    expect(eliteUnlocked(s, 'fleshColossus')).toBe(false);
    s.resources.corpses = 1000;
    const before = allDamageMultiplier(s);
    const first = eliteCost(s, 'graveChampion');
    expect(raiseElite(s, 'graveChampion')).toBe(true);
    expect(eliteCost(s, 'graveChampion')).toBeGreaterThan(first);
    expect(s.resources.corpses).toBe(1000 - first);
    expect(allDamageMultiplier(s)).toBeGreaterThan(before);
  });
});

describe('the Forbidden Library', () => {
  it('pays Lore for a guardian’s first fall this run', () => {
    const s = at(59);
    s.unlocks.library = true;
    s.descent.maxFloor = 60;
    enterFloor(s, 60);
    dealDamage(s, enemyMaxHp(60));
    expect(s.library.lore).toBe(3);
  });

  it('runs research in real time, one desk at a time, and refunds cancels', () => {
    const s = at(60);
    s.unlocks.library = true;
    gainLore(s, 100);
    expect(startResearch(s, 'reinforcedMarrow')).toBe(true);
    expect(startResearch(s, 'essenceChannels')).toBe(false); // one desk
    expect(cancelResearch(s, 'reinforcedMarrow')).toBe(true);
    expect(s.library.lore).toBe(100);
    startResearch(s, 'reinforcedMarrow');
    const before = allDamageMultiplier(s);
    updateLibrary(s, RESEARCH_BY_ID.reinforcedMarrow!.seconds);
    expect(s.library.completed).toContain('reinforcedMarrow');
    expect(allDamageMultiplier(s) / before).toBeCloseTo(1.25);
  });

  it('keeps researching while offline', () => {
    const s = at(60);
    s.unlocks.library = true;
    gainLore(s, 100);
    startResearch(s, 'reinforcedMarrow');
    simulateOffline(s, 3600);
    expect(s.library.completed).toContain('reinforcedMarrow');
  });
});

describe('schools of magic', () => {
  it('opens Blood after a Rebirth, Plague below floor 100 and Shadow after two Rebirths', () => {
    const s = withMagic(at(50));
    expect(schoolUnlocked(s, 'bone')).toBe(true);
    expect(schoolUnlocked(s, 'blood')).toBe(false);
    expect(schoolUnlocked(s, 'plague')).toBe(false);
    s.prestige.rebirths = 1;
    s.prestige.bestFloor = 120;
    expect(schoolUnlocked(s, 'blood')).toBe(true);
    expect(schoolUnlocked(s, 'plague')).toBe(true);
    expect(schoolUnlocked(s, 'shadow')).toBe(false);
    s.prestige.rebirths = 2;
    expect(spellKnown(s, 'curseOfFrailty')).toBe(true);
    expect(spellKnown(s, 'eclipse')).toBe(false); // needs school level 6
  });

  it('sacrifices a tenth of the army for Blood Rite, unless the Sanguine Scepter is worn', () => {
    const s = withMagic(at(50));
    s.prestige.rebirths = 1;
    s.army.minions.skeletonWarrior!.owned = 100;
    const before = allDamageMultiplier(s);
    expect(castSpell(s, 'bloodRite')).toBe(true);
    expect(s.army.minions.skeletonWarrior!.owned).toBe(90);
    expect(allDamageMultiplier(s) / before).toBeCloseTo(4);

    const t = withMagic(at(150));
    t.prestige.rebirths = 1;
    t.army.minions.skeletonWarrior!.owned = 100;
    t.loot.equipped = { staff: { ...generateItem(t, 150, 'legendary', 'staff'), legendary: 'sanguineScepter' } };
    castSpell(t, 'bloodRite');
    expect(t.army.minions.skeletonWarrior!.owned).toBe(100);
  });

  it('never lets Hemorrhage overkill', () => {
    const s = withMagic(at(51));
    s.prestige.rebirths = 1;
    s.magic.schools.blood = { level: 50, xp: 0 }; // power 3.5 → 105%, capped
    castSpell(s, 'hemorrhage');
    expect(s.stats.totalKills).toBe(1);
  });

  it('refills Essence with Soul Drain', () => {
    const s = withMagic(at(50));
    s.prestige.rebirths = 2;
    s.magic.schools.shadow = { level: 3, xp: 0 };
    s.magic.essence = 10;
    castSpell(s, 'soulDrain');
    expect(s.magic.essence).toBeGreaterThan(30);
  });
});

describe('covens', () => {
  it('unlock after three Rebirths, bind for one run, and change spell costs', () => {
    const s = withMagic(at(50));
    expect(covensUnlocked(s)).toBe(false);
    expect(chooseCoven(s, 'boneLord')).toBe(false);
    s.prestige.rebirths = 3;
    const damage = allDamageMultiplier(s);
    expect(chooseCoven(s, 'boneLord')).toBe(true);
    expect(chooseCoven(s, 'shade')).toBe(false);
    expect(allDamageMultiplier(s) / damage).toBeCloseTo(3);
    expect(spellCost(s, 'boneSpear')).toBe(30);
    s.descent.maxFloor = 100;
    rebirth(s, 0);
    expect(s.prestige.coven).toBeNull();
  });
});

describe('sets', () => {
  it('only drop deep, and are never auto-salvaged', () => {
    const shallow = at(90);
    for (let i = 0; i < 200; i++) rollDrops(shallow, 90, 1, true);
    expect(shallow.loot.inventory.some((i) => i.rarity === 'set')).toBe(false);

    const deep = at(150);
    deep.loot.autoSalvage = 'legendary';
    const piece = generateItem(deep, 150, 'set');
    expect(piece.set).not.toBeNull();
    expect(receiveItem(deep, piece)).toBe('kept');
  });

  it('grant bonuses for pieces worn together', () => {
    const s = at(150);
    const piece = (kind: Item['kind']) => ({ ...generateItem(s, 150, 'set', kind), set: 'graveLord' });
    const before = unitDps(s, 'skeletonWarrior').toNumber();
    s.loot.equipped = { staff: piece('staff'), helm: piece('helm') };
    expect(setCounts(s).graveLord).toBe(2);
    const ratio = unitDps(s, 'skeletonWarrior').toNumber() / before;
    expect(ratio).toBeGreaterThan(4); // 2-piece bonus plus the items' own stats
  });
});

describe('feats', () => {
  it('are earned once, add damage and survive Rebirth', () => {
    const s = at(100);
    s.prestige.bestFloor = 100;
    const fresh = checkFeats(s);
    expect(fresh).toEqual(expect.arrayContaining(['floor10', 'floor50', 'floor100']));
    expect(checkFeats(s)).toEqual([]);
    expect(featMultiplier(s)).toBeCloseTo(1 + 0.01 * s.feats.length);
    const count = s.feats.length;
    rebirth(s, 0);
    expect(s.feats.length).toBe(count);
  });
});

describe('rebirth in M3', () => {
  it('resets Corpses and Elites but keeps Lore and research; the Veterans’ Oath keeps a quarter', () => {
    const s = at(120);
    s.resources.corpses = 500;
    s.army.elites.graveChampion = 8;
    s.library.lore = 40;
    s.library.completed.push('boneLedgers');
    rebirth(s, 0);
    expect(s.resources.corpses).toBe(0);
    expect(s.army.elites.graveChampion).toBe(0);
    expect(s.library.lore).toBe(40);
    expect(s.library.completed).toContain('boneLedgers');

    const t = at(120);
    t.prestige.pact.push('eliteMemory', 'corpseHoard');
    t.army.elites.graveChampion = 8;
    rebirth(t, 0);
    expect(t.army.elites.graveChampion).toBe(2);
    expect(t.resources.corpses).toBe(150);
  });
});

describe('saves in M3', () => {
  it('round-trips the new state', () => {
    const s = at(150);
    s.resources.corpses = 12.5;
    s.army.elites.hierophant = 3;
    s.library = { lore: 7, loreEarned: 20, completed: ['boneLedgers'], active: [{ id: 'abyssalCharts', remaining: 30 }] };
    s.feats = ['floor10'];
    s.prestige.rebirths = 3;
    s.prestige.coven = 'shade';
    s.loot.inventory.push(generateItem(s, 150, 'set'));
    const back = decodeSave(encodeSave(s));
    expect(back.resources.corpses).toBe(12.5);
    expect(back.army.elites.hierophant).toBe(3);
    expect(back.library).toEqual(s.library);
    expect(back.feats).toEqual(['floor10']);
    expect(back.prestige.coven).toBe('shade');
    expect(back.loot.inventory[0]!.set).toBe(s.loot.inventory[0]!.set);
  });

  it('cleans bad values and fills set: null on old items', () => {
    const s = at(50);
    const old = generateItem(s, 50, 'rare');
    delete (old as Partial<Item>).set;
    s.loot.inventory.push(old);
    const raw = JSON.parse(atob(encodeSave(s).slice(4)));
    raw.version = 3;
    raw.library = { lore: -5, completed: ['nope', 'boneLedgers'], active: [{ id: 'nope', remaining: 5 }] };
    raw.feats = ['floor10', 'fake'];
    raw.prestige.coven = 'nobody';
    const back = decodeSave('BB1:' + btoa(JSON.stringify(raw)));
    expect(back.loot.inventory[0]!.set).toBeNull();
    expect(back.library.lore).toBe(0);
    expect(back.library.completed).toEqual(['boneLedgers']);
    expect(back.library.active).toEqual([]);
    expect(back.feats).toEqual(['floor10']);
    expect(back.prestige.coven).toBeNull();
    expect(back.magic.schools.shadow).toEqual({ level: 0, xp: 0 });
  });
});
