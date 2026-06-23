import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { enrollmentApi } from "../api/enrollmentApi.js";

export const useMyEnrollments = () =>
    useQuery({
        queryKey: ["myEnrollments"],
        queryFn: enrollmentApi.getMyEnrollments,
    });

export const useCancelEnrollment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: enrollmentApi.cancelEnrollment,
        onSuccess: () => {
            toast.success("Enrollment cancelled.");
            queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
            queryClient.invalidateQueries({ queryKey: ["classes"] });
            queryClient.invalidateQueries({ queryKey: ["classDetail"] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to cancel enrollment.");
        },
    });
};
