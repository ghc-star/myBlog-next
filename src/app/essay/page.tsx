import Image from "next/image";
import type { Metadata } from "next";
import { PenLine } from "lucide-react";

import essayImage from "@/assets/images/essay.webp";

import EssayFeedClient from "./EssayFeedClient";

// 静态壳：不再读 cookie / 查库，feed 与登录态由客户端从 /api/essays 获取。
// 好处是本页可被完整预取，切换到随笔页不再有服务端往返。
export const metadata: Metadata = {
  title: `随笔 | My Blog`,
  description: "随手记录当下的想法、灵感与心情",
};

export default function EssaysPage() {
  return (
    <div className="px-4 pt-5 pb-16 sm:px-6">
      <div className="mx-auto w-full max-w-[880px] rounded-3xl shadow-[var(--shadow-card)]">
        {/* 顶部横幅 */}
        <header className="relative h-[200px] overflow-hidden rounded-t-3xl sm:h-[240px]">
          <Image
            src={essayImage}
            alt="随笔封面"
            fill
            sizes="(max-width: 640px) 100vw, 880px"
            priority
            className="object-cover"
          />
          {/* 渐变遮罩：保证文字在图片上可读 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5" />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur-sm">
              <PenLine size={12} />
              Essays
            </span>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">
              随笔
            </h1>

            <p className="mt-2 max-w-[560px] text-sm leading-6 text-white/80">
              随手记录当下的想法、灵感与心情，短一点也没关系。
            </p>
          </div>
        </header>

        {/* 内容卡片：与横幅同宽，左右边缘严格对齐 */}
        <main className="rounded-b-3xl border-x border-b border-(--border-card) bg-(--card-bg) px-4 py-6 sm:px-7 sm:py-8">
          <EssayFeedClient />
        </main>
      </div>
    </div>
  );
}
