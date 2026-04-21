#!/usr/bin/env node
import { execSync } from "node:child_process";

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

try {
  // Stage all changes
  run("git add -A");

  // Commit with a simple message; allow empty to keep flow predictable
  try {
    run("git commit -m \"quick update\" --no-verify");
  } catch (e) {
    console.log("No changes to commit.");
  }

  // Call existing push-all helper which will push origin and any subtrees
  run("node scripts/push-all.mjs");
  console.log("easy-push finished.");
} catch (err) {
  console.error(err);
  process.exit(1);
}
