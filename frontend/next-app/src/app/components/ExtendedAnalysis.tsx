"use client";

type Language = "es" | "en";

const files = {
    descriptiveReport: "/analisis/informes/INFORME-descriptivo.md",
    diagnosticReport: "/analisis/informes/INFORME-diagnostico.md",
    predictiveReport: "/analisis/informes/INFORME-predictivo.md",
    prescriptiveReport: "/analisis/informes/INFORME-prescriptivo.md"
};

export function ExtendedAnalysis({ language }: { language: Language }) {
    const es = language === "es";
    return (
        <section className="extended-analysis panel" id="analisis-extenso" aria-labelledby="extended-analysis-title">
            <header className="extended-analysis-header">
                <div>
                    <span className="section-kicker">{es ? "INFORME INTEGRADO · XMR/USD" : "INTEGRATED REPORT · XMR/USD"}</span>
                    <h2 id="extended-analysis-title">{es ? "Detalles extensos del análisis" : "Extended analysis details"}</h2>
                    <p>{es
                        ? "Un mismo proyecto conecta la analítica de Ingeniería de la Información con el modelado temporal de Sistemas Inteligentes."
                        : "One project connects Information Engineering analytics with time-series modeling from Intelligent Systems."}</p>
                </div>
                <a className="analysis-download" href="/analisis/metricas_backtest.csv" download>
                    {es ? "Descargar resultados del backtest CSV ↓" : "Download backtest results CSV ↓"}
                </a>
            </header>

            <div className="analysis-scope">
                <span>{es ? "OBSERVACIONES" : "OBSERVATIONS"}<strong>3.278</strong></span>
                <span>{es ? "PERIODO" : "PERIOD"}<strong>09 nov 2017 — 31 oct 2026</strong></span>
                <span>{es ? "FRECUENCIA" : "FREQUENCY"}<strong>{es ? "Diaria · UTC" : "Daily · UTC"}</strong></span>
                <span>{es ? "VARIABLES DE ORIGEN" : "SOURCE VARIABLES"}<strong>OHLCV</strong></span>
            </div>

            <nav className="analysis-index" aria-label={es ? "Índice del informe" : "Report contents"}>
                <a href="#analisis-descriptivo">01 · {es ? "Descriptivo" : "Descriptive"}</a>
                <a href="#analisis-diagnostico">02 · {es ? "Diagnóstico" : "Diagnostic"}</a>
                <a href="#analisis-predictivo">03 · {es ? "Predictivo" : "Predictive"}</a>
                <a href="#analisis-prescriptivo">04 · {es ? "Prescriptivo" : "Prescriptive"}</a>
            </nav>

            <article className="analysis-report-stage" id="analisis-descriptivo">
                <div className="analysis-stage-heading">
                    <span className="analysis-stage-number">01 / DESCRIPTIVO</span>
                    <h3>{es ? "¿Qué ocurrió? · Exploración de datos (EDA)" : "What happened? · Exploratory data analysis (EDA)"}</h3>
                    <p>{es
                        ? "Se calcularon estadísticas de precio y retornos y se derivaron las categorías día de semana y mes desde la fecha UTC. Las categorías no venían en columnas separadas en el archivo original."
                        : "Price and return statistics were calculated, and weekday/month categories were derived from the UTC date. These categories were not separate columns in the source file."}</p>
                </div>
                <div className="analysis-finding-grid">
                    <section className="analysis-finding">
                        <span>{es ? "HALLAZGO NUMÉRICO 01" : "NUMERIC FINDING 01"}</span>
                        <h4>{es ? "El precio tuvo un fuerte cambio acumulado" : "Price had a large cumulative change"}</h4>
                        <p>{es
                            ? "El cierre pasó de 120,78 USD a 598,60 USD (+395,61%) entre el primer y último registro. La serie incluye distintas fases; el cambio acumulado no implica una trayectoria uniforme ni anticipa que continúe."
                            : "The close moved from $120.78 to $598.60 (+395.61%) between the first and last records. The series includes different phases; the cumulative change is neither a uniform path nor evidence that it will continue."}</p>
                    </section>
                    <section className="analysis-finding">
                        <span>{es ? "HALLAZGO NUMÉRICO 02" : "NUMERIC FINDING 02"}</span>
                        <h4>{es ? "Los retornos diarios presentan alta dispersión" : "Daily returns have high dispersion"}</h4>
                        <p>{es
                            ? "La desviación estándar fue 4,68% y el percentil 95 de |retorno| fue 9,65%. El movimiento absoluto máximo fue 41,39% el 19 de mayo de 2021. Un promedio aislado no describe bien estos episodios extremos."
                            : "Standard deviation was 4.68%, and the 95th percentile of |return| was 9.65%. The largest absolute move was 41.39% on May 19, 2021. A single average does not describe these extreme episodes well."}</p>
                    </section>
                    <section className="analysis-finding">
                        <span>{es ? "HALLAZGO CATEGÓRICO 01" : "CATEGORICAL FINDING 01"}</span>
                        <h4>{es ? "El retorno medio cambia poco por día" : "Mean return varies little by weekday"}</h4>
                        <p>{es
                            ? "El promedio fue −0,27% el jueves y +0,54% el sábado. Son diferencias pequeñas frente a una dispersión diaria de alrededor de 4–5 puntos porcentuales; por sí solas no sugieren una regla operativa."
                            : "The average was −0.27% on Thursday and +0.54% on Saturday. These differences are small against daily dispersion of about 4–5 percentage points and do not alone suggest an operational rule."}</p>
                    </section>
                    <section className="analysis-finding">
                        <span>{es ? "HALLAZGO CATEGÓRICO 02" : "CATEGORICAL FINDING 02"}</span>
                        <h4>{es ? "No se observa un patrón mensual contundente" : "No clear monthly pattern is visible"}</h4>
                        <p>{es
                            ? "El retorno promedio mensual va de −0,24% en junio a +0,66% en abril, pero la dispersión dentro de cada mes es mucho mayor. El análisis no sostiene que exista estacionalidad mensual."
                            : "Mean monthly return ranges from −0.24% in June to +0.66% in April, but within-month dispersion is much larger. The analysis does not support a monthly seasonal effect."}</p>
                    </section>
                </div>
                <div className="analysis-figure-grid">
                    <figure className="analysis-figure">
                        <img src="/analisis/resumen_eda.png" alt={es ? "Panel EDA con precio de cierre, retornos diarios, promedio móvil de retornos absolutos y volumen reportado" : "EDA panel with closing price, daily returns, moving average of absolute returns, and reported volume"} />
                        <figcaption>{es ? "Figura 1. Precio, variación diaria, movimiento absoluto suavizado y volumen durante el periodo." : "Figure 1. Price, daily change, smoothed absolute move, and volume over the period."}</figcaption>
                    </figure>
                    <figure className="analysis-figure">
                        <img src="/analisis/hallazgos_calendario.png" alt={es ? "Gráficos de retorno promedio agrupado por día de semana y por mes calendario" : "Mean return charts grouped by weekday and calendar month"} />
                        <figcaption>{es ? "Figura 2. Comparación de promedios categóricos; la dispersión diaria es considerablemente mayor." : "Figure 2. Categorical mean comparison; daily dispersion is considerably larger."}</figcaption>
                    </figure>
                </div>
                <div className="analysis-report-actions">
                    <a href="/analisis/cierre_por_anio.csv" download>{es ? "Cambios por año (CSV)" : "Yearly changes (CSV)"}</a>
                    <a href="/analisis/retorno_por_dia_semana.csv" download>{es ? "Tabla por día (CSV)" : "Weekday table (CSV)"}</a>
                    <a href="/analisis/retorno_por_mes.csv" download>{es ? "Tabla por mes (CSV)" : "Monthly table (CSV)"}</a>
                    <a href={files.descriptiveReport} download>{es ? "Informe descriptivo (MD)" : "Descriptive report (MD)"}</a>
                </div>
            </article>

            <article className="analysis-report-stage" id="analisis-diagnostico">
                <div className="analysis-stage-heading">
                    <span className="analysis-stage-number">02 / DIAGNÓSTICO</span>
                    <h3>{es ? "¿Qué podría explicar lo observado?" : "What may explain the observations?"}</h3>
                    <p>{es
                        ? "El dataset incluye precio y volumen reportado, pero no noticias, sentimiento, liquidez, transacciones ni variables macroeconómicas. Por eso analizamos asociaciones internas; no podemos atribuir causas de mercado."
                        : "The dataset contains price and reported volume, but no news, sentiment, liquidity, transactions, or macroeconomic variables. We therefore examine internal associations, not market causes."}</p>
                </div>
                <div className="analysis-prose-grid">
                    <div>
                        <h4>{es ? "Volumen y tamaño del movimiento" : "Volume and move size"}</h4>
                        <p>{es
                            ? "La correlación de rangos entre |retorno diario| y log(1 + volumen) fue Spearman ρ = 0,249 (p < 0,001). El decil superior de volumen promedió 5,10% de retorno absoluto, frente a 2,92% en el resto. Esto es compatible con mayor actividad durante movimientos amplios, pero no demuestra causalidad ni dirección futura."
                            : "The rank correlation between |daily return| and log(1 + volume) was Spearman ρ = 0.249 (p < 0.001). The top volume decile averaged a 5.10% absolute return, versus 2.92% for other days. This is consistent with higher activity during larger moves, but proves neither causation nor future direction."}</p>
                    </div>
                    <div>
                        <h4>{es ? "Categorías del calendario" : "Calendar categories"}</h4>
                        <p>{es
                            ? "Por día de semana, ANOVA dio p = 0,037 y Kruskal–Wallis p = 0,007, antes de corregir comparaciones múltiples. La diferencia es exploratoria y de baja magnitud. Por mes no se detectó diferencia (ANOVA p = 0,855; Kruskal–Wallis p = 0,983)."
                            : "By weekday, ANOVA gave p = 0.037 and Kruskal–Wallis p = 0.007, before multiple-comparison correction. The difference is exploratory and small. No monthly difference was detected (ANOVA p = 0.855; Kruskal–Wallis p = 0.983)."}</p>
                    </div>
                </div>
                <figure className="analysis-figure analysis-figure-wide">
                    <img src="/analisis/volumen_vs_movimiento.png" alt={es ? "Relación entre logaritmo del volumen y retorno absoluto, y comparación de movimientos por decil de volumen" : "Relationship of log volume to absolute returns, and comparison of moves by volume decile"} />
                    <figcaption>{es ? "Figura 3. Los puntos y grupos ilustran asociación estadística, no un efecto causal del volumen sobre el precio." : "Figure 3. Points and groups illustrate a statistical association, not a causal effect of volume on price."}</figcaption>
                </figure>
                <p className="analysis-caveat">{es
                    ? "El corte del decil superior fue volumen ≥ 293.474.314: 328 días, media de |retorno| 5,10% y mediana 3,67%. Los otros 2.949 días promediaron 2,92% (mediana 2,00%). Mann–Whitney U = 633.845; p < 0,001. El volumen es el reportado por la fuente agregada, no un mercado único verificado."
                    : "The top-decile cutoff was volume ≥ 293,474,314: 328 days, mean |return| 5.10%, and median 3.67%. The other 2,949 days averaged 2.92% (median 2.00%). Mann–Whitney U = 633,845; p < 0.001. Volume is the source-reported aggregate, not verified single-market volume."}</p>
                <div className="analysis-table-wrap">
                    <table className="analysis-table">
                        <caption>{es ? "Tabla 1. Contrastes exploratorios" : "Table 1. Exploratory tests"}</caption>
                        <thead><tr><th>{es ? "Relación" : "Relationship"}</th><th>{es ? "Prueba" : "Test"}</th><th>{es ? "Estadístico" : "Statistic"}</th><th>p</th><th>n</th></tr></thead>
                        <tbody>
                            <tr><td>{es ? "Retorno según día de semana" : "Return by weekday"}</td><td>ANOVA</td><td>2,238</td><td>0,0370</td><td>3.277</td></tr>
                            <tr><td>{es ? "Retorno según día de semana" : "Return by weekday"}</td><td>Kruskal–Wallis</td><td>17,563</td><td>0,0074</td><td>3.277</td></tr>
                            <tr><td>{es ? "Retorno según mes" : "Return by month"}</td><td>ANOVA</td><td>0,569</td><td>0,8551</td><td>3.277</td></tr>
                            <tr><td>{es ? "Retorno según mes" : "Return by month"}</td><td>Kruskal–Wallis</td><td>3,467</td><td>0,9830</td><td>3.277</td></tr>
                            <tr><td>{es ? "|Retorno| vs. log(volumen)" : "|Return| vs. log(volume)"}</td><td>Spearman ρ</td><td>0,249</td><td>&lt; 0,001</td><td>3.277</td></tr>
                            <tr><td>{es ? "|Retorno| en decil superior vs. resto" : "|Return| top volume decile vs. rest"}</td><td>Mann–Whitney U</td><td>633.845</td><td>&lt; 0,001</td><td>328 / 2.949</td></tr>
                        </tbody>
                    </table>
                </div>
                <p className="analysis-caveat">{es
                    ? "Interpretación: p-valores pequeños no miden importancia económica. Hay dependencia temporal, colas pesadas y varias pruebas exploratorias; no se corrigió multiplicidad y no se hizo inferencia causal."
                    : "Interpretation: small p-values do not measure economic importance. Returns have temporal dependence and heavy tails, and several exploratory tests were run; no multiplicity correction or causal inference was performed."}</p>
                <div className="analysis-report-actions">
                    <a href="/analisis/pruebas_asociacion.csv" download>{es ? "Descargar pruebas (CSV)" : "Download tests (CSV)"}</a>
                    <a href="/analisis/volumen_y_movimiento.csv" download>{es ? "Descargar grupos (CSV)" : "Download groups (CSV)"}</a>
                    <a href={files.diagnosticReport} download>{es ? "Informe diagnóstico (MD)" : "Diagnostic report (MD)"}</a>
                </div>
            </article>

            <article className="analysis-report-stage" id="analisis-predictivo">
                <div className="analysis-stage-heading">
                    <span className="analysis-stage-number">03 / PREDICTIVO · SERIES DE TIEMPO</span>
                    <h3>{es ? "¿Qué puede anticiparse con el historial?" : "What can the history anticipate?"}</h3>
                    <p>{es
                        ? "Se ordenó la serie por fecha UTC y se reservó el último 20% (656 observaciones) como prueba cronológica, sin barajar. Cada estimación usa solo datos anteriores a su fecha objetivo. Se aplicaron referencias transparentes antes de atribuir valor a modelos complejos."
                        : "The series was sorted by UTC date and the final 20% (656 observations) was held out chronologically, without shuffling. Each estimate uses only data available before its target date. Transparent baselines were evaluated before attributing value to complex models."}</p>
                </div>
                <figure className="analysis-figure analysis-figure-wide">
                    <img src="/analisis/serie_y_corte_temporal.png" alt={es ? "Serie temporal del cierre XMR/USD y línea vertical que marca el inicio del conjunto de prueba cronológico" : "XMR/USD closing-price time series with a vertical line marking the start of the chronological test set"} />
                    <figcaption>{es ? "Figura 4. Corte temporal 80/20: las fechas finales se reservan para evaluar, nunca se mezclan con el entrenamiento." : "Figure 4. 80/20 temporal split: final dates are held out for evaluation and never shuffled into training."}</figcaption>
                </figure>
                <div className="analysis-table-wrap">
                    <table className="analysis-table">
                        <caption>{es ? "Tabla 2. Backtest independiente en el último 20%" : "Table 2. Independent backtest on the final 20%"}</caption>
                        <thead><tr><th>{es ? "Serie / referencia" : "Series / baseline"}</th><th>MAE</th><th>RMSE</th><th>n</th></tr></thead>
                        <tbody>
                            <tr><td>{es ? "Cierre (USD) · persistencia" : "Close (USD) · persistence"}</td><td>9,685 USD</td><td>15,035 USD</td><td>656</td></tr>
                            <tr><td>{es ? "Cierre (USD) · media móvil 7" : "Close (USD) · moving average 7"}</td><td>15,197 USD</td><td>25,017 USD</td><td>656</td></tr>
                            <tr><td>{es ? "Rango diario (%) · media móvil 7" : "Daily range (%) · moving average 7"}</td><td>2,247 pp</td><td>3,550 pp</td><td>656</td></tr>
                            <tr><td>{es ? "log(1 + volumen) · media móvil 7" : "log(1 + volume) · moving average 7"}</td><td>0,201</td><td>0,279</td><td>656</td></tr>
                            <tr><td>{es ? "Retorno diario · media histórica por día" : "Daily return · historical weekday mean"}</td><td>2,662 pp</td><td>3,789 pp</td><td>656</td></tr>
                            <tr><td>{es ? "Retorno mensual · media del mismo mes" : "Monthly return · same-month mean"}</td><td>0,429 pp</td><td>0,545 pp</td><td>22</td></tr>
                            <tr><td>{es ? "Retorno mensual · media global expansiva" : "Monthly return · expanding global mean"}</td><td>0,426 pp</td><td>0,517 pp</td><td>22</td></tr>
                        </tbody>
                    </table>
                </div>
                <div className="analysis-prose-grid">
                    <div>
                        <h4>{es ? "¿Qué dicen los errores?" : "What do the errors tell us?"}</h4>
                        <p>{es
                            ? "La persistencia (mañana igual a hoy) fue mejor que la media móvil para el cierre. El efecto de mes calendario no superó la media global. El MAE expresa error absoluto medio; RMSE penaliza con más peso los errores grandes. En rango y retornos las unidades son puntos porcentuales (pp), no USD."
                            : "Persistence (tomorrow equals today) beat the moving average for closing price. Calendar-month effects did not beat the global mean. MAE is mean absolute error; RMSE gives larger errors more weight. Range and return metrics are percentage points (pp), not USD."}</p>
                    </div>
                    <div>
                        <h4>{es ? "Benchmark de modelos del proyecto" : "Project model benchmark"}</h4>
                        <p>{es
                            ? "En el pipeline existente, la persistencia obtuvo MAE 9,69 USD, ARIMA 9,94, LSTM 9,99 ± 0,06, GRU 10,11 ± 0,24 y media móvil 15,20. La LSTM no superó a persistencia en error de precio. Este benchmark se presenta por separado; el servicio ML y sus artefactos originales no se modificaron."
                            : "In the existing pipeline, persistence had $9.69 MAE, ARIMA $9.94, LSTM $9.99 ± $0.06, GRU $10.11 ± $0.24, and moving average $15.20. LSTM did not beat persistence on price error. This benchmark is shown separately; the ML service and its original artifacts were not changed."}</p>
                    </div>
                </div>
                <p className="analysis-caveat">{es
                    ? "Un único holdout no prueba estabilidad ante cambios de régimen. Estos errores no son rentabilidad de una estrategia: faltan costos, deslizamiento y gestión del riesgo. Las predicciones son experimentales, no asesoría financiera."
                    : "A single holdout does not prove stability across market regimes. These errors are not strategy returns; trading costs, slippage, and risk management are not modeled. Forecasts are experimental, not financial advice."}</p>
                <div className="analysis-report-actions">
                    <a href="/analisis/metricas_backtest.csv" download>{es ? "Métricas del backtest (CSV)" : "Backtest metrics (CSV)"}</a>
                    <a href="/analisis/referencia_siguiente_cierre.csv" download>{es ? "Referencia de cierre siguiente (CSV)" : "Next-close baseline (CSV)"}</a>
                    <a href={files.predictiveReport} download>{es ? "Informe predictivo (MD)" : "Predictive report (MD)"}</a>
                </div>
            </article>

            <article className="analysis-report-stage" id="analisis-prescriptivo">
                <div className="analysis-stage-heading">
                    <span className="analysis-stage-number">04 / PRESCRIPTIVO</span>
                    <h3>{es ? "¿Qué acciones recomienda la evidencia?" : "What actions does the evidence support?"}</h3>
                    <p>{es
                        ? "Las recomendaciones priorizan monitoreo, validación y control de incertidumbre. No convierten correlaciones ni predicciones experimentales en órdenes automáticas."
                        : "Recommendations prioritize monitoring, validation, and uncertainty controls. They do not turn correlations or experimental forecasts into automated orders."}</p>
                </div>
                <div className="analysis-table-wrap">
                    <table className="analysis-table analysis-action-table">
                        <caption>{es ? "Tabla 3. Plan de acción trazable a los hallazgos" : "Table 3. Action plan tied to findings"}</caption>
                        <thead><tr><th>{es ? "Evidencia" : "Evidence"}</th><th>{es ? "Acción propuesta" : "Proposed action"}</th><th>{es ? "Seguimiento y revisión" : "Monitoring and review"}</th></tr></thead>
                        <tbody>
                            <tr>
                                <td>{es ? "Cierre +395,6%; persistencia MAE 9,69 USD" : "Close +395.6%; persistence MAE $9.69"}</td>
                                <td>{es ? "Mantener persistencia como baseline; exigir mejora estable fuera de muestra antes de sustituir el modelo." : "Keep persistence as the baseline; require stable out-of-sample improvement before replacing it."}</td>
                                <td>{es ? "MAE/RMSE en ventanas móviles y varios periodos." : "MAE/RMSE across rolling windows and multiple periods."}</td>
                            </tr>
                            <tr>
                                <td>{es ? "Desv. estándar 4,68%; p95 |retorno| 9,65%" : "Std. dev. 4.68%; p95 |return| 9.65%"}</td>
                                <td>{es ? "Generar alerta de revisión humana si el movimiento diario supera el umbral; verificar el dato." : "Raise a human-review alert when the daily move exceeds the threshold; verify the observation."}</td>
                                <td>{es ? "Medir frecuencia y recalibrar ante cambios de régimen." : "Track frequency and recalibrate after regime shifts."}</td>
                            </tr>
                            <tr>
                                <td>{es ? "ρ volumen–|retorno| = 0,249; top decil 5,10% vs. 2,92%" : "Volume–|return| ρ = 0.249; top decile 5.10% vs. 2.92%"}</td>
                                <td>{es ? "Usar volumen como contexto de magnitud/volatilidad, nunca como señal de dirección del precio." : "Use volume as context for move size/volatility, never as a price-direction signal."}</td>
                                <td>{es ? "Revisar asociación móvil; retirar la regla si pierde estabilidad." : "Monitor rolling association; retire the rule if it loses stability."}</td>
                            </tr>
                            <tr>
                                <td>{es ? "Señal semanal pequeña; efecto mensual no confirmado" : "Small weekday signal; monthly effect unconfirmed"}</td>
                                <td>{es ? "No automatizar decisiones por día o mes; repetir el análisis con ajuste por pruebas múltiples." : "Do not automate by weekday or month; repeat analysis with multiple-test adjustment."}</td>
                                <td>{es ? "Exigir réplica en otra ventana temporal antes de considerarlo." : "Require replication in another time window before considering it."}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <ol className="analysis-next-steps">
                    <li>{es ? "Ampliar el backtest de un corte a ventanas rodantes y documentar cambios de régimen." : "Expand the single-cut backtest to rolling windows and document regime shifts."}</li>
                    <li>{es ? "Incorporar fuentes externas solo con procedencia, marca temporal y licencia verificables." : "Add external sources only with verifiable provenance, timestamps, and licensing."}</li>
                    <li>{es ? "Comunicar incertidumbre y calidad del dato en cada visualización; no inventar granularidad intradía desde datos diarios." : "Communicate uncertainty and data quality in each visualization; do not invent intraday detail from daily data."}</li>
                </ol>
                <div className="analysis-report-actions">
                    <a href="/analisis/matriz_acciones.csv" download>{es ? "Descargar matriz de acciones (CSV)" : "Download action matrix (CSV)"}</a>
                    <a href={files.prescriptiveReport} download>{es ? "Informe prescriptivo (MD)" : "Prescriptive report (MD)"}</a>
                </div>
            </article>

            <footer className="analysis-footer-note">
                {es
                    ? "Fuente: histórico OHLCV diario XMR/USD archivado para este estudio. La copia de trabajo contiene un único hueco diario y no incluye variables externas. Los resultados son académicos y experimentales; no constituyen asesoría financiera."
                    : "Source: archived XMR/USD daily OHLCV history used for this study. The working copy has one missing day and contains no external variables. Results are academic and experimental, not financial advice."}
            </footer>
        </section>
    );
}
