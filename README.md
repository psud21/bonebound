# Bonebound: The Descent

A dark-fantasy incremental game. See [PLAN.md](PLAN.md) for the full design and roadmap.

**Status:** M5 (Polish) on top of M1–M4: synthesized sound effects, first-time tutorial hints, keyboard shortcuts, reduce-motion and volume settings, loot and crit flashes, and an itch.io release package. Before M5, M4 (Endgame) was complete on top of M1–M3. The game now runs to an endless seventh layer, with:
- gems and sockets
- Abyssal Rifts
- Curses
- Lichdom Ascension with Dread, Lich powers and Dark Levels
- the Army of the Dead ultimate spell
- 52 feats

M3 added Layers 2–4, four more minions, Corpses and Elites, the Schools of Blood, Plague and Shadow, Covens, the Forbidden Library, and set relics.

**Pacing.** Run 1 reaches floor 100 in about an hour and ends near floor 140 (`npm run sim -- --hours=8 --rebirth=10 --rebirths=30`, active player). Over a simulated week of four active hours a day (`npm run sim -- --days=7 --active=4 --dt=0.5 --decide=5 --rebirth=10 --rebirths=500 --brief`):
- Day 1 reaches the Ashen Wastes.
- Day 2 reaches Layers 4–5 and the first Rift.
- The first Lichdom Ascension comes around day 2–3, and the third around day 5.
- Day 6 reaches the Throat of the Void. The week ends near floor 640.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the game at http://localhost:5173 |
| `npm test` | Run the unit tests |
| `npm run check` | Type-check TypeScript and Svelte |
| `npm run build` | Production build into `dist/` |
| `npm run sim` | Balance simulator (options: `--hours=4 --cps=0 --seed=7 --attention=10 --souls=0.3 --rebirth=10 --rebirths=2 --gear=0 --spells=0`; week runs: `--days=7 --active=4 --ascend=2 --dt=0.5 --decide=5 --brief`) |
| `npm run icons` | Regenerate the bundled icon subset and the favicon |
| `npm run release` | Production build zipped for itch.io (`release/`) |

## Releasing to itch.io

1. Run `npm run release`. It builds the game and writes `release/bonebound-web-v<version>.zip`, with `index.html` at the root.
2. On itch.io, create a project with **Kind of project: HTML** and upload the zip.
3. Tick **This file will be played in the browser**.
4. Set the viewport to about 1280×800 and enable the fullscreen button. The layout also works on phones.
5. Saves live in the browser's local storage for the itch.io page, so they carry across visits but not across browsers. Players can move a save with Export and Import under **Settings, saves & stats**.

Bump `version` in `package.json` before each release. The game shows it in the settings panel.

## Layout

```
src/
  engine/    DOM-free core: bignum, format, rng, economy math, state, save/load,
             migrations, serialize, loop, offline
  systems/   Game rules: army, crypt, descent (floors, bosses), siphon (click), upgrades,
             events (souls, buffs), loot and gear, magic, prestige, elites, library,
             covens, feats, hazards (layer rules), modifiers (all multipliers), income, tick
  content/   Data: minions, graveworks, upgrades, layers, events, story, loot, spells, pact,
             elites, research, covens, achievements, balance (tuning knobs)
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
