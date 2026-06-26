import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { getApiErrorMessage, isSessionError } from "../../api/apiError.js";
import { broadcastClassCreated, broadcastClassDeleted, removeDeletedClassFromCache } from "../../api/broadcastQueryClient.js";
import { classesApi } from "../../api/classesApi.js";
import { queryKeys } from "../../api/queryKeys.js";
import ClassFormModal from "../../components/admin/ClassFormModal.jsx";
import ClassManagementTable from "../../components/admin/ClassManagementTable.jsx";
import StudentsModal from "../../components/admin/StudentsModal.jsx";
import Button from "../../components/common/Button.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import Header from "../../components/layout/Header.jsx";
import Footer from "../../components/layout/Footer.jsx";
import { hasValidationErrors, validateClassForm } from "../../utils/formValidation.js";

const initialClassForm = {
    title: "",
    description: "",
    coachName: "",
    level: "beginner",
    startDate: "",
    schedule: "",
    location: "",
    maxStudents: "",
};

const toDateInputValue = (value) => {
    if (!value) return "";
    return new Date(value).toISOString().slice(0, 10);
};

const toClassForm = (classItem) => ({
    title: classItem.title || "",
    description: classItem.description || "",
    coachName: classItem.coachName || "",
    level: classItem.level || "beginner",
    startDate: toDateInputValue(classItem.startDate),
    schedule: classItem.schedule || "",
    location: classItem.location || "",
    maxStudents: classItem.maxStudents || "",
});

const CLASS_FORM_FIELDS = Object.keys(initialClassForm);

const buildChangedClassPayload = (nextForm, originalForm) =>
    CLASS_FORM_FIELDS.reduce((payload, field) => {
        if (String(nextForm[field] ?? "") !== String(originalForm?.[field] ?? "")) {
            payload[field] = field === "maxStudents" ? Number(nextForm[field]) : String(nextForm[field]).trim();
        }

        return payload;
    }, {});

