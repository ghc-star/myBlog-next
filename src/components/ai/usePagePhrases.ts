"use client"

import { useEffect,useState } from "react"
import { usePathname } from "next/navigation"


const FALLBACK_PHRASES = [
  "需要帮忙吗？点我聊聊~",
  "今天过得怎么样？",
  "我可以查博客文章哦",
  "想知道天气？问我就行",
  "想看一句好句子吗？",
  "嗨，我是博客小助手 🤖",
  "记得多喝热水~",
  "拖动我可以换位置",
  "双击我回顶部~",
  "有任何疑问都可以问我",
  "推荐一篇文章给你看？",
];

const STORAGE_KEY_PREFIX = "mascot:article:";

function parseArticleId(pathname:string):string|null{
    const match = pathname.match(/^\/article\/([^/]+)/);
    return match ? match[1] : null;
}

function readCache(articleId: string): string[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PREFIX + articleId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(articleId: string, phrases: string[]) {
  sessionStorage.setItem(STORAGE_KEY_PREFIX + articleId, JSON.stringify(phrases));
}


/**
 * 文章页：返回该文章的专属语录（懒加载 + sessionStorage 缓存）
 * 其他页：返回静态 fallback 语录
 */
export function usePagePhrases() {
  const pathname = usePathname();
  const articleId = parseArticleId(pathname);
  const [phrases, setPhrases] = useState<string[]>(FALLBACK_PHRASES);

  useEffect(() => {
    if (!articleId) {
      setPhrases(FALLBACK_PHRASES);
      return;
    }

    const cached = readCache(articleId);
    if (cached) {
      setPhrases(cached);
      return;
    }

    const controller = new AbortController();

    fetch("/api/mascot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.phrases) return;
        writeCache(articleId, data.phrases);
        setPhrases(data.phrases);
      })
      .catch(() => {
        // 失败保持 fallback
      });

    return () => controller.abort();
  }, [articleId]);

  return phrases;
}