import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const API_BASE = "http://localhost:4000/api";

const Login = () => {
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: id, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login response already contains user object
                const userData = data.user;
                login(userData);
                
                // Navigate based on role
                if (userData.role === "ADMIN") {
                    navigate("/admin");
                }
                else if (userData.role === "APPROVER") {
                    navigate("/approver");
                }
                else {
                    navigate("/student");
                }
            } else {
                toast.error(data.error || "Login failed");
                setError(data.error || "Login failed");
            }
        } catch (err) {
            toast.error("An error occurred during login");
            setError("An error occurred during login");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            setLoading(true);
            setError("");
            
            // Send the credential to your backend for verification
            const response = await fetch(`${API_BASE}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: credentialResponse.credential
                }),
            });

            const data = await response.json();

            if (response.ok) {
                login(data.user);
                if (data.user.role === "ADMIN") {
                    navigate("/admin");
                }
                else if (data.user.role === "APPROVER") {
                    navigate("/approver");
                }
                else {
                    navigate("/student");
                }
            } else {
                toast.error(data.message || "Login failed");
                setError(data.message || "Login failed");
            }
        } catch (err) {
            toast.error("An error occurred during Google login");
            setError("An error occurred during Google login");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        toast.error("Google login was unsuccessful. Please try again.");
        setError("Google login was unsuccessful. Please try again.");
    };

    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
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

                    {/* Google Login Button */}
                    <div className="mt-6">
                        <GoogleLogin
                            onSuccess={handleGoogleLogin}
                            onError={handleGoogleError}
                            useOneTap
                            theme="outline"
                            size="large"
                            text="signin_with"
                            shape="rectangular"
                        />
                    </div>

                    {/* Divider */}
                    <div className="mt-6 flex items-center">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-3 text-sm text-gray-400">or</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleLogin} className="mt-6 space-y-4">

                        {/* USER ID / EMAIL */}
                        <div>
                            <label className="text-sm font-medium text-gray-600">
                                Email
                            </label>

                            <input
                                type="email"
                                placeholder="Enter your email"
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
                        <p>Use Google Sign-In or enter your registered email and password</p>
                        <p>Admin: jayanthan.ei23@bitsathy.ac.in</p>
                    </div>

                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Login;
