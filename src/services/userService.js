import { apiRequest } from "./api";

export async function listUsers(token, options = {}) {
    const includeInactive = options.includeInactive === true;
    const query = includeInactive ? "?includeInactive=true" : "";
    return apiRequest(`/api/users${query}`, { token });
}

export async function getUserProfile(token, userId) {
    return apiRequest(`/api/users/${userId}`, { token });
}

export async function createUser(token, payload) {
    return apiRequest("/api/users", {
        method: "POST",
        token,
        body: payload,
    });
}

export async function updateUser(token, userId, payload) {
    return apiRequest(`/api/users/${userId}`, {
        method: "PUT",
        token,
        body: payload,
    });
}

export async function deleteUser(token, userId) {
    return apiRequest(`/api/users/${userId}`, {
        method: "DELETE",
        token,
    });
}

export async function getAvailableRoles(token) {
    return apiRequest("/api/roles", { token });
}

export async function assignUserRole(token, userId, role) {
    return apiRequest("/api/user-roles", {
        method: "POST",
        token,
        body: {
            user_id: Number(userId),
            role,
        },
    });
}

export async function removeUserRole(token, userId, role) {
    return apiRequest("/api/user-roles", {
        method: "DELETE",
        token,
        body: {
            user_id: Number(userId),
            role,
        },
    });
}
