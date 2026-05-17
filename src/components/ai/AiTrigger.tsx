"use client";

import { useRef, useEffect, useCallback, useState } from "react";

import { useAiDrawer } from "./useAiDrawer";
import { usePagePhrases } from "./usePagePhrases";
import AiDrawer from "./AiDrawer";

const SIZE = 64;

type Phrase = { text: string; id: number };

function pickRandom(list: string[], prev?: string): string {
  if (list.length <= 1) return list[0] ?? "";
  let next = prev;
  while (next === prev) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  return next ?? "";
}

function RobotMascot({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none h-full w-full animate-mascot-bob drop-shadow-md"
    >
      <defs>
        <linearGradient id="ai-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      <line x1="50" y1="18" x2="50" y2="10" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="8" r="3" fill="#fbbf24" className="animate-pulse" />

      <rect x="25" y="20" width="50" height="42" rx="14" fill="url(#ai-body-grad)" />
      <ellipse cx="38" cy="30" rx="8" ry="3" fill="white" opacity="0.3" />

      {open ? (
        <g stroke="white" strokeWidth="3" strokeLinecap="round">
          <line x1="36" y1="36" x2="44" y2="44" />
          <line x1="44" y1="36" x2="36" y2="44" />
          <line x1="56" y1="36" x2="64" y2="44" />
          <line x1="64" y1="36" x2="56" y2="44" />
        </g>
      ) : (
        <g className="origin-center animate-mascot-blink">
          <ellipse cx="40" cy="40" rx="4" ry="5" fill="white" />
          <ellipse cx="60" cy="40" rx="4" ry="5" fill="white" />
          <circle cx="40" cy="41" r="1.8" fill="#1e3a8a" />
          <circle cx="60" cy="41" r="1.8" fill="#1e3a8a" />
        </g>
      )}

      <path d="M 42 52 Q 50 56 58 52" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />

      <rect x="32" y="62" width="36" height="22" rx="6" fill="url(#ai-body-grad)" />
      <circle cx="42" cy="73" r="2" fill="#fbbf24" />
      <circle cx="50" cy="73" r="2" fill="#fbbf24" />
      <circle cx="58" cy="73" r="2" fill="#fbbf24" />
    </svg>
  );
}

