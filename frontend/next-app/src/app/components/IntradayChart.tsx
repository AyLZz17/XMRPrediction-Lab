"use client";

import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import type { IntradayCandle, IntradayInterval } from "@frontend-services/market";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
    ssr: false,
    loading: () => <div className="chart-placeholder" role="status">…</div>
});

interface IntradayChartProps {
    rows: IntradayCandle[];
    interval: IntradayInterval;
    chartType: "candles" | "line";
    locale: string;
    source: string;
    description: string;
}

export function IntradayChart({
    rows,
    interval,
    chartType,
    locale,
    source,
    description
}: IntradayChartProps) {
    const formatDateTime = (timestamp: string) => new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(timestamp));
    const labels = rows.map(row => formatDateTime(row.timestamp));
    const series: NonNullable<EChartsOption["series"]> = [];

    if (chartType === "candles") {
        series.push({
            name: "OHLC",
            type: "candlestick",
            data: rows.map(row => [row.open, row.close, row.low, row.high]),
            itemStyle: {
                color: "#f4f2f2",
                color0: "#ef2929",
                borderColor: "#f4f2f2",
                borderColor0: "#ef2929"
            }
        });
    } else {
        series.push({
            name: "Close",
            type: "line",
            data: rows.map(row => row.close),
            showSymbol: false,
            lineStyle: { color: "#ff3d3d", width: 2 },
            areaStyle: { color: "rgba(255, 61, 61, .1)" }
        });
    }

    series.push({
        name: "Volume",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: rows.map(row => ({
            value: row.volume,
            itemStyle: {
                color: row.close >= row.open
                    ? "rgba(230,225,227,.38)"
                    : "rgba(239,41,41,.52)"
            }
        }))
    });

    const option: EChartsOption = {
        animation: false,
        aria: { enabled: true },
        grid: [
            { left: 64, right: 24, top: 24, bottom: 112 },
            { left: 64, right: 24, height: 54, bottom: 36 }
        ],
        tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
        xAxis: [
            {
                type: "category",
                data: labels,
                boundaryGap: true,
                axisLabel: {
                    color: "#8d898d",
                    hideOverlap: true,
                    rotate: 20
                },
                axisLine: { lineStyle: { color: "#555" } },
                axisTick: { show: false }
            },
            {
                type: "category",
                gridIndex: 1,
                data: labels,
                axisLabel: { show: false },
                axisLine: { show: false },
                axisTick: { show: false }
            }
        ],
        yAxis: [
            {
                type: "value",
                scale: true,
                axisLabel: {
                    color: "#8d898d",
                    formatter: value => `$${Number(value).toLocaleString(locale, {
                        maximumFractionDigits: 2
                    })}`
                },
                splitLine: { lineStyle: { color: "#28282e", type: "dashed" } }
            },
            {
                type: "value",
                gridIndex: 1,
                axisLabel: { show: false },
                splitLine: { show: false },
                min: 0
            }
        ],
        dataZoom: [{ type: "inside", xAxisIndex: [0, 1], filterMode: "none" }],
        series
    };

    const latest = rows[rows.length - 1];
    if (!latest) return <p className="chart-placeholder">{description}</p>;

    return (
        <div className="chart-container">
            <div role="img" aria-label={description}>
                <ReactECharts option={option} notMerge lazyUpdate style={{ height: 390, width: "100%" }} />
            </div>
            <p className="chart-summary" aria-live="polite">
                {source} · {interval} · {formatDateTime(latest.timestamp)} · O {latest.open.toLocaleString(locale)} · H {latest.high.toLocaleString(locale)} · L {latest.low.toLocaleString(locale)} · C {latest.close.toLocaleString(locale)} · Vol. {latest.volume.toLocaleString(locale)}
            </p>
        </div>
    );
}
