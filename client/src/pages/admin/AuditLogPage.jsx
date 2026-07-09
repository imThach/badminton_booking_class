import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../api/auditApi.js';
import Header from '../../components/layout/Header.jsx';
import Footer from '../../components/layout/Footer.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';

const actions = ['CLASS_CREATED', 'CLASS_UPDATED', 'CLASS_DELETED', 'STUDENT_REMOVED_FROM_CLASS', 'USER_ROLE_CHANGED', 'REFUND_STATUS_CHANGED'];

export default function AuditLogPage() {
  const { language, t } = useI18n();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-logs', page, action],
    queryFn: () => auditApi.list({ page, limit: 20, action: action || undefined }),
  });
  const logs = data?.data?.logs || [];
  const pagination = data?.data?.pagination || { page: 1, totalPages: 1 };

  return <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <main className="mx-auto w-full max-w-container-max flex-grow px-lg py-xl">
      <div className="mb-xl flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div><h1 className="text-headline-lg font-bold">{t('audit.title')}</h1><p className="text-on-surface-variant">{t('audit.subtitle')}</p></div>
        <select className="rounded-lg border border-outline-variant bg-white px-md py-sm" value={action} onChange={event => { setAction(event.target.value); setPage(1); }}>
          <option value="">{t('audit.allActions')}</option>
          {actions.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
        </select>
      </div>
      {isLoading && <p>{t('common.loading')}</p>}
      {isError && <p className="text-error">{t('audit.loadError')}</p>}
      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-white">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-surface-container"><tr><th className="px-md py-sm">{t('audit.time')}</th><th className="px-md py-sm">{t('audit.actor')}</th><th className="px-md py-sm">{t('audit.action')}</th><th className="px-md py-sm">{t('audit.target')}</th></tr></thead>
          <tbody className="divide-y divide-outline-variant">{logs.map(log => <tr key={log._id}>
            <td className="px-md py-sm text-label-sm">{new Date(log.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</td>
            <td className="px-md py-sm"><p className="font-semibold">{log.actor?.name || 'Unknown'}</p><p className="text-label-xs text-on-surface-variant">{log.actor?.email}</p></td>
            <td className="px-md py-sm"><span className="rounded-full bg-primary/10 px-sm py-xs text-label-xs font-bold text-primary">{log.action}</span></td>
            <td className="px-md py-sm"><p className="font-semibold">{log.targetName}</p><p className="text-label-xs text-on-surface-variant">{log.targetType}</p></td>
          </tr>)}</tbody>
        </table>
        {!isLoading && logs.length === 0 && <p className="p-xl text-center text-on-surface-variant">{t('audit.empty')}</p>}
      </div>
      {pagination.totalPages > 1 && <div className="mt-lg flex justify-center gap-sm"><button className="rounded-lg border px-md py-sm disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>{t('classes.previous')}</button><span className="px-md py-sm">{page} / {pagination.totalPages}</span><button className="rounded-lg border px-md py-sm disabled:opacity-40" disabled={page >= pagination.totalPages} onClick={() => setPage(value => value + 1)}>{t('classes.next')}</button></div>}
    </main>
    <Footer />
  </div>;
}
