import { apiRequest } from "./api";

const AUTH_STORAGE_KEY = "auth.session";

function getToken() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.token || null;
    } catch {
        return null;
    }
}

function toQueryString(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        search.set(key, String(value));
    });
    const query = search.toString();
    return query ? `?${query}` : "";
}

export function fetchAuditLogs(params = {}) {
    return apiRequest(`/api/audit-logs${toQueryString(params)}`, {
        method: "GET",
        token: getToken(),
    });
}

export function createAuditLog(payload) {
    return apiRequest("/api/audit-logs", {
        method: "POST",
        body: payload,
        token: getToken(),
    });
}
