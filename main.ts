// Saffron Line's hand-in program (Node 22, standard library only): the game is
// the static game/ folder beside this file, and /output is where the grader
// wants it. This copies the playable files and the four screenshots across and
// writes dossier.json with the vendored make.fun library, which the gate then
// rebuilds and compares byte for byte. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(root, 'game');
const shotDir = join(root, 'screenshots');

if (!existsSync(gameDir)) {
  console.error('game/ is missing beside main.ts; run this from the repository root.');
  process.exit(1);
}

mkdirSync(output, { recursive: true });
cpSync(gameDir, join(output, 'game'), { recursive: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
if (existsSync(shotDir)) cpSync(shotDir, join(output, 'screenshots'), { recursive: true });

// The scorer's caps, as the bounty's gate.json states them: the text cap shaped
// the dossier's bytes; the rest refuse here exactly what the gate would refuse.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

writeFileSync(join(output, 'dossier.json'), buildDossier(output, CAPS));
console.log(`Saffron Line handed in to ${output}`);
