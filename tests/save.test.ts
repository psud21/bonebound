import { describe, expect, it } from 'vitest';
import { D, Decimal } from '../src/engine/bignum';
import { migrate, SaveVersionError, type RawSave } from '../src/engine/migrations';
import { BACKUP_KEY, SAVE_KEY, SaveError, SaveStore, decodeSave, encodeSave, type SaveStorage } from '../src/engine/save';
import { fromJson, mergeDefaults, toJson } from '../src/engine/serialize';
import { createInitialState, SAVE_VERSION } from '../src/engine/state';
import { buyMinion } from '../src/systems/army';
import { enemyMaxHp } from '../src/systems/descent';

function memoryStorage(): SaveStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

function playedState() {
  const s = createInitialState(1000, 77);
  s.resources.bones = D('1.5e308').mul(1e10); // beyond a JS number
  s.stats.lifetimeBones = D(123456);
  s.descent.floor = 42;
  s.descent.maxFloor = 50;
  s.settings.buyAmount = 'max';
  s.settings.notation = 'scientific';
  s.army.minions.skeletonWarrior!.owned = 17;
  return s;
}

describe('serialize', () => {
  it('round-trips nested Decimals as Decimals', () => {
    const value = { a: D('1e999'), nested: { b: D(5), list: [D(1), 2] } };
    const back = fromJson(toJson(value)) as typeof value;
    expect(back.a).toBeInstanceOf(Decimal);
    expect(back.a.eq(D('1e999'))).toBe(true);
    expect(back.nested.b.eq(5)).toBe(true);
    expect(back.nested.list[0]).toBeInstanceOf(Decimal);
    expect(back.nested.list[1]).toBe(2);
  });

  it('mergeDefaults fills missing fields, keeps extras and converts Decimals', () => {
    const defaults = { a: 1, b: { c: D(0), d: 'x' }, rec: { k1: { n: 0 } } };
    const merged = mergeDefaults(defaults, { b: { c: '1e50' }, rec: { k2: { n: 3 } }, extra: true });
    expect(merged.a).toBe(1);
    expect(merged.b.c.eq(D('1e50'))).toBe(true);
    expect(merged.b.d).toBe('x');
    expect(merged.rec.k1.n).toBe(0);
    expect((merged.rec as Record<string, { n: number }>).k2!.n).toBe(3);
    expect((merged as Record<string, unknown>).extra).toBe(true);
  });

  it('mergeDefaults rejects values of the wrong type', () => {
    const merged = mergeDefaults({ floor: 1, name: 'a' }, { floor: 'banana', name: 7 });
    expect(merged).toEqual({ floor: 1, name: 'a' });
  });
});

describe('encode / decode', () => {
  it('round-trips a played game exactly', () => {
    const s = playedState();
    const back = decodeSave(encodeSave(s));
    expect(back.resources.bones.eq(s.resources.bones)).toBe(true);
    expect(back.descent).toMatchObject({ floor: 42, maxFloor: 50 });
    expect(back.settings).toMatchObject({ buyAmount: 'max', notation: 'scientific' });
    expect(back.army.minions.skeletonWarrior!.owned).toBe(17);
    expect(back.rng.state).toBe(s.rng.state);
  });

  it('rejects strings that are not saves', () => {
    expect(() => decodeSave('hello')).toThrow(SaveError);
    expect(() => decodeSave('BB1:!!!not-base64!!!')).toThrow(SaveError);
    expect(() => decodeSave('BB1:' + btoa('[1,2,3]'))).toThrow(SaveError);
  });

  it('fills fields that an older save is missing', () => {
    const partial = { version: SAVE_VERSION, resources: { bones: { __d: '250' } } };
    const s = decodeSave('BB1:' + btoa(JSON.stringify(partial)));
    expect(s.resources.bones.eq(250)).toBe(true);
    expect(s.descent.floor).toBe(1);
    expect(s.army.minions.skeletonWarrior!.owned).toBe(0);
    expect(s.settings.buyAmount).toBe(1);
  });

  it('repairs invalid values', () => {
    const bad = {
      version: SAVE_VERSION,
      descent: { floor: -4, maxFloor: 2, killsOnFloor: -1 },
      army: { minions: { skeletonWarrior: { owned: -3 }, ghoul: 5 } },
      settings: { buyAmount: 7, notation: 'roman' },
    };
    const s = decodeSave('BB1:' + btoa(JSON.stringify(bad)));
    expect(s.descent.floor).toBe(1);
    expect(s.descent.killsOnFloor).toBe(0);
    expect(s.army.minions.skeletonWarrior!.owned).toBe(0);
    expect(s.army.minions.ghoul!.owned).toBe(0);
    expect(s.settings).toMatchObject({ buyAmount: 1, notation: 'short', sound: true, volume: 0.5 });
  });
});

