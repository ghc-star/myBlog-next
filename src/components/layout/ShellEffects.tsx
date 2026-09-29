"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useThemeStore } from "@/store/useThemeStore";
import { usePageTitleVisibility } from "@/hooks/usePageTitleVisibility";
import { takeThemePeelOrigin } from "@/lib/themePeel";

// 需要略大于 globals.css 里 theme-switching 的过渡时长（0.35s）
const THEME_TRANSITION_MS = 450;

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

export default function ShellEffects() {
  usePageTitleVisibility();

  const pathname = usePathname();
  const theme = useThemeStore((state) => state.theme);
  const prevThemeRef = useRef<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const prevTheme = prevThemeRef.current;
    prevThemeRef.current = theme;

    // 首次挂载只是补写初始主题，不做过渡
    if (prevTheme === null || prevTheme === theme) {
      root.setAttribute("data-theme", theme);
      return;
    }

    const origin = takeThemePeelOrigin();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as ViewTransitionDocument;

    // 掀开效果：新旧主题瞬间切换，由 View Transition 的圆形 clip-path
    //（见 globals.css 的 theme-peel 关键帧）从点击位置把新主题揭示出来
    if (origin && !reducedMotion && typeof doc.startViewTransition === "function") {
      root.classList.add("theme-instant");
      root.style.setProperty("--peel-x", `${origin.x}px`);
      root.style.setProperty("--peel-y", `${origin.y}px`);
      const radius = Math.hypot(
        Math.max(origin.x, window.innerWidth - origin.x),
        Math.max(origin.y, window.innerHeight - origin.y),
      );
      root.style.setProperty("--peel-r", `${radius}px`);

      const transition = doc.startViewTransition(() => {
        root.setAttribute("data-theme", theme);
      });
      transition.finished.finally(() => {
        root.classList.remove("theme-instant");
        root.style.removeProperty("--peel-x");
        root.style.removeProperty("--peel-y");
        root.style.removeProperty("--peel-r");
      });

      return () => {
        root.classList.remove("theme-instant");
      };
    }

    // 兜底（浏览器不支持 View Transition 时）：全站统一淡入淡出
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", theme);
    const timer = window.setTimeout(() => {
      root.classList.remove("theme-switching");
    }, THEME_TRANSITION_MS);

    return () => {
      window.clearTimeout(timer);
      root.classList.remove("theme-switching");
    };
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}
