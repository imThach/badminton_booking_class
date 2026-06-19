import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authApi } from "../../api/authApi.js";
import Logo from "../../components/common/logo.jsx";

export default function VerifyOtpPage() {
    const [otp, setOtp] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate("/register", { replace: true });
        }
    }, [email, navigate]);

    const handleOtpChange = (event) => {
        setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            await authApi.verifySignupOTP({ email, otp });
            toast.success("Account verified successfully. Please log in.");
            navigate("/login");
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setIsResending(true);
            await authApi.resendSignupOTP({ email });
            toast.success("A new OTP has been sent to your email.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resend OTP");
        } finally {
            setIsResending(false);
        }
    };

    if (!email) {
        return null;
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-lg py-xl">
            <div className="w-full max-w-[440px]">
                <div className="mb-xl flex justify-center">
                    <Logo mobile />
                </div>

                <section className="rounded-xl border border-outline-variant bg-surface-container-lowest px-lg py-xl text-center shadow-sm">
                    <div className="mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low text-primary">
                        <MailCheck size={34} />
                    </div>

                    <p className="mb-sm text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                        Email verification
                    </p>
                    <h1 className="mb-sm text-headline-lg font-semibold text-on-surface">
                        Check your inbox
                    </h1>
                    <p className="mb-xl text-body-md text-on-surface-variant">
                        We sent a 6-digit code to{" "}
                        <strong className="font-semibold text-on-surface">{email}</strong>.
                    </p>

                    <form className="space-y-md" onSubmit={handleSubmit}>
                        <div className="space-y-xs text-left">
                            <label className="block text-label-sm text-on-surface-variant" htmlFor="otp">
                                Verification code
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
                        </div>

                        <button
                            className="flex h-12 w-full items-center justify-center mb-lg gap-sm rounded-xl bg-primary px-md font-bold text-on-primary shadow-sm transition-all duration-200 hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
                            disabled={isSubmitting || otp.length !== 6}
                            type="submit"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                "Verify account"
                            )}
                        </button>
                    </form>

                    <p className="mt-xl mb-lg text-body-md text-on-surface-variant">
                        Didn't receive the code?{" "}
                        <button
                            className="min-h-0 bg-transparent p-0 font-bold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isResending}
                            onClick={handleResendOtp}
                            type="button"
                        >
                            {isResending ? "Sending..." : "Resend"}
                        </button>
                    </p>
                    <p className="mt-lg text-center text-label-sm text-on-surface-variant">
                        Wrong email?{" "}
                        <Link className="font-bold text-primary hover:underline" to="/register">
                            Create account again
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}
