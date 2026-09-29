import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import { RowDataPacket } from "mysql2";

/** 列表/卡片用的文章字段，不含正文（正文只进详情页和搜索索引） */
export interface ArticleSummary {
  id: string;
  title: string;
  desc: string;
  date: string;
  tags: string[];
  category: string;
  categorySlug: string;
  cover: string | null;
  color: string;
  publishedAt: string;
  updatedAt: string;
  visits: number;
  comments: number;
}

export type ArticleRecord = ArticleSummary & { content: string };

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

type RawArticleSummaryRow = Omit<RawArticleRow, "content">;

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
function toSummary(row: RawArticleSummaryRow): ArticleSummary {
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

function toArticle(row: RawArticleRow): ArticleRecord {
  return { ...toSummary(row), content: row.content };
}

/** 列表用：不查 content，减少传输与缓存体积 */
const ARTICLE_SUMMARY_COLUMNS = [
  "id",
  "title",
  "`desc`",
  "`date`",
  "tags",
  "category",
  "category_slug",
  "cover",
  "color",
  "published_at",
  "updated_at",
  "visits",
  "comments",
].join(", ");

// 数据缓存：文章相关查询统一打 "articles" tag，后台发文/改文/删文时 revalidateTag 即时失效。
// revalidate: 300 只是兜底 TTL（比如直接改库的情况），正常都走 tag 失效。
export const getArticleSummaries = unstable_cache(
  async (): Promise<ArticleSummary[]> => {
    const [rows] = await db.query<RawArticleRow[]>(
      `SELECT ${ARTICLE_SUMMARY_COLUMNS} FROM articles ORDER BY published_at DESC`,
    );

    return rows.map(toSummary);
  },
  ["articles:summaries"],
  { tags: ["articles"], revalidate: 300 },
);

/** 全量版本（含正文）：搜索、AI 检索、后台列表用 */
export const getArticles = unstable_cache(
  async (): Promise<ArticleRecord[]> => {
    const [rows] = await db.query<RawArticleRow[]>(
      `SELECT * FROM articles ORDER BY published_at DESC`,
    );

    return rows.map(toArticle);
  },
  ["articles:full"],
  { tags: ["articles"], revalidate: 300 },
);

/** 详情页用：需要实时性（ISR 页面级缓存已足够），不走数据缓存。
 *  React cache 保证 generateMetadata 和页面组件同请求只查一次库。 */
export const getArticleById = cache(async (id: string) => {
  const [rows] = await db.query<RawArticleRow[]>(
    `SELECT * FROM articles WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] ? toArticle(rows[0]) : null;
});

export const getArticlesByCategorySlug = unstable_cache(
  async (slug: string): Promise<ArticleRecord[]> => {
    const [rows] = await db.query<RawArticleRow[]>(
      `SELECT * FROM articles WHERE category_slug = ? ORDER BY published_at DESC`,
      [slug],
    );

    return rows.map(toArticle);
  },
  ["articles:by-category"],
  { tags: ["articles"], revalidate: 300 },
);

export const getCategorySummaries = unstable_cache(
  async (): Promise<CategorySummary[]> => {
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
  },
  ["articles:categories"],
  { tags: ["articles"], revalidate: 300 },
);

/** 把含正文的文章裁成列表字段，避免把全文序列化给客户端组件 */
export function toArticleSummary(article: ArticleRecord): ArticleSummary {
  return {
    id: article.id,
    title: article.title,
    desc: article.desc,
    date: article.date,
    tags: article.tags,
    category: article.category,
    categorySlug: article.categorySlug,
    cover: article.cover,
    color: article.color,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    visits: article.visits,
    comments: article.comments,
  };
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
