# Bonebound: The Descent

A dark-fantasy incremental game. See [PLAN.md](PLAN.md) for the full design and roadmap.

**Status:** M2 (Loot and Rebirth) complete on top of M1: relics with random stats, legendaries, salvage/reforge/empower, Essence and the School of Bone spells, Phylactery Rebirth with Soul Shards, and the Dark Pact tree.

**Pacing** (`npm run sim -- --hours=4.5 --rebirth=10`, active player): run 1 reaches floor 100 at about 1h24m and rebirths at floor ~110; run 2 reaches floor 100 about 25 minutes in and goes to ~120; run 3 reaches floor 100 in under 10 minutes.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the game at http://localhost:5173 |
| `npm test` | Run the unit tests |
| `npm run check` | Type-check TypeScript and Svelte |
| `npm run build` | Production build into `dist/` |
| `npm run sim` | Balance simulator (options: `--hours=4 --cps=0 --seed=7 --attention=10 --souls=0.3 --rebirth=10 --rebirths=2 --gear=0 --spells=0`) |
| `npm run icons` | Regenerate the bundled icon subset |

## Layout

```
src/
  engine/    DOM-free core: bignum, format, rng, economy math, state, save/load,
             migrations, serialize, loop, offline
  systems/   Game rules: army, crypt, descent (floors, bosses), siphon (click), upgrades,
             events (souls, buffs), unlocks, modifiers (all multipliers), income, tick
  content/   Data: minions, graveworks, upgrades, layers, events, story, balance (tuning knobs)
  ui/        View model, render clock, feedback (floats, toasts), Svelte panels
  game.ts    Browser runtime: boot, autosave, offline catch-up, import/export
sim/         Headless balance simulator (writes CSV to sim/out/)
tests/       Vitest unit tests
```

## Credits

- Icons from [game-icons.net](https://game-icons.net) by Lorc, Delapouite and contributors, licensed [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Only the icons listed in `scripts/build-icons.ts` are bundled; run `npm run icons` after adding one.
- Fonts: [Cinzel](https://fonts.google.com/specimen/Cinzel) and [EB Garamond](https://fonts.google.com/specimen/EB+Garamond), SIL Open Font License, via Fontsource.

## Conventions

- `engine/` and `systems/` never touch the DOM, so tests and the simulator run them directly.
- New content goes in `content/` as data. Engine changes shouldn't be needed to add a minion.
- **Changing the save shape?** Bump `SAVE_VERSION` in `engine/state.ts` and add a migration in `engine/migrations.ts`. Never edit a released migration.
- All currency values are `Decimal` (break_eternity.js). Use `D(x)` to construct one.
