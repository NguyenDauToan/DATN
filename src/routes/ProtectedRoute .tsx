import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }: { children: JSX.Element; role: string }) => {
    const userRole = localStorage.getItem("role");
    if (userRole !== role) {
      return <Navigate to="/" replace />;
    }
    return children;
  };
export default ProtectedRoute