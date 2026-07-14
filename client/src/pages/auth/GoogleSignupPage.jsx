import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/authApi.js';
import { getApiErrorMessage } from '../../api/apiError.js';
import GoogleIcon from '../../components/common/googleicon.jsx';
import Logo from '../../components/common/logo.jsx';

export default function GoogleSignupPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    authApi.getPendingGoogleSignup()
      .then((response) => setProfile(response.data.profile))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, 'Yêu cầu đăng ký Google đã hết hạn.'));
        navigate('/login', { replace: true });
      })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const confirm = async () => {
    try {
      setIsSubmitting(true);
      const response = await authApi.confirmGoogleSignup();
      const token = response?.data?.token;
      window.location.assign(token ? `/?oauth=success&token=${encodeURIComponent(token)}` : '/?oauth=success');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tạo tài khoản Google.'));
      setIsSubmitting(false);
    }
  };

  const cancel = async () => {
    try { await authApi.cancelGoogleSignup(); } finally { navigate('/login', { replace: true }); }
  };

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></main>;
  }

  if (!profile) return null;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-lg py-xl">
      <section className="w-full max-w-[440px] rounded-xl border border-outline-variant bg-white p-xl text-center shadow-lg">
        <div className="mb-lg flex justify-center"><Logo mobile /></div>
        {profile.avatar ? <img className="mx-auto mb-md h-20 w-20 rounded-full object-cover" src={profile.avatar} alt={profile.name} /> : <div className="mb-md flex justify-center"><GoogleIcon /></div>}
        <h1 className="mb-sm text-headline-lg font-bold text-on-surface">Tài khoản chưa được đăng ký</h1>
        <p className="mb-xs text-body-md text-on-surface-variant">Chưa có tài khoản Google cho:</p>
        <p className="mb-lg font-bold text-on-surface">{profile.email}</p>
        <p className="mb-xl text-body-md text-on-surface-variant">Bạn có muốn tạo tài khoản mới? Tài khoản Google không cần mật khẩu.</p>
        <div className="space-y-sm">
          <button className="flex h-12 w-full items-center justify-center gap-sm rounded-xl bg-primary font-bold text-white disabled:opacity-60" disabled={isSubmitting} onClick={confirm} type="button">
            <GoogleIcon />{isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký bằng Google'}
          </button>
          <button className="h-12 w-full rounded-xl border border-outline-variant font-bold text-on-surface" disabled={isSubmitting} onClick={cancel} type="button">Quay lại đăng nhập</button>
        </div>
      </section>
    </main>
  );
}
