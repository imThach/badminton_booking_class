import { api } from "./axiosClient.js";

export const authApi = {
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
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data; // Trả về thông tin user hiện tại
  },
  logout: async () => {
    await api.get("/auth/logout");
  }
};