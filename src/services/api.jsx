const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://10.150.20.138:4000").replace(/\/$/, "");

let publicIpPromise = null;

async function resolveClientPublicIp() {
    if (publicIpPromise) return publicIpPromise;

    publicIpPromise = (async () => {
        try {
            const response = await fetch("https://api.ipify.org?format=json", { method: "GET" });
            if (!response.ok) return null;
            const payload = await response.json();
            const value = String(payload?.ip || "").trim();
            return value || null;
        } catch (_err) {
            return null;
        }
    })();

    return publicIpPromise;
}

function buildHeaders(token, hasBody, clientPublicIp) {
    const headers = {
        Accept: "application/json",
    };

    if (hasBody) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (clientPublicIp) {
        headers["X-Client-Public-IP"] = clientPublicIp;
    }

    return headers;
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
    const clientPublicIp = await resolveClientPublicIp();

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: buildHeaders(token, body !== undefined, clientPublicIp),
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
