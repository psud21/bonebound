import { D, type DecimalSource } from './bignum';

export type Notation = 'short' | 'scientific' | 'engineering';

const SHORT_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
/** Beyond 'zz' we fall back to scientific. */
const MAX_LETTER_TIERS = LETTERS.length * LETTERS.length;

function suffixForTier(tier: number): string | null {
  if (tier < SHORT_SUFFIXES.length) return SHORT_SUFFIXES[tier] ?? '';
  const k = tier - SHORT_SUFFIXES.length;
  if (k >= MAX_LETTER_TIERS) return null;
  return LETTERS[Math.floor(k / LETTERS.length)]! + LETTERS[k % LETTERS.length]!;
}

/** 3 significant figures for a mantissa in [1, 1000). */
function fixedMantissa(m: number): string {
  const decimals = m < 10 ? 2 : m < 100 ? 1 : 0;
  return m.toFixed(decimals);
}

function formatSmall(x: number): string {
  if (Number.isInteger(x)) return x.toString();
  if (x < 10) return x.toFixed(2);
  if (x < 100) return x.toFixed(1);
  return Math.floor(x).toString();
}

/**
 * Format a number for display.
 * Under 1000 it prints plainly. Above that it uses the chosen notation.
 */
export function formatNumber(value: DecimalSource, notation: Notation = 'short'): string {
  const d = D(value);
  if (d.sign < 0) return '-' + formatNumber(d.neg(), notation);
  if (d.lt(1000)) return formatSmall(d.toNumber());

  const log = d.log10();
  // Absurdly large (layer 2+): show as e<formatted exponent>.
  if (log.gte(1e15)) return 'e' + formatNumber(log, notation);

  let exp = Math.floor(log.toNumber());
  // Guard against floating error right at a power of ten (e.g. log10(1000) = 2.9999...).
  let mantissa = d.div(D(10).pow(exp)).toNumber();
  if (mantissa >= 10) {
    mantissa /= 10;
    exp += 1;
  } else if (mantissa < 1) {
    mantissa *= 10;
    exp -= 1;
  }

  if (notation === 'scientific') {
    let m = mantissa.toFixed(2);
    if (Number(m) >= 10) {
      m = (Number(m) / 10).toFixed(2);
      exp += 1;
    }
    return `${m}e${exp}`;
  }

  // Short and engineering both group by powers of 1000.
  let tier = Math.floor(exp / 3);
  let m = mantissa * 10 ** (exp - tier * 3);
  let text = fixedMantissa(m);
  if (Number(text) >= 1000) {
    tier += 1;
    m /= 1000;
    text = fixedMantissa(m);
  }

  if (notation === 'engineering') return `${text}e${tier * 3}`;

  const suffix = suffixForTier(tier);
  if (suffix === null) return formatNumber(d, 'scientific');
  return text + suffix;
}

/** Human-readable duration: "45s", "3m 12s", "2h 5m", "3d 4h". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
