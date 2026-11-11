export class ApiError extends Error {
    constructor(
        message: string,
        readonly code: string,
        readonly status: number
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export async function requestJson(
    path: string,
    init: RequestInit = {}
): Promise<unknown> {
    const response = await fetch(path, {
        ...init,
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            ...(init.body ? { "Content-Type": "application/json" } : {}),
            ...init.headers
        }
    });

    if (response.status === 204) {
        if (!response.ok) {
            throw new ApiError("service_request_failed", "service_request_failed", response.status);
        }
        return null;
    }

    let payload: unknown = null;
    try {
        payload = await response.json();
    } catch (error) {
        if (response.ok) {
            console.error(`API returned invalid JSON for ${path}`, error);
            throw new ApiError("The service returned an invalid response.", "invalid_response", response.status);
        }
    }

    if (!response.ok) {
        const code = getErrorCode(payload);
        throw new ApiError(code, code, response.status);
    }
    return payload;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorCode(payload: unknown): string {
    if (!isRecord(payload)) return "service_request_failed";
    const code = typeof payload.error === "string"
        ? payload.error
        : typeof payload.detail === "string" ? payload.detail : null;
    return code ?? "service_request_failed";
}
