import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const normalizeRole = (role) => {
    const value = String(role || "").trim().toUpperCase();
    if (value === "STUDENT") return "USER";
    return value;
};

const ProtectedRoute = ({ allowedRoles, children }) => {
    const { user, isAuthLoading } = useAuth();

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
                Authenticating session...
            </div>
        );
    }

    if (!user) return <Navigate to="/login" />;

    const role = normalizeRole(user.role);
    const normalizedAllowed = allowedRoles.map(normalizeRole);

    if (!normalizedAllowed.includes(role)) {
        return <Navigate to="/unauthorized" />;
    }

    return children;
};

export default ProtectedRoute;
