import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi.js";
import { getApiErrorMessage } from "../api/apiError.js";
import { AUTH_UNAUTHORIZED_EVENT } from "../api/axiosClient.js";
import { queryKeys } from "../api/queryKeys.js";

const AuthContext = createContext(null);
const AUTH_SESSION_KEY = "badminton_booking_has_auth_session";

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
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
    const handleUnauthorized = () => {
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
      queryClient.removeQueries({ queryKey: queryKeys.authUser, exact: true });
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
