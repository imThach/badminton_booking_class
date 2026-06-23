import { UserMinus, X } from "lucide-react";

export default function StudentsModal({
    classItem,
    isLoading,
    isError,
    isRemoving,
    students,
    studentsData,
    onClose,
    onRemoveStudent,
}) {
    if (!classItem) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-md py-lg backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="students-modal-title"
        >
            <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl">
                <div className="flex items-start justify-between gap-md border-b border-outline-variant px-lg py-md">
                    <div>
                        <p className="text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                            Students
                        </p>
                        <h2 id="students-modal-title" className="mt-xs text-headline-lg font-semibold text-on-surface">
                            {classItem.title}
                        </h2>
                        <p className="mt-xs text-body-md text-on-surface-variant">
                            {students.length} / {studentsData?.data?.class?.maxStudents || classItem.maxStudents || 0} enrolled
                        </p>
                    </div>
                    <button className="rounded-full p-sm text-on-surface-variant transition-colors hover:bg-surface-container-high" onClick={onClose} type="button" aria-label="Close students modal">
                        <X size={22} />
                    </button>
                </div>

                <div className="max-h-[65vh] overflow-y-auto px-lg py-lg">
                    {isLoading && (
                        <div className="flex items-center justify-center py-xl">
                            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    )}

                    {isError && (
                        <div className="rounded-lg bg-error-container px-md py-lg text-center font-semibold text-on-error-container">
                            Failed to load students.
                        </div>
                    )}

                    {!isLoading && !isError && students.length === 0 && (
                        <div className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-lg text-center text-on-surface-variant">
                            No students enrolled in this class yet.
                        </div>
                    )}

                    {!isLoading && !isError && students.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-outline-variant">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-outline-variant bg-surface-container">
                                        <th className="px-md py-sm text-label-sm text-on-surface-variant">Student</th>
                                        <th className="px-md py-sm text-label-sm text-on-surface-variant">Email</th>
                                        <th className="px-md py-sm text-label-sm text-on-surface-variant">Enrolled At</th>
                                        <th className="px-md py-sm text-right text-label-sm text-on-surface-variant">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {students.map((student) => (
                                        <tr key={student.enrollmentId}>
                                            <td className="px-md py-sm font-semibold text-on-surface">
                                                {student.user?.name || "Unknown"}
                                            </td>
                                            <td className="px-md py-sm text-on-surface-variant">
                                                {student.user?.email || "-"}
                                            </td>
                                            <td className="px-md py-sm text-on-surface-variant">
                                                {student.enrolledAt ? new Date(student.enrolledAt).toLocaleString() : "-"}
                                            </td>
                                            <td className="px-md py-sm text-right">
                                                <button
                                                    className="rounded-full p-sm text-error hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
                                                    disabled={isRemoving}
                                                    onClick={() => onRemoveStudent(student)}
                                                    type="button"
                                                    aria-label={`Remove ${student.user?.name || "student"}`}
                                                >
                                                    <UserMinus size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
