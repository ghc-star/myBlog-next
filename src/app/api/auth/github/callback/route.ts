import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createToken,
  hashToken,
  isSecureCookie,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("github_oauth_state")?.value;
  const returnTo = request.cookies.get("github_return_to")?.value || "/";

  if (!code || !state || state !== savedState) {
    return NextResponse.json(
      { message: "Invalid OAuth state" },
      { status: 400 },
    );
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.GITHUB_CALLBACK_URL!,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.json(
      { message: "Failed to get GitHub access token" },
      { status: 400 },
    );
  }
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });
  const githubUser = await userRes.json();
  if (!githubUser.id || !githubUser.login) {
    return NextResponse.json(
      { message: "Failed to get GitHub user" },
      { status: 400 },
    );
  }
  await db.execute(
    `
    INSERT INTO users (github_id, github_login, avatar_url, profile_url)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      github_login = VALUES(github_login),
      avatar_url = VALUES(avatar_url),
      profile_url = VALUES(profile_url)
    `,
    [
      githubUser.id,
      githubUser.login,
      githubUser.avatar_url,
      githubUser.html_url,
    ],
  );
  const [users] = await db.query<any[]>(
    "SELECT id FROM users WHERE github_id = ? LIMIT 1",
    [githubUser.id],
  );
  const sessionToken = createToken();
  await db.execute(
    `
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
    `,
    [users[0].id, hashToken(sessionToken)],
  );
  const response = NextResponse.redirect(
    new URL(returnTo, process.env.APP_URL),
  );

  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  response.cookies.delete("github_oauth_state");
  response.cookies.delete("github_return_to");

  return response;
}
