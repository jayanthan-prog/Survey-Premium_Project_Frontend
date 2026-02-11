import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    // 🔥 Load user from localStorage initially
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem("user");
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.warn("Failed to parse user from localStorage, clearing corrupted data:", error);
            localStorage.removeItem("user");
            return null;
        }
    });

    // 🔥 Login
    const login = (userData) => {
        try {
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error("Failed to save user to localStorage:", error);
        }
    };

    // 🔥 Logout
    const logout = () => {
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
