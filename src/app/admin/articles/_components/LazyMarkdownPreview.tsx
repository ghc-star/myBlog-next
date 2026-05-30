"use client";

import dynamic from "next/dynamic";

const MarkdownPreview = dynamic(() => import("./MarkdownPreview"), {
  ssr: false,
  loading: () => <p className="text-(--text-faint)">预览加载中...</p>,
});

export default MarkdownPreview;
