import { promises as fs } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";

type GameRecord = {
  slug: string;
  title: string;
  description: string;
};

async function getGames(): Promise<GameRecord[]> {
  const gamesFilePath = path.join(process.cwd(), "public", "games", "games.json");
  const raw = await fs.readFile(gamesFilePath, "utf8");
  return JSON.parse(raw) as GameRecord[];
}

export async function generateStaticParams() {
  try {
    const games = await getGames();
    return games.map((game) => ({ game: game.slug }));
  } catch {
    return [];
  }
}

export default async function GamePage({
  params
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;

  try {
    const games = await getGames();
    const selectedGame = games.find((entry) => entry.slug === game);

    if (!selectedGame) {
      notFound();
    }

    // Games are static apps copied under public/games/<slug>/.
    const src = `/games/${selectedGame.slug}/index.html`;

    return (
      <main className="game-shell">
        <header className="game-header">
          <a href="/">Back to hub</a>
          <h1>{selectedGame.title}</h1>
        </header>
        <iframe title={selectedGame.title} src={src} className="game-frame" />
      </main>
    );
  } catch {
    notFound();
  }
}
