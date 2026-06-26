import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getApiErrorMessage, isSessionError } from "../api/apiError.js";
import { enrollmentApi } from "../api/enrollmentApi.js";
import { queryKeys } from "../api/queryKeys.js";

export const useMyEnrollments = ({ enabled = true } = {}) =>
    useQuery({
        queryKey: queryKeys.myEnrollments,
        queryFn: enrollmentApi.getMyEnrollments,
        enabled,
    });

export const useCancelEnrollment = () => {
    const queryClient = useQueryClient();

    const removeEnrollmentFromCache = (currentData, classId) => {
        const enrollments = currentData?.data?.enrollments;

        if (!Array.isArray(enrollments)) {
            return currentData;
        }

        return {
            ...currentData,
            data: {
                ...currentData.data,
                enrollments: enrollments.filter((enrollment) => {
                    const enrolledClassId = enrollment.class?._id || enrollment.class?.id || enrollment.class;
                    return enrolledClassId !== classId;
                }),
            },
        };
    };

    const invalidateEnrollmentQueries = (classId) => {
        return Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.myEnrollments }),
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
            classId
                ? queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(classId) })
                : Promise.resolve(),
        ]);
    };

    const applyCancelledEnrollment = (classId) => {
        queryClient.setQueryData(queryKeys.myEnrollments, (currentData) =>
            removeEnrollmentFromCache(currentData, classId)
        );
    };

    return useMutation({
        mutationFn: enrollmentApi.cancelEnrollment,
        onMutate: async (classId) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.myEnrollments });

            const previousMyEnrollments = queryClient.getQueryData(queryKeys.myEnrollments);
            applyCancelledEnrollment(classId);

            return { previousMyEnrollments };
        },
        onSuccess: () => {
            toast.success("Enrollment cancelled.");
        },
        onError: (error, classId, context) => {
            if (error?.response?.status !== 404 && context?.previousMyEnrollments) {
                queryClient.setQueryData(queryKeys.myEnrollments, context.previousMyEnrollments);
            }

            if (!isSessionError(error)) {
                if (error?.response?.status === 404) {
                    toast.error("This enrollment no longer exists.");
                    applyCancelledEnrollment(classId);
                    return;
                }

                toast.error(getApiErrorMessage(error, "Failed to cancel enrollment."));
            }
        },
        onSettled: (_data, _error, classId) => invalidateEnrollmentQueries(classId),
    });
};
