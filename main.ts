// Lumenkeeper's entrypoint (Node 22, standard library only). The game is
// plain static files under game/ plus screenshots/; this program hands them
// in by copying both into the output directory and writing the dossier the
// judge reads, using the make.fun library vendored beside it.
//
// Run it locally with:  MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader runs it twice and requires byte-identical output both times.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly instead of handing in a half-built entry: the game must
// exist, and at least one real screenshot must be present, or the run is
// a mistake, not a submission.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — the game was not built');
}
if (!existsSync(join(here, 'screenshots'))) {
  throw new Error('screenshots/ is missing — take the screenshots first');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