describe('M0 (v1) saves', () => {
  it('upgrade to v2 with new systems filled in and enemy HP reset for the new scaling', () => {
    const v1 = {
      version: 1,
      meta: { createdAt: 1, lastActiveAt: 2, lastSavedAt: 3, playTimeSeconds: 400 },
      rng: { state: 12345 },
      resources: { bones: { __d: '5000' } },
      army: { minions: { skeletonWarrior: { owned: 30 }, skeletalArcher: { owned: 4 }, ghoul: { owned: 0 } } },
      descent: { floor: 20, maxFloor: 22, killsOnFloor: 3, enemyHp: { __d: '7' } },
      stats: { lifetimeBones: { __d: '90000' }, totalKills: 500, totalClicks: 800 },
      settings: { notation: 'short', buyAmount: 10 },
    };
    const s = decodeSave('BB1:' + btoa(JSON.stringify(v1)));
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.resources.bones.eq(5000)).toBe(true);
    expect(s.army.minions.skeletonWarrior!.owned).toBe(30);
    expect(s.army.minions.boneMage!.owned).toBe(0);
    expect(s.crypt.graveworks.shallowGraves).toEqual({ owned: 0, progress: 0, running: false, warden: false });
    expect(s.upgrades.purchased).toEqual([]);
    expect(s.descent.autoAdvance).toBe(true);
    expect(s.descent.enemyHp.eq(enemyMaxHp(20))).toBe(true);
    expect(s.descent.killsOnFloor).toBe(0); // floor 20 is a boss floor: one enemy
    expect(s.stats.bossesDefeated).toBe(0);
    expect(s.settings.buyAmount).toBe(10);
  });
});

describe('migrations', () => {
  const steps = {
    0: (s: RawSave) => ({ ...s, renamed: (s as { old?: number }).old ?? 0 }),
    1: (s: RawSave) => ({ ...s, added: 'yes' }),
  };

  it('applies every step in order and stamps the version', () => {
    const out = migrate({ old: 5 }, steps, 2);
    expect(out).toMatchObject({ version: 2, renamed: 5, added: 'yes' });
  });

  it('starts from the save version, skipping steps already applied', () => {
    const out = migrate({ version: 1 }, steps, 2);
    expect(out).toMatchObject({ version: 2, added: 'yes' });
    expect(out).not.toHaveProperty('renamed');
  });

  it('refuses saves from a newer build', () => {
    expect(() => migrate({ version: 99 }, steps, 2)).toThrow(SaveVersionError);
  });
});

describe('SaveStore', () => {
  it('saves and loads, keeping the previous save as backup', () => {
    const storage = memoryStorage();
    const store = new SaveStore(storage);
    const s = createInitialState(0, 1);
    s.resources.bones = D(100);
    store.save(s);
    s.resources.bones = D(200);
    store.save(s);

    expect(decodeSave(storage.map.get(BACKUP_KEY)!).resources.bones.eq(100)).toBe(true);
    const loaded = store.load();
    expect(loaded.source).toBe('main');
    expect(loaded.state.resources.bones.eq(200)).toBe(true);
  });

  it('falls back to the backup when the main save is corrupt', () => {
    const storage = memoryStorage();
    const store = new SaveStore(storage);
    const s = createInitialState(0, 1);
    buyMinion(s, 'skeletonWarrior', 1); // can't afford: owned stays 0
    s.descent.floor = 9;
    store.save(s);
    store.save(s);
    storage.map.set(SAVE_KEY, 'BB1:garbage');

    const loaded = store.load();
    expect(loaded.source).toBe('backup');
    expect(loaded.state.descent.floor).toBe(9);
    expect(loaded.error).toBeDefined();
  });

  it('starts a new game when nothing is stored', () => {
    const loaded = new SaveStore(memoryStorage()).load();
    expect(loaded.source).toBe('new');
    expect(loaded.error).toBeUndefined();
  });

  it('reports failure instead of throwing when storage is unavailable', () => {
    const broken: SaveStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const store = new SaveStore(broken);
    expect(store.save(createInitialState())).toBe(false);
    expect(store.load().source).toBe('new');
    expect(() => store.clear()).not.toThrow();
  });
});
