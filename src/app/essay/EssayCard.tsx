"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Trash2 } from "lucide-react";

import EssayCommentPanel from "./EssayCommentPanel";
import type { EssayDTO } from "./types";
import { formatEssayShortDate, redirectToGithubLogin } from "./utils";

const moodLabels: Record<string, string> = {
  happy: "😄 开心",
  calm: "🌿 平静",
  tired: "😴 疲惫",
  thinking: "🤔 思考",
  spicy: "🌶 吐槽",
};

const actionButtonClass =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-60";

const idleActionClass =
  "border-(--border-normal) text-(--text-sub) hover:border-(--theme-accent) hover:text-(--theme-accent)";

type EssayCardProps = {
  essay: EssayDTO;
  isLoggedIn: boolean;
  onUpdate: (essay: EssayDTO) => void;
  onDelete: (essayId: number) => void;
};

export default function EssayCard({
  essay,
  isLoggedIn,
  onUpdate,
  onDelete,
}: EssayCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareTip, setShareTip] = useState<"copied" | null>(null);

  const commentToggleRef = useRef<HTMLButtonElement | null>(null);
  const commentPanelRef = useRef<HTMLDivElement | null>(null);

  // 点击评论区外部关闭
  useEffect(() => {
    if (!showComments) return;

    function handleMouseDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (commentPanelRef.current?.contains(target)) return;
      if (commentToggleRef.current?.contains(target)) return;
      setShowComments(false);
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [showComments]);

  // 分享提示自动消失
  useEffect(() => {
    if (!shareTip) return;
    const timer = window.setTimeout(() => setShareTip(null), 1600);
    return () => window.clearTimeout(timer);
  }, [shareTip]);

  async function toggleLike() {
    if (likeBusy) return;
    if (!isLoggedIn) {
      redirectToGithubLogin();
      return;
    }

    setLikeBusy(true);

    const prevLiked = essay.likedByMe;
    const prevCount = essay.likeCount;
    onUpdate({
      ...essay,
      likedByMe: !prevLiked,
      likeCount: prevLiked ? Math.max(prevCount - 1, 0) : prevCount + 1,
    });

    try {
      const res = await fetch("/api/essay-likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayId: essay.id }),
      });

      if (res.status === 401) {
        onUpdate({ ...essay, likedByMe: prevLiked, likeCount: prevCount });
        redirectToGithubLogin();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "操作失败");

      onUpdate({
        ...essay,
        likedByMe: Boolean(data.likedByMe),
        likeCount: Number(data.likeCount ?? 0),
      });
    } catch (err) {
      onUpdate({ ...essay, likedByMe: prevLiked, likeCount: prevCount });
      console.error("toggle essay like failed", err);
    } finally {
      setLikeBusy(false);
    }
  }

  async function handleDelete() {
    if (!essay.ownedByMe || deleting) return;
    if (!window.confirm("确认删除这条随笔？")) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/essays/${essay.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "删除失败");
      }
      onDelete(essay.id);
    } catch (err) {
      console.error("delete essay failed", err);
      alert(err instanceof Error ? err.message : "删除失败");
      setDeleting(false);
    }
  }

  function handleShare() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/essay#essay-${essay.id}`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => setShareTip("copied"))
        .catch(() => window.prompt("复制以下链接分享", url));
    } else {
      window.prompt("复制以下链接分享", url);
    }
  }

  const moodLabel = essay.mood ? moodLabels[essay.mood] : null;

  return (
    <motion.article
      layout
      id={`essay-${essay.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="scroll-mt-6 rounded-2xl border border-(--border-normal) bg-(--card-bg-soft) p-4 transition-colors hover:border-(--theme-accent-border) sm:p-5"
    >
      <div className="flex items-center gap-3">
        {essay.avatarUrl ? (
          <Image
            src={essay.avatarUrl}
            alt={essay.author}
            width={40}
            height={40}
            className="h-10 w-10 flex-none rounded-full object-cover ring-1 ring-(--border-normal)"
          />
        ) : (
          <div className="h-10 w-10 flex-none rounded-full bg-(--card-bg) ring-1 ring-(--border-normal)" />
        )}

        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold text-(--text-title)">
            {essay.author}
          </span>
          {moodLabel ? (
            <span className="flex-none rounded-full bg-(--theme-accent-soft) px-2 py-0.5 text-[11px] text-(--theme-accent)">
              {moodLabel}
            </span>
          ) : null}
        </div>

        <time
          className="ml-auto flex-none text-xs text-(--text-faint)"
          dateTime={essay.createdAt}
        >
          {formatEssayShortDate(essay.createdAt)}
        </time>
      </div>

      <p className="mt-3 whitespace-pre-wrap wrap-break-word text-[15px] leading-7 text-(--text-strong)">
        {essay.content}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={toggleLike}
          disabled={likeBusy}
          aria-pressed={essay.likedByMe}
          className={`${actionButtonClass} ${
            essay.likedByMe
              ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
              : `${idleActionClass} hover:border-rose-500/40 hover:text-rose-500`
          }`}
        >
          <Heart
            size={14}
            fill={essay.likedByMe ? "currentColor" : "none"}
            className="transition-transform active:scale-90"
          />
          <span className="tabular-nums">{essay.likeCount || 0}</span>
        </motion.button>

        <motion.button
          ref={commentToggleRef}
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => setShowComments((prev) => !prev)}
          aria-expanded={showComments}
          className={`${actionButtonClass} ${
            showComments
              ? "border-(--theme-accent) bg-(--theme-accent-soft) text-(--theme-accent)"
              : idleActionClass
          }`}
        >
          <MessageCircle size={14} />
          <span className="tabular-nums">{essay.commentCount || 0}</span>
        </motion.button>

        <div className="relative">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={handleShare}
            className={`${actionButtonClass} ${idleActionClass}`}
          >
            <Share2 size={14} />
            <span>分享</span>
          </motion.button>

          <AnimatePresence>
            {shareTip === "copied" ? (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.16 }}
                className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-gray-900/90 px-2 py-1 text-xs whitespace-nowrap text-white shadow-md"
              >
                已复制链接
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        {essay.ownedByMe ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-(--text-faint) transition hover:bg-rose-500/10 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={13} />
            {deleting ? "删除中" : "删除"}
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {showComments ? (
          <motion.div
            key="comments"
            ref={commentPanelRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <EssayCommentPanel
              essayId={essay.id}
              isLoggedIn={isLoggedIn}
              onCountChange={(count) =>
                onUpdate({ ...essay, commentCount: count })
              }
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
