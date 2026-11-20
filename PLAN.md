# Bonebound: The Descent — Game Plan

> Working title. A dark-fantasy incremental game: you're a necromancer whose undead army fights its way down a bottomless abyss.
> Inspirations: Cookie Clicker (clicking, events, personality), AdVenture Capitalist (timed production, managers, milestone bonuses), Magic Research (layered unlocks, schools of magic, story), Diablo-style ARPGs (loot, item stats, sets, endgame pushing).

---

## 1. Premise

The Church cast you out for raising the dead. You wake up in a ruined crypt at the edge of **the Abyss**, a pit that seems to have no bottom. A voice from far below promises power for every layer you conquer.

You raise the dead, build up your crypt, and send your army down. Each layer of the Abyss is stranger and deadlier than the last. Each time you're destroyed, your soul retreats to your **phylactery** and you come back stronger.

The mystery of who the voice is, and what waits at the bottom, comes out gradually through story text that unlocks with depth.

## 2. Design pillars

1. **Always something to buy within about 30 seconds.** That means a few seconds early on and a few minutes late game.
2. **A new system every 20–40 minutes** for the first several hours.
3. **Hitting a wall means it's time to prestige.** A boss you can't beat isn't a failure. It tells you it's time for Rebirth.
4. **Loot gives you something to hunt for.** Every boss kill could drop an item that changes how you play.
5. **Active play pays off, idle play works.** Clicking, spells and events speed things up, and offline progress is always worth something.

## 3. The core loop: two halves that feed each other

```
        ┌──────────────── THE CRYPT (economy) ────────────────┐
        │ Graveworks run on timers and produce Bones           │
        │ Lich Wardens automate them (managers)                │
        └───────────────┬──────────────────────────────────────┘
                        │ Bones
                        ▼
        ┌──────────────── THE ARMY (power) ───────────────────┐
        │ Buy minions → total army DPS                         │
        │ Click "Siphon" for bonus damage and Bones            │
        └───────────────┬──────────────────────────────────────┘
                        │ DPS
                        ▼
        ┌──────────────── THE DESCENT (progression) ──────────┐
        │ Clear floors → Bones, Corpses, Loot, Lore            │
        │ Each depth reached → permanent Depth Bonus to Crypt  │
        │ Boss every 10 floors (30s timer) → the wall          │
        └───────────────┬──────────────────────────────────────┘
                        │ Max floor reached
                        ▼
              PHYLACTERY REBIRTH → Soul Shards → Dark Pact tree
```

- **The Crypt** gives you AdVenture Capitalist-style production timers, managers and milestone bonuses.
- **The Army** gives you Cookie Clicker-style buildings to buy.
- **The Descent** gives you Diablo-style floor pushing and loot.
- **Schools, research and story** give you Magic Research-style depth.

## 4. Resources

| Resource | Source | Spent on | Unlocks |
|---|---|---|---|
| **Bones** | Graveworks, kills, clicking | Minions, graveworks, upgrades | Start |
| **Corpses** | Enemy kills (scale with floor) | Raising **Elite** minions, rituals | ~10 min |
| **Essence** | Regenerates over time (cap upgradable) | Spells | ~40 min |
| **Lore** | Tomes found on floors, the Forbidden Library | Research | ~1 hr |
| **Bone Dust** | Salvaging loot | Rerolling and upgrading items | With loot |
| **Gems** | Elite and boss drops | Item sockets (combine 3 into the next tier) | Layer 2 |
| **Soul Shards** | Phylactery Rebirth | Dark Pact tree; +2% all output each | 1st prestige |
| **Dread** | Lichdom Ascension | Lich powers, Dark Levels | 2nd prestige |

## 5. Systems

### 5.1 Clicking: "Siphon"
- Click the current enemy to deal damage and pull Bones from it.
- Upgrades scale click damage as a percentage of army DPS, so clicking stays relevant all game.
- Later upgrades add **Soul Frenzy** combos, where sustained clicking builds a multiplier.

### 5.2 The Army (minions)
Tiers of minions, each with base DPS and a passive trait:

| # | Minion | Trait (example) |
|---|---|---|
| 1 | Skeleton Warrior | Cheap and plentiful |
| 2 | Skeletal Archer | Bonus vs. bosses |
| 3 | Ghoul | Kills produce extra Corpses |
| 4 | Bone Mage | Splash damage, which helps on swarm floors |
| 5 | Wraith | Ignores armor |
| 6 | Abomination | Gets stronger with more Corpses stored |
| 7 | Bone Golem | Resists Ashen Wastes burn |
| 8 | Death Knight | Boosts all lower-tier minions |
| 9 | Banshee | Lowers boss HP when a fight starts |
| 10 | Dracolich | Huge DPS; unlocked by a story event |

