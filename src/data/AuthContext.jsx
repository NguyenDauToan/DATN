// ./data/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/api";

const AuthContext = createContext(null);

const setAuthStorage = (user, token) => {
  if (token) localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("role", user?.role || "");
  localStorage.setItem("userId", user?._id || "");
};
const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setUser(null); return; }

        // dùng cache tạm để tránh flicker
        const cached = localStorage.getItem("user");
        if (cached) setUser(JSON.parse(cached));

        const res = await authAPI.getCurrentUser();
        setUser(res.data.user);
        setAuthStorage(res.data.user, token);
      } catch {
        clearAuthStorage();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = (userData, token) => {
    if (!userData || !token) return;
    setAuthStorage(userData, token);
    setUser(userData);
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    clearAuthStorage();
    setUser(null);
    navigate("/", { replace: true });
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
