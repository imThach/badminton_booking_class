const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const validateEmail = (email) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
        return "Email is required.";
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
        return "Enter a valid email address.";
    }

    return "";
};

export const validatePassword = (password) => {
    if (!password) {
        return "Password is required.";
    }

    if (String(password).length < 8) {
        return "Password must be at least 8 characters.";
    }

    return "";
};

export const validateRequired = (value, label) => {
    if (value === undefined || value === null || String(value).trim() === "") {
        return `${label} is required.`;
    }

    return "";
};

export const validateOtp = (otp) => {
    if (!otp) {
        return "Verification code is required.";
    }

    if (!/^\d{6}$/.test(String(otp))) {
        return "Enter the 6-digit verification code.";
    }

    return "";
};

export const validateClassForm = (form, { requireFutureStartDate = false } = {}) => {
    const errors = {
        title: validateRequired(form.title, "Class title"),
        coachName: validateRequired(form.coachName, "Coach"),
        level: validateRequired(form.level, "Level"),
        startDate: validateRequired(form.startDate, "Start date"),
        maxStudents: validateRequired(form.maxStudents, "Max students"),
        schedule: validateRequired(form.schedule, "Schedule"),
        location: validateRequired(form.location, "Location"),
        description: validateRequired(form.description, "Description"),
    };

    if (!errors.startDate) {
        const selectedDate = new Date(`${form.startDate}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (Number.isNaN(selectedDate.getTime())) {
            errors.startDate = "Start date must be a valid date.";
        } else if (requireFutureStartDate && selectedDate < today) {
            errors.startDate = "Start date cannot be in the past.";
        }
    }

    if (!errors.maxStudents) {
        const maxStudents = Number(form.maxStudents);

        if (!Number.isInteger(maxStudents) || maxStudents < 1) {
            errors.maxStudents = "Max students must be a positive whole number.";
        }
    }

    return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
};

export const hasValidationErrors = (errors) => Object.keys(errors).length > 0;
