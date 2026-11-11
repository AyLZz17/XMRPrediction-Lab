"use client";

import { usePreferences } from "../preferences";

export function PreferenceControls({ compact = false }: { compact?: boolean }) {
    const {
        language,
        highContrast,
        fontScale,
        localTimeZone,
        setLanguage,
        toggleContrast,
        toggleFontScale,
        t
    } = usePreferences();

    return (
        <div className={`preference-controls${compact ? " compact" : ""}`} aria-label={t("accessLabel")}>
            <label>
                <span className="sr-only">{t("language")}</span>
                <select
                    value={language}
                    onChange={event => setLanguage(event.target.value === "en" ? "en" : "es")}
                    aria-label={t("language")}
                >
                    <option value="es">{t("spanish")}</option>
                    <option value="en">{t("english")}</option>
                </select>
            </label>
            <button
                type="button"
                onClick={toggleFontScale}
                aria-label={fontScale === "normal" ? t("largerText") : t("normalText")}
                aria-pressed={fontScale === "large"}
                title={fontScale === "normal" ? t("largerText") : t("normalText")}
            >
                A<span aria-hidden="true">{fontScale === "normal" ? "+" : "−"}</span>
            </button>
            <button
                type="button"
                onClick={toggleContrast}
                aria-label={highContrast ? t("normalContrast") : t("contrast")}
                aria-pressed={highContrast}
                title={highContrast ? t("normalContrast") : t("contrast")}
            >
                ◐
            </button>
            <span className="local-time-zone" title={localTimeZone}>
                {t("localTime")}: {localTimeZone}
            </span>
        </div>
    );
}
