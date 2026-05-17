import crypto from "node:crypto";
import { QdrantClient } from "@qdrant/js-client-rest";

import { EMBEDDING_DIM } from "./embed";

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL ?? "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY || undefined,
});

export { qdrant };

const COLLECTION = process.env.QDRANT_COLLECTION ?? "blog_articles_v1";

export async function ensureCollection() {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION);
  if (exists) return;

  await qdrant.createCollection(COLLECTION, {
    vectors: {
      size: EMBEDDING_DIM,
      distance: "Cosine",
    },
  });
}

export interface ChunkPayload {
  sourceType: "article" | "essay";
  sourceId: string;
  title: string;
  chunkIndex: number;
  text: string;
  url: string;
}

export async function upsertChunks(
  points: Array<{
    id: string;
    vector: number[];
    payload: ChunkPayload;
  }>,
) {
  await ensureCollection();
  await qdrant.upsert(COLLECTION, {
    wait: true,
    points: points.map((p) => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload as unknown as Record<string, unknown>,
    })),
  });
}

export async function searchChunks(
  vector: number[],
  limit: number = 6,
): Promise<Array<{ score: number; payload: ChunkPayload }>> {
  await ensureCollection();
  const results = await qdrant.search(COLLECTION, {
    vector,
    limit,
    with_payload: true,
  });

  return results.map((r) => ({
    score: r.score,
    payload: r.payload as unknown as ChunkPayload,
  }));
}

export async function deleteBySource(sourceType: string, sourceId: string) {
  await ensureCollection();
  await qdrant.delete(COLLECTION, {
    filter: {
      must: [
        { key: "sourceType", match: { value: sourceType } },
        { key: "sourceId", match: { value: sourceId } },
      ],
    },
  });
}

export interface CollectionStats {
  collection: string;
  pointsCount: number;
  indexedVectorsCount: number;
  status: string;
  reachable: boolean;
  error?: string;
}

/**
 * 拿向量库当前状态。Qdrant 不可达时返回 reachable: false，不抛错，方便后台展示。
 */
export async function getCollectionStats(): Promise<CollectionStats> {
  try {
    await ensureCollection();
    const info = await qdrant.getCollection(COLLECTION);
    return {
      collection: COLLECTION,
      pointsCount: Number(info.points_count ?? 0),
      indexedVectorsCount: Number(info.indexed_vectors_count ?? 0),
      status: String(info.status ?? "unknown"),
      reachable: true,
    };
  } catch (err) {
    return {
      collection: COLLECTION,
      pointsCount: 0,
      indexedVectorsCount: 0,
      status: "unreachable",
      reachable: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 清空整个集合（重建并保留 schema）。慎用。
 */
export async function recreateCollection() {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION);
  if (exists) {
    await qdrant.deleteCollection(COLLECTION);
  }
  await qdrant.createCollection(COLLECTION, {
    vectors: {
      size: EMBEDDING_DIM,
      distance: "Cosine",
    },
  });
}

/**
 * 把 (sourceType, sourceId, chunkIndex) 映射成确定性 UUID
 * Qdrant 的 point id 必须是无符号整数或 UUID
 * 同一份内容多次跑出来的 UUID 一致，可以正确覆盖旧数据，不会留垃圾点
 */
export function makePointId(
  sourceType: string,
  sourceId: string,
  chunkIndex: number,
): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${sourceType}:${sourceId}:${chunkIndex}`)
    .digest("hex");

  // 拼成 UUID v4 格式（确定性，但格式合规）
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) +
      hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}
