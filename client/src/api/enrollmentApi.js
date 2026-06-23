import { api } from "./axiosClient.js";

export const enrollmentApi = {
    getMyEnrollments: async () => {
        const response = await api.get("/enrollments/me");
        return response.data;
    },
    cancelEnrollment: async (classId) => {
        const response = await api.delete(`/enrollments/classes/${classId}`);
        return response.data;
    },
    enrollClass: async (classId) => {
        const response = await api.post(`/enrollments/classes/${classId}`);
        return response.data;
    },
};
