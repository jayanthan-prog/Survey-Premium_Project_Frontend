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

export const getAllocations = () => request("/api/allocations", "GET");
export const createAllocation = (data) => request("/api/allocations", "POST", data);
export const updateAllocation = (id, data) => request(`/api/allocations/${id}`, "PUT", data);
export const deleteAllocation = (id) => request(`/api/allocations/${id}`, "DELETE");
