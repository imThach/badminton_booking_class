import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { classApi } from "../../api/classApi.js";
import { useAuth } from "../../auth/AuthProvider.jsx";
import Header from "../../components/layout/header.jsx";
import Footer from "../../components/layout/footer.jsx";
import Icon from "../../components/common/Icon.jsx";
import Button from "../../components/common/Button.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { useState } from "react";

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
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAuthenticated, user } = useAuth();
    const [isEnrollConfirmOpen, setIsEnrollConfirmOpen] = useState(false);

    // 1. Lấy dữ liệu chi tiết lớp học từ Backend
    const { data: response, isLoading, isError } = useQuery({
        queryKey: ["classDetail", id],
        queryFn: () => classApi.getClassDetail(id),
    });

    // 2. Logic Đăng ký tham gia (Enroll)
    const enrollMutation = useMutation({
        mutationFn: () => classApi.enrollClass(id),
        onSuccess: () => {
            toast.success("Successfully enrolled in the class!");
            // Cập nhật lại số lượng học viên
            queryClient.invalidateQueries({ queryKey: ["classDetail", id] });
            queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
        },
        onError: (error) => {
            if (error.response?.status === 401) {
                toast.error("Please login to enroll in this class.");
                navigate("/login");
            } else if (error.response?.status === 409) {
                toast.error("You are already enrolled in this class.");
            } else {
                toast.error(error.response?.data?.message || "Failed to enroll.");
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
                    <Icon name="error" size={64} className="text-error mb-md" />
                    <h1 className="text-headline-lg font-bold mb-sm text-on-surface">Class Not Found</h1>
                    <p className="text-body-md text-on-surface-variant mb-lg">The class you're looking for doesn't exist or has been removed.</p>
                    <Button onClick={() => navigate("/")}>Back to Home</Button>
                </main>
                <Footer />
            </div>
        );
    }

    const classData = response.data.class;
    const isFull = classData.currentStudents >= classData.maxStudents;
    const isAdmin = user?.role === "admin";
    const progressPercent = classData.maxStudents > 0 ? Math.round((classData.currentStudents / classData.maxStudents) * 100) : 0;

    const handleEnrollClick = () => {
        if (!isAuthenticated) {
            toast.error("Please login to enroll in this class.");
            navigate("/login");
            return;
        }

        if (isAdmin) {
            toast.error("Admins cannot enroll in classes.");
            return;
        }

        setIsEnrollConfirmOpen(true);
    };

    const handleConfirmEnroll = () => {
        setIsEnrollConfirmOpen(false);
        enrollMutation.mutate();
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container">
            <Header />

            <main className="max-w-container-max mx-auto px-lg py-xl flex-grow w-full">
                {/* Hero Section */}
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
                            <div className="flex items-center gap-xs"><Icon name="person" size={20} /><span className="font-body-md text-body-md">{classData.coachName}</span></div>
                            <div className="flex items-center gap-xs"><Icon name="schedule" size={20} /><span className="font-body-md text-body-md">{classData.schedule}</span></div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
                    {/* Main Content (Left Column) */}
                    <div className="lg:col-span-8 flex flex-col gap-xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
                                <Icon name="payments" className="text-primary mb-xs" size={28} />
                                <span className="font-label-xs text-label-xs text-outline uppercase">Price</span>
                                <span className="font-title-md text-title-md">$25.00</span>
                            </div>
                            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
                                <Icon name="group" className="text-primary mb-xs" size={28} />
                                <span className="font-label-xs text-label-xs text-outline uppercase">Capacity</span>
                                <span className="font-title-md text-title-md">{classData.maxStudents} Pax</span>
                            </div>
                            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
                                <Icon name="calendar_today" className="text-primary mb-xs" size={28} />
                                <span className="font-label-xs text-label-xs text-outline uppercase">Started</span>
                                <span className="font-title-md text-title-md">{new Date(classData.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
                                <Icon name="fitness_center" className="text-primary mb-xs" size={28} />
                                <span className="font-label-xs text-label-xs text-outline uppercase">Intensity</span>
                                <span className="font-title-md text-title-md">High</span>
                            </div>
                        </div>

                        <section>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">About this class</h2>
                            <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/20 whitespace-pre-wrap font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                                {classData.description}
                            </div>
                        </section>
                    </div>

                    {/* Sticky Sidebar (Right Column) */}
                    <aside className="lg:col-span-4">
                        <div className="sticky top-28 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg p-lg overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                            <div className="flex justify-between items-start mb-lg">
                                <div>
                                    <span className="text-outline font-label-xs text-label-xs uppercase tracking-tight">Investment</span>
                                    <div className="flex items-baseline gap-xs"><h3 className="font-display-lg text-display-lg text-on-surface">$25.00</h3><span className="font-body-md text-body-md text-outline">/ session</span></div>
                                </div>
                                <div className="bg-primary/10 text-primary px-md py-xs rounded-lg text-right">
                                    <span className="font-label-sm text-label-sm block font-bold">{classData.currentStudents} / {classData.maxStudents}</span>
                                    <span className="font-label-xs text-[10px] uppercase">Enrolled</span>
                                </div>
                            </div>

                            <Button className="w-full h-12" onClick={handleEnrollClick} disabled={isAdmin || isFull || enrollMutation.isPending}>
                                {enrollMutation.isPending ? "Enrolling..." : isAdmin ? "Admins Cannot Enroll" : isFull ? "Class Full" : "Enroll Now"}
                            </Button>
                        </div>
                    </aside>
                </div>
            </main>

            <ConfirmDialog
                isOpen={isEnrollConfirmOpen}
                title="Enroll in this class?"
                message={`Reserve your spot in "${classData.title}".`}
                confirmLabel="Enroll"
                isLoading={enrollMutation.isPending}
                onCancel={() => setIsEnrollConfirmOpen(false)}
                onConfirm={handleConfirmEnroll}
            />

            <Footer />
        </div>
    );
}
