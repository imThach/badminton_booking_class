import { api, apiBaseUrl } from "./axiosClient.js";

export const authApi = {
  googleLoginUrl: `${apiBaseUrl.replace(/\/+$/, "")}/auth/google`,
  getPendingGoogleSignup: async () => (await api.get('/auth/google/pending')).data,
  confirmGoogleSignup: async () => (await api.post('/auth/google/confirm')).data,
  cancelGoogleSignup: async () => (await api.post('/auth/google/cancel')).data,
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },
  signup: async (data) => {
    const response = await api.post("/auth/signup", data);
    return response.data;
  },
  verifySignupOTP: async (data) => {
    const response = await api.post("/auth/verify-signup-otp", data);
    return response.data;
  },
  resendSignupOTP: async (data) => {
    const response = await api.post("/auth/resend-signup-otp", data);
    return response.data;
  },
  getMe: async ({ signal } = {}) => {
    const response = await api.get("/auth/me", { signal });
    return response.data;
  },
  logout: async () => {
    await api.get("/auth/logout");
  },
  updateProfile: async (data) => (await api.patch('/auth/me', data)).data,
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return (await api.patch('/auth/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
  deleteAvatar: async () => (await api.delete('/auth/me/avatar')).data,
  changePassword: async (data) => (await api.patch('/auth/change-password', data)).data,
  forgotPassword: async (email) => (await api.post('/auth/forgot-password', { email })).data,
  resetPassword: async (data) => (await api.patch('/auth/reset-password', data)).data,
};

