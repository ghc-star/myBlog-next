import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";

import { recordSiteView } from "@/lib/site-views";
import { isSecureCookie } from "@/lib/auth";

const VISITOR_COOKIE = "visitor_key";

export async function POST(request: NextRequest) {
  const { path } = await request.json();
  if (typeof path !== "string" || !path) {
    return NextResponse.json({ message: "Invalid path" }, { status: 400 });
  }

  const cookieStore = await cookies();
  let visitorKey = cookieStore.get(VISITOR_COOKIE)?.value;
  const isNew = !visitorKey;
  if (!visitorKey) {
    visitorKey = crypto.randomUUID();
  }

  await recordSiteView({ visitorKey, path: path.slice(0, 255) });

  const response = NextResponse.json({ success: true });
  if (isNew) {
    response.cookies.set(VISITOR_COOKIE, visitorKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureCookie(),
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
