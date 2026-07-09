import { api } from './axiosClient.js';

export const auditApi = {
  list: async (params) => (await api.get('/audit-logs', { params })).data,
};
