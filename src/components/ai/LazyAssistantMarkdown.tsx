"use client";

import dynamic from "next/dynamic";

const AssistantMarkdown = dynamic(() => import("./AssistantMarkdown"), {
  ssr: false,
  loading: () => <p className="text-(--text-sub)">回复渲染中...</p>,
});

export default AssistantMarkdown;
