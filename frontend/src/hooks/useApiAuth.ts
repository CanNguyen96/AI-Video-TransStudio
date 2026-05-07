/**
 * Fetch wrapper tự động inject Authorization header
 * Dùng thay thế fetch() trong toàn bộ app khi cần auth
 */
import { useAuth } from "@/context/AuthContext";
import { useCallback } from "react";

export const useApiAuth = () => {
  const { token } = useAuth();

  const authFetch = useCallback(
    (url: string, options: RequestInit = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      });
    },
    [token]
  );

  return { authFetch };
};
