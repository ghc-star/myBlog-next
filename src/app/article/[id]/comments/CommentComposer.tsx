import { AnimatePresence, motion } from "framer-motion";
import { ScanFace, Send } from "lucide-react";

import { fadeUpMotion, quickTapMotion } from "./motion";

type CommentComposerProps = {
  mode: "input" | "preview";
  draft: string;
  submitting: boolean;
  isLoggedIn: boolean;
  onModeChange: (mode: "input" | "preview") => void;
  onDraftChange: (draft: string) => void;
  onLogin: () => void;
  onSubmit: () => void;
};

export function CommentComposer({
  mode,
  draft,
  submitting,
  isLoggedIn,
  onModeChange,
  onDraftChange,
  onLogin,
  onSubmit,
}: CommentComposerProps) {
  return (
    <div className="mt-7 rounded-3xl border border-[var(--border-normal)] bg-[var(--card-bg)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border-normal)] px-4 pt-2">
        <div className="flex items-end gap-2">
          <motion.button
            type="button"
            onClick={() => onModeChange("input")}
            {...quickTapMotion}
            className={`border border-b-0 px-3 py-2 text-sm transition ${
              mode === "input"
                ? "border-[var(--border-normal)] bg-[var(--card-bg)] font-semibold text-[var(--text-title)]"
                : "border-transparent text-[var(--text-sub)]"
            }`}
          >
            输入
          </motion.button>

          <motion.button
            type="button"
            onClick={() => onModeChange("preview")}
            {...quickTapMotion}
            className={`border border-b-0 px-3 py-2 text-sm transition ${
              mode === "preview"
                ? "border-[var(--border-normal)] bg-[var(--card-bg)] font-semibold text-[var(--text-title)]"
                : "border-transparent text-[var(--text-sub)]"
            }`}
          >
            预览
          </motion.button>
        </div>

        <span className="px-2 text-lg text-[var(--text-sub)]">Aa</span>
      </div>

      <div className="p-3">
        <AnimatePresence mode="wait" initial={false}>
          {mode === "input" ? (
            <motion.div key="input" {...fadeUpMotion}>
              <textarea
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
                placeholder="写下你的评论。未登录时提交会跳转 GitHub 登录。"
                maxLength={2000}
                className="min-h-[140px] w-full resize-y rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-5 py-4 text-base text-[var(--text-strong)] outline-none placeholder:text-[var(--text-faint)]"
              />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              {...fadeUpMotion}
              className="min-h-[140px] rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-5 py-4"
            >
              {draft.trim() ? (
                <p className="whitespace-pre-wrap break-words text-base leading-8 text-[var(--text-strong)]">
                  {draft}
                </p>
              ) : (
                <p className="text-base text-[var(--text-faint)]">
                  这里会显示评论预览内容
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-2 text-right text-xs text-[var(--text-sub)]">
          {draft.length}/2000
        </div>

        <div className="mt-4 flex justify-end gap-3">
          {!isLoggedIn && (
            <motion.button
              type="button"
              onClick={onLogin}
              {...quickTapMotion}
              className="inline-flex items-center gap-3 rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-4 py-2 text-sm font-semibold text-[var(--text-strong)] transition hover:border-[var(--theme-accent)]"
            >
              <ScanFace size={18} />
              GitHub 登录
            </motion.button>
          )}

          <motion.button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !draft.trim()}
            {...quickTapMotion}
            className="inline-flex items-center gap-3 rounded-2xl bg-[#238636] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_-10px_rgba(35,134,54,0.8)] transition hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={18} />
            {submitting ? "提交中..." : "发表评论"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
