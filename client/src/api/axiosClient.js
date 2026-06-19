import axios from "axios";
import { tokenStorage } from "./tokenStorage.js";

export const api = axios.create({
    // Sử dụng biến môi trường từ Vite (.env)
    baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1",
    withCredentials: true, // Cho phép trình duyệt tự động gửi HTTP-only Cookies
    headers: {
        "Content-Type": "application/json",
    },
});

// Response Interceptor: Xử lý lỗi global (VD: Token hết hạn)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Xử lý khi user bị văng session (Cookie hết hạn hoặc không hợp lệ)
            // Ví dụ: window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