export default function ClassManagement() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [editingClassOriginalForm, setEditingClassOriginalForm] = useState(null);
    const [studentsClass, setStudentsClass] = useState(null);
    const [classForm, setClassForm] = useState(initialClassForm);
    const [classFormErrors, setClassFormErrors] = useState({});
    const [confirm, setConfirm] = useState(null);

    const { data, isError, isLoading } = useQuery({
        queryKey: queryKeys.admin.classes,
        queryFn: () => classesApi.list(),
    });

    const selectedClassId = studentsClass?._id || studentsClass?.id;
    const {
        data: studentsData,
        isError: isStudentsError,
        isLoading: isStudentsLoading,
    } = useQuery({
        queryKey: queryKeys.admin.classStudents(selectedClassId),
        queryFn: () => classesApi.getStudents(selectedClassId),
        enabled: !!selectedClassId,
    });

    const closeConfirm = () => {
        if (confirm?.isLoading) return;
        setConfirm(null);
    };

    const showConfirm = (config) => {
        setConfirm({ ...config, isLoading: false });
    };

    const runConfirmedAction = async () => {
        if (!confirm?.onConfirm) return;
        setConfirm((current) => ({ ...current, isLoading: true }));
        try {
            await confirm.onConfirm();
        } finally {
            setConfirm(null);
        }
    };

    const invalidateClassQueries = (classId) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes });
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });

        if (classId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(classId) });
        }
    };

    const deleteMutation = useMutation({
        mutationFn: classesApi.remove,
        onSuccess: (_data, classId) => {
            toast.success("Class deleted.");
            removeDeletedClassFromCache(queryClient, classId);
            broadcastClassDeleted(classId);
            invalidateClassQueries(classId);
        },
        onError: (error) => {
            if (!isSessionError(error)) {
                toast.error(getApiErrorMessage(error, "Failed to delete class."));
            }
        },
    });

    const createMutation = useMutation({
        mutationFn: classesApi.create,
        onSuccess: (response) => {
            toast.success("Class created.");
            invalidateClassQueries();
            const classId = response?.data?.class?._id || response?.data?.class?.id;
            if (classId) {
                broadcastClassCreated(classId);
                queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(classId) });
            }
            setClassForm(initialClassForm);
            setIsAddModalOpen(false);
        },
        onError: (error) => {
            if (!isSessionError(error)) {
                toast.error(getApiErrorMessage(error, "Failed to create class."));
            }
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => classesApi.update(id, payload),
        onSuccess: (_response, variables) => {
            toast.success("Class updated.");
            invalidateClassQueries(variables.id);
            setEditingClass(null);
            setEditingClassOriginalForm(null);
            setClassForm(initialClassForm);
        },
        onError: async (error) => {
            if (!isSessionError(error)) {
                toast.error(getApiErrorMessage(error, "Failed to update class."));

                if (error.response?.status === 409 || error.response?.status === 400) {
                    try {
                        const refreshed = await queryClient.fetchQuery({
                            queryKey: queryKeys.admin.classes,
                            queryFn: () => classesApi.list(),
                        });
                        const editingClassId = editingClass?._id || editingClass?.id;
                        const refreshedClass = refreshed?.data?.classes?.find((classItem) => {
                            const classId = classItem._id || classItem.id;
                            return classId === editingClassId;
                        });

                        if (refreshedClass) {
                            const nextForm = toClassForm(refreshedClass);
                            setEditingClass(refreshedClass);
                            setEditingClassOriginalForm(nextForm);
                            setClassForm(nextForm);
                        }
                    } catch {
                        queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes });
                    }
                }
            }
        },
    });

    const removeStudentMutation = useMutation({
        mutationFn: classesApi.removeStudent,
        onSuccess: (_response, variables) => {
            toast.success("Student removed from class.");
            invalidateClassQueries(variables.classId);
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.classStudents(variables.classId) });
        },
        onError: (error) => {
            if (!isSessionError(error)) {
                toast.error(getApiErrorMessage(error, "Failed to remove student."));
            }
        },
    });

    const classes = data?.data?.classes || [];
    const students = studentsData?.data?.students || [];

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setClassForm((current) => ({
            ...current,
            [name]: value,
        }));
        setClassFormErrors((current) => ({ ...current, [name]: "" }));
    };

    const handleCloseClassModal = () => {
        if (createMutation.isPending || updateMutation.isPending) return;
        setIsAddModalOpen(false);
        setEditingClass(null);
        setEditingClassOriginalForm(null);
        setClassForm(initialClassForm);
        setClassFormErrors({});
    };

    const buildPayload = () => ({
        title: classForm.title.trim(),
        description: classForm.description.trim(),
        coachName: classForm.coachName.trim(),
        level: classForm.level,
        startDate: classForm.startDate,
        schedule: classForm.schedule.trim(),
        location: classForm.location.trim(),
        maxStudents: Number(classForm.maxStudents),
    });

    const validateClassFormBeforeSubmit = ({ requireFutureStartDate = false } = {}) => {
        const errors = validateClassForm(classForm, { requireFutureStartDate });
        setClassFormErrors(errors);
        return !hasValidationErrors(errors);
    };

    const handleCreateClass = (event) => {
        event.preventDefault();
        if (!validateClassFormBeforeSubmit({ requireFutureStartDate: true })) return;
        const payload = buildPayload();

        showConfirm({
            title: "Create this class?",
            message: `Save "${payload.title}" and make it visible to students.`,
            confirmLabel: "Create Class",
            onConfirm: () => createMutation.mutateAsync(payload),
        });
    };

    const handleEditClass = (classItem) => {
        const nextForm = toClassForm(classItem);
        setEditingClass(classItem);
        setEditingClassOriginalForm(nextForm);
        setClassForm(nextForm);
        setClassFormErrors({});
    };

    const handleUpdateClass = (event) => {
        event.preventDefault();
        if (!validateClassFormBeforeSubmit()) return;
        const payload = buildChangedClassPayload(classForm, editingClassOriginalForm);
        const id = editingClass?._id || editingClass?.id;

        if (Object.keys(payload).length === 0) {
            toast.error("No changes to save.");
            return;
        }

        showConfirm({
            title: "Save class changes?",
            message: `Update "${classForm.title}" with the new details.`,
            confirmLabel: "Save Changes",
            onConfirm: () => updateMutation.mutateAsync({
                id,
                payload: {
                    ...payload,
                    _updatedAt: editingClass?.updatedAt,
                },
            }),
        });
    };

    const handleDeleteClass = (classItem) => {
        const id = classItem._id || classItem.id;

        showConfirm({
            title: "Delete this class?",
            message: `This will permanently delete "${classItem.title}". Classes with enrolled students cannot be deleted.`,
            confirmLabel: "Delete Class",
            variant: "danger",
            onConfirm: () => deleteMutation.mutateAsync(id),
        });
    };

    const handleRemoveStudent = (student) => {
        const userId = student.user?._id || student.user?.id;

        showConfirm({
            title: "Remove this student?",
            message: `Remove ${student.user?.name || student.user?.email || "this student"} from "${studentsClass?.title}".`,
            confirmLabel: "Remove Student",
            variant: "danger",
            onConfirm: () => removeStudentMutation.mutateAsync({ classId: selectedClassId, userId }),
        });
    };

    return (
        <div className="flex min-h-screen flex-col bg-background bg-white">
            <Header />

            <main className="mx-auto w-full max-w-container-max flex-grow px-lg py-xl">
                <section className="space-y-xl">
                    <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-center">
                        <div className="space-y-xs">
                            <p className="text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                                Admin
                            </p>
                            <h1 className="text-headline-lg font-semibold text-on-surface">
                                Class Management
                            </h1>
                            <p className="text-body-md text-on-surface-variant">
                                Manage schedules, coaches, capacity, and enrollment status.
                            </p>
                        </div>

                        <Button className="px-md py-md" onClick={() => setIsAddModalOpen(true)}>
                            <Plus size={18} />
                            Add New Class
                        </Button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
                        <ClassManagementTable
                            classes={classes}
                            isDeleting={deleteMutation.isPending}
                            isError={isError}
                            isLoading={isLoading}
                            onDelete={handleDeleteClass}
                            onEdit={handleEditClass}
                            onViewStudents={setStudentsClass}
                        />
                    </div>
                </section>
            </main>

            {isAddModalOpen && (
                <ClassFormModal
                    title="Add New Class"
                    description="Create a class with schedule, coach, location, and capacity details."
                    form={classForm}
                    errors={classFormErrors}
                    isSaving={createMutation.isPending}
                    submitLabel="Create Class"
                    onChange={handleFormChange}
                    onClose={handleCloseClassModal}
                    onSubmit={handleCreateClass}
                />
            )}

            {editingClass && (
                <ClassFormModal
                    title="Edit Class"
                    description="Update schedule, coach, location, capacity, or description."
                    form={classForm}
                    errors={classFormErrors}
                    isSaving={updateMutation.isPending}
                    submitLabel="Save Changes"
                    onChange={handleFormChange}
                    onClose={handleCloseClassModal}
                    onSubmit={handleUpdateClass}
                />
            )}

            <StudentsModal
                classItem={studentsClass}
                isError={isStudentsError}
                isLoading={isStudentsLoading}
                isRemoving={removeStudentMutation.isPending}
                students={students}
                studentsData={studentsData}
                onClose={() => setStudentsClass(null)}
                onRemoveStudent={handleRemoveStudent}
            />

            <ConfirmDialog
                isOpen={!!confirm}
                title={confirm?.title}
                message={confirm?.message}
                confirmLabel={confirm?.confirmLabel}
                variant={confirm?.variant}
                isLoading={confirm?.isLoading}
                onCancel={closeConfirm}
                onConfirm={runConfirmedAction}
            />

            <Footer />
        </div>
    );
}
