#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const root = process.cwd();
const candidates = [path.join(root, "..", "..", "ben"), path.join(root, "..", "ben")];
const outConfig = path.join(root, "games.sources.json");

function listDirs(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

function hasIndexHtml(dir) {
  return fs.existsSync(path.join(dir, "index.html"));
}

async function promptChoices(items) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const q = (s) => new Promise((res) => rl.question(s, res));

  console.log("Select games to include (comma separated numbers), or 'a' for all, or Enter to skip:");
  for (let i = 0; i < items.length; i++) {
    console.log(`  [${i + 1}] ${items[i].slug}  —  ${items[i].path}`);
  }

  const ans = await q("Include: ");
  rl.close();
  if (!ans) return [];
  if (ans.trim().toLowerCase() === "a") return items.map((it) => it.slug);
  const picks = ans.split(/[,\s]+/).map((p) => Number(p.trim())).filter(Boolean);
  return picks.map((n) => items[n - 1]).filter(Boolean).map((it) => it.slug);
}

async function main() {
  if (process.env.CI || process.env.NONINTERACTIVE) {
    console.log("Non-interactive environment; skipping prepare-deploy.");
    return;
  }

  const found = [];
  for (const cand of candidates) {
    if (!fs.existsSync(cand)) continue;
    const names = listDirs(cand);
    for (const name of names) {
      const full = path.join(cand, name);
      if (!hasIndexHtml(full)) continue;
      found.push({ slug: name, path: path.relative(root, full) });
    }
  }

  if (found.length === 0) {
    console.log("No external games found in ../ben or ../../ben.");
    return;
  }

  const chosen = await promptChoices(found);
  if (!chosen || chosen.length === 0) {
    console.log("No selections made; skipping.");
    return;
  }

  const config = { sources: [] };
  for (const slug of chosen) {
    const entry = found.find((f) => f.slug === slug);
    if (entry) config.sources.push({ slug: entry.slug, path: entry.path });
  }

  fs.writeFileSync(outConfig, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outConfig} with ${config.sources.length} entries.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
