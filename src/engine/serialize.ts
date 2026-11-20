import { Decimal, isDecimal } from './bignum';

/** Decimals are stored as {"__d": "1.5e300"} so they survive JSON and come back as Decimals. */
const DECIMAL_TAG = '__d';

export function toJson(value: unknown): string {
  return JSON.stringify(value, function (this: Record<string, unknown>, key, v) {
    const raw = this[key];
    if (isDecimal(raw)) return { [DECIMAL_TAG]: raw.toString() };
    return v;
  });
}

export function fromJson(text: string): unknown {
  return JSON.parse(text, (_key, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v) && DECIMAL_TAG in v && Object.keys(v).length === 1) {
      return new Decimal(v[DECIMAL_TAG]);
    }
    return v;
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !isDecimal(value);
}

/**
 * Fills anything missing from `loaded` with values from `defaults`, recursively.
 * Keys only present in `loaded` are kept (e.g. entries in a Record).
 * When the default is a Decimal and the loaded value isn't, it's converted.
 */
export function mergeDefaults<T>(defaults: T, loaded: unknown): T {
  if (isDecimal(defaults)) {
    if (isDecimal(loaded)) return loaded as T;
    if (typeof loaded === 'number' || typeof loaded === 'string') {
      const d = new Decimal(loaded);
      return (Number.isNaN(d.mag) ? defaults : d) as T;
    }
    return defaults;
  }
  if (isPlainObject(defaults)) {
    if (!isPlainObject(loaded)) return defaults;
    const out: Record<string, unknown> = { ...loaded };
    for (const [key, def] of Object.entries(defaults)) {
      out[key] = key in loaded ? mergeDefaults(def, loaded[key]) : def;
    }
    return out as T;
  }
  if (loaded === undefined || loaded === null) return defaults;
  if (defaults !== null && defaults !== undefined && typeof loaded !== typeof defaults) return defaults;
  return loaded as T;
}
