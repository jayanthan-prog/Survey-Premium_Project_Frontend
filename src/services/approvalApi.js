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

export const getApprovalItems = () => request("/api/approvals/items", "GET");
export const getApprovalWorkflows = () => request("/api/approvals/workflows", "GET");
export const getApprovalSteps = () => request("/api/approvals/steps", "GET");
export const getApprovalActions = () => request("/api/approvals/actions", "GET");

export const updateApprovalItem = (id, data) => request(`/api/approvals/items/${id}`, "PUT", data);
