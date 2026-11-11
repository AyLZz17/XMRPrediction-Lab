"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode
} from "react";

type Language = "es" | "en";
type FontScale = "normal" | "large";

const translations = {
    es: {
        language: "Idioma",
        spanish: "Español",
        english: "Inglés",
        contrast: "Activar alto contraste",
        normalContrast: "Desactivar alto contraste",
        largerText: "Aumentar tamaño del texto",
        normalText: "Restablecer tamaño del texto",
        localTime: "Zona horaria local",
        accessLabel: "Preferencias de accesibilidad",
        brand: "CRYPTO LAB",
        loginEyebrow: "INTELIGENCIA DE MONERO",
        loginHero: "Analiza el mercado.",
        loginHeroEmphasis: "Cuestiona el modelo.",
        loginHeroCopy: "Un espacio experimental para visualizar XMR-USD y comparar predicciones de series de tiempo con resultados reproducibles.",
        loginPreview: "VISTA PREVIA",
        loginFacts: "DATOS DIARIOS · 5 MODELOS · HORIZONTE 1 DÍA",
        accessStep: "ACCESO AL LABORATORIO / 01",
        loginTitle: "Bienvenido al laboratorio",
        loginIntro: "Inicia sesión o crea una cuenta para explorar datos y resultados experimentales.",
        secureSession: "La sesión se administra con una cookie segura HttpOnly.",
        emailLabel: "CORREO ELECTRÓNICO",
        passwordLabel: "CONTRASEÑA",
        confirmPassword: "CONFIRMAR CONTRASEÑA",
        loginButton: "Iniciar sesión",
        registerButton: "Crear cuenta",
        switchToRegister: "¿Nuevo en el laboratorio? Regístrate",
        switchToLogin: "¿Ya tienes una cuenta? Inicia sesión",
        passwordHint: "Usa al menos 12 caracteres.",
        loginDisclaimer: "Proyecto académico. Las visualizaciones y predicciones no constituyen asesoría financiera.",
        authFooter: "AYLZZ · SISTEMAS INTELIGENTES · 2026",
        authRequired: "Inicia sesión para continuar.",
        invalidCredentials: "El correo o la contraseña no son correctos.",
        duplicateEmail: "Ya existe una cuenta con ese correo.",
        invalidPassword: "La contraseña no cumple los requisitos.",
        invalidRequest: "Revisa los datos ingresados e inténtalo de nuevo.",
        tooManyRequests: "Demasiados intentos. Espera antes de volver a intentarlo.",
        serviceUnavailable: "El servicio no está disponible. Inténtalo más tarde.",
        unexpectedError: "No se pudo completar la solicitud. Inténtalo de nuevo.",
        passwordMismatch: "Las contraseñas no coinciden.",
        dashboardLoading: "Comprobando la sesión…",
        dashboardTitle: "Laboratorio Monero",
        breadcrumb: "AYLZZ / INTELIGENCIA DE MERCADO",
        platform: "PLATAFORMA",
        overview: "Resumen",
        market: "Mercado XMR",
        prediction: "Predicción",
        compareModels: "Comparar modelos",
        methodology: "Metodología",
        research: "INVESTIGACIÓN",
        results: "Resultados",
        exportMetrics: "Exportar métricas",
        datasetValidated: "Datos del proveedor",
        observations: "observaciones · XMR-USD",
        academicPrototype: "PROTOTIPO ACADÉMICO · 2026",
        connected: "SERVICIO ACTIVO",
        connecting: "CONECTANDO",
        disconnected: "SIN CONEXIÓN",
        analyzing: "ANALIZANDO",
        refreshData: "Actualizar datos",
        investigator: "Investigador",
        signOut: "Cerrar sesión",
        heroEyebrow: "SISTEMA EXPERIMENTAL DE PREDICCIÓN",
        heroTitle: "Decisiones más claras para un mercado",
        heroTitleEmphasis: "impredecible.",
        heroCopy: "Explora el historial de Monero, compara cinco modelos y analiza escenarios diarios con evidencia reproducible.",
        horizon: "HORIZONTE",
        oneDay: "1 día",
        pair: "PAR",
        dailyMarket: "MERCADO XMR · HISTÓRICO OHLCV REAL",
        ticker: "Resumen de mercado",
        monero: "MONERO",
        latestHigh: "ÚLTIMO MÁXIMO",
        latestLow: "ÚLTIMO MÍNIMO",
        observationCount: "OBSERVACIONES",
        latestData: "ÚLTIMO DATO",
        candles: "Velas",
        line: "Línea",
        price: "Precio",
        sma9: "SMA 9",
        volumeSma9: "Vol. SMA 9",
        interval: "Intervalo diario",
        noCandles: "No hay velas disponibles.",
        loadingMarket: "Cargando OHLCV desde el servicio de mercado…",
        dailyOnly: "El proveedor actual solo dispone de datos diarios; no se generan intervalos intradía.",
        experimental: "EXPERIMENTAL",
        predictionChartTitle: "Histórico y próximo cierre",
        observedClose: "Cierre observado",
        estimate: "Estimación",
        nextClose: "Próximo cierre",
        scenarioLab: "LABORATORIO DE ESCENARIOS",
        activeModel: "MODELO ACTIVO",
        estimatedScenario: "ESCENARIO ESTIMADO",
        runPrediction: "Predecir cierre",
        trainingNotice: "El primer entrenamiento de algunos modelos puede tardar varios minutos. La predicción solo inicia cuando la solicitas.",
        noPrediction: "Ejecuta un análisis para estimar el próximo cierre.",
        directionAccuracy: "Acierto direccional de prueba",
        maeTest: "MAE (prueba)",
        mapeTest: "MAPE (prueba)",
        window: "Ventana",
        seed: "Semilla",
        bestMae: "MEJOR MAE",
        chronologicalTest: "PRUEBA CRONOLÓGICA",
        days: "días",
        historicalShare: "Mismo conjunto de prueba",
        historicalTestSplit: "del histórico total",
        bestDirection: "MEJOR DIRECCIÓN",
        evaluatedModels: "MODELOS EVALUADOS",
        benchmark: "BENCHMARK REPRODUCIBLE",
        modelComparison: "Comparación de modelos",
        lowerError: "Menor error es mejor. El conjunto de prueba es común a los modelos.",
        updatedAt: "Benchmark actualizado",
        pendingBenchmark: "Benchmark pendiente de generar",
        rank: "RANK",
        model: "MODELO",
        mae: "MAE",
        rmse: "RMSE",
        mape: "MAPE",
        direction: "DIRECCIÓN",
        noMetrics: "No hay métricas de evaluación disponibles.",
        persistenceNote: "La persistencia predice cambio cero; su señal direccional no es interpretable.",
        protocol: "TRAZABILIDAD DEL EXPERIMENTO",
        methodologyTitle: "Cómo se construyó el análisis",
        methodologyCopy: "Un protocolo diseñado para evitar fuga de información y comparaciones engañosas.",
        historicalData: "Datos históricos",
        historicalCopy: "Histórico diario XMR-USD representado en velas OHLCV.",
        temporalSplit: "Split temporal",
        temporalCopy: "80% entrenamiento y 20% prueba, respetando el orden cronológico.",
        fiveModels: "Cinco modelos",
        fiveModelsCopy: "Persistencia, media móvil, ARIMA, LSTM y GRU.",
        honestEvaluation: "Evaluación honesta",
        honestCopy: "MAE, RMSE, MAPE y acierto direccional en el mismo conjunto de prueba.",
        responsibleReading: "LECTURA RESPONSABLE",
        predictionIsNotPromise: "Predecir no es prometer.",
        responsibleCopy: "Las métricas de error no equivalen a rentabilidad. El estudio no contempla costos de transacción, deslizamiento ni eventos externos.",
        reviewResults: "Revisar resultados",
        footerPortal: "Portal de investigación · Monero XMR-USD",
        loadedAt: "Actualizado",
        requestFailed: "Error del servicio",
        predictionQueued: "Descargando cotizaciones y preparando el análisis; el primer entrenamiento puede tardar varios minutos.",
        exportFailed: "No se pudo exportar el informe.",
        serviceError: "No se pudo cargar el panel.",
        openNavigation: "Abrir navegación",
        closeNavigation: "Cerrar navegación",
        chartType: "Tipo de gráfico",
        dailyRange: "Rango diario",
        technicalIndicators: "Indicadores técnicos",
        metric: "Métrica"
    },
    en: {
        language: "Language",
        spanish: "Spanish",
        english: "English",
        contrast: "Enable high contrast",
        normalContrast: "Disable high contrast",
        largerText: "Increase text size",
        normalText: "Reset text size",
        localTime: "Local time zone",
        accessLabel: "Accessibility preferences",
        brand: "CRYPTO LAB",
        loginEyebrow: "MONERO INTELLIGENCE",
        loginHero: "Analyze the market.",
        loginHeroEmphasis: "Question the model.",
        loginHeroCopy: "An experimental space to explore XMR-USD and compare time-series forecasts with reproducible results.",
        loginPreview: "PREVIEW",
        loginFacts: "DAILY DATA · 5 MODELS · 1-DAY HORIZON",
        accessStep: "LAB ACCESS / 01",
        loginTitle: "Welcome to the lab",
        loginIntro: "Sign in or create an account to explore data and experimental results.",
        secureSession: "Your session is managed by a secure HttpOnly cookie.",
        emailLabel: "EMAIL ADDRESS",
        passwordLabel: "PASSWORD",
        confirmPassword: "CONFIRM PASSWORD",
        loginButton: "Sign in",
        registerButton: "Create account",
        switchToRegister: "New to the lab? Create an account",
        switchToLogin: "Already have an account? Sign in",
        passwordHint: "Use at least 12 characters.",
        loginDisclaimer: "Academic project. Charts and predictions are not financial advice.",
        authFooter: "AYLZZ · INTELLIGENT SYSTEMS · 2026",
        authRequired: "Sign in to continue.",
        invalidCredentials: "The email or password is incorrect.",
        duplicateEmail: "An account with this email already exists.",
        invalidPassword: "The password does not meet the requirements.",
        invalidRequest: "Check your details and try again.",
        tooManyRequests: "Too many attempts. Wait before trying again.",
        serviceUnavailable: "The service is unavailable. Try again later.",
        unexpectedError: "The request could not be completed. Try again.",
        passwordMismatch: "Passwords do not match.",
        dashboardLoading: "Checking your session…",
        dashboardTitle: "Monero Lab",
        breadcrumb: "AYLZZ / MARKET INTELLIGENCE",
        platform: "PLATFORM",
        overview: "Overview",
        market: "XMR market",
        prediction: "Prediction",
        compareModels: "Compare models",
        methodology: "Methodology",
        research: "RESEARCH",
        results: "Results",
        exportMetrics: "Export metrics",
        datasetValidated: "Provider data",
        observations: "observations · XMR-USD",
        academicPrototype: "ACADEMIC PROTOTYPE · 2026",
        connected: "SERVICE ACTIVE",
        connecting: "CONNECTING",
        disconnected: "DISCONNECTED",
        analyzing: "ANALYZING",
        refreshData: "Refresh data",
        investigator: "Researcher",
        signOut: "Sign out",
        heroEyebrow: "EXPERIMENTAL PREDICTION SYSTEM",
        heroTitle: "Clearer decisions in an",
        heroTitleEmphasis: "unpredictable market.",
        heroCopy: "Explore Monero history, compare five models, and review daily scenarios with reproducible evidence.",
        horizon: "HORIZON",
        oneDay: "1 day",
        pair: "PAIR",
        dailyMarket: "XMR MARKET · REAL OHLCV HISTORY",
        ticker: "Market summary",
        monero: "MONERO",
        latestHigh: "LATEST HIGH",
        latestLow: "LATEST LOW",
        observationCount: "OBSERVATIONS",
        latestData: "LATEST DATA",
        candles: "Candles",
        line: "Line",
        price: "Price",
        sma9: "SMA 9",
        volumeSma9: "Vol. SMA 9",
        interval: "Daily interval",
        noCandles: "No candles are available.",
        loadingMarket: "Loading OHLCV from the market service…",
        dailyOnly: "The current provider only supplies daily data; no intraday intervals are generated.",
        experimental: "EXPERIMENTAL",
        predictionChartTitle: "History and next close",
        observedClose: "Observed close",
        estimate: "Estimate",
        nextClose: "Next close",
        scenarioLab: "SCENARIO LAB",
        activeModel: "ACTIVE MODEL",
        estimatedScenario: "ESTIMATED SCENARIO",
        runPrediction: "Run prediction",
        trainingNotice: "Initial training for some models can take several minutes. A prediction only starts when you request it.",
        noPrediction: "Run an analysis to estimate the next close.",
        directionAccuracy: "Test directional accuracy",
        maeTest: "MAE (test)",
        mapeTest: "MAPE (test)",
        window: "Window",
        seed: "Seed",
        bestMae: "BEST MAE",
        chronologicalTest: "CHRONOLOGICAL TEST",
        days: "days",
        historicalShare: "Shared test set",
        historicalTestSplit: "of the total history",
        bestDirection: "BEST DIRECTION",
        evaluatedModels: "MODELS EVALUATED",
        benchmark: "REPRODUCIBLE BENCHMARK",
        modelComparison: "Model comparison",
        lowerError: "Lower error is better. Models share the same test set.",
        updatedAt: "Benchmark updated",
        pendingBenchmark: "Benchmark has not been generated",
        rank: "RANK",
        model: "MODEL",
        mae: "MAE",
        rmse: "RMSE",
        mape: "MAPE",
        direction: "DIRECTION",
        noMetrics: "No evaluation metrics are available.",
        persistenceNote: "Persistence predicts zero change; its directional signal is not interpretable.",
        protocol: "EXPERIMENT TRACEABILITY",
        methodologyTitle: "How the analysis was built",
        methodologyCopy: "A protocol designed to avoid information leakage and misleading comparisons.",
        historicalData: "Historical data",
        historicalCopy: "Daily XMR-USD history represented as OHLCV candles.",
        temporalSplit: "Temporal split",
        temporalCopy: "80% training and 20% test, preserving chronological order.",
        fiveModels: "Five models",
        fiveModelsCopy: "Persistence, moving average, ARIMA, LSTM, and GRU.",
        honestEvaluation: "Honest evaluation",
        honestCopy: "MAE, RMSE, MAPE, and directional accuracy on the same test set.",
        responsibleReading: "RESPONSIBLE READING",
        predictionIsNotPromise: "A prediction is not a promise.",
        responsibleCopy: "Error metrics are not equivalent to profitability. The study excludes transaction costs, slippage, and external events.",
        reviewResults: "Review results",
        footerPortal: "Research portal · Monero XMR-USD",
        loadedAt: "Updated",
        requestFailed: "Service error",
        predictionQueued: "Downloading quotes and preparing the analysis; initial training can take several minutes.",
        exportFailed: "The report could not be exported.",
        serviceError: "The dashboard could not be loaded.",
        openNavigation: "Open navigation",
        closeNavigation: "Close navigation",
        chartType: "Chart type",
        dailyRange: "Daily date range",
        technicalIndicators: "Technical indicators",
        metric: "Metric"
    }
} as const;

