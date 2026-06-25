import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../api/apiError.js";
import { authApi } from "../../api/authApi.js";
import GoogleIcon from "../../components/common/googleicon.jsx";
import Logo from "../../components/common/logo.jsx";
import registerBg from "../../assets/public/registerbg.png";
import { normalizeEmail, validateEmail, validatePassword, validateRequired } from "../../utils/formValidation.js";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const normalizedEmail = normalizeEmail(email);
        const errors = {
            name: validateRequired(name, "Full name"),
            email: validateEmail(normalizedEmail),
            password: validatePassword(password),
            terms: agreeTerms ? "" : "Please agree to the Terms and Privacy Policy.",
        };
        const nextErrors = Object.fromEntries(Object.entries(errors).filter(([, message]) => message));

        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors);
            return;
        }

        try {
            setFieldErrors({});
            setIsSubmitting(true);
            await authApi.signup({ name: name.trim(), email: normalizedEmail, password });
            toast.success("OTP has been sent to your email.");
            navigate("/verify-otp", { state: { email: normalizedEmail } });
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Registration failed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen overflow-hidden bg-background">
            <div className="flex min-h-screen w-full bg-surface-container-lowest">
                <section className="flex w-full flex-col items-center justify-center bg-surface-container-lowest px-lg py-xl lg:w-1/2">
                    <div className="w-full max-w-[420px]">
                        <div className="mb-xl">
                            <Logo mobile />
                        </div>

                        <div className="mb-xl">
                            <p className="mb-sm text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                                Create account
                            </p>
                            <h1 className="mb-xs text-headline-lg font-semibold text-on-surface">
                                Join SmashCourts
                            </h1>
                            <p className="text-body-md text-on-surface-variant">
                                Sign up to book courts, manage schedules, and verify your email with OTP.
                            </p>
                        </div>

                        <form className="space-y-md" onSubmit={handleSubmit}>
                            <div className="space-y-xs">
                                <label className="block text-label-sm text-on-surface-variant" htmlFor="name">
                                    Full name
                                </label>
                                <input
                                    className="h-12 w-full rounded-xl border border-outline-variant bg-surface-bright px-md text-body-md text-on-surface transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                    id="name"
                                    name="name"
                                    onChange={(event) => {
                                        setName(event.target.value);
                                        setFieldErrors((current) => ({ ...current, name: "" }));
                                    }}
                                    placeholder="Nguyen Van A"
                                    required
                                    type="text"
                                    value={name}
                                />
                                {fieldErrors.name && <p className="text-label-xs text-error">{fieldErrors.name}</p>}
                            </div>

                            <div className="space-y-xs">
                                <label className="block text-label-sm text-on-surface-variant" htmlFor="email">
                                    Email address
                                </label>
                                <input
                                    className="h-12 w-full rounded-xl border border-outline-variant bg-surface-bright px-md text-body-md text-on-surface transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                    id="email"
                                    name="email"
                                    onBlur={() => setEmail(normalizeEmail(email))}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setFieldErrors((current) => ({ ...current, email: "" }));
                                    }}
                                    placeholder="name@example.com"
                                    required
                                    type="email"
                                    value={email}
                                />
                                {fieldErrors.email && <p className="text-label-xs text-error">{fieldErrors.email}</p>}
                            </div>

                            <div className="space-y-xs">
                                <label className="block text-label-sm text-on-surface-variant" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        className="h-12 w-full rounded-xl border border-outline-variant bg-surface-bright px-md pr-xl text-body-md text-on-surface transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                        id="password"
                                        name="password"
                                        minLength={8}
                                        onChange={(event) => {
                                            setPassword(event.target.value);
                                            setFieldErrors((current) => ({ ...current, password: "" }));
                                        }}
                                        placeholder="Create a password"
                                        required
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                    />
                                    <button
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-sm top-1/2 flex h-9 min-h-0 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-transparent p-0 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                                        onClick={() => setShowPassword((value) => !value)}
                                        type="button"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {fieldErrors.password && <p className="text-label-xs text-error">{fieldErrors.password}</p>}
                            </div>

                            <label className="flex items-start gap-sm text-label-sm text-on-surface-variant" htmlFor="terms">
                                <input
                                    checked={agreeTerms}
                                    className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                                    id="terms"
                                    onChange={(event) => {
                                        setAgreeTerms(event.target.checked);
                                        setFieldErrors((current) => ({ ...current, terms: "" }));
                                    }}
                                    type="checkbox"
                                />
                                <span>
                                    I agree to the{" "}
                                    <a className="font-semibold text-primary hover:underline" href="#">
                                        Terms
                                    </a>{" "}
                                    and{" "}
                                    <a className="font-semibold text-primary hover:underline" href="#">
                                        Privacy Policy
                                    </a>
                                </span>
                            </label>
                            {fieldErrors.terms && <p className="text-label-xs text-error">{fieldErrors.terms}</p>}

                            <button
                                className="flex h-12 w-full items-center justify-center gap-sm rounded-xl bg-primary px-md font-bold text-on-primary shadow-sm transition-all duration-200 hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
                                disabled={isSubmitting}
                                type="submit"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    "Create account"
                                )}
                            </button>
                        </form>

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

                        <button
                            className="flex h-12 w-full items-center justify-center gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest px-md font-bold text-on-surface transition-all duration-200 hover:bg-surface-container-low active:scale-[0.98]"
                            type="button"
                        >
                            <GoogleIcon />
                            Sign up with Google
                        </button>

                        <p className="mt-xl text-center text-body-md text-on-surface-variant">
                            Already have an account?{" "}
                            <Link className="font-bold text-primary hover:underline" to="/login">
                                Log in
                            </Link>
                        </p>
                    </div>
                </section>

                <section className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-primary-container lg:flex">
                    <img
                        alt="Badminton court"
                        className="absolute inset-0 h-full w-full object-cover"
                        src={registerBg}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />

                    <div className="relative z-10 max-w-[32rem] px-xl text-white">
                        <p className="mb-sm text-label-sm font-semibold uppercase tracking-[0.16em] text-primary-fixed">
                            New season, new court
                        </p>
                        <h2 className="mb-md text-display-lg font-bold tracking-tight">
                            Elevate your game.
                        </h2>
                        <p className="text-body-lg text-white/90">
                            Create your account and get ready to reserve your next badminton session faster.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
