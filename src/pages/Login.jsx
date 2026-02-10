import { useState } from "react";
import { users } from "../constants/users";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setError("");

        setLoading(true);

        // Fake delay (feels real)
        setTimeout(() => {
            const foundUser = users.find(
                (u) => u.id === id && u.password === password
            );

            if (!foundUser) {
                setError("Invalid User ID or Password");
                setLoading(false);
                return;
            }

            login(foundUser);

            if (foundUser.role === "ADMIN") {
                navigate("/admin/dashboard");
            }
            else if (foundUser.role === "STUDENT") {
                navigate("/student/dashboard");
            }
            else {
                navigate("/approver/dashboard");
            }

        }, 700);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            {/* Card */}
            <div className="bg-white shadow-lg rounded-2xl p-8 w-[380px]">

                {/* Heading */}
                <h1 className="text-3xl font-semibold text-gray-800 text-center">
                    Welcome Back
                </h1>

                <p className="text-gray-500 text-sm text-center mt-2">
                    Login to continue
                </p>

                {/* FORM */}
                <form onSubmit={handleLogin} className="mt-6 space-y-4">

                    {/* USER ID */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            User ID
                        </label>

                        <input
                            type="text"
                            placeholder="Enter your ID"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 
                         focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    {/* PASSWORD */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Password
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 
                           focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-sm text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* ERROR */}
                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    {/* BUTTON */}
                    <button
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 
                       text-white font-medium py-2.5 rounded-lg
                       transition duration-200
                       disabled:opacity-70"
                    >
                        {loading ? "Signing in..." : "Login"}
                    </button>

                </form>

                {/* Demo Credentials */}
                <div className="mt-6 text-xs text-gray-400 text-center">
                    <p>Demo Users:</p>
                    <p>admin123 / student123 / approver123</p>
                </div>

            </div>
        </div>
    );
};

export default Login;
