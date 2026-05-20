import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";
import { NextRequest, NextResponse } from "next/server";

import { getChatModel } from "@/lib/ai/provider";
import { prepareBlogAssistantStream } from "@/lib/ai/langgraph/runner";

function extractTextFromMessage(msg: unknown): string {
  if (msg && typeof msg === "object") {
    const message = msg as {
      parts?: Array<{ type?: string; text?: string }>;
      content?: unknown;
    };

    if (Array.isArray(message.parts)) {
      return message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text ?? "")
        .join("");
    }

    if (typeof message.content === "string") return message.content;
  }

  return "";
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const rawMessages: unknown[] = Array.isArray(body?.messages)
    ? body.messages
    : [];

  if (!rawMessages.length) {
    return NextResponse.json({ message: "消息不能为空" }, { status: 400 });
  }

  const messages = rawMessages.map((message) => ({
    role: ((message as { role?: string })?.role ?? "user") as
      | "user"
      | "assistant",
    content: extractTextFromMessage(message),
  }));

  const prepared = await prepareBlogAssistantStream({ messages });

  if ("fallbackAnswer" in prepared) {
    const stream = createUIMessageStream({
      execute({ writer }) {
        const id = "langgraph-fallback";
        writer.write({ type: "text-start", id });
        writer.write({
          type: "text-delta",
          id,
          delta: prepared.fallbackAnswer,
        });
        writer.write({ type: "text-end", id });
      },
      onError(error) {
        return error instanceof Error ? error.message : "请求失败，请重试";
      },
    });

    return createUIMessageStreamResponse({ stream });
  }

  const result = streamText({
    model: getChatModel(),
    system: prepared.system,
    prompt: prepared.prompt,
  });

  return createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
  });
}
