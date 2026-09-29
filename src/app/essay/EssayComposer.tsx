"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";

import type { CurrentEssayUser, EssayDTO } from "./types";
import { redirectToGithubLogin } from "./utils";

const MAX_LENGTH = 1000;
const MAX_TEXTAREA_HEIGHT = 240;
const NEAR_LIMIT_RATIO = 0.9;

const moods = [
  { value: "", label: "默认" },
  { value: "happy", label: "😄 开心" },
  { value: "calm", label: "🌿 平静" },
  { value: "tired", label: "😴 疲惫" },
  { value: "thinking", label: "🤔 思考" },
  { value: "spicy", label: "🌶 吐槽" },
];

type EssayComposerProps = {
  isLoggedIn: boolean;
  currentUser: CurrentEssayUser;
  onPublished: (essay: EssayDTO) => void;
};

export default function EssayComposer({
  isLoggedIn,
  currentUser,
  onPublished,
}: EssayComposerProps) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 输入框随内容长高，到上限后改为滚动
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [content]);

  async function handleSubmit() {
    if (!isLoggedIn) {
      redirectToGithubLogin();
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setError("写点什么吧");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, mood: mood || null }),
      });

      if (res.status === 401) {
        redirectToGithubLogin();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "发布失败");

      if (data.essay) {
        onPublished(data.essay as EssayDTO);
      }

      setContent("");
      setMood("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  }

  const nearLimit = content.length >= MAX_LENGTH * NEAR_LIMIT_RATIO;

  return (
    <section
      aria-label="发布随笔"
      className="rounded-2xl border border-(--border-normal) bg-(--card-bg-soft) p-4 transition-colors focus-within:border-(--theme-accent-border) sm:p-5"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {currentUser?.avatarUrl ? (
          <Image
            src={currentUser.avatarUrl}
            alt={currentUser.author}
            width={44}
            height={44}
            className="h-11 w-11 flex-none rounded-full object-cover ring-1 ring-(--border-normal)"
          />
        ) : (
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-(--card-bg) text-(--text-faint) ring-1 ring-(--border-normal)">
            <Sparkles size={16} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              // Cmd / Ctrl + Enter 快速发布
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            maxLength={MAX_LENGTH}
            placeholder={
              isLoggedIn
                ? "记录一段当下的想法、灵感或心情..."
                : "登录 GitHub 后即可发布随笔"
            }
            className="min-h-[76px] w-full resize-none overflow-y-auto rounded-xl border border-(--border-normal) bg-(--card-bg) px-3.5 py-2.5 text-[15px] leading-7 text-(--text-title) outline-none transition placeholder:text-(--text-faint) focus:border-(--theme-accent) focus:ring-2 focus:ring-(--ring-soft)"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {moods.map((option) => {
                const active = option.value === mood;
                return (
                  <button
                    key={option.value || "default"}
                    type="button"
                    onClick={() => setMood(option.value)}
                    aria-pressed={active}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      active
                        ? "border-(--theme-accent) bg-(--theme-accent) text-white"
                        : "border-(--border-normal) text-(--text-sub) hover:border-(--theme-accent) hover:text-(--theme-accent)"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-3">
              <span
                className={`text-xs tabular-nums ${
                  nearLimit ? "text-amber-500" : "text-(--text-faint)"
                }`}
              >
                {content.length}/{MAX_LENGTH}
              </span>

              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-(--theme-accent) px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={14} />
                {submitting ? "发布中..." : isLoggedIn ? "发布" : "登录后发布"}
              </motion.button>
            </div>
          </div>

          {error ? (
            <p className="mt-2 text-xs text-rose-500">{error}</p>
          ) : null}

          {!isLoggedIn ? (
            <p className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-dashed border-(--border-normal) pt-3 text-xs text-(--text-sub)">
              想发布随笔或参与互动？
              <button
                type="button"
                onClick={redirectToGithubLogin}
                className="font-semibold text-(--theme-accent) hover:underline"
              >
                使用 GitHub 登录
              </button>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
