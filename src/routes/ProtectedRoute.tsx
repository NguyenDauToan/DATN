// src/routes/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/data/AuthContext";

export const ProtectedRoute = ({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: JSX.Element;
}) => {
  const { user } = useAuth();
  const location = useLocation();

  console.log("[ProtectedRoute] current user =", user);
  console.log("[ProtectedRoute] current path =", location.pathname + location.search);

  // Nếu chưa đăng nhập
  if (!user) {
    const target = location.pathname + location.search;
    console.log("[ProtectedRoute] SET redirectAfterLogin =", target);
    localStorage.setItem("redirectAfterLogin", target);
    return <Navigate to="/" replace />;
  }

  // Nếu không có quyền phù hợp
  if (!allowedRoles.includes(user.role)) {
    console.log("[ProtectedRoute] user không đủ quyền, role =", user.role);
    return <Navigate to="/dashboard" replace />;
  }

  console.log("[ProtectedRoute] PASS, render children");
  return children;
};
