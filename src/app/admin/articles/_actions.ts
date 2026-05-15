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
import type { RowDataPacket } from "mysql2";
const { chunkMarkdown, embedTexts, upsertChunks } = await import("@/lib/ai");

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

  try {
  
  const chunks = chunkMarkdown(fields.content);
  if (chunks.length > 0) {
    const vectors = await embedTexts(chunks.map((c) => c.text));
    await upsertChunks(
      chunks.map((chunk, i) => ({
        id: `${id}-${i}`,
        vector: vectors[i],
        payload: {
          sourceType: "article" as const,
          sourceId: id,
          title: fields.title,
          chunkIndex: i,
          text: chunk.text,
          url: `/article/${id}`,
        },
      })),
    );
  }
} catch (error) {
  console.error("[index] 索引新文章失败:", error);
  // 不阻塞发布
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

  return { ok: true, message: "已保存" };
}

export async function deleteArticleAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const existing = await getArticleById(id);
  if (!existing) return;

  await deleteArticle(id);

  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath(`/category/${existing.categorySlug}`);
  revalidatePath(`/article/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
}
