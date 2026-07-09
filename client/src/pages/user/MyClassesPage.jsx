import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Header from "../../components/layout/Header.jsx";
import Footer from "../../components/layout/Footer.jsx";
import { useAuth } from "../../auth/AuthProvider.jsx";
import Button from "../../components/common/Button.jsx";
import ClassCard from "../../components/class/ClassCard.jsx";
import { useCancelEnrollment, useMyEnrollments } from "../../hooks/useEnrollment.js";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { useRef, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider.jsx";
import { experienceApi } from "../../api/experienceApi.js";
import { queryKeys } from "../../api/queryKeys.js";
import { broadcastInvalidateQueries } from "../../api/broadcastQueryClient.js";

export default function MyClassesPage() {
    const { t } = useI18n();
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedTab = searchParams.get("tab");
    const activeTab = ["classes", "favorites", "waitlist"].includes(requestedTab) ? requestedTab : "classes";
    const { data, isError, isLoading } = useMyEnrollments({ enabled: isAuthenticated });
    const cancelEnrollment = useCancelEnrollment();
    const [cancelTarget, setCancelTarget] = useState(null);
    const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
    const cancelConfirmInFlightRef = useRef(false);

    const enrollments = data?.data?.enrollments || [];
    const bookmarks = useQuery({ queryKey: queryKeys.bookmarks, queryFn: experienceApi.getBookmarks, enabled: isAuthenticated && user?.role === "user" });
    const waitlist = useQuery({ queryKey: queryKeys.waitlist, queryFn: experienceApi.getWaitlist, enabled: isAuthenticated && user?.role === "user" });
    const removeBookmark = useMutation({ mutationFn: experienceApi.toggleBookmark, onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks }); broadcastInvalidateQueries(queryKeys.bookmarks); } });
    const leaveWaitlist = useMutation({ mutationFn: experienceApi.leaveWaitlist, onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.waitlist }); broadcastInvalidateQueries(queryKeys.waitlist); toast.success(t("myClasses.leftWaitlist")); } });
    const trackedItems = activeTab === "favorites" ? bookmarks.data?.data?.bookmarks || [] : waitlist.data?.data?.entries || [];
    const trackedQuery = activeTab === "favorites" ? bookmarks : waitlist;
    const trackedAction = activeTab === "favorites" ? removeBookmark : leaveWaitlist;

    const handleConfirmCancel = async () => {
        if (!cancelTarget?.classId || cancelConfirmInFlightRef.current) return;

        cancelConfirmInFlightRef.current = true;
        setIsConfirmingCancel(true);

        try {
            await cancelEnrollment.mutateAsync(cancelTarget.classId);
        } catch {
            // Error handling lives in useCancelEnrollment.
        } finally {
            cancelConfirmInFlightRef.current = false;
            setIsConfirmingCancel(false);
            setCancelTarget(null);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-surface bg-white">
            <Header />
            <main className="mx-auto w-full max-w-container-max flex-grow px-lg py-xl">
                <section className="space-y-xl">
                    <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-end">
                        <div>
                            <p className="mb-sm text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                                {t("myClasses.label")}
                            </p>
                            <h1 className="mb-sm text-headline-lg font-semibold text-on-surface">
                                {user?.name ? t("myClasses.welcome", { name: user.name }) : t("myClasses.welcomeNoName")}
                            </h1>
                            <p className="text-body-md text-on-surface-variant">
                                {t("myClasses.subtitle")}
                            </p>
                        </div>

                        <Button className="px-md py-sm" onClick={() => navigate("/")}>
                            {t("myClasses.browse")}
                        </Button>
                    </div>

                    {user?.role === "user" && (
                        <div className="flex flex-wrap gap-sm border-b border-outline-variant">
                            {[
                                ["classes", t("myClasses.enrolledTab")],
                                ["favorites", t("myClasses.favoritesTab")],
                                ["waitlist", t("myClasses.waitlistTab")],
                            ].map(([value, label]) => (
                                <button key={value} className={`border-b-2 px-md py-sm font-bold ${activeTab === value ? "border-primary text-primary" : "border-transparent text-on-surface-variant"}`} onClick={() => setSearchParams(value === "classes" ? {} : { tab: value })} type="button">{label}</button>
                            ))}
                        </div>
                    )}

                    {activeTab === "classes" && isLoading && (
                        <div className="flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest py-xl shadow-sm">
                            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    )}

                    {activeTab === "classes" && isError && (
                        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-lg py-xl text-center font-bold text-error shadow-sm">
                            {t("myClasses.loadError")}
                        </div>
                    )}

                    {activeTab === "classes" && !isLoading && !isError && enrollments.length === 0 && (
                        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-lg py-xl text-center shadow-sm">
                            <h2 className="mb-sm text-body-lg font-semibold text-on-surface">
                                {t("myClasses.emptyTitle")}
                            </h2>
                            <p className="mb-lg text-body-md text-on-surface-variant">
                                {t("myClasses.emptyText")}
                            </p>
                            <Button className="px-md py-sm" onClick={() => navigate("/")}>
                                {t("myClasses.explore")}
                            </Button>
                        </div>
                    )}

                    {activeTab === "classes" && !isLoading && !isError && enrollments.length > 0 && (
                        <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
                            {enrollments.map((enrollment) => {
                                const classItem = enrollment.class;
                                const classId = classItem?._id || classItem?.id;

                                if (!classItem || !classId) return null;

                                return (
                                    <div key={enrollment._id || enrollment.enrollmentId}>
                                        <ClassCard
                                            item={classItem}
                                            actionSlot={
                                                <div className="flex w-full gap-sm">
                                                    <Button
                                                        className="flex-1 px-md py-sm"
                                                        onClick={() => navigate(`/classes/${classId}`)}
                                                        variant="primary"
                                                    >
                                                        {t("common.viewDetails")}
                                                    </Button>
                                                    <Button
                                                        className="flex-1 px-md py-sm"
                                                        disabled={isConfirmingCancel || cancelEnrollment.isPending}
                                                        onClick={() => setCancelTarget({ classId, title: classItem.title })}
                                                    >
                                                        {t("myClasses.cancel")}
                                                    </Button>
                                                </div>
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab !== "classes" && trackedQuery.isLoading && <div className="py-xl text-center">{t("common.loading")}</div>}
                    {activeTab !== "classes" && trackedQuery.isError && <div className="rounded-xl border bg-white p-xl text-center text-error">{t("myClasses.trackedLoadError")}</div>}
                    {activeTab !== "classes" && !trackedQuery.isLoading && !trackedQuery.isError && trackedItems.length === 0 && <div className="rounded-xl border bg-white p-xl text-center text-on-surface-variant">{activeTab === "favorites" ? t("myClasses.noFavorites") : t("myClasses.noWaitlist")}</div>}
                    {activeTab !== "classes" && trackedItems.length > 0 && (
                        <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
                            {trackedItems.map(entry => {
                                const item = entry.class;
                                if (!item) return null;
                                return <ClassCard key={entry._id} item={item} actionSlot={<div className="flex w-full gap-sm"><Button className="flex-1" onClick={() => navigate(`/classes/${item._id}`)}>{t("common.viewDetails")}</Button><Button className="flex-1" disabled={trackedAction.isPending} onClick={() => trackedAction.mutate(item._id)}>{activeTab === "favorites" ? t("myClasses.removeFavorite") : t("myClasses.leaveWaitlist")}</Button></div>} />;
                            })}
                        </div>
                    )}
                </section>
            </main>
            <ConfirmDialog
                isOpen={!!cancelTarget}
                title={t("myClasses.cancelTitle")}
                message={t("myClasses.cancelMessage", { title: cancelTarget?.title || t("myClasses.label") })}
                confirmLabel={t("myClasses.cancelConfirm")}
                variant="danger"
                isLoading={isConfirmingCancel || cancelEnrollment.isPending}
                onCancel={() => setCancelTarget(null)}
                onConfirm={handleConfirmCancel}
            />
            <Footer />
        </div>
    );
}
