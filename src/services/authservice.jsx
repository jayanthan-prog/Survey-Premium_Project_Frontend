import { apiRequest } from "./api";

export const ROLE_HOME_PATH = {
    ADMIN: "/admin/dashboard",
    APPROVER: "/approver/dashboard",
    USER: "/student/dashboard",
    STUDENT: "/student/dashboard",
};

export function getHomePathByRole(role) {
    const normalized = String(role || "").trim().toUpperCase();
    return ROLE_HOME_PATH[normalized] || "/unauthorized";
}

export async function loginRequest({ identifier, password }) {
    const payload = {
        identifier,
        password,
    };
    return apiRequest("/api/auth/login", { method: "POST", body: payload });
}

export async function loginWithGoogle(credential) {
    return apiRequest("/api/auth/google", {
        method: "POST",
        body: { credential },
    });
}

export async function getCurrentUser(token) {
    return apiRequest("/api/auth/me", { token });
}

export async function updateCurrentUser(token, profile) {
    return apiRequest("/api/auth/me", {
        method: "PATCH",
        token,
        body: profile,
    });
}

export async function logoutRequest(token) {
    return apiRequest("/api/auth/logout", {
        method: "POST",
        token,
    });
}
