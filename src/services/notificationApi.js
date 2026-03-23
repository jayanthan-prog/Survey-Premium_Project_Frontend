import { apiRequest } from "./api";

const AUTH_STORAGE_KEY = "auth.session";

function getToken() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.token || null;
    } catch (_err) {
        return null;
    }
}

function request(path, method = "GET", body = undefined) {
    return apiRequest(path, {
        method,
        body,
        token: getToken(),
    });
}

export function getMyNotifications({ limit = 10, onlyUnread = false } = {}) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (onlyUnread) params.set("onlyUnread", "true");
    return request(`/api/notifications/me?${params.toString()}`, "GET");
}

export function markNotificationAsRead(notificationId) {
    return request(`/api/notifications/me/${notificationId}/read`, "POST");
}

export function markAllNotificationsAsRead() {
    return request("/api/notifications/me/read-all", "POST");
}
