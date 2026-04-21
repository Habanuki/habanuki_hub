#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
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

function question(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(prompt, (ans) => { rl.close(); res(ans); }));
}

function normalizeArgs() {
  const args = process.argv.slice(2);
  return {
    noPush: args.includes("--no-push"),
    yes: args.includes("--yes") || args.includes("-y")
  };
}

async function main() {
  const flags = normalizeArgs();

  // Discover hub-local ben games
  const benDir = path.join(root, "ben");
  const localBenGames = [];
  if (fs.existsSync(benDir)) {
    for (const name of listDirs(benDir)) {
      const full = path.join(benDir, name);
      if (hasIndexHtml(full)) localBenGames.push({ slug: name, path: path.relative(root, full) });
    }
  }

  // Discover external candidates
  const external = [];
  for (const cand of candidates) {
    if (!fs.existsSync(cand)) continue;
    for (const name of listDirs(cand)) {
      const full = path.join(cand, name);
      if (!hasIndexHtml(full)) continue;
      // skip if same as local ben
      if (localBenGames.find((g) => g.slug === name)) continue;
      external.push({ slug: name, path: path.relative(root, full) });
    }
  }

  console.log("Found the following:");
  console.log(`  Hub repo: ${path.relative(process.cwd(), root)}`);
  if (localBenGames.length) {
    console.log("  Local games under ben/:");
    for (const g of localBenGames) console.log(`    - ${g.slug} (${g.path})`);
  } else {
    console.log("  No games found under ben/ in the repo.");
  }

  if (external.length) {
    console.log("  External candidate games found:");
    for (let i = 0; i < external.length; i++) {
      const g = external[i];
      console.log(`    [${i + 1}] ${g.slug} (${g.path})`);
    }

    let chosen = external.map((g) => g.slug);
    if (!flags.yes) {
      const ans = await question("Select external games to include (comma numbers, 'a' for all, or Enter to skip): ");
      if (!ans) {
        chosen = [];
      } else if (ans.trim().toLowerCase() === "a") {
        chosen = external.map((g) => g.slug);
      } else {
        const picks = ans.split(/[,\s]+/).map((s) => Number(s.trim())).filter(Boolean);
        chosen = picks.map((n) => external[n - 1]).filter(Boolean).map((g) => g.slug);
      }
    }

    console.log("\nSummary of selections:");
    console.log(`  Local games to update: ${localBenGames.map((g) => g.slug).join(", ") || "(none)"}`);
    console.log(`  External games to include: ${chosen.join(", ") || "(none)"}`);

    // write config if any chosen
    if (chosen.length) {
      const cfg = { sources: [] };
      for (const slug of chosen) {
        const entry = external.find((e) => e.slug === slug);
        if (entry) cfg.sources.push({ slug: entry.slug, path: entry.path });
      }

      const proceedWrite = flags.yes ? "y" : await question(`Write ${outConfig} with ${cfg.sources.length} entries? (y/N): `);
      if (flags.yes || String(proceedWrite).trim().toLowerCase() === "y") {
        fs.writeFileSync(outConfig, JSON.stringify(cfg, null, 2) + "\n", "utf8");
        console.log(`Wrote ${outConfig}`);
      } else {
        console.log("Skipping writing games.sources.json");
      }
    } else {
      console.log("No external games selected; not writing games.sources.json");
      // remove existing if present to avoid accidental inclusion
      if (fs.existsSync(outConfig)) {
        const rmAns = flags.yes ? "y" : await question(`Remove existing ${outConfig}? (y/N): `);
        if (flags.yes || String(rmAns).trim().toLowerCase() === "y") {
          fs.unlinkSync(outConfig);
          console.log(`Removed ${outConfig}`);
        }
      }
    }
  } else {
    console.log("  No external candidate games found.");
  }

  // Confirm to proceed with sync/commit/push
  const confirm = flags.yes ? "y" : await question("Proceed to sync games, commit changes, and push? (y/N): ");
  if (!(flags.yes || String(confirm).trim().toLowerCase() === "y")) {
    console.log("Aborting deploy-local.");
    return;
  }

  console.log("Running sync-games...");
  safeExec("node scripts/sync-games.mjs");

  console.log("Committing changes to hub repo...");
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

  if (flags.noPush) {
    console.log("--no-push supplied; skipping push-all.");
  } else {
    const pushConfirm = flags.yes ? "y" : await question("Push changes to origin and game remotes now? (y/N): ");
    if (flags.yes || String(pushConfirm).trim().toLowerCase() === "y") {
      console.log("Running push-all to push hub and subtrees (if configured)...");
      safeExec("node scripts/push-all.mjs");
    } else {
      console.log("Skipping push-all.");
    }
  }

  console.log("deploy-local finished.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
