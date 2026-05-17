"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import {
  deleteArticle,
  getArticleById,
  updateArticle,
} from "@/lib/article";
import {
  clearAllArticles,
  indexArticle,
  reindexAllArticles,
  reindexArticleById,
  unindexArticle,
  type IndexJobResult,
} from "@/lib/ai/admin-index";
import type { RowDataPacket } from "mysql2";

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface ArticleFormState {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function parseTags(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[,，\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    desc: String(formData.get("desc") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    categorySlug:
      String(formData.get("categorySlug") ?? "").trim() ||
      slugify(String(formData.get("category") ?? "")),
    tags: parseTags(formData.get("tags")),
    cover: String(formData.get("cover") ?? "").trim(),
    color: String(formData.get("color") ?? "").trim() || "#0ea5e9",
    content: String(formData.get("content") ?? "").trim(),
    customId: String(formData.get("id") ?? "").trim(),
  };
}

function validate(fields: ReturnType<typeof parseFields>) {
  const fieldErrors: Record<string, string> = {};
  if (!fields.title) fieldErrors.title = "标题必填";
  if (!fields.desc) fieldErrors.desc = "摘要必填";
  if (!fields.category) fieldErrors.category = "分类必填";
  if (!fields.categorySlug) fieldErrors.categorySlug = "分类 slug 必填";
  if (!fields.content) fieldErrors.content = "正文必填";
  return fieldErrors;
}

async function ensureUniqueId(base: string) {
  const candidate = base || "post";
  let suffix = 0;
  while (true) {
    const final = suffix === 0 ? candidate : `${candidate}-${suffix}`;
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 1 FROM articles WHERE id = ? LIMIT 1`,
      [final],
    );
    if (rows.length === 0) return final;
    suffix += 1;
  }
}

export async function createArticleAction(
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  await requireAdmin();
  const fields = parseFields(formData);
  const fieldErrors = validate(fields);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, message: "请检查字段" };
  }

  const baseId = fields.customId
    ? slugify(fields.customId)
    : slugify(fields.title);
  const id = await ensureUniqueId(baseId);
  const now = new Date();

  await db.execute(
    `INSERT INTO articles (
       id, title, \`desc\`, \`date\`, tags, category, category_slug,
       cover, content, color, published_at, updated_at, visits, comments
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      fields.title,
      fields.desc,
      now.toISOString().slice(0, 10),
      JSON.stringify(fields.tags),
      fields.category,
      fields.categorySlug,
      fields.cover || null,
      fields.content,
      fields.color,
      now,
      now,
      0,
      0,
    ],
  );

  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath(`/category/${fields.categorySlug}`);
  revalidatePath(`/article/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/articles");

  // 同步向量索引；失败不阻塞发布
  try {
    await indexArticle({
      id,
      title: fields.title,
      content: fields.content,
    });
  } catch (error) {
    console.error("[index] 索引新文章失败:", error);
  }

  redirect(`/admin/articles`);
}

export async function updateArticleAction(
  id: string,
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  await requireAdmin();
  const fields = parseFields(formData);
  const fieldErrors = validate(fields);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, message: "请检查字段" };
  }

  const existing = await getArticleById(id);
  if (!existing) {
    return { ok: false, message: "文章不存在" };
  }

  await updateArticle(id, {
    title: fields.title,
    desc: fields.desc,
    category: fields.category,
    categorySlug: fields.categorySlug,
    tags: fields.tags,
    cover: fields.cover || null,
    color: fields.color,
    content: fields.content,
  });

  revalidatePath("/");
  revalidatePath("/archive");
  if (existing.categorySlug !== fields.categorySlug) {
    revalidatePath(`/category/${existing.categorySlug}`);
  }
  revalidatePath(`/category/${fields.categorySlug}`);
  revalidatePath(`/article/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/articles");

  // 内容或标题变了，重建该篇向量；失败不阻塞保存
  try {
    if (
      existing.content !== fields.content ||
      existing.title !== fields.title
    ) {
      await indexArticle({
        id,
        title: fields.title,
        content: fields.content,
      });
    }
  } catch (error) {
    console.error("[index] 更新文章索引失败:", error);
  }

  return { ok: true, message: "已保存" };
}

export async function deleteArticleAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const existing = await getArticleById(id);
  if (!existing) return;

  await deleteArticle(id);

  // 同步清掉向量；失败不阻塞删除
  try {
    await unindexArticle(id);
  } catch (error) {
    console.error("[index] 删除文章向量失败:", error);
  }

  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath(`/category/${existing.categorySlug}`);
  revalidatePath(`/article/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
}

// ---------- 向量索引面板 ----------

export interface IndexActionState {
  ok?: boolean;
  message?: string;
  detail?: IndexJobResult;
  ts?: number;
}

export async function reindexArticleAction(
  _prev: IndexActionState,
  formData: FormData,
): Promise<IndexActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, message: "缺少文章 id", ts: Date.now() };
  const result = await reindexArticleById(id);
  return {
    ok: result.ok,
    message: result.message,
    ts: Date.now(),
  };
}

export async function reindexAllAction(
  _prev: IndexActionState,
  _formData: FormData,
): Promise<IndexActionState> {
  await requireAdmin();
  const result = await reindexAllArticles();
  return {
    ok: result.ok,
    message: result.message,
    detail: result,
    ts: Date.now(),
  };
}

export async function clearIndexAction(
  _prev: IndexActionState,
  _formData: FormData,
): Promise<IndexActionState> {
  await requireAdmin();
  const result = await clearAllArticles();
  return {
    ok: result.ok,
    message: result.message,
    ts: Date.now(),
  };
}
