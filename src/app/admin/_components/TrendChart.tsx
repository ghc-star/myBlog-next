"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

type TrendPoint = { date: string; pv: number; uv: number };

export default function TrendChart({ data }: { data: TrendPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = echarts.init(containerRef.current);

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const option: EChartsOption = {
      grid: { top: 30, right: 24, bottom: 28, left: 40 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line" },
      },
      legend: {
        data: ["PV", "UV"],
        right: 0,
        top: 0,
        textStyle: { fontSize: 12 },
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.date.slice(5)),
        axisLine: { lineStyle: { color: "#e5e7eb" } },
        axisLabel: { fontSize: 11, color: "#6b7280" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#f3f4f6" } },
        axisLabel: { fontSize: 11, color: "#9ca3af" },
      },
      series: [
        {
          name: "PV",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: data.map((d) => d.pv),
          itemStyle: { color: "#2563eb" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(37, 99, 235, 0.25)" },
                { offset: 1, color: "rgba(37, 99, 235, 0)" },
              ],
            },
          },
        },
        {
          name: "UV",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 5,
          data: data.map((d) => d.uv),
          itemStyle: { color: "#22c55e" },
          lineStyle: { width: 2 },
        },
      ],
    };
    chartRef.current.setOption(option, true);
  }, [data]);

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-(--text-sub)">
        还没有访问数据
      </p>
    );
  }

  return <div ref={containerRef} className="h-72 w-full" />;
}
