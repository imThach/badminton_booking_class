import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { classesApi } from "../../api/classesApi";
import Button from "../../components/common/Button";
import { IoMdAdd } from "react-icons/io";
import { FaUserGroup } from "react-icons/fa6";
import { MdEdit } from "react-icons/md";
import { MdDeleteOutline } from "react-icons/md";
import { IoClose } from "react-icons/io5";
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

export default function ClassManagement() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [classForm, setClassForm] = useState(initialClassForm);
    const {
        data,
        isError,
        isLoading,
    } = useQuery({
        queryKey: ["admin", "classes"],
        queryFn: classesApi.list,
    });

    const deleteMutation = useMutation({
        mutationFn: classesApi.remove,
        onSuccess: () => {
            toast.success("Class deleted.");
            queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
            queryClient.invalidateQueries({ queryKey: ["classes"] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete class.");
        },
    });

    const createMutation = useMutation({
        mutationFn: classesApi.create,
        onSuccess: () => {
            toast.success("Class created.");
            queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
            queryClient.invalidateQueries({ queryKey: ["classes"] });
            setClassForm(initialClassForm);
            setIsAddModalOpen(false);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create class.");
        },
    });

    const classes = data?.data?.classes || [];

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setClassForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleCloseAddModal = () => {
        if (createMutation.isPending) return;
        setIsAddModalOpen(false);
        setClassForm(initialClassForm);
    };

    const handleCreateClass = (event) => {
        event.preventDefault();

        createMutation.mutate({
            ...classForm,
            maxStudents: Number(classForm.maxStudents),
        });
    };

    const inputClassName =
        "mt-xs w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15";
    const labelClassName = "text-label-sm font-semibold text-on-surface";

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
                            <IoMdAdd/>
                            Add New Class
                        </Button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
                        {isLoading && (
                            <div className="flex items-center justify-center py-xl">
                                <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        )}

                        {isError && (
                            <div className="py-xl text-center font-bold text-error">
                                Failed to load classes.
                            </div>
                        )}

                        {!isLoading && !isError && classes.length === 0 && (
                            <div className="py-xl text-center text-on-surface-variant">
                                No classes found.
                            </div>
                        )}

                        {!isLoading && !isError && classes.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-outline-variant bg-surface-container">
                                            <th className="px-lg py-md text-label-sm text-on-surface-variant">Class</th>
                                            <th className="px-lg py-md text-label-sm text-on-surface-variant">Coach</th>
                                            <th className="px-lg py-md text-label-sm text-on-surface-variant">Schedule</th>
                                            <th className="px-lg py-md text-label-sm text-on-surface-variant">Enrollment</th>
                                            <th className="px-lg py-md text-label-sm text-on-surface-variant">Status</th>
                                            <th className="px-lg py-md text-right text-label-sm text-on-surface-variant">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant">
                                        {classes.map((item) => {
                                            const id = item._id || item.id;
                                            const enrolled = item.currentStudents || 0;
                                            const capacity = item.maxStudents || 0;
                                            const percent = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
                                            const full = capacity > 0 && enrolled >= capacity;

                                            return (
                                                <tr key={id} className="transition-colors hover:bg-surface-container-low">
                                                    <td className="px-lg py-md">
                                                        <p className="font-semibold text-on-surface">{item.title}</p>
                                                        <p className="text-label-xs uppercase text-on-surface-variant">{item.level}</p>
                                                    </td>
                                                    <td className="px-lg py-md text-on-surface-variant">{item.coachName}</td>
                                                    <td className="px-lg py-md text-on-surface-variant">{item.schedule}</td>
                                                    <td className="px-lg py-md">
                                                        <div className="flex items-center gap-md">
                                                            <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-container-high">
                                                                <div
                                                                    className={`${full ? "bg-error" : "bg-primary"} h-full`}
                                                                    style={{ width: `${percent}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-label-sm text-on-surface-variant">
                                                                {enrolled}/{capacity}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-lg py-md">
                                                        <span className={`${full ? "bg-error-container text-on-error-container" : "bg-surface-container text-primary"} rounded-full px-md py-xs text-label-xs font-bold uppercase`}>
                                                            {full ? "Full" : "Active"}
                                                        </span>
                                                    </td>
                                                    <td className="px-lg py-md text-right">
                                                        <button className="rounded-full p-sm text-primary hover:bg-primary-container/10" type="button">
                                                            <FaUserGroup />
                                                        </button>
                                                        <button className="ml-xs rounded-full p-sm text-on-surface-variant hover:bg-surface-container-high" type="button">
                                                            <MdEdit size={18}/>
                                                        </button>
                                                        <button
                                                            className="ml-xs rounded-full p-sm text-error hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
                                                            disabled={deleteMutation.isPending}
                                                            onClick={() => deleteMutation.mutate(id)}
                                                            type="button"
                                                        >
                                                            <MdDeleteOutline size={20}/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {isAddModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-md py-lg backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="add-class-title"
                >
                    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl">
                        <div className="flex items-start justify-between gap-md border-b border-outline-variant px-lg py-md">
                            <div>
                                <p className="text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                                    Admin
                                </p>
                                <h2 id="add-class-title" className="mt-xs text-headline-lg font-semibold text-on-surface">
                                    Add New Class
                                </h2>
                                <p className="mt-xs text-body-md text-on-surface-variant">
                                    Create a class with schedule, coach, location, and capacity details.
                                </p>
                            </div>
                            <button
                                className="rounded-full p-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
                                onClick={handleCloseAddModal}
                                type="button"
                                aria-label="Close add class modal"
                            >
                                <IoClose size={22} />
                            </button>
                        </div>

                        <form className="space-y-lg px-lg py-lg" onSubmit={handleCreateClass}>
                            <div className="grid gap-md sm:grid-cols-2">
                                <label className="sm:col-span-2">
                                    <span className={labelClassName}>Class title</span>
                                    <input
                                        className={inputClassName}
                                        name="title"
                                        onChange={handleFormChange}
                                        placeholder="Morning Badminton Basics"
                                        required
                                        value={classForm.title}
                                    />
                                </label>

                                <label>
                                    <span className={labelClassName}>Coach</span>
                                    <input
                                        className={inputClassName}
                                        name="coachName"
                                        onChange={handleFormChange}
                                        placeholder="Nguyen Van A"
                                        required
                                        value={classForm.coachName}
                                    />
                                </label>

                                <label>
                                    <span className={labelClassName}>Level</span>
                                    <select
                                        className={inputClassName}
                                        name="level"
                                        onChange={handleFormChange}
                                        required
                                        value={classForm.level}
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </label>

                                <label>
                                    <span className={labelClassName}>Start date</span>
                                    <input
                                        className={inputClassName}
                                        name="startDate"
                                        onChange={handleFormChange}
                                        required
                                        type="date"
                                        value={classForm.startDate}
                                    />
                                </label>

                                <label>
                                    <span className={labelClassName}>Max students</span>
                                    <input
                                        className={inputClassName}
                                        min="1"
                                        name="maxStudents"
                                        onChange={handleFormChange}
                                        placeholder="16"
                                        required
                                        type="number"
                                        value={classForm.maxStudents}
                                    />
                                </label>

                                <label>
                                    <span className={labelClassName}>Schedule</span>
                                    <input
                                        className={inputClassName}
                                        name="schedule"
                                        onChange={handleFormChange}
                                        placeholder="Mon/Wed/Fri 6-7pm"
                                        required
                                        value={classForm.schedule}
                                    />
                                </label>

                                <label>
                                    <span className={labelClassName}>Location</span>
                                    <input
                                        className={inputClassName}
                                        name="location"
                                        onChange={handleFormChange}
                                        placeholder="Court 1, District 1"
                                        required
                                        value={classForm.location}
                                    />
                                </label>

                                <label className="sm:col-span-2">
                                    <span className={labelClassName}>Description</span>
                                    <textarea
                                        className={`${inputClassName} min-h-28 resize-y`}
                                        name="description"
                                        onChange={handleFormChange}
                                        placeholder="Describe the focus, goals, and requirements for this class."
                                        required
                                        value={classForm.description}
                                    />
                                </label>
                            </div>

                            <div className="flex flex-col-reverse gap-sm border-t border-outline-variant pt-md sm:flex-row sm:justify-end">
                                <Button
                                    className="px-md py-sm"
                                    disabled={createMutation.isPending}
                                    onClick={handleCloseAddModal}
                                    type="button"
                                    variant="secondary"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="px-md py-sm"
                                    disabled={createMutation.isPending}
                                    type="submit"
                                >
                                    {createMutation.isPending ? "Creating..." : "Create Class"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
