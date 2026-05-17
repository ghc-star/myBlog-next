import "server-only";

import {
  chunkMarkdown,
  deleteBySource,
  embedTexts,
  getCollectionStats,
  makePointId,
  recreateCollection,
  upsertChunks,
  type ChunkPayload,
  type CollectionStats,
} from "./index";
import { getArticleById, getArticles } from "@/lib/article";

/**
 * 把单篇文章索引进向量库（先删旧 chunk，再写新 chunk）。
 * - 用 makePointId 生成合法 UUID（v4 格式），Qdrant 不会再拒了
 * - 内容为空 / chunk 为 0 时只清旧数据
 */
export async function indexArticle(input: {
  id: string;
  title: string;
  content: string;
}) {
  // 旧 chunk 一律先清掉，避免标题改了 / 内容变短后老 chunk 残留
  await deleteBySource("article", input.id);

  const chunks = chunkMarkdown(input.content);
  if (chunks.length === 0) return { chunks: 0 };

  const vectors = await embedTexts(chunks.map((c) => c.text));
  await upsertChunks(
    chunks.map((chunk, i) => ({
      id: makePointId("article", input.id, i),
      vector: vectors[i],
      payload: {
        sourceType: "article",
        sourceId: input.id,
        title: input.title,
        chunkIndex: i,
        text: chunk.text,
        url: `/article/${input.id}`,
      } satisfies ChunkPayload,
    })),
  );

  return { chunks: chunks.length };
}

export async function unindexArticle(id: string) {
  await deleteBySource("article", id);
}

export interface IndexJobResult {
  ok: boolean;
  total: number;
  succeeded: number;
  failed: number;
  totalChunks: number;
  errors: Array<{ id: string; title: string; message: string }>;
  message?: string;
}

/**
 * 重建全部文章的索引：
 * 1. 清空整个 collection 重建（schema 一致）
 * 2. 逐篇 embed + upsert，控制并发
 * 3. 收集错误，单篇失败不阻塞整体
 */
export async function reindexAllArticles(): Promise<IndexJobResult> {
  const articles = await getArticles();
  const result: IndexJobResult = {
    ok: true,
    total: articles.length,
    succeeded: 0,
    failed: 0,
    totalChunks: 0,
    errors: [],
  };

  try {
    await recreateCollection();
  } catch (err) {
    return {
      ...result,
      ok: false,
      message:
        err instanceof Error
          ? `重建集合失败：${err.message}`
          : "重建集合失败",
    };
  }

  for (const article of articles) {
    try {
      const { chunks } = await indexArticle({
        id: article.id,
        title: article.title,
        content: article.content,
      });
      result.succeeded += 1;
      result.totalChunks += chunks;
      // 硅基流动免费档限速保护
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (err) {
      result.failed += 1;
      result.errors.push({
        id: article.id,
        title: article.title,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  result.ok = result.failed === 0;
  result.message = result.ok
    ? `已重建 ${result.succeeded} 篇 / ${result.totalChunks} 块`
    : `完成 ${result.succeeded}/${result.total}，失败 ${result.failed} 篇`;
  return result;
}

/**
 * 重建单篇文章的索引（按 id 拉最新内容）。
 */
export async function reindexArticleById(
  id: string,
): Promise<{ ok: boolean; chunks: number; message: string }> {
  const article = await getArticleById(id);
  if (!article) {
    return { ok: false, chunks: 0, message: "文章不存在" };
  }
  try {
    const { chunks } = await indexArticle({
      id: article.id,
      title: article.title,
      content: article.content,
    });
    return {
      ok: true,
      chunks,
      message: chunks === 0 ? "文章无可索引内容" : `已索引 ${chunks} 块`,
    };
  } catch (err) {
    return {
      ok: false,
      chunks: 0,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 清空整个集合（仍保留 schema）。
 */
export async function clearAllArticles(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    await recreateCollection();
    return { ok: true, message: "向量集合已清空" };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getIndexStats(): Promise<CollectionStats> {
  return getCollectionStats();
}
