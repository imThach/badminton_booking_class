import { api } from "./axiosClient.js";

export const classApi = {
    getAllClasses: async (params) => {
        const response = await api.get("/classes", { params });
        return response.data;
    },
    getClassDetail: async (id) => {
        const response = await api.get(`/classes/${id}`);
        return response.data;
    },
    enrollClass: async (id) => {
        const response = await api.post(`/enrollments/classes/${id}`);
        return response.data;
    }
};