- **Cost:** `base × r^owned`, with `r` between 1.07 and 1.12.
- **Bulk buying:** x1, x10, x100 or Max.
- **Milestones** at 25, 50, 100, 200, 300… owned: double damage, double the attack speed of lower tiers, or unlock a new trait.
- **Elite minions** cost Corpses and Bones. They're a limited number of strong units with equipment slots, introduced in M3.

### 5.3 The Crypt (graveworks)
Production buildings that work like AdVenture Capitalist businesses:

| Graveworks | Cycle | Notes |
|---|---|---|
| Shallow Graves | 1s | Starter |
| Embalming Pit | 6s | |
| Ossuary | 30s | |
| Blood Fountain | 2m | Also trickles Essence |
| Bone Mill | 8m | |
| Cathedral of Rot | 30m | Late-game |

- **Lich Wardens** (managers) automate each graveworks. Each one has a quirk, for example "+50% output, but the cycle takes 10% longer."
- The **Depth Bonus** multiplies all Crypt output by how deep you've gone this run, which ties the economy to the descent.

### 5.4 The Descent
- **Floor HP:** `HP(f) = 10 × 1.17^f`. Bosses have 10x HP and a 30-second timer.
- **Bones per kill** are roughly proportional to floor HP.
- **Failing a boss** drops you back one floor, and you farm automatically until you're strong enough to try again.
- **Visuals are cosmetic.** Combat is simulated as total DPS against total HP, with a few sprites animated on screen. This keeps the simulation cheap and offline progress simple.

**Layers of the Abyss** (each about 100 floors, with its own enemies, loot table and modifier):

| Layer | Floors | Modifier |
|---|---|---|
| 1. The Ossuary Crypts | 1–100 | None (tutorial layer) |
| 2. Drowned Catacombs | 101–200 | Enemies regenerate, so DPS matters |
| 3. Ashen Wastes | 201–300 | Burn kills weak minions over time |
| 4. Weeping Glacier | 301–400 | Attack speed −30% |
| 5. The Flesh Gardens | 401–500 | Enemies spawn adds, so splash damage matters |
| 6. Cathedral Inverted | 501–600 | Holy enemies resist Shadow |
| 7. The Throat of the Void | 600+ | Endless; the endgame |

### 5.5 Random events
- **Wandering Soul:** a ghostly orb drifts across the screen. Click it for one of:
  - **Soul Frenzy:** x7 Bones for 30s
  - **Blood Moon:** x3 DPS for 20s
  - **Grave Rush:** instantly clear 5 floors
  - **Bone Shower:** a burst of Bones
- **Hoarder Imp:** runs across the floor. Kill it before it escapes for a shower of loot and Gems.
- **Inquisition Raid:** paladins attack the Crypt. Click to fight them off, or lose a few minutes of production.

### 5.6 Loot
- **Slots:** Staff, Off-hand (skull or tome), Helm, Chest, Gloves, Boots, Amulet, Ring x2.
- **Rarities:**

| Rarity | Random stats | Special |
|---|---|---|
| Common | 0 | — |
| Magic | 1–2 | — |
| Rare | 3–4 | — |
| Legendary | 4 | One unique power |
| Mythic | 5 | One unique power, enhanced |

- **Random stats (affixes):**
  - +% minion damage
  - +% Bones
  - +% crit chance
  - +click damage
  - +Essence regen
  - +loot find
  - +levels to a school
  - +% damage vs. bosses
- **Legendary powers change how you play.** Examples:
  - "Skeletons explode on death."
  - "Siphon chains to 3 enemies."
  - "Every 10th floor is skipped."
- **Sets:** for example *Grave Lord's Regalia* or *Plaguebringer's Vestments*. Wearing 2, 4 or 6 pieces unlocks bonuses.
- **Salvaging** turns items into Bone Dust. You can use it to reroll one stat or upgrade an item's power. **Auto-salvage filters** (by rarity, or keep only upgrades) keep the inventory from becoming a chore.
- **Sockets and Gems:** Ruby (damage), Emerald (Bones), Amethyst (Essence), Diamond (all).
- **Gear persists through Rebirth.** It's the long-term chase. Deeper floors drop higher item levels.
- **Depth cap (M2 tuning):** an item performs at no more than your deepest floor this run + 10, so end-game relics don't flatten the early floors of a new run. Rarity, stats and legendary powers still carry over in full.

### 5.7 Essence and spells
Spells are timed buffs or instant effects that cost Essence and have cooldowns. Auto-casting unlocks later. Each spell belongs to one of four **Schools of Necromancy**:

