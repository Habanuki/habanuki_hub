#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

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

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  return execSync(cmd, { stdio: "inherit" });
}

function safeExec(cmd) {
  try {
    run(cmd);
  } catch (e) {
    console.error(`Command failed: ${cmd}`);
  }
}

// 1) discover external games
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
  console.log("No external games found to include.");
} else {
  const cfg = { sources: [] };
  for (const f of found) cfg.sources.push({ slug: f.slug, path: f.path });
  fs.writeFileSync(outConfig, JSON.stringify(cfg, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outConfig} (${cfg.sources.length} entries)`);
}

// 2) sync games into public/games
console.log("Running sync-games...");
safeExec("node scripts/sync-games.mjs");

// 3) commit hub repo updates
try {
  run("git add -A");
  try {
    run("git commit -m \"chore: deploy - update games and hub\" --no-verify");
  } catch (e) {
    console.log("No changes to commit.");
  }
} catch (e) {
  console.error("Git commit failed", e);
}

// 4) run push-all to push origin and optional game remotes
console.log("Running push-all to push hub and subtrees (if configured)...");
safeExec("node scripts/push-all.mjs");

console.log("deploy-local finished.");
