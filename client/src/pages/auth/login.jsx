import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider.jsx";
import GoogleIcon from "../../components/common/googleicon.jsx";
import Logo from "../../components/common/logo.jsx";
import loginBg from "../../assets/public/loginbg.png";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const { login, isLoggingIn } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const fromLocation = location.state?.from;
    const fromPath = fromLocation
        ? `${fromLocation.pathname}${fromLocation.search || ""}${fromLocation.hash || ""}`
        : "/";
    const authRoutes = new Set(["/login", "/register", "/verify-otp"]);
    const from = authRoutes.has(fromLocation?.pathname) ? "/" : fromPath;

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            await login({ email, password });
            navigate(from, { replace: true });
        } catch (error) {
            console.error("Login Error:", error);
        }
    };

    return (
        <main className="min-h-screen overflow-hidden bg-background">
            <div className="flex min-h-screen w-full bg-surface-container-lowest">
                <section className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-primary-container lg:flex">
                    <img
                        src={loginBg}
                        alt="Badminton court"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

                    <div className="absolute left-lg top-lg z-10">
                        <Logo />
                    </div>

                    <div className="relative z-10 max-w-[32rem] px-xl text-white">
                        <p className="mb-sm text-label-sm font-semibold uppercase tracking-[0.16em] text-primary-fixed">
                            Badminton Booking
                        </p>
                        <h1 className="mb-md text-display-lg font-bold tracking-tight">
                            Master the Court.
                        </h1>
                        <p className="text-body-lg text-white/90">
                            Book courts, manage your schedule, and keep every badminton session in one place.
                        </p>
                    </div>
                </section>

                <section className="flex w-full flex-col items-center justify-center bg-surface-container-lowest px-lg py-xl lg:w-1/2">
                    <div className="mb-xl lg:hidden">
                        <Logo mobile />
                    </div>

                    <div className="w-full max-w-[400px]">
                        <div className="mb-xl text-center lg:text-left">
                            <p className="mb-sm text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                                Welcome back
                            </p>
                            <h2 className="mb-xs text-headline-lg font-semibold text-on-surface">
                                Log in to your account
                            </h2>
                            <p className="text-body-md text-on-surface-variant">
                                Manage your bookings and upcoming play sessions.
                            </p>
                        </div>

                        <form className="space-y-md" onSubmit={handleSubmit}>
                            <div className="space-y-xs">
                                <label className="block text-label-sm text-on-surface-variant" htmlFor="email">
                                    Email address
                                </label>
                                <input
                                    className="h-12 w-full rounded-xl border border-outline-variant bg-surface-bright px-md text-body-md text-on-surface transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                    id="email"
                                    name="email"
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="name@example.com"
                                    required
                                    type="email"
                                    value={email}
                                />
                            </div>

                            <div className="space-y-xs">
                                <div className="flex items-center justify-between gap-md">
                                    <label className="block text-label-sm text-on-surface-variant" htmlFor="password">
                                        Password
                                    </label>
                                    {/* <a className="text-label-sm font-semibold text-primary transition-all hover:underline" href="#">
                                        Forgot password?
                                    </a> */}
                                </div>

                                <div className="relative">
                                    <input
                                        className="h-12 w-full rounded-xl border border-outline-variant bg-surface-bright px-md pr-xl text-body-md text-on-surface transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                        id="password"
                                        name="password"
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                    />
                                    <button
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-sm top-1/2 h-9 min-h-0 w-9 -translate-y-1/2 rounded-lg bg-transparent p-0 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                                        onClick={() => setShowPassword((value) => !value)}
                                        type="button"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <label className="flex items-center gap-sm text-label-sm text-on-surface-variant" htmlFor="remember">
                                <input
                                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                                    id="remember"
                                    type="checkbox"
                                />
                                Remember me for 30 days
                            </label>

                            <button
                                className="flex h-12 w-full items-center justify-center gap-sm rounded-xl bg-primary px-md font-bold text-white shadow-sm transition-all duration-200 hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
                                disabled={isLoggingIn}
                                type="submit"
                            >
                                {isLoggingIn ? (
                                    <>
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    "Log in"
                                )}
                            </button>

                            <div className="relative py-md">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-outline-variant" />
                                </div>
                                <div className="relative flex justify-center text-label-xs uppercase">
                                    <span className="bg-surface-container-lowest px-md text-on-surface-variant">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            {/* incoming... */}
                            <button
                                className="flex h-12 w-full items-center justify-center gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest px-md font-bold text-on-surface transition-all duration-200 hover:bg-surface-container-low active:scale-[0.98]"
                                type="button"
                            >
                                <GoogleIcon />
                                Continue with Google
                            </button>
                        </form>

                        <p className="mt-xl text-center text-body-md text-on-surface-variant">
                            Don&apos;t have an account?{" "}
                            <Link className="font-bold text-primary hover:underline" to="/register">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
