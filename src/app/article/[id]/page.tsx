import type { Metadata } from "next";
import { getArticleById } from "@/lib/article";

import ArticleDetailClient from "./ArticleDetailClient";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    return {
      title: "文章不存在 | My Blog",
    };
  }

  return {
    title: `${article.title} | My Blog`,
    description: article.desc,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) {
    notFound();
  }
  return <ArticleDetailClient article={article} />;
}
