import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get("articleId");
  if (!articleId) {
    return NextResponse.json({ message: "Missing articleId" }, { status: 400 });
  }
  const [rows] = await db.query(
    `
    SELECT
      comments.id,
      comments.article_id,
      comments.parent_id,
      comments.content,
      comments.created_at,
      users.github_login AS author,
      users.avatar_url
    FROM comments
    JOIN users ON users.id = comments.user_id
    WHERE comments.article_id = ? AND comments.status = 'published'
    ORDER BY comments.created_at ASC
    `,
    [articleId],
  );

  return NextResponse.json({ comments: rows });
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
