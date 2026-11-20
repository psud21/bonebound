/**
 * Global tuning knobs. These are first-pass values for M0;
 * M1 tunes them against the simulator's pacing report.
 */
export const BALANCE = {
  /** Enemy HP on floor f is FLOOR_HP_BASE × FLOOR_HP_GROWTH^f. */
  FLOOR_HP_BASE: 10,
  FLOOR_HP_GROWTH: 1.17,
  /** Enemies to kill before the next floor opens. */
  KILLS_PER_FLOOR: 5,
  /** Bones awarded per point of enemy max HP on kill. */
  BONES_PER_HP: 0.5,
  /** Damage of one Siphon click before upgrades. */
  BASE_CLICK_DAMAGE: 1,
  /** Offline progress cap before upgrades, in seconds (8h). */
  BASE_OFFLINE_CAP_SECONDS: 8 * 3600,
} as const;
