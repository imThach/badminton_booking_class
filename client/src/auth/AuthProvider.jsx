import { createContext, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi.js";

const AuthContext = createContext(null);
const AUTH_SESSION_KEY = "badminton_booking_has_auth_session";

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [hasAuthSession, setHasAuthSession] = useState(
    () => localStorage.getItem(AUTH_SESSION_KEY) === "true"
  );

  const { data: userResponse, isError: isUserError, isLoading: isLoadingUser } = useQuery({
    queryKey: ["authUser"],
    queryFn: authApi.getMe,
    enabled: hasAuthSession,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isUserError) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      setHasAuthSession(false);
    }
  }, [isUserError]);

  const user = userResponse?.data?.user || null;
  const isAuthenticated = !!user;

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onMutate: () => {
      queryClient.removeQueries({ queryKey: ["authUser"], exact: true });
    },
    onSuccess: (loginResponse) => {
      localStorage.setItem(AUTH_SESSION_KEY, "true");
      queryClient.setQueryData(["authUser"], loginResponse);
      setHasAuthSession(true);
      toast.success("Login successful!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      localStorage.removeItem(AUTH_SESSION_KEY);
      setHasAuthSession(false);
      queryClient.clear();
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
