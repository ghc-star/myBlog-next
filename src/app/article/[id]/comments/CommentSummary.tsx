import { AnimatePresence, motion } from "framer-motion";
import { SmilePlus, ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { quickTapMotion } from "./motion";
import type { CommentSort } from "./types";
import { redirectToGithubLogin } from "./utils";

type ReactionSummaryProps = {
  articleId: string;
};
const reactions = [
  { type: "like", icon: "👍" },
  { type: "dislike", icon: "👎" },
  { type: "laugh", icon: "😄" },
  { type: "hooray", icon: "🎉" },
  { type: "confused", icon: "😮" },
  { type: "heart", icon: "❤️" },
  { type: "rocket", icon: "🚀" },
  { type: "eyes", icon: "👀" },
] as const;
export function ReactionSummary({ articleId }: ReactionSummaryProps) {
  type ReactionType = (typeof reactions)[number]["type"];

  type ReactionCount = {
    reaction: ReactionType;
    count: number;
  };

  const [showReactionPanel, setShowReactionPanel] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<ReactionCount[]>([]);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [articleLikeCount, setArticleLikeCount] = useState(0);
  const [articleLikedByMe, setArticleLikedByMe] = useState(false);

  const fetchReactions = useCallback(async () => {
    const res = await fetch(
      `/api/reactions?articleId=${encodeURIComponent(articleId)}`,
      { cache: "no-store" },
    );

    if (!res.ok) return;
    const data = await res.json();
    setIsLoggedIn(data.isLoggedIn);
    setReactionCounts(data.reactions ?? []);
    setMyReaction(data.myReaction ?? null);
  }, [articleId]);

  const fetchArticleLike = useCallback(async () => {
    const res = await fetch(
      `/api/article-likes?articleId=${encodeURIComponent(articleId)}`,
      { cache: "no-store" },
    );

    if (!res.ok) return;

    const data = await res.json();
    setArticleLikeCount(Number(data.count ?? 0));
    setArticleLikedByMe(Boolean(data.likedByMe));
    setIsLoggedIn(Boolean(data.isLoggedIn));
  }, [articleId]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchReactions();
      void fetchArticleLike();
    });
  }, [fetchArticleLike, fetchReactions]);

  async function toggleReaction(reaction: ReactionType) {
    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        articleId,
        reaction,
      }),
    });
    if (res.status === 401) {
      redirectToGithubLogin();
      return;
    }
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "操作失败");
      return;
    }
    setReactionCounts(data.reactions ?? []);
    setMyReaction(data.myReaction ?? null);
  }

  async function toggleArticleLike() {
    const res = await fetch("/api/article-likes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        articleId,
      }),
    });

    if (res.status === 401) {
      redirectToGithubLogin();
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "操作失败");
      return;
    }

    setArticleLikeCount(Number(data.count ?? 0));
    setArticleLikedByMe(Boolean(data.likedByMe));
    setIsLoggedIn(Boolean(data.isLoggedIn));
  }
  const totalReactionCount = reactionCounts.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const myReactionIcon = reactions.find(
    (reaction) => reaction.type === myReaction,
  )?.icon;

  return (
    <div className="flex flex-col items-center justify-center gap-4 border-b border-[var(--border-normal)] pb-7 text-center">
      <h5 className="text-lg font-bold text-[var(--text-title)]">
        {totalReactionCount} 个表情
      </h5>

      <div className="flex items-center gap-3">
        <div
          className="relative"
          onMouseEnter={() => setShowReactionPanel(true)}
          onMouseLeave={() => setShowReactionPanel(false)}
        >
          <motion.button
            type="button"
            {...quickTapMotion}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-normal)] bg-[var(--card-bg)] text-[var(--text-sub)] transition hover:text-[var(--text-title)]"
          >
            {myReactionIcon ? (
              <span className="text-lg leading-none">{myReactionIcon}</span>
            ) : (
              <SmilePlus size={18} />
            )}
          </motion.button>

          <AnimatePresence>
            {showReactionPanel ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute -left-2 top-12 z-20 w-[220px] rounded-md border border-[var(--border-normal)] bg-[var(--card-bg)] text-left shadow-lg"
              >
                <span className="absolute -top-[7px] left-5 h-3 w-3 rotate-45 border-l border-t border-[var(--border-normal)] bg-[var(--card-bg)]" />

                {!isLoggedIn ? (
                  <div className="border-b border-[var(--border-normal)] px-4 py-3 text-sm text-[var(--text-sub)]">
                    <button
                      type="button"
                      onClick={redirectToGithubLogin}
                      className="font-semibold text-[var(--theme-accent)] hover:underline"
                    >
                      登录
                    </button>
                    后可添加回应。
                  </div>
                ) : null}

                <div className="grid grid-cols-4 gap-2 p-4">
                  {reactions.map((reaction) => (
                    <motion.button
                      key={reaction.type}
                      type="button"
                      whileHover={{ scale: 1.18 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleReaction(reaction.type)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-[var(--card-bg-soft)]"
                    >
                      {reaction.icon}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          {...quickTapMotion}
          className={`inline-flex items-center gap-2 rounded-full border bg-[var(--card-bg)] px-4 py-2 text-sm text-[var(--text-strong)] transition hover:border-[var(--theme-accent)] ${
            articleLikedByMe
              ? "border-[var(--theme-accent)]"
              : "border-[var(--border-normal)]"
          }`}
          onClick={() => {
            void toggleArticleLike();
          }}
        >
          <ThumbsUp
            size={16}
            className={
              articleLikedByMe ? "text-amber-500" : "text-[var(--text-sub)]"
            }
          />
          <span>{articleLikeCount}</span>
        </motion.button>
      </div>
    </div>
  );
}

type CommentStatsBarProps = {
  commentCount: number;
  replyCount: number;
  sort: CommentSort;
  onSortChange: (sort: CommentSort) => void;
};

export function CommentStatsBar({
  commentCount,
  replyCount,
  sort,
  onSortChange,
}: CommentStatsBarProps) {
  return (
    <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-sub)]">
        <span className="text-lg font-semibold text-[var(--text-title)] underline decoration-[var(--text-title)] underline-offset-4">
          {commentCount} 条评论
        </span>
        <span>·</span>
        <span>{replyCount} 条回复</span>
      </div>

      <div className="inline-flex rounded-full bg-[var(--card-bg-soft)] p-1">
        <motion.button
          type="button"
          onClick={() => onSortChange("oldest")}
          {...quickTapMotion}
          className={`rounded-full px-3 py-1 text-sm transition ${
            sort === "oldest"
              ? "bg-[var(--card-bg)] font-semibold text-[var(--text-title)] shadow-sm"
              : "text-[var(--text-sub)]"
          }`}
        >
          最早
        </motion.button>

        <motion.button
          type="button"
          onClick={() => onSortChange("latest")}
          {...quickTapMotion}
          className={`rounded-full px-3 py-1 text-sm transition ${
            sort === "latest"
              ? "bg-[var(--card-bg)] font-semibold text-[var(--text-title)] shadow-sm"
              : "text-[var(--text-sub)]"
          }`}
        >
          最新
        </motion.button>
      </div>
    </div>
  );
}
