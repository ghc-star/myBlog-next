import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { fadeUpMotion, quickTapMotion } from "./motion";
import type { ApiComment } from "./types";
import { redirectToGithubLogin } from "./utils";

type InlineReplyBoxProps = {
  articleId: string;
  parent: ApiComment;
  onCancel: () => void;
  onSuccess: () => Promise<void>;
};

export function InlineReplyBox({
  articleId,
  parent,
  onCancel,
  onSuccess,
}: InlineReplyBoxProps) {
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const replyBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (!replyBoxRef.current) return;

      if (
        target instanceof Element &&
        target.closest(`[data-reply-toggle="${parent.id}"]`)
      ) {
        return;
      }

      if (!replyBoxRef.current.contains(target)) {
        onCancel();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel, parent.id]);

  async function submitReply() {
    const content = replyContent.trim();

    if (!content) {
      alert("回复内容不能为空");
      return;
    }

    setReplySubmitting(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          content,
          parentId: parent.id,
        }),
      });

      if (res.status === 401) {
        redirectToGithubLogin();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "回复失败");
      }

      setReplyContent("");
      onCancel();
      await onSuccess();
    } catch (error) {
      console.error("Create reply error:", error);
      alert(error instanceof Error ? error.message : "回复失败");
    } finally {
      setReplySubmitting(false);
    }
  }

  return (
    <motion.div
      ref={replyBoxRef}
      layout
      {...fadeUpMotion}
      className="mt-3 rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg)] p-3"
    >
      <div className="mb-2 text-xs text-[var(--text-sub)]">
        回复{" "}
        <span className="font-semibold text-[var(--theme-accent)]">
          @{parent.author}
        </span>
      </div>

      <textarea
        value={replyContent}
        onChange={(event) => setReplyContent(event.target.value)}
        placeholder={`回复 @${parent.author}`}
        maxLength={2000}
        className="min-h-[90px] w-full resize-y rounded-xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--text-strong)] outline-none placeholder:text-[var(--text-faint)]"
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-[var(--text-sub)]">
          {replyContent.length}/2000
        </span>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={onCancel}
            {...quickTapMotion}
            className="rounded-xl px-3 py-1.5 text-xs text-[var(--text-sub)] transition hover:bg-[var(--card-bg-soft)] hover:text-[var(--text-title)]"
          >
            取消
          </motion.button>

          <motion.button
            type="button"
            onClick={submitReply}
            disabled={replySubmitting || !replyContent.trim()}
            {...quickTapMotion}
            className="rounded-xl bg-[#238636] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {replySubmitting ? "回复中..." : "回复"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
