import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

const allowedReactions = [
  "like",
  "dislike",
  "laugh",
  "hooray",
  "confused",
  "heart",
  "rocket",
  "eyes",
] as const;
type ReactionType = (typeof allowedReactions)[number];
function isReactionType(value: string): value is ReactionType {
  return allowedReactions.includes(value as ReactionType);
}

async function getReactionSummary(articleId: string, userId?: number) {
  const [countRows] = await db.query<RowDataPacket[]>(
    `
    SELECT reaction,COUNT(*) AS count 
    FROM article_reactions 
    WHERE article_id=? 
    GROUP BY reaction
    `,
    [articleId],
  );
  let myReaction: string | null = null;
  if (userId) {
    const [myRows] = await db.query<RowDataPacket[]>(
      `
      SELECT reaction
      FROM article_reactions
      WHERE article_id = ? AND user_id = ?
      LIMIT 1
      `,
      [articleId, userId],
    );

    myReaction = myRows[0]?.reaction ?? null;
  }
  return {
    reactions: countRows.map((row) => ({
      reaction: String(row.reaction),
      count: Number(row.count),
    })),
    myReaction,
    total: countRows.reduce((sum, row) => sum + Number(row.count), 0),
  };
}

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get("articleId")?.trim();

  if (!articleId) {
    return NextResponse.json({ message: "Missing articleId" }, { status: 400 });
  }

  const user = await getCurrentUser();
  const summary = await getReactionSummary(articleId, user?.id);

  return NextResponse.json({
    reactions: summary.reactions,
    myReaction: summary.myReaction,
    total: summary.total,
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
  const reaction = String(body.reaction ?? "").trim();

  if (!articleId || !isReactionType(reaction)) {
    return NextResponse.json({ message: "Invalid reaction" }, { status: 400 });
  }

  const [existingRows] = await db.query<RowDataPacket[]>(
    `
    SELECT id, reaction
    FROM article_reactions
    WHERE article_id = ? AND user_id = ?
    LIMIT 1
    `,
    [articleId, user.id],
  );
  const existing = existingRows[0];
  if (!existing) {
    await db.execute(
      `
      INSERT INTO article_reactions (article_id, user_id, reaction)
      VALUES (?, ?, ?)
      `,
      [articleId, user.id, reaction],
    );
  } else if (existing.reaction === reaction) {
    await db.execute(
      `
      DELETE FROM article_reactions
      WHERE id = ?
      `,
      [existing.id],
    );
  } else {
    await db.execute(
      `
      UPDATE article_reactions
      SET reaction = ?
      WHERE id = ?
      `,
      [reaction, existing.id],
    );
  }
  const summary = await getReactionSummary(articleId, user.id);

  return NextResponse.json(summary);
}
