import { Pencil, Trash2, Users } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider.jsx";

export default function ClassManagementTable({
    classes,
    isDeleting,
    isError,
    isLoading,
    onDelete,
    onEdit,
    onViewStudents,
}) {
    const { language, t } = useI18n();
    const formatDateTime = (value) => value
        ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
        : "-";
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-xl">
                <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (isError) {
        return <div className="py-xl text-center font-bold text-error">{t("admin.loadClassesError")}</div>;
    }

    if (classes.length === 0) {
        return <div className="py-xl text-center text-on-surface-variant">{t("admin.noClasses")}</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-outline-variant bg-surface-container">
                        <th className="px-lg py-md text-label-sm text-on-surface-variant">{t("admin.class")}</th>
                        <th className="px-lg py-md text-label-sm text-on-surface-variant">{t("admin.coach")}</th>
                        <th className="px-lg py-md text-label-sm text-on-surface-variant">{t("admin.schedule")}</th>
                        <th className="px-lg py-md text-label-sm text-on-surface-variant">{t("admin.enrollment")}</th>
                        <th className="px-lg py-md text-label-sm text-on-surface-variant">{t("admin.status")}</th>
                        <th className="px-lg py-md text-right text-label-sm text-on-surface-variant">{t("admin.actions")}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                    {classes.map((item) => {
                        const id = item._id || item.id;
                        const enrolled = Number(item.currentStudents ?? 0);
                        const capacity = Number(item.maxStudents ?? 0);
                        const percent = capacity > 0 ? Math.min(Math.max(Math.round((enrolled / capacity) * 100), 0), 100) : 0;
                        const full = capacity > 0 && enrolled >= capacity;

                        return (
                            <tr key={id} className="transition-colors hover:bg-surface-container-low">
                                <td className="px-lg py-md">
                                    <p className="font-semibold text-on-surface">{item.title}</p>
                                    <p className="text-label-xs uppercase text-on-surface-variant">{t(`common.${item.level}`)}</p>
                                </td>
                                <td className="px-lg py-md text-on-surface-variant">{item.coachName}</td>
                                <td className="px-lg py-md text-on-surface-variant">
                                    <p>{item.schedule}</p>
                                    <p className="mt-xs text-label-xs">{formatDateTime(item.startDate)}{item.endDate && <> → {formatDateTime(item.endDate)}</>}</p>
                                </td>
                                <td className="px-lg py-md">
                                    <div className="flex items-center gap-md">
                                        <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-container-high">
                                            <div className={`${full ? "bg-error" : "bg-primary"} h-full`} style={{ width: `${percent}%` }} />
                                        </div>
                                        <span className="text-label-sm text-on-surface-variant">
                                            {enrolled}/{capacity}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-lg py-md">
                                    <span className={`${full ? "bg-error-container text-on-error-container" : "bg-surface-container text-primary"} rounded-full px-md py-xs text-label-xs font-bold uppercase`}>
                                        {full ? t("admin.full") : t("admin.active")}
                                    </span>
                                </td>
                                <td className="px-lg py-md text-right">
                                    <button className="rounded-full p-sm text-primary hover:bg-primary-container/10" onClick={() => onViewStudents(item)} type="button" aria-label={`View students for ${item.title}`}>
                                        <Users size={18} />
                                    </button>
                                    <button className="ml-xs rounded-full p-sm text-on-surface-variant hover:bg-surface-container-high" onClick={() => onEdit(item)} type="button" aria-label={`Edit ${item.title}`}>
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        className="ml-xs rounded-full p-sm text-error hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
                                        disabled={isDeleting}
                                        onClick={() => onDelete(item)}
                                        type="button"
                                        aria-label={`Delete ${item.title}`}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
