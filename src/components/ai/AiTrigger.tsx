"use client";

import { Bot, X } from "lucide-react";
import { useRef, useEffect, useCallback } from "react";

import { useAiDrawer } from "./useAiDrawer";
import AiDrawer from "./AiDrawer";

export default function AiTrigger() {
  const { open, toggle } = useAiDrawer();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const dragInfoRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0, moved: false });

  // 记录相对于右下角的偏移，resize 时保持这个相对位置
  const offsetFromBottomRight = useRef({ rx: 24, ry: 24 });

  useEffect(() => {
    const size = 48;
    const margin = 24;

    function updateFromOffset() {
      const x = window.innerWidth - size - offsetFromBottomRight.current.rx;
      const y = window.innerHeight - size - offsetFromBottomRight.current.ry;
      posRef.current = {
        x: Math.max(margin, Math.min(x, window.innerWidth - size - margin)),
        y: Math.max(margin, Math.min(y, window.innerHeight - size - margin)),
      };
      const el = buttonRef.current;
      if (el) {
        el.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }
    }

    // 初始位置：右下角
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

    const size = 48;
    const x = Math.max(0, Math.min(window.innerWidth - size, info.posX + dx));
    const y = Math.max(0, Math.min(window.innerHeight - size, info.posY + dy));

    posRef.current = { x, y };
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    const el = buttonRef.current;
    if (!el) return;
    el.releasePointerCapture(event.pointerId);

    if (!dragInfoRef.current.moved) {
      toggle();
    } else {
      // 拖拽结束，更新相对于右下角的偏移
      const size = 48;
      offsetFromBottomRight.current = {
        rx: window.innerWidth - size - posRef.current.x,
        ry: window.innerHeight - size - posRef.current.y,
      };
    }
  }, [toggle]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 50,
          touchAction: "none",
          userSelect: "none",
          willChange: "transform",
        }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)] ring-2 ring-white/20"
        aria-label={open ? "关闭 AI 助手" : "打开 AI 助手"}
      >
        {open ? <X size={18} /> : <Bot size={20} />}
      </button>

      <AiDrawer />
    </>
  );
}
