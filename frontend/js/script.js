const AUTH_STORAGE_KEY = "aylzz_crypto_session";
const SVG_NS = "http://www.w3.org/2000/svg";
const MODEL_NAMES = {
    naive: "Persistencia",
    moving_average: "Media móvil 7",
    arima: "ARIMA",
    lstm: "LSTM",
    gru: "GRU"
};

function getSession() {
    try {
        const session = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
        if (!session || session.expiresAt <= Date.now()) return null;
        return session;
    } catch {
        return null;
    }
}

const session = getSession();
if (!session) window.location.href = "/login/";

let marketRows = [];
let marketTotalCount = 0;
let modelData = {};
let chartMode = "candles";
let chartRange = 365;
const chartIndicators = { sma: false, "volume-sma": false };
let activeModel = document.getElementById("model-select")?.value || "lstm";
let livePrediction = null;

const svg = document.getElementById("market-chart");
const tooltip = document.getElementById("chart-tooltip");
const legendForecast = document.querySelector(".legend-forecast-item");
const legendSma = document.querySelector(".legend-sma-item");
const legendVolumeSma = document.querySelector(".legend-volume-sma-item");

function svgNode(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
}

function formatMoney(value) {
    if (!Number.isFinite(Number(value))) return "—";
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value));
}

function formatNumber(value, digits = 2) {
    if (!Number.isFinite(Number(value))) return "—";
    return Number(value).toLocaleString("es-CO", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
}

function formatDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    }).format(new Date(`${value}T00:00:00Z`));
}

function movingAverage(rows, index, field, period = 9) {
    if (index + 1 < period) return null;
    const values = rows.slice(index - period + 1, index + 1).map(row => Number(row[field]));
    if (values.some(value => !Number.isFinite(value))) return null;
    return values.reduce((sum, value) => sum + value, 0) / period;
}

function setServiceStatus(message, state = "") {
    const element = document.getElementById("market-status");
    element.lastChild.textContent = ` ${message.toUpperCase()}`;
    element.dataset.state = state;
}

function setPredictionStatus(message, error = false) {
    const status = document.getElementById("prediction-status");
    status.textContent = message;
    status.classList.toggle("error", error);
}

async function requestJson(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(body.detail || `Error del servicio (${response.status}).`);
    }
    return body;
}

function applyMarket(market) {
    marketRows = market.rows || [];
    marketTotalCount = Number(market.total_count) || marketRows.length;
    const latest = market.latest;
    if (!latest || !marketRows.length) {
        throw new Error("El servicio no devolvió velas válidas para XMR-USD.");
    }

    document.getElementById("ticker-price").textContent = formatMoney(latest.close);
    document.getElementById("ticker-change").textContent = `${market.change_pct >= 0 ? "+" : ""}${formatNumber(market.change_pct)}%`;
    document.getElementById("ticker-change").className = market.change_pct >= 0 ? "positive" : "negative";
    document.getElementById("ticker-high").textContent = formatMoney(latest.high);
    document.getElementById("ticker-low").textContent = formatMoney(latest.low);
    document.getElementById("ticker-count").textContent = Number(market.total_count).toLocaleString("es-CO");
    document.getElementById("ticker-date").textContent = formatDate(latest.date);
    document.getElementById("observation-count").textContent = Number(market.total_count).toLocaleString("es-CO");
    document.getElementById("chart-price").textContent = formatMoney(latest.close);
    document.getElementById("chart-change").textContent = `${market.change_pct >= 0 ? "+" : ""}${formatNumber(market.change_pct)}%`;
    document.getElementById("chart-change").className = market.change_pct >= 0 ? "positive" : "negative";
    document.getElementById("chart-data-status").textContent = `XMR-USD · ${marketRows.length} velas recientes · actualizado ${new Date(market.updated_at).toLocaleString("es-CO")}`;
    setServiceStatus("Servicio Monero activo", "online");
    renderChart();
}

