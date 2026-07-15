import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../api/auditApi.js';
import Header from '../../components/layout/Header.jsx';
import Footer from '../../components/layout/Footer.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';

const actions = ['CLASS_CREATED', 'CLASS_UPDATED', 'CLASS_DELETED', 'COACH_CREATED', 'COACH_UPDATED', 'COACH_DELETED', 'SESSION_CREATED', 'SESSIONS_GENERATED', 'ATTENDANCE_MARKED', 'SESSION_TRANSFER_PROCESSED', 'STUDENT_REMOVED_FROM_CLASS', 'USER_ROLE_CHANGED', 'REFUND_STATUS_CHANGED'];

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const fieldLabel = (field, t) => {
  const key = `audit.field.${field}`;
  const translated = t(key);
  return translated === key ? field : translated;
};
const formatValue = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (isPlainObject(value) || Array.isArray(value)) return JSON.stringify(value);
  return String(value);
};
const formatChange = ([field, value], t) => {
  if (field === 'fields' && Array.isArray(value)) {
    return `${fieldLabel(field, t)}: ${value.join(', ') || '-'}`;
  }

  if (['photo', 'bio'].includes(field) && typeof value === 'boolean') {
    return `${fieldLabel(field, t)}: ${value ? t('audit.value.provided') : t('audit.value.notProvided')}`;
  }

  if (isPlainObject(value) && ('from' in value || 'to' in value)) {
    return `${fieldLabel(field, t)}: ${formatValue(value.from)} -> ${formatValue(value.to)}`;
  }
  return `${fieldLabel(field, t)}: ${formatValue(value)}`;
};
const formatMetadata = ([field, value], t) => `${fieldLabel(field, t)}: ${formatValue(value)}`;

const metadataTargetFields = new Set(['name', 'title', 'txnRef']);
const getUsefulMetadata = (log) => Object.entries(log.metadata || {})
  .filter(([field, value]) => !metadataTargetFields.has(field) && formatValue(value) !== formatValue(log.targetName));

const actionSummary = (log, t) => {
  if (log.action.endsWith('_CREATED')) return t('audit.summary.added', { target: log.targetType });
  if (log.action.endsWith('_DELETED')) return t('audit.summary.deleted', { target: log.targetType });
  if (log.action === 'STUDENT_REMOVED_FROM_CLASS') return t('audit.summary.studentRemoved');
  return '';
};

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
        <table className="w-full min-w-[920px] text-left">
          <thead className="bg-surface-container"><tr><th className="px-md py-sm">{t('audit.time')}</th><th className="px-md py-sm">{t('audit.actor')}</th><th className="px-md py-sm">{t('audit.action')}</th><th className="px-md py-sm">{t('audit.target')}</th><th className="px-md py-sm">{t('audit.changes')}</th></tr></thead>
          <tbody className="divide-y divide-outline-variant">{logs.map(log => {
            const changes = Object.entries(log.changes || {});
            const metadata = getUsefulMetadata(log);
            const summary = actionSummary(log, t);

            return <tr key={log._id}>
            <td className="px-md py-sm text-label-sm">{new Date(log.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</td>
            <td className="px-md py-sm"><p className="font-semibold">{log.actor?.name || 'Unknown'}</p><p className="text-label-xs text-on-surface-variant">{log.actor?.email}</p></td>
            <td className="px-md py-sm"><span className="rounded-full bg-primary/10 px-sm py-xs text-label-xs font-bold text-primary">{log.action}</span></td>
            <td className="px-md py-sm"><p className="font-semibold">{log.targetName}</p><p className="text-label-xs text-on-surface-variant">{log.targetType}</p></td>
            <td className="max-w-[360px] px-md py-sm text-label-sm">
              {!summary && changes.length === 0 && metadata.length === 0 ? (
                <span className="text-on-surface-variant">{t('audit.noChanges')}</span>
              ) : (
                <div className="space-y-xs">
                  {summary && <p className="break-words font-semibold text-on-surface">{summary}</p>}
                  {changes.map((entry) => (
                    <p className="break-words font-medium text-on-surface" key={entry[0]}>{formatChange(entry, t)}</p>
                  ))}
                  {metadata.length > 0 && (
                    <details className="text-on-surface-variant">
                      <summary className="cursor-pointer font-semibold text-primary">{t('audit.metadata')}</summary>
                      <div className="mt-xs space-y-xs rounded-lg bg-surface-container-low p-sm">
                        {metadata.map((entry) => (
                          <p className="break-words" key={entry[0]}>{formatMetadata(entry, t)}</p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </td>
          </tr>;
          })}</tbody>
        </table>
        {!isLoading && logs.length === 0 && <p className="p-xl text-center text-on-surface-variant">{t('audit.empty')}</p>}
      </div>
      {pagination.totalPages > 1 && <div className="mt-lg flex justify-center gap-sm"><button className="rounded-lg border px-md py-sm disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>{t('classes.previous')}</button><span className="px-md py-sm">{page} / {pagination.totalPages}</span><button className="rounded-lg border px-md py-sm disabled:opacity-40" disabled={page >= pagination.totalPages} onClick={() => setPage(value => value + 1)}>{t('classes.next')}</button></div>}
    </main>
    <Footer />
  </div>;
}
