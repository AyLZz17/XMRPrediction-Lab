"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@frontend-services/http";
import { currentUser, signOut, type AuthUser } from "@frontend-services/auth";
import {
    getIntradayMarket,
    getMarket,
    refreshMarket,
    type IntradayInterval,
    type IntradayMarketSnapshot,
    type MarketSnapshot
} from "@frontend-services/market";
import {
    getBenchmark,
    modelIds,
    runPrediction,
    type MetricId,
    type ModelBenchmark,
    type ModelId,
    type Prediction
} from "@frontend-services/predictions";
import { MarketChart } from "./MarketChart";
import { IntradayChart } from "./IntradayChart";
import { ModelChart } from "./ModelChart";
import { PredictionChart } from "./PredictionChart";
import { PreferenceControls } from "./PreferenceControls";
import { apiErrorMessage, usePreferences } from "../preferences";

const modelNames: Record<ModelId, string> = {
    naive: "Persistencia",
    moving_average: "Media móvil 7",
    arima: "ARIMA",
    lstm: "LSTM",
    gru: "GRU"
};
const ranges = [1, 5, 30, 90, 180, 365] as const;
type ChartPeriod = "daily" | IntradayInterval;

export function Dashboard() {
    const { language, localTimeZone, t } = usePreferences();
    const message = useRef(t);
    message.current = t;
    const [user, setUser] = useState<AuthUser | null>(null);
    const [market, setMarket] = useState<MarketSnapshot | null>(null);
    const [benchmark, setBenchmark] = useState<ModelBenchmark | null>(null);
    const [prediction, setPrediction] = useState<Prediction | null>(null);
    const [selectedModel, setSelectedModel] = useState<ModelId>("naive");
    const [metric, setMetric] = useState<MetricId>("mae");
    const [range, setRange] = useState<number>(365);
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("daily");
    const [intradayRefreshKey, setIntradayRefreshKey] = useState(0);
    const [intraday, setIntraday] = useState<IntradayMarketSnapshot | null>(null);
    const [intradayError, setIntradayError] = useState("");
    const [intradayLoading, setIntradayLoading] = useState(false);
    const [chartType, setChartType] = useState<"candles" | "line">("candles");
    const [showSma, setShowSma] = useState(false);
    const [showVolumeSma, setShowVolumeSma] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [marketError, setMarketError] = useState("");
    const [modelsError, setModelsError] = useState("");
    const [predictionMessage, setPredictionMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<"connecting" | "online" | "error" | "analyzing">("connecting");
    const [profileOpen, setProfileOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const locale = language === "es" ? "es-CO" : "en-US";

    useEffect(() => {
        let active = true;
        async function initialize() {
            try {
                const current = await currentUser();
                if (!active) return;
                setUser(current);
                const [marketResult, benchmarkResult] = await Promise.allSettled([
                    getMarket(365),
                    getBenchmark()
                ]);
                if (!active) return;
                if (marketResult.status === "fulfilled") {
                    setMarket(marketResult.value);
                    setStatus("online");
                } else {
                    console.error("Could not load market data", marketResult.reason);
                    setMarketError(apiErrorMessage(marketResult.reason, message.current));
                    setStatus("error");
                }
                if (benchmarkResult.status === "fulfilled") {
                    setBenchmark(benchmarkResult.value);
                    setModelsError("");
                } else {
                    console.error("Could not load model benchmark", benchmarkResult.reason);
                    setModelsError(apiErrorMessage(benchmarkResult.reason, message.current));
                }
            } catch (error) {
                if (!active) return;
                if (error instanceof ApiError && error.status === 401) {
                    window.location.replace("/login/");
                    return;
                }
                console.error("Could not establish the dashboard session", error);
                setMarketError(message.current("serviceError"));
            } finally {
                if (active) setCheckingSession(false);
            }
        }
        void initialize();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (chartPeriod === "daily") return;
        const interval: IntradayInterval = chartPeriod;

        let active = true;
        let requestPending = false;
        let hasLoaded = false;
        let currentRequest: AbortController | null = null;
        async function loadIntraday() {
            if (requestPending) return;
            requestPending = true;
            if (!hasLoaded && active) setIntradayLoading(true);
            currentRequest = new AbortController();
            try {
                const snapshot = await getIntradayMarket(interval, currentRequest.signal);
                if (!active) return;
                setIntraday(snapshot);
                setIntradayError("");
                hasLoaded = true;
            } catch (error) {
                if (!active) return;
                console.error("Could not load intraday market data", error);
                setIntradayError(apiErrorMessage(error, message.current));
            } finally {
                requestPending = false;
                if (active) setIntradayLoading(false);
            }
        }

        void loadIntraday();
        const timer = window.setInterval(() => { void loadIntraday(); }, 30_000);
        return () => {
            active = false;
            window.clearInterval(timer);
            currentRequest?.abort();
        };
    }, [chartPeriod, intradayRefreshKey]);

    const modelMetrics = benchmark?.models ?? [];
    const selectedMetrics = modelMetrics.find(item => item.id === selectedModel);
    const bestMae = modelMetrics.reduce(
        (best, item) => item.mae < best.mae ? item : best,
        modelMetrics[0]
    );
    const bestDirection = modelMetrics.reduce(
        (best, item) => item.direction > best.direction ? item : best,
        modelMetrics[0]
    );
    const latest = market?.latest;
    const formattedUpdatedAt = useMemo(() => {
        if (!market?.updated_at) return "—";
        return new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(new Date(market.updated_at));
    }, [locale, market?.updated_at]);

    async function updateMarket() {
        setBusy(true);
        setStatus("connecting");
        setMarketError("");
        try {
            setMarket(await refreshMarket());
            setStatus("online");
        } catch (error) {
            console.error("Market refresh failed", error);
            setMarketError(apiErrorMessage(error, t));
            setStatus("error");
        } finally {
            setBusy(false);
        }
    }

    async function createPrediction() {
        setBusy(true);
        setStatus("analyzing");
        setPredictionMessage(t("predictionQueued"));
        try {
            const result = await runPrediction(selectedModel);
            setPrediction(result.prediction);
            setPredictionMessage(
                `${result.prediction.direccion} · ${formatDate(result.prediction.fecha_prediccion, locale)}`
            );
            setStatus("online");
        } catch (error) {
            console.error("Prediction request failed", error);
            setPredictionMessage(apiErrorMessage(error, t));
            setStatus("error");
        } finally {
            setBusy(false);
        }
    }

    async function logout() {
        setBusy(true);
        try {
            await signOut();
            window.location.replace("/login/");
        } catch (error) {
            console.error("Could not end the identity session", error);
            setPredictionMessage(apiErrorMessage(error, t));
            setStatus("error");
        } finally {
            setBusy(false);
        }
    }

    function exportReport() {
        try {
            const report = {
                project: "AyLZz Crypto Lab — Monero XMR-USD",
                exportedAt: new Date().toISOString(),
                observations: market?.total_count ?? 0,
                prediction,
                models: modelMetrics,
                disclaimer: "Academic research; not investment advice."
            };
            const link = document.createElement("a");
            link.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], {
                type: "application/json"
            }));
            link.download = "aylzz-xmr-analysis.json";
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Could not export the analysis report", error);
            setPredictionMessage(t("exportFailed"));
        }
    }

    function closeMobileNavigation() {
        setSidebarOpen(false);
    }

    if (checkingSession) {
        return <main className="dashboard-page dashboard-loading" role="status">{t("dashboardLoading")}</main>;
    }
    if (!user) {
        return (
            <main className="dashboard-page dashboard-loading" role="alert">
                {marketError || t("authRequired")} <a href="/login/">{t("loginButton")}</a>
            </main>
        );
    }

    const statusText = status === "online" ? t("connected")
        : status === "analyzing" ? t("analyzing")
            : status === "error" ? t("disconnected") : t("connecting");
    const priceChangeClass = (change: number | undefined) => change === undefined
        ? "" : change >= 0 ? "positive" : "negative";

    return (
        <main className="dashboard-page">
            <div className="app-shell">
                <aside className={`sidebar${sidebarOpen ? " open" : ""}`} id="sidebar">
                    <a className="brand" href="#overview" onClick={closeMobileNavigation}>
                        <span className="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
                        <span className="brand-copy"><strong>AyLZz</strong><small>{t("brand")}</small></span>
                    </a>
                    <nav className="main-nav" aria-label={t("platform")}>
                        <span className="nav-label">{t("platform")}</span>
                        <a className="nav-link active" href="#overview" onClick={closeMobileNavigation}>{icon("grid")}{t("overview")}</a>
                        <a className="nav-link" href="#market" onClick={closeMobileNavigation}>{icon("chart")}{t("market")}</a>
                        <a className="nav-link" href="#prediction" onClick={closeMobileNavigation}>{icon("trend")}{t("prediction")}</a>
                        <a className="nav-link" href="#models" onClick={closeMobileNavigation}>{icon("compare")}{t("compareModels")}</a>
                        <a className="nav-link" href="#analisis-extenso" onClick={closeMobileNavigation}>{icon("layers")}{language === "es" ? "Detalles extensos" : "Detailed analysis"}</a>
                        <a className="nav-link" href="#methodology" onClick={closeMobileNavigation}>{icon("layers")}{t("methodology")}</a>
                        <span className="nav-label nav-label-secondary">{t("research")}</span>
                        <a className="nav-link" href="#results" onClick={closeMobileNavigation}>{icon("bars")}{t("results")}</a>
                        <button className="nav-link nav-button" type="button" onClick={exportReport}>{icon("download")}{t("exportMetrics")}</button>
                    </nav>
                    <div className="sidebar-note">
                        <span className={`status-dot${status === "error" ? " error" : ""}`}></span>
                        <div>
                            <strong>{market ? t("datasetValidated") : t("connecting")}</strong>
                            <small>{market?.total_count.toLocaleString(locale) ?? "—"} {t("observations")}</small>
                        </div>
                    </div>
                    <div className="sidebar-footer">{t("academicPrototype")}</div>
                </aside>
                <button
                    className={`mobile-backdrop${sidebarOpen ? " visible" : ""}`}
                    type="button"
                    aria-label={t("closeNavigation")}
                    onClick={closeMobileNavigation}
                />

                <div className="portal">
                    <header className="topbar">
                        <div className="topbar-left">
                            <button className="icon-button menu-button" type="button" aria-label={t("openNavigation")} onClick={() => setSidebarOpen(true)}>
                                {icon("menu")}
                            </button>
                            <div>
                                <span className="breadcrumb">{t("breadcrumb")}</span>
                                <span className="topbar-title">{t("dashboardTitle")}</span>
                            </div>
                        </div>
                        <div className="topbar-actions">
                            <PreferenceControls compact />
                            <div className="market-status" data-state={status === "error" ? "error" : status === "connecting" ? "loading" : ""} aria-live="polite">
                                <span></span>{statusText}
                            </div>
                            <button className="outline-button" type="button" onClick={updateMarket} disabled={busy}>
                                {icon("refresh")}{t("refreshData")}
                            </button>
                            <button className="profile-button" type="button" onClick={() => setProfileOpen(value => !value)} aria-expanded={profileOpen}>
                                <span className="avatar">AY</span>
                                <span><strong>{t("investigator")}</strong><small>{user.email}</small></span>
                                {icon("chevron")}
                            </button>
                            {profileOpen && (
                                <div className="profile-menu open">
                                    <button type="button" onClick={logout} disabled={busy}>{t("signOut")}</button>
                                </div>
                            )}
                        </div>
                    </header>

                    <div className="content">
                        <section className="hero" id="overview">
                            <div>
                                <p className="eyebrow"><span></span>{t("heroEyebrow")}</p>
                                <h1>{t("heroTitle")} <em>{t("heroTitleEmphasis")}</em></h1>
                                <p className="hero-copy">{t("heroCopy")}</p>
                            </div>
                            <div className="hero-meta">
                                <span>{t("horizon")}</span><strong>{t("oneDay")}</strong><i></i>
                                <span>{t("pair")}</span><strong>XMR / USD</strong>
                            </div>
                        </section>

                        <section className="ticker-strip" aria-label={t("ticker")}>
                            <div className="ticker-featured">
                                <span className="coin coin-xmr" aria-hidden="true">ɱ</span>
                                <div><small>{t("monero")}</small><strong>XMR / USD</strong></div>
                                <div className="ticker-price">
                                    <strong>{latest ? formatMoney(latest.close, locale) : "—"}</strong>
                                    <span className={priceChangeClass(market?.change_pct)}>
                                        {market ? formatPercent(market.change_pct, locale) : "—"}
                                    </span>
                                </div>
                            </div>
                            <Ticker label={t("latestHigh")} value={latest ? formatMoney(latest.high, locale) : "—"} />
                            <Ticker label={t("latestLow")} value={latest ? formatMoney(latest.low, locale) : "—"} />
                            <Ticker label={t("observationCount")} value={market?.total_count.toLocaleString(locale) ?? "—"} />
                            <Ticker label={t("latestData")} value={latest ? formatDate(latest.date, locale) : "—"} />
                        </section>

                        <section className="panel chart-panel market-panel" id="market">
                            <div className="panel-header chart-header">
                                <div>
                                    <span className="section-kicker">
                                        {chartPeriod === "daily" ? t("dailyMarket") : t("intradayMarket")}
                                    </span>
                                    <div className="price-line">
                                        <strong>
                                            {chartPeriod === "daily"
                                                ? latest ? formatMoney(latest.close, locale) : "—"
                                                : intraday?.rows.length
                                                    ? formatMoney(intraday.rows[intraday.rows.length - 1].close, locale)
                                                    : "—"}
                                        </strong>
                                        {chartPeriod === "daily" && (
                                            <span className={priceChangeClass(market?.change_pct)}>
                                                {market ? formatPercent(market.change_pct, locale) : "—"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="chart-controls" role="group" aria-label={t("chartType")}>
                                    <button className={chartType === "candles" ? "active" : ""} type="button" aria-pressed={chartType === "candles"} onClick={() => setChartType("candles")}>{t("candles")}</button>
                                    <button className={chartType === "line" ? "active" : ""} type="button" aria-pressed={chartType === "line"} onClick={() => setChartType("line")}>{t("line")}</button>
                                </div>
                            </div>
                            <div className="chart-toolbar">
                                <div className="legend">
                                    <span><i className="legend-real"></i>{t("price")}</span>
                                    {chartPeriod === "daily" && showSma && <span><i className="legend-sma"></i>{t("sma9")}</span>}
                                    {chartPeriod === "daily" && showVolumeSma && <span><i className="legend-volume-sma"></i>{t("volumeSma9")}</span>}
                                    {chartPeriod !== "daily" && <span>{t("volume")}</span>}
                                </div>
                                <div className="chart-toolbar-actions">
                                    <div className="range-controls" role="group" aria-label={t("chartWindow")}>
                                        <button
                                            className={chartPeriod === "daily" ? "active" : ""}
                                            type="button"
                                            aria-pressed={chartPeriod === "daily"}
                                            onClick={() => {
                                                setIntradayLoading(false);
                                                setChartPeriod("daily");
                                            }}
                                        >
                                            {t("daily")}
                                        </button>
                                        <button
                                            className={chartPeriod === "5m" ? "active" : ""}
                                            type="button"
                                            aria-pressed={chartPeriod === "5m"}
                                            onClick={() => {
                                                setIntraday(null);
                                                setIntradayError("");
                                                setChartPeriod("5m");
                                                setIntradayRefreshKey(value => value + 1);
                                            }}
                                        >
                                            {t("last12Hours")}
                                        </button>
                                        <button
                                            className={chartPeriod === "1m" ? "active" : ""}
                                            type="button"
                                            aria-pressed={chartPeriod === "1m"}
                                            onClick={() => {
                                                setIntraday(null);
                                                setIntradayError("");
                                                setChartPeriod("1m");
                                                setIntradayRefreshKey(value => value + 1);
                                            }}
                                        >
                                            {t("last10Minutes")}
                                        </button>
                                    </div>
                                    {chartPeriod === "daily" && (
                                        <div className="range-controls" role="group" aria-label={t("dailyRange")}>
                                        {ranges.map(value => (
                                            <button
                                                key={value}
                                                className={range === value ? "active" : ""}
                                                type="button"
                                                aria-pressed={range === value}
                                                onClick={() => setRange(value)}
                                            >
                                                {rangeLabel(value)}
                                            </button>
                                        ))}
                                        </div>
                                    )}
                                    {chartPeriod === "daily" && (
                                        <div className="indicator-controls" role="group" aria-label={t("technicalIndicators")}>
                                            <button className={showSma ? "active" : ""} type="button" aria-pressed={showSma} onClick={() => setShowSma(value => !value)}>SMA 9</button>
                                            <button className={showVolumeSma ? "active" : ""} type="button" aria-pressed={showVolumeSma} onClick={() => setShowVolumeSma(value => !value)}>Vol. SMA 9</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {chartPeriod === "daily"
                                ? market ? (
                                    <MarketChart
                                        rows={market.rows}
                                        range={range}
                                        chartType={chartType}
                                        showSma={showSma}
                                        showVolumeSma={showVolumeSma}
                                        locale={locale}
                                        description={marketChartDescription(market, locale)}
                                    />
                                ) : (
                                    <div className="chart-stage chart-empty" role="status">{marketError || t("loadingMarket")}</div>
                                )
                                : intraday ? (
                                    <IntradayChart
                                        rows={intraday.rows}
                                        interval={intraday.interval}
                                        chartType={chartType}
                                        locale={locale}
                                        source={t("krakenSource")}
                                        description={`${t("intradayMarket")} · ${intraday.interval} · ${intraday.rows.length} ${t("observations")}`}
                                    />
                                ) : (
                                    <div className="chart-stage chart-empty" role="status">
                                        {intradayError || (intradayLoading
                                            ? t("loadingIntraday")
                                            : t("noIntradayCandles"))}
                                    </div>
                                )}
                            <div className="chart-footnote">
                                <span aria-live="polite">
                                    {chartPeriod === "daily"
                                        ? marketError || (market
                                            ? `${t("loadedAt")} ${formattedUpdatedAt} · ${market.rows.length} ${t("observations")}`
                                            : t("loadingMarket"))
                                        : intradayError || (intraday
                                            ? `${t("krakenSource")} · ${intraday.interval} · ${t("loadedAt")} ${formatLocalDateTime(intraday.updated_at, locale)} · ${intraday.rows.length} ${t("observations")}`
                                            : t("loadingIntraday"))}
                                </span>
                                <span title={localTimeZone}>
                                    {chartPeriod === "daily" ? t("interval") : `${t("interval")} · ${intraday?.interval ?? chartPeriod}`} · {localTimeZone}
                                </span>
                            </div>
                            <p className="daily-data-note">
                                {chartPeriod === "daily" ? t("dailySourceNote") : t("intradaySourceNote")}
                            </p>
                        </section>

                        <section className="prediction-grid" id="prediction">
                            <article className="panel prediction-chart-panel">
                                <div className="panel-header">
                                    <div>
                                        <span className="section-kicker">{t("prediction")}</span>
                                        <h2>{t("predictionChartTitle")}</h2>
                                    </div>
                                    <span className="experimental-pill">{t("experimental")}</span>
                                </div>
                                <div className="chart-toolbar prediction-chart-toolbar">
                                    <div className="legend">
                                        <span><i className="legend-real"></i>{t("observedClose")}</span>
                                        <span><i className="legend-forecast"></i>{t("estimate")}</span>
                                    </div>
                                </div>
                                {market ? (
                                    <PredictionChart
                                        rows={market.rows}
                                        prediction={prediction}
                                        locale={locale}
                                        description={predictionChartDescription(market, prediction, locale)}
                                    />
                                ) : <div className="chart-stage chart-empty">{t("loadingMarket")}</div>}
                                <div className="chart-footnote">
                                    <span aria-live="polite">{predictionMessage || (prediction ? t("loadedAt") : t("noPrediction"))}</span>
                                    <span>{t("interval")} · {localTimeZone}</span>
                                </div>
                            </article>

                            <aside className="panel prediction-panel">
                                <div className="panel-header">
                                    <div><span className="section-kicker">{t("scenarioLab")}</span><h2>{t("nextClose")}</h2></div>
                                </div>
                                <label className="field-label" htmlFor="model-select">{t("activeModel")}</label>
                                <div className="select-wrap">
                                    <select id="model-select" value={selectedModel} onChange={event => setSelectedModel(modelIds.find(id => id === event.target.value) ?? "naive")}>
                                        {modelIds.map(id => <option key={id} value={id}>{modelNames[id]}</option>)}
                                    </select>
                                    {icon("chevron")}
                                </div>
                                <div className="prediction-value">
                                    <span>{t("estimatedScenario")}</span>
                                    <strong>{prediction ? formatMoney(prediction.precio_predicho, locale) : "—"}</strong>
                                    <small className={prediction ? priceChangeClass(prediction.cambio_pct) : ""}>
                                        {prediction
                                            ? `${formatPercent(prediction.cambio_pct, locale)} · ${formatDate(prediction.fecha_prediccion, locale)}`
                                            : t("noPrediction")}
                                    </small>
                                </div>
                                <div className="confidence-track">
                                    <div className="confidence-head">
                                        <span>{t("directionAccuracy")}</span>
                                        <strong>{formatMetric(prediction?.metricas_test.acierto_direccion ?? selectedMetrics?.direction, locale, "%")}</strong>
                                    </div>
                                    <div className="track">
                                        <span style={{ width: `${clamp(prediction?.metricas_test.acierto_direccion ?? selectedMetrics?.direction ?? 0, 0, 100)}%` }}></span>
                                    </div>
                                </div>
                                <div className="prediction-metrics">
                                    <div><span>{t("maeTest")}</span><strong>{formatMetric(prediction?.metricas_test.MAE ?? selectedMetrics?.mae, locale, " USD")}</strong></div>
                                    <div><span>{t("mapeTest")}</span><strong>{formatMetric(prediction?.metricas_test.MAPE ?? selectedMetrics?.mape, locale, "%")}</strong></div>
                                    <div><span>{t("window")}</span><strong>30 {t("days")}</strong></div>
                                    <div><span>{t("seed")}</span><strong>{prediction?.semilla ?? selectedMetrics?.seeds ?? "—"}</strong></div>
                                </div>
                                <button className={`primary-button${busy && status === "analyzing" ? " loading" : ""}`} type="button" onClick={createPrediction} disabled={busy || !market}>
                                    <span>{busy && status === "analyzing" ? t("analyzing") : t("runPrediction")}</span>
                                    {icon("arrow")}
                                </button>
                                <p className={`prediction-note${predictionMessage && status === "error" ? " error" : ""}`} role="status" aria-live="polite">
                                    {predictionMessage || t("trainingNotice")}
                                </p>
                            </aside>
                        </section>

                        <section className="stats-grid" id="results">
                            <Stat index="01" label={t("bestMae")} value={bestMae ? formatMoney(bestMae.mae, locale) : "—"} caption={bestMae?.name ?? t("noMetrics")} />
                            <Stat index="02" label={t("chronologicalTest")} value="20%" caption={t("historicalTestSplit")} />
                            <Stat index="03" label={t("bestDirection")} value={bestDirection ? `${formatMetric(bestDirection.direction, locale, "%")}` : "—"} caption={bestDirection?.name ?? t("noMetrics")} />
                            <Stat index="04" label={t("evaluatedModels")} value={String(modelMetrics.length)} caption={t("historicalShare")} />
                        </section>

                        <section className="extended-analysis panel" id="analisis-extenso" aria-labelledby="extended-analysis-title">
                            <div className="section-heading standalone">
                                <div>
                                    <span className="section-kicker">{language === "es" ? "INVESTIGACIÓN · XMR/USD" : "RESEARCH · XMR/USD"}</span>
                                    <h2 id="extended-analysis-title">{language === "es" ? "Detalles extensos del análisis" : "Extended analysis details"}</h2>
                                </div>
                                <p>{language === "es"
                                    ? "Cuatro etapas conectan los hallazgos históricos con sus explicaciones, proyecciones y decisiones posibles."
                                    : "Four stages connect historical findings with explanations, forecasts and possible decisions."}</p>
                            </div>
                            <div className="analysis-scope">
                                <span>{language === "es" ? "BASE" : "DATASET"}<strong>3.278 {language === "es" ? "observaciones" : "observations"}</strong></span>
                                <span>{language === "es" ? "PERIODO" : "PERIOD"}<strong>09 nov 2017 — 31 oct 2026</strong></span>
                                <span>{language === "es" ? "FRECUENCIA" : "FREQUENCY"}<strong>{language === "es" ? "Diaria · UTC" : "Daily · UTC"}</strong></span>
                            </div>
                            <div className="analysis-stage-grid">
                                <article className="analysis-stage">
                                    <span className="analysis-stage-number">01 / DESCRIPTIVO</span>
                                    <h3>{language === "es" ? "¿Qué ocurrió?" : "What happened?"}</h3>
                                    <ul>
                                        <li>{language === "es" ? "El cierre pasó de 120,78 USD a 598,60 USD (+395,6%) en el periodo." : "The close moved from $120.78 to $598.60 (+395.6%) over the period."}</li>
                                        <li>{language === "es" ? "La desviación estándar del retorno diario fue 4,68%; el 5% de días más extremos superó 9,65% en valor absoluto." : "Daily return standard deviation was 4.68%; the most extreme 5% of days exceeded 9.65% in absolute value."}</li>
                                        <li>{language === "es" ? "Por día de semana, el retorno medio varió entre −0,27% (jueves) y +0,54% (sábado); por mes no aparece diferencia clara." : "Mean return by weekday ranged from −0.27% (Thursday) to +0.54% (Saturday); monthly differences are unclear."}</li>
                                    </ul>
                                </article>
                                <article className="analysis-stage">
                                    <span className="analysis-stage-number">02 / DIAGNÓSTICO</span>
                                    <h3>{language === "es" ? "¿Qué podría explicarlo?" : "What may explain it?"}</h3>
                                    <p>{language === "es"
                                        ? "El volumen y el movimiento absoluto del precio se asociaron positivamente (Spearman ρ = 0,25; p < 0,001). Los días del decil superior de volumen tuvieron movimientos absolutos medios de 5,10%, frente a 2,92% en los demás. Es una asociación exploratoria, no causal."
                                        : "Volume and absolute price movement were positively associated (Spearman ρ = 0.25; p < 0.001). Days in the top volume decile had mean absolute moves of 5.10%, versus 2.92% on other days. This is exploratory association, not causation."}</p>
                                    <p>{language === "es"
                                        ? "Las distribuciones por día de semana difieren (ANOVA p = 0,037; Kruskal–Wallis p = 0,007), antes de ajustar comparaciones. No se encontró diferencia mensual (p = 0,855). La magnitud semanal es pequeña y las fechas no aportan contexto externo para explicar causas de mercado."
                                        : "Weekday distributions differ (ANOVA p = 0.037; Kruskal–Wallis p = 0.007), before adjusting comparisons. No monthly difference was found (p = 0.855). The weekday effect is small and dates alone do not provide external context to explain market causes."}</p>
                                </article>
                                <article className="analysis-stage">
                                    <span className="analysis-stage-number">03 / PREDICTIVO</span>
                                    <h3>{language === "es" ? "¿Qué anticipa la validación?" : "What does validation anticipate?"}</h3>
                                    <p>{language === "es"
                                        ? "La evaluación cronológica existente (20% final, 656 días) no respalda que una red neuronal mejore la persistencia: su MAE fue 9,69 USD, frente a 9,99 USD para LSTM y 10,11 USD para GRU. El modelo de media móvil tuvo MAE 15,20 USD."
                                        : "The existing chronological evaluation (final 20%, 656 days) does not support neural networks improving on persistence: MAE was $9.69, versus $9.99 for LSTM and $10.11 for GRU. The moving average model had $15.20 MAE."}</p>
                                    <p>{language === "es"
                                        ? "En el holdout, el rango diario MA7 tuvo MAE 2,25 puntos porcentuales y el log-volumen MA7 0,20. El retorno por día (media histórica) tuvo MAE 2,66 puntos; por mes calendario (22 meses), MAE 0,43 frente a 0,43 de la media global. Las categorías no aportaron mejora útil."
                                        : "On the holdout, daily range MA7 had 2.25 percentage-point MAE and log-volume MA7 had 0.20. Weekday return (historical mean) had 2.66-point MAE; calendar-month return (22 months) had 0.43 versus 0.43 for the global mean. Categories added no useful improvement."}</p>
                                </article>
                                <article className="analysis-stage">
                                    <span className="analysis-stage-number">04 / PRESCRIPTIVO</span>
                                    <h3>{language === "es" ? "¿Qué conviene hacer?" : "What should we do?"}</h3>
                                    <ul>
                                        <li>{language === "es" ? "Usar persistencia como referencia mínima y exigir una mejora estable fuera de muestra antes de cambiar el modelo." : "Use persistence as the minimum benchmark and require stable out-of-sample improvement before changing models."}</li>
                                        <li>{language === "es" ? "Acompañar el precio con bandas de riesgo y monitoreo de volatilidad/volumen; evitar inferir dirección del precio a partir del volumen." : "Pair price with risk bands and volatility/volume monitoring; do not infer price direction from volume."}</li>
                                        <li>{language === "es" ? "Revisar datos y backtest por ventanas antes de decisiones; no operar con efectos de calendario no confirmados." : "Review data and rolling backtests before decisions; do not trade on unconfirmed calendar effects."}</li>
                                    </ul>
                                </article>
                            </div>
                            <div className="analysis-deliverables">
                                <p>{language === "es" ? "Entregables reproducibles en la raíz del proyecto:" : "Reproducible deliverables in the project root:"}</p>
                                <span>analisis_descriptivo/ · analisis_diagnostico/ · analisis_predictivo/ · analisis_prescriptivo/</span>
                                <small>{language === "es" ? "Estudio académico experimental; no es asesoría financiera." : "Experimental academic study; not financial advice."}</small>
                            </div>
                        </section>

                        <section className="panel models-panel" id="models">
                            <div className="panel-header section-heading">
                                <div>
                                    <span className="section-kicker">{t("benchmark")}</span>
                                    <h2>{t("modelComparison")}</h2>
                                    <p>{t("lowerError")}</p>
                                    <span className="metrics-updated-at">
                                        {benchmark?.updated_at
                                            ? `${t("updatedAt")} ${formatLocalDateTime(benchmark.updated_at, locale)}`
                                            : modelsError || t("pendingBenchmark")}
                                    </span>
                                </div>
                                <div className="metric-switch" role="group" aria-label={t("metric")}>
                                    {(["mae", "rmse", "mape"] as const).map(value => (
                                        <button
                                            key={value}
                                            className={metric === value ? "active" : ""}
                                            type="button"
                                            aria-pressed={metric === value}
                                            onClick={() => setMetric(value)}
                                        >
                                            {value.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="model-comparison">
                                <ModelChart
                                    models={modelMetrics}
                                    metric={metric}
                                    locale={locale}
                                    description={`${t("modelComparison")}: ${metric.toUpperCase()}`}
                                />
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th scope="col">{t("rank")}</th><th scope="col">{t("model")}</th>
                                                <th scope="col">{t("mae")}</th><th scope="col">{t("rmse")}</th>
                                                <th scope="col">{t("mape")}</th><th scope="col">{t("direction")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {modelMetrics.length ? modelMetrics.map((item, index) => (
                                                <tr className={index === 0 ? "winner" : ""} key={item.id}>
                                                    <td>{String(index + 1).padStart(2, "0")}</td>
                                                    <td><span className="model-dot"></span><strong>{item.name}</strong><small>{item.objective}</small></td>
                                                    <td>{formatMetric(item.mae, locale, "")}</td>
                                                    <td>{formatMetric(item.rmse, locale, "")}</td>
                                                    <td>{formatMetric(item.mape, locale, "%")}</td>
                                                    <td>{formatMetric(item.direction, locale, "%")}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={6}>{modelsError || t("noMetrics")}</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <p className="table-note">{t("persistenceNote")}</p>
                        </section>

                        <section className="methodology" id="methodology">
                            <div className="section-heading standalone">
                                <div><span className="section-kicker">{t("protocol")}</span><h2>{t("methodologyTitle")}</h2></div>
                                <p>{t("methodologyCopy")}</p>
                            </div>
                            <div className="method-grid">
                                <Method number="01" title={t("historicalData")} copy={t("historicalCopy")} />
                                <Method number="02" title={t("temporalSplit")} copy={t("temporalCopy")} />
                                <Method number="03" title={t("fiveModels")} copy={t("fiveModelsCopy")} />
                                <Method number="04" title={t("honestEvaluation")} copy={t("honestCopy")} />
                            </div>
                        </section>

                        <section className="research-callout">
                            <div className="callout-mark" aria-hidden="true">!</div>
                            <div>
                                <span className="section-kicker">{t("responsibleReading")}</span>
                                <h2>{t("predictionIsNotPromise")}</h2>
                                <p>{t("responsibleCopy")}</p>
                            </div>
                            <a href="#models">{t("reviewResults")} <span aria-hidden="true">→</span></a>
                        </section>

                        <footer className="site-footer">
                            <span>AyLZz Crypto Lab</span>
                            <p>{t("footerPortal")}</p>
                            <p title={localTimeZone}>{t("loadedAt")}: {formattedUpdatedAt} · {localTimeZone}</p>
                        </footer>
                    </div>
                </div>
            </div>
        </main>
    );
}

function Ticker({ label, value }: { label: string; value: string }) {
    return <div className="ticker-item"><span>{label}</span><strong>{value}</strong></div>;
}

function Stat({ index, label, value, caption }: { index: string; label: string; value: string; caption: string }) {
    return (
        <article className="stat-card">
            <span className="stat-index">{index}</span>
            <div><small>{label}</small><strong>{value}</strong><p>{caption}</p></div>
        </article>
    );
}

function Method({ number, title, copy }: { number: string; title: string; copy: string }) {
    return <article><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>;
}

function formatMoney(value: number, locale: string): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatPercent(value: number, locale: string): string {
    return `${value >= 0 ? "+" : ""}${formatMetric(value, locale, "%")}`;
}

function formatMetric(value: number | undefined, locale: string, suffix: string): string {
    if (value === undefined || !Number.isFinite(value)) return "—";
    return `${value.toLocaleString(locale, { maximumFractionDigits: 2 })}${suffix}`;
}

function formatDate(value: string, locale: string): string {
    const [year, month, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatLocalDateTime(value: string, locale: string): string {
    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value));
}

function rangeLabel(days: number): string {
    if (days === 1) return "1D";
    if (days === 5) return "5D";
    if (days === 30) return "1M";
    if (days === 90) return "3M";
    if (days === 180) return "6M";
    return "1A";
}

function clamp(value: number, minimum: number, maximum: number): number {
    return Math.max(minimum, Math.min(maximum, value));
}

function marketChartDescription(market: MarketSnapshot, locale: string): string {
    const latest = market.latest;
    return `XMR-USD daily OHLCV chart, ${market.rows.length} candles. Latest ${formatDate(latest.date, locale)}: open ${latest.open}, high ${latest.high}, low ${latest.low}, close ${latest.close}, volume ${latest.volume}.`;
}

function predictionChartDescription(
    market: MarketSnapshot,
    prediction: Prediction | null,
    locale: string
): string {
    const description = `XMR-USD observed daily closes. Latest ${formatDate(market.latest.date, locale)}: ${market.latest.close}.`;
    return prediction
        ? `${description} ${modelNames[prediction.modelo]} estimate for ${formatDate(prediction.fecha_prediccion, locale)}: ${prediction.precio_predicho}.`
        : description;
}

function icon(name: "grid" | "chart" | "trend" | "compare" | "layers" | "bars" | "download" | "menu" | "refresh" | "chevron" | "arrow") {
    const paths: Record<typeof name, string> = {
        grid: "M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z",
        chart: "M4 18V9m5 9V5m6 13v-7m5 7V3M2 21h20",
        trend: "M4 18h16M6 15l4-5 3 3 5-7",
        compare: "m4 17 4-5 4 3 6-8 2 2M4 4v16h16",
        layers: "M12 3 3 7.5 12 12l9-4.5L12 3Zm-7 9v5l7 4 7-4v-5",
        bars: "M5 20V10m7 10V4m7 16v-7",
        download: "M12 3v12m0 0 4-4m-4 4-4-4M5 21h14",
        menu: "M4 7h16M4 12h16M4 17h16",
        refresh: "M20 7v5h-5M4 17v-5h5m10-1a7 7 0 0 0-12-4L4 9m16 6-3 2a7 7 0 0 1-12-4",
        chevron: "m8 10 4 4 4-4",
        arrow: "M5 12h14m-5-5 5 5-5 5"
    };
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d={paths[name]} />
        </svg>
    );
}
