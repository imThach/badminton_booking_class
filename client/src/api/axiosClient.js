import axios from "axios";

export const AUTH_UNAUTHORIZED_EVENT = "badminton_booking_auth_unauthorized";
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
            window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
        }

        return Promise.reject(error);
    }
);