| School | Theme | Example spells |
|---|---|---|
| **Bone** | Summons and defense | Bone Armor, Corpse Explosion, Raise Legion |
| **Blood** | Sacrifice for burst | Blood Rite (sacrifice 10% of minions for x10 DPS), Hemorrhage |
| **Plague** | Damage over time; scales with enemy count | Plague Wind, Rot, Pestilence |
| **Shadow** | Curses, crits, Essence | Curse of Frailty, Soul Drain, Eclipse |

- **Schools level up when you cast their spells.** Higher levels mean stronger spells and new spells in that school.
- **Ultimate spell:** *Army of the Dead*, which needs every school at level 25.

### 5.8 Research: the Forbidden Library
- Spend Lore to start research projects that take real time, from a few minutes up to several hours. The longest are the unlocks you want most.
- **Branches:**
  - **Anatomy:** minion upgrades
  - **Thaumaturgy:** spells and Essence
  - **Cartography of the Abyss:** loot and layers
  - **Forbidden Rites:** automation

### 5.9 Prestige layer 1: Phylactery Rebirth
- **Available** once you reach floor 75. The first Rebirth is expected around floor 100, about 90 minutes in.
- **Resets:** Bones, minions, graveworks, floors and Essence.
- **Keeps:** gear, school levels (at a reduced rate), research and achievements.
- **Gain:** `shards = floor((maxFloor − 50)^1.5 / 10)`. That's about 35 at floor 100 and about 180 at floor 200.
- **Each Soul Shard** ever earned gives +2% army damage. (M2 tuning: damage only, since boosting Bones too compounded into a trivial second run.) You can spend them in the **Dark Pact** tree, which boosts the early game hard:
  - Start at floor 10, 25 or 50
  - Auto-buy minions
  - Keep Lich Wardens through Rebirth
  - More spell slots
  - Offline cap +4h
  - Event frequency +25%
- **Covens** unlock after the 3rd Rebirth. You pick one per run, and it acts like a class:
  - **Bone Lord:** minion-focused
  - **Blood Witch:** sacrifice and burst
  - **Plague Doctor:** damage over time and swarms
  - **Shade:** clicking, crits and curses

### 5.10 Endgame
- **Abyssal Rifts:** timed 10-minute pushes through quickly scaling floors. Your personal best depth gives Rift rewards (Gems, Mythics).
- **Curses:** opt-in difficulty modifiers before a run, such as "Enemies +100% HP", "No clicking" or "Minions cost 2x". Each adds more loot and Shards.
- **Prestige layer 2: Lichdom Ascension** (week 1–2). It resets Soul Shards and the Dark Pact tree in exchange for **Dread**. You become a Lich, which unlocks:
  - New Lich powers
  - **Dark Levels**, small permanent stat points earned without limit after the max level
  - The ability to go past floor 600 efficiently
- **Seasons** (post-launch): a fresh start every few months, with a new season rule and cosmetic rewards.

## 6. Unlock pacing (targets)

| Time | Unlock |
|---|---|
| 0 min | Siphon (click), Skeleton Warriors, floor 1 |
| 2 min | Shallow Graves (Crypt tab) |
| 5 min | Bulk buy, minion milestones |
| 10 min | Corpses, Ghouls |
| 15 min | Lich Wardens (automation), boss timers |
| 20 min | Wandering Soul events |
| 30 min | First loot drops, Inventory tab |
| 40 min | Essence and Bone school spells |
| 60 min | Forbidden Library (research), Lore |
| 75–90 min | Phylactery Rebirth available, then first Rebirth |
| Run 2 | Blood and Plague schools; Layer 2 reachable |
| Run 3 | Covens, Shadow school, Hoarder Imp |
| Day 2–3 | Layers 3–4, sets, Gems |
| Day 4–7 | Abyssal Rifts, Curses |
| Week 1–2 | Lichdom Ascension |

## 7. Economy and balance

- **Design goal:** army DPS grows faster than floor HP for stretches, then falls behind at boss floors. Those walls are what drive the loop of farming, upgrading, spellcasting and eventually Rebirth.
- **Bulk cost:** `base × r^n × (r^k − 1)/(r − 1)`.
- **Most you can afford:** `k = floor(log(C(r−1)/(base·r^n) + 1) / log r)`.
- **Offline progress:**
  - The Crypt simulates normally in chunks.
  - The Descent farms your best floor that you can clear reliably. It doesn't push new floors, which keeps the simulation simple and fair.
  - Cap: 8 hours, upgradable. Show a "While you slumbered…" summary on return.
- **Large numbers:** use `break_eternity.js` from day one.
- **Number display:** short suffixes (K, M, B… then aa, ab), scientific notation or engineering notation.
- **Balance simulator:**
  - A headless script plays with a greedy buyer and a simple spell rotation.
  - It outputs time-to-floor and time-to-Rebirth as CSV.
  - Each run is checked against the pacing targets in section 6.

