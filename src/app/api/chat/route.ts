import { createUIMessageStreamResponse } from "ai";
import { NextRequest, NextResponse } from "next/server";

import { streamBlogAssistantUI } from "@/lib/ai/langgraph/runner";

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

  return createUIMessageStreamResponse({
    stream: streamBlogAssistantUI({ messages }),
  });
}
