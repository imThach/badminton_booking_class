import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Download, GraduationCap, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboardApi.js';
import { queryKeys } from '../../api/queryKeys.js';
import Header from '../../components/layout/Header.jsx';
import Footer from '../../components/layout/Footer.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';

const money = (value, language) =>
    new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value || 0);

function LineChart({ rows, language }) {
    const max = Math.max(...rows.map((row) => row.revenue), 1);
    const points = rows
        .map((row, index) => `${index * 200},${210 - (row.revenue / max) * 180}`)
        .join(' ');
    const area = `0,230 ${points} ${(rows.length - 1) * 200},230`;

    return (
        <div className="mt-lg">
            <svg
                viewBox="0 0 1000 240"
                preserveAspectRatio="none"
                className="h-60 w-full overflow-visible"
                role="img"
            >
                <defs>
                    <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity=".25" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[50, 100, 150, 200].map((y) => (
                    <line
                        key={y}
                        x1="0"
                        x2="1000"
                        y1={y}
                        y2={y}
                        stroke="var(--color-outline-variant)"
                        strokeWidth="1"
                    />
                ))}
                <polygon points={area} fill="url(#revenue-gradient)" />
                <polyline
                    points={points}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="4"
                    vectorEffect="non-scaling-stroke"
                />
                {rows.map((row, index) => (
                    <circle
                        key={row.month}
                        cx={index * 200}
                        cy={210 - (row.revenue / max) * 180}
                        r="5"
                        fill="var(--color-primary)"
                    >
                        <title>{money(row.revenue, language)}</title>
                    </circle>
                ))}
            </svg>
            <div className="grid grid-cols-6 text-center text-label-xs font-semibold uppercase text-on-surface-variant">
                {rows.map((row) => (
                    <span key={row.month}>
                        {new Intl.DateTimeFormat(language, { month: 'short' }).format(
                            new Date(`${row.month}-02`)
                        )}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    const { t, language } = useI18n();
    const { data, isLoading, isError } = useQuery({
        queryKey: queryKeys.admin.dashboard,
        queryFn: dashboardApi.overview,
    });

    const dashboard = data?.data;
    const summary = dashboard?.summary || {};
    const monthly = dashboard?.monthly || [];
    const upcoming = dashboard?.upcomingClasses || [];

    const exportCsv = () => {
        const locale = language === 'vi' ? 'vi-VN' : 'en-US';
        const now = new Date();
        const monthLabel = (value) =>
            new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
                new Date(`${value}-02`)
            );
        const dateTimeLabel = (value) =>
            new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
                new Date(value)
            );

        const rows = [
            [t('dashboard.exportTitle')],
            [t('dashboard.exportedAt'), dateTimeLabel(now)],
            [],
            [t('dashboard.exportSummary')],
            [t('dashboard.totalRevenue'), Number(summary.totalRevenue || 0)],
            [t('dashboard.newStudents'), Number(summary.newStudents || 0)],
            [t('dashboard.upcomingClasses'), Number(summary.upcomingClasses || 0)],
            [t('dashboard.occupancy'), `${summary.occupancyRate || 0}%`],
            [t('dashboard.activeEnrollments'), `${summary.activeEnrollments || 0}/${summary.totalCapacity || 0}`],
            [],
            [t('dashboard.exportMonthly')],
            [
                t('dashboard.exportMonth'),
                t('dashboard.exportRevenue'),
                t('dashboard.exportPayments'),
                t('dashboard.exportNewStudents'),
            ],
            ...monthly.map((row) => [
                monthLabel(row.month),
                Number(row.revenue || 0),
                Number(row.payments || 0),
                Number(row.newStudents || 0),
            ]),
            [],
            [t('dashboard.upcomingScheduled')],
            [
                t('dashboard.class'),
                t('dashboard.coach'),
                t('dashboard.date'),
                t('dashboard.exportEndDate'),
                t('dashboard.enrollment'),
            ],
            ...upcoming.map((item) => [
                item.title,
                item.coach?.name || item.coachName,
                dateTimeLabel(item.startDate),
                item.endDate ? dateTimeLabel(item.endDate) : '',
                `${item.currentStudents || 0}/${item.maxStudents || 0}`,
            ]),
        ];

        const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
        const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `badminton-dashboard-${now.toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };

    const cards = [
        { label: t('dashboard.totalRevenue'), value: money(summary.totalRevenue, language), icon: TrendingUp },
        { label: t('dashboard.newStudents'), value: summary.newStudents || 0, icon: Users },
        { label: t('dashboard.upcomingClasses'), value: summary.upcomingClasses || 0, icon: CalendarDays },
        { label: t('dashboard.occupancy'), value: `${summary.occupancyRate || 0}%`, icon: GraduationCap },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="mx-auto w-full max-w-container-max flex-1 space-y-xl px-lg py-xl">
                <div className="flex flex-col justify-between gap-md md:flex-row md:items-center">
                    <div>
                        <h1 className="text-headline-lg font-bold text-on-surface">{t('dashboard.title')}</h1>
                        <p className="mt-xs text-on-surface-variant">{t('dashboard.subtitle')}</p>
                    </div>
                    <button
                        onClick={exportCsv}
                        disabled={!monthly.length}
                        className="flex items-center justify-center gap-sm rounded-lg bg-primary px-md py-sm font-semibold text-on-primary disabled:opacity-50"
                    >
                        <Download size={18} />
                        {t('dashboard.export')}
                    </button>
                </div>
                {isLoading && (
                    <div className="rounded-xl bg-surface-container-lowest p-xl text-center text-on-surface-variant">
                        {t('common.loading')}
                    </div>
                )}
                {isError && (
                    <div className="rounded-xl bg-error-container p-lg text-on-error-container">
                        {t('dashboard.loadError')}
                    </div>
                )}
                {dashboard && (
                    <>
                        <section className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
                            {cards.map(({ label, value, icon: Icon }) => (
                                <article
                                    key={label}
                                    className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm"
                                >
                                    <div className="mb-lg grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                                        <Icon size={21} />
                                    </div>
                                    <p className="text-body-sm font-medium text-on-surface-variant">{label}</p>
                                    <p className="mt-xs text-headline-md font-bold text-on-surface">{value}</p>
                                </article>
                            ))}
                        </section>
                        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm">
                            <h2 className="font-semibold text-on-surface">{t('dashboard.revenueTrend')}</h2>
                            <p className="text-body-sm text-on-surface-variant">{t('dashboard.lastSixMonths')}</p>
                            <LineChart rows={monthly} language={language} />
                        </section>
                        <section className="grid gap-lg lg:grid-cols-2">
                            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm">
                                <h2 className="font-semibold text-on-surface">{t('dashboard.studentsTrend')}</h2>
                                <div className="mt-lg flex h-52 items-end gap-md">
                                    {monthly.map((row) => {
                                        const max = Math.max(
                                            ...monthly.map((item) => item.newStudents),
                                            1
                                        );
                                        return (
                                            <div
                                                key={row.month}
                                                className="flex h-full flex-1 flex-col justify-end gap-xs text-center"
                                            >
                                                <span className="text-label-xs font-bold text-on-surface">
                                                    {row.newStudents}
                                                </span>
                                                <div
                                                    className="min-h-1 rounded-t-md bg-primary"
                                                    style={{
                                                        height: `${Math.max(
                                                            (row.newStudents / max) * 85,
                                                            3
                                                        )}%`,
                                                    }}
                                                />
                                                <span className="text-label-xs uppercase text-on-surface-variant">
                                                    {new Intl.DateTimeFormat(language, {
                                                        month: 'short',
                                                    }).format(new Date(`${row.month}-02`))}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                            <article className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm">
                                <h2 className="font-semibold text-on-surface">{t('dashboard.occupancy')}</h2>
                                <div className="flex flex-1 items-center justify-center gap-xl py-lg">
                                    <div
                                        className="grid h-40 w-40 place-items-center rounded-full"
                                        style={{
                                            background: `conic-gradient(var(--color-primary) ${Math.min(
                                                summary.occupancyRate || 0,
                                                100
                                            )}%, var(--color-surface-container) 0)`,
                                        }}
                                    >
                                        <div className="grid h-28 w-28 place-items-center rounded-full bg-surface-container-lowest text-center">
                                            <div>
                                                <strong className="text-headline-md text-on-surface">
                                                    {summary.occupancyRate || 0}%
                                                </strong>
                                                <p className="text-label-xs text-on-surface-variant">
                                                    {t('dashboard.filled')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-on-surface-variant">
                                            {t('dashboard.activeEnrollments')}
                                        </p>
                                        <strong className="text-headline-md text-on-surface">
                                            {summary.activeEnrollments || 0}/{summary.totalCapacity || 0}
                                        </strong>
                                    </div>
                                </div>
                            </article>
                        </section>
                        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
                            <div className="flex items-center justify-between border-b border-outline-variant p-lg">
                                <h2 className="font-semibold text-on-surface">
                                    {t('dashboard.upcomingScheduled')}
                                </h2>
                                <Link className="font-semibold text-primary" to="/admin/classes">
                                    {t('dashboard.viewAll')}
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface-container-low">
                                        <tr>
                                            {['class', 'coach', 'date', 'enrollment'].map((key) => (
                                                <th
                                                    key={key}
                                                    className="px-lg py-md text-label-xs uppercase text-on-surface-variant"
                                                >
                                                    {t(`dashboard.${key}`)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {upcoming.map((item) => {
                                            const rate = item.maxStudents
                                                ? Math.round(
                                                      (item.currentStudents || 0) /
                                                          item.maxStudents *
                                                          100
                                                  )
                                                : 0;
                                            return (
                                                <tr
                                                    key={item._id}
                                                    className="border-t border-outline-variant"
                                                >
                                                    <td className="px-lg py-md">
                                                        <strong className="text-on-surface">
                                                            {item.title}
                                                        </strong>
                                                        <p className="text-body-sm text-on-surface-variant">
                                                            {item.location}
                                                        </p>
                                                    </td>
                                                    <td className="px-lg py-md text-on-surface">
                                                        {item.coach?.name || item.coachName}
                                                    </td>
                                                    <td className="px-lg py-md text-on-surface-variant">
                                                        {new Intl.DateTimeFormat(language, {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short',
                                                        }).format(new Date(item.startDate))}
                                                    </td>
                                                    <td className="px-lg py-md">
                                                        <div className="mb-xs flex justify-between text-label-xs text-on-surface">
                                                            <span>
                                                                {item.currentStudents || 0}/
                                                                {item.maxStudents}
                                                            </span>
                                                            <span>{rate}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-32 rounded-full bg-surface-container">
                                                            <div
                                                                className="h-full rounded-full bg-primary"
                                                                style={{
                                                                    width: `${Math.min(rate, 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {!upcoming.length && (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="p-xl text-center text-on-surface-variant"
                                                >
                                                    {t('dashboard.noUpcoming')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