function renderChart() {
    if (!svg) return;
    svg.replaceChildren();
    if (!marketRows.length) {
        const empty = svgNode("text", { x: 450, y: 190, class: "chart-axis-label", "text-anchor": "middle" });
        empty.textContent = "Esperando datos del servicio Monero";
        svg.append(empty);
        return;
    }

    const firstDataIndex = Math.max(0, marketRows.length - chartRange);
    const data = marketRows.slice(firstDataIndex);
    const forecastVisible = chartMode === "forecast" && livePrediction;
    const forecastPrice = forecastVisible ? livePrediction.precio_predicho : null;
    const width = 900;
    const height = 390;
    const pad = { top: 16, right: 68, bottom: 52, left: 18 };
    const plotH = 275;
    const plotCount = data.length + (forecastVisible ? 1 : 0);
    const values = data.flatMap(item => [item.low, item.high]);
    if (forecastVisible) values.push(forecastPrice);
    const min = Math.min(...values) * 0.97;
    const max = Math.max(...values) * 1.03;
    const xStep = (width - pad.left - pad.right) / Math.max(1, plotCount);
    const y = value => pad.top + (max - value) / (max - min || 1) * plotH;
    const x = index => pad.left + index * xStep + xStep / 2;

    const defs = svgNode("defs");
    const gradient = svgNode("linearGradient", { id: "chart-gradient", x1: "0", y1: "0", x2: "0", y2: "1" });
    gradient.append(svgNode("stop", { offset: "0", "stop-color": "#ff3434", "stop-opacity": ".24" }));
    gradient.append(svgNode("stop", { offset: "1", "stop-color": "#ff3434", "stop-opacity": "0" }));
    defs.append(gradient);
    svg.append(defs);

    for (let index = 0; index < 5; index++) {
        const gridY = pad.top + (plotH / 4) * index;
        const value = max - ((max - min) / 4) * index;
        svg.append(svgNode("line", {
            x1: pad.left, y1: gridY, x2: width - pad.right, y2: gridY, class: "chart-grid-line"
        }));
        const label = svgNode("text", {
            x: width - 8, y: gridY + 4, class: "chart-axis-label", "text-anchor": "end"
        });
        label.textContent = `$${Math.round(value).toLocaleString("es-CO")}`;
        svg.append(label);
    }

    const dateIndexes = [...new Set([0, Math.floor((data.length - 1) / 3), Math.floor((data.length - 1) * 2 / 3), data.length - 1])];
    dateIndexes.forEach((index, labelIndex) => {
        const label = svgNode("text", {
            x: x(index),
            y: 330,
            class: "chart-axis-label",
            "text-anchor": labelIndex === 0 ? "start" : labelIndex === dateIndexes.length - 1 ? "end" : "middle"
        });
        label.textContent = formatDate(data[index].date);
        svg.append(label);
    });

    if (chartMode === "candles") {
        data.forEach((item, index) => {
            const rising = item.close >= item.open;
            const className = rising ? "candle-up" : "candle-down";
            svg.append(svgNode("line", {
                x1: x(index), y1: y(item.high), x2: x(index), y2: y(item.low), class: `candle-wick ${className}`
            }));
            const bodyY = Math.min(y(item.open), y(item.close));
            const bodyH = Math.max(2, Math.abs(y(item.open) - y(item.close)));
            svg.append(svgNode("rect", {
                x: x(index) - Math.max(2, xStep * 0.28),
                y: bodyY,
                width: Math.max(3, xStep * 0.56),
                height: bodyH,
                rx: 1,
                class: className
            }));
        });
    } else {
        const path = data.map((item, index) => `${index ? "L" : "M"} ${x(index)} ${y(item.close)}`).join(" ");
        const area = `${path} L ${x(data.length - 1)} ${pad.top + plotH} L ${x(0)} ${pad.top + plotH} Z`;
        svg.append(svgNode("path", { d: area, class: "chart-area" }));
        svg.append(svgNode("path", { d: path, class: "chart-line" }));

        if (forecastVisible) {
            svg.append(svgNode("path", {
                d: `M ${x(data.length - 1)} ${y(data[data.length - 1].close)} L ${x(data.length)} ${y(forecastPrice)}`,
                class: "forecast-line"
            }));
            svg.append(svgNode("circle", {
                cx: x(data.length), cy: y(forecastPrice), r: 4, class: "forecast-point"
            }));
            const forecastDate = svgNode("text", {
                x: x(data.length), y: 330, class: "chart-axis-label", "text-anchor": "end"
            });
            forecastDate.textContent = formatDate(livePrediction.fecha_prediccion);
            svg.append(forecastDate);
        }
    }

    const volumeBase = 378;
    const maxVolume = Math.max(...data.map(item => item.volume || 0), 1);
    data.forEach((item, index) => {
        const barH = (item.volume || 0) / maxVolume * 36;
        svg.append(svgNode("rect", {
            x: x(index) - Math.max(1.5, xStep * 0.26),
            y: volumeBase - barH,
            width: Math.max(2, xStep * 0.52),
            height: barH,
            class: item.close >= item.open ? "volume-up" : "volume-down"
        }));
    });

    if (chartIndicators.sma) {
        const smaPoints = data.map((item, index) => {
            const value = movingAverage(marketRows, firstDataIndex + index, "close");
            return value === null ? null : `${x(index)} ${y(value)}`;
        }).filter(Boolean);
        if (smaPoints.length) {
            svg.append(svgNode("path", {
                d: smaPoints.map((point, index) => `${index ? "L" : "M"} ${point}`).join(" "),
                class: "chart-sma"
            }));
        }
    }

    if (chartIndicators["volume-sma"]) {
        const volumePoints = data.map((item, index) => {
            const value = movingAverage(marketRows, firstDataIndex + index, "volume");
            return value === null ? null : `${x(index)} ${volumeBase - value / maxVolume * 36}`;
        }).filter(Boolean);
        if (volumePoints.length) {
            svg.append(svgNode("path", {
                d: volumePoints.map((point, index) => `${index ? "L" : "M"} ${point}`).join(" "),
                class: "chart-volume-sma"
            }));
        }
    }

    const hitArea = svgNode("rect", {
        x: pad.left, y: pad.top, width: width - pad.left - pad.right,
        height: plotH, fill: "transparent", class: "chart-hit-area"
    });
    hitArea.addEventListener("pointermove", event => {
        const chartRect = svg.getBoundingClientRect();
        const stageRect = svg.parentElement.getBoundingClientRect();
        const localX = (event.clientX - chartRect.left) * (width / chartRect.width);
        const index = Math.max(0, Math.min(data.length - 1, Math.floor((localX - pad.left) / xStep)));
        const item = data[index];
        const heading = document.createElement("strong");
        heading.textContent = `${formatDate(item.date)} · ${formatMoney(item.close)}`;
        const detail = document.createElement("span");
        const rowIndex = firstDataIndex + index;
        const sma = movingAverage(marketRows, rowIndex, "close");
        const volumeSma = movingAverage(marketRows, rowIndex, "volume");
        detail.textContent = [
            `O ${formatMoney(item.open)} · H ${formatMoney(item.high)}`,
            `L ${formatMoney(item.low)} · C ${formatMoney(item.close)}`,
            `Vol. ${Number(item.volume || 0).toLocaleString("es-CO")}`,
            chartIndicators.sma && sma !== null ? `SMA 9 ${formatMoney(sma)}` : "",
            chartIndicators["volume-sma"] && volumeSma !== null
                ? `Vol. SMA 9 ${Number(volumeSma).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`
                : ""
        ].filter(Boolean).join("\n");
        tooltip.replaceChildren(heading, detail);
        const tooltipWidth = tooltip.offsetWidth;
        tooltip.style.left = `${Math.max(8, Math.min(stageRect.width - tooltipWidth - 8, event.clientX - stageRect.left + 12))}px`;
        tooltip.style.top = `${Math.max(8, event.clientY - stageRect.top - 80)}px`;
        tooltip.classList.add("visible");
    });
    hitArea.addEventListener("pointerleave", () => {
        tooltip.classList.remove("visible");
        tooltip.style.left = "0";
        tooltip.style.top = "0";
    });
    svg.append(hitArea);
    legendForecast.hidden = !forecastVisible;
    legendSma.hidden = !chartIndicators.sma;
    legendVolumeSma.hidden = !chartIndicators["volume-sma"];
    if (forecastVisible) {
        legendForecast.lastChild.textContent = ` ${MODEL_NAMES[livePrediction.modelo] || livePrediction.modelo}`;
    }
}

function renderModelBars(metric = "mae") {
    const container = document.getElementById("model-bars");
    const entries = Object.entries(modelData);
    if (!entries.length) {
        container.textContent = "No hay métricas de evaluación disponibles.";
        return;
    }
    const max = Math.max(...entries.map(([, model]) => model[metric]));
    container.innerHTML = entries.map(([key, model], index) => {
        const width = max > 0 ? model[metric] / max * 100 : 0;
        const value = metric === "mape" ? `${formatNumber(model[metric])}%` : formatMoney(model[metric]);
        return `<div class="model-bar-row ${index === 0 ? "best" : ""}">
            <span>${MODEL_NAMES[key]}</span>
            <div class="model-bar-track"><i style="width:${width}%"></i></div>
            <strong>${value}</strong>
        </div>`;
    }).join("");
}

function renderModelTable(models) {
    const table = document.getElementById("models-table");
    if (!models.length) {
        table.innerHTML = '<tr><td colspan="6">No hay métricas de evaluación disponibles.</td></tr>';
        return;
    }
    table.innerHTML = models.map((model, index) => `
        <tr class="${index === 0 ? "winner" : ""}">
            <td>${String(index + 1).padStart(2, "0")}</td>
            <td><span class="model-dot"></span><strong>${MODEL_NAMES[model.id]}</strong><small>${model.objective}</small></td>
            <td>${formatNumber(model.mae)}</td><td>${formatNumber(model.rmse)}</td>
            <td>${formatNumber(model.mape)}%</td><td>${formatNumber(model.direction, 1)}%</td>
        </tr>`).join("");
    const bestMae = models.reduce((best, model) => model.mae < best.mae ? model : best, models[0]);
    const bestDirection = models.reduce((best, model) => model.direction > best.direction ? model : best, models[0]);
    document.getElementById("best-mae").innerHTML = `${formatNumber(bestMae.mae)} <em>USD</em>`;
    document.getElementById("best-model").textContent = `${MODEL_NAMES[bestMae.id]} · línea base`;
    document.getElementById("best-direction").innerHTML = `${formatNumber(bestDirection.direction, 1)}<em>%</em>`;
    document.getElementById("best-direction-model").textContent = `${MODEL_NAMES[bestDirection.id]} · prueba`;
    document.getElementById("model-count").textContent = String(models.length);
}

