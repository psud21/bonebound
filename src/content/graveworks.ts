import type { IconName } from '../ui/icons.generated';

export interface GraveworksDef {
  id: string;
  icon: IconName;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  /** Seconds per production cycle before speed milestones. */
  cycleSeconds: number;
  /** Bones produced per unit owned, per cycle. */
  revenue: number;
  /** The Lich Warden who automates this graveworks. */
  warden: { name: string; cost: number; quirk: string };
}

export const GRAVEWORKS: readonly GraveworksDef[] = [
  {
    id: 'shallowGraves',
    icon: 'hasty-grave',
    name: 'Shallow Graves',
    description: 'Dig. Find bones. Repeat.',
    baseCost: 30,
    costGrowth: 1.07,
    cycleSeconds: 2,
    revenue: 0.245,
    warden: { name: 'Warden Mossjaw', cost: 1_000, quirk: 'Hums while digging. Nobody asked.' },
  },
  {
    id: 'embalmingPit',
    icon: 'mummy-head',
    name: 'Embalming Pit',
    description: 'Preserves the good bits.',
    baseCost: 600,
    costGrowth: 1.12,
    cycleSeconds: 6,
    revenue: 8.4,
    warden: { name: 'Warden Sallow', cost: 18_000, quirk: 'Smells faintly of cloves and regret.' },
  },
  {
    id: 'ossuary',
    icon: 'skull-crossed-bones',
    name: 'Ossuary',
    description: 'Bones, sorted by size, then by attitude.',
    baseCost: 12_000,
    costGrowth: 1.13,
    cycleSeconds: 20,
    revenue: 231,
    warden: { name: 'Warden Calcine', cost: 350_000, quirk: 'Keeps a ledger of every femur.' },
  },
  {
    id: 'bloodFountain',
    icon: 'chalice-drops',
    name: 'Blood Fountain',
    description: 'It never runs dry. Nobody checks why.',
    baseCost: 250_000,
    costGrowth: 1.14,
    cycleSeconds: 60,
    revenue: 7000,
    warden: { name: 'Warden Vesper', cost: 6_000_000, quirk: 'Insists the fountain is "decorative."' },
  },
  {
    id: 'boneMill',
    icon: 'water-mill',
    name: 'Bone Mill',
    description: 'Grinds the old dead into something useful.',
    baseCost: 8_000_000,
    costGrowth: 1.15,
    cycleSeconds: 180,
    revenue: 320_000,
    warden: { name: 'Warden Gristle', cost: 150_000_000, quirk: 'Counts every turn of the wheel aloud.' },
  },
  {
    id: 'cathedralOfRot',
    icon: 'church',
    name: 'Cathedral of Rot',
    description: 'A congregation that never leaves, and never stops giving.',
    baseCost: 300_000_000,
    costGrowth: 1.16,
    cycleSeconds: 600,
    revenue: 18_000_000,
    warden: { name: 'Warden Hollowmass', cost: 6_000_000_000, quirk: 'Delivers a sermon to the mould every morning.' },
  },
];

export const GRAVEWORKS_BY_ID: Readonly<Record<string, GraveworksDef>> = Object.fromEntries(
  GRAVEWORKS.map((g) => [g.id, g]),
);

/** Owning this many of a graveworks halves its cycle time (each threshold stacks). */
export const GRAVEWORKS_MILESTONES: readonly number[] = [25, 50, 100, 200, 300, 400, 500];
