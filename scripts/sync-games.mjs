import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const gamesSourceRoot = path.join(root, "ben");
const publicGamesRoot = path.join(root, "public", "games");

const ignoredNames = new Set(["node_modules", ".git", ".next", "dist", "build"]);

function isDirectory(p) {
  return statSync(p).isDirectory();
}

function titleFromSlug(slug) {
  return slug
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readGameMeta(gameDir, slug) {
  const metaPath = path.join(gameDir, "game.meta.json");

  if (!existsSync(metaPath)) {
    return {
      slug,
      title: titleFromSlug(slug),
      description: `Launch ${titleFromSlug(slug)}.`
    };
  }

  try {
    const raw = readFileSync(metaPath, "utf8");
    const meta = JSON.parse(raw);
    return {
      slug,
      title: typeof meta.title === "string" && meta.title.trim() ? meta.title.trim() : titleFromSlug(slug),
      description:
        typeof meta.description === "string" && meta.description.trim()
          ? meta.description.trim()
          : `Launch ${titleFromSlug(slug)}.`,
      enabled: typeof meta.enabled === "boolean" ? meta.enabled : true
    };
  } catch {
    return {
      slug,
      title: titleFromSlug(slug),
      description: `Launch ${titleFromSlug(slug)}.`,
      enabled: true
    };
  }
}

if (!existsSync(gamesSourceRoot)) {
  console.error("No /ben folder found. Create /ben/<game-name> folders first.");
  process.exit(1);
}

rmSync(publicGamesRoot, { recursive: true, force: true });
mkdirSync(publicGamesRoot, { recursive: true });

const entries = readdirSync(gamesSourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => !ignoredNames.has(name));

const manifest = [];

for (const slug of entries) {
  const sourceDir = path.join(gamesSourceRoot, slug);
  const indexPath = path.join(sourceDir, "index.html");

  if (!existsSync(indexPath)) {
    console.warn(`Skipping ${slug}: missing index.html`);
    continue;
  }

  const destinationDir = path.join(publicGamesRoot, slug);

  cpSync(sourceDir, destinationDir, {
    recursive: true,
    filter: (sourcePath) => {
      const name = path.basename(sourcePath);
      return !ignoredNames.has(name);
    }
  });

  manifest.push(readGameMeta(sourceDir, slug));
}

writeFileSync(path.join(publicGamesRoot, "games.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`Synced ${manifest.length} game(s) to public/games.`);