function applyModels(models) {
    modelData = Object.fromEntries(models.map(model => [model.id, model]));
    renderModelTable(models);
    renderModelBars();
}

function updateSelectedModel(modelKey) {
    activeModel = modelKey;
    const model = modelData[modelKey];
    if (!model) return;
    document.getElementById("metric-mae").textContent = `${formatNumber(model.mae)} USD`;
    document.getElementById("metric-mape").textContent = `${formatNumber(model.mape)}%`;
    document.getElementById("metric-seeds").textContent = String(model.seeds);
    document.getElementById("confidence-value").textContent = `${formatNumber(model.direction, 1)}%`;
    document.getElementById("confidence-bar").style.width = `${Math.max(0, Math.min(100, model.direction))}%`;
}

function showPrediction(prediction) {
    livePrediction = prediction;
    document.getElementById("predicted-price").textContent = formatMoney(prediction.precio_predicho);
    document.getElementById("predicted-change").textContent =
        `${prediction.cambio_pct >= 0 ? "+" : ""}${formatNumber(prediction.cambio_pct)}% · ${formatDate(prediction.fecha_prediccion)}`;
    document.getElementById("metric-seeds").textContent = String(prediction.semilla);
    const metrics = prediction.metricas_test || {};
    document.getElementById("metric-mae").textContent = Number.isFinite(metrics.MAE) ? `${formatNumber(metrics.MAE)} USD` : "—";
    document.getElementById("metric-mape").textContent = Number.isFinite(metrics.MAPE) ? `${formatNumber(metrics.MAPE)}%` : "—";
    document.getElementById("confidence-value").textContent = Number.isFinite(metrics.acierto_direccion)
        ? `${formatNumber(metrics.acierto_direccion, 1)}%`
        : "—";
    document.getElementById("confidence-bar").style.width = `${Math.max(0, Math.min(100, metrics.acierto_direccion || 0))}%`;
    setPredictionStatus(`Último dato ${formatDate(prediction.fecha_ultimo_dato)} · escenario ${prediction.direccion} para ${formatDate(prediction.fecha_prediccion)}.`);
    chartMode = "forecast";
    document.querySelectorAll(".chart-type").forEach(button => {
        button.classList.toggle("active", button.dataset.chart === chartMode);
    });
    renderChart();
}

