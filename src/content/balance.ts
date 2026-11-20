/**
 * Global tuning knobs. Pacing is checked with `npm run sim` against PLAN.md section 6.
 */
export const BALANCE = {
  /** Enemy HP on floor f is FLOOR_HP_BASE × FLOOR_HP_GROWTH^f. */
  FLOOR_HP_BASE: 10,
  FLOOR_HP_GROWTH: 1.22,
  /** Enemies to kill before the next floor opens (boss floors have one enemy). */
  KILLS_PER_FLOOR: 5,
  /** Bosses have this many times a normal enemy's HP. */
  BOSS_HP_MULT: 10,
  /** Seconds to defeat a boss before being pushed back a floor. */
  BOSS_TIMER_SECONDS: 30,
  /** Bones awarded per point of enemy max HP on kill, on floor 1. */
  BONES_PER_HP: 0.055,
  /** Bones per HP shrinks by this factor each floor, so deeper floors pay less per hit. */
  BONES_PER_HP_DECAY: 0.98,
  /** Below this floor (the end of Layer 1), HP and Bones follow the deeper curve. */
  DEEP_FROM_FLOOR: 100,
  DEEP_HP_GROWTH: 1.22,
  DEEP_BONES_PER_HP_DECAY: 0.98,
  /** Damage of one Siphon click before upgrades. */
  BASE_CLICK_DAMAGE: 1,
  /** Crypt output multiplier per floor reached: DEPTH_BONUS^(maxFloor − 1). */
  DEPTH_BONUS: 1.015,
  /** Offline progress cap before upgrades, in seconds (8h). */
  BASE_OFFLINE_CAP_SECONDS: 8 * 3600,
  /** Wandering Soul: seconds between appearances, and how long it lingers. */
  SOUL_MIN_DELAY: 90,
  SOUL_MAX_DELAY: 240,
  SOUL_LIFETIME: 13,
  /** Chronicle entries kept in the save. */
  LOG_LIMIT: 40,
} as const;
