"use client";

import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import type { Candle } from "@frontend-services/market";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
    ssr: false,
    loading: () => <div className="chart-placeholder" role="status">…</div>
});

interface MarketChartProps {
    rows: Candle[];
    range: number;
    chartType: "candles" | "line";
    showSma: boolean;
    showVolumeSma: boolean;
    locale: string;
    description: string;
}

export function MarketChart({
    rows,
    range,
    chartType,
    showSma,
    showVolumeSma,
    locale,
    description
}: MarketChartProps) {
    const data = rows.slice(-range);
    const dates = data.map(row => row.date);
    const formatDate = (date: string) => {
        const [year, month, day] = date.split("-").map(Number);
        return new Intl.DateTimeFormat(locale, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC"
        }).format(new Date(Date.UTC(year, month - 1, day)));
    };
    const series: NonNullable<EChartsOption["series"]> = [];

    if (chartType === "candles") {
        series.push({
            name: "OHLC",
            type: "candlestick",
            data: data.map(row => [row.open, row.close, row.low, row.high]),
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
            data: data.map(row => row.close),
            showSymbol: false,
            lineStyle: { color: "#ff3d3d", width: 2 },
            areaStyle: { color: "rgba(255, 61, 61, .1)" }
        });
    }

    if (showSma) {
        series.push({
            name: "SMA 9",
            type: "line",
            data: data.map((_row, index) => {
                const start = index - 8;
                if (start < 0) return null;
                const closes = data.slice(start, index + 1).map(item => item.close);
                return closes.reduce((sum, close) => sum + close, 0) / closes.length;
            }),
            showSymbol: false,
            lineStyle: { color: "#e6b84f", width: 1.5 }
        });
    }

    series.push({
        name: "Volume",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: data.map(row => ({
            value: row.volume,
            itemStyle: { color: row.close >= row.open ? "rgba(230,225,227,.38)" : "rgba(239,41,41,.52)" }
        }))
    });

    if (showVolumeSma) {
        series.push({
            name: "Volume SMA 9",
            type: "line",
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: data.map((_row, index) => {
                const start = index - 8;
                if (start < 0) return null;
                const volumes = data.slice(start, index + 1).map(item => item.volume);
                return volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length;
            }),
            showSymbol: false,
            lineStyle: { color: "#9c98a0", width: 1.2 }
        });
    }

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
                data: dates,
                boundaryGap: true,
                axisLabel: {
                    color: "#8d898d",
                    hideOverlap: true,
                    formatter: value => formatDate(String(value))
                },
                axisLine: { lineStyle: { color: "#555" } },
                axisTick: { show: false }
            },
            {
                type: "category",
                gridIndex: 1,
                data: dates,
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
                    formatter: value => `$${Number(value).toLocaleString(locale, { maximumFractionDigits: 0 })}`
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

    if (!data.length) return <p className="chart-placeholder">{description}</p>;
    const latest = data[data.length - 1];

    return (
        <div className="chart-container">
            <div role="img" aria-label={description}>
                <ReactECharts option={option} notMerge lazyUpdate style={{ height: 390, width: "100%" }} />
            </div>
            <p className="chart-summary" aria-live="polite">
                {formatDate(latest.date)} · O {latest.open.toLocaleString(locale)} · H {latest.high.toLocaleString(locale)} · L {latest.low.toLocaleString(locale)} · C {latest.close.toLocaleString(locale)} · Vol. {latest.volume.toLocaleString(locale)}
            </p>
        </div>
    );
}
