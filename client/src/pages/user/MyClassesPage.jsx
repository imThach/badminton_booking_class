import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header.jsx";
import Footer from "../../components/layout/Footer.jsx";
import { useAuth } from "../../auth/AuthProvider.jsx";
import Button from "../../components/common/Button.jsx";
import ClassCard from "../../components/class/ClassCard.jsx";
import { useCancelEnrollment, useMyEnrollments } from "../../hooks/useEnrollment.js";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { useRef, useState } from "react";

export default function MyClassesPage() {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const { data, isError, isLoading } = useMyEnrollments({ enabled: isAuthenticated });
    const cancelEnrollment = useCancelEnrollment();
    const [cancelTarget, setCancelTarget] = useState(null);
    const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
    const cancelConfirmInFlightRef = useRef(false);

    const enrollments = data?.data?.enrollments || [];

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
                                My classes
                            </p>
                            <h1 className="mb-sm text-headline-lg font-semibold text-on-surface">
                                Welcome{user?.name ? `, ${user.name}` : ""}
                            </h1>
                            <p className="text-body-md text-on-surface-variant">
                                Track the badminton classes you have enrolled in.
                            </p>
                        </div>

                        <Button className="px-md py-sm" onClick={() => navigate("/")}>
                            Browse Classes
                        </Button>
                    </div>

                    {isLoading && (
                        <div className="flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest py-xl shadow-sm">
                            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    )}

                    {isError && (
                        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-lg py-xl text-center font-bold text-error shadow-sm">
                            Failed to load your enrolled classes.
                        </div>
                    )}

                    {!isLoading && !isError && enrollments.length === 0 && (
                        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-lg py-xl text-center shadow-sm">
                            <h2 className="mb-sm text-body-lg font-semibold text-on-surface">
                                You have not enrolled in any classes yet.
                            </h2>
                            <p className="mb-lg text-body-md text-on-surface-variant">
                                Find a class that matches your level and reserve your spot.
                            </p>
                            <Button className="px-md py-sm" onClick={() => navigate("/")}>
                                Explore Classes
                            </Button>
                        </div>
                    )}

                    {!isLoading && !isError && enrollments.length > 0 && (
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
                                                        View Details
                                                    </Button>
                                                    <Button
                                                        className="flex-1 px-md py-sm"
                                                        disabled={isConfirmingCancel || cancelEnrollment.isPending}
                                                        onClick={() => setCancelTarget({ classId, title: classItem.title })}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
            <ConfirmDialog
                isOpen={!!cancelTarget}
                title="Cancel enrollment?"
                message={`Leave "${cancelTarget?.title || "this class"}"? Your spot will be released.`}
                confirmLabel="Cancel Enrollment"
                variant="danger"
                isLoading={isConfirmingCancel || cancelEnrollment.isPending}
                onCancel={() => setCancelTarget(null)}
                onConfirm={handleConfirmCancel}
            />
            <Footer />
        </div>
    );
}
