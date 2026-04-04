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

async function requestActionPlansWithFallback(primaryPath, method = "GET", body = undefined) {
    try {
        return await request(primaryPath, method, body);
    } catch (error) {
        if (Number(error?.status) !== 404) throw error;
        const fallbackPath = primaryPath.replace("/api/action-plans", "/api/action_plans");
        return request(fallbackPath, method, body);
    }
}

export const getActionPlans = () => requestActionPlansWithFallback("/api/action-plans", "GET");
export const createActionPlan = (data) => requestActionPlansWithFallback("/api/action-plans", "POST", data);
export const updateActionPlan = (id, data) => requestActionPlansWithFallback(`/api/action-plans/${id}`, "PUT", data);
export const deleteActionPlan = (id) => requestActionPlansWithFallback(`/api/action-plans/${id}`, "DELETE");
