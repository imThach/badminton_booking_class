import { isPublicAuthRequest } from "./axiosClient.js";

export const isSessionError = (error) => error?.response?.status === 401;

export const getApiErrorMessage = (error, fallbackMessage = "Something went wrong. Please try again.") => {
    const message = error?.response?.data?.message;

    if (isSessionError(error) && !isPublicAuthRequest(error?.config?.url)) {
        return "Your session has expired. Please log in again.";
    }

    if (typeof message === "string" && message.trim()) {
        return message;
    }

    if (!error?.response) {
        return "Unable to reach the server. Please check your connection and try again.";
    }

    return fallbackMessage;
};
