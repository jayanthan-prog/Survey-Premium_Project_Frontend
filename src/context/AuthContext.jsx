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
