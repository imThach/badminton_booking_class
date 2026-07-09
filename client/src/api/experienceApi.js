import { api } from './axiosClient.js';

export const experienceApi = {
    getReviews: async (classId) => (await api.get(`/experience/classes/${classId}/reviews`)).data,
    saveReview: async (classId, data) => (await api.put(`/experience/classes/${classId}/reviews`, data)).data,
    joinWaitlist: async (classId) => (await api.post(`/experience/classes/${classId}/waitlist`)).data,
    leaveWaitlist: async (classId) => (await api.delete(`/experience/classes/${classId}/waitlist`)).data,
    getWaitlist: async () => (await api.get('/experience/waitlist/me')).data,
    toggleBookmark: async (classId) => (await api.post(`/experience/classes/${classId}/bookmark`)).data,
    getBookmarks: async () => (await api.get('/experience/bookmarks/me')).data,
};
