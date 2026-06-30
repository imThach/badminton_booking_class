import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi.js";
import { getApiErrorMessage } from "../api/apiError.js";
import { AUTH_UNAUTHORIZED_EVENT, AUTH_UNAUTHORIZED_MESSAGE } from "../api/axiosClient.js";
import { queryKeys } from "../api/queryKeys.js";

const AuthContext = createContext(null);
const AUTH_SESSION_KEY = "badminton_booking_has_auth_session";
const AUTH_SESSION_EXPIRED_TOAST_ID = "auth-session-expired";

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const loginInFlightRef = useRef(false);
  const [hasAuthSession, setHasAuthSession] = useState(
    () => localStorage.getItem(AUTH_SESSION_KEY) === "true"
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setHasAuthSession(false);
    queryClient.removeQueries({ queryKey: queryKeys.authUser, exact: true });
    queryClient.removeQueries({ queryKey: queryKeys.myEnrollments });
    queryClient.removeQueries({ queryKey: queryKeys.admin.all });
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
      setHasAuthSession(true);
      toast.success("Login successful!");
    },
    onError: (error) => {
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
