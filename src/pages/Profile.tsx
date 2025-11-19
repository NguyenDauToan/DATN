import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Shield } from "lucide-react";
import { useAuth } from "@/data/AuthContext";
import { authAPI } from "@/api/Api";

// 🧩 Khai báo kiểu dữ liệu phản hồi từ backend
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  grade?: string;
  level?: string;
  school?: string;
  avatar?: string;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

const Profile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    role: "student",
    grade: "",
    level: "",
    school: "",
    avatar: "",
    createdAt: "",
  });

  const [loading, setLoading] = useState(true);

  // ✅ Tải thông tin từ backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getCurrentUser();
        const data = res.data;

        const userData: UserProfile = "user" in data ? data.user : data;

        setFormData({
          id: userData.id || "",
          name: userData.name || "",
          email: userData.email || "",
          role: userData.role || "student",
          grade: userData.grade || "",
          level: userData.level || "",
          school: userData.school || "",
          avatar: userData.avatar || "",
          createdAt: userData.createdAt
            ? new Date(userData.createdAt).toLocaleDateString("vi-VN")
            : "",
        });

        setUser(userData);
      } catch (err) {
        console.error("❌ Lỗi tải profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setUser]);

  // ✅ Cập nhật dữ liệu form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  // ✅ Lưu thay đổi
  const handleSave = async () => {
    try {
      const res = await authAPI.updateUser(formData);
      alert("✅ Cập nhật thành công!");
      setUser(res.data);
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      alert("Cập nhật thất bại!");
    }
  };

  const getRoleLabel = (role: UserProfile["role"]) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "teacher":
        return "Giáo viên";
      default:
        return "Học sinh";
    }
  };

  const getRoleBadgeVariant = (role: UserProfile["role"]) => {
    switch (role) {
      case "admin":
        return "destructive" as const;
      case "teacher":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">
            Đang tải thông tin hồ sơ...
          </p>
        </div>
      </div>
    );

  const initials =
    formData.name
      ?.trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/70">
              Tài khoản
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Hồ sơ cá nhân
            </h1>
            <p className="text-sm text-muted-foreground">
              Xem và chỉnh sửa thông tin tài khoản của bạn.
            </p>
          </div>

          <Card className="border-primary/10 bg-primary/5 shadow-sm animate-slide-in">
            <CardContent className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                <Shield className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  Vai trò: {getRoleLabel(formData.role)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Một số quyền và tính năng được hiển thị theo vai trò.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          {/* Avatar + Info */}
          <Card className="border-border/70 bg-card/95 backdrop-blur-sm shadow-md animate-slide-in">
            <CardContent className="flex flex-col items-center gap-4 px-6 py-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
                  <AvatarImage src={formData.avatar} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-medium text-white shadow">
                  Đang hoạt động
                </span>
              </div>

              <div className="space-y-1 text-center">
                <h3 className="text-lg font-semibold text-foreground">
                  {formData.name || "Chưa cập nhật tên"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formData.grade
                    ? `Học sinh lớp ${formData.grade}`
                    : "Chưa có thông tin lớp học"}
                </p>
              </div>

              <Badge
                variant={getRoleBadgeVariant(formData.role)}
                className="rounded-full px-3 py-1 text-[11px] font-medium"
              >
                {getRoleLabel(formData.role)}
              </Badge>

              <div className="mt-4 w-full space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{formData.email}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Tham gia{" "}
                    {formData.createdAt ? formData.createdAt : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form chỉnh sửa */}
          <Card className="border-border/70 bg-card/95 backdrop-blur-sm shadow-lg animate-slide-in">
            <CardHeader className="pb-4">
              <CardTitle className="text-base md:text-lg font-semibold">
                Thông tin cá nhân
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Cập nhật thông tin hiển thị trong hệ thống luyện thi.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Tên + Email */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập họ tên đầy đủ..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="rounded-xl bg-muted/60"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Email dùng để đăng nhập, không thể thay đổi.
                  </p>
                </div>
              </div>

              {/* Lớp + Level */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="grade">Lớp</Label>
                  <Input
                    id="grade"
                    value={formData.grade || ""}
                    onChange={handleChange}
                    placeholder="VD: 9, 10, 11, 12..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Cấp độ hiện tại</Label>
                  <Input
                    id="level"
                    value={formData.level || ""}
                    onChange={handleChange}
                    placeholder="VD: Beginner, Intermediate, IELTS 6.0..."
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Trường */}
              <div className="space-y-2">
                <Label htmlFor="school">Trường</Label>
                <Input
                  id="school"
                  value={formData.school || ""}
                  onChange={handleChange}
                  placeholder="Nhập tên trường đang học..."
                  className="rounded-xl"
                />
              </div>

              {/* Avatar URL (ẩn nếu không cần) */}
              <div className="space-y-2">
                <Label htmlFor="avatar">Ảnh đại diện (URL)</Label>
                <Input
                  id="avatar"
                  value={formData.avatar || ""}
                  onChange={handleChange}
                  placeholder="Dán đường dẫn ảnh nếu có..."
                  className="rounded-xl"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2 md:flex-row">
                <Button
                  onClick={handleSave}
                  className="flex-1 rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                  Lưu thay đổi
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    // reload nhẹ form từ context user nếu có
                    if (!user) return;
                    setFormData((prev) => ({
                      ...prev,
                      name: user.name || prev.name,
                      grade: user.grade || prev.grade,
                      level: user.level || prev.level,
                      school: user.school || prev.school,
                      avatar: user.avatar || prev.avatar,
                    }));
                  }}
                >
                  Khôi phục từ dữ liệu hiện tại
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
