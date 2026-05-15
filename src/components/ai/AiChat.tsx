"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function getMessageText(msg: { parts: Array<{ type: string; text?: string }> }): string {
  return msg.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export default function AiChat() {
  const { messages, status, error, sendMessage } = useChat({
    id: "blog-ai",
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 消息区 */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-(--text-faint)">
              问我任何关于博客内容的问题，<br />
              我会从文章中检索相关信息回答你。
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const text = getMessageText(msg as any);
            if (!text) return null;
            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-7 ${
                    msg.role === "user"
                      ? "bg-(--theme-accent) text-white"
                      : "bg-(--card-bg-soft) text-(--text-strong) ring-1 ring-(--border-normal)"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none overflow-x-auto [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-900 [&_pre]:p-3 [&_pre]:text-sm [&_pre]:text-gray-100 [&_code]:break-all">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{text}</p>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" ? (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-(--card-bg-soft) px-4 py-3 text-sm text-(--text-sub) ring-1 ring-(--border-normal)">
              思考中...
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
            {error.message || "请求失败，请重试"}
          </div>
        ) : null}
      </div>

      {/* 输入区 */}
      <form onSubmit={onSubmit} className="border-t border-(--border-normal) px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit(event);
              }
            }}
            placeholder="输入问题... (Enter 发送，Shift+Enter 换行)"
            rows={1}
            className="min-h-[40px] max-h-[120px] min-w-0 flex-1 resize-none rounded-xl border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm text-(--text-strong) outline-none transition placeholder:text-(--text-faint) focus:border-(--theme-accent)"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--theme-accent) text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
