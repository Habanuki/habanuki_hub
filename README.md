# Habanuki Hub

Single Vercel deployment for all Ben games in one repo.

## URL layout

- Hub dashboard: `/`
- Penniez: `/penniez`
- Nicque: `/nicque`

Each game source lives in `ben/<slug>`. At build time, `npm run sync-games` copies each game into `public/games/<slug>` and generates `public/games/games.json`.

## Project structure

- `app/`: Next.js hub pages
- `ben/`: source folders for each game
- `scripts/sync-games.mjs`: copies game files into `public/games`
- `scripts/push-all.mjs`: pushes this repo and optionally mirrors game folders to game-specific remotes

## Local dev

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Framework preset: `Next.js`.
4. Build command: default (`npm run build`).
5. Output: default (`.next`).

No extra Vercel config is required.

## Admin password and remote toggles

You can protect the admin UI with an `ADMIN_PASSWORD` environment variable in Vercel. Set it to a simple password your child knows. The admin page is at `/admin`.

If you want the admin toggles to persist (so enabling/disabling games updates the repo), set these Vercel environment variables as well:

- `GITHUB_TOKEN` — a GitHub personal access token with `repo` scope.
- `GITHUB_REPO` — the repository identifier `owner/repo` (for example `petertrice/habanuki_hub`).
- `GITHUB_BRANCH` — optional, defaults to `main`.

When configured, the admin UI will commit changes to `ben/<slug>/game.meta.json` on the selected branch.

## Adding a new game

1. Create folder: `ben/my-new-game`.
2. Ensure `ben/my-new-game/index.html` exists.
3. Optional metadata in `ben/my-new-game/game.meta.json`:

```json
{
  "title": "My New Game",
  "description": "Short card for the hub dashboard."
}
```

4. Run `npm run sync-games`.

## Keeping separate game repos in sync (optional)

If you also keep `penniez` and `nicque` as separate GitHub repos, use `git subtree` mirroring:

1. Copy `games.remotes.example.json` to `games.remotes.json`.
2. Fill each remote URL.
3. Commit your changes.
4. Run:

```bash
npm run push-all
```

What `push-all` does:

- Pushes this hub repo branch to `origin`.
- For each configured game remote, splits `ben/<slug>` history and pushes it to that repo `main` branch.

Notes:

- `push-all` requires a clean working tree.
- If you do not need separate game repos, skip `games.remotes.json` and only push this hub repo.
