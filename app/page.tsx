import Link from "next/link";
import { promises as fs } from "node:fs";
import path from "node:path";

type GameRecord = {
  slug: string;
  title: string;
  description: string;
};

async function getGames(): Promise<GameRecord[]> {
  const gamesFilePath = path.join(process.cwd(), "public", "games", "games.json");

  try {
    const raw = await fs.readFile(gamesFilePath, "utf8");
    const parsed = JSON.parse(raw) as GameRecord[];
    return parsed.sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const games = await getGames();

  return (
    <main className="hub-shell">
      <section className="hero">
        <p className="eyebrow">Habanuki</p>
        <h1>Ben&apos;s Game Hub</h1>
        <p>
          One repository. One Vercel deployment. Every game lives under its own path.
        </p>
      </section>

      <section className="game-grid" aria-label="Games">
        {games.length === 0 ? (
          <article className="game-card empty">
            <h2>No games found</h2>
            <p>Run `npm run sync-games` after adding game files to `ben/&lt;game-name&gt;`.</p>
          </article>
        ) : (
          games.map((game) => (
            <article className="game-card" key={game.slug}>
              <h2>{game.title}</h2>
              <p>{game.description}</p>
              <Link href={`/${game.slug}`} className="play-link">
                Open /{game.slug}
              </Link>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
