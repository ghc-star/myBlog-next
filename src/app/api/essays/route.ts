import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  ESSAY_PAGE_LIMIT,
  createEssay,
  getEssayById,
  listEssays,
} from "@/lib/essay";

const MAX_CONTENT = 1000;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const cursorParam = request.nextUrl.searchParams.get("cursor");
  const limitParam = request.nextUrl.searchParams.get("limit");

  const cursor = cursorParam ? Number(cursorParam) : null;
  const limit = limitParam ? Number(limitParam) : ESSAY_PAGE_LIMIT;

  if (cursor !== null && (!Number.isInteger(cursor) || cursor <= 0)) {
    return NextResponse.json({ message: "Invalid cursor" }, { status: 400 });
  }

  const { essays, nextCursor } = await listEssays({
    cursor,
    limit,
    viewerId: user?.id,
  });

  return NextResponse.json({
    essays,
    nextCursor,
    isLoggedIn: Boolean(user),
    currentUser: user
      ? {
          id: user.id,
          author: user.github_login,
          avatarUrl: user.avatar_url,
          profileUrl: user.profile_url,
        }
      : null,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const content = String(body?.content ?? "").trim();
  const moodRaw = body?.mood;
  const mood =
    typeof moodRaw === "string" && moodRaw.trim()
      ? moodRaw.trim().slice(0, 32)
      : null;

  if (!content) {
    return NextResponse.json(
      { message: "随笔内容不能为空" },
      { status: 400 },
    );
  }

  if (content.length > MAX_CONTENT) {
    return NextResponse.json(
      { message: `随笔内容不能超过 ${MAX_CONTENT} 字` },
      { status: 400 },
    );
  }

  const id = await createEssay({ userId: user.id, content, mood });
  const essay = await getEssayById(id, user.id);

  return NextResponse.json({ essay }, { status: 201 });
}
