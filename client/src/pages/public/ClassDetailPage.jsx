import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Banknote, Calendar, CircleAlert, Clock, Dumbbell, Heart, MessageSquareText, Star, User, Users } from "lucide-react";
import { getApiErrorMessage, isSessionError } from "../../api/apiError.js";
import { classesApi } from "../../api/classesApi.js";
import { enrollmentApi } from "../../api/enrollmentApi.js";
import { paymentApi } from "../../api/paymentApi.js";
import { experienceApi } from "../../api/experienceApi.js";
import { sessionApi } from "../../api/sessionApi.js";
import { queryKeys } from "../../api/queryKeys.js";
import { broadcastInvalidateQueries } from "../../api/broadcastQueryClient.js";
import { useAuth } from "../../auth/AuthProvider.jsx";
import Header from "../../components/layout/Header.jsx";
import Footer from "../../components/layout/Footer.jsx";
import Button from "../../components/common/Button.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { useRef, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider.jsx";

function ClassDetailSkeleton() {
    return (
        <main className="max-w-container-max mx-auto px-lg py-xl flex-grow w-full">
            <section className="mb-xl h-[400px] overflow-hidden rounded-xl bg-surface-container-high md:h-[500px]">
                <div className="flex h-full animate-pulse flex-col justify-end p-lg md:p-xl">
                    <div className="mb-sm flex gap-sm">
                        <div className="h-7 w-24 rounded-full bg-surface-container-lowest/70" />
                        <div className="h-7 w-32 rounded-full bg-surface-container-lowest/70" />
                    </div>
                    <div className="mb-md h-12 w-3/4 max-w-2xl rounded bg-surface-container-lowest/70" />
                    <div className="flex flex-wrap gap-md">
                        <div className="h-5 w-36 rounded bg-surface-container-lowest/60" />
                        <div className="h-5 w-44 rounded bg-surface-container-lowest/60" />
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-xl lg:grid-cols-12">
                <div className="flex flex-col gap-xl lg:col-span-8">
                    <div className="grid grid-cols-2 gap-md md:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
                                <div className="mx-auto mb-sm h-7 w-7 animate-pulse rounded-full bg-surface-container-high" />
                                <div className="mx-auto mb-sm h-3 w-16 animate-pulse rounded bg-surface-container" />
                                <div className="mx-auto h-5 w-20 animate-pulse rounded bg-surface-container-high" />
                            </div>
                        ))}
                    </div>

                    <section>
                        <div className="mb-md h-8 w-48 animate-pulse rounded bg-surface-container-high" />
                        <div className="space-y-sm rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-lg shadow-sm">
                            <div className="h-5 w-full animate-pulse rounded bg-surface-container" />
                            <div className="h-5 w-11/12 animate-pulse rounded bg-surface-container" />
                            <div className="h-5 w-4/5 animate-pulse rounded bg-surface-container" />
                        </div>
                    </section>
                </div>

                <aside className="lg:col-span-4">
                    <div className="sticky top-28 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-lg">
                        <div className="absolute left-0 top-0 h-1 w-full bg-surface-container-high" />
                        <div className="mb-lg flex justify-between gap-md">
                            <div className="space-y-sm">
                                <div className="h-3 w-24 animate-pulse rounded bg-surface-container" />
                                <div className="h-10 w-32 animate-pulse rounded bg-surface-container-high" />
                            </div>
                            <div className="h-12 w-20 animate-pulse rounded-lg bg-surface-container" />
                        </div>
                        <div className="h-12 w-full animate-pulse rounded-lg bg-surface-container-high" />
                    </div>
                </aside>
            </div>
        </main>
    );
}

