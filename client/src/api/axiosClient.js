import axios from "axios";

export const AUTH_UNAUTHORIZED_EVENT = "badminton_booking_auth_unauthorized";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1",
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
