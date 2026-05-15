import { streamText, createUIMessageStreamResponse } from "ai";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getChatModel, embedQuery, searchChunks } from "@/lib/ai";

const SYSTEM_PROMPT = `你是一个博客助手，基于博客文章内容回答用户问题。
如果提供了参考片段，请优先基于这些内容回答，并在回答末尾标注引用来源。
如果参考片段不足以回答，可以结合自身知识补充，但要说明哪些是来自博客、哪些是补充。
回答使用中文，语气友好专业。`;

function extractTextFromMessage(msg: any): string {
  // v6 格式：msg.parts = [{ type: "text", text: "..." }]
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text ?? "")
      .join("");
  }
  // 兼容旧格式
  if (typeof msg.content === "string") return msg.content;
  return "";
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const rawMessages: any[] = body.messages ?? [];

  if (!rawMessages.length) {
    return NextResponse.json({ message: "消息不能为空" }, { status: 400 });
  }

  // 转成 { role, content } 格式给 streamText
  const messages = rawMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: extractTextFromMessage(m),
  }));

  // 取最后一条用户消息做 RAG 检索
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  let contextBlock = "";

  if (lastUserMsg && lastUserMsg.content) {
    try {
      const queryVec = await embedQuery(lastUserMsg.content);
      const hits = await searchChunks(queryVec, 5);

      if (hits.length > 0) {
        const fragments = hits.map(
          (hit, i) =>
            `[${i + 1}] 来源：${hit.payload.title}（${hit.payload.url}）\n${hit.payload.text}`,
        );
        contextBlock = `\n\n以下是从博客中检索到的相关片段：\n\n${fragments.join("\n\n---\n\n")}`;
      }
    } catch (error) {
      console.error("[ai/chat] RAG retrieval failed:", error);
    }
  }

  const systemMessage = SYSTEM_PROMPT + contextBlock;

 const result = streamText({
    model: getChatModel(),
    system: systemMessage,
    messages,
  });

  return createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
  });
}
