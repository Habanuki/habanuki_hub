"use client";
import React, { useEffect, useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [games, setGames] = useState([]);

  async function login(e) {
    e.preventDefault();
    const res = await fetch(`/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      setAuthed(true);
      await loadGames();
    } else {
      alert("Incorrect password");
    }
  }

  async function loadGames() {
    const r = await fetch(`/games/games.json`);
    const data = await r.json();
    setGames(data);
  }

  useEffect(() => {
    fetch(`/games/games.json`).then((r) => r.json()).then(setGames).catch(() => {});
  }, []);

  async function toggle(slug, current) {
    const res = await fetch(`/api/admin/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, enabled: !current })
    });
    if (res.ok) {
      await loadGames();
    } else if (res.status === 401) {
      alert("Not authenticated. Log in first.");
      setAuthed(false);
    } else {
      const text = await res.text();
      alert(`Toggle failed: ${text}`);
    }
  }

  return (
    React.createElement("main", { style: { padding: 20 } },
      React.createElement("h1", null, "Admin"),
      !authed && React.createElement("form", { onSubmit: login, style: { marginBottom: 16 } },
        React.createElement("label", null, "Password: ", React.createElement("input", { value: password, onChange: (e) => setPassword(e.target.value) })),
        React.createElement("button", { type: "submit" }, "Login")
      ),

      React.createElement("section", null,
        React.createElement("h2", null, "Games"),
        games.length === 0 && React.createElement("p", null, "No games found."),
        React.createElement("ul", null, games.map((g) => React.createElement("li", { key: g.slug, style: { marginBottom: 8 } },
          React.createElement("strong", null, g.title), " — ", g.description,
          React.createElement("button", { style: { marginLeft: 8 }, onClick: () => toggle(g.slug, g.enabled) }, g.enabled ? "Disable" : "Enable")
        )))
      ),

      React.createElement("p", { style: { marginTop: 20 } },
        "Notes: toggling requires the site to have a `GITHUB_TOKEN` and `GITHUB_REPO` env var set to commit changes on your behalf. If not configured, toggles will fail and you can use the local `npm run easy-push` to flip `ben/<slug>/game.meta.json` and push."
      )
    )
  );
}
