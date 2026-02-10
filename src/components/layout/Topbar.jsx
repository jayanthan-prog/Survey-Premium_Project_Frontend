import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Topbar = ({ setIsOpen }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="h-16 bg-white border-b flex items-center justify-between px-6">

            {/* Hamburger */}
            <button
                className="md:hidden text-2xl"
                onClick={() => setIsOpen(true)}
            >
                ☰
            </button>

            <h2 className="text-lg font-semibold text-gray-700">
                Dashboard
            </h2>

            <div className="flex items-center gap-4">
                <span className="text-gray-600 text-sm">
                    {user?.role}
                </span>

                <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Topbar;
