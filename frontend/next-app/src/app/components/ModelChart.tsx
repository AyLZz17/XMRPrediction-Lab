"use client";

import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import type { MetricId, ModelMetrics } from "@frontend-services/predictions";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
    ssr: false,
    loading: () => <div className="chart-placeholder" role="status">…</div>
});

export function ModelChart({
    models,
    metric,
    locale,
    description
}: {
    models: ModelMetrics[];
    metric: MetricId;
    locale: string;
    description: string;
}) {
    const ordered = [...models].sort((a, b) => a[metric] - b[metric]);
    const option: EChartsOption = {
        animation: false,
        aria: { enabled: true },
        grid: { left: 110, right: 38, top: 12, bottom: 24 },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        xAxis: {
            type: "value",
            axisLabel: { color: "#8d898d" },
            splitLine: { lineStyle: { color: "#28282e", type: "dashed" } }
        },
        yAxis: {
            type: "category",
            inverse: true,
            data: ordered.map(model => model.name),
            axisLabel: { color: "#d8d5d6" },
            axisLine: { show: false },
            axisTick: { show: false }
        },
        series: [{
            type: "bar",
            data: ordered.map(model => ({
                value: model[metric],
                itemStyle: { color: model.id === ordered[0]?.id ? "#ef2929" : "#5a5559" }
            })),
            barMaxWidth: 22,
            label: {
                show: true,
                position: "right",
                color: "#d8d5d6",
                formatter: value => `${Number(value.value).toLocaleString(locale, { maximumFractionDigits: 2 })}${metric === "mape" ? "%" : ""}`
            }
        }]
    };

    if (!models.length) return <p className="chart-placeholder">{description}</p>;
    return (
        <div role="img" aria-label={description} className="chart-container">
            <ReactECharts option={option} notMerge lazyUpdate style={{ height: 260, width: "100%" }} />
        </div>
    );
}
