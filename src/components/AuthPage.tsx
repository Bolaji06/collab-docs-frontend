
import { motion, AnimatePresence } from "framer-motion";
import { GoogleButton } from "./GoogleButton";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { useGoogleLogin } from '@react-oauth/google';
import { useUserStore } from "../store/useUserStore";

export default function AuthPage() {
    const [view, setView] = useState<"signin" | "signup" | "verify">("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { fetchUser } = useUserStore();

    useEffect(() => {
        if (localStorage.getItem("token")) {
            navigate("/");
        }
    }, [navigate]);

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            try {
                const response = await fetch("http://localhost:5000/api/auth/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accessToken: tokenResponse.access_token }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Google login failed");

                localStorage.setItem("token", data.data.accessToken);
                localStorage.setItem("refreshToken", data.data.refreshToken);
                await fetchUser();
                navigate("/");
            } catch (err: any) {
                setError(err.message || "Google auth failed");
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => {
            setError("Google login failed");
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (view === "verify") {
                const response = await fetch("http://localhost:5000/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, otp }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Verification failed");

                localStorage.setItem("token", data.data.accessToken);
                localStorage.setItem("refreshToken", data.data.refreshToken);
                await fetchUser();
                navigate("/");
                return;
            }

            const endpoint = view === "signin" ? "/login" : "/register";
            const body = view === "signin"
                ? { email, password }
                : { email, password, username };

            const response = await fetch(`http://localhost:5000/api/auth${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Authentication failed");
            }

            if (view === "signin") {
                localStorage.setItem("token", data.data.accessToken);
                localStorage.setItem("refreshToken", data.data.refreshToken);
                await fetchUser();
                navigate("/");
            } else {
                setView("verify");
                setError("Code sent to your email!");
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleView = () => {
        setView(view === "signin" ? "signup" : "signin");
        setError(null);
        if (view === "verify") {
            setView("signin");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100 via-gray-50 to-gray-50 dark:from-zinc-800 dark:via-[#121212] dark:to-[#121212] overflow-hidden relative transition-colors duration-300">
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>
            <div className="absolute inset-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05] pointer-events-none"></div>

            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-8 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-2xl shadow-xl dark:shadow-2xl transition-all duration-300"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/20"
                    >
                        <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </motion.div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-zinc-400">
                        {view === "signin" && "Welcome Back"}
                        {view === "signup" && "Create Account"}
                        {view === "verify" && "Verify Email"}
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 mt-2 text-sm">
                        {view === "verify"
                            ? `Enter the code sent to ${email}`
                            : view === "signin"
                                ? "Sign in to access your collaborative docs"
                                : "Join CollabDocs and start collaborating"}
                    </p>
                </div>

                <div className="space-y-4">
                    {view !== "verify" && (
                        <>
                            <GoogleButton onClick={() => handleGoogleLogin()} />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-zinc-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-transparent text-gray-500 dark:text-zinc-500">
                                        Or continue with email
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {view === "signup" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <label
                                        htmlFor="username"
                                        className="block text-sm font-medium text-gray-700 dark:text-zinc-400"
                                    >
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm"
                                        placeholder="johndoe"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {view === "verify" ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <label
                                    htmlFor="otp"
                                    className="block text-sm font-medium text-gray-700 dark:text-zinc-400"
                                >
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm tracking-widest text-center text-lg"
                                    placeholder="••••••••"
                                    maxLength={6}
                                />
                            </motion.div>
                        ) : (
                            <>
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-gray-700 dark:text-zinc-400"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium text-gray-700 dark:text-zinc-400"
                                    >
                                        Password
                                    </label>
                                    <div className="relative mt-1">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="block w-full px-3 py-2 bg-white dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm pr-10"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {view === "signin" && (
                            <div className="flex justify-end">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={`p-3 rounded-lg flex items-start gap-3 text-sm border ${error.includes("sent")
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : "bg-red-500/10 border-red-500/20 text-red-200"
                                    }`}
                            >
                                <div className="mt-0.5 shrink-0">
                                    {error.includes("sent") ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    )}
                                </div>
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading
                                ? "Processing..."
                                : view === "signin"
                                    ? "Sign In"
                                    : view === "signup"
                                        ? "Sign Up"
                                        : "Verify Email"}
                        </motion.button>
                    </form>

                    <div className="text-center text-sm text-zinc-400 mt-4">
                        {view === "verify" ? (
                            <button
                                onClick={() => setView("signin")}
                                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                Back to Sign In
                            </button>
                        ) : (
                            <>
                                {view === "signin" ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    onClick={toggleView}
                                    className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    {view === "signin" ? "Sign up" : "Sign in"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
