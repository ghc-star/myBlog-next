"use client";

import { ToggleLeft, ToggleRight } from "lucide-react";
import { useThemeStore } from "../../store/useThemeStore";
import { markThemePeelOrigin } from "@/lib/themePeel";

function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <button
      type="button"
      className="flex items-center justify-between px-5 text-sm lg:text-[16px]"
      onClick={(e) => {
        // 记录按钮中心作为"掀开"圆心，主题切换时从这一点圆形揭示新主题；
        // 元素不可见时 rect 为 0，此时不记录，走淡入淡出兜底
        const rect = e.currentTarget.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) {
          markThemePeelOrigin(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
        toggleTheme();
      }}
    >
      {theme === "dark" ? (
        <ToggleRight size={20} strokeWidth={1.6} color="var(--button-theme)" />
      ) : (
        <ToggleLeft size={20} strokeWidth={1.6} color="var(--button-theme)" />
      )}
      <span className="mx-2 select-none text-[var(--text-sub)] text-sm lg:text-[16px]">
        切换主题
      </span>
    </button>
  );
}

export default ThemeToggle;
