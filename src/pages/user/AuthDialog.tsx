import React, { useState, useEffect } from "react";
import * as api from "@/api/Api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import "@/styles/AuthDialog.css";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: { name: string; email: string; role?: string }) => void;
}

const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  onClose,
  onLoginSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Nhận token từ cửa sổ popup (Google Login)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 🔸 Kiểm tra domain backend chính xác (localhost:5000)
      if (!event.origin.includes("localhost:5000")) return;

      const { token, user } = event.data || {};
      if (token && user) {
        console.log("✅ Nhận token và user từ Google callback:", { token, user });

        // Lưu token và thông tin user
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role || "");

        // Cập nhật UI
        if (onLoginSuccess) onLoginSuccess(user);

        // Đóng dialog & điều hướng
        onClose();
        navigate(user.role === "admin" ? "/admin" : "/");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onClose, navigate, onLoginSuccess]);

  // ✅ Xử lý đăng nhập hoặc đăng ký thủ công
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        const res = await api.authAPI.login({ email, password });
        const { token, user } = res.data;

        if (!token || !user) throw new Error("Phản hồi không hợp lệ");

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role || "");

        if (onLoginSuccess) onLoginSuccess(user);
        navigate(user.role === "admin" ? "/admin" : "/");
        onClose();
      } else {
        const res = await api.authAPI.register({ name, email, password });
        const { token, user } = res.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role || "");

        if (onLoginSuccess) onLoginSuccess(user);
        navigate("/");
        onClose();
      }
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
      setError(err.response?.data?.message || "Đã có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Đăng nhập Google (mở popup)
  const handleGoogleLogin = () => {
    const width = 500,
      height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    // ⚠️ Đảm bảo URL trùng khớp với backend
    const popup = window.open(
      "http://localhost:5000/api/auth/google",
      "Google Login",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    if (!popup) {
      alert("Vui lòng cho phép trình duyệt mở cửa sổ đăng nhập Google.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl shadow-2xl bg-white/80 backdrop-blur-md border border-gray-200 p-8">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl font-extrabold text-gray-900 mb-2">
            {isLogin ? "Đăng nhập" : "Đăng ký"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm">
            {isLogin
              ? "Nhập email và mật khẩu để đăng nhập"
              : "Điền thông tin để tạo tài khoản mới"}
          </DialogDescription>
        </DialogHeader>

        {/* Input fields */}
        <div className="flex flex-col gap-3">
          {!isLogin && (
            <Input
              placeholder="Họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="text-red-600 text-sm font-medium mt-1 text-center">
              {error}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col items-stretch gap-3 w-full mt-4">
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {isLogin ? "Đăng nhập" : "Đăng ký"}
          </Button>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full flex items-center justify-center"
          >
            <FcGoogle className="mr-2" />
            {isLogin ? "Đăng nhập với Google" : "Đăng ký với Google"}
          </Button>

          <Button
            onClick={() => setIsLogin(!isLogin)}
            variant="ghost"
            className="w-full"
          >
            {isLogin
              ? "Chưa có tài khoản? Đăng ký ngay"
              : "Đã có tài khoản? Đăng nhập"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
