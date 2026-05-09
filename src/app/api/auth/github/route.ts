import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isSecureCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const state = crypto.randomUUID();
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_CALLBACK_URL!,
    scope: "read:user user:email",
    state,
  });
  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params}`,
  );
  response.cookies.set("github_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("github_return_to", returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
