import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "games.remotes.json");

function run(command, options = {}) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: "inherit", ...options });
}

function getCurrentBranch() {
  return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
}

function ensureCleanWorkingTree() {
  const status = execSync("git status --porcelain", { encoding: "utf8" }).trim();

  if (status.length > 0) {
    console.error("Working tree has uncommitted changes. Commit or stash before push-all.");
    process.exit(1);
  }
}

function loadConfig() {
  if (!existsSync(configPath)) {
    return { remotes: {} };
  }

  try {
    const raw = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.remotes || typeof parsed.remotes !== "object") {
      return { remotes: {} };
    }
    return parsed;
  } catch {
    console.error("Could not parse games.remotes.json");
    process.exit(1);
  }
}

ensureCleanWorkingTree();

const branch = getCurrentBranch();
const config = loadConfig();

run(`git push origin ${branch}`);

for (const [slug, remoteUrl] of Object.entries(config.remotes)) {
  if (typeof remoteUrl !== "string" || !remoteUrl.trim()) {
    continue;
  }

  const remoteName = `game-${slug}`;
  const prefix = `ben/${slug}`;

  try {
    run(`git remote get-url ${remoteName}`);
  } catch {
    run(`git remote add ${remoteName} ${remoteUrl}`);
  }

  const splitSha = execSync(`git subtree split --prefix ${prefix} ${branch}`, { encoding: "utf8" }).trim();
  run(`git push ${remoteName} ${splitSha}:main`);
}

console.log("\nPush complete.");
