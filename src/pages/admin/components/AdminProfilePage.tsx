// src/pages/admin/AdminProfile.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AdminLayout from "../AdminLayout";

type School = {
  _id: string;
  name: string;
  code?: string;
};

type Classroom = {
  _id: string;
  name: string;
  code?: string;
  grade?: string;
};

type ProfileUser = {
  _id: string;
  name: string;
  email: string;
  role: "teacher" | "school_manager" | "admin" | "student";
  grade?: string;
  school?: School | null;
  classroom?: Classroom | null;
  classes?: Classroom[];
  avatarUrl?: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://english-backend-uoic.onrender.com";

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<ProfileUser | null>(null);

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [grade] = useState(""); // không cho sửa, chỉ hiển thị từ user
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const loadProfile = async () => {
    if (!token) {
      toast.error("Vui lòng đăng nhập lại");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: ProfileUser = res.data;
      setUser(data);
      setName(data.name || "");
      setAvatarUrl(data.avatarUrl || "");
    } catch (err: any) {
      console.error("Lỗi load profile:", err);
      toast.error(
        err?.response?.data?.message || "Không thể tải thông tin tài khoản"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) {
      toast.error("Vui lòng đăng nhập lại");
      return;
    }

    if (newPassword || confirmNewPassword || currentPassword) {
      if (!currentPassword) {
        toast.error("Vui lòng nhập mật khẩu hiện tại");
        return;
      }
      if (!newPassword) {
        toast.error("Vui lòng nhập mật khẩu mới");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.error("Mật khẩu mới và xác nhận không khớp");
        return;
      }
    }

    try {
      setSaving(true);
      const payload: any = {
        name,
        avatarUrl,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await axios.put(`${API_BASE_URL}/api/profile/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Cập nhật thông tin thành công");
      if (res.data?.user) {
        setUser(res.data.user);

        // cập nhật localStorage "user" nếu bạn đang dùng nó cho navbar/avatar
        try {
          const rawUser = localStorage.getItem("user");
          if (rawUser) {
            const parsed = JSON.parse(rawUser);
            localStorage.setItem(
              "user",
              JSON.stringify({
                ...parsed,
                name: res.data.user.name,
                avatarUrl: res.data.user.avatarUrl,
              })
            );
          }
        } catch {
          // ignore
        }
      }

      // reset field mật khẩu sau khi đổi xong
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      console.error("Lỗi cập nhật profile:", err);
      toast.error(
        err?.response?.data?.message || "Lỗi khi cập nhật thông tin tài khoản"
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Đang tải thông tin tài khoản...
          </p>
        </div>
    );
  }

  if (!user) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-sm text-muted-foreground">
            Không tìm thấy thông tin tài khoản.
          </p>
        </div>
    );
  }

  return (
      <div className="max-w-3xl mx-auto pb-10 space-y-6">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Account profile
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
            Thông tin tài khoản
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
            Xem và cập nhật thông tin cơ bản của tài khoản giáo viên / quản lý
            trường.
          </p>
        </div>

        <Card className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base md:text-lg">
              Thông tin cá nhân
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Bạn có thể đổi tên, avatar và mật khẩu. Trường và lớp được quản lý
              bởi admin.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-5">
            {/* Hàng 1: Họ tên + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar (URL ảnh)</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Dán link ảnh avatar, ví dụ: https://..."
              />
              {/* Nếu muốn hiển thị preview */}
              {avatarUrl && (
                <div className="mt-2">
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="h-16 w-16 rounded-full object-cover border"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")
                    }
                  />
                </div>
              )}
            </div>

            {/* Vai trò + grade chỉ hiển thị, không cho sửa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Input
                  value={
                    user.role === "teacher"
                      ? "Giáo viên"
                      : user.role === "school_manager"
                      ? "Quản lý trường"
                      : user.role === "admin"
                      ? "Quản trị hệ thống"
                      : "Học sinh"
                  }
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label>Khối / lớp phụ trách (grade)</Label>
                <Input
                  value={user.grade || ""}
                  disabled
                  placeholder="Do admin cấu hình"
                />
              </div>
            </div>

            {/* Trường + Lớp chính chỉ đọc */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trường</Label>
                <Input
                  value={
                    user.school
                      ? `${user.school.name}${
                          user.school.code ? ` (${user.school.code})` : ""
                        }`
                      : "Chưa gắn trường"
                  }
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label>Lớp chính (classroom)</Label>
                <Input
                  value={
                    user.classroom
                      ? `${user.classroom.name}${
                          user.classroom.code
                            ? ` (${user.classroom.code})`
                            : ""
                        }${
                          user.classroom.grade
                            ? ` - Khối ${user.classroom.grade}`
                            : ""
                        }`
                      : "Chưa gắn lớp"
                  }
                  disabled
                />
              </div>
            </div>

            {/* Đổi mật khẩu */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <p className="text-sm font-medium">Đổi mật khẩu</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">
                  Xác nhận mật khẩu mới
                </Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>

            {/* Nút lưu */}
            <div className="flex justify-end pt-2">
              <Button
                className="rounded-xl"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
