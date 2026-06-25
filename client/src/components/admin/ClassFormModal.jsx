import { X } from "lucide-react";
import Button from "../common/Button.jsx";

export default function ClassFormModal({
    title,
    description,
    form,
    errors = {},
    isSaving,
    submitLabel,
    onChange,
    onClose,
    onSubmit,
}) {
    const inputClassName =
        "mt-xs w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15";
    const labelClassName = "text-label-sm font-semibold text-on-surface";
    const fieldError = (field) => errors[field] ? <p className="mt-xs text-label-xs text-error">{errors[field]}</p> : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-md py-lg backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="class-form-title"
        >
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl">
                <div className="flex items-start justify-between gap-md border-b border-outline-variant px-lg py-md">
                    <div>
                        <p className="text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                            Admin
                        </p>
                        <h2 id="class-form-title" className="mt-xs text-headline-lg font-semibold text-on-surface">
                            {title}
                        </h2>
                        <p className="mt-xs text-body-md text-on-surface-variant">{description}</p>
                    </div>
                    <button
                        className="rounded-full p-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
                        onClick={onClose}
                        type="button"
                        aria-label="Close class form modal"
                    >
                        <X size={22} />
                    </button>
                </div>

                <form className="space-y-lg px-lg py-lg" onSubmit={onSubmit}>
                    <div className="grid gap-md sm:grid-cols-2">
                        <label className="sm:col-span-2">
                            <span className={labelClassName}>Class title</span>
                            <input className={inputClassName} name="title" onChange={onChange} placeholder="Morning Badminton Basics" required value={form.title} />
                            {fieldError("title")}
                        </label>

                        <label>
                            <span className={labelClassName}>Coach</span>
                            <input className={inputClassName} name="coachName" onChange={onChange} placeholder="Nguyen Van A" required value={form.coachName} />
                            {fieldError("coachName")}
                        </label>

                        <label>
                            <span className={labelClassName}>Level</span>
                            <select className={inputClassName} name="level" onChange={onChange} required value={form.level}>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                            {fieldError("level")}
                        </label>

                        <label>
                            <span className={labelClassName}>Start date</span>
                            <input className={inputClassName} name="startDate" onChange={onChange} required type="date" value={form.startDate} />
                            {fieldError("startDate")}
                        </label>

                        <label>
                            <span className={labelClassName}>Max students</span>
                            <input className={inputClassName} min="1" name="maxStudents" onChange={onChange} placeholder="16" required type="number" value={form.maxStudents} />
                            {fieldError("maxStudents")}
                        </label>

                        <label>
                            <span className={labelClassName}>Schedule</span>
                            <input className={inputClassName} name="schedule" onChange={onChange} placeholder="Mon/Wed/Fri 6-7pm" required value={form.schedule} />
                            {fieldError("schedule")}
                        </label>

                        <label>
                            <span className={labelClassName}>Location</span>
                            <input className={inputClassName} name="location" onChange={onChange} placeholder="Court 1, District 1" required value={form.location} />
                            {fieldError("location")}
                        </label>

                        <label className="sm:col-span-2">
                            <span className={labelClassName}>Description</span>
                            <textarea
                                className={`${inputClassName} min-h-28 resize-y`}
                                name="description"
                                onChange={onChange}
                                placeholder="Describe the focus, goals, and requirements for this class."
                                required
                                value={form.description}
                            />
                            {fieldError("description")}
                        </label>
                    </div>

                    <div className="flex flex-col-reverse gap-sm border-t border-outline-variant pt-md sm:flex-row sm:justify-end">
                        <Button className="px-md py-sm" disabled={isSaving} onClick={onClose} type="button" variant="secondary">
                            Cancel
                        </Button>
                        <Button className="px-md py-sm" disabled={isSaving} type="submit">
                            {isSaving ? "Saving..." : submitLabel}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
