const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 1024);

export { EMBEDDING_DIM };

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${process.env.EMBEDDING_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.EMBEDDING_MODEL ?? "BAAI/bge-m3",
      input: texts,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Embedding failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.data.map((item: { embedding: number[] }) => item.embedding);
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}
