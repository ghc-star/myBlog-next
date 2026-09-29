import { NextRequest, NextResponse } from "next/server";

import { getArticles } from "@/lib/article";
import { browseArticles, searchArticles } from "@/lib/article-search";

// 数据来自 getArticles 的进程内缓存（tag: articles），未命中时才回源查一次库
export async function GET(request: NextRequest) {
  const keyword = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const articles = await getArticles();
  const list = keyword
    ? searchArticles(articles, keyword)
    : browseArticles(articles);

  return NextResponse.json({ keyword, list });
}
