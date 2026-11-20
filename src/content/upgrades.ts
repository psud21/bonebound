/** Conditions are plain data so they're easy to test, list and balance. */
export type Condition =
  | { kind: 'minionOwned'; id: string; count: number }
  | { kind: 'graveworksOwned'; id: string; count: number }
  | { kind: 'maxFloor'; floor: number }
  | { kind: 'clicks'; count: number }
  | { kind: 'unlocked'; id: string };

export type Effect =
  | { kind: 'minionMult'; id: string; mult: number }
  | { kind: 'allDamageMult'; mult: number }
  | { kind: 'clickFlat'; amount: number }
  | { kind: 'clickDpsPercent'; percent: number }
  | { kind: 'cryptMult'; mult: number }
  | { kind: 'graveworksMult'; id: string; mult: number }
  | { kind: 'bonesMult'; mult: number }
  | { kind: 'bossTimer'; seconds: number }
  | { kind: 'soulFrequency'; mult: number };

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  flavor: string;
  cost: number;
  /** Shown in the shop once this is true. */
  unlock: Condition;
  effects: readonly Effect[];
}

const minion = (id: string, count: number): Condition => ({ kind: 'minionOwned', id, count });
const MINION_IDS: Readonly<Record<string, string>> = {
  'Skeleton Warriors': 'skeletonWarrior',
  'Skeletal Archers': 'skeletalArcher',
  Ghouls: 'ghoul',
  'Bone Mages': 'boneMage',
  Wraiths: 'wraith',
  Abominations: 'abomination',
  'Bone Golems': 'boneGolem',
  'Death Knights': 'deathKnight',
  Banshees: 'banshee',
  Dracoliches: 'dracolich',
};
const works = (id: string, count: number): Condition => ({ kind: 'graveworksOwned', id, count });
const floor = (f: number): Condition => ({ kind: 'maxFloor', floor: f });

export const UPGRADES: readonly UpgradeDef[] = [
  // Skeleton Warriors
  {
    id: 'sharpenedPhalanges',
    name: 'Sharpened Phalanges',
    description: 'Skeleton Warriors deal double damage.',
    flavor: 'Point the pointy end at the enemy.',
    cost: 100,
    unlock: minion('skeletonWarrior', 5),
    effects: [{ kind: 'minionMult', id: 'skeletonWarrior', mult: 2 }],
  },
  {
    id: 'rustedCleavers',
    name: 'Rusted Cleavers',
    description: 'Skeleton Warriors deal double damage.',
    flavor: 'Tetanus is a weapon, technically.',
    cost: 6_000,
    unlock: minion('skeletonWarrior', 25),
    effects: [{ kind: 'minionMult', id: 'skeletonWarrior', mult: 2 }],
  },
  {
    id: 'legionDrill',
    name: 'Legion Drill',
    description: 'Skeleton Warriors deal triple damage.',
    flavor: 'Left. Left. Left-ish.',
    cost: 2_000_000,
    unlock: minion('skeletonWarrior', 100),
    effects: [{ kind: 'minionMult', id: 'skeletonWarrior', mult: 3 }],
  },
  // Archers
  {
    id: 'fletchedRibs',
    name: 'Fletched Ribs',
    description: 'Skeletal Archers deal double damage.',
    flavor: 'Aerodynamics, the hard way.',
    cost: 1_500,
    unlock: minion('skeletalArcher', 5),
    effects: [{ kind: 'minionMult', id: 'skeletalArcher', mult: 2 }],
  },
  {
    id: 'deadEye',
    name: 'Dead Eye',
    description: 'Skeletal Archers deal triple damage.',
    flavor: 'They only have the one. It is very good.',
    cost: 400_000,
    unlock: minion('skeletalArcher', 50),
    effects: [{ kind: 'minionMult', id: 'skeletalArcher', mult: 3 }],
  },
  // Ghouls
  {
    id: 'graveHunger',
    name: 'Grave Hunger',
    description: 'Ghouls deal double damage.',
    flavor: 'Snacks are motivating.',
    cost: 20_000,
    unlock: minion('ghoul', 5),
    effects: [{ kind: 'minionMult', id: 'ghoul', mult: 2 }],
  },
  {
    id: 'packFrenzy',
    name: 'Pack Frenzy',
    description: 'Ghouls deal triple damage.',
    flavor: 'Hungrier together.',
    cost: 5_000_000,
    unlock: minion('ghoul', 50),
    effects: [{ kind: 'minionMult', id: 'ghoul', mult: 3 }],
  },
  // Bone Mages
  {
    id: 'arcaneMarrow',
    name: 'Arcane Marrow',
    description: 'Bone Mages deal double damage.',
    flavor: 'Magic is mostly calcium, it turns out.',
    cost: 300_000,
    unlock: minion('boneMage', 5),
    effects: [{ kind: 'minionMult', id: 'boneMage', mult: 2 }],
  },
  // Wraiths
  {
    id: 'bitterWail',
    name: 'Bitter Wail',
    description: 'Wraiths deal double damage.',
    flavor: 'Their complaints are now weaponized.',
    cost: 5_000_000,
    unlock: minion('wraith', 5),
    effects: [{ kind: 'minionMult', id: 'wraith', mult: 2 }],
  },
  // Abominations
  {
    id: 'stitchwork',
    name: 'Stitchwork',
    description: 'Abominations deal double damage.',
    flavor: 'Measure twice, stitch once, regret forever.',
    cost: 100_000_000,
    unlock: minion('abomination', 5),
    effects: [{ kind: 'minionMult', id: 'abomination', mult: 2 }],
  },
  // Siphon
  {
    id: 'marrowSiphon',
    name: 'Marrow Siphon',
    description: 'Siphon gains +1% of army DPS per click.',
    flavor: 'Drink deeply.',
    cost: 500,
    unlock: { kind: 'clicks', count: 50 },
    effects: [{ kind: 'clickDpsPercent', percent: 1 }],
  },
  {
    id: 'deepSiphon',
    name: 'Deep Siphon',
    description: 'Siphon gains +2% of army DPS per click.',
    flavor: 'Drink deeper.',
    cost: 60_000,
    unlock: { kind: 'clicks', count: 300 },
    effects: [{ kind: 'clickDpsPercent', percent: 2 }],
  },
  {
    id: 'abyssalSiphon',
    name: 'Abyssal Siphon',
    description: 'Siphon gains +4% of army DPS per click.',
    flavor: 'Stop drinking. Please.',
    cost: 50_000_000,
    unlock: { kind: 'clicks', count: 1000 },
    effects: [{ kind: 'clickDpsPercent', percent: 4 }],
  },
  {
    id: 'bonyKnuckles',
    name: 'Bony Knuckles',
    description: 'Siphon deals +4 base damage.',
    flavor: 'For when magic feels too subtle.',
    cost: 50,
    unlock: { kind: 'clicks', count: 15 },
    effects: [{ kind: 'clickFlat', amount: 4 }],
  },
  // Crypt
  {
    id: 'tighterBurial',
    name: 'Tighter Burial',
    description: 'Shallow Graves produce triple Bones.',
    flavor: 'Lie still. Lie closer.',
    cost: 2_500,
    unlock: works('shallowGraves', 10),
    effects: [{ kind: 'graveworksMult', id: 'shallowGraves', mult: 3 }],
  },
  {
    id: 'embalmersSalts',
    name: "Embalmer's Salts",
    description: 'Embalming Pits produce triple Bones.',
    flavor: 'Pickled, for freshness.',
    cost: 45_000,
    unlock: works('embalmingPit', 10),
    effects: [{ kind: 'graveworksMult', id: 'embalmingPit', mult: 3 }],
  },
  {
    id: 'ossuaryReliquary',
    name: 'Ossuary Reliquary',
    description: 'Ossuaries produce triple Bones.',
    flavor: 'A saint’s pinky is worth ten of yours.',
    cost: 3_000_000,
    unlock: works('ossuary', 10),
    effects: [{ kind: 'graveworksMult', id: 'ossuary', mult: 3 }],
  },
  {
    id: 'bloodPump',
    name: 'Blood Pump',
    description: 'Blood Fountains produce triple Bones.',
    flavor: 'Decorative, they said.',
    cost: 80_000_000,
    unlock: works('bloodFountain', 10),
    effects: [{ kind: 'graveworksMult', id: 'bloodFountain', mult: 3 }],
  },
  {
    id: 'gravekeepersLedger',
    name: "Gravekeeper's Ledger",
    description: 'All Crypt production doubled.',
    flavor: 'Taken from Gravekeeper Morrow. He won’t need it.',
    cost: 150_000,
    unlock: floor(20),
    effects: [{ kind: 'cryptMult', mult: 2 }],
  },
  // Global
  {
    id: 'patienceOfTheDead',
    name: 'Patience of the Dead',
    description: 'Boss timer +10 seconds.',
    flavor: 'You have all the time in the world. Almost.',
    cost: 400_000,
    unlock: floor(30),
    effects: [{ kind: 'bossTimer', seconds: 10 }],
  },
  {
    id: 'soulLantern',
    name: 'Soul Lantern',
    description: 'Wandering Souls appear 50% more often.',
    flavor: 'Moths, but for the dead.',
    cost: 2_500_000,
    unlock: floor(25),
    effects: [{ kind: 'soulFrequency', mult: 1.5 }],
  },
  {
    id: 'necroticPact',
    name: 'Necrotic Pact',
    description: 'All minions deal double damage.',
    flavor: 'Sign here. And here. And in blood, here.',
    cost: 10_000_000,
    unlock: floor(40),
    effects: [{ kind: 'allDamageMult', mult: 2 }],
  },
  {
    id: 'boneTithe',
    name: 'Bone Tithe',
    description: 'All Bones gained ×1.5.',
    flavor: 'The dead pay their dues.',
    cost: 150_000_000,
    unlock: floor(50),
    effects: [{ kind: 'bonesMult', mult: 1.5 }],
  },
  {
    id: 'necroticPactII',
    name: 'Covenant of Rot',
    description: 'All minions deal double damage.',
    flavor: 'The fine print was mostly screaming.',
    cost: 5_000_000_000,
    unlock: floor(65),
    effects: [{ kind: 'allDamageMult', mult: 2 }],
  },
  {
    id: 'crownOfMarrow',
    name: 'Crown of Marrow',
    description: 'All minions deal double damage and Crypt production doubled.',
    flavor: 'Heavy is the skull.',
    cost: 500_000_000_000,
    unlock: floor(80),
    effects: [
      { kind: 'allDamageMult', mult: 2 },
      { kind: 'cryptMult', mult: 2 },
    ],
  },
  ...deepUpgrades(),
];

