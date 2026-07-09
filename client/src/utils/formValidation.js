const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARACTERS_PATTERN = /^\+?[0-9 .()-]+$/;

export const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const translate = (t, key, fallback, variables) => t ? t(key, variables) : fallback;

export const validateEmail = (email, t) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
        return translate(t, "validation.emailRequired", "Email is required.");
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
        return translate(t, "validation.emailInvalid", "Enter a valid email address.");
    }

    return "";
};

export const validatePassword = (password, t) => {
    if (!password) {
        return translate(t, "validation.passwordRequired", "Password is required.");
    }

    if (String(password).length < 8) {
        return translate(t, "validation.passwordLength", "Password must be at least 8 characters.");
    }
    if (String(password).length > 128) return translate(t, "validation.passwordMax", "Password cannot exceed 128 characters.");

    return "";
};

export const validateName = (name, t) => {
    const value = String(name || "").trim();
    if (!value) return translate(t, "validation.required", "Name is required.", { field: "Name" });
    if (value.length < 2 || value.length > 100) return translate(t, "validation.nameLength", "Name must contain 2 to 100 characters.");
    return "";
};

export const validatePhone = (phone, t) => {
    const value = String(phone || "").trim();
    if (!value) return "";

    const digitCount = value.replace(/\D/g, "").length;
    const parenthesesAreBalanced = (value.match(/\(/g) || []).length === (value.match(/\)/g) || []).length
        && !value.includes(")(")
        && value.indexOf(")") >= value.indexOf("(");

    if (value.length > 30 || !PHONE_CHARACTERS_PATTERN.test(value) || digitCount < 8 || digitCount > 15 || !parenthesesAreBalanced) {
        return translate(t, "validation.phoneInvalid", "Enter a valid phone number containing 8 to 15 digits.");
    }

    return "";
};

export const validateRequired = (value, label, t) => {
    if (value === undefined || value === null || String(value).trim() === "") {
        return translate(t, "validation.required", `${label} is required.`, { field: label });
    }

    return "";
};

export const validateOtp = (otp, t) => {
    if (!otp) {
        return translate(t, "validation.otpRequired", "Verification code is required.");
    }

    if (!/^\d{6}$/.test(String(otp))) {
        return translate(t, "validation.otpInvalid", "Enter the 6-digit verification code.");
    }

    return "";
};

export const validateClassForm = (form, { requireFutureStartDate = false, t } = {}) => {
    const errors = {
        title: validateRequired(form.title, t?.("admin.classTitle") || "Class title", t),
        coach: validateRequired(form.coach, t?.("admin.coach") || "Coach", t),
        level: validateRequired(form.level, t?.("admin.level") || "Level", t),
        startDate: validateRequired(form.startDate, t?.("admin.startDate") || "Start date", t),
        endDate: validateRequired(form.endDate, t?.("admin.endDate") || "End date", t),
        maxStudents: validateRequired(form.maxStudents, t?.("admin.maxStudents") || "Max students", t),
        price: validateRequired(form.price, "Học phí", t),
        schedule: validateRequired(form.schedule, t?.("admin.schedule") || "Schedule", t),
        location: validateRequired(form.location, t?.("admin.location") || "Location", t),
        description: validateRequired(form.description, t?.("admin.description") || "Description", t),
    };
    const limits = { title: 150, description: 3000, schedule: 500, location: 200 };
    Object.entries(limits).forEach(([field, max]) => {
        if (!errors[field] && String(form[field]).trim().length > max) errors[field] = `${t?.(`admin.${field}`) || field} cannot exceed ${max} characters.`;
    });

    if (!errors.startDate) {
        const selectedDate = new Date(form.startDate);
        const today = new Date();

        if (Number.isNaN(selectedDate.getTime())) {
            errors.startDate = translate(t, "validation.dateInvalid", "Start date must be a valid date.");
        } else if (requireFutureStartDate && selectedDate < today) {
            errors.startDate = translate(t, "validation.datePast", "Start date cannot be in the past.");
        }
    }

    if (!errors.endDate) {
        const endDate = new Date(form.endDate);
        const startDate = new Date(form.startDate);
        if (Number.isNaN(endDate.getTime())) {
            errors.endDate = translate(t, "validation.endDateInvalid", "End date must be a valid date.");
        } else if (!Number.isNaN(startDate.getTime()) && endDate <= startDate) {
            errors.endDate = translate(t, "validation.endDateAfterStart", "End date must be after start date.");
        }
    }

    if (!errors.maxStudents) {
        const maxStudents = Number(form.maxStudents);

        if (!Number.isInteger(maxStudents) || maxStudents < 1) {
            errors.maxStudents = translate(t, "validation.capacity", "Max students must be a positive whole number.");
        }
    }

    if (!errors.price && (!Number.isInteger(Number(form.price)) || Number(form.price) < 1000)) {
        errors.price = "Học phí phải là số nguyên từ 1.000 VND.";
    }

    if (!errors.schedule) {
        const hasWeekday = /(^|[\s/,;-])(sun|mon|tue|wed|thu|fri|sat|sar|sunday|monday|tuesday|wednesday|thursday|friday|saturday|t[2-7]|cn)(?=$|[\s/,;-])/i.test(form.schedule);
        if (!hasWeekday) {
            errors.schedule = translate(t, "validation.scheduleInvalid", "Enter valid weekdays, for example Tue/Thu/Sat.");
        } else if (!/\d{1,2}(?::\d{2})?\s*(am|pm)?\s*[-–]\s*\d{1,2}(?::\d{2})?/i.test(form.schedule)) {
            const start = new Date(form.startDate);
            const end = new Date(form.endDate);
            const startMinutes = start.getHours() * 60 + start.getMinutes();
            const endMinutes = end.getHours() * 60 + end.getMinutes();
            if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && endMinutes <= startMinutes) {
                errors.schedule = translate(t, "validation.scheduleTimeInvalid", "For a weekday-only schedule, the class end time must be after its start time.");
            }
        }
    }

    return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
};

export const hasValidationErrors = (errors) => Object.keys(errors).length > 0;
