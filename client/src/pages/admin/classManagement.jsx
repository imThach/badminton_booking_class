import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { getApiErrorMessage, isSessionError } from "../../api/apiError.js";
import { broadcastClassCreated, broadcastClassDeleted, broadcastInvalidateQueries, removeDeletedClassFromCache } from "../../api/broadcastQueryClient.js";
import { classesApi } from "../../api/classesApi.js";
import { coachesApi } from "../../api/coachesApi.js";
import { queryKeys } from "../../api/queryKeys.js";
import ClassFormModal from "../../components/admin/ClassFormModal.jsx";
import ClassManagementTable from "../../components/admin/ClassManagementTable.jsx";
import StudentsModal from "../../components/admin/StudentsModal.jsx";
import CoachManagement from "../../components/admin/CoachManagement.jsx";
import Button from "../../components/common/Button.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import Header from "../../components/layout/Header.jsx";
import Footer from "../../components/layout/Footer.jsx";
import { hasValidationErrors, validateClassForm } from "../../utils/formValidation.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

const initialClassForm = {
    title: "",
    description: "",
    coach: "",
    level: "beginner",
    startDate: "",
    endDate: "",
    schedule: "",
    location: "",
    maxStudents: "",
    price: "250000",
};

const toDateInputValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const getTodayDateInputValue = () => {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60_000;
    return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const toClassForm = (classItem) => ({
    title: classItem.title || "",
    description: classItem.description || "",
    coach: classItem.coach?._id || classItem.coach || "",
    level: classItem.level || "beginner",
    startDate: toDateInputValue(classItem.startDate),
    endDate: toDateInputValue(classItem.endDate),
    schedule: classItem.schedule || "",
    location: classItem.location || "",
    maxStudents: classItem.maxStudents || "",
    price: classItem.price || 250000,
});

const CLASS_FORM_FIELDS = Object.keys(initialClassForm);

const buildChangedClassPayload = (nextForm, originalForm) =>
    CLASS_FORM_FIELDS.reduce((payload, field) => {
        if (String(nextForm[field] ?? "") !== String(originalForm?.[field] ?? "")) {
            payload[field] = ["maxStudents", "price"].includes(field) ? Number(nextForm[field]) : String(nextForm[field]).trim();
        }

        return payload;
    }, {});

export default function ClassManagement() {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [editingClassOriginalForm, setEditingClassOriginalForm] = useState(null);
    const [studentsClass, setStudentsClass] = useState(null);
    const [classForm, setClassForm] = useState(initialClassForm);
    const [classFormErrors, setClassFormErrors] = useState({});
    const [confirm, setConfirm] = useState(null);
    const [activeTab, setActiveTab] = useState("classes");

    const { data, isError, isLoading } = useQuery({
        queryKey: queryKeys.admin.classes,
        queryFn: () => classesApi.list(),
    });

    const { data: coachesData, isLoading: isCoachesLoading } = useQuery({
        queryKey: queryKeys.admin.coaches,
        queryFn: () => coachesApi.list({ includeInactive: true }),
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
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.coaches });
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.sessionClasses });
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });

        if (classId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(classId) });
        }

        broadcastInvalidateQueries([
            queryKeys.admin.classes,
            queryKeys.admin.coaches,
            queryKeys.classes.all,
            queryKeys.sessionClasses,
            queryKeys.admin.dashboard,
            ...(classId ? [queryKeys.classes.detail(classId), queryKeys.admin.classStudents(classId), queryKeys.classSessions(classId), queryKeys.sessions(classId)] : []),
        ]);
    };

    const deleteMutation = useMutation({
        mutationFn: classesApi.remove,
        onSuccess: (_data, classId) => {
            toast.success(t("admin.deleted"));
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
            toast.success(t("admin.created"));
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
            toast.success(t("admin.updated"));
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
            toast.success(t("admin.studentRemoved"));
            invalidateClassQueries(variables.classId);
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.classStudents(variables.classId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.myEnrollments });
            broadcastInvalidateQueries([
                queryKeys.admin.classStudents(variables.classId),
                queryKeys.myEnrollments,
                queryKeys.classes.detail(variables.classId),
                queryKeys.classes.all,
            ]);
        },
        onError: (error) => {
            if (!isSessionError(error)) {
                toast.error(getApiErrorMessage(error, "Failed to remove student."));
            }
        },
    });

    const saveCoachMutation = useMutation({
        mutationFn: ({ id, payload }) => id ? coachesApi.update(id, payload) : coachesApi.create(payload),
        onSuccess: () => {
            toast.success(t("admin.coachSaved"));
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.coaches });
            invalidateClassQueries();
            broadcastInvalidateQueries([queryKeys.admin.coaches, queryKeys.admin.classes, queryKeys.classes.all]);
        },
        onError: (error) => !isSessionError(error) && toast.error(getApiErrorMessage(error, "Failed to save coach.")),
    });

    const deleteCoachMutation = useMutation({
        mutationFn: coachesApi.remove,
        onSuccess: () => {
            toast.success(t("admin.coachDeleted"));
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.coaches });
            broadcastInvalidateQueries(queryKeys.admin.coaches);
        },
        onError: (error) => !isSessionError(error) && toast.error(getApiErrorMessage(error, "Failed to delete coach.")),
    });

    const classes = data?.data?.classes || [];
    const coaches = coachesData?.data?.coaches || [];
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
        coach: classForm.coach,
        level: classForm.level,
        startDate: classForm.startDate,
        endDate: classForm.endDate,
        schedule: classForm.schedule.trim(),
        location: classForm.location.trim(),
        maxStudents: Number(classForm.maxStudents),
        price: Number(classForm.price),
    });

    const validateClassFormBeforeSubmit = ({ requireFutureStartDate = false } = {}) => {
        const errors = validateClassForm(classForm, { requireFutureStartDate, t });
        setClassFormErrors(errors);
        return !hasValidationErrors(errors);
    };

    const handleCreateClass = (event) => {
        event.preventDefault();
        if (!validateClassFormBeforeSubmit({ requireFutureStartDate: true })) return;
        const payload = buildPayload();

        showConfirm({
            title: t("admin.createConfirm"),
            message: t("admin.createMessage", { title: payload.title }),
            confirmLabel: t("admin.createClass"),
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
            toast.error(t("admin.noChanges"));
            return;
        }

        showConfirm({
            title: t("admin.updateConfirm"),
            message: t("admin.updateMessage", { title: classForm.title }),
            confirmLabel: t("admin.saveChanges"),
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
            title: t("admin.deleteConfirm"),
            message: t("admin.deleteMessage", { title: classItem.title }),
            confirmLabel: t("admin.deleteClass"),
            variant: "danger",
            onConfirm: () => deleteMutation.mutateAsync(id),
        });
    };

    const handleRemoveStudent = (student) => {
        const userId = student.user?._id || student.user?.id;

        showConfirm({
            title: t("admin.removeConfirm"),
            message: t("admin.removeMessage", { student: student.user?.name || student.user?.email || t("admin.student"), title: studentsClass?.title }),
            confirmLabel: t("admin.removeStudent"),
            variant: "danger",
            onConfirm: () => removeStudentMutation.mutateAsync({ classId: selectedClassId, userId }),
        });
    };

    const handleDeleteCoach = (coach) => showConfirm({
        title: t("admin.deleteCoachConfirm"),
        message: t("admin.deleteCoachMessage", { name: coach.name }),
        confirmLabel: t("admin.deleteCoach"),
        variant: "danger",
        onConfirm: () => deleteCoachMutation.mutateAsync(coach._id),
    });

    return (
        <div className="flex min-h-screen flex-col bg-background bg-white">
            <Header />

            <main className="mx-auto w-full max-w-container-max flex-grow px-lg py-xl">
                <section className="space-y-xl">
                    <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-center">
                        <div className="space-y-xs">
                            <p className="text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                                {t("admin.label")}
                            </p>
                            <h1 className="text-headline-lg font-semibold text-on-surface">
                                {t("admin.title")}
                            </h1>
                            <p className="text-body-md text-on-surface-variant">
                                {t("admin.subtitle")}
                            </p>
                        </div>

                        {activeTab === "classes" && <Button className="px-md py-md" onClick={() => setIsAddModalOpen(true)}>
                            <Plus size={18} />
                            {t("admin.addClass")}
                        </Button>}
                    </div>

                    <div className="flex gap-xs border-b border-outline-variant">
                        <button onClick={() => setActiveTab("classes")} className={`px-md py-sm font-semibold ${activeTab === "classes" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant"}`}>{t("admin.classesTab")}</button>
                        <button onClick={() => setActiveTab("coaches")} className={`px-md py-sm font-semibold ${activeTab === "coaches" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant"}`}>{t("admin.coachesTab")}</button>
                    </div>

                    {activeTab === "classes" ? <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
                        <ClassManagementTable
                            classes={classes}
                            isDeleting={deleteMutation.isPending}
                            isError={isError}
                            isLoading={isLoading}
                            onDelete={handleDeleteClass}
                            onEdit={handleEditClass}
                            onViewStudents={setStudentsClass}
                        />
                    </div> : <CoachManagement coaches={coaches} isLoading={isCoachesLoading} isSaving={saveCoachMutation.isPending} onSave={(id, payload) => saveCoachMutation.mutateAsync({ id, payload })} onDelete={handleDeleteCoach} />}
                </section>
            </main>

            {isAddModalOpen && (
                <ClassFormModal
                    title={t("admin.addClass")}
                    description={t("admin.addDescription")}
                    form={classForm}
                    errors={classFormErrors}
                    isSaving={createMutation.isPending}
                    minStartDate={getTodayDateInputValue()}
                    submitLabel={t("admin.createClass")}
                    onChange={handleFormChange}
                    onClose={handleCloseClassModal}
                    onSubmit={handleCreateClass}
                    coaches={coaches}
                />
            )}

            {editingClass && (
                <ClassFormModal
                    title={t("admin.editClass")}
                    description={t("admin.editDescription")}
                    form={classForm}
                    errors={classFormErrors}
                    isSaving={updateMutation.isPending}
                    submitLabel={t("admin.saveChanges")}
                    onChange={handleFormChange}
                    onClose={handleCloseClassModal}
                    onSubmit={handleUpdateClass}
                    coaches={coaches}
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
