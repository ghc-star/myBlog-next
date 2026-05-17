"use client";

// 全局顶部进度条：监听站内导航过程，让点击有视觉反馈，盖住「点了没反应」那段空白。
// 通过监听 anchor click 触发 + pathname 变化收尾来实现。
// 同时派发 app:navigation-start / app:navigation-end，让粒子背景等高开销动画在跳转期间暂停。

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MIN_VISIBLE_MS = 220; // 防闪：再快也要露这么久

export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const tickRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const stopTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    stopTick();
    setProgress(100);
    const elapsed = performance.now() - startedAtRef.current;
    const wait = Math.max(MIN_VISIBLE_MS - elapsed, 120);

    if (hideRef.current !== null) window.clearTimeout(hideRef.current);
    hideRef.current = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(() => setProgress(0), 220);
      window.dispatchEvent(new CustomEvent("app:navigation-end"));
    }, wait);
  }, [stopTick]);

  useEffect(() => {
    if (!visible) return;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const start = useCallback(() => {
    if (hideRef.current !== null) {
      window.clearTimeout(hideRef.current);
      hideRef.current = null;
    }
    startedAtRef.current = performance.now();
    setVisible(true);
    setProgress(15);
    window.dispatchEvent(new CustomEvent("app:navigation-start"));

    stopTick();
    tickRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        const remaining = 90 - p;
        return p + Math.max(remaining * 0.08, 0.5);
      });
    }, 120) as unknown as number;
  }, [stopTick]);

  // 监听站内链接点击（capture 阶段，避免被 Link 的 stopPropagation 拦截）
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (anchor.target && anchor.target !== "_self") return;
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#")
      ) {
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        if (
          url.origin === window.location.origin &&
          url.pathname === window.location.pathname
        ) {
          return;
        }
      } catch {
        return;
      }

      start();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [start]);

  useEffect(() => {
    return () => {
      stopTick();
      if (hideRef.current !== null) window.clearTimeout(hideRef.current);
    };
  }, [stopTick]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2.5,
        zIndex: 2147483647,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 220ms ease-out",
      }}
    >
      {/* 进度填充：跟粒子主题色（--particle-rgb）同源的单色粉
          浅色主题 = 粉色，深色主题 = 浅蓝，自动跟随 */}
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          background: "rgba(var(--particle-rgb, 243, 175, 202), 0.95)",
          borderRadius: "0 2px 2px 0",
          transition: "width 200ms ease-out",
          boxShadow: "0 0 8px rgba(var(--particle-rgb, 243, 175, 202), 0.55)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 顶端白色高光带，让进度条有「正在前进」的流动感 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 60,
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85))",
            opacity: visible ? 0.85 : 0,
            transition: "opacity 220ms ease-out",
          }}
        />
      </div>
    </div>
  );
}
