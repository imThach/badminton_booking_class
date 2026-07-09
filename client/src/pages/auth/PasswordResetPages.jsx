import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/authApi.js';
import Logo from '../../components/common/logo.jsx';
import { validateEmail, validateOtp, validatePassword } from '../../utils/formValidation.js';

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const requestOtp = async (event) => {
        event.preventDefault();
        const emailError = validateEmail(email);
        if (emailError) return toast.error(emailError);
        setLoading(true);
        try {
            await authApi.forgotPassword(email.trim().toLowerCase());
            setStep('otp');
            toast.success('Mã OTP đã được gửi nếu email đã đăng ký.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể gửi mã OTP.');
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (event) => {
        event.preventDefault();
        const inputError = validateOtp(otp) || validatePassword(password);
        if (inputError) return toast.error(inputError);
        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp.');
            return;
        }
        setLoading(true);
        try {
            await authApi.resetPassword({ email: email.trim().toLowerCase(), otp, password });
            toast.success('Đặt lại mật khẩu thành công.');
            navigate('/login', { replace: true });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Mã OTP không hợp lệ.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = 'h-12 w-full rounded-xl border border-outline-variant px-md focus:border-primary focus:outline-none';

    return (
        <main className="flex min-h-screen items-center justify-center bg-surface-container-low px-lg py-xl">
            <section className="w-full max-w-[440px] rounded-xl border border-outline-variant bg-white p-lg shadow-lg sm:p-xl">
                <div className="mb-lg"><Logo mobile /></div>
                <h1 className="mb-sm text-headline-lg font-bold">Quên mật khẩu</h1>
                <p className="mb-lg text-on-surface-variant">
                    {step === 'email'
                        ? 'Nhập email đã đăng ký để nhận mã OTP gồm 6 chữ số.'
                        : `Nhập mã OTP được gửi đến ${email}. Mã có hiệu lực trong 10 phút.`}
                </p>

                {step === 'email' ? (
                    <form className="space-y-md" onSubmit={requestOtp}>
                        <input className={inputClass} type="email" maxLength="254" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
                        <button disabled={loading} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
                            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                        </button>
                    </form>
                ) : (
                    <form className="space-y-md" onSubmit={resetPassword}>
                        <input className={`${inputClass} text-center text-xl tracking-[0.4em]`} inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="000000" />
                        <input className={inputClass} type="password" minLength="8" maxLength="128" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu mới" />
                        <input className={inputClass} type="password" minLength="8" maxLength="128" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu mới" />
                        <button disabled={loading} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
                            {loading ? 'Đang xác nhận...' : 'Xác nhận và đổi mật khẩu'}
                        </button>
                        <button type="button" disabled={loading} onClick={requestOtp} className="w-full font-semibold text-primary hover:underline">
                            Gửi lại mã OTP
                        </button>
                        <button type="button" onClick={() => setStep('email')} className="w-full text-on-surface-variant hover:underline">
                            Đổi email
                        </button>
                    </form>
                )}

                <Link to="/login" className="mt-lg block text-center font-bold text-primary">Quay lại đăng nhập</Link>
            </section>
        </main>
    );
}
