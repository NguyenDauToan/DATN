// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Shield } from "lucide-react";
import { useAuth } from "@/data/AuthContext";
import api, { authAPI, AuthUser } from "@/api/Api";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Kiểu user dùng chung (context)
export interface UserProfile {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  grade?: string;
  level?: string;
  school?: any;
  classroom?: any;
  avatar?: string;
  createdAt?: string;

  // mới
  currentSchoolYear?: any;
  needUpdateClass?: boolean;
}

// Kiểu state riêng cho form hồ sơ
type ProfileForm = {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  grade: string;
  level: string;
  schoolId: string;
  classroomId: string;
  schoolYearId: string;
  avatar: string;
  createdAt: string;
};

type SchoolOption = {
  _id: string;
  name: string;
  code?: string;
};

type ClassroomOption = {
  _id: string;
  name: string;
  code?: string;
  grade?: string;
};

type SchoolYearOption = {
  _id: string;
  name: string;
};

const parseGradeNumber = (g?: string | null): number | null => {
  if (!g) return null;
  const n = parseInt(g, 10);
  return Number.isNaN(n) ? null : n;
};

const Profile = () => {
  const { user, setUser } = useAuth();

  const [formData, setFormData] = useState<ProfileForm>({
    id: "",
    name: "",
    email: "",
    role: "student",
    grade: "",
    level: "",
    schoolId: "",
    classroomId: "",
    schoolYearId: "",
    avatar: "",
    createdAt: "",
  });

  const [loading, setLoading] = useState(true);

  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[]>([]);

  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  // lớp tối thiểu (lớp ban đầu) – không cho hạ xuống dưới
  const [minGrade, setMinGrade] = useState<number | null>(null);

  // cờ yêu cầu cập nhật lại lớp sau khi năm học cũ kết thúc
  const [mustUpdateClass, setMustUpdateClass] = useState(false);

  // -------- load danh sách trường --------
  const loadSchools = async () => {
    try {
      setLoadingSchools(true);
      const res = await api.get<{ schools: SchoolOption[] }>("/admin/schools");
      setSchools(res.data.schools || []);
    } catch (err) {
      console.error("Lỗi tải danh sách trường:", err);
      setSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  };

  // -------- load danh sách năm học (đang active) --------
  const loadSchoolYears = async () => {
    try {
      setLoadingYears(true);
      const res = await api.get<{ years: SchoolYearOption[] }>(
        "/admin/school-years"
      );

      const years = res.data.years || [];
      setSchoolYears(years);

      // nếu là học sinh và chưa có yearId -> gán năm active đầu tiên
      if (
        formData.role === "student" &&
        !formData.schoolYearId &&
        years.length > 0
      ) {
        setFormData((prev) => ({
          ...prev,
          schoolYearId: prev.schoolYearId || years[0]._id,
        }));
      }
    } catch (err) {
      console.error("Lỗi tải danh sách năm học:", err);
      setSchoolYears([]);
    } finally {
      setLoadingYears(false);
    }
  };


  // -------- load danh sách lớp theo trường --------
  const loadClassrooms = async (schoolId: string) => {
    if (!schoolId) {
      setClassrooms([]);
      return;
    }
    try {
      setLoadingClasses(true);
      const res = await api.get<{ classrooms: ClassroomOption[] }>(
        "/admin/classrooms",
        { params: { schoolId } }
      );
      setClassrooms(res.data.classrooms || []);
    } catch (err) {
      console.error("Lỗi tải danh sách lớp:", err);
      setClassrooms([]);
    } finally {
      setLoadingClasses(false);
    }
  };
  useEffect(() => {
    if (
      formData.role === "student" &&           // chỉ áp dụng cho học sinh
      !formData.schoolYearId &&                // chưa có năm học trong form
      schoolYears.length > 0                   // đã load được danh sách năm học
    ) {
      const defaultYearId = schoolYears[0]._id; // hoặc chọn theo logic khác nếu muốn
      setFormData((prev) => ({
        ...prev,
        schoolYearId: defaultYearId,
      }));
    }
  }, [formData.role, formData.schoolYearId, schoolYears]);
  const currentYearName =
    schoolYears.find((y) => y._id === formData.schoolYearId)?.name ||
    schoolYears[0]?.name ||      // fallback: năm active đầu tiên
    "Chưa có năm học";

  // ✅ Tải thông tin từ backend + load trường/lớp/năm học
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getCurrentUser(); // { user: AuthUser }
        const rawUser = res.data.user as AuthUser & { [key: string]: any };

        const id = (rawUser as any)._id || (rawUser as any).id || "";

        const schoolId =
          rawUser.school && typeof rawUser.school === "object"
            ? (rawUser.school as any)._id
            : (rawUser.school as any) || "";

        const classroomId =
          rawUser.classroom && typeof rawUser.classroom === "object"
            ? (rawUser.classroom as any)._id
            : (rawUser.classroom as any) || "";

        const schoolYearId =
          rawUser.currentSchoolYear &&
            typeof rawUser.currentSchoolYear === "object"
            ? (rawUser.currentSchoolYear as any)._id
            : (rawUser.currentSchoolYear as any) || "";

        const gradeStr = (rawUser as any).grade || "";
        const gradeNum = parseGradeNumber(gradeStr);

        setFormData({
          id,
          name: rawUser.name || "",
          email: rawUser.email || "",
          role: rawUser.role || "student",
          grade: gradeStr,
          level: (rawUser as any).level || "",
          schoolId: schoolId || "",
          classroomId: classroomId || "",
          schoolYearId: schoolYearId || "",
          avatar: (rawUser as any).avatar || "",
          createdAt: (rawUser as any).createdAt
            ? new Date((rawUser as any).createdAt).toLocaleDateString("vi-VN")
            : "",
        });

        // lưu lại lớp tối thiểu (ban đầu)
        if (gradeNum !== null) {
          setMinGrade(gradeNum);
        }

        // cờ bắt buộc cập nhật lại lớp
        setMustUpdateClass(!!(rawUser as any).needUpdateClass);

        // cập nhật context user
        setUser(rawUser as unknown as UserProfile);

        // load danh sách trường + năm học + lớp tương ứng
        await Promise.all([loadSchools(), loadSchoolYears()]);
        if (schoolId) {
          await loadClassrooms(schoolId);
        }
      } catch (err) {
        console.error("❌ Lỗi tải profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser]);

  // ✅ Cập nhật dữ liệu form (input text)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  const handleSave = async () => {
    try {
      // nếu backend yêu cầu học sinh cập nhật lại lớp khi kết thúc năm cũ
      if (formData.role === "student" && mustUpdateClass) {
        if (!formData.schoolYearId || !formData.schoolId || !formData.classroomId) {
          alert(
            "Năm học trước đã kết thúc. Vui lòng chọn đầy đủ trường và lớp hiện tại."
          );
          return;
        }

        // 🔔 XÁC NHẬN CHẮC CHẮN TRƯỚC KHI CẬP NHẬT LỚP
        const ok = window.confirm(
          "Bạn có chắc chắn muốn chọn TRƯỜNG và LỚP này làm lớp hiện tại không?\n" +
          "Sau khi lưu, bạn sẽ KHÔNG thể tự đổi lớp nữa, nếu cần đổi phải liên hệ nhà trường."
        );
        if (!ok) return;
      }

      // chặn không cho hạ lớp xuống thấp hơn lớp ban đầu
      if (formData.role === "student" && minGrade !== null) {
        const currentGradeNum = parseGradeNumber(formData.grade);
        if (currentGradeNum !== null && currentGradeNum < minGrade) {
          alert(
            `Bạn không thể cập nhật xuống lớp thấp hơn lớp hiện tại (tối thiểu: ${minGrade}).`
          );
          return;
        }
      }

      const payload = {
        name: formData.name,
        grade: formData.grade || undefined,
        level: formData.level || undefined,
        schoolId: formData.schoolId || undefined,
        classroomId: formData.classroomId || undefined,
        schoolYearId: formData.schoolYearId || undefined,
        avatar: formData.avatar || undefined,
      };

      const res = await authAPI.updateUser(payload);

      const updatedUser = res.data.user as AuthUser & { [key: string]: any };

      alert("✅ Cập nhật thành công!");

      setUser(updatedUser as unknown as UserProfile);

      // cập nhật lại form theo user mới (phòng trường hợp backend sửa lại năm học, lớp, cờ needUpdateClass)
      const newSchoolId =
        updatedUser.school && typeof updatedUser.school === "object"
          ? (updatedUser.school as any)._id
          : (updatedUser.school as any) || "";

      const newClassroomId =
        updatedUser.classroom && typeof updatedUser.classroom === "object"
          ? (updatedUser.classroom as any)._id
          : (updatedUser.classroom as any) || "";

      const newSchoolYearId =
        updatedUser.currentSchoolYear &&
          typeof updatedUser.currentSchoolYear === "object"
          ? (updatedUser.currentSchoolYear as any)._id
          : (updatedUser.currentSchoolYear as any) || "";

      setFormData((prev) => ({
        ...prev,
        grade: (updatedUser as any).grade || prev.grade,
        level: (updatedUser as any).level || prev.level,
        schoolId: newSchoolId || prev.schoolId,
        classroomId: newClassroomId || prev.classroomId,
        schoolYearId: newSchoolYearId || prev.schoolYearId,
        avatar: (updatedUser as any).avatar || prev.avatar,
      }));

      setMustUpdateClass(!!(updatedUser as any).needUpdateClass);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
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

  const minGradeText =
    minGrade !== null ? `(Không thể xuống dưới lớp ${minGrade})` : "";

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
                    Tham gia {formData.createdAt ? formData.createdAt : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form chỉnh sửa */}
          <Card className="border-border/70 bg-card/95 backdrop-blur-sm shadow-lg animate-slide-in">
            <CardHeader className="pb-4 space-y-3">
              <CardTitle className="text-base md:text-lg font-semibold">
                Thông tin cá nhân
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Cập nhật thông tin hiển thị trong hệ thống luyện thi.
              </p>

              {formData.role === "student" && mustUpdateClass && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Năm học trước đã kết thúc. Vui lòng chọn{" "}
                  <span className="font-semibold"> trường và lớp hiện tại</span>{" "}
                  rồi bấm lưu để tiếp tục sử dụng hệ thống.
                </div>
              )}
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
              {/* Lớp + Level */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="grade">
                    Lớp{" "}
                    <span className="text-[10px] text-muted-foreground">
                      {minGradeText}
                    </span>
                  </Label>
                  <Input
                    id="grade"
                    value={formData.grade || ""}
                    readOnly
                    disabled
                    className="rounded-xl bg-muted/60 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Lớp được hệ thống xác định theo lớp bạn chọn bên dưới, không thể nhập tay.
                  </p>
                </div>
                {/* Năm học hiện tại – chỉ hiển thị, không cho sửa */}
                <div className="space-y-2">
                  <Label>Năm học hiện tại</Label>
                  <Input
                    value={currentYearName}
                    readOnly
                    className="rounded-xl bg-muted/60 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Năm học được hệ thống xác định, bạn không thể chỉnh sửa.
                  </p>
                </div>

              </div>


              {/* Năm học + Trường + Lớp */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">


                {/* Trường */}
                <div className="space-y-2">
                  <Label>Trường</Label>
                  <Select
                    value={formData.schoolId}
                    onValueChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        schoolId: value,
                        classroomId: "",
                      }));
                      loadClassrooms(value);
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue
                        placeholder={
                          loadingSchools ? "Đang tải trường..." : "Chọn trường"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name} {s.code ? `(${s.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lớp (trong trường) */}
                <div className="space-y-2">
                  <Label>Lớp (trong trường)</Label>
                  <Select
                    value={formData.classroomId}
                    onValueChange={(value) => {
                      const selected = classrooms.find((c) => c._id === value);
                      setFormData((prev) => ({
                        ...prev,
                        classroomId: value,
                        grade: selected?.grade || prev.grade,
                      }));
                    }}
                    disabled={
                      !formData.schoolId || loadingClasses || classrooms.length === 0
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue
                        placeholder={
                          !formData.schoolId
                            ? "Chọn trường trước"
                            : loadingClasses
                              ? "Đang tải lớp..."
                              : classrooms.length === 0
                                ? "Không có lớp"
                                : "Chọn lớp"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.map((c) => {
                        const cGradeNum = parseGradeNumber(c.grade);
                        const disableThis =
                          minGrade !== null &&
                          cGradeNum !== null &&
                          cGradeNum < minGrade;
                        return (
                          <SelectItem
                            key={c._id}
                            value={c._id}
                            disabled={disableThis}
                          >
                            {c.name} {c.code ? `(${c.code})` : ""}{" "}
                            {c.grade ? `- Khối ${c.grade}` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {minGrade !== null && (
                    <p className="text-[11px] text-muted-foreground">
                      Các lớp thuộc khối thấp hơn {minGrade} sẽ bị khóa, không thể
                      chọn.
                    </p>
                  )}
                </div>
              </div>


              {/* Avatar URL */}


              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2 md:flex-row">
                <Button
                  onClick={handleSave}
                  className="flex-1 rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                  Lưu thay đổi
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
