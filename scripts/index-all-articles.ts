import { config } from "dotenv";
import mysql from "mysql2/promise";
import { QdrantClient } from "@qdrant/js-client-rest";

config({ path: ".env.development.local" });

const EMBEDDING_BASE_URL = process.env.EMBEDDING_BASE_URL!;
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY!;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "BAAI/bge-m3";
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 1024);
const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const COLLECTION = process.env.QDRANT_COLLECTION ?? "blog_articles_v1";

// --- Embedding ---
async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${EMBEDDING_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${EMBEDDING_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });

  if (!res.ok) {
    throw new Error(`Embedding failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  return json.data.map((item: { embedding: number[] }) => item.embedding);
}

// --- Chunking ---
function chunkMarkdown(content: string, maxLen = 800): string[] {
  const sections = content.split(/(?=^#{2,3}\s)/m);
  const chunks: string[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    if (trimmed.length > maxLen) {
      const paragraphs = trimmed.split(/\n\n+/);
      let buffer = "";
      for (const para of paragraphs) {
        if (buffer.length + para.length > maxLen && buffer) {
          chunks.push(buffer.trim());
          buffer = "";
        }
        buffer += (buffer ? "\n\n" : "") + para;
      }
      if (buffer.trim()) chunks.push(buffer.trim());
    } else {
      chunks.push(trimmed);
    }
  }

  return chunks;
}

// --- Main ---
async function main() {
  console.log("连接数据库...");
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("连接 Qdrant...");
  const qdrant = new QdrantClient({ url: QDRANT_URL });

  // 确保集合存在
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION);
  if (!exists) {
    console.log(`创建集合 ${COLLECTION}...`);
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: EMBEDDING_DIM, distance: "Cosine" },
    });
  } else {
    // 清空旧数据重建
    console.log(`清空集合 ${COLLECTION} 旧数据...`);
    await qdrant.delete(COLLECTION, {
      filter: { must: [{ key: "sourceType", match: { value: "article" } }] },
    });
  }

  // 拉所有文章
  const [rows] = await db.query<any[]>(
    "SELECT id, title, content FROM articles ORDER BY published_at DESC",
  );
  console.log(`共 ${rows.length} 篇文章`);

  let totalChunks = 0;
  const BATCH_SIZE = 5; // embedding 并发控制

  for (let i = 0; i < rows.length; i++) {
    const article = rows[i];
    const chunks = chunkMarkdown(article.content);
    if (chunks.length === 0) continue;

    console.log(
      `[${i + 1}/${rows.length}] ${article.title} → ${chunks.length} 块`,
    );

    // 分批 embedding
    for (let j = 0; j < chunks.length; j += BATCH_SIZE) {
      const batch = chunks.slice(j, j + BATCH_SIZE);
      const vectors = await embedBatch(batch);

      const points = batch.map((text, k) => ({
        id: `${article.id}-${j + k}`,
        vector: vectors[k],
        payload: {
          sourceType: "article",
          sourceId: article.id,
          title: article.title,
          chunkIndex: j + k,
          text,
          url: `/article/${article.id}`,
        },
      }));

      await qdrant.upsert(COLLECTION, { wait: true, points });
      totalChunks += points.length;
    }

    // 硅基流动免费档限速，加个小延迟
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\n✅ 索引完成！共写入 ${totalChunks} 个向量块`);
  await db.end();
}

main().catch((err) => {
  console.error("❌ 索引失败:", err);
  process.exit(1);
});
