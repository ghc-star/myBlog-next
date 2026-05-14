import "server-only";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

import { db } from "./db";

export interface EssayRecord {
  id: number;
  userId: number;
  author: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  content: string;
  mood: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  ownedByMe: boolean;
}

export interface EssayCommentRecord {
  id: number;
  essayId: number;
  userId: number;
  author: string;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
}

type EssayRow = RowDataPacket & {
  id: number;
  user_id: number;
  author: string;
  avatar_url: string | null;
  profile_url: string | null;
  content: string;
  mood: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  like_count: number;
  comment_count: number;
  liked_by_me: 0 | 1;
};

type EssayCommentRow = RowDataPacket & {
  id: number;
  essay_id: number;
  user_id: number;
  author: string;
  avatar_url: string | null;
  content: string;
  created_at: Date | string;
};

declare global {
  // eslint-disable-next-line no-var
  var __essayTablesReady: Promise<void> | undefined;
}

const ESSAY_PAGE_SIZE = 10;

async function bootstrapEssayTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS essays (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      content TEXT NOT NULL,
      mood VARCHAR(32) NULL,
      status ENUM('published','deleted') NOT NULL DEFAULT 'published',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_essays_created (created_at),
      INDEX idx_essays_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS essay_likes (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      essay_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_essay_user (essay_id, user_id),
      INDEX idx_essay_likes_essay (essay_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS essay_comments (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      essay_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      content TEXT NOT NULL,
      status ENUM('published','deleted') NOT NULL DEFAULT 'published',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_essay_comments_essay (essay_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export function ensureEssayTables(): Promise<void> {
  if (!global.__essayTablesReady) {
    global.__essayTablesReady = bootstrapEssayTables().catch((error) => {
      global.__essayTablesReady = undefined;
      throw error;
    });
  }

  return global.__essayTablesReady;
}

function toIso(value: Date | string) {
  if (typeof value === "string") return value;
  return value.toISOString();
}

function toEssay(row: EssayRow, viewerId?: number): EssayRecord {
  return {
    id: row.id,
    userId: row.user_id,
    author: row.author,
    avatarUrl: row.avatar_url,
    profileUrl: row.profile_url,
    content: row.content,
    mood: row.mood,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    likeCount: Number(row.like_count ?? 0),
    commentCount: Number(row.comment_count ?? 0),
    likedByMe: Boolean(row.liked_by_me),
    ownedByMe: viewerId !== undefined && viewerId === row.user_id,
  };
}

function toComment(row: EssayCommentRow): EssayCommentRecord {
  return {
    id: row.id,
    essayId: row.essay_id,
    userId: row.user_id,
    author: row.author,
    avatarUrl: row.avatar_url,
    content: row.content,
    createdAt: toIso(row.created_at),
  };
}

export const ESSAY_PAGE_LIMIT = ESSAY_PAGE_SIZE;

export async function listEssays(options: {
  limit?: number;
  cursor?: number | null;
  viewerId?: number;
}): Promise<{ essays: EssayRecord[]; nextCursor: number | null }> {
  await ensureEssayTables();

  const limit = Math.min(Math.max(options.limit ?? ESSAY_PAGE_SIZE, 1), 50);
  const viewerId = options.viewerId ?? 0;
  const cursor = options.cursor ?? null;

  const params: Array<number> = [viewerId];
  let cursorClause = "";
  if (cursor) {
    cursorClause = "AND essays.id < ?";
    params.push(cursor);
  }
  params.push(limit + 1);

  const [rows] = await db.query<EssayRow[]>(
    `
    SELECT
      essays.id,
      essays.user_id,
      essays.content,
      essays.mood,
      essays.created_at,
      essays.updated_at,
      users.github_login AS author,
      users.avatar_url,
      users.profile_url,
      COALESCE(essay_like_counts.like_count, 0) AS like_count,
      COALESCE(essay_comment_counts.comment_count, 0) AS comment_count,
      EXISTS (
        SELECT 1
        FROM essay_likes my_likes
        WHERE my_likes.essay_id = essays.id AND my_likes.user_id = ?
      ) AS liked_by_me
    FROM essays
    JOIN users ON users.id = essays.user_id
    LEFT JOIN (
      SELECT essay_id, COUNT(*) AS like_count
      FROM essay_likes
      GROUP BY essay_id
    ) essay_like_counts ON essay_like_counts.essay_id = essays.id
    LEFT JOIN (
      SELECT essay_id, COUNT(*) AS comment_count
      FROM essay_comments
      WHERE status = 'published'
      GROUP BY essay_id
    ) essay_comment_counts ON essay_comment_counts.essay_id = essays.id
    WHERE essays.status = 'published' ${cursorClause}
    ORDER BY essays.id DESC
    LIMIT ?
    `,
    params,
  );

  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;
  const essays = trimmed.map((row) => toEssay(row, options.viewerId));
  const nextCursor = hasMore ? essays[essays.length - 1]?.id ?? null : null;

  return { essays, nextCursor };
}

export async function getEssayById(
  id: number,
  viewerId?: number,
): Promise<EssayRecord | null> {
  await ensureEssayTables();

  const [rows] = await db.query<EssayRow[]>(
    `
    SELECT
      essays.id,
      essays.user_id,
      essays.content,
      essays.mood,
      essays.created_at,
      essays.updated_at,
      users.github_login AS author,
      users.avatar_url,
      users.profile_url,
      COALESCE(essay_like_counts.like_count, 0) AS like_count,
      COALESCE(essay_comment_counts.comment_count, 0) AS comment_count,
      EXISTS (
        SELECT 1
        FROM essay_likes my_likes
        WHERE my_likes.essay_id = essays.id AND my_likes.user_id = ?
      ) AS liked_by_me
    FROM essays
    JOIN users ON users.id = essays.user_id
    LEFT JOIN (
      SELECT essay_id, COUNT(*) AS like_count
      FROM essay_likes
      GROUP BY essay_id
    ) essay_like_counts ON essay_like_counts.essay_id = essays.id
    LEFT JOIN (
      SELECT essay_id, COUNT(*) AS comment_count
      FROM essay_comments
      WHERE status = 'published'
      GROUP BY essay_id
    ) essay_comment_counts ON essay_comment_counts.essay_id = essays.id
    WHERE essays.id = ? AND essays.status = 'published'
    LIMIT 1
    `,
    [viewerId ?? 0, id],
  );

  return rows[0] ? toEssay(rows[0], viewerId) : null;
}

export async function createEssay(input: {
  userId: number;
  content: string;
  mood?: string | null;
}): Promise<number> {
  await ensureEssayTables();

  const [result] = await db.execute<ResultSetHeader>(
    `
    INSERT INTO essays (user_id, content, mood)
    VALUES (?, ?, ?)
    `,
    [input.userId, input.content, input.mood ?? null],
  );

  return Number(result.insertId);
}

export async function deleteEssay(id: number, userId: number): Promise<boolean> {
  await ensureEssayTables();

  const [result] = await db.execute<ResultSetHeader>(
    `
    UPDATE essays
    SET status = 'deleted'
    WHERE id = ? AND user_id = ? AND status = 'published'
    `,
    [id, userId],
  );

  return result.affectedRows > 0;
}

export async function toggleEssayLike(
  essayId: number,
  userId: number,
): Promise<{ likeCount: number; likedByMe: boolean }> {
  await ensureEssayTables();

  const [existingRows] = await db.query<RowDataPacket[]>(
    `SELECT id FROM essay_likes WHERE essay_id = ? AND user_id = ? LIMIT 1`,
    [essayId, userId],
  );

  const existing = existingRows[0];
  if (existing) {
    await db.execute<ResultSetHeader>(
      `DELETE FROM essay_likes WHERE id = ?`,
      [existing.id],
    );
  } else {
    await db.execute<ResultSetHeader>(
      `INSERT INTO essay_likes (essay_id, user_id) VALUES (?, ?)`,
      [essayId, userId],
    );
  }

  const [countRows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM essay_likes WHERE essay_id = ?`,
    [essayId],
  );

  return {
    likeCount: Number(countRows[0]?.count ?? 0),
    likedByMe: !existing,
  };
}

export async function listEssayComments(
  essayId: number,
): Promise<EssayCommentRecord[]> {
  await ensureEssayTables();

  const [rows] = await db.query<EssayCommentRow[]>(
    `
    SELECT
      essay_comments.id,
      essay_comments.essay_id,
      essay_comments.user_id,
      essay_comments.content,
      essay_comments.created_at,
      users.github_login AS author,
      users.avatar_url
    FROM essay_comments
    JOIN users ON users.id = essay_comments.user_id
    WHERE essay_comments.essay_id = ? AND essay_comments.status = 'published'
    ORDER BY essay_comments.id ASC
    `,
    [essayId],
  );

  return rows.map(toComment);
}

export async function createEssayComment(input: {
  essayId: number;
  userId: number;
  content: string;
}): Promise<number> {
  await ensureEssayTables();

  const [result] = await db.execute<ResultSetHeader>(
    `
    INSERT INTO essay_comments (essay_id, user_id, content)
    VALUES (?, ?, ?)
    `,
    [input.essayId, input.userId, input.content],
  );

  return Number(result.insertId);
}
