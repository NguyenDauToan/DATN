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
import { toast } from "sonner";
import type { LoginResponse } from "@/api/Api";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: { name: string; email: string; role?: string }) => void;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const navigateByRole = (role?: string) => {
    if (role === "admin" || role === "teacher") navigate("/admin", { replace: true });
    else navigate("/dashboard", { replace: true });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = isLogin
        ? await api.authAPI.login({ email, password })
        : await api.authAPI.register({ name, email, password });

      const { token, user } = res.data as { token: string; user: LoginResponse["user"] };
      if (!token || !user) throw new Error("Phản hồi không hợp lệ");

      // Không check isActive nữa, cứ login bình thường
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role || "");
      localStorage.setItem("userId", user._id);

      if (onLoginSuccess) onLoginSuccess(user);

      toast.success(
        isLogin
          ? user.role === "admin"
            ? "🎉 Đăng nhập thành công (Admin)!"
            : user.role === "teacher"
              ? "🎉 Đăng nhập thành công (Giáo viên)!"
              : "🎉 Đăng nhập thành công (Người dùng)!"
          : "✅ Đăng ký thành công!"
      );

      navigateByRole(user.role);
      onClose();
    } catch (err: any) {
      console.error("LOGIN ERROR:", err?.response?.status, err?.response?.data);

      const message = err?.response?.data?.message as string | undefined;
      toast.error(message || "Đã có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes("localhost:5000")) return;

      const { token, user } = event.data as { token: string; user: LoginResponse["user"] };
      if (token && user) {
        // Không check isActive ở Google login luôn
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role || "");
        localStorage.setItem("userId", user._id);

        if (onLoginSuccess) onLoginSuccess(user);
        toast.success(
          user.role === "admin"
            ? "🎉 Đăng nhập Google thành công (Admin)!"
            : user.role === "teacher"
              ? "🎉 Đăng nhập Google thành công (Giáo viên)!"
              : "🎉 Đăng nhập Google thành công!"
        );

        navigateByRole(user.role);
        onClose();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onClose, navigate, onLoginSuccess]);

  const handleGoogleLogin = () => {
    const width = 500, height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(
      "http://localhost:5000/api/auth/google",
      "Google Login",
      `width=${width},height=${height},top=${top},left=${left}`
    );
    if (!popup)
      toast.warning("Vui lòng cho phép trình duyệt mở cửa sổ đăng nhập Google.");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl shadow-2xl bg-white/80 backdrop-blur-md border border-gray-200 p-8">
        <DialogHeader className="text-center mb-4">
          <DialogTitle className="text-3xl font-extrabold text-gray-900 mb-2">
            {isLogin ? "Đăng nhập" : "Đăng ký"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm">
            {isLogin
              ? "Nhập email và mật khẩu để đăng nhập"
              : "Điền thông tin để tạo tài khoản mới"}
          </DialogDescription>
        </DialogHeader>

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
        </div>

        <div className="flex flex-col items-stretch gap-3 w-full mt-4">
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
          </Button>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full flex items-center justify-center "
          >
            <FcGoogle className="mr-1" />
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
