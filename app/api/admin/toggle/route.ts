import { NextResponse } from "next/server";

async function requireAuth(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  return cookie.includes("habanuki_admin=1");
}

export async function POST(req: Request) {
  if (!(await requireAuth(req))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const slug = body?.slug;
  const enabled = Boolean(body?.enabled);

  if (!slug) {
    return new NextResponse("Missing slug", { status: 400 });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO; // owner/repo
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return new NextResponse("Server not configured for remote toggles", { status: 501 });
  }

  const path = `ben/${slug}/game.meta.json`;
  const apiBase = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(path)}`;

  // Fetch current file to get the sha
  const getRes = await fetch(`${apiBase}?ref=${GITHUB_BRANCH}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
  });

  if (!getRes.ok) {
    return new NextResponse(`Could not fetch ${path}: ${getRes.statusText}`, { status: 502 });
  }

  const json = await getRes.json();
  const sha = json.sha;
  let meta = {};
  try {
    const decoded = Buffer.from(json.content, json.encoding === "base64" ? "base64" : "utf8").toString("utf8");
    meta = JSON.parse(decoded || "{}");
  } catch {
    meta = {};
  }

  Object.assign(meta, { enabled });

  const updatedContent = Buffer.from(JSON.stringify(meta, null, 2) + "\n").toString("base64");

  const putRes = await fetch(apiBase, {
    method: "PUT",
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
    body: JSON.stringify({
      message: `Toggle ${slug} enabled=${enabled}`,
      content: updatedContent,
      sha,
      branch: GITHUB_BRANCH
    })
  });

  if (!putRes.ok) {
    const txt = await putRes.text();
    return new NextResponse(`Failed to update remote: ${txt}`, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
