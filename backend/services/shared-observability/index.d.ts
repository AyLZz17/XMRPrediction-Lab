export type RouteResolver = (method: string, path: string) => string;

export interface ObservabilityLogger {
    logInfo(message: string): void;
    logError(message: string, error?: unknown): void;
}

export function attachObservability(
    app: object,
    serviceName: string,
    routeResolver?: RouteResolver
): ObservabilityLogger;

export function logInfo(serviceName: string, message: string): void;

export function logError(
    serviceName: string,
    message: string,
    error?: unknown
): void;
