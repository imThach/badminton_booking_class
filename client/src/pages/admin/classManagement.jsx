import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { classesApi } from "../../api/classesApi";
import ClassFormModal from "../../components/admin/ClassFormModal.jsx";
import ClassManagementTable from "../../components/admin/ClassManagementTable.jsx";
import StudentsModal from "../../components/admin/StudentsModal.jsx";
import Button from "../../components/common/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import Header from "../../components/layout/header.jsx";
import Footer from "../../components/layout/footer.jsx";

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

export default function ClassManagement() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [studentsClass, setStudentsClass] = useState(null);
    const [classForm, setClassForm] = useState(initialClassForm);
    const [confirm, setConfirm] = useState(null);

    const { data, isError, isLoading } = useQuery({
        queryKey: ["admin", "classes"],
        queryFn: () => classesApi.list(),
    });

    const selectedClassId = studentsClass?._id || studentsClass?.id;
    const {
        data: studentsData,
        isError: isStudentsError,
        isLoading: isStudentsLoading,
    } = useQuery({
        queryKey: ["admin", "classes", selectedClassId, "students"],
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

    const invalidateClassQueries = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
        queryClient.invalidateQueries({ queryKey: ["classes"] });
    };

    const deleteMutation = useMutation({
        mutationFn: classesApi.remove,
        onSuccess: () => {
            toast.success("Class deleted.");
            invalidateClassQueries();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete class.");
        },
    });

    const createMutation = useMutation({
        mutationFn: classesApi.create,
        onSuccess: () => {
            toast.success("Class created.");
            invalidateClassQueries();
            setClassForm(initialClassForm);
            setIsAddModalOpen(false);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create class.");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => classesApi.update(id, payload),
        onSuccess: () => {
            toast.success("Class updated.");
            invalidateClassQueries();
            setEditingClass(null);
            setClassForm(initialClassForm);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update class.");
        },
    });

    const removeStudentMutation = useMutation({
        mutationFn: classesApi.removeStudent,
        onSuccess: () => {
            toast.success("Student removed from class.");
            invalidateClassQueries();
            queryClient.invalidateQueries({ queryKey: ["admin", "classes", selectedClassId, "students"] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to remove student.");
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
    };

    const handleCloseClassModal = () => {
        if (createMutation.isPending || updateMutation.isPending) return;
        setIsAddModalOpen(false);
        setEditingClass(null);
        setClassForm(initialClassForm);
    };

    const buildPayload = () => ({
        ...classForm,
        maxStudents: Number(classForm.maxStudents),
    });

    const handleCreateClass = (event) => {
        event.preventDefault();
        const payload = buildPayload();

        showConfirm({
            title: "Create this class?",
            message: `Save "${payload.title}" and make it visible to students.`,
            confirmLabel: "Create Class",
            onConfirm: () => createMutation.mutateAsync(payload),
        });
    };

    const handleEditClass = (classItem) => {
        setEditingClass(classItem);
        setClassForm(toClassForm(classItem));
    };

    const handleUpdateClass = (event) => {
        event.preventDefault();
        const payload = buildPayload();
        const id = editingClass?._id || editingClass?.id;

        showConfirm({
            title: "Save class changes?",
            message: `Update "${payload.title}" with the new details.`,
            confirmLabel: "Save Changes",
            onConfirm: () => updateMutation.mutateAsync({ id, payload }),
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
        <div className="flex min-h-screen flex-col bg-background">
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