/** Upgrades for the deeper minions, graveworks and Layers 2–4 (M3). */
function deepUpgrades(): UpgradeDef[] {
  const times = (mult: number) => (mult === 2 ? 'double' : mult === 3 ? 'triple' : `×${mult}`);
  const m = (id: string, name: string, flavor: string, owned: number, mult: number, cost: number, group: string): UpgradeDef => ({
    id,
    name,
    description: `${group} deal ${times(mult)} damage.`,
    flavor,
    cost,
    unlock: minion(MINION_IDS[group]!, owned),
    effects: [{ kind: 'minionMult', id: MINION_IDS[group]!, mult }],
  });
  const g = (id: string, name: string, flavor: string, worksId: string, label: string, owned: number, mult: number, cost: number): UpgradeDef => ({
    id,
    name,
    description: `${label} produce ×${mult} Bones.`,
    flavor,
    cost,
    unlock: works(worksId, owned),
    effects: [{ kind: 'graveworksMult', id: worksId, mult }],
  });
  const d = (id: string, name: string, flavor: string, f: number, cost: number, effects: Effect[], description: string): UpgradeDef => ({
    id,
    name,
    description,
    flavor,
    cost,
    unlock: floor(f),
    effects,
  });
  const dmg = (mult: number): Effect => ({ kind: 'allDamageMult', mult });
  const bones = (mult: number): Effect => ({ kind: 'bonesMult', mult });
  return [
    // Older minions, deeper ranks
    m('arcaneArchive', 'Arcane Archive', 'Footnotes, weaponized.', 50, 3, 2e9, 'Bone Mages'),
    m('grudgeEternal', 'Grudge Eternal', 'They have not forgiven. They will not.', 50, 3, 3e10, 'Wraiths'),
    m('moreStitches', 'More Stitches', 'If in doubt, add an arm.', 50, 3, 5e11, 'Abominations'),
    m('boneTide', 'Bone Tide', 'Two hundred skeletons is a weather system.', 200, 5, 1e12, 'Skeleton Warriors'),
    m('ribcageVolley', 'Ribcage Volley', 'Every rib a bolt, every bolt a rib.', 150, 4, 5e12, 'Skeletal Archers'),
    m('bottomlessHunger', 'Bottomless Hunger', 'Still hungry. Still not full.', 150, 4, 2e13, 'Ghouls'),
    // New minions
    m('marrowMortar', 'Marrow Mortar', 'Holds a golem together, mostly.', 5, 2, 3e9, 'Bone Golems'),
    m('ossifiedCore', 'Ossified Core', 'A heart of bone, beating once a century.', 50, 3, 3e13, 'Bone Golems'),
    m('oathboundSteel', 'Oathbound Steel', 'Forged from broken promises.', 5, 2, 8e10, 'Death Knights'),
    m('blackBanner', 'The Black Banner', 'Nobody remembers the old colours.', 50, 3, 1e15, 'Death Knights'),
    m('keeningChoir', 'Keening Choir', 'Harmony is optional. Volume is not.', 5, 2, 2e12, 'Banshees'),
    m('lastLament', 'The Last Lament', 'The note that ends things.', 50, 3, 3e16, 'Banshees'),
    m('wyrmRites', 'Grave Wyrm Rites', 'Old dragons, new tricks.', 5, 2, 8e13, 'Dracoliches'),
    m('drownedHoard', 'The Drowned Hoard', 'A dragon never forgets its gold. Or its grudges.', 50, 3, 1e18, 'Dracoliches'),
    // New graveworks
    g('sharperMillstones', 'Sharper Millstones', 'Finer powder, finer profit.', 'boneMill', 'Bone Mills', 10, 3, 2e9),
    g('ceaselessMass', 'Ceaseless Mass', 'The service never ends. Neither does the collection plate.', 'cathedralOfRot', 'Cathedrals of Rot', 10, 3, 6e10),
    g('millOfAges', 'Mill of Ages', 'It grinds the years, too.', 'boneMill', 'Bone Mills', 50, 4, 1e14),
    g('rotSynod', 'The Rot Synod', 'Decay, by committee.', 'cathedralOfRot', 'Cathedrals of Rot', 50, 4, 1e16),
    // Layer 2: the Drowned Catacombs
    d('drownedLitany', 'Drowned Litany', 'Sung underwater. Heard anyway.', 105, 2e11, [dmg(2)], 'All minions deal double damage.'),
    d('saltCuredBones', 'Salt-Cured Bones', 'Keeps for centuries. Sells for more.', 115, 3e12, [bones(2)], 'All Bones gained doubled.'),
    d('tidebreakerHymn', 'Tidebreaker Hymn', 'The sea parts for the dead.', 135, 1e14, [dmg(3)], 'All minions deal triple damage.'),
    d('leechOil', 'Leech Oil', 'Squeezed from the Leech Sovereign. Do not ask how.', 150, 1e15, [bones(2)], 'All Bones gained doubled.'),
    d('abyssalSurvey', 'Abyssal Survey', 'Every grave mapped, every bone counted.', 165, 5e15, [{ kind: 'cryptMult', mult: 5 }], 'Crypt production ×5.'),
    d('krakenInkWards', 'Kraken-Ink Wards', 'Written in a hand with too many fingers.', 180, 1e17, [dmg(3)], 'All minions deal triple damage.'),
    d('drownedCrown', 'The Drowned Crown', 'Still dripping.', 200, 2e18, [dmg(3)], 'All minions deal triple damage.'),
    // Layer 3: the Ashen Wastes
    d('cinderPsalms', 'Cinder Psalms', 'Hymns that leave scorch marks.', 215, 5e19, [bones(3)], 'All Bones gained tripled.'),
    d('slagForgedSpines', 'Slag-Forged Spines', 'Heavier. Hotter. Better.', 230, 1e21, [dmg(3)], 'All minions deal triple damage.'),
    d('ashLiturgy', 'Ash Liturgy', 'Dust to dust, and then some.', 250, 3e22, [dmg(4)], 'All minions deal ×4 damage.'),
    d('furnaceHearts', 'Furnace Hearts', 'They beat with borrowed fire.', 270, 1e24, [bones(3)], 'All Bones gained tripled.'),
    d('emberChoir', 'Ember Choir', 'They sing until they burn out. Then they sing louder.', 290, 3e25, [dmg(4)], 'All minions deal ×4 damage.'),
    // Layer 4: the Weeping Glacier
    d('rimeShrouds', 'Rime Shrouds', 'Cold comfort, literally.', 310, 1e27, [dmg(4)], 'All minions deal ×4 damage.'),
    d('glacialPatience', 'Glacial Patience', 'The ice has all the time in the world. Now so do you.', 340, 1e29, [{ kind: 'bossTimer', seconds: 10 }], 'Guardian timer +10 seconds.'),
    d('frozenChoir', 'The Frozen Choir', 'Every voice a different crack in the ice.', 360, 1e30, [dmg(5)], 'All minions deal ×5 damage.'),
    d('tearsOfTheGlacier', 'Tears of the Glacier', 'They freeze into Bones on the way down.', 380, 1e32, [bones(4)], 'All Bones gained ×4.'),
  ];
}

export const UPGRADES_BY_ID: Readonly<Record<string, UpgradeDef>> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u]),
);
