/**
 * Headless balance simulator.
 *   npm run sim
 *   npm run sim -- --hours=4 --cps=0 --seed=7
 * Prints time-to-milestone and writes a per-minute CSV to sim/out/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatDuration, formatNumber } from '../src/engine/format';
import { armyDps } from '../src/systems/army';
import { DEFAULT_SIM_OPTIONS, runSimulation, samplesToCsv, type SimOptions } from './simulate';

function parseArgs(argv: string[]): Partial<SimOptions> {
  const out: Partial<SimOptions> = {};
  for (const arg of argv) {
    const [key, raw] = arg.replace(/^--/, '').split('=');
    const value = Number(raw);
    if (raw === undefined || Number.isNaN(value)) continue;
    if (key === 'hours') out.seconds = value * 3600;
    if (key === 'minutes') out.seconds = value * 60;
    if (key === 'cps') out.clicksPerSecond = value;
    if (key === 'seed') out.seed = value;
    if (key === 'dt') out.dt = value;
    if (key === 'attention') out.attentionSeconds = value;
    if (key === 'souls') out.soulCatchRate = value;
    if (key === 'rebirth') out.rebirthAfterStall = value * 60;
    if (key === 'rebirths') out.maxRebirths = value;
    if (key === 'gear') out.useGear = value !== 0;
    if (key === 'spells') out.useSpells = value !== 0;
    if (key === 'days') out.seconds = value * 86400;
    if (key === 'decide') out.decideEvery = value;
    if (key === 'active') out.activeHoursPerDay = value;
    if (key === 'ascend') out.ascendAtDread = value;
  }
  return out;
}

const options = { ...DEFAULT_SIM_OPTIONS, ...parseArgs(process.argv.slice(2)) };
const started = performance.now();
const result = runSimulation(options);
const elapsedMs = performance.now() - started;

console.log(
  `\nSimulated ${formatDuration(options.seconds)} at ${options.clicksPerSecond} clicks/s ` +
    `(seed ${options.seed}, dt ${options.dt}s) in ${elapsedMs.toFixed(0)} ms\n`,
);
const brief = process.argv.includes('--brief');
const shown = brief
  ? result.milestones.filter((m) => /ended|Ascension|First Rift|floor (100|200|300|400|500|600|700|800)$/.test(m.label))
  : result.milestones;
console.table(shown.map((m) => ({ milestone: m.label, time: formatDuration(m.seconds) })));

const s = result.state;
console.log(
  `End: floor ${s.descent.floor} (deepest ${s.descent.maxFloor}), ${formatNumber(s.resources.bones)} Bones, ` +
    `${formatNumber(armyDps(s))} DPS, ${formatNumber(s.stats.lifetimeBones)} lifetime Bones`,
);
console.log(
  `Bosses: ${s.stats.bossesDefeated} defeated, ${result.bossFails} failed · Souls caught: ${s.stats.soulsCaught} · ` +
    `Upgrades: ${s.upgrades.purchased.length} · Rebirths: ${s.prestige.rebirths} · Shards: ${s.prestige.shardsEarned} · ` +
    `Items found: ${s.stats.itemsFound} · Schools: ${Object.entries(s.magic.schools).map(([k, v]) => `${k} ${v.level}`).join(', ')}`,
);
console.log(
  `Lich: ascensions ${s.lich.ascensions}, Dread ${s.lich.dreadEarned}, Dark Level ${s.lich.darkLevel}, powers ${s.lich.powers.length} · ` +
    `Rift best ${s.rift.best} (${s.stats.riftsRun} run, ${s.rift.keys} keys left) · Gems found ${s.stats.gemsFound} · ` +
    `Offline ${formatDuration(result.offlineSeconds)}`,
);
console.log(
  `Elites: ${JSON.stringify(s.army.elites)} · Corpses earned: ${Math.round(s.stats.corpsesEarned)} · Lore earned: ${Math.round(s.library.loreEarned)} · ` +
    `Research: ${s.library.completed.length} · Feats: ${s.feats.length} · Coven: ${s.prestige.coven} · Pact: ${s.prestige.pact.length}`,
);

const outDir = join(import.meta.dirname, 'out');
mkdirSync(outDir, { recursive: true });
const file = join(outDir, `run-seed${options.seed}-cps${options.clicksPerSecond}.csv`);
writeFileSync(file, samplesToCsv(result.samples));
console.log(`CSV: ${file}\n`);
