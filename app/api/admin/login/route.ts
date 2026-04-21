import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const password = body?.password;

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    return new NextResponse("Server admin password not configured", { status: 500 });
  }

  if (String(password) === String(ADMIN_PASSWORD)) {
    const res = NextResponse.json({ ok: true });
    const cookie = `habanuki_admin=1; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${60 * 60 * 24 * 7}`;
    res.headers.set("Set-Cookie", cookie);
    return res;
  }

  return new NextResponse("Unauthorized", { status: 401 });
}
