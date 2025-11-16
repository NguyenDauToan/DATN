import { Navigate } from "react-router-dom";
import { useAuth } from "@/data/AuthContext";

export const ProtectedRoute = ({ allowedRoles, children }: { allowedRoles: string[], children: JSX.Element }) => {
  const { user } = useAuth();

  // Nếu chưa đăng nhập
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Nếu không có quyền phù hợp
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Nếu hợp lệ
  return children;
};
