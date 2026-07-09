import { api } from './axiosClient.js';

export const dashboardApi = {
    async overview() { return (await api.get('/dashboard/overview')).data; },
};
