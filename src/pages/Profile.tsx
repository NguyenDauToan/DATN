import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Calendar } from "lucide-react";
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
  
        // 🧩 Dùng type guard để xác định đúng cấu trúc dữ liệu
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
    setFormData({ ...formData, [e.target.id]: e.target.value });
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

  if (loading) return <p className="text-center mt-10">Đang tải...</p>;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Hồ sơ cá nhân
          </h1>
          <p className="text-muted-foreground">
            Quản lý thông tin và cài đặt của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar + Info */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6 text-center space-y-4">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarImage src={formData.avatar} />
                <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                  {formData.name
                    ? formData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"}
                </AvatarFallback>
              </Avatar>

              <div>
                <h3 className="text-xl font-bold">{formData.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formData.grade
                    ? `Học sinh lớp ${formData.grade}`
                    : "Chưa có thông tin lớp"}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{formData.email}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Tham gia: {formData.createdAt}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form chỉnh sửa */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Lớp</Label>
                  <Input
                    id="grade"
                    value={formData.grade || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Cấp độ hiện tại</Label>
                  <Input
                    id="level"
                    value={formData.level || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school">Trường</Label>
                <Input
                  id="school"
                  value={formData.school || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSave} className="flex-1">
                  Lưu thay đổi
                </Button>
                <Button variant="outline" className="flex-1">
                  Hủy
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
