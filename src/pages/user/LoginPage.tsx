import React, { useState, useEffect, FormEvent } from "react";
import axios from "axios";
import * as api from "@/api/Api";
import { useAuth } from "@/data/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import type { LoginResponse } from "@/api/Api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://english-backend-uoic.onrender.com";

type School = { _id: string; name: string; code?: string };
type Classroom = { _id: string; name: string; code?: string };

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
});

export default function LoginPage() {
  const { login: ctxLogin } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [grade, setGrade] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [classroomId, setClassroomId] = useState("");

  const [schools, setSchools] = useState<School[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loading, setLoading] = useState(false);
  const redirectAfterLogin = (user: any) => {
    const redirect = localStorage.getItem("redirectAfterLogin");
    if (redirect) {
      localStorage.removeItem("redirectAfterLogin");
      navigate(redirect, { replace: true });
      return;
    }
  
    // ✅ nếu là học sinh và cần cập nhật lại lớp → đẩy sang trang hồ sơ
    if (user.role === "student" && user.needUpdateClass) {
      toast.info("Năm học cũ đã kết thúc, vui lòng cập nhật lại lớp hiện tại.");
      navigate("/profile", { replace: true });
      return;
    }
  
    if (["admin", "teacher", "school_manager"].includes(user.role)) {
      navigate("/admin", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };
  

  const loadSchools = async () => {
    try {
      setLoadingSchools(true);
      const res = await axios.get<{ schools: School[] }>(
        `${API_BASE_URL}/api/admin/schools`
      );
      setSchools(res.data.schools || []);
    } catch {
      toast.error("Không tải được danh sách trường");
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadClassrooms = async (schoolId: string, grade?: string) => {
    try {
      setLoadingClasses(true);
      const res = await axios.get<{ classrooms: Classroom[] }>(
        `${API_BASE_URL}/api/admin/classrooms/public`,
        {
          params: {
            schoolId,
            grade: grade || undefined, // gửi kèm khối
          },
        }
      );
      setClassrooms(res.data.classrooms || []);
    } catch {
      toast.error("Không tải được danh sách lớp");
    } finally {
      setLoadingClasses(false);
    }
  };



  useEffect(() => {
    if (!isLogin) loadSchools();
    else {
      setGrade("");
      setSchoolId("");
      setClassroomId("");
      setSchools([]);
      setClassrooms([]);
    }
  }, [isLogin]);

  useEffect(() => {
    if (!schoolId || !grade) {
      setClassrooms([]);
      setClassroomId("");
      return;
    }
    loadClassrooms(schoolId, grade);
  }, [schoolId, grade]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLogin) {
      if (!email.trim()) {
        Swal.fire({
          icon: "error",
          title: "Thiếu email",
          text: "Vui lòng nhập email để đăng ký.",
        });
        return;
      }
      if (!isValidEmail(email)) {
        Swal.fire({
          icon: "error",
          title: "Email không hợp lệ",
          text: "Vui lòng nhập đúng định dạng email (ví dụ: tenban@gmail.com).",
        });
        return;
      }
    }
    setLoading(true);

    try {
      const res = isLogin
        ? await api.authAPI.login({ email, password })
        : await api.authAPI.register({
          name,
          email,
          password,
          grade,
          schoolId,
          classroomId,
        });

      const { token, user } = res.data as {
        token: string;
        user: LoginResponse["user"];
      };

      if (!token || !user) throw new Error("Phản hồi không hợp lệ");

      if (user.isActive === false) {
        Swal.fire({
          title: "Tài khoản bị khóa",
          text: "Vui lòng liên hệ giáo viên hoặc quản trị viên.",
          icon: "error",
        });
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user._id);

      ctxLogin(user, token);

      Toast.fire({
        icon: "success",
        title: isLogin ? "Đăng nhập thành công!" : "Đăng ký thành công!",
      });

      redirectAfterLogin(user);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Đăng nhập thất bại";
      const lower = msg.toLowerCase();

      if (lower.includes("khóa") || lower.includes("locked")) {
        Swal.fire({
          title: "Tài khoản bị khóa",
          text: msg,
          icon: "error",
        });
      } else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  // ngay dưới useEffect login-no-scroll của bạn
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // message được gửi từ backend (https://english-backend-uoic.onrender.com)
      if (event.origin !== "https://english-backend-uoic.onrender.com") return;

      const data = event.data || {};

      // ❌ Có lỗi (vd: tài khoản bị chặn)
      if (data.error) {
        Swal.fire({
          title: "Tài khoản bị chặn",
          text: data.error,
          icon: "error",
        });
        return;
      }

      const { token, user } = data;
      if (!token || !user) return;

      // (optional) thêm check isActive lần nữa
      if (user.isActive === false) {
        Swal.fire({
          title: "Tài khoản bị chặn",
          text: "Tài khoản đã bị chặn, vui lòng liên hệ quản trị viên.",
          icon: "error",
        });
        return;
      }

      // lưu giống login thường
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user.id || user._id);

      ctxLogin(user, token);

      // nếu muốn vẫn dùng Toast cho success thì giữ nguyên, hoặc đổi sang Swal
      Toast.fire({
        icon: "success",
        title: "Đăng nhập với Google thành công!",
      });

      redirectAfterLogin(user);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [ctxLogin, redirectAfterLogin]);



  const handleGoogleLogin = () => {
    if (!isLogin && (!grade || !schoolId)) {
      toast.error("Vui lòng chọn khối và trường trước khi dùng Google.");
      return;
    }

    const params = new URLSearchParams();
    if (!isLogin) {
      grade && params.append("grade", grade);
      schoolId && params.append("schoolId", schoolId);
      classroomId && params.append("classroomId", classroomId);
    }

    const url = `https://english-backend-uoic.onrender.com/api/auth/google${params.toString() ? `?${params.toString()}` : ""
      }`;

    window.open(
      url,
      "Google Login",
      "width=500,height=600,top=120,left=500"
    );
  };

  const handleFacebookLogin = () => {
    toast.info("Đăng nhập bằng Facebook đang được phát triển.");
  };
  const handleForgotPassword = async () => {
    const result = await Swal.fire({
      title: "Quên mật khẩu",
      text: "Nhập email bạn đã dùng để đăng ký tài khoản.",
      input: "email",
      inputPlaceholder: "nhapemail@vidu.com",
      confirmButtonText: "Gửi link đặt lại",
      showCancelButton: true,
      cancelButtonText: "Hủy",
      inputValidator: (value) => {
        if (!value) return "Vui lòng nhập email";
        return null;
      },
    });

    if (!result.isConfirmed || !result.value) return;

    const emailInput = result.value as string;

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email: emailInput,
      });

      Swal.fire({
        icon: "success",
        title: "Đã gửi yêu cầu",
        text:
          res.data?.message ||
          "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Gửi yêu cầu đặt lại mật khẩu thất bại.";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: msg,
      });
    }
  };
  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  };

  // input: bo tròn nhẹ, viền xanh nhạt giống thiết kế
  const inputClass =
    "w-full rounded-xl border border-[#C5E0FF] bg-white px-4 py-3 text-sm " +
    "placeholder:text-slate-400 focus:outline-none focus:border-[#1C7DF2]";
  useEffect(() => {
    // thêm class khi vào LoginPage
    document.body.classList.add("login-no-scroll");

    return () => {
      // bỏ class khi rời LoginPage (sang dashboard / admin)
      document.body.classList.remove("login-no-scroll");
    };
  }, []);


  return (
    <div
      className="
      font-display
      min-h-screen w-full
      flex items-center justify-center
      bg-[#4CA3FF]
      overflow-hidden
    "
    >
      <div className="w-full px-4">
        <div className="mx-auto w-full max-w-md">
          {/* Card trung tâm */}
          <div
            className={`
    rounded-[32px] bg-[#E3F2FF]
    shadow-[0_18px_40px_rgba(15,76,129,0.35)]
    ${isLogin ? "px-8 py-9" : "px-7 py-6"}
    max-h-[90vh] overflow-y-auto
    login-card-scroll      // 👈 thêm class này
  `}
          >
            {/* Logo + brand */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4F0FF] text-[#1C7DF2]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold text-[#1C7DF2]">
                ExamPro
              </span>
            </div>

            {/* Tiêu đề */}
            <h2 className="text-3xl font-extrabold text-slate-900 text-center">
              {isLogin ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 text-center">
              {isLogin
                ? "Đăng nhập để tiếp tục hành trình của bạn."
                : "Hoàn thiện thông tin để bắt đầu luyện thi cùng AceExam."}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Họ và tên
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Nhập họ và tên của bạn"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        Khối
                      </label>
                      <select
                        className={inputClass}
                        value={grade}
                        onChange={(e) => {
                          const newGrade = e.target.value;
                          setGrade(newGrade);
                          setClassroomId("");       // đổi khối thì xóa lớp đã chọn
                        }}
                      >
                        <option value="">Chọn khối</option>
                        {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                          <option key={g} value={g}>
                            Lớp {g}
                          </option>
                        ))}
                      </select>

                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        Trường
                      </label>
                      <select
                        className={inputClass}
                        value={schoolId}
                        onChange={(e) => setSchoolId(e.target.value)}
                      >
                        <option value="">
                          {loadingSchools
                            ? "Đang tải..."
                            : "Chọn trường học"}
                        </option>
                        {schools.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Lớp
                    </label>
                    <select
                      className={inputClass}
                      value={classroomId}
                      onChange={(e) => setClassroomId(e.target.value)}
                      disabled={!schoolId || !grade || loadingClasses}
                    >
                      <option value="">
                        {loadingClasses ? "Đang tải..." : "Chọn lớp học"}
                      </option>
                      {classrooms.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Email hoặc Tên đăng nhập
                </label>
                <input
                  className={inputClass}
                  placeholder="Nhập email hoặc tên đăng nhập"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Mật khẩu
                </label>

                <div className="relative">
                  <input
                    className={inputClass + " pr-11"}
                    placeholder="Nhập mật khẩu của bạn"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {isLogin && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="mt-1 text-xs font-medium text-[#1C7DF2] hover:underline ml-auto block"
                  >
                    Quên mật khẩu?
                  </button>
                )}

              </div>

              {/* Nút chính */}
              <button
                disabled={loading}
                className="mt-3 w-full rounded-xl bg-[#1C7DF2] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1764C7] disabled:opacity-70"
              >
                {loading
                  ? "Đang xử lý..."
                  : isLogin
                    ? "Đăng nhập"
                    : "Đăng ký"}
              </button>

              {/* Divider */}
              <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>Hoặc tiếp tục với</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Social buttons */}
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <FcGoogle className="text-lg" />
                  <span>Đăng nhập với Google</span>
                </button>


              </div>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <button
                type="button"
                onClick={() => setIsLogin((p) => !p)}
                className="font-semibold text-[#1C7DF2] hover:underline"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
