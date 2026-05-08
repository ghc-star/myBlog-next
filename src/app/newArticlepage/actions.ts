"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createArticle(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const desc = String(formData.get("desc") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const categorySlug = String(formData.get("categorySlug") ?? "").trim();
  const tagsText = String(formData.get("tags") ?? "").trim();
  const cover = String(formData.get("cover") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim() || "#0ea5e9";
  const content = String(formData.get("content") ?? "").trim();

  if (!title || !desc || !category || !categorySlug || !content) {
    throw new Error("缺少必要字段");
  }
  const id = slugify(categorySlug);
  const now = new Date();
  const tags = tagsText
    ? tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
  await db.execute(
    `
    INSERT INTO articles (
      id, title, \`desc\`, \`date\`, tags, category, category_slug,
      cover, content, color, published_at, updated_at, visits, comments
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      title,
      desc,
      now.toISOString().slice(0, 10),
      JSON.stringify(tags),
      category,
      categorySlug,
      cover || null,
      content,
      color,
      now,
      now,
      0,
      0,
    ],
  );
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath(`/category/${categorySlug}`);
  revalidatePath(`/article/${id}`);

  redirect(`/article/${id}`);
}
