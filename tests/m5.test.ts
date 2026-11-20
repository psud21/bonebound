import { describe, expect, it } from 'vitest';
import { inflateRawSync } from 'node:zlib';
import { D } from '../src/engine/bignum';
import { decodeSave, encodeSave } from '../src/engine/save';
import { createInitialState } from '../src/engine/state';
import { dismissHint, updateTutorial } from '../src/systems/tutorial';
import { crc32, zip } from '../scripts/release';

describe('tutorial hints', () => {
  it('starts with Siphon and moves on once the player has done it', () => {
    const s = createInitialState(0, 1);
    expect(updateTutorial(s)?.id).toBe('siphon');
    s.stats.totalClicks = 5;
    expect(updateTutorial(s)).toBeNull(); // nothing else applies yet
    expect(s.tutorial.seen).toContain('siphon');
    s.resources.bones = D(12);
    expect(updateTutorial(s)?.id).toBe('firstMinion');
  });

  it('can be dismissed one at a time or switched off', () => {
    const s = createInitialState(0, 1);
    dismissHint(s, 'siphon');
    expect(updateTutorial(s)).toBeNull();
    s.resources.bones = D(12);
    expect(updateTutorial(s)?.id).toBe('firstMinion');
    s.settings.hints = false;
    expect(updateTutorial(s)).toBeNull();
  });

  it('never shows a hint for something already done', () => {
    const s = createInitialState(0, 1);
    s.stats.totalClicks = 50;
    s.army.minions.skeletonWarrior!.owned = 3;
    s.resources.bones = D(1e6);
    const shown = updateTutorial(s);
    expect(shown?.id).not.toBe('firstMinion');
    expect(s.tutorial.seen).toEqual(expect.arrayContaining(['siphon', 'firstMinion']));
  });
});

describe('settings in save v6', () => {
  it('round-trips and cleans sound, volume, hint and motion settings', () => {
    const s = createInitialState(0, 1);
    s.settings.sound = false;
    s.settings.volume = 0.25;
    s.settings.reduceMotion = true;
    s.tutorial.seen = ['siphon'];
    const back = decodeSave(encodeSave(s));
    expect(back.settings).toMatchObject({ sound: false, volume: 0.25, reduceMotion: true, hints: true });
    expect(back.tutorial.seen).toEqual(['siphon']);

    const raw = JSON.parse(atob(encodeSave(s).slice(4)));
    raw.settings.volume = 7;
    raw.tutorial.seen = ['ok', 3, 'ok'];
    expect(decodeSave('BB1:' + btoa(JSON.stringify(raw))).settings.volume).toBe(1);
    expect(decodeSave('BB1:' + btoa(JSON.stringify(raw))).tutorial.seen).toEqual(['ok']);
  });

  it('marks the basic hints seen for players upgrading from v5', () => {
    const s = createInitialState(0, 1);
    const raw = JSON.parse(atob(encodeSave(s).slice(4)));
    raw.version = 5;
    delete raw.tutorial;
    delete raw.settings.sound;
    const back = decodeSave('BB1:' + btoa(JSON.stringify(raw)));
    expect(back.tutorial.seen).toContain('siphon');
    expect(back.settings.sound).toBe(true);
  });
});

describe('release zip', () => {
  it('computes the standard CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('writes entries that inflate back to the original bytes', () => {
    const data = new TextEncoder().encode('<!doctype html><title>Bonebound</title>'.repeat(20));
    const archive = zip([{ path: 'index.html', data }]);
    expect(archive.readUInt32LE(0)).toBe(0x04034b50);
    const nameLength = archive.readUInt16LE(26);
    const packedSize = archive.readUInt32LE(18);
    expect(archive.subarray(30, 30 + nameLength).toString()).toBe('index.html');
    const packed = archive.subarray(30 + nameLength, 30 + nameLength + packedSize);
    expect(new Uint8Array(inflateRawSync(packed))).toEqual(data);
    // End-of-central-directory record lists one file.
    expect(archive.readUInt32LE(archive.length - 22)).toBe(0x06054b50);
    expect(archive.readUInt16LE(archive.length - 12)).toBe(1);
  });
});
