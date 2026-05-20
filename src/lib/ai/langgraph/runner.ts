import "server-only";

import {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
} from "@langchain/core/messages";
import { createUIMessageStream } from "ai";

import { blogAssistantAgent } from "./graph";

export type LangGraphChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function toLangChainMessage(message: LangGraphChatMessage) {
  return message.role === "assistant"
    ? new AIMessage(message.content)
    : new HumanMessage(message.content);
}

function hasToolCallChunk(message: AIMessageChunk) {
  return Boolean(
    message.tool_call_chunks?.length ||
      message.tool_calls?.length ||
      message.invalid_tool_calls?.length,
  );
}

function getMessageContentText(content: unknown): string {
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

export function streamBlogAssistantUI(input: {
  messages: LangGraphChatMessage[];
}) {
  return createUIMessageStream({
    async execute({ writer }) {
      const id = "langgraph-react-answer";
      let wroteText = false;

      writer.write({ type: "text-start", id });

      const stream = await blogAssistantAgent.stream(
        { messages: input.messages.map(toLangChainMessage) },
        { recursionLimit: 8, streamMode: "messages" },
      );

      for await (const event of stream) {
        const chunk = Array.isArray(event) ? event[0] : event;

        if (!AIMessageChunk.isInstance(chunk) || hasToolCallChunk(chunk)) {
          continue;
        }

        const text = getMessageContentText(chunk.content);
        if (!text) continue;

        wroteText = true;
        writer.write({ type: "text-delta", id, delta: text });
      }

      if (!wroteText) {
        writer.write({
          type: "text-delta",
          id,
          delta: "我暂时没有生成有效回答，请换个问法再试。",
        });
      }

      writer.write({ type: "text-end", id });
    },
    onError(error) {
      return error instanceof Error ? error.message : "请求失败，请重试";
    },
  });
}
