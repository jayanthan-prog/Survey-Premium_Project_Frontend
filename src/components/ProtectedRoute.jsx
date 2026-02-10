import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles, children }) => {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" />;

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" />;
    }

    return children;
};

export default ProtectedRoute;
