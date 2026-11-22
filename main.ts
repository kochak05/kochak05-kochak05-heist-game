// main.ts — hands the heist game in: copies game/ and screenshots/ from this
// repository into the output directory and writes /output/dossier.json with
// buildDossier from vendor/makefun-game.ts. Node 22, standard library only.
// The output directory itself is never deleted; it is created if missing.
// Two runs write identical bytes: entries are copied in sorted order and the
// dossier is computed from file contents alone.

import { mkdirSync, readdirSync, copyFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildDossier } from "./vendor/makefun-game.ts";

const OUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");
const REPO_DIR = resolve(import.meta.dirname);

function copyTree(srcDir: string, dstDir: string): void {
  mkdirSync(dstDir, { recursive: true });
  const entries = readdirSync(srcDir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  for (const entry of entries) {
    const src = join(srcDir, entry.name);
    const dst = join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(src, dst);
    } else if (entry.isFile()) {
      copyFileSync(src, dst);
    }
  }
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const gameSrc = join(REPO_DIR, "game");
  const shotsSrc = join(REPO_DIR, "screenshots");
  if (!statSync(gameSrc).isDirectory()) throw new Error("game/ is missing from the repository");
  if (!statSync(shotsSrc).isDirectory()) throw new Error("screenshots/ is missing from the repository");
  copyTree(gameSrc, join(OUT_DIR, "game"));
  copyTree(shotsSrc, join(OUT_DIR, "screenshots"));
  const dossier = buildDossier(OUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 48 * 1024 * 1024,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(OUT_DIR, "dossier.json"), dossier);
}

main();
