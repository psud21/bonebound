# Bonebound: The Descent

A dark-fantasy incremental game. See [PLAN.md](PLAN.md) for the full design and roadmap.

**Status:** M0 (Foundation) complete: engine, saves, offline progress, simulator and a debug UI.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the game at http://localhost:5173 |
| `npm test` | Run the unit tests |
| `npm run check` | Type-check TypeScript and Svelte |
| `npm run build` | Production build into `dist/` |
| `npm run sim` | Balance simulator (options: `--hours=4 --cps=0 --seed=7 --dt=0.25`) |

## Layout

```
src/
  engine/    DOM-free core: bignum, format, rng, economy math, state, save/load,
             migrations, serialize, loop, offline
  systems/   Game rules: army, descent, siphon (click), resources, tick
  content/   Data: minions.ts, balance.ts (tuning knobs)
  ui/        View model, render clock, Svelte components
  game.ts    Browser runtime: boot, autosave, offline catch-up, import/export
sim/         Headless balance simulator (writes CSV to sim/out/)
tests/       Vitest unit tests
```

## Conventions

- `engine/` and `systems/` never touch the DOM, so tests and the simulator run them directly.
- New content goes in `content/` as data. Engine changes shouldn't be needed to add a minion.
- **Changing the save shape?** Bump `SAVE_VERSION` in `engine/state.ts` and add a migration in `engine/migrations.ts`. Never edit a released migration.
- All currency values are `Decimal` (break_eternity.js). Use `D(x)` to construct one.
