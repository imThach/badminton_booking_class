import { api } from './axiosClient.js';

export const coachesApi = {
    async list(params) { return (await api.get('/coaches', { params })).data; },
    async create(payload) { return (await api.post('/coaches', payload)).data; },
    async update(id, payload) { return (await api.patch(`/coaches/${id}`, payload)).data; },
    async remove(id) { return (await api.delete(`/coaches/${id}`)).data; },
    async uploadPhoto(file) {
        const formData = new FormData();
        formData.append('photo', file);
        return (await api.post('/coaches/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
};
