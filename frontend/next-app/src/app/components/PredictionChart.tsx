"use client";

import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import type { Candle } from "@frontend-services/market";
import type { Prediction } from "@frontend-services/predictions";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
    ssr: false,
    loading: () => <div className="chart-placeholder" role="status">…</div>
});

export function PredictionChart({
    rows,
    prediction,
    locale,
    description
}: {
    rows: Candle[];
    prediction: Prediction | null;
    locale: string;
    description: string;
}) {
    const history = rows.slice(-90);
    const dates = history.map(row => row.date);
    const observed = history.map(row => row.close);
    if (prediction && history.length) {
        dates.push(prediction.fecha_prediccion);
    }
    const series: NonNullable<EChartsOption["series"]> = [
        {
            name: locale.startsWith("es") ? "Cierre observado" : "Observed close",
            type: "line",
            data: observed,
            showSymbol: false,
            lineStyle: { color: "#e9e5e6", width: 2 },
            ...(prediction && history.length ? {
                markLine: {
                    symbol: ["none", "none"],
                    label: { show: false },
                    lineStyle: { color: "#ff3d3d", type: "dashed", width: 2 },
                    data: [[
                        { coord: [history[history.length - 1].date, history[history.length - 1].close] },
                        { coord: [prediction.fecha_prediccion, prediction.precio_predicho] }
                    ]]
                },
                markPoint: {
                    symbol: "circle",
                    symbolSize: 8,
                    label: { show: false },
                    itemStyle: { color: "#ff3d3d" },
                    data: [{
                        name: locale.startsWith("es") ? "Estimación" : "Estimate",
                        coord: [prediction.fecha_prediccion, prediction.precio_predicho]
                    }]
                }
            } : {})
        }
    ];

    const formatDate = (date: string) => {
        const [year, month, day] = date.split("-").map(Number);
        return new Intl.DateTimeFormat(locale, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC"
        }).format(new Date(Date.UTC(year, month - 1, day)));
    };
    const option: EChartsOption = {
        animation: false,
        aria: { enabled: true },
        grid: { left: 64, right: 24, top: 24, bottom: 70 },
        tooltip: { trigger: "axis" },
        legend: { show: false },
        xAxis: {
            type: "category",
            data: dates,
            axisLabel: {
                color: "#8d898d",
                hideOverlap: true,
                formatter: value => formatDate(String(value))
            },
            axisLine: { lineStyle: { color: "#555" } },
            axisTick: { show: false }
        },
        yAxis: {
            type: "value",
            scale: true,
            axisLabel: {
                color: "#8d898d",
                formatter: value => `$${Number(value).toLocaleString(locale, { maximumFractionDigits: 0 })}`
            },
            splitLine: { lineStyle: { color: "#28282e", type: "dashed" } }
        },
        series
    };

    if (!history.length) return <p className="chart-placeholder">{description}</p>;
    return (
        <div role="img" aria-label={description} className="chart-container">
            <ReactECharts option={option} notMerge lazyUpdate style={{ height: 390, width: "100%" }} />
        </div>
    );
}
