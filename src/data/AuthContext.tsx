// src/data/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/Api";
import { toast } from "sonner";

const AuthContext = createContext<any>(null);

// Thời gian không hoạt động tối đa
// 1 phút: 1 * 60 * 1000
// 10 giây test: 10 * 1000
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 1 phút

// 👇 CỜ TOÀN CỤC: dùng để chặn redirect nhiều lần
let didRedirectAfterLogin = false;

const setAuthStorage = (user: any, token?: string) => {
  if (token) localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("role", user?.role || "");
  localStorage.setItem("userId", user?._id || user?.id || "");
};

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Thời điểm hoạt động gần nhất
  const [lastActivity, setLastActivity] = useState<number>(() => Date.now());

  // Hàm logout (có thể hiện thông báo hết phiên)
  const logout = async (options?: { showSessionExpired?: boolean }) => {
    try {
      if (options?.showSessionExpired) {
        toast.info("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
      }

      await authAPI.logout();
    } catch {
      // bỏ qua lỗi logout server
    }

    clearAuthStorage();
    setUser(null);
    didRedirectAfterLogin = false;
    navigate("/", { replace: true });
  };

  // Lần đầu bootstrap: kiểm tra token + getCurrentUser
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setUser(null);
          return;
        }

        const cached = localStorage.getItem("user");
        if (cached) setUser(JSON.parse(cached));

        const res = await authAPI.getCurrentUser();
        setUser(res.data.user);
        setAuthStorage(res.data.user, token);
        setLastActivity(Date.now()); // đã xác thực xong => reset mốc hoạt động
      } catch {
        clearAuthStorage();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  // Theo dõi các event hoạt động của user để reset lastActivity
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    const events: (keyof WindowEventMap)[] = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    events.forEach((evt) => window.addEventListener(evt, updateActivity));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, updateActivity));
    };
  }, []);

  // Timer tự logout sau INACTIVITY_LIMIT_MS không hoạt động
  useEffect(() => {
    if (!user) return; // chưa đăng nhập thì không cần set timer

    const now = Date.now();
    const elapsed = now - lastActivity;
    const remaining = Math.max(INACTIVITY_LIMIT_MS - elapsed, 0);

    const timeoutId = window.setTimeout(() => {
      // Hết thời gian không hoạt động -> logout + hiện thông báo hết phiên
      logout({ showSessionExpired: true });
    }, remaining);

    return () => {
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastActivity, user]);

  const login = (userData: any, token: string) => {
    if (!userData || !token) return;

    console.log("[AuthContext.login] gọi login với user =", userData);
    setAuthStorage(userData, token);
    setUser(userData);
    setLastActivity(Date.now()); // đăng nhập xong -> reset mốc hoạt động

    const redirect = localStorage.getItem("redirectAfterLogin");
    console.log("[AuthContext.login] READ redirectAfterLogin =", redirect);

    if (didRedirectAfterLogin) {
      console.log(
        "[AuthContext.login] ĐÃ redirect (global flag), lần này chỉ update user, không điều hướng nữa"
      );
      return;
    }

    didRedirectAfterLogin = true;

    if (redirect) {
      localStorage.removeItem("redirectAfterLogin");
      console.log("[AuthContext.login] Điều hướng tới", redirect);
      navigate(redirect, { replace: true });
    } else {
      if (userData.role === "admin" || userData.role === "teacher") {
        console.log("[AuthContext.login] Điều hướng mặc định /admin");
        navigate("/admin", { replace: true });
      } else {
        console.log("[AuthContext.login] Điều hướng mặc định /dashboard");
        navigate("/dashboard", { replace: true });
      }
    }
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
