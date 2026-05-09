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
