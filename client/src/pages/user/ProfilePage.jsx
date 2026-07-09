import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Lock, Camera } from 'lucide-react';
import Header from '../../components/layout/Header.jsx';
import Footer from '../../components/layout/Footer.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { authApi } from '../../api/authApi.js';
import { queryKeys } from '../../api/queryKeys.js';
import { broadcastInvalidateQueries } from '../../api/broadcastQueryClient.js';
import Button from '../../components/common/Button.jsx';
import { classesApi } from '../../api/classesApi.js';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider.jsx';
import { validatePhone } from '../../utils/formValidation.js';

export default function ProfilePage() {
    const { t } = useI18n();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const avatarInputRef = useRef(null);

    const [profile, setProfile] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        skillLevel: user?.skillLevel || '',
        preferredCourt: user?.preferredCourt || '',
        avatar: user?.avatar || '',
    });
    const { data: classesResponse } = useQuery({ queryKey: ['profile-court-options'], queryFn: () => classesApi.list({ limit: 100 }) });
    const courtOptions = [...new Set((classesResponse?.data?.classes || []).map(item => item.location).filter(Boolean))].sort();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Please select a JPEG, PNG, or WebP image.');
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            toast.error('Avatar must be 3 MB or smaller.');
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        setProfile(prev => ({ ...prev, avatar: previewUrl }));
        setIsUploadingAvatar(true);
        try {
            const response = await authApi.uploadAvatar(file);
            queryClient.setQueryData(queryKeys.authUser, response);
            broadcastInvalidateQueries(queryKeys.authUser);
            setProfile(prev => ({ ...prev, avatar: response.data.user.avatar }));
            toast.success('Avatar updated successfully.');
        } catch (error) {
            setProfile(prev => ({ ...prev, avatar: user?.avatar || '' }));
            toast.error(error.response?.data?.message || 'Could not upload avatar.');
        } finally {
            URL.revokeObjectURL(previewUrl);
            setIsUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setIsUploadingAvatar(true);
        try {
            const response = await authApi.deleteAvatar();
            queryClient.setQueryData(queryKeys.authUser, response);
            broadcastInvalidateQueries(queryKeys.authUser);
            setProfile(prev => ({ ...prev, avatar: '' }));
            toast.success('Avatar removed.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not remove avatar.');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = profile.name.trim();
        const phone = profile.phone.trim();
        if (name.length < 2 || name.length > 100) return toast.error('Name must contain 2 to 100 characters.');
        const phoneError = validatePhone(phone, t);
        if (phoneError) return toast.error(phoneError);
        setIsSubmitting(true);
        try {
            const payload = { name, phone, skillLevel: profile.skillLevel, preferredCourt: profile.preferredCourt };
            const updatedUser = await authApi.updateProfile(payload);
            queryClient.setQueryData(queryKeys.authUser, updatedUser);
            broadcastInvalidateQueries(queryKeys.authUser);
            toast.success('Profile updated successfully.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not update profile.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Password confirmation does not match.');
            return;
        }
        if (passwords.newPassword.length < 8 || passwords.newPassword.length > 128) return toast.error('Password must contain 8 to 128 characters.');
        if (passwords.currentPassword && passwords.currentPassword === passwords.newPassword) return toast.error('New password must be different from current password.');
        setIsSubmitting(true);
        try {
            await authApi.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
            toast.success(user?.hasLocalPassword ? 'Password changed. Please log in again.' : 'Password created. Please log in again.');
            logout(undefined, { onSettled: () => navigate('/login', { replace: true }) });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not update password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
    const labelClass = "block text-sm font-semibold text-gray-600 mb-1.5";

    return (
        <div className="flex min-h-screen flex-col bg-surface">
            <Header />
            <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your personal information and account preferences.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-[320px] shrink-0">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                                <input ref={avatarInputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} />
                                <button className="relative mb-4 group cursor-pointer rounded-full disabled:cursor-wait" disabled={isUploadingAvatar} onClick={() => avatarInputRef.current?.click()} type="button">
                                    <img
                                        src={profile.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                                        alt="Profile Avatar"
                                        className="w-28 h-28 rounded-full object-cover border-4 border-gray-50 shadow-sm transition-opacity group-hover:opacity-70"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                    {isUploadingAvatar && <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55"><span className="h-7 w-7 animate-spin rounded-full border-2 border-white/40 border-t-white" /></div>}
                                </button>

                                <h2 className="text-lg font-bold text-gray-900">{profile.name}</h2>
                                <p className="text-sm text-gray-500">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                                <div className="mb-6 flex gap-sm border-b border-gray-200">
                                    <button className={`border-b-2 px-4 py-3 text-sm font-bold ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`} onClick={() => setActiveTab('profile')} type="button">Personal Information</button>
                                    <button className={`border-b-2 px-4 py-3 text-sm font-bold ${activeTab === 'password' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`} onClick={() => setActiveTab('password')} type="button">{user?.hasLocalPassword ? 'Change Password' : 'Set Password'}</button>
                                </div>
                                {activeTab === 'profile' ? (
                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div>
                                        <label className={labelClass} htmlFor="name">Full Name</label>
                                        <input type="text" id="name" name="name" minLength="2" maxLength="100" required value={profile.name} onChange={handleInputChange} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="email">Email Address</label>
                                        <div className="relative">
                                            <input type="email" id="email" value={user?.email || ''} disabled className="w-full px-4 py-2.5 bg-gray-100/70 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed pr-10" />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><Lock className="w-4 h-4 text-gray-400" /></div>
                                        </div>
                                        <p className="mt-1.5 text-xs text-gray-500">Email cannot be changed manually. Contact support for updates.</p>
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="phone">Phone Number</label>
                                        <input type="tel" inputMode="tel" autoComplete="tel" id="phone" name="phone" maxLength="30" value={profile.phone} onChange={handleInputChange} className={inputClass} placeholder="+84 912 345 678" />
                                    </div>
                                    <hr className="border-gray-100" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelClass} htmlFor="skillLevel">Skill Level</label>
                                            <select id="skillLevel" name="skillLevel" value={profile.skillLevel} onChange={handleInputChange} className={inputClass}><option value="">Select skill level</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
                                        </div>
                                        <div>
                                            <label className={labelClass} htmlFor="preferredCourt">Preferred Court</label>
                                            <select id="preferredCourt" name="preferredCourt" value={profile.preferredCourt} onChange={handleInputChange} className={inputClass}><option value="">Select preferred court</option>{profile.preferredCourt && !courtOptions.includes(profile.preferredCourt) && <option value={profile.preferredCourt}>{profile.preferredCourt}</option>}{courtOptions.map(court => <option key={court} value={court}>{court}</option>)}</select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end items-center gap-4 pt-4">
                                        <Button type="button" variant="ghost" className="px-lg" onClick={() => window.history.back()}>Cancel</Button>
                                        <Button type="submit" className="px-lg" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                                    </div>
                                </form>
                                ) : (
                                    <form className="space-y-6" onSubmit={handlePasswordSubmit}>
                                        <div><h2 className="text-lg font-bold text-gray-900">{user?.hasLocalPassword ? 'Change your password' : 'Create a password'}</h2><p className="mt-1 text-sm text-gray-500">Use at least 8 characters. You will need to log in again afterward.</p></div>
                                        {user?.hasLocalPassword && <div><label className={labelClass} htmlFor="currentPassword">Current Password</label><input className={inputClass} id="currentPassword" minLength="8" maxLength="128" required type="password" value={passwords.currentPassword} onChange={event => setPasswords(current => ({ ...current, currentPassword: event.target.value }))} /></div>}
                                        <div><label className={labelClass} htmlFor="newPassword">New Password</label><input className={inputClass} id="newPassword" minLength="8" maxLength="128" required type="password" value={passwords.newPassword} onChange={event => setPasswords(current => ({ ...current, newPassword: event.target.value }))} /></div>
                                        <div><label className={labelClass} htmlFor="confirmPassword">Confirm New Password</label><input className={inputClass} id="confirmPassword" minLength="8" maxLength="128" required type="password" value={passwords.confirmPassword} onChange={event => setPasswords(current => ({ ...current, confirmPassword: event.target.value }))} /></div>
                                        <div className="flex justify-end pt-4"><Button className="px-lg" disabled={isSubmitting} type="submit">{isSubmitting ? 'Saving...' : user?.hasLocalPassword ? 'Change Password' : 'Set Password'}</Button></div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
