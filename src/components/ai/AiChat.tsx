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
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--theme-accent-soft)">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-(--theme-accent)">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                <line x1="10" y1="22" x2="14" y2="22" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-(--text-title)">
                你好，我是博客 AI 助手
              </p>
              <p className="mt-1 text-xs text-(--text-sub)">
                可以问我关于博客文章的任何问题，我会从内容中检索相关信息回答你。
              </p>
            </div>
            <div className="mt-2 grid w-full max-w-[320px] grid-cols-2 gap-2">
              {[
                { icon: "📚", label: "博客有哪些文章？", q: "博客里有哪些文章？" },
                { icon: "📊", label: "博客整体情况", q: "博客整体情况是什么样？" },
                { icon: "🔍", label: "讲讲 Next.js 迁移", q: "讲讲 Next.js 迁移相关的内容" },
                { icon: "💡", label: "推荐一篇文章", q: "推荐一篇值得读的文章" },
                { icon: "🌤️", label: "今天天气", q: "北京今天天气怎么样？" },
                { icon: "💬", label: "来一句", q: "来一句好的句子" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={isLoading}
                  onClick={() => sendMessage({ text: item.q })}
                  className="flex items-center gap-2 rounded-xl border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-left text-xs text-(--text-strong) transition hover:border-(--theme-accent) hover:bg-(--theme-accent-soft) hover:text-(--theme-accent) disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
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
