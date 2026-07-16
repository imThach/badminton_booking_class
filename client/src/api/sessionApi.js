import { api } from './axiosClient.js';
export const sessionApi = {
  list: async (id, params) => (await api.get(`/sessions/classes/${id}`, { params })).data,
  generate: async id => (await api.post(`/sessions/classes/${id}/generate`)).data,
  create: async ({ classId, ...data }) => (await api.post(`/sessions/classes/${classId}`, data)).data,
  roster: async id => (await api.get(`/sessions/${id}/attendance`)).data,
  mark: async ({ sessionId, records }) => (await api.patch(`/sessions/${sessionId}/attendance`, { records })).data,
  transfers: async (params) => (await api.get('/sessions/transfers/list', { params })).data,
  transferOptions: async () => (await api.get('/sessions/transfers/options')).data,
  request: async data => (await api.post('/sessions/transfers', data)).data,
  process: async ({ id, status }) => (await api.patch(`/sessions/transfers/${id}`, { status })).data,
};
