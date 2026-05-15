import "server-only";
import { db } from "./db";
import { RowDataPacket } from "mysql2";

export interface ArticleRecord {
  id: string;
  title: string;
  desc: string;
  date: string;
  tags: string[];
  category: string;
  categorySlug: string;
  cover: string | null;
  content: string;
  color: string;
  publishedAt: string;
  updatedAt: string;
  visits: number;
  comments: number;
}

export interface CategorySummary {
  name: string;
  slug: string;
  count: number;
  color: string;
}

type RawArticleRow = RowDataPacket & {
  id: string;
  title: string;
  desc: string;
  date: Date | string;
  tags: string;
  category: string;
  category_slug: string;
  cover: string | null;
  content: string;
  color: string;
  published_at: Date | string;
  updated_at: Date | string;
  visits: number;
  comments: number;
};

type RawCategorySummaryRow = RowDataPacket & {
  name: string;
  slug: string;
  count: number;
  color: string | null;
};

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags;
  }

  if (typeof tags !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}
function toArticle(row: RawArticleRow): ArticleRecord {
  return {
    id: row.id,
    title: row.title,
    desc: row.desc,
    date:
      typeof row.date === "string"
        ? row.date
        : row.date.toISOString().slice(0, 10),
    tags: parseTags(row.tags),
    category: row.category,
    categorySlug: row.category_slug,
    cover: row.cover,
    content: row.content,
    color: row.color,
    publishedAt:
      typeof row.published_at === "string"
        ? row.published_at
        : row.published_at.toISOString(),
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : row.updated_at.toISOString(),
    visits: row.visits,
    comments: row.comments,
  };
}
export async function getArticles() {
  const [rows] = await db.query<RawArticleRow[]>(
    `SELECT * FROM articles ORDER BY published_at DESC`,
  );

  return rows.map(toArticle);
}
export async function getArticleById(id: string) {
  const [rows] = await db.query<RawArticleRow[]>(
    `SELECT * FROM articles WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] ? toArticle(rows[0]) : null;
}
export async function getArticlesByCategorySlug(slug: string) {
  const [rows] = await db.query<RawArticleRow[]>(
    `SELECT * FROM articles WHERE category_slug = ? ORDER BY published_at DESC`,
    [slug],
  );

  return rows.map(toArticle);
}

export async function getCategorySummaries(): Promise<CategorySummary[]> {
  const [rows] = await db.query<RawCategorySummaryRow[]>(
    `
    SELECT
      category AS name,
      category_slug AS slug,
      COUNT(*) AS count,
      MIN(color) AS color
    FROM articles
    GROUP BY category, category_slug
    ORDER BY count DESC, name ASC
    `,
  );

  return rows.map((row) => ({
    name: row.name,
    slug: row.slug,
    count: Number(row.count),
    color: row.color ?? "#0ea5e9",
  }));
}


export interface ArticleStats {
  total: number;
  totalVisits: number;
  totalComments: number;
  recentArticles: ArticleRecord[];
}

export async function getArticleStats(): Promise<ArticleStats> {
  const [totalsRows] = await db.query<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total,
       COALESCE(SUM(visits), 0) AS total_visits,
       COALESCE(SUM(comments), 0) AS total_comments
     FROM articles`,
  );

  const totals = totalsRows[0] ?? {};
  const [recentRows] = await db.query<RawArticleRow[]>(
    `SELECT * FROM articles ORDER BY published_at DESC LIMIT 5`,
  );

  return {
    total: Number(totals.total ?? 0),
    totalVisits: Number(totals.total_visits ?? 0),
    totalComments: Number(totals.total_comments ?? 0),
    recentArticles: recentRows.map(toArticle),
  };
}

export interface UpdateArticleInput {
  title: string;
  desc: string;
  category: string;
  categorySlug: string;
  tags: string[];
  cover: string | null;
  color: string;
  content: string;
}

export async function updateArticle(id: string, input: UpdateArticleInput) {
  const now = new Date();
  await db.execute(
    `UPDATE articles SET
       title = ?,
       \`desc\` = ?,
       tags = ?,
       category = ?,
       category_slug = ?,
       cover = ?,
       content = ?,
       color = ?,
       updated_at = ?
     WHERE id = ?`,
    [
      input.title,
      input.desc,
      JSON.stringify(input.tags),
      input.category,
      input.categorySlug,
      input.cover ?? null,
      input.content,
      input.color,
      now,
      id,
    ],
  );
}

export async function deleteArticle(id: string) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM article_views WHERE article_id = ?`, [id]);
    await conn.execute(`DELETE FROM article_likes WHERE article_id = ?`, [id]);
    await conn.execute(
      `DELETE FROM article_reactions WHERE article_id = ?`,
      [id],
    );
    await conn.execute(
      `DELETE comment_likes FROM comment_likes
       JOIN comments ON comments.id = comment_likes.comment_id
       WHERE comments.article_id = ?`,
      [id],
    );
    await conn.execute(`DELETE FROM comments WHERE article_id = ?`, [id]);
    await conn.execute(`DELETE FROM articles WHERE id = ?`, [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
