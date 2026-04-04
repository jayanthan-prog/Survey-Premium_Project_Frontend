import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, logoutRequest } from "../services/authservice";

const AuthContext = createContext();

const STORAGE_KEY = "auth.session";

function readStoredSession() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (err) {
        return null;
    }
}

function persistSession(session) {
    if (!session) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function applyThemeFromSessionUser(user) {
    const savedTheme = String(localStorage.getItem("ui.theme") || "").toLowerCase();
    if (savedTheme === "dark" || savedTheme === "light") {
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
        return;
    }

    const theme = String(user?.settings?.theme || "").toLowerCase();
    if (!theme) return;
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("ui.theme", isDark ? "dark" : "light");
}

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(() => readStoredSession());
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const bootstrap = async () => {
            if (!session?.token) {
                if (isMounted) setIsAuthLoading(false);
                return;
            }

            try {
                const meResponse = await getCurrentUser(session.token);
                if (!isMounted) return;

                const nextSession = {
                    ...session,
                    user: meResponse?.user || session.user,
                };

                setSession(nextSession);
                persistSession(nextSession);
                applyThemeFromSessionUser(nextSession.user);
            } catch (err) {
                if (!isMounted) return;
                setSession(null);
                persistSession(null);
            } finally {
                if (isMounted) setIsAuthLoading(false);
            }
        };

        bootstrap();

        return () => {
            isMounted = false;
        };
    }, []);

    const login = (payload) => {
        const nextSession = {
            token: payload.token,
            tokenType: payload.token_type || "bearer",
            expiresAt: payload.expires_at || null,
            user: payload.user,
        };
        setSession(nextSession);
        persistSession(nextSession);
        applyThemeFromSessionUser(nextSession.user);
    };

    const logout = async () => {
        const token = session?.token;
        setSession(null);
        persistSession(null);

        if (token) {
            try {
                await logoutRequest(token);
            } catch (err) {
                // Ignore logout API failures; local session is already cleared.
            }
        }
    };

    const updateSessionUser = (nextUser) => {
        setSession((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, user: nextUser };
            persistSession(updated);
            applyThemeFromSessionUser(nextUser);
            return updated;
        });
    };

    const value = useMemo(
        () => ({
            user: session?.user || null,
            token: session?.token || null,
            isAuthenticated: Boolean(session?.token && session?.user),
            isAuthLoading,
            login,
            logout,
            updateSessionUser,
        }),
        [session, isAuthLoading]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