export default function ClassDetailPage() {
    const { language, t } = useI18n();
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAuthenticated, user } = useAuth();
    const [isEnrollConfirmOpen, setIsEnrollConfirmOpen] = useState(false);
    const [isConfirmingEnroll, setIsConfirmingEnroll] = useState(false);
    const enrollConfirmInFlightRef = useRef(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    const { data: response, isLoading, isError } = useQuery({
        queryKey: queryKeys.classes.detail(id),
        queryFn: () => classesApi.getById(id),
    });

    const { data: myEnrollmentsResponse } = useQuery({
        queryKey: queryKeys.myEnrollments,
        queryFn: enrollmentApi.getMyEnrollments,
        enabled: !!isAuthenticated, // Chỉ fetch khi người dùng đã đăng nhập
    });
    const { data: reviewsResponse } = useQuery({ queryKey: ['reviews', id], queryFn: () => experienceApi.getReviews(id) });
    const { data: sessionsResponse } = useQuery({ queryKey: ['class-sessions', id], queryFn: () => sessionApi.list(id), enabled: !!isAuthenticated && user?.role === 'user' });
    const { data: bookmarksResponse } = useQuery({ queryKey: ['bookmarks'], queryFn: experienceApi.getBookmarks, enabled: !!isAuthenticated && user?.role === 'user' });
    const { data: waitlistResponse } = useQuery({ queryKey: ['waitlist'], queryFn: experienceApi.getWaitlist, enabled: !!isAuthenticated && user?.role === 'user' });

    const bookmarkMutation = useMutation({ mutationFn: () => experienceApi.toggleBookmark(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks }); broadcastInvalidateQueries(queryKeys.bookmarks); }, onError: error => toast.error(getApiErrorMessage(error, t('myClasses.trackedLoadError'))) });
    const waitlistMutation = useMutation({ mutationFn: () => experienceApi.joinWaitlist(id), onSuccess: () => { toast.success(t('myClasses.noWaitlist')); queryClient.invalidateQueries({ queryKey: queryKeys.waitlist }); broadcastInvalidateQueries(queryKeys.waitlist); }, onError: error => toast.error(getApiErrorMessage(error, t('myClasses.trackedLoadError'))) });
    const reviewMutation = useMutation({ mutationFn: data => experienceApi.saveReview(id, data), onSuccess: () => { toast.success(t('reviews.saved')); setComment(''); queryClient.invalidateQueries({ queryKey: queryKeys.reviews(id) }); broadcastInvalidateQueries(queryKeys.reviews(id)); }, onError: error => toast.error(getApiErrorMessage(error, t('reviews.saveError'))) });

    const invalidateEnrollmentQueries = () => {
        broadcastInvalidateQueries([
            queryKeys.classes.detail(id),
            queryKeys.classes.all,
            queryKeys.myEnrollments,
            queryKeys.myPayments,
            queryKeys.admin.classes,
            queryKeys.admin.dashboard,
            queryKeys.admin.classStudents(id),
        ]);

        return Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(id) }),
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.myEnrollments }),
            queryClient.invalidateQueries({ queryKey: queryKeys.myPayments }),
        ]);
    };

    const markClassAsFull = () => {
        queryClient.setQueryData(queryKeys.classes.detail(id), (currentData) => {
            const currentClass = currentData?.data?.class;

            if (!currentClass) {
                return currentData;
            }

            return {
                ...currentData,
                data: {
                    ...currentData.data,
                    class: {
                        ...currentClass,
                        currentStudents: currentClass.maxStudents,
                    },
                },
            };
        });
    };

    const enrollMutation = useMutation({
        mutationFn: () => paymentApi.createVnpayPayment(id),
        onSuccess: (paymentResponse) => {
            broadcastInvalidateQueries([
                queryKeys.classes.detail(id),
                queryKeys.classes.all,
                queryKeys.myEnrollments,
                queryKeys.myPayments,
                queryKeys.admin.classes,
                queryKeys.admin.dashboard,
                queryKeys.admin.classStudents(id),
            ]);
            window.location.assign(paymentResponse.data.paymentUrl);
        },
        onError: (error) => {
            if (isSessionError(error)) {
                toast.error("Please login to enroll in this class.");
                navigate("/login");
            } else if (error.response?.status === 409) {
                toast.error(getApiErrorMessage(error, "You are already enrolled in this class."));
                invalidateEnrollmentQueries();
            } else if (error.response?.data?.message === "This class is full") {
                markClassAsFull();
                toast.error("This class is full.");
                invalidateEnrollmentQueries();
            } else {
                toast.error(getApiErrorMessage(error, "Failed to enroll."));
                invalidateEnrollmentQueries();
            }
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <ClassDetailSkeleton />
                <Footer />
            </div>
        );
    }

    if (isError || !response?.data?.class) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-grow flex flex-col items-center justify-center text-center px-lg">
                    <CircleAlert size={64} className="text-error mb-md" />
                    <h1 className="text-headline-lg font-bold mb-sm text-on-surface">{t("detail.notFound")}</h1>
                    <p className="text-body-md text-on-surface-variant mb-lg">{t("detail.notFoundText")}</p>
                    <Button onClick={() => navigate("/")}>{t("detail.backHome")}</Button>
                </main>
                <Footer />
            </div>
        );
    }

    const classData = response.data.class;
    const formattedPrice = Number(classData.price || 250000).toLocaleString("vi-VN");
    const currentStudents = Number(classData.currentStudents ?? 0);
    const maxStudents = Number(classData.maxStudents ?? 0);
    const isFull = maxStudents > 0 && currentStudents >= maxStudents;
    const isAdmin = user?.role === "admin";
    const myEnrollments = myEnrollmentsResponse?.data?.enrollments || [];
    const isEnrolled = myEnrollments.some(enrollment => enrollment.class?._id === id || enrollment.class === id);
    const isBookmarked = (bookmarksResponse?.data?.bookmarks || []).some(entry => entry.class?._id === id);
    const isWaitlisted = (waitlistResponse?.data?.entries || []).some(entry => entry.class?._id === id);
    const now = new Date();
    const hasCompletedSession = (sessionsResponse?.data?.sessions || []).some(session => session.status !== 'cancelled' && new Date(session.endDate) <= now);
    const hasClassEnded = Boolean(classData?.endDate || classData?.startDate)
        && new Date(classData.endDate || classData.startDate) <= now;
    const canReview = hasCompletedSession || hasClassEnded;
    const reviews = reviewsResponse?.data?.reviews || [];

    const handleEnrollClick = () => {
        if (!isAuthenticated) {
            toast.error(t("detail.loginRequired"));
            navigate("/login");
            return;
        }

        if (isAdmin) {
            toast.error(t("detail.adminBlocked"));
            return;
        }

        setIsEnrollConfirmOpen(true);
    };

    const handleConfirmEnroll = async () => {
        if (enrollConfirmInFlightRef.current) return;

        enrollConfirmInFlightRef.current = true;
        setIsConfirmingEnroll(true);

        try {
            await enrollMutation.mutateAsync();
        } catch {
            // Error handling lives in the mutation callbacks.
        } finally {
            enrollConfirmInFlightRef.current = false;
            setIsConfirmingEnroll(false);
            setIsEnrollConfirmOpen(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container">
            <Header />

            <main className="max-w-container-max mx-auto px-lg py-xl flex-grow w-full">
                <section className="relative rounded-xl overflow-hidden mb-xl h-[400px] md:h-[500px]">
                    <div
                        className="bg-cover bg-center w-full h-full"
                        style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD6rCM28q44aNJ_ipqf0wCYTUOf5Y76Xqf3how_GtZX4V0G7nrDU815JdYbbnDruSZuyqlSPFhYkrW5BRjZjGxh5PM4wrkgVC2jIwPI8ZZX-UzdnpwltOwlKA6zHAtvRaCuWdaQ9narF81aBIOofZnr7MNHiu96v83HJqNijsR4amUdo9uY9pP7fCxmtGVg7adcECD-15tbmb1V7dZK5VpPPvAAkMGGWS5hnyo5QwBYVT0F1V3vYHJoBVrAK05dTb9IcmNd3dkWN7w')` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-lg md:p-xl">
                        <div className="flex items-center gap-sm mb-sm">
                            <span className="bg-secondary-container text-on-secondary-container px-md py-xs rounded-full font-label-xs text-label-xs uppercase tracking-wider">
                                {classData.level}
                            </span>
                            <span className="bg-white/20 backdrop-blur-md text-white px-md py-xs rounded-full font-label-xs text-label-xs">
                                {classData.location}
                            </span>
                        </div>
                        <h1 className="font-display-lg text-display-lg md:text-6xl text-white mb-md">{classData.title}</h1>
                        <div className="flex flex-wrap gap-md text-white/90">
                            <div className="flex items-center gap-xs"><User size={20} /><span className="font-body-md text-body-md">{classData.coachName}</span></div>
                            <div className="flex items-center gap-xs"><Clock size={20} /><span className="font-body-md text-body-md">{classData.schedule}</span></div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
                    <div className="lg:col-span-8 flex flex-col gap-xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
                                <Banknote className="text-primary mb-xs" size={28} />
                                <span className="font-label-xs text-label-xs text-outline uppercase">{t("detail.price")}</span>
                                <span className="font-title-md text-title-md">{formattedPrice}₫</span>
                            </div>
                            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
                                <Users className="text-primary mb-xs" size={28} />
                                <span className="font-label-xs text-label-xs text-outline uppercase">{t("detail.capacity")}</span>
                                <span className="font-title-md text-title-md">{classData.maxStudents} Pax</span>
                            </div>
                            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
                                <Calendar className="text-primary mb-xs" size={28} />
                                <span className="font-label-xs text-label-xs text-outline uppercase">{t("detail.started")}</span>
                                <span className="font-title-md text-title-md">
                                    {new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(classData.startDate))}
                                    {classData.endDate && <> → {new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(classData.endDate))}</>}
                                </span>
                            </div>
                            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
                                <Dumbbell className="text-primary mb-xs" size={28} />
                                <span className="font-label-xs text-label-xs text-outline uppercase">{t("detail.intensity")}</span>
                                <span className="font-title-md text-title-md">{t("detail.high")}</span>
                            </div>
                        </div>

                        <section>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">{t("detail.about")}</h2>
                            <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/20 whitespace-pre-wrap font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                                {classData.description}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm">
                            <div className="mb-lg flex flex-col justify-between gap-md sm:flex-row sm:items-center">
                                <div className="flex items-center gap-sm"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><MessageSquareText size={22} /></span><div><h2 className="text-headline-md font-bold text-on-surface">{t('reviews.title')}</h2><p className="text-body-sm text-on-surface-variant">{t('reviews.subtitle')}</p></div></div>
                                <div className="flex items-center gap-sm rounded-xl bg-primary/10 px-md py-sm text-primary"><Star size={22} fill="currentColor" /><strong className="text-title-lg">{reviewsResponse?.data?.averageRating || 0}</strong><span className="text-label-sm">({t('reviews.count', { count: reviews.length })})</span></div>
                            </div>

                            {isEnrolled && canReview && <form className="mb-lg space-y-md rounded-xl border border-primary/20 bg-primary/5 p-lg" onSubmit={event => { event.preventDefault(); reviewMutation.mutate({ rating, comment }); }}>
                                <div><p className="mb-sm font-semibold text-on-surface">{t('reviews.yourRating')}</p><div className="flex gap-xs">{[1, 2, 3, 4, 5].map(value => <button className="rounded-lg p-xs transition hover:scale-110 hover:bg-primary/10" type="button" key={value} onClick={() => setRating(value)} aria-label={t('reviews.stars', { count: value })}><Star size={30} className={value <= rating ? 'text-primary' : 'text-outline-variant'} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}</div></div>
                                <textarea className="min-h-28 w-full resize-y rounded-xl border border-outline-variant bg-white p-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" maxLength="1000" value={comment} onChange={event => setComment(event.target.value)} placeholder={t('reviews.placeholder')} />
                                <div className="flex items-center justify-between gap-md"><span className="text-label-xs text-on-surface-variant">{comment.length}/1000</span><Button type="submit" disabled={reviewMutation.isPending}>{reviewMutation.isPending ? t('reviews.submitting') : t('reviews.submit')}</Button></div>
                            </form>}
                            {isEnrolled && !canReview && <div className="mb-lg flex items-start gap-sm rounded-xl border border-outline-variant bg-surface-container-low p-md text-on-surface-variant"><Clock className="mt-0.5 shrink-0 text-primary" size={19} /><p>{t('reviews.afterSession')}</p></div>}

                            <div className="space-y-lg">{reviews.length === 0 ? <div className="rounded-xl border border-dashed border-outline-variant p-xl text-center text-on-surface-variant"><MessageSquareText className="mx-auto mb-sm opacity-50" size={30} /><p>{t('reviews.empty')}</p></div> : reviews.map(review => <article key={review._id} className="flex gap-md"><div className="h-11 w-11 shrink-0">{review.user?.avatar ? <img className="h-full w-full rounded-full object-cover" src={review.user.avatar} alt={review.user.name} /> : <span className="grid h-full w-full place-items-center rounded-full bg-primary/10 font-bold text-primary">{review.user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>}</div><div className="min-w-0 flex-1 rounded-xl border border-outline-variant/50 bg-surface-container-low p-md"><div className="mb-xs flex flex-wrap items-center justify-between gap-x-md gap-y-xs"><div><strong className="text-on-surface">{review.user?.name || t('reviews.student')}</strong><span className="ml-sm text-label-xs text-on-surface-variant">{new Date(review.updatedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium' })}</span></div><span className="flex shrink-0 text-primary">{[1, 2, 3, 4, 5].map(value => <Star key={value} size={16} fill={value <= review.rating ? 'currentColor' : 'none'} className={value <= review.rating ? 'text-primary' : 'text-outline-variant'} />)}</span></div><p className="whitespace-pre-wrap break-words text-body-md leading-relaxed text-on-surface-variant">{review.comment || <span className="italic">{t('reviews.noComment')}</span>}</p></div></article>)}</div>
                        </section>
                    </div>

                    <aside className="lg:col-span-4">
                        <div className="sticky top-28 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg p-lg overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                            <div className="flex justify-between items-start mb-lg">
                                <div>
                                    <span className="text-outline font-label-xs text-label-xs uppercase tracking-tight">{t("detail.investment")}</span>
                                    <div className="flex items-baseline gap-xs">
                                        <h3 className="font-display-lg text-display-lg text-on-surface">{formattedPrice}₫</h3><span className="font-body-md text-body-md text-outline">{t("detail.session")}</span>
                                    </div>
                                </div>
                                <div className="bg-primary/10 text-primary px-md py-xs rounded-lg text-right">
                                    <span className="font-label-sm text-label-sm block font-bold">{currentStudents} / {maxStudents}</span>
                                    <span className="font-label-xs text-[10px] uppercase">{t("detail.enrolled")}</span>
                                </div>
                            </div>

                            <Button className="w-full h-12" onClick={handleEnrollClick} disabled={isAdmin || isFull || isEnrolled || isConfirmingEnroll || enrollMutation.isPending}>
                                {isConfirmingEnroll || enrollMutation.isPending ? t("detail.enrolling") : isEnrolled ? t("detail.alreadyEnrolled") : isAdmin ? t("detail.adminCannotEnroll") : isFull ? t("detail.classFull") : t("detail.enrollNow")}
                            </Button>
                            {!isAdmin && isAuthenticated && <button onClick={() => bookmarkMutation.mutate()} className="mt-sm flex h-12 w-full items-center justify-center gap-sm rounded-xl border-2 border-primary font-bold text-primary"><Heart fill={isBookmarked ? 'currentColor' : 'none'} />{isBookmarked ? t('myClasses.removeFavorite') : t('myClasses.favoritesTab')}</button>}
                            {!isAdmin && isAuthenticated && isFull && !isEnrolled && <button disabled={isWaitlisted || waitlistMutation.isPending} onClick={() => waitlistMutation.mutate()} className="mt-sm h-12 w-full rounded-xl bg-on-surface font-bold text-white">{isWaitlisted ? t('myClasses.noWaitlist') : t('myClasses.waitlistTab')}</button>}
                        </div>
                    </aside>
                </div>
            </main>

            <ConfirmDialog
                isOpen={isEnrollConfirmOpen}
                title={t("detail.confirmTitle")}
                message={t("detail.confirmMessage", { title: classData.title })}
                confirmLabel={t("detail.confirm")}
                isLoading={isConfirmingEnroll || enrollMutation.isPending}
                onCancel={() => setIsEnrollConfirmOpen(false)}
                onConfirm={handleConfirmEnroll}
            />

            <Footer />
        </div>
    );
}
