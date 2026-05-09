import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import type { RowDataPacket } from "mysql2";

export const SESSION_COOKIE = "blog_session";

export function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isSecureCookie() {
  return process.env.APP_URL?.startsWith("https://") ?? false;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT users.id, users.github_id, users.github_login, users.avatar_url, users.profile_url, users.role
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > NOW()
    LIMIT 1
    `,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}
