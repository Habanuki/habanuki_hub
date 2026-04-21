import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <h1>404</h1>
      <p>That game path does not exist.</p>
      <Link href="/">Return to hub</Link>
    </main>
  );
}
