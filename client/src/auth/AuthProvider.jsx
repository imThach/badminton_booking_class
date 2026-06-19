import { createContext, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/authApi.js";
import { tokenStorage } from "../api/tokenStorage.js";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  // Fetching User Profile nếu có token
  const { data: userResponse, isLoading: isLoadingUser } = useQuery({
    queryKey: ["authUser"],
    queryFn: authApi.getMe,
    retry: false, // Bị lỗi (401) thì không thử lại
    refetchOnWindowFocus: false, // Tránh call /me liên tục khi chuyển tab
  });

  const user = userResponse?.data?.user || null;
  const isAuthenticated = !!user;

  // Xử lý Login Mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Login successful!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(["authUser"], null);
    }
  });

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingUser, login: loginMutation.mutateAsync, isLoggingIn: loginMutation.isPending, logout: logoutMutation.mutate }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);