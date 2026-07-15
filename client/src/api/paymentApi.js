import { api, apiBaseUrl } from './axiosClient.js';

export const paymentApi = {
  createVnpayPayment: async (classId) => (await api.post(`/payments/vnpay/classes/${classId}`)).data,
  getPaymentStatus: async (paymentId) => (await api.get(`/payments/${paymentId}/status`)).data,
  getMyPayments: async (params) => (await api.get('/payments/me', { params })).data,
  getRefundRequests: async () => (await api.get('/payments/admin/refunds')).data,
  getAdminPaymentHistory: async (params) => (await api.get('/payments/admin/history', { params })).data,
  processRefund: async ({ paymentId, action, note = '' }) => (await api.patch(`/payments/admin/refunds/${paymentId}`, { action, note })).data,
  invoiceUrl: (paymentId) => `${apiBaseUrl.replace(/\/$/, '')}/payments/${paymentId}/invoice`,
};
