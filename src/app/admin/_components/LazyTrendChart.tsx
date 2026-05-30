"use client";

import dynamic from "next/dynamic";

const TrendChart = dynamic(() => import("./TrendChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center rounded-xl bg-(--card-bg-soft) text-xs text-(--text-sub)">
      图表加载中...
    </div>
  ),
});

export default TrendChart;
