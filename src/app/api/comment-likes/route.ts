import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

type CommentLikeCountRow = RowDataPacket & {
  count: number;
};

type CommentLikeRow = RowDataPacket & {
  id: number;
};

async function getCommentLikeSummary(commentId: number, userId?: number) {
  const [countRows] = await db.query<CommentLikeCountRow[]>(
    `
    SELECT COUNT(*) AS count
    FROM comment_likes
    WHERE comment_id = ?
    `,
    [commentId],
  );

  let likedByMe = false;

  if (userId) {
    const [likedRows] = await db.query<CommentLikeRow[]>(
      `
      SELECT id
      FROM comment_likes
      WHERE comment_id = ? AND user_id = ?
      LIMIT 1
      `,
      [commentId, userId],
    );

    likedByMe = Boolean(likedRows[0]);
  }

  return {
    commentId,
    count: Number(countRows[0]?.count ?? 0),
    likedByMe,
  };
}

export async function GET(request: NextRequest) {
  const commentId = Number(request.nextUrl.searchParams.get("commentId"));

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return NextResponse.json({ message: "Invalid commentId" }, { status: 400 });
  }

  const user = await getCurrentUser();
  const summary = await getCommentLikeSummary(commentId, user?.id);

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
  const commentId = Number(body.commentId);

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return NextResponse.json({ message: "Invalid commentId" }, { status: 400 });
  }

  const [existingRows] = await db.query<CommentLikeRow[]>(
    `
    SELECT id
    FROM comment_likes
    WHERE comment_id = ? AND user_id = ?
    LIMIT 1
    `,
    [commentId, user.id],
  );

  const existing = existingRows[0];

  if (existing) {
    await db.execute<ResultSetHeader>(
      `
      DELETE FROM comment_likes
      WHERE id = ?
      `,
      [existing.id],
    );
  } else {
    await db.execute<ResultSetHeader>(
      `
      INSERT INTO comment_likes (comment_id, user_id)
      VALUES (?, ?)
      `,
      [commentId, user.id],
    );
  }

  const summary = await getCommentLikeSummary(commentId, user.id);

  return NextResponse.json({
    ...summary,
    isLoggedIn: true,
  });
}
