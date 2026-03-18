const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");

function buildHeaders(token, hasBody) {
    const headers = {
        Accept: "application/json",
    };

    if (hasBody) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: buildHeaders(token, body !== undefined),
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch (err) {
            data = { message: text };
        }
    }

    if (!response.ok) {
        const error = new Error(data?.error || data?.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

export function getApiBaseUrl() {
    return API_BASE_URL;
}
