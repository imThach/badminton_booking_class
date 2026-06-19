import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { classApi } from "../../api/classApi.js";
import { useAuth } from "../../auth/AuthProvider.jsx";
import Header from "../../components/layout/header.jsx";
import Footer from "../../components/layout/footer.jsx";
import Icon from "../../components/common/Icon.jsx";
import Button from "../../components/common/Button.jsx";

export default function ClassDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();

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
                <main className="flex-grow flex items-center justify-center">
                    <span className="animate-spin h-10 w-10 rounded-full border-4 border-primary border-t-transparent"></span>
                </main>
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
    const progressPercent = classData.maxStudents > 0 ? Math.round((classData.currentStudents / classData.maxStudents) * 100) : 0;

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

                            <Button className="w-full h-12" onClick={() => enrollMutation.mutate()} disabled={isFull || enrollMutation.isPending}>
                                {enrollMutation.isPending ? "Enrolling..." : isFull ? "Class Full" : "Enroll Now"}
                            </Button>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}
