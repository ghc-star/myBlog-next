"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useAiDrawer } from "./useAiDrawer";

const AiChat = dynamic(() => import("./AiChat"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-sm text-(--text-sub)">
      AI 助手加载中...
    </div>
  ),
});

export default function AiDrawer() {
  const { open, setOpen } = useAiDrawer();
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => setChatMounted(true));
  }, [open]);

  // 打开后延迟挂遮罩，避免触发抽屉的那次触摸 / 点击被遮罩拦截关掉
  useEffect(() => {
    if (!open) {
      queueMicrotask(() => setOverlayMounted(false));
      return;
    }
    const timer = window.setTimeout(() => setOverlayMounted(true), 200);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <>
      {open && overlayMounted ? (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-60"
        />
      ) : null}

      <aside
        className={`fixed bottom-0 right-0 top-0 z-70 flex w-full flex-col border-l border-(--border-normal) bg-(--card-bg) shadow-2xl transition-transform duration-300 ease-out sm:w-[420px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-(--border-normal) px-4 py-3">
          <h2 className="text-sm font-semibold text-(--text-title)">
            AI 助手
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-(--text-sub) transition hover:bg-(--card-bg-soft) hover:text-(--text-title)"
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

        {chatMounted ? <AiChat /> : null}
      </aside>
    </>
  );
}
