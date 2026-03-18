import { apiRequest } from "./api";

export async function getDashboardSummary(token) {
    return apiRequest("/api/auth/dashboard", { token });
}
