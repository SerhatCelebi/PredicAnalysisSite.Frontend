import { useEffect, useRef } from "react";
import { useAuthStore } from "../lib/store";
import { api } from "../lib/api";

interface JwtPayload {
  exp: number;
}

const parseJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const useTokenRefresh = () => {
  const { accessToken, refreshToken, setTokens, logout } = useAuthStore();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    const scheduleRefresh = () => {
      const payload = parseJwt(accessToken);
      if (!payload?.exp) return;
      const expiresAt = payload.exp * 1000; // ms
      const now = Date.now();
      // Refresh 2 minutes before expiry, but not less than 30 seconds
      const refreshAt = Math.max(expiresAt - 120 * 1000, now + 30 * 1000);
      const delay = refreshAt - now;
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = setTimeout(() => {
        refreshTokenRequest();
      }, delay);
    };

    const refreshTokenRequest = async () => {
      try {
        const res = await api.post("/Auth/refresh-token", {
          token: accessToken,
          refreshToken,
        });
        const { token: newAccessToken, refreshToken: newRefreshToken } =
          res.data;
        setTokens(newAccessToken, newRefreshToken);
        scheduleRefresh(); // Schedule next
      } catch (err) {
        logout();
        window.location.href = "/login";
      }
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, refreshToken]);
};
