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
console.table(result.milestones.map((m) => ({ milestone: m.label, time: formatDuration(m.seconds) })));

const s = result.state;
console.log(
  `End: floor ${s.descent.floor}, ${formatNumber(s.resources.bones)} Bones, ` +
    `${formatNumber(armyDps(s))} DPS, ${formatNumber(s.stats.lifetimeBones)} lifetime Bones`,
);

const outDir = join(import.meta.dirname, 'out');
mkdirSync(outDir, { recursive: true });
const file = join(outDir, `run-seed${options.seed}-cps${options.clicksPerSecond}.csv`);
writeFileSync(file, samplesToCsv(result.samples));
console.log(`CSV: ${file}\n`);
