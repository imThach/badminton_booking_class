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

    return useMutation({
        mutationFn: enrollmentApi.cancelEnrollment,
        onSuccess: (_data, classId) => {
            toast.success("Enrollment cancelled.");
            queryClient.invalidateQueries({ queryKey: queryKeys.myEnrollments });
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(classId) });
        },
        onError: (error) => {
            if (!isSessionError(error)) {
                toast.error(getApiErrorMessage(error, "Failed to cancel enrollment."));
            }
        },
    });
};
