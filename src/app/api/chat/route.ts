import { streamText, createUIMessageStreamResponse, stepCountIs } from "ai";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getChatModel, blogTools } from "@/lib/ai";

const SYSTEM_PROMPT = `你是博客的 AI 助手，帮助用户了解博客内容并回答问题。

你可以调用以下工具：
- getBlogStats：获取博客全貌（总文章数、分类分布）
- listArticles：列出文章标题、分类、日期、摘要
- getArticlesByCategory：按分类 slug 查询该分类下的文章
- readArticle：根据 id 读某篇文章的完整内容
- searchBlog：在博客全文做语义搜索，返回相关片段
- getHitokoto：获取一句优美的中文短句（一言）
- getWeather：查询中国某城市的实时或未来几天天气

调用规则：
- 用户问『有多少文章』『有哪些分类』『博客整体情况』→ 调 getBlogStats
- 用户问『列出文章』『最近写了什么』『推荐』→ 调 listArticles
- 用户问『某分类下的文章』→ 调 getArticlesByCategory
- 用户问具体技术问题、想了解某个话题在博客里怎么讲的 → 调 searchBlog
- 用户想看某篇文章的完整内容 → 调 readArticle
- 用户说『来一句』『一言』『分享一句好句子』『励志一句』 → 调 getHitokoto，并把句子和出处友好地说给用户听
- 用户问『某城市天气』『今天天气怎么样』『某地下雨吗』 → 调 getWeather；问到未来天气时把 forecast 设为 true
- 拿到工具结果后用中文友好地回答，引用文章时附标题
- 不要编造工具里没有的内容
- 一次回复内可以调用多个工具组合获取信息`;

function extractTextFromMessage(msg: unknown): string {
  if (msg && typeof msg === "object") {
    const m = msg as { parts?: Array<{ type?: string; text?: string }>; content?: unknown };
    if (Array.isArray(m.parts)) {
      return m.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("");
    }
    if (typeof m.content === "string") return m.content;
  }
  return "";
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const rawMessages: unknown[] = Array.isArray(body?.messages) ? body.messages : [];

  if (!rawMessages.length) {
    return NextResponse.json({ message: "消息不能为空" }, { status: 400 });
  }

  const messages = rawMessages.map((m) => ({
    role: ((m as { role?: string })?.role ?? "user") as "user" | "assistant",
    content: extractTextFromMessage(m),
  }));

  const result = streamText({
    model: getChatModel(),
    system: SYSTEM_PROMPT,
    messages,
    tools: blogTools,
    stopWhen: stepCountIs(5),
  });

  return createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
  });
}
