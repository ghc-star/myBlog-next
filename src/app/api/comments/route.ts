import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

type CommentRow = RowDataPacket & {
  id: number;
  article_id: string;
  parent_id: number | null;
  content: string;
  created_at: Date;
  author: string;
  avatar_url: string | null;
  like_count: number;
  liked_by_me: 0 | 1;
};

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get("articleId");
  if (!articleId) {
    return NextResponse.json({ message: "Missing articleId" }, { status: 400 });
  }
  const user = await getCurrentUser();
  const [rows] = await db.query<CommentRow[]>(
    `
    SELECT
      comments.id,
      comments.article_id,
      comments.parent_id,
      comments.content,
      comments.created_at,
      users.github_login AS author,
      users.avatar_url,
      COALESCE(comment_like_counts.like_count, 0) AS like_count,
      EXISTS (
        SELECT 1
        FROM comment_likes my_comment_likes
        WHERE my_comment_likes.comment_id = comments.id
          AND my_comment_likes.user_id = ?
      ) AS liked_by_me
    FROM comments
    JOIN users ON users.id = comments.user_id
    LEFT JOIN (
      SELECT comment_id, COUNT(*) AS like_count
      FROM comment_likes
      GROUP BY comment_id
    ) comment_like_counts ON comment_like_counts.comment_id = comments.id
    WHERE comments.article_id = ? AND comments.status = 'published'
    ORDER BY comments.created_at ASC
    `,
    [user?.id ?? 0, articleId],
  );

  return NextResponse.json({ comments: rows, isLoggedIn: Boolean(user) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  console.log(body);

  const articleId = String(body.articleId ?? "").trim();
  const content = String(body.content ?? "").trim();
  const parentId = body.parentId ? Number(body.parentId) : null;
  if (!articleId || !content) {
    return NextResponse.json({ message: "Missing content" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ message: "Comment too long" }, { status: 400 });
  }

  await db.execute(
    `
    INSERT INTO comments (article_id, user_id, parent_id, content)
    VALUES (?, ?, ?, ?)
    `,
    [articleId, user.id, parentId, content],
  );

  await db.execute("UPDATE articles SET comments = comments + 1 WHERE id = ?", [
    articleId,
  ]);
  return NextResponse.json({ success: true });
}