export default function AiTrigger() {
  const { open, toggle } = useAiDrawer();
  const phrases = usePagePhrases();

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const dragInfoRef = useRef({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    moved: false,
  });
  const offsetFromBottomRight = useRef({ rx: 24, ry: 24 });

  // 单击 / 双击区分
  const DBLCLICK_GAP = 280;
  const lastClickAtRef = useRef(0);
  const singleClickTimerRef = useRef<number | null>(null);

  function clearPendingSingleClick() {
    if (singleClickTimerRef.current !== null) {
      window.clearTimeout(singleClickTimerRef.current);
      singleClickTimerRef.current = null;
    }
  }

  function smoothScrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const [phrase, setPhrase] = useState<Phrase | null>(null);
  const phraseIdRef = useRef(0);
  const phraseTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  // 用 ref 暴露当前展示的句子，给闭包内读取最新值
  const currentTextRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    currentTextRef.current = phrase?.text;
  }, [phrase]);

  const showPhrase = useCallback(
    (text: string, duration: number) => {
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
      phraseIdRef.current += 1;
      setPhrase({ text, id: phraseIdRef.current });
      hideTimerRef.current = window.setTimeout(() => setPhrase(null), duration);
    },
    [],
  );

  // 自动循环：欢迎一句 + 每 6-10 秒随机一句
  useEffect(() => {
    function tick() {
      const next = pickRandom(phrases, currentTextRef.current);
      showPhrase(next, 5000);
      const delay = 6000 + Math.random() * 4000;
      phraseTimerRef.current = window.setTimeout(tick, delay);
    }

    const welcomeTimer = window.setTimeout(() => {
      tick();
    }, 1500);

    return () => {
      window.clearTimeout(welcomeTimer);
      if (phraseTimerRef.current !== null) window.clearTimeout(phraseTimerRef.current);
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    };
  }, [phrases, showPhrase]);

  // 抽屉打开时收起气泡
  useEffect(() => {
    if (!open) return;
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    queueMicrotask(() => setPhrase(null));
  }, [open]);

  // 拖拽 + 位置同步
  useEffect(() => {
    const margin = 24;

    function updateFromOffset() {
      const x = window.innerWidth - SIZE - offsetFromBottomRight.current.rx;
      const y = window.innerHeight - SIZE - offsetFromBottomRight.current.ry;
      posRef.current = {
        x: Math.max(margin, Math.min(x, window.innerWidth - SIZE - margin)),
        y: Math.max(margin, Math.min(y, window.innerHeight - SIZE - margin)),
      };
      const el = buttonRef.current;
      if (el) {
        el.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }
    }

    offsetFromBottomRight.current = { rx: margin, ry: margin };
    updateFromOffset();

    window.addEventListener("resize", updateFromOffset);
    return () => window.removeEventListener("resize", updateFromOffset);
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    const el = buttonRef.current;
    if (!el) return;
    el.setPointerCapture(event.pointerId);
    dragInfoRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      posX: posRef.current.x,
      posY: posRef.current.y,
      moved: false,
    };
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    const el = buttonRef.current;
    if (!el || !el.hasPointerCapture(event.pointerId)) return;

    const info = dragInfoRef.current;
    const dx = event.clientX - info.startX;
    const dy = event.clientY - info.startY;

    if (!info.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    info.moved = true;

    const x = Math.max(0, Math.min(window.innerWidth - SIZE, info.posX + dx));
    const y = Math.max(0, Math.min(window.innerHeight - SIZE, info.posY + dy));

    posRef.current = { x, y };
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      const el = buttonRef.current;
      if (!el) return;
      el.releasePointerCapture(event.pointerId);

      if (dragInfoRef.current.moved) {
        offsetFromBottomRight.current = {
          rx: window.innerWidth - SIZE - posRef.current.x,
          ry: window.innerHeight - SIZE - posRef.current.y,
        };
        return;
      }

      const now = Date.now();
      const isDouble = now - lastClickAtRef.current < DBLCLICK_GAP;
      lastClickAtRef.current = now;

      if (isDouble) {
        // 双击：取消挂起的单击 toggle，仅滚到顶
        clearPendingSingleClick();
        smoothScrollToTop();
        return;
      }

      // 单击：延迟一会儿再 toggle，给双击留判定窗口
      clearPendingSingleClick();
      singleClickTimerRef.current = window.setTimeout(() => {
        singleClickTimerRef.current = null;
        toggle();
      }, DBLCLICK_GAP);
    },
    [toggle],
  );

  // 卸载时清掉单击 timer，避免内存泄漏
  useEffect(() => {
    return () => clearPendingSingleClick();
  }, []);

  function handleMouseEnter() {
    if (open) return;
    showPhrase(pickRandom(phrases, currentTextRef.current), 4000);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={handleMouseEnter}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: SIZE,
          height: SIZE,
          zIndex: 50,
          touchAction: "none",
          userSelect: "none",
          willChange: "transform",
          WebkitTouchCallout: "none",
        }}
        className="cursor-grab active:cursor-grabbing"
        aria-label={open ? "关闭 AI 助手" : "打开 AI 助手"}
      >
        {phrase && !open ? (
          <div
            key={phrase.id}
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 animate-mascot-bubble whitespace-nowrap rounded-2xl bg-white px-3 py-1.5 text-xs text-(--text-strong) shadow-lg ring-1 ring-(--border-normal)"
          >
            {phrase.text}
            <span className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-white ring-1 ring-(--border-normal)" />
          </div>
        ) : null}

        <RobotMascot open={open} />
      </button>

      <AiDrawer />
    </>
  );
}
