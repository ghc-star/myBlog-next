"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

import type { CurrentEssayUser, EssayDTO } from "./types";
import { redirectToGithubLogin } from "./utils";

const MAX_LENGTH = 1000;

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

  return (
    <div className="border-b border-dashed border-gray-200 pb-8">
      <div className="flex items-start gap-4">
        {currentUser?.avatarUrl ? (
          <Image
            src={currentUser.avatarUrl}
            alt={currentUser.author}
            width={48}
            height={48}
            className="h-12 w-12 flex-none rounded-md object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-md bg-gray-100 text-gray-400">
            <Sparkles size={18} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              if (error) setError(null);
            }}
            maxLength={MAX_LENGTH}
            placeholder={
              isLoggedIn
                ? "记录一段当下的想法、灵感或心情..."
                : "登录 GitHub 后即可发布随笔"
            }
            rows={3}
            className="w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2 text-base leading-7 text-(--text-title) outline-none transition placeholder:text-gray-400 focus:border-(--theme-accent)"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {moods.map((option) => {
                const active = option.value === mood;
                return (
                  <button
                    key={option.value || "default"}
                    type="button"
                    onClick={() => setMood(option.value)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      active
                        ? "border-(--theme-accent) bg-(--theme-accent-soft) text-(--theme-accent)"
                        : "border-gray-200 text-gray-500 hover:border-(--theme-accent) hover:text-(--text-title)"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>
                {content.length}/{MAX_LENGTH}
              </span>

              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-(--theme-accent) px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={14} />
                {submitting ? "发布中..." : isLoggedIn ? "发布" : "登录后发布"}
              </motion.button>
            </div>
          </div>

          {error ? <p className="mt-2 text-xs text-rose-500">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
