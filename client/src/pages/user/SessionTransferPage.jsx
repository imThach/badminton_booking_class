import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header.jsx';
import Footer from '../../components/layout/Footer.jsx';
import { sessionApi } from '../../api/sessionApi.js';
import { broadcastInvalidateQueries } from '../../api/broadcastQueryClient.js';
import { queryKeys } from '../../api/queryKeys.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

export default function SessionTransferPage() {
  const { language, t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ fromSession: '', targetKey: '', reason: '' });

  const options = useQuery({
    queryKey: queryKeys.transferOptions,
    queryFn: sessionApi.transferOptions,
  });

  const transfers = useQuery({
    queryKey: queryKeys.myTransfers,
    queryFn: () => sessionApi.transfers({ limit: 100 }),
  });

  const sources = options.data?.data?.sources || [];
  const targets = options.data?.data?.targets || [];
  const selectedSource = sources.find(item => item._id === form.fromSession);
  const filteredTargets = selectedSource
    ? targets.filter(
        item =>
          item.class._id !== selectedSource.class?._id &&
          item.class.level === selectedSource.class?.level
      )
    : [];
  const selectedTarget = filteredTargets.find(item => item.key === form.targetKey);

  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const format = value =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));

  const request = useMutation({
    mutationFn: sessionApi.request,
    onSuccess: () => {
      toast.success(t('transfer.sent'));
      setForm({ fromSession: '', targetKey: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: queryKeys.myTransfers });
      queryClient.invalidateQueries({ queryKey: queryKeys.transferOptions });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionTransfers });
      broadcastInvalidateQueries([
        queryKeys.myTransfers,
        queryKeys.transferOptions,
        queryKeys.sessionTransfers,
      ]);
    },
    onError: error =>
      toast.error(error.response?.data?.message || t('transfer.sendError')),
  });

  const submit = event => {
    event.preventDefault();
    request.mutate({
      fromSession: form.fromSession,
      targetClass: selectedTarget.class._id,
      targetStartDate: selectedTarget.startDate,
      targetEndDate: selectedTarget.endDate,
      reason: form.reason,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-3xl space-y-xl px-lg py-xl">
        <div>
          <h1 className="text-headline-lg font-bold">{t('transfer.title')}</h1>
          <p className="text-on-surface-variant">{t('transfer.subtitle')}</p>
        </div>
        <form className="space-y-md rounded-xl border border-outline-variant bg-white p-lg" onSubmit={submit}>
          <label className="block font-semibold">
            {t('transfer.source')}
            <select
              required
              className="mt-xs w-full rounded-lg border border-outline-variant p-sm"
              value={form.fromSession}
              onChange={event =>
                setForm({ ...form, fromSession: event.target.value, targetKey: '' })
              }
            >
              <option value="">{t('transfer.selectSource')}</option>
              {sources.map(item => (
                <option key={item._id} value={item._id}>
                  {item.class?.title} — {format(item.startDate)}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-semibold">
            {t('transfer.target')}
            <select
              required
              disabled={!selectedSource}
              className="mt-xs w-full rounded-lg border border-outline-variant p-sm disabled:bg-surface-container"
              value={form.targetKey}
              onChange={event => setForm({ ...form, targetKey: event.target.value })}
            >
              <option value="">{t('transfer.selectTarget')}</option>
              {filteredTargets.map(item => (
                <option key={item.key} value={item.key}>
                  {item.class.title} — {format(item.startDate)}
                </option>
              ))}
            </select>
          </label>
          {selectedSource && filteredTargets.length === 0 && (
            <p className="text-label-sm text-error">{t('transfer.noTargets')}</p>
          )}
          <textarea
            required
            minLength="10"
            maxLength="500"
            className="min-h-24 w-full rounded-lg border border-outline-variant p-sm"
            placeholder={t('transfer.reason')}
            value={form.reason}
            onChange={event => setForm({ ...form, reason: event.target.value })}
          />
          <button
            disabled={request.isPending || !selectedTarget}
            className="rounded-lg bg-primary px-md py-sm font-bold text-white disabled:opacity-50"
          >
            {t('transfer.submit')}
          </button>
        </form>
        <section className="rounded-xl border border-outline-variant bg-white p-lg">
          <h2 className="mb-md font-bold">{t('transfer.history')}</h2>
          {(transfers.data?.data?.transfers || []).map(item => (
            <p className="border-t border-outline-variant py-sm" key={item._id}>
              {item.fromSession?.class?.title} →{' '}
              {item.targetClass?.title || item.toSession?.class?.title}:{' '}
              <strong>{t(`attendance.status.${item.status}`)}</strong>
            </p>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
