import axios from "axios";

export const AUTH_UNAUTHORIZED_EVENT = "badminton_booking_auth_unauthorized";
export const AUTH_UNAUTHORIZED_MESSAGE = "Your session has expired. Please log in again.";
const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api/v1" : "http://localhost:3001/api/v1");

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
        if (error.response?.status === 401 && error.config?.url !== "/auth/login") {
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
