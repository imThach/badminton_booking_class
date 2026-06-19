import { api } from './axiosClient';

export const classesApi = {
  async list() {
    const response = await api.get('/classes');
    return response.data;
  },
  async create(payload) {
    const response = await api.post('/classes', payload);
    return response.data;
  },
  async update(id, payload) {
    const response = await api.patch(`/classes/${id}`, payload);
    return response.data;
  },
  async remove(id) {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },
};
