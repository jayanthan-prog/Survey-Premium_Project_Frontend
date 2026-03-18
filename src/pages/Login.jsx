import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { getHomePathByRole, loginRequest, loginWithGoogle } from "../services/authservice";

const Login = () => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await loginRequest({ identifier, password });
            login(result);
            navigate(getHomePathByRole(result?.user?.role), { replace: true });
        } catch (err) {
            setError(err?.message || "Unable to login. Please verify your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError("");
        setLoading(true);
        try {
            const credential = credentialResponse && credentialResponse.credential;
            if (!credential) {
                throw new Error("Google authentication failed. Missing credential token.");
            }
            const result = await loginWithGoogle(credential);
            login(result);
            navigate(getHomePathByRole(result?.user?.role), { replace: true });
        } catch (err) {
            setError(err?.message || "Google login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError("Google login was cancelled or failed. Please try again.");
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
                            placeholder="Enter email or user ID"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
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

                <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs text-gray-400">OR</span>
                    <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="flex justify-center">
                    {googleClientId ? (
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            text="signin_with"
                            shape="pill"
                            size="large"
                            theme="outline"
                            width="320"
                        />
                    ) : (
                        <p className="text-xs text-amber-600 text-center">
                            Google login is disabled. Set VITE_GOOGLE_CLIENT_ID to enable it.
                        </p>
                    )}
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 text-xs text-gray-400 text-center">
                    <p>Use your backend user email or user ID to sign in.</p>
                </div>

            </div>
        </div>
    );
};

export default Login;
