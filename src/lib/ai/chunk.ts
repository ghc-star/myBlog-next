export interface Chunk {
  text: string;
  index: number;
}

export function chunkMarkdown(content: string, maxTokens = 400): Chunk[] {
  // 按 H2/H3 标题切分
  const sections = content.split(/(?=^#{2,3}\s)/m);
  const chunks: Chunk[] = [];
  let index = 0;

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // 如果单段太长，按字数再切
    if (trimmed.length > maxTokens * 2) {
      const subChunks = splitByLength(trimmed, maxTokens * 2);
      for (const sub of subChunks) {
        chunks.push({ text: sub, index });
        index++;
      }
    } else {
      chunks.push({ text: trimmed, index });
      index++;
    }
  }

  return chunks;
}

function splitByLength(text: string, maxLen: number): string[] {
  const parts: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let buffer = "";

  for (const para of paragraphs) {
    if (buffer.length + para.length > maxLen && buffer) {
      parts.push(buffer.trim());
      buffer = "";
    }
    buffer += (buffer ? "\n\n" : "") + para;
  }

  if (buffer.trim()) {
    parts.push(buffer.trim());
  }

  return parts;
}
