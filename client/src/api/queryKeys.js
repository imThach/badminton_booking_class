export const queryKeys = {
    authUser: ["authUser"],
    myEnrollments: ["myEnrollments"],
    classes: {
        all: ["classes"],
        list: (filters = {}) => ["classes", filters],
        detail: (id) => ["classes", "detail", id],
    },
    admin: {
        all: ["admin"],
        classes: ["admin", "classes"],
        classStudents: (classId) => ["admin", "classes", classId, "students"],
    },
};
