import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Check if user is authenticated
  const { 
    data: userData,
    isLoading,
    error: fetchError,
    refetch
  } = useQuery({
    queryKey: ["/api/auth/me"],
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Login failed");
    }
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      // Invalidate all queries to force a refetch after logout
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      setError(err.message || "Logout failed");
    }
  });
  
  // Login function
  const login = async (username: string, password: string) => {
    setError(null);
    await loginMutation.mutateAsync({ username, password });
    refetch(); // Refetch user data after login
  };
  
  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  // Determine if user is authenticated
  const isAuthenticated = Boolean(userData?.user);
  
  // Set error message if there was an error fetching user data
  useEffect(() => {
    if (fetchError && !error) {
      setError((fetchError as Error).message || "Authentication error");
    }
  }, [fetchError, error]);
  
  return {
    user: userData?.user || null,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout
  };
}
