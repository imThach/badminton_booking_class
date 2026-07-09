import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi.js";
import { getApiErrorMessage } from "../api/apiError.js";
import { AUTH_UNAUTHORIZED_EVENT, AUTH_UNAUTHORIZED_MESSAGE } from "../api/axiosClient.js";
import { queryKeys } from "../api/queryKeys.js";
import { broadcastInvalidateQueries } from "../api/broadcastQueryClient.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

const AuthContext = createContext(null);
const AUTH_SESSION_KEY = "badminton_booking_has_auth_session";
const AUTH_SESSION_EXPIRED_TOAST_ID = "auth-session-expired";

const formatRetryAfter = (totalSeconds, language) => {
  const seconds = Math.max(Math.ceil(Number(totalSeconds) || 0), 1);
  const minutesPart = Math.floor(seconds / 60);
  const secondsPart = seconds % 60;
  if (language === "vi") {
    return [minutesPart && `${minutesPart} phút`, secondsPart && `${secondsPart} giây`].filter(Boolean).join(" ");
  }
  return [minutesPart && `${minutesPart} min`, secondsPart && `${secondsPart} sec`].filter(Boolean).join(" ");
};

export function AuthProvider({ children }) {
  const { language, t } = useI18n();
  const queryClient = useQueryClient();
  const loginInFlightRef = useRef(false);
  const oauthLoginRef = useRef(
    new URLSearchParams(window.location.search).get("oauth") === "success"
  );
  const [hasAuthSession, setHasAuthSession] = useState(
    () => localStorage.getItem(AUTH_SESSION_KEY) === "true" || oauthLoginRef.current
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setHasAuthSession(false);
    queryClient.removeQueries({ queryKey: queryKeys.authUser, exact: true });
    queryClient.removeQueries({ queryKey: queryKeys.myEnrollments });
    queryClient.removeQueries({ queryKey: queryKeys.admin.all });
    queryClient.removeQueries({ queryKey: queryKeys.bookmarks });
    queryClient.removeQueries({ queryKey: queryKeys.waitlist });
    broadcastInvalidateQueries([
      queryKeys.authUser,
      queryKeys.myEnrollments,
      queryKeys.myPayments,
      queryKeys.bookmarks,
      queryKeys.waitlist,
      queryKeys.classes.all,
      queryKeys.admin.all,
    ]);
  }, [queryClient]);

  const { data: userResponse, isError: isUserError, isLoading: isLoadingUser } = useQuery({
    queryKey: queryKeys.authUser,
    queryFn: authApi.getMe,
    enabled: hasAuthSession,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isUserError) {
      clearSession();
    }
  }, [clearSession, isUserError]);

  useEffect(() => {
    if (!oauthLoginRef.current || !userResponse?.data?.user) return;

    oauthLoginRef.current = false;
    localStorage.setItem(AUTH_SESSION_KEY, "true");
    setHasAuthSession(true);
    queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    broadcastInvalidateQueries([queryKeys.authUser, queryKeys.classes.all]);
    toast.success(t("toast.loginSuccess"));

    const url = new URL(window.location.href);
    url.searchParams.delete("oauth");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [queryClient, t, userResponse]);

  useEffect(() => {
    const handleUnauthorized = (event) => {
      if (loginInFlightRef.current) {
        return;
      }

      toast.error(event.detail?.message || AUTH_UNAUTHORIZED_MESSAGE, {
        id: AUTH_SESSION_EXPIRED_TOAST_ID,
      });
      clearSession();
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearSession]);

  const user = userResponse?.data?.user || null;
  const isAuthenticated = !!user;

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onMutate: () => {
      loginInFlightRef.current = true;
      clearSession();
    },
    onSuccess: (loginResponse) => {
      localStorage.setItem(AUTH_SESSION_KEY, "true");
      queryClient.setQueryData(queryKeys.authUser, loginResponse);
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      broadcastInvalidateQueries([queryKeys.authUser, queryKeys.classes.all]);
      setHasAuthSession(true);
      toast.success(t("toast.loginSuccess"));
    },
    onError: (error) => {
      if (error?.response?.status === 429) {
        const retryAfter = error.response.headers?.["retry-after"];
        if (retryAfter) {
          toast.error(t("toast.loginRateLimited", { time: formatRetryAfter(retryAfter, language) }), { duration: 7000 });
          return;
        }
      }
      toast.error(getApiErrorMessage(error, "Login failed"));
    },
    onSettled: () => {
      loginInFlightRef.current = false;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearSession();
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      broadcastInvalidateQueries([
        queryKeys.authUser,
        queryKeys.myEnrollments,
        queryKeys.myPayments,
        queryKeys.bookmarks,
        queryKeys.waitlist,
        queryKeys.classes.all,
      ]);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingUser: hasAuthSession && isLoadingUser,
        login: loginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        logout: logoutMutation.mutate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
