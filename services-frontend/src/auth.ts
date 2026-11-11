import { isRecord, requestJson } from "./http";

export interface AuthUser {
    id: string;
    email: string;
}

interface AuthResponse {
    user: AuthUser;
    expiresInSeconds: number;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
    const payload = await requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
    return parseAuthResponse(payload).user;
}

export async function register(email: string, password: string): Promise<AuthUser> {
    const payload = await requestJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
    return parseAuthResponse(payload).user;
}

export async function currentUser(): Promise<AuthUser> {
    const payload = await requestJson("/api/auth/me");
    if (!isRecord(payload) || !isRecord(payload.user)) {
        throw new Error("The identity service returned an invalid user.");
    }
    return parseUser(payload.user);
}

export async function signOut(): Promise<void> {
    await requestJson("/api/auth/logout", { method: "POST" });
}

function parseAuthResponse(payload: unknown): AuthResponse {
    if (!isRecord(payload) || !isRecord(payload.user)
        || typeof payload.expiresInSeconds !== "number"
        || !Number.isFinite(payload.expiresInSeconds)) {
        throw new Error("The identity service returned an invalid response.");
    }
    return { user: parseUser(payload.user), expiresInSeconds: payload.expiresInSeconds };
}

function parseUser(value: Record<string, unknown>): AuthUser {
    if (typeof value.id !== "string" || typeof value.email !== "string") {
        throw new Error("The identity service returned an invalid user.");
    }
    return { id: value.id, email: value.email };
}
