import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  UserRound,
  UserX,
  XCircle,
} from 'lucide-react';
import Header from '../../components/layout/Header.jsx';
import Footer from '../../components/layout/Footer.jsx';
import { classesApi } from '../../api/classesApi.js';
import { sessionApi } from '../../api/sessionApi.js';
import { broadcastInvalidateQueries } from '../../api/broadcastQueryClient.js';
import { queryKeys } from '../../api/queryKeys.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

const SESSION_PAGE_SIZE = 12;
const TRANSFER_PAGE_SIZE = 10;

export default function SessionManagementPage() {
  const { language, t } = useI18n();
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState('');
  const [selected, setSelected] = useState('');
  const [sessionPage, setSessionPage] = useState(1);
  const [transferPage, setTransferPage] = useState(1);
  const [manual, setManual] = useState({ date: '', start: '', end: '' });
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';

  const classes = useQuery({
    queryKey: queryKeys.sessionClasses,
    queryFn: () => classesApi.list({ limit: 100 }),
  });

  const sessions = useQuery({
    queryKey: [...queryKeys.sessions(classId), { page: sessionPage, limit: SESSION_PAGE_SIZE }],
    queryFn: () => sessionApi.list(classId, { page: sessionPage, limit: SESSION_PAGE_SIZE }),
    enabled: !!classId,
  });

  const roster = useQuery({
    queryKey: queryKeys.roster(selected),
    queryFn: () => sessionApi.roster(selected),
    enabled: !!selected,
  });

  const transfers = useQuery({
    queryKey: [...queryKeys.sessionTransfers, { page: transferPage, limit: TRANSFER_PAGE_SIZE }],
    queryFn: () => sessionApi.transfers({ page: transferPage, limit: TRANSFER_PAGE_SIZE }),
  });

  const refresh = () => {
    const keys = [
      queryKeys.sessions(classId),
      queryKeys.roster(selected),
      ...(classId ? [queryKeys.classSessions(classId)] : []),
    ];

    keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    broadcastInvalidateQueries(keys);
  };

  const create = useMutation({
    mutationFn: sessionApi.create,
    onSuccess: () => {
      toast.success(t('attendance.sessionCreated'));
      setManual({ date: '', start: '', end: '' });
      refresh();
    },
  });

  const generate = useMutation({
    mutationFn: () => sessionApi.generate(classId),
    onSuccess: () => {
      toast.success(t('attendance.generated'));
      refresh();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || t('attendance.generateError')),
  });

  const mark = useMutation({
    mutationFn: sessionApi.mark,
    onSuccess: () => {
      refresh();
      broadcastInvalidateQueries([
        queryKeys.transferOptions,
        queryKeys.myTransfers,
      ]);
    },
  });

  const process = useMutation({
    mutationFn: sessionApi.process,
    onSuccess: () => {
      const keys = [
        queryKeys.sessionTransfers,
        queryKeys.myTransfers,
        queryKeys.transferOptions,
        queryKeys.roster(selected),
        ...(classId ? [queryKeys.sessions(classId), queryKeys.classSessions(classId)] : []),
      ];

      keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      broadcastInvalidateQueries(keys);
    },
  });

  const students = roster.data?.data?.students || [];
  const sessionItems = sessions.data?.data?.sessions || [];
  const sessionPagination = sessions.data?.data?.pagination || { page: sessionPage, totalPages: 1, total: sessionItems.length };
  const transferItems = transfers.data?.data?.transfers || [];
  const transferPagination = transfers.data?.data?.pagination || { page: transferPage, totalPages: 1, total: transferItems.length };
  const attended = students.filter((item) =>
    ['present', 'late'].includes(item.attendance?.status)
  ).length;

  const date = (value) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));

  const time = (value) =>
    new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date(value));

  const dateTime = (value) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(value))
      : '-';

  const statusClass = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-primary/10 text-primary',
    rejected: 'bg-error-container text-error',
    cancelled: 'bg-surface-container text-on-surface-variant',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-container-max space-y-lg px-lg py-xl">
        <div>
          <h1 className="text-headline-lg font-bold">{t('attendance.title')}</h1>
          <p className="text-on-surface-variant">{t('attendance.subtitle')}</p>
        </div>

        <section className="rounded-2xl border border-outline-variant bg-white p-lg shadow-sm">
          <select
            className="w-full rounded-xl border border-outline-variant p-md font-semibold"
            value={classId}
            onChange={(event) => {
              setClassId(event.target.value);
              setSelected('');
              setSessionPage(1);
            }}
          >
            <option value="">{t('attendance.selectClass')}</option>
            {(classes.data?.data?.classes || []).map((item) => (
              <option value={item._id} key={item._id}>
                {item.title}
              </option>
            ))}
          </select>

          {classId && (
            <>
              <div className="mt-md flex flex-wrap items-end gap-sm">
                <button
                  disabled={generate.isPending}
                  onClick={() => generate.mutate()}
                  className="flex items-center gap-xs rounded-xl bg-primary px-md py-sm font-bold text-white"
                >
                  <RefreshCw size={17} />
                  {t('attendance.autoGenerate')}
                </button>

                <form
                  className="flex flex-wrap items-end gap-sm"
                  onSubmit={(event) => {
                    event.preventDefault();
                    create.mutate({
                      classId,
                      startDate: `${manual.date}T${manual.start}`,
                      endDate: `${manual.date}T${manual.end}`,
                    });
                  }}
                >
                  <label className="text-label-sm">
                    {t('attendance.day')}
                    <input
                      required
                      type="date"
                      className="mt-xs block rounded-lg border p-sm"
                      value={manual.date}
                      onChange={(event) =>
                        setManual({ ...manual, date: event.target.value })
                      }
                    />
                  </label>

                  <label className="text-label-sm">
                    {t('attendance.fromTime')}
                    <input
                      required
                      type="time"
                      className="mt-xs block rounded-lg border p-sm"
                      value={manual.start}
                      onChange={(event) =>
                        setManual({ ...manual, start: event.target.value })
                      }
                    />
                  </label>

                  <label className="text-label-sm">
                    {t('attendance.toTime')}
                    <input
                      required
                      type="time"
                      className="mt-xs block rounded-lg border p-sm"
                      value={manual.end}
                      onChange={(event) =>
                        setManual({ ...manual, end: event.target.value })
                      }
                    />
                  </label>

                  <button className="rounded-lg border border-primary px-md py-sm font-bold text-primary">
                    {t('attendance.addException')}
                  </button>
                </form>
              </div>

              <div className="mt-lg grid gap-sm sm:grid-cols-2 lg:grid-cols-3">
                {sessionItems.map((item) => (
                  <button
                    onClick={() => setSelected(item._id)}
                    className={`rounded-xl border p-md text-left ${
                      selected === item._id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/10'
                        : 'hover:border-primary/50'
                    }`}
                    key={item._id}
                  >
                    <strong>{date(item.startDate)}</strong>
                    <p className="text-label-sm text-on-surface-variant">
                      {time(item.startDate)} – {time(item.endDate)}
                    </p>
                  </button>
                ))}
              </div>

              {sessionPagination.totalPages > 1 && (
                <div className="mt-md flex justify-center gap-sm">
                  <button
                    className="rounded-lg border border-outline-variant px-md py-sm font-semibold disabled:opacity-40"
                    disabled={sessionPagination.page <= 1}
                    onClick={() => {
                      setSelected('');
                      setSessionPage((value) => Math.max(value - 1, 1));
                    }}
                    type="button"
                  >
                    {t('classes.previous')}
                  </button>
                  <span className="px-md py-sm font-semibold">
                    {sessionPagination.page} / {sessionPagination.totalPages}
                  </span>
                  <button
                    className="rounded-lg border border-outline-variant px-md py-sm font-semibold disabled:opacity-40"
                    disabled={sessionPagination.page >= sessionPagination.totalPages}
                    onClick={() => {
                      setSelected('');
                      setSessionPage((value) => Math.min(value + 1, sessionPagination.totalPages));
                    }}
                    type="button"
                  >
                    {t('classes.next')}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {selected && (
          <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
            <div className="flex items-center justify-between bg-surface-container-low p-lg">
              <div>
                <h2 className="font-bold">{t('attendance.studentList')}</h2>
                <p className="text-label-sm text-on-surface-variant">
                  {t('attendance.studentCount', { count: students.length })}
                </p>
              </div>

              <div className="flex items-center gap-xs rounded-full bg-primary/10 px-md py-sm font-bold text-primary">
                <UserCheck size={18} />
                {attended}/{students.length} {t('attendance.attended')}
              </div>
            </div>

            {roster.isLoading && (
              <p className="p-lg text-center">{t('common.loading')}</p>
            )}

            {roster.isError && (
              <p className="p-lg text-center text-error">
                {t('attendance.loadError')}
              </p>
            )}

            <div className="divide-y">
              {students.map((item) => (
                <div
                  className="flex flex-col justify-between gap-md p-md sm:flex-row sm:items-center"
                  key={item.user._id}
                >
                  <div>
                    <strong>{item.user.name}</strong>
                    <p className="text-label-sm text-on-surface-variant">
                      {item.user.email}
                    </p>
                  </div>

                  <div className="flex gap-sm">
                    <button
                      onClick={() =>
                        mark.mutate({
                          sessionId: selected,
                          records: [{ userId: item.user._id, status: 'present' }],
                        })
                      }
                      className={`flex items-center gap-xs rounded-lg px-md py-sm font-bold ${
                        item.attendance?.status === 'present'
                          ? 'bg-primary text-white'
                          : 'border text-primary'
                      }`}
                    >
                      <Check size={17} />
                      {t('attendance.present')}
                    </button>

                    <button
                      onClick={() =>
                        mark.mutate({
                          sessionId: selected,
                          records: [{ userId: item.user._id, status: 'absent' }],
                        })
                      }
                      className={`flex items-center gap-xs rounded-lg px-md py-sm font-bold ${
                        item.attendance?.status === 'absent'
                          ? 'bg-error text-white'
                          : 'border text-error'
                      }`}
                    >
                      <UserX size={17} />
                      {t('attendance.absent')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-outline-variant bg-white p-lg shadow-sm">
          <div className="mb-lg flex items-center justify-between">
            <div>
              <h2 className="text-title-lg font-bold">
                {t('attendance.transferRequests')}
              </h2>
              <p className="text-label-sm text-on-surface-variant">
                {t('attendance.transferSubtitle')}
              </p>
            </div>

            <span className="rounded-full bg-surface-container px-sm py-xs text-label-sm font-bold">
              {transferPagination.total}
            </span>
          </div>

          {transfers.isLoading && (
            <p className="py-lg text-center">{t('common.loading')}</p>
          )}

          <div className="grid gap-md lg:grid-cols-2">
            {transferItems.map((item) => (
              <article
                className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
                key={item._id}
              >
                <div className="flex items-start justify-between gap-md border-b border-outline-variant bg-surface-container-low p-md">
                  <div className="flex min-w-0 items-center gap-sm">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <UserRound size={19} />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {item.user?.name || '-'}
                      </p>
                      <p className="truncate text-label-xs text-on-surface-variant">
                        {item.user?.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`${statusClass[item.status]} shrink-0 rounded-full px-sm py-xs text-label-xs font-bold`}
                  >
                    {t(`attendance.status.${item.status}`)}
                  </span>
                </div>

                <div className="space-y-md p-md">
                  <div className="grid items-center gap-sm sm:grid-cols-[1fr_auto_1fr]">
                    <div className="rounded-lg border border-outline-variant p-sm">
                      <p className="text-label-xs font-semibold uppercase text-on-surface-variant">
                        {t('attendance.sourceSession')}
                      </p>
                      <p className="mt-xs font-bold">
                        {item.fromSession?.class?.title || '-'}
                      </p>
                      <p className="mt-xs flex items-center gap-xs text-label-xs text-on-surface-variant">
                        <CalendarClock size={14} />
                        {dateTime(item.fromSession?.startDate)}
                      </p>
                    </div>

                    <ArrowRight
                      className="mx-auto rotate-90 text-primary sm:rotate-0"
                      size={20}
                    />

                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-sm">
                      <p className="text-label-xs font-semibold uppercase text-primary">
                        {t('attendance.targetSession')}
                      </p>
                      <p className="mt-xs font-bold">
                        {item.targetClass?.title ||
                          item.toSession?.class?.title ||
                          '-'}
                      </p>
                      <p className="mt-xs flex items-center gap-xs text-label-xs text-on-surface-variant">
                        <CalendarClock size={14} />
                        {dateTime(item.targetStartDate || item.toSession?.startDate)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-label-xs font-semibold uppercase text-on-surface-variant">
                      {t('attendance.reason')}
                    </p>
                    <p className="mt-xs rounded-lg bg-surface-container-low p-sm text-body-sm">
                      {item.reason || '-'}
                    </p>
                  </div>

                  <p className="text-label-xs text-on-surface-variant">
                    {t('attendance.requestedAt')}: {dateTime(item.createdAt)}
                  </p>

                  {item.status === 'pending' && (
                    <div className="flex gap-sm border-t border-outline-variant pt-md">
                      <button
                        disabled={process.isPending}
                        onClick={() =>
                          process.mutate({ id: item._id, status: 'approved' })
                        }
                        className="flex flex-1 items-center justify-center gap-xs rounded-lg bg-primary px-md py-sm font-bold text-white"
                      >
                        <CheckCircle2 size={18} />
                        {t('attendance.approve')}
                      </button>

                      <button
                        disabled={process.isPending}
                        onClick={() =>
                          process.mutate({ id: item._id, status: 'rejected' })
                        }
                        className="flex flex-1 items-center justify-center gap-xs rounded-lg border border-error px-md py-sm font-bold text-error"
                      >
                        <XCircle size={18} />
                        {t('attendance.reject')}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {!transfers.isLoading &&
            !transferItems.length && (
              <div className="rounded-xl border border-dashed border-outline-variant p-xl text-center text-on-surface-variant">
                {t('attendance.noTransferRequests')}
              </div>
            )}

          {transferPagination.totalPages > 1 && (
            <div className="mt-lg flex justify-center gap-sm">
              <button
                className="rounded-lg border border-outline-variant px-md py-sm font-semibold disabled:opacity-40"
                disabled={transferPagination.page <= 1}
                onClick={() => setTransferPage((value) => Math.max(value - 1, 1))}
                type="button"
              >
                {t('classes.previous')}
              </button>
              <span className="px-md py-sm font-semibold">
                {transferPagination.page} / {transferPagination.totalPages}
              </span>
              <button
                className="rounded-lg border border-outline-variant px-md py-sm font-semibold disabled:opacity-40"
                disabled={transferPagination.page >= transferPagination.totalPages}
                onClick={() => setTransferPage((value) => Math.min(value + 1, transferPagination.totalPages))}
                type="button"
              >
                {t('classes.next')}
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
