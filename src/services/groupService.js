import { apiRequest } from "./api";

export async function listGroups(token, options = {}) {
    const includeInactive = options.includeInactive === true;
    const query = includeInactive ? "?includeInactive=true" : "";
    return apiRequest(`/api/groups${query}`, { token });
}

export async function getGroup(token, groupId) {
    return apiRequest(`/api/groups/${groupId}`, { token });
}

export async function createGroup(token, payload) {
    return apiRequest("/api/groups", {
        method: "POST",
        token,
        body: payload,
    });
}

export async function updateGroup(token, groupId, payload) {
    return apiRequest(`/api/groups/${groupId}`, {
        method: "PUT",
        token,
        body: payload,
    });
}

export async function deleteGroup(token, groupId) {
    return apiRequest(`/api/groups/${groupId}`, {
        method: "DELETE",
        token,
    });
}