import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/authApi.js';
import Logo from '../../components/common/logo.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';
import { validateEmail, validateOtp, validatePassword } from '../../utils/formValidation.js';

export function ForgotPasswordPage() {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const requestOtp = async (event) => {
        event.preventDefault();
        const emailError = validateEmail(email, t);
        if (emailError) return toast.error(emailError);
        setLoading(true);
        try {
            await authApi.forgotPassword(email.trim().toLowerCase());
            setStep('otp');
            toast.success(t('passwordReset.otpSent'));
        } catch (error) {
            toast.error(error.response?.data?.message || t('passwordReset.otpSendError'));
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (event) => {
        event.preventDefault();
        const inputError = validateOtp(otp, t) || validatePassword(password, t);
        if (inputError) return toast.error(inputError);
        if (password !== confirmPassword) {
            toast.error(t('passwordReset.passwordMismatch'));
            return;
        }
        setLoading(true);
        try {
            await authApi.resetPassword({ email: email.trim().toLowerCase(), otp, password });
            toast.success(t('passwordReset.success'));
            navigate('/login', { replace: true });
        } catch (error) {
            toast.error(error.response?.data?.message || t('passwordReset.invalidOtp'));
        } finally {
            setLoading(false);
        }
    };

    const inputClass = 'h-12 w-full rounded-xl border border-outline-variant px-md focus:border-primary focus:outline-none';

    return (
        <main className="flex min-h-screen items-center justify-center bg-surface-container-low px-lg py-xl">
            <section className="w-full max-w-[440px] rounded-xl border border-outline-variant bg-white p-lg shadow-lg sm:p-xl">
                <div className="mb-lg"><Logo mobile /></div>
                <h1 className="mb-sm text-headline-lg font-bold">{t('passwordReset.title')}</h1>
                <p className="mb-lg text-on-surface-variant">
                    {step === 'email'
                        ? t('passwordReset.emailIntro')
                        : t('passwordReset.otpIntro', { email })}
                </p>

                {step === 'email' ? (
                    <form className="space-y-md" onSubmit={requestOtp}>
                        <input className={inputClass} type="email" maxLength="254" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
                        <button disabled={loading} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
                            {loading ? t('passwordReset.sending') : t('passwordReset.sendOtp')}
                        </button>
                    </form>
                ) : (
                    <form className="space-y-md" onSubmit={resetPassword}>
                        <input className={`${inputClass} text-center text-xl tracking-[0.4em]`} inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="000000" />
                        <input className={inputClass} type="password" minLength="8" maxLength="128" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('passwordReset.newPassword')} />
                        <input className={inputClass} type="password" minLength="8" maxLength="128" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={t('passwordReset.confirmPassword')} />
                        <button disabled={loading} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
                            {loading ? t('passwordReset.confirming') : t('passwordReset.submit')}
                        </button>
                        <button type="button" disabled={loading} onClick={requestOtp} className="w-full font-semibold text-primary hover:underline">
                            {t('passwordReset.resendOtp')}
                        </button>
                        <button type="button" onClick={() => setStep('email')} className="w-full text-on-surface-variant hover:underline">
                            {t('passwordReset.changeEmail')}
                        </button>
                    </form>
                )}

                <Link to="/login" className="mt-lg block text-center font-bold text-primary">{t('passwordReset.backToLogin')}</Link>
            </section>
        </main>
    );
}