type TranslationKey = keyof typeof translations.es;

interface PreferencesValue {
    language: Language;
    fontScale: FontScale;
    highContrast: boolean;
    localTimeZone: string;
    setLanguage(language: Language): void;
    toggleFontScale(): void;
    toggleContrast(): void;
    t(key: TranslationKey): string;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);
const storageKey = "aylzz-accessibility-preferences";

export function PreferencesProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("es");
    const [fontScale, setFontScale] = useState<FontScale>("normal");
    const [highContrast, setHighContrast] = useState(false);
    const [localTimeZone, setLocalTimeZone] = useState("Local");
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setLocalTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "Local");
        try {
            const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "null");
            if (saved && typeof saved === "object") {
                const preferences = saved as Record<string, unknown>;
                if (preferences.language === "es" || preferences.language === "en") {
                    setLanguage(preferences.language);
                }
                if (preferences.fontScale === "normal" || preferences.fontScale === "large") {
                    setFontScale(preferences.fontScale);
                }
                if (typeof preferences.highContrast === "boolean") {
                    setHighContrast(preferences.highContrast);
                }
            }
        } catch (error) {
            console.error("Could not restore accessibility preferences", error);
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dataset.fontScale = fontScale;
        document.documentElement.dataset.contrast = highContrast ? "high" : "normal";
        if (!hydrated) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify({ language, fontScale, highContrast }));
        } catch (error) {
            console.error("Could not save accessibility preferences", error);
        }
    }, [fontScale, highContrast, hydrated, language]);

    const value = useMemo<PreferencesValue>(() => ({
        language,
        fontScale,
        highContrast,
        localTimeZone,
        setLanguage,
        toggleFontScale: () => setFontScale(current => current === "normal" ? "large" : "normal"),
        toggleContrast: () => setHighContrast(current => !current),
        t: key => translations[language][key]
    }), [fontScale, highContrast, language, localTimeZone]);

    return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
    const value = useContext(PreferencesContext);
    if (!value) throw new Error("usePreferences must be used inside PreferencesProvider.");
    return value;
}

export function apiErrorMessage(error: unknown, t: PreferencesValue["t"]): string {
    const code = error instanceof Error ? error.message : "";
    switch (code) {
        case "invalid_credentials": return t("invalidCredentials");
        case "email_already_registered": return t("duplicateEmail");
        case "invalid_password": return t("invalidPassword");
        case "invalid_request": return t("invalidRequest");
        case "too_many_requests": return t("tooManyRequests");
        case "rate_limit_unavailable":
        case "upstream_unavailable":
        case "service_request_failed": return t("serviceUnavailable");
        default: return t("unexpectedError");
    }
}
