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
