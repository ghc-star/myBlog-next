"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DiffOp = "same" | "add" | "del";

/** 行级最长公共子序列 diff */
function diffLines(a: string, b: string): Array<{ op: DiffOp; text: string }> {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const m = aLines.length;
  const n = bLines.length;

  // dp[i][j] = LCS length of aLines[i..] / bLines[j..]
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const out: Array<{ op: DiffOp; text: string }> = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (aLines[i] === bLines[j]) {
      out.push({ op: "same", text: aLines[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ op: "del", text: aLines[i] });
      i++;
    } else {
      out.push({ op: "add", text: bLines[j] });
      j++;
    }
  }
  while (i < m) {
    out.push({ op: "del", text: aLines[i++] });
  }
  while (j < n) {
    out.push({ op: "add", text: bLines[j++] });
  }
  return out;
}

interface PolishDiffOverlayProps {
  open: boolean;
  original: string;
  modeLabel: string;
  /** 实时流式输出 */
  draft: string;
  /** 是否还在生成 */
  loading: boolean;
  onApply: (text: string) => void;
  onClose: () => void;
}

export default function PolishDiffOverlay({
  open,
  original,
  modeLabel,
  draft,
  loading,
  onApply,
  onClose,
}: PolishDiffOverlayProps) {
  const [copied, setCopied] = useState(false);
  const draftBoxRef = useRef<HTMLDivElement | null>(null);

  const ops = useMemo(
    () => (draft ? diffLines(original, draft) : []),
    [original, draft],
  );

  // 流式期间自动滚到底部
  useEffect(() => {
    if (loading && draftBoxRef.current) {
      draftBoxRef.current.scrollTop = draftBoxRef.current.scrollHeight;
    }
  }, [draft, loading]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  const stats = ops.reduce(
    (acc, op) => {
      if (op.op === "add") acc.add++;
      else if (op.op === "del") acc.del++;
      return acc;
    },
    { add: 0, del: 0 },
  );

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-full max-h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-(--card-bg) shadow-2xl ring-1 ring-(--border-normal)">
        <header className="flex items-center justify-between border-b border-(--border-normal) px-5 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-(--text-title)">
              AI 润色 · {modeLabel}
            </h3>
            <div className="flex items-center gap-2 text-xs text-(--text-sub)">
              <span className="text-emerald-600">+{stats.add}</span>
              <span className="text-rose-500">-{stats.del}</span>
              {loading ? (
                <span className="text-(--text-faint)">生成中...</span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md p-1 text-(--text-sub) transition hover:bg-(--card-bg-soft) hover:text-(--text-title) disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-(--border-normal)">
          {/* 左：原文 */}
          <div className="flex min-h-0 flex-col">
            <div className="border-b border-(--border-normal) bg-(--card-bg-soft) px-4 py-1.5 text-xs text-(--text-sub)">
              原文
            </div>
            <pre className="flex-1 overflow-auto whitespace-pre-wrap wrap-break-word px-4 py-3 font-mono text-xs leading-6 text-(--text-strong)">
              {original}
            </pre>
          </div>

          {/* 右：流式 diff */}
          <div className="flex min-h-0 flex-col">
            <div className="border-b border-(--border-normal) bg-(--card-bg-soft) px-4 py-1.5 text-xs text-(--text-sub)">
              AI 输出
            </div>
            <div
              ref={draftBoxRef}
              className="flex-1 overflow-auto px-2 py-3 font-mono text-xs leading-6"
            >
              {ops.length === 0 && loading ? (
                <div className="px-2 text-(--text-faint)">等待输出…</div>
              ) : (
                ops.map((op, idx) => (
                  <div
                    key={idx}
                    className={
                      op.op === "add"
                        ? "rounded bg-emerald-50 px-2 py-0.5 text-emerald-800"
                        : op.op === "del"
                          ? "rounded bg-rose-50 px-2 py-0.5 text-rose-700 line-through opacity-70"
                          : "px-2 py-0.5 text-(--text-strong)"
                    }
                  >
                    {op.op === "add" ? "+ " : op.op === "del" ? "- " : "  "}
                    {op.text || "\u00A0"}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-(--border-normal) bg-(--card-bg-soft) px-5 py-3">
          <button
            type="button"
            disabled={loading || !draft}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(draft);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              } catch {}
            }}
            className="rounded-md border border-(--border-normal) px-3 py-1.5 text-xs text-(--text-sub) transition hover:border-(--theme-accent) hover:text-(--theme-accent) disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? "已复制" : "复制"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-(--border-normal) px-3 py-1.5 text-xs text-(--text-sub) transition hover:text-(--text-title) disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={loading || !draft || draft === original}
            onClick={() => onApply(draft)}
            className="rounded-md bg-(--theme-accent) px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            应用到正文
          </button>
        </footer>
      </div>
    </div>
  );
}
