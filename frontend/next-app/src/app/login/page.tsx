"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "@frontend-services/http";
import { currentUser, register, signIn } from "@frontend-services/auth";
import { PreferenceControls } from "../components/PreferenceControls";
import { apiErrorMessage, usePreferences } from "../preferences";

export default function LoginPage() {
    const { t } = usePreferences();
    const message = useRef(t);
    message.current = t;
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let active = true;
        currentUser()
            .then(() => {
                if (active) window.location.assign("/dashboard/");
            })
            .catch(reason => {
                if (!active || (reason instanceof ApiError && reason.status === 401)) return;
                console.error("Could not check the current identity session", reason);
                setError(message.current("serviceUnavailable"));
            });
        return () => { active = false; };
    }, []);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        if (mode === "register" && password !== confirmation) {
            setError(t("passwordMismatch"));
            return;
        }

        setBusy(true);
        try {
            if (mode === "register") await register(email.trim(), password);
            else await signIn(email.trim(), password);
            window.location.assign("/dashboard/");
        } catch (reason) {
            console.error("Identity request failed", reason);
            setError(apiErrorMessage(reason, t));
        } finally {
            setBusy(false);
        }
    }

    function switchMode() {
        setMode(current => current === "login" ? "register" : "login");
        setError("");
        setPassword("");
        setConfirmation("");
    }

    const isRegister = mode === "register";

    return (
        <main className="login-page">
            <div className="login-layout">
                <section className="login-visual">
                    <div className="login-brand">
                        <span className="brand-mark" aria-hidden="true">
                            <span></span><span></span><span></span>
                        </span>
                        <span className="brand-copy"><strong>AyLZz</strong><small>{t("brand")}</small></span>
                    </div>
                    <div className="visual-copy">
                        <p className="eyebrow"><span></span>{t("loginEyebrow")}</p>
                        <h1>{t("loginHero")}<br /><em>{t("loginHeroEmphasis")}</em></h1>
                        <p>{t("loginHeroCopy")}</p>
                    </div>
                    <div className="login-chart" aria-hidden="true">
                        <div className="login-chart-head"><span>XMR / USD</span><strong>{t("loginPreview")}</strong></div>
                        <svg viewBox="0 0 700 240">
                            <defs>
                                <linearGradient id="login-fill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0" stopColor="#ff3535" stopOpacity=".32" />
                                    <stop offset="1" stopColor="#ff3535" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path className="login-area" d="M0 190 C55 180 75 205 120 174 S190 142 225 160 S280 125 325 137 S382 96 420 112 S482 73 525 88 S580 36 630 55 S674 22 700 30 V240 H0Z" />
                            <path className="login-line" d="M0 190 C55 180 75 205 120 174 S190 142 225 160 S280 125 325 137 S382 96 420 112 S482 73 525 88 S580 36 630 55 S674 22 700 30" />
                        </svg>
                    </div>
                    <div className="visual-foot"><span>{t("loginFacts")}</span></div>
                </section>

                <section className="login-form-side">
                    <div className="login-preferences"><PreferenceControls /></div>
                    <div className="login-form-wrap">
                        <span className="login-step">{t("accessStep")}</span>
                        <h2>{t("loginTitle")}</h2>
                        <p className="login-intro">{t("loginIntro")}</p>
                        <form onSubmit={submit} aria-busy={busy}>
                            <label htmlFor="account-email">{t("emailLabel")}</label>
                            <input
                                id="account-email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                inputMode="email"
                                maxLength={254}
                                placeholder="nombre@aylzz.lab"
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                                required
                            />
                            <label htmlFor="account-password">{t("passwordLabel")}</label>
                            <input
                                id="account-password"
                                type="password"
                                name="password"
                                autoComplete={isRegister ? "new-password" : "current-password"}
                                minLength={isRegister ? 12 : 1}
                                maxLength={72}
                                value={password}
                                onChange={event => setPassword(event.target.value)}
                                required
                            />
                            {isRegister && (
                                <>
                                    <label htmlFor="account-confirmation">{t("confirmPassword")}</label>
                                    <input
                                        id="account-confirmation"
                                        type="password"
                                        name="confirmation"
                                        autoComplete="new-password"
                                        minLength={12}
                                        maxLength={72}
                                        value={confirmation}
                                        onChange={event => setConfirmation(event.target.value)}
                                        required
                                    />
                                    <p className="accessibility-note">{t("passwordHint")}</p>
                                </>
                            )}
                            <button className={`primary-button login-submit${busy ? " loading" : ""}`} type="submit" disabled={busy}>
                                <span>{busy ? "…" : isRegister ? t("registerButton") : t("loginButton")}</span>
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
                            </button>
                        </form>
                        <p className="login-note" role={error ? "alert" : "status"} aria-live="polite">
                            {error || t("secureSession")}
                        </p>
                        <button className="mode-switch" type="button" onClick={switchMode} disabled={busy}>
                            {isRegister ? t("switchToLogin") : t("switchToRegister")}
                        </button>
                        <div className="login-disclaimer">
                            <span aria-hidden="true">!</span>
                            <p>{t("loginDisclaimer")}</p>
                        </div>
                    </div>
                    <footer>{t("authFooter")}</footer>
                </section>
            </div>
        </main>
    );
}
