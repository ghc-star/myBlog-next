import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { z } from "zod";

import { getChatModel } from "@/lib/ai";
import { getArticleById } from "@/lib/article";

const phrasesSchema = z.object({
  phrases: z.array(z.string().min(1).max(30)).length(6),
});

const SYSTEM_PROMPT = `你是博客的吉祥物小机器人，要在用户头顶气泡里说话。
风格：简短、俏皮、友好、偶尔吐槽。
要求：
- 每句不超过 20 字
- 部分语句结合文章主题，部分聊轻松日常
- 不要寒暄式废话（如"你好"），直接说有意思的内容
- 严格输出 JSON：{"phrases": ["...", "...", "...", "...", "...", "..."]}
- 必须 6 句，不能多也不能少
- 不要任何解释、不要 markdown 包裹`;

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

export async function POST(request: NextRequest) {
  const { articleId } = await request.json();
  const article = await getArticleById(String(articleId));

  if (!article) {
    return NextResponse.json({ message: "Article not found" }, { status: 404 });
  }

  const { text } = await generateText({
    model: getChatModel(),
    system: SYSTEM_PROMPT,
    prompt: `文章标题：${article.title}
分类：${article.category}
摘要：${article.desc}
标签：${article.tags.join("、")}

请生成 6 句小机器人会说的话，输出 JSON。`,
  });

  const parsed = phrasesSchema.parse(JSON.parse(extractJson(text)));
  return NextResponse.json(parsed);
}
