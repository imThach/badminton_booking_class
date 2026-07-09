import axios from "axios";

export const AUTH_UNAUTHORIZED_EVENT = "badminton_booking_auth_unauthorized";
export const AUTH_UNAUTHORIZED_MESSAGE = "Your session has expired. Please log in again.";
export const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api/v1" : "http://localhost:3001/api/v1");

const PUBLIC_AUTH_PATHS = [
    "/auth/login",
    "/auth/signup",
    "/auth/verify-signup-otp",
    "/auth/resend-signup-otp",
    "/auth/forgot-password",
    "/auth/reset-password",
];

export const isPublicAuthRequest = (url = "") => {
    const path = String(url).split("?")[0].replace(/\/+$/, "");
    return PUBLIC_AUTH_PATHS.some((authPath) => path.endsWith(authPath));
};

export const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !isPublicAuthRequest(error.config?.url)) {
            const message = error.response?.data?.message || AUTH_UNAUTHORIZED_MESSAGE;

            window.dispatchEvent(
                new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
                    detail: {
                        message,
                    },
                })
            );
        }

        return Promise.reject(error);
    }
);
