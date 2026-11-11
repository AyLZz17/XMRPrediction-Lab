import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../../../css/style.css";
import "./accessibility.css";
import { PreferencesProvider } from "./preferences";

export const metadata: Metadata = {
    title: "AyLZz Crypto Lab — Monero Intelligence",
    description: "Portal experimental de investigación de mercado y predicciones diarias de Monero.",
    robots: { index: false, follow: false }
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="es">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <PreferencesProvider>{children}</PreferencesProvider>
            </body>
        </html>
    );
}
