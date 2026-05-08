import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import * as echarts from "echarts";
import type { EChartsOption, ECharts } from "echarts";

type EChartsProps = {
  option: EChartsOption;
  width?: string | number;
  height?: string | number;
  loading?: boolean;
  empty?: boolean;
  theme?: string;
  onClick?: (params: unknown) => void;
  className?: string;
  style?: CSSProperties;
};

export default function EChart({
  option,
  width = "100%",
  height = 400,
  loading = false,
  empty = false,
  theme,
  onClick,
  className,
  style,
}: EChartsProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<ECharts | null>(null);
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, theme);
    chartInstanceRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartInstanceRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (!chartInstanceRef.current) return;
    chartInstanceRef.current.setOption(option);
  }, [option]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    if (loading) {
      chart.showLoading();
    } else {
      chart.hideLoading();
    }
  }, [loading]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || !onClick) return;

    chart.on("click", onClick);

    return () => {
      chart.off("click", onClick);
    };
  }, [onClick]);

  if (empty) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
          border: "1px dashed #ddd",
          borderRadius: 8,
          ...style,
        }}
      >
        暂无图表数据
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        width,
        height,
        ...style,
        display: "flex",
      }}
    >
      <div ref={chartRef} style={{ flex: 1, minWidth: 0, minHeight: 0 }}></div>
    </div>
  );
}
