import "server-only";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { getLangChainChatModel } from "@/lib/ai/provider";

import type { UserMemory, UserMemoryCategory } from "./chat-memory";

const MEMORY_EXTRACTOR_PROMPT = `你负责从用户和 AI 助手的一轮对话中抽取值得长期保存的用户画像。

只保存稳定、对未来个性化回答有帮助的信息：
- 用户姓名、称呼
- 最近正在学习或正在做的项目
- 兴趣方向
- 回答风格偏好
- 长期目标

不要保存：
- 临时问题、一次性任务、普通闲聊
- 密码、token、API key、手机号、身份证等敏感信息
- 不确定或只是猜测的信息

只返回 JSON 数组，不要 Markdown，不要解释。最多返回 3 条。
字段：
- key: 英文 snake_case，简短稳定，例如 name、learning_current、interests、answer_preference、goal
- value: 中文自然语言，简洁
- category: profile | learning | interest | preference | goal | other
- confidence: 1-100

如果没有值得保存的信息，返回 []。`;

const CATEGORIES = new Set<UserMemoryCategory>([
  "profile",
  "learning",
  "interest",
  "preference",
  "goal",
  "other",
]);

type RawMemory = {
  key?: unknown;
  value?: unknown;
  category?: unknown;
  confidence?: unknown;
};

function parseJsonArray(text: string): unknown[] {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    try {
      const parsed = JSON.parse(match[0]);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

function normalizeMemory(item: RawMemory): UserMemory | null {
  if (typeof item.key !== "string" || typeof item.value !== "string") {
    return null;
  }

  const key = item.key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
  const value = item.value.trim().slice(0, 1000);
  const category = CATEGORIES.has(item.category as UserMemoryCategory)
    ? (item.category as UserMemoryCategory)
    : "other";
  const confidence =
    typeof item.confidence === "number" && Number.isFinite(item.confidence)
      ? Math.min(Math.max(Math.floor(item.confidence), 1), 100)
      : 80;

  if (!key || !value || confidence < 60) return null;

  return { key, value, category, confidence };
}

function getContentText(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }
  return "";
}

export async function extractUserMemories(input: {
  userMessage: string;
  assistantMessage: string;
}): Promise<UserMemory[]> {
  const userMessage = input.userMessage.trim();
  const assistantMessage = input.assistantMessage.trim();

  if (!userMessage || userMessage.length < 4) return [];

  try {
    const response = await getLangChainChatModel().invoke([
      new SystemMessage(MEMORY_EXTRACTOR_PROMPT),
      new HumanMessage(
        `用户消息：\n${userMessage}\n\nAI 助手回复：\n${assistantMessage}`,
      ),
    ]);

    return parseJsonArray(getContentText(response.content))
      .map((item) => normalizeMemory(item as RawMemory))
      .filter((memory): memory is UserMemory => Boolean(memory))
      .slice(0, 3);
  } catch {
    return [];
  }
}
