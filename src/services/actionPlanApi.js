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

const request = (url, method = "GET", body = undefined) =>
    apiRequest(url, {
        method,
        body,
        token: getToken(),
    });

export const getActionPlans = () => request("/api/action-plans", "GET");
export const createActionPlan = (data) => request("/api/action-plans", "POST", data);
export const updateActionPlan = (id, data) => request(`/api/action-plans/${id}`, "PUT", data);
export const deleteActionPlan = (id) => request(`/api/action-plans/${id}`, "DELETE");
