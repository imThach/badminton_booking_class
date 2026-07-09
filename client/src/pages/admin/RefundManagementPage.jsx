import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { paymentApi } from '../../api/paymentApi.js';
import { queryKeys } from '../../api/queryKeys.js';
import { broadcastInvalidateQueries } from '../../api/broadcastQueryClient.js';
import Header from '../../components/layout/Header.jsx';
import Footer from '../../components/layout/Footer.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';

const statuses = ['pending', 'paid', 'failed', 'refund_pending', 'refunded', 'refund_failed'];

export default function RefundManagementPage() {
  const { language, t } = useI18n();
  const client = useQueryClient();
  const [tab, setTab] = useState('refunds');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const refundsQuery = useQuery({
    queryKey: queryKeys.refundRequests,
    queryFn: paymentApi.getRefundRequests,
    enabled: tab === 'refunds',
  });

  const historyQuery = useQuery({
    queryKey: ['admin-payment-history', page, status],
    queryFn: () =>
      paymentApi.getAdminPaymentHistory({
        page,
        limit: 20,
        status: status || undefined,
      }),
    enabled: tab === 'history',
  });

  const requests = refundsQuery.data?.data?.payments || [];
  const history = historyQuery.data?.data?.payments || [];
  const pagination = historyQuery.data?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const labels = {
    pending: t('paymentHistory.status.pending'),
    paid: t('paymentHistory.status.paid'),
    failed: t('paymentHistory.status.failed'),
    refund_pending: t('paymentHistory.status.refundPending'),
    refunded: t('paymentHistory.status.refunded'),
    refund_failed: t('paymentHistory.status.refundFailed'),
  };

  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const money = (value) => `${Number(value || 0).toLocaleString(locale)} VND`;
  const date = (value) =>
    value
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
      : '-';

  const mutation = useMutation({
    mutationFn: paymentApi.processRefund,
    onSuccess: (_response, variables) => {
      toast.success(variables.action === 'refunded' ? t('refund.markedRefunded') : t('refund.markedRejected'));
      client.invalidateQueries({ queryKey: queryKeys.refundRequests });
      client.invalidateQueries({ queryKey: queryKeys.adminPaymentHistory });
      client.invalidateQueries({ queryKey: queryKeys.myPayments });
      broadcastInvalidateQueries([
        queryKeys.refundRequests,
        queryKeys.adminPaymentHistory,
        queryKeys.myPayments,
        queryKeys.admin.dashboard,
      ]);
      setConfirmAction(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || t('refund.updateError')),
  });

  const process = (paymentId, action) => {
    setConfirmAction({ paymentId, action });
  };

  const confirmRefundAction = () => {
    if (!confirmAction) return;
    mutation.mutate(confirmAction);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-container-max flex-grow px-lg py-xl">
        <h1 className="mb-xs text-headline-lg font-bold">{t('refund.title')}</h1>
        <p className="mb-lg text-on-surface-variant">{t('refund.subtitle')}</p>
        <div className="mb-xl flex gap-xs border-b border-outline-variant">
          <button
            className={`border-b-2 px-md py-sm font-bold ${tab === 'refunds' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
              }`}
            onClick={() => setTab('refunds')}
          >
            {t('refund.requestsTab')}
          </button>
          <button
            className={`border-b-2 px-md py-sm font-bold ${tab === 'history' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
              }`}
            onClick={() => setTab('history')}
          >
            {t('refund.allTransactionsTab')}
          </button>
        </div>

        {tab === 'refunds' && (
          <>
            {refundsQuery.isLoading && <p>{t('refund.loading')}</p>}
            {refundsQuery.isError && <p className="text-error">{t('refund.loadError')}</p>}
            <div className="space-y-md">
              {requests.map((item) => (
                <article className="rounded-xl border bg-white p-lg" key={item._id}>
                  <div className="grid gap-md md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div>
                      <h2 className="font-bold">{item.class?.title}</h2>
                      <p className="text-label-sm text-on-surface-variant">
                        {item.user?.name} · {item.user?.email}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {t('refund.transaction')}: {item.txnRef}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold">{money(item.amount)}</p>
                      <p className="text-label-sm">{labels[item.status]}</p>
                    </div>
                    {item.status === 'refund_pending' ? (
                      <div className="flex gap-sm">
                        <button
                          className="rounded-lg bg-primary px-md py-sm font-bold text-white"
                          onClick={() => process(item._id, 'refunded')}
                        >
                          {t('refund.markRefunded')}
                        </button>
                        <button
                          className="rounded-lg border border-error px-md py-sm font-bold text-error"
                          onClick={() => process(item._id, 'refund_failed')}
                        >
                          {t('refund.reject')}
                        </button>
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                </article>
              ))}
            </div>
            {!refundsQuery.isLoading && !requests.length && (
              <div className="rounded-xl border bg-white p-xl text-center">{t('refund.empty')}</div>
            )}
          </>
        )}

        {tab === 'history' && (
          <>
            <div className="mb-md flex items-center justify-between gap-md">
              <p className="text-on-surface-variant">
                {t('refund.transactionCount', { count: pagination.total })}
              </p>
              <select
                className="rounded-lg border bg-white px-md py-sm"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('refund.allStatuses')}</option>
                {statuses.map((value) => (
                  <option value={value} key={value}>
                    {labels[value]}
                  </option>
                ))}
              </select>
            </div>
            {historyQuery.isLoading && <p>{t('common.loading')}</p>}
            {historyQuery.isError && <p className="text-error">{t('refund.historyLoadError')}</p>}
            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-surface-container">
                  <tr>
                    {['date', 'user', 'class', 'transaction', 'amount', 'status'].map((key) => (
                      <th className="px-md py-sm" key={key}>
                        {t(`refund.${key}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr className="border-t" key={item._id}>
                      <td className="px-md py-sm">{date(item.paidAt || item.createdAt)}</td>
                      <td className="px-md py-sm">
                        <strong>{item.user?.name || '-'}</strong>
                        <p className="text-label-xs text-on-surface-variant">{item.user?.email}</p>
                      </td>
                      <td className="px-md py-sm">{item.class?.title || '-'}</td>
                      <td className="px-md py-sm font-mono text-label-sm">{item.txnRef}</td>
                      <td className="px-md py-sm">{money(item.amount)}</td>
                      <td className="px-md py-sm">{labels[item.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!historyQuery.isLoading && !history.length && (
                <p className="p-xl text-center">{t('refund.noTransactions')}</p>
              )}
            </div>
            {pagination.totalPages > 1 && (
              <div className="mt-lg flex justify-center gap-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="rounded-lg border px-md py-sm disabled:opacity-40"
                >
                  {t('classes.previous')}
                </button>
                <span className="px-md py-sm">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  className="rounded-lg border px-md py-sm disabled:opacity-40"
                >
                  {t('classes.next')}
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.action === 'refunded' ? t('refund.confirmRefundedTitle') : t('refund.confirmRejectTitle')}
        message={confirmAction?.action === 'refunded' ? t('refund.confirmRefunded') : t('refund.confirmReject')}
        confirmLabel={confirmAction?.action === 'refunded' ? t('refund.markRefunded') : t('refund.reject')}
        variant={confirmAction?.action === 'refunded' ? 'primary' : 'danger'}
        isLoading={mutation.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmRefundAction}
      />
      <Footer />
    </div>
  );
}
