import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getApiErrorMessage, isSessionError } from "../api/apiError.js";
import { broadcastInvalidateQueries } from "../api/broadcastQueryClient.js";
import { enrollmentApi } from "../api/enrollmentApi.js";
import { queryKeys } from "../api/queryKeys.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

export const useMyEnrollments = ({ enabled = true } = {}) =>
    useQuery({
        queryKey: queryKeys.myEnrollments,
        queryFn: enrollmentApi.getMyEnrollments,
        enabled,
    });

export const useCancelEnrollment = () => {
    const { t } = useI18n();
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
        broadcastInvalidateQueries([
            queryKeys.myEnrollments,
            queryKeys.myPayments,
            queryKeys.classes.all,
            queryKeys.refundRequests,
            queryKeys.adminPaymentHistory,
            queryKeys.admin.dashboard,
            ...(classId ? [queryKeys.classes.detail(classId), queryKeys.admin.classStudents(classId)] : []),
        ]);

        return Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.myEnrollments }),
            queryClient.invalidateQueries({ queryKey: queryKeys.myPayments }),
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
        onSuccess: (response) => {
            const refundStatus = response?.data?.enrollment?.refundStatus;
            toast.success(refundStatus === "refund_pending"
                ? "Đã hủy lớp. Yêu cầu hoàn tiền đang chờ admin xử lý."
                : "Đã hủy lớp. Giao dịch không đủ điều kiện hoàn tiền 24 giờ.");
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
