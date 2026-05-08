"use client";

import { ToggleLeft, ToggleRight } from "lucide-react";
import { useThemeStore } from "../../store/useThemeStore";

function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <button
      type="button"
      className="flex items-center justify-between px-5 text-sm lg:text-[16px]"
      onClick={toggleTheme}
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