document.querySelectorAll(".chart-type").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".chart-type").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        chartMode = button.dataset.chart;
        renderChart();
    });
});

document.querySelectorAll("[data-range]").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll("[data-range]").forEach(item => {
            item.classList.remove("active");
            item.setAttribute("aria-pressed", "false");
        });
        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
        chartRange = Number(button.dataset.range);
        renderChart();
    });
});

document.querySelectorAll("[data-indicator]").forEach(button => {
    button.addEventListener("click", () => {
        const indicator = button.dataset.indicator;
        chartIndicators[indicator] = !chartIndicators[indicator];
        button.classList.toggle("active", chartIndicators[indicator]);
        button.setAttribute("aria-pressed", String(chartIndicators[indicator]));
        renderChart();
    });
});

document.querySelectorAll("[data-metric]").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll("[data-metric]").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        renderModelBars(button.dataset.metric);
    });
});

document.getElementById("model-select")?.addEventListener("change", event => updateSelectedModel(event.target.value));

document.getElementById("refresh-data")?.addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    setServiceStatus("descargando", "loading");
    try {
        applyMarket(await requestJson("/api/v1/market/refresh", { method: "POST" }));
    } catch (error) {
        setServiceStatus("sin conexión", "error");
        document.getElementById("chart-data-status").textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

document.getElementById("run-prediction")?.addEventListener("click", async event => {
    const button = event.currentTarget;
    const label = button.querySelector("span");
    button.disabled = true;
    button.classList.add("loading");
    label.textContent = "Descargando y analizando…";
    setServiceStatus("analizando", "loading");
    setPredictionStatus("Descargando cotizaciones y preparando el dataset; el primer entrenamiento puede tardar varios minutos.");
    try {
        const result = await requestJson("/api/v1/predictions", {
            method: "POST",
            body: JSON.stringify({ model: activeModel })
        });
        applyMarket(result.market);
        showPrediction(result.prediction);
    } catch (error) {
        setServiceStatus("error de servicio", "error");
        setPredictionStatus(error.message, true);
    } finally {
        button.disabled = false;
        button.classList.remove("loading");
        label.textContent = "Descargar y predecir";
    }
});

const profileMenu = document.getElementById("profile-menu");
document.getElementById("profile-button")?.addEventListener("click", () => profileMenu.classList.toggle("open"));
document.getElementById("logout-button")?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = "/login/";
});

if (session?.email) document.getElementById("profile-email").textContent = session.email;

const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("mobile-backdrop");
document.getElementById("menu-button")?.addEventListener("click", () => {
    sidebar.classList.add("open");
    backdrop.classList.add("visible");
});
backdrop?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("visible");
});
document.querySelectorAll(".nav-link[href]").forEach(link => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
        link.classList.add("active");
        sidebar.classList.remove("open");
        backdrop.classList.remove("visible");
    });
});

document.getElementById("export-report")?.addEventListener("click", () => {
    const report = {
        project: "AyLZz Crypto Lab — Monero XMR-USD",
        exportedAt: new Date().toISOString(),
        observations: marketTotalCount,
        prediction: livePrediction,
        models: Object.values(modelData),
        disclaimer: "Estudio académico; no es recomendación de inversión."
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "aylzz-xmr-analysis.json";
    link.click();
    URL.revokeObjectURL(link.href);
});

async function loadDashboard() {
    try {
        applyMarket(await requestJson("/api/v1/market?limit=365"));
    } catch (error) {
        setServiceStatus("sin conexión", "error");
        document.getElementById("chart-data-status").textContent = error.message;
    }
    try {
        const result = await requestJson("/api/v1/models");
        applyModels(result.models);
        updateSelectedModel(activeModel);
    } catch (error) {
        document.getElementById("models-table").innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
    }
}

renderChart();
loadDashboard();
