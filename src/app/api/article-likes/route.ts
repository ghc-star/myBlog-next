import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

type ArticleLikeCountRow = RowDataPacket & {
  count: number;
};

type ArticleLikeRow = RowDataPacket & {
  id: number;
};

async function getArticleLikeSummary(articleId: string, userId?: number) {
  const [countRows] = await db.query<ArticleLikeCountRow[]>(
    `
    SELECT COUNT(*) AS count
    FROM article_likes
    WHERE article_id = ?
    `,
    [articleId],
  );

  let likedByMe = false;

  if (userId) {
    const [likedRows] = await db.query<ArticleLikeRow[]>(
      `
      SELECT id
      FROM article_likes
      WHERE article_id = ? AND user_id = ?
      LIMIT 1
      `,
      [articleId, userId],
    );

    likedByMe = Boolean(likedRows[0]);
  }

  return {
    count: Number(countRows[0]?.count ?? 0),
    likedByMe,
  };
}

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get("articleId")?.trim();

  if (!articleId) {
    return NextResponse.json({ message: "Missing articleId" }, { status: 400 });
  }

  const user = await getCurrentUser();
  const summary = await getArticleLikeSummary(articleId, user?.id);

  return NextResponse.json({
    ...summary,
    isLoggedIn: Boolean(user),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const articleId = String(body.articleId ?? "").trim();

  if (!articleId) {
    return NextResponse.json({ message: "Missing articleId" }, { status: 400 });
  }

  const [existingRows] = await db.query<ArticleLikeRow[]>(
    `
    SELECT id
    FROM article_likes
    WHERE article_id = ? AND user_id = ?
    LIMIT 1
    `,
    [articleId, user.id],
  );

  const existing = existingRows[0];

  if (existing) {
    await db.execute<ResultSetHeader>(
      `
      DELETE FROM article_likes
      WHERE id = ?
      `,
      [existing.id],
    );
  } else {
    await db.execute<ResultSetHeader>(
      `
      INSERT INTO article_likes (article_id, user_id)
      VALUES (?, ?)
      `,
      [articleId, user.id],
    );
  }

  const summary = await getArticleLikeSummary(articleId, user.id);

  return NextResponse.json({
    ...summary,
    isLoggedIn: true,
  });
}
