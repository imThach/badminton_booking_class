import { useQuery } from '@tanstack/react-query';
import { Download, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import { paymentApi } from '../../api/paymentApi.js';
import { queryKeys } from '../../api/queryKeys.js';
import Header from '../../components/layout/Header.jsx';
import Footer from '../../components/layout/Footer.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';

const statusStyle = {
  paid: 'bg-primary/10 text-primary', pending: 'bg-surface-container text-on-surface-variant',
  failed: 'bg-error-container text-error', refund_pending: 'bg-surface-container text-on-surface',
  refunded: 'bg-primary/10 text-primary', refund_failed: 'bg-error-container text-error',
};
const hasInvoice = status => ['paid', 'refund_pending', 'refunded', 'refund_failed'].includes(status);

export default function PaymentHistoryPage() {
  const { language, t } = useI18n();
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError } = useQuery({
    queryKey: [...queryKeys.myPayments, { page, limit }],
    queryFn: () => paymentApi.getMyPayments({ page, limit }),
  });
  const payments = data?.data?.payments || [];
  const pagination = data?.data?.pagination || { page, totalPages: 1, total: payments.length };
  const visiblePages = Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
    .filter((value) => value === 1 || value === pagination.totalPages || Math.abs(value - pagination.page) <= 1);
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const statusLabel = {
    paid: t('paymentHistory.status.paid'),
    pending: t('paymentHistory.status.pending'),
    failed: t('paymentHistory.status.failed'),
    refund_pending: t('paymentHistory.status.refundPending'),
    refunded: t('paymentHistory.status.refunded'),
    refund_failed: t('paymentHistory.status.refundFailed'),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-container-max flex-grow px-lg py-xl">
        <div className="mb-xl flex items-center gap-md">
          <ReceiptText className="text-primary" size={36} />
          <div>
            <h1 className="text-headline-lg font-bold">{t('paymentHistory.title')}</h1>
            <p className="text-on-surface-variant">{t('paymentHistory.subtitle')}</p>
          </div>
        </div>
        {isLoading && (
          <div className="py-xl text-center">{t('common.loading')}</div>
        )}
        {isError && (
          <div className="py-xl text-center text-error">
            {t('paymentHistory.loadError')}
          </div>
        )}
        {!isLoading && !isError && payments.length === 0 && (
          <div className="rounded-xl border bg-white p-xl text-center text-on-surface-variant">
            {t('paymentHistory.empty')}
          </div>
        )}
        <div className="space-y-md">
          {payments.map((payment) => (
            <article
              key={payment._id}
              className="grid gap-md rounded-xl border border-outline-variant bg-white p-lg shadow-sm md:grid-cols-[1fr_auto_auto] md:items-center"
            >
              <div>
                <h2 className="font-bold text-on-surface">
                  {payment.class?.title || t('paymentHistory.class')}
                </h2>
                <p className="text-label-sm text-on-surface-variant">
                  {t('paymentHistory.transaction')}: {payment.txnRef}
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  {new Date(payment.createdAt).toLocaleString(locale)}
                </p>
              </div>
              <div className="md:text-right">
                <p className="text-title-md font-bold">
                  {Number(payment.amount).toLocaleString(locale)} VND
                </p>
                <span
                  className={`${
                    statusStyle[payment.status] || statusStyle.pending
                  } inline-block rounded-full px-md py-xs text-label-xs font-bold`}
                >
                  {statusLabel[payment.status] || payment.status}
                </span>
              </div>
              {hasInvoice(payment.status) ? (
                <a
                  className="flex h-10 items-center justify-center gap-xs rounded-lg border border-primary px-md font-bold text-primary"
                  href={paymentApi.invoiceUrl(payment._id)}
                >
                  <Download size={18} /> PDF
                </a>
              ) : (
                <div />
              )}
            </article>
          ))}
        </div>
        {!isLoading && !isError && pagination.totalPages > 1 && (
          <nav className="mt-xl flex flex-wrap items-center justify-center gap-xs" aria-label="Pagination">
            <button
              className="rounded-lg border border-outline-variant px-md py-sm font-semibold disabled:opacity-40"
              disabled={pagination.page <= 1}
              onClick={() => setPage((value) => Math.max(value - 1, 1))}
              type="button"
            >
              {t('classes.previous')}
            </button>
            {visiblePages.map((value, index) => (
              <span className="contents" key={value}>
                {index > 0 && value - visiblePages[index - 1] > 1 && <span className="px-xs">...</span>}
                <button
                  className={`h-10 min-w-10 rounded-lg px-sm font-bold ${pagination.page === value ? 'bg-primary text-white' : 'border border-outline-variant'}`}
                  onClick={() => setPage(value)}
                  type="button"
                >
                  {value}
                </button>
              </span>
            ))}
            <button
              className="rounded-lg border border-outline-variant px-md py-sm font-semibold disabled:opacity-40"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((value) => Math.min(value + 1, pagination.totalPages))}
              type="button"
            >
              {t('classes.next')}
            </button>
          </nav>
        )}
      </main>
      <Footer />
    </div>
  );
}
