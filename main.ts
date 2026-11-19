// Leonida Polaroid Press — the hand-in program for gta6-cover-art-01.
//
// It stages this entry's app/ and screenshots/ into the output directory the
// grader reads, then writes /output/dossier.json with the vendored make.fun
// library. The output directory itself is never removed: on the grader's
// mount the directory is owned by root, so deleting it fails the run. Only
// the files inside it are cleared, the directory is created if missing, and
// the two folders are copied in fresh.
//
// Local check: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Create the output directory (never delete it) and empty only its contents.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the competition's own gate: only text_max_bytes shapes the
// dossier's bytes; the rest refuse an entry the scorer would refuse anyway
// (more than 4 screenshots, one over 256 KiB, app/ past 993 files or 48 MiB).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
