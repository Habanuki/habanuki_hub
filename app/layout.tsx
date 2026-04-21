import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Habanuki Hub",
  description: "A single deployment hub for Ben's games"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