## 8. Tech architecture

- **Stack:**
  - TypeScript and Vite, with Svelte or React for the UI.
  - Deployed as a static site (itch.io or GitHub Pages).
  - Tauri or Electron later for Steam.
- **Game loop:**
  - A fixed logic tick of 20 per second, using delta time.
  - Rendering through `requestAnimationFrame`.
  - Logic never touches the DOM.
- **State:** one serializable `GameState` object.
- **Seeded RNG** (for example mulberry32) for loot rolls, with the seed stored in the save. This makes drops reproducible for testing and avoids save-scumming.
- **Content as data:** minions, graveworks, floors and layers, affixes, legendaries, spells, research and story all live in typed definition files. Adding content shouldn't require engine changes.
- **Saves:**
  - Autosave every 30 seconds and when the tab is hidden.
  - Keep a rotating backup of the previous save.
  - Export and import as base64.
  - A save version number with migration functions.
- **Tests:** Vitest for cost and bulk math, floor HP and rewards, prestige formulas, loot generation and offline simulation.

### Proposed folder structure
```
src/
  engine/     loop, state, save/load, migrations, offline, rng, bignum, format
  systems/    crypt, army, descent, combat, loot, spells, schools, research, prestige, events
  content/    minions.ts, graveworks.ts, layers.ts, affixes.ts, legendaries.ts,
              sets.ts, spells.ts, research.ts, pacts.ts, story.ts
  ui/         components and tabs (Descent, Army, Crypt, Inventory, Grimoire, Library, Pact, Stats)
sim/          headless balance simulator and reports
tests/
```

## 9. UI and game feel

- **Main screen:** the Descent view in the center, showing the current enemy, floor counter, boss timer and a few animated minions. The Army list sits on the left and the Crypt on the right.
- **Tabs unlock gradually:** Army, Crypt, Inventory, Grimoire (spells), Library (research), Pact (prestige), Stats and Achievements.
- **Click feedback:** floating damage numbers, bone particles, a screen pulse on crits, a loot "beam" colored by rarity, and a distinct sound for each rarity.
- **Guidance:** a "next goal" hint, and badges on anything you can afford or any upgrade.
- **Art direction:** 32×32 dark-fantasy pixel art.
  - **Palette:** bone white, dried-blood red, plague green, Essence violet.
  - Free or cheap asset packs can cover the prototype.
- **Settings:** number format, reduced motion, auto-salvage filters, hotkeys.

## 10. Roadmap

| Milestone | Scope | Done when |
|---|---|---|
| **M0 Foundation** (wk 1) ✅ | Loop, state, save/load and migrations, number library and formatting, seeded RNG, simulator skeleton | A save survives a reload. Math tests pass. |
| **M1 Vertical slice** (wk 2–3) ✅ | Siphon, 6 minions, 4 graveworks with Lich Wardens, Layer 1 (floors 1–100), boss timers, Wandering Soul | 45+ minutes of fun play with tuned pacing |
| **M2 Loot and Rebirth** (wk 4–6) ✅ | Item slots, rarities, random stats, salvage, Essence and Bone school, Phylactery Rebirth and Dark Pact tree, offline progress | A full loop into a noticeably faster second run |
| **M3 Depth** (wk 7–9) | All 4 schools, Covens, Forbidden Library, Layers 2–4, legendaries and sets, Elite minions, achievements, story | 5+ hours of content |
| **M4 Endgame** (wk 10–12) | Rifts, Curses, Gems and sockets, Layers 5–7, Lichdom and Dark Levels | Week-long progression simulated |
| **M5 Polish and launch** (wk 13+) | Art and audio pass, tutorial hints, playtests, itch.io release | External testers reach their first Rebirth without help |

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A dead zone after the first Rebirth | Front-load strong early Dark Pact nodes (start floor, auto-buy) |
| Inventory becoming a chore | Auto-salvage filters from day one, and a "compare and equip best" button |
| One build dominating | Layer modifiers that favor different schools; Covens with real tradeoffs |
| Combat simulation cost and offline complexity | Aggregate DPS model; offline farms the best cleared floor |
| Content treadmill | Each layer adds a new mechanic, not just bigger numbers |
| Save corruption | Versioned saves, migrations and a rotating backup |

## 12. Open decisions

- [ ] Final title (*Bonebound: The Descent* is a placeholder)
- [ ] Platform: browser only, or plan for Steam or mobile
- [x] UI framework: Svelte 5 (chosen in M0; the engine is framework-independent)
- [ ] Art: placeholder icons for M1, then pixel art
- [ ] Scope: stop after M2 as a prototype, or go to the full launch
