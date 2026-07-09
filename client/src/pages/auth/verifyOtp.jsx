import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../api/apiError.js";
import { authApi } from "../../api/authApi.js";
import Logo from "../../components/common/logo.jsx";
import { normalizeEmail, validateEmail, validateOtp } from "../../utils/formValidation.js";
import LanguageSwitcher from "../../components/common/LanguageSwitcher.jsx";
import { useI18n } from "../../i18n/I18nProvider.jsx";

const PENDING_SIGNUP_EMAIL_KEY = "badminton_booking_pending_signup_email";

export default function VerifyOtpPage() {
    const { t } = useI18n();
    const [otp, setOtp] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [otpError, setOtpError] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [emailError, setEmailError] = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const queryEmail = new URLSearchParams(location.search).get("email");
    const email = normalizeEmail(location.state?.email || queryEmail || localStorage.getItem(PENDING_SIGNUP_EMAIL_KEY) || emailInput);

    useEffect(() => {
        const persistedEmail = normalizeEmail(location.state?.email || queryEmail || localStorage.getItem(PENDING_SIGNUP_EMAIL_KEY) || "");

        if (persistedEmail) {
            localStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, persistedEmail);
            setEmailInput(persistedEmail);

            if (!queryEmail) {
                navigate(`/verify-otp?email=${encodeURIComponent(persistedEmail)}`, {
                    replace: true,
                    state: { email: persistedEmail },
                });
            }
        }
    }, [location.state, navigate, queryEmail]);

    const handleOtpChange = (event) => {
        setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
        setOtpError("");
    };

    const validateEmailInput = () => {
        const normalizedEmail = normalizeEmail(emailInput);
        const nextEmailError = validateEmail(normalizedEmail, t);

        setEmailInput(normalizedEmail);
        setEmailError(nextEmailError);

        if (!nextEmailError) {
            localStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, normalizedEmail);
            navigate(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`, {
                replace: true,
                state: { email: normalizedEmail },
            });
        }

        return !nextEmailError;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const nextOtpError = validateOtp(otp, t);

        if (!validateEmailInput()) {
            return;
        }

        if (nextOtpError) {
            setOtpError(nextOtpError);
            return;
        }

        try {
            setIsSubmitting(true);
            await authApi.verifySignupOTP({ email, otp });
            localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
            toast.success(t("otp.verified"));
            navigate("/login");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Invalid or expired OTP"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        if (!validateEmailInput()) {
            return;
        }

        try {
            setIsResending(true);
            await authApi.resendSignupOTP({ email });
            toast.success(t("otp.resent"));
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to resend OTP"));
        } finally {
            setIsResending(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center bg-background px-lg py-xl">
            <div className="absolute right-lg top-lg"><LanguageSwitcher /></div>
            <div className="w-full max-w-[440px]">
                <div className="mb-xl flex justify-center">
                    <Logo mobile />
                </div>

                <section className="rounded-xl border border-outline-variant bg-surface-container-lowest px-lg py-xl text-center shadow-sm">
                    <div className="mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low text-primary">
                        <MailCheck size={34} />
                    </div>

                    <p className="mb-sm text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                        {t("otp.label")}
                    </p>
                    <h1 className="mb-sm text-headline-lg font-semibold text-on-surface">
                        {t("otp.title")}
                    </h1>
                    <p className="mb-xl text-body-md text-on-surface-variant">
                        {email ? (
                            <>
                                {t("otp.sentTo", { email })}
                            </>
                        ) : (
                            t("otp.enterEmail")
                        )}
                    </p>

                    <form className="space-y-md" onSubmit={handleSubmit}>
                        <div className="space-y-xs text-left">
                            <label className="block text-label-sm text-on-surface-variant" htmlFor="email">
                                {t("auth.email")}
                            </label>
                            <input
                                className="h-12 w-full rounded-xl border border-outline-variant bg-surface-bright px-md text-body-md text-on-surface transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                id="email"
                                name="email"
                                onBlur={validateEmailInput}
                                onChange={(event) => {
                                    setEmailInput(event.target.value);
                                    setEmailError("");
                                }}
                                placeholder="name@example.com"
                                required
                                type="email"
                                value={emailInput}
                            />
                            {emailError && <p className="text-label-xs text-error">{emailError}</p>}
                        </div>

                        <div className="space-y-xs text-left">
                            <label className="block text-label-sm text-on-surface-variant" htmlFor="otp">
                                {t("otp.code")}
                            </label>
                            <input
                                className="h-14 w-full rounded-xl border border-outline-variant bg-surface-bright px-md text-center text-[22px] font-bold tracking-[0.45em] text-on-surface transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                id="otp"
                                inputMode="numeric"
                                maxLength={6}
                                name="otp"
                                onChange={handleOtpChange}
                                pattern="[0-9]{6}"
                                placeholder="123456"
                                required
                                type="text"
                                value={otp}
                            />
                            {otpError && <p className="text-label-xs text-error">{otpError}</p>}
                        </div>

                        <button
                            className="flex h-12 w-full items-center justify-center mb-lg gap-sm rounded-xl bg-primary px-md font-bold text-on-primary shadow-sm transition-all duration-200 hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
                            disabled={isSubmitting || otp.length !== 6}
                            type="submit"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    <span>{t("otp.verifying")}</span>
                                </>
                            ) : (
                                t("otp.verify")
                            )}
                        </button>
                    </form>

                    <p className="mt-xl mb-lg text-body-md text-on-surface-variant">
                        {t("otp.noCode")}{" "}
                        <button
                            className="min-h-0 bg-transparent p-0 font-bold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isResending}
                            onClick={handleResendOtp}
                            type="button"
                        >
                            {isResending ? t("otp.sending") : t("otp.resend")}
                        </button>
                    </p>
                    <p className="mt-lg text-center text-label-sm text-on-surface-variant">
                        {t("otp.wrongEmail")}{" "}
                        <Link className="font-bold text-primary hover:underline" to="/register">
                            {t("otp.createAgain")}
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}
