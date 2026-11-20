import { describe, expect, it } from 'vitest';
import { D } from '../src/engine/bignum';
import { formatDuration, formatNumber } from '../src/engine/format';

describe('formatNumber (short)', () => {
  it.each([
    [0, '0'],
    [7, '7'],
    [3.14159, '3.14'],
    [42.5, '42.5'],
    [999, '999'],
    [1000, '1.00K'],
    [1234, '1.23K'],
    [12_345, '12.3K'],
    [123_456, '123K'],
    [1e6, '1.00M'],
    [2.5e9, '2.50B'],
    [1e12, '1.00T'],
    [1e33, '1.00Dc'],
    [1e36, '1.00aa'],
    [1e39, '1.00ab'],
  ])('%s → %s', (input, expected) => {
    expect(formatNumber(input)).toBe(expected);
  });

  it('rolls over to the next suffix instead of printing 1000K', () => {
    expect(formatNumber(999_999)).toBe('1.00M');
  });

  it('formats negatives', () => {
    expect(formatNumber(-1500)).toBe('-1.50K');
  });

  it('falls back to scientific past the last letter suffix', () => {
    expect(formatNumber(D('1e5000'))).toBe('1.00e5000');
  });

  it('handles absurdly large numbers', () => {
    expect(formatNumber(D('ee20'))).toMatch(/^e/);
  });
});

describe('formatNumber (scientific / engineering)', () => {
  it('scientific', () => {
    expect(formatNumber(123_456, 'scientific')).toBe('1.23e5');
    expect(formatNumber(D('4.56e300'), 'scientific')).toBe('4.56e300');
    expect(formatNumber(9_999_999, 'scientific')).toBe('1.00e7');
  });

  it('engineering', () => {
    expect(formatNumber(123_456, 'engineering')).toBe('123e3');
    expect(formatNumber(1_234_567, 'engineering')).toBe('1.23e6');
  });

  it('leaves small numbers plain in every notation', () => {
    expect(formatNumber(512, 'scientific')).toBe('512');
    expect(formatNumber(512, 'engineering')).toBe('512');
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0s'],
    [45, '45s'],
    [192, '3m 12s'],
    [7500, '2h 5m'],
    [273_600, '3d 4h'],
  ])('%s → %s', (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});
