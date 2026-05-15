"use client";

import { useAiDrawer } from "./useAiDrawer";
import AiChat from "./AiChat";

export default function AiDrawer() {
  const { open, setOpen } = useAiDrawer();

  return (
    <>
      {/* 遮罩 - 点击关闭 */}
      {open ? (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-60"
        />
      ) : null}

      {/* 抽屉 - 始终挂载，关闭时移出视口 */}
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

        <AiChat />
      </aside>
    </>
  );
}
