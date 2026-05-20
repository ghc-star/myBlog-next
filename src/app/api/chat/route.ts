import { createUIMessageStreamResponse } from "ai";
import { NextRequest, NextResponse } from "next/server";

import { streamBlogAssistantUI } from "@/lib/ai/langgraph/runner";
import {
  appendChatMessages,
  formatUserMemoriesForPrompt,
  loadRecentChatMessages,
  loadUserMemories,
  upsertUserMemories,
} from "@/lib/ai/chat-memory";
import { extractUserMemories } from "@/lib/ai/memory-extractor";
import { getCurrentUser } from "@/lib/auth";

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

  const parsedMessages = rawMessages
    .map((message) => ({
      role:
        (message as { role?: string })?.role === "assistant"
          ? ("assistant" as const)
          : ("user" as const),
      content: extractTextFromMessage(message),
    }))
    .filter((message) => message.content.trim());

  const lastUserMessage = [...parsedMessages]
    .reverse()
    .find((message) => message.role === "user");

  if (!lastUserMessage) {
    return NextResponse.json({ message: "消息不能为空" }, { status: 400 });
  }

  const currentUser = await getCurrentUser();
  const userId = currentUser ? Number(currentUser.id) : null;

  if (!userId) {
    return createUIMessageStreamResponse({
      stream: streamBlogAssistantUI({ messages: parsedMessages }),
    });
  }

  const [recentMessages, userMemories] = await Promise.all([
    loadRecentChatMessages(userId, 6),
    loadUserMemories(userId),
  ]);
  const memoryContext = formatUserMemoriesForPrompt(userMemories);

  return createUIMessageStreamResponse({
    stream: streamBlogAssistantUI({
      messages: [...recentMessages, lastUserMessage],
      memoryContext,
      async onFinishText(assistantText) {
        await appendChatMessages(userId, [
          { role: "user", content: lastUserMessage.content },
          { role: "assistant", content: assistantText },
        ]);

        const memories = await extractUserMemories({
          userMessage: lastUserMessage.content,
          assistantMessage: assistantText,
        });
        await upsertUserMemories(userId, memories);
      },
    }),
  });
}
