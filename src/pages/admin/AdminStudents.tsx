// src/pages/admin/AdminStudents.tsx
import { useEffect, useState } from "react";
import api from "@/api/Api";
import { useAuth } from "@/data/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type School = {
  _id: string;
  name: string;
  code?: string;
};

type Classroom = {
  _id: string;
  name: string;
  grade?: string;
  code?: string;
};

const AdminStudents = () => {
  const { user: currentUser } = useAuth();
  const managerSchoolId =
    (currentUser?.school &&
      (currentUser.school as any)._id) ||
    (currentUser?.school as any) ||
    null;
  const managerSchoolName =
    (currentUser?.school as any)?.name || "Trường của bạn";

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
  });

  const [schools, setSchools] = useState<School[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("none");
  const [selectedClassroomId, setSelectedClassroomId] =
    useState<string>("none");
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // 🔹 thêm state cho CHỈNH SỬA
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  // ⭐ lấy role hiện tại
  const currentRole =
    typeof window !== "undefined" ? localStorage.getItem("role") || "" : "";

  const fetchUsers = async () => {
    try {
      setLoading(true);

      if (currentRole === "teacher") {
        // ⭐ TEACHER: lấy học sinh theo tất cả lớp mình dạy
        const res = await api.get("/admin/users/my-students/by-class");
        const classes = res.data?.classes || [];

        const flattened = classes.flatMap((cls: any) =>
          (cls.students || []).map((s: any) => ({
            ...s,
            // ép classroom để bảng bên dưới hiển thị tên lớp/khối đúng
            classroom: {
              _id: cls.classroomId,
              name: cls.name,
              grade: cls.grade,
            },
            // ưu tiên school của lớp; fallback school gốc của student (nếu có)
            school: cls.school || s.school,
          }))
        );

        setUsers(flattened);
      } else {
        // ⭐ ADMIN / SCHOOL_MANAGER: logic cũ
        const res = await api.get("/admin/users");
        const onlyStudents = (res.data || []).filter(
          (u: any) => u.role === "student"
        );
        setUsers(onlyStudents);
      }
    } catch (err) {
      console.error("Lỗi khi lấy danh sách user:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      const res = await api.get("/admin/schools");
      const data: School[] = res.data?.schools || res.data || [];
      setSchools(data);
    } catch (err) {
      console.error("Lỗi lấy danh sách trường:", err);
      setSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  };

  const fetchClassrooms = async (schoolId: string) => {
    if (!schoolId || schoolId === "none") {
      setClassrooms([]);
      return;
    }
    try {
      setLoadingClasses(true);
      const res = await api.get("/admin/classrooms", {
        params: { schoolId },
      });
      const data: Classroom[] = res.data?.classrooms || res.data || [];
      setClassrooms(data);
    } catch (err) {
      console.error("Lỗi lấy danh sách lớp:", err);
      setClassrooms([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa học viên này?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("Lỗi khi xóa user:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tải trường khi mở dialog tạo hoặc dialog sửa (và không phải teacher)
  useEffect(() => {
    if (
      (createOpen || editOpen) &&
      schools.length === 0 &&
      currentRole !== "teacher"
    ) {
      fetchSchools();
    }
  }, [createOpen, editOpen, currentRole, schools.length]);

  useEffect(() => {
    if (selectedSchoolId && selectedSchoolId !== "none") {
      fetchClassrooms(selectedSchoolId);
      setSelectedClassroomId("none");
    } else {
      setClassrooms([]);
      setSelectedClassroomId("none");
    }
  }, [selectedSchoolId]);

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  useEffect(() => {
    // nếu là school_manager và có trường thì cố định trường
    if (currentRole === "school_manager" && managerSchoolId) {
      setSelectedSchoolId(managerSchoolId);
      fetchClassrooms(managerSchoolId); // load lớp thuộc trường đó
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole, managerSchoolId]);

  // ✅ helper: undefined -> active, chỉ false mới bị chặn
  const isUserActive = (u: any) => u.isActive !== false;

  const getStatusBadge = (u: any) =>
    isUserActive(u) ? (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
        Hoạt động
      </Badge>
    ) : (
      <Badge className="bg-rose-50 text-rose-700 border border-rose-200">
        Bị chặn
      </Badge>
    );

  // ✅ thống kê: chỉ tính blocked khi isActive === false
  const total = users.length;
  const blocked = users.filter((u) => u.isActive === false).length;

  const getRoleBadge = () => {
    return <Badge variant="outline">Student</Badge>;
  };

  const handleCreateChange =
    (field: "name" | "email") =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
      };

  const handleCreateUser = async () => {
    if (!createForm.name.trim() || !createForm.email.trim()) {
      alert("Tên và email không được để trống.");
      return;
    }

    try {
      setCreating(true);
      await api.post("/admin/users", {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        role: "student",
        school:
          currentRole === "school_manager"
            ? undefined // BE tự gắn trường của manager
            : selectedSchoolId === "none"
              ? undefined
              : selectedSchoolId,
        classes: selectedClassroomId === "none" ? [] : [selectedClassroomId],
      });
      alert("Tạo tài khoản học viên thành công.");
      setCreateOpen(false);
      setCreateForm({ name: "", email: "" });

      // 🔑 KHÔNG reset schoolId cho school_manager
      if (currentRole === "school_manager") {
        setSelectedClassroomId("none");
      } else {
        setSelectedSchoolId("none");
        setSelectedClassroomId("none");
      }

      fetchUsers();
    } catch (err: any) {
      console.error("Lỗi tạo user:", err);
      alert(
        err?.response?.data?.message ||
        "Lỗi khi tạo tài khoản. Vui lòng thử lại."
      );
    } finally {
      setCreating(false);
    }
  };


  // 🔹 handler đổi form edit
  const handleEditChange =
    (field: "name" | "email") =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
      };

  // 🔹 mở dialog chỉnh sửa từ bảng
  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
    });

    // ⭐ Nếu là school_manager: luôn dùng trường mà manager đang quản lý
    const schoolId =
      currentRole === "school_manager"
        ? managerSchoolId
        : (user.school && (user.school._id || user.school)) || "none";

    setSelectedSchoolId(schoolId || "none");

    // set lớp hiện tại (ưu tiên classroom, sau đó classes[0])
    let classId = "none";
    if (user.classroom) {
      classId = user.classroom._id || user.classroom;
    } else if (user.classes && user.classes.length > 0) {
      const c = user.classes[0];
      classId = c._id || c;
    }
    setSelectedClassroomId(classId || "none");

    setEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      alert("Tên và email không được để trống.");
      return;
    }

    const schoolIdToSend =
      currentRole === "school_manager"
        ? managerSchoolId
        : selectedSchoolId === "none"
          ? undefined
          : selectedSchoolId;

    const classroomIdToSend =
      selectedClassroomId === "none" ? null : selectedClassroomId;

    try {
      setEditing(true);

      await api.put(`/admin/users/${editingUser._id}`, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
      });

      await api.put("/auth/update", {
        userId: editingUser._id,
        name: editForm.name.trim(),
        schoolId: schoolIdToSend,
        classroomId: classroomIdToSend,
      });

      alert("Cập nhật thông tin học viên thành công.");
      setEditOpen(false);
      setEditingUser(null);
      setEditForm({ name: "", email: "" });

      // 🔑 KHÔNG reset schoolId cho school_manager
      if (currentRole === "school_manager") {
        setSelectedClassroomId("none");
      } else {
        setSelectedSchoolId("none");
        setSelectedClassroomId("none");
      }

      fetchUsers();
    } catch (err: any) {
      console.error("Lỗi cập nhật user:", err);
      alert(
        err?.response?.data?.message ||
        "Lỗi khi cập nhật tài khoản. Vui lòng thử lại."
      );
    } finally {
      setEditing(false);
    }
  };



  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh] animate-fade-in">
        <Loader2 className="animate-spin h-6 w-6 text-primary mr-2" />
        <p className="text-sm text-muted-foreground">
          Đang tải danh sách học viên...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Quản lý học sinh
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            {currentRole === "teacher"
              ? "Thống kê và theo dõi học viên thuộc các lớp bạn đang dạy."
              : "Theo dõi, tìm kiếm và cập nhật trạng thái tài khoản học viên."}
          </p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
          <CardContent className="py-3.5 px-4 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Tổng học viên
            </span>
            <span className="text-xl font-semibold text-foreground">
              {total}
            </span>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
          <CardContent className="py-3.5 px-4 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Đang hoạt động
            </span>
            <span className="text-xl font-semibold text-emerald-600">
              {total - blocked}
            </span>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
          <CardContent className="py-3.5 px-4 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Bị chặn
            </span>
            <span className="text-xl font-semibold text-rose-600">
              {blocked}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Card chính */}
      <Card className="border border-border/80 shadow-sm hover:shadow-md transition-all duration-200 animate-slide-in">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
              Danh sách học viên
              <Badge variant="outline" className="text-[11px]">
                {filteredUsers.length}/{users.length} hiển thị
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Tìm kiếm theo tên, email và thao tác nhanh trên từng tài khoản.
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
            {/* Ô tìm kiếm */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-background/80 focus-visible:ring-1 focus-visible:ring-primary/70"
              />
            </div>

            {/* ⭐ Teacher không được tạo học viên */}
            {currentRole !== "teacher" && (
              <Button
                className="h-10 rounded-xl sm:ml-2"
                onClick={() => setCreateOpen(true)}
              >
                Thêm học viên
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-hidden rounded-b-2xl border-t border-border/70 bg-card/60">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/70 backdrop-blur z-10">
                <TableRow className="border-border/70">
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Tài khoản
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Trường
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Lớp
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Vai trò
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-right font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-muted-foreground text-sm"
                    >
                      Không có học viên nào phù hợp với từ khóa tìm kiếm.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, idx) => {
                    const initial =
                      typeof user.name === "string" && user.name.trim().length
                        ? user.name.trim().charAt(0).toUpperCase()
                        : "?";

                    return (
                      <TableRow
                        key={user._id}
                        className="hover:bg-primary/5 transition-all group"
                        style={{ animationDelay: `${idx * 35}ms` }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-sky-500 text-white flex items-center justify-center text-xs font-semibold shadow-sm group-hover:scale-105 transition-transform">
                              {initial}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {user.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                Học viên
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.school
                            ? `${user.school.name}${user.school.code
                              ? ` (${user.school.code})`
                              : ""
                            }`
                            : "—"}
                        </TableCell>

                        {/* Lớp */}
                        <TableCell className="text-sm text-muted-foreground">
                          {user.classroom
                            ? `${user.classroom.name}${user.classroom.grade
                              ? ` - Khối ${user.classroom.grade}`
                              : ""
                            }`
                            : user.classes && user.classes.length > 0
                              ? user.classes[0].name
                              : "—"}
                        </TableCell>
                        <TableCell>{getRoleBadge()}</TableCell>
                        <TableCell>{getStatusBadge(user)}</TableCell>
                        <TableCell className="text-right">
                          {currentRole === "teacher" ? (
                            // Giáo viên chỉ được xem, không có thao tác
                            <span className="text-[11px] text-muted-foreground">—</span>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-muted/80"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="border shadow-md rounded-lg bg-card/95 backdrop-blur"
                              >
                                {/* chỉ admin / school_manager mới được chỉnh sửa */}
                                {currentRole !== "teacher" && (
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => openEditDialog(user)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Chỉnh sửa thông tin
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={async () => {
                                    try {
                                      const currentlyActive = isUserActive(user);
                                      const nextIsActive = currentlyActive ? false : true;

                                      const res = await api.put(
                                        `/admin/users/${user._id}/active`,
                                        { isActive: nextIsActive }
                                      );

                                      setUsers((prev) =>
                                        prev.map((u) => (u._id === user._id ? res.data : u))
                                      );
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                >
                                  {isUserActive(user)
                                    ? "Chặn tài khoản"
                                    : "Mở khóa tài khoản"}
                                </DropdownMenuItem>

                                {currentRole !== "teacher" && (
                                  <DropdownMenuItem
                                    onClick={() => deleteUser(user._id)}
                                    className="text-red-600 focus:text-red-700 cursor-pointer"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa tài khoản
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>

                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog tạo học viên – teacher không dùng */}
      <Dialog
        open={createOpen && currentRole !== "teacher"}
        onOpenChange={(open) => {
          if (currentRole === "teacher") return;
          setCreateOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm học viên mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản học viên với vai trò mặc định là Student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Họ tên</label>
              <Input
                placeholder="VD: Nguyễn Văn A"
                value={createForm.name}
                onChange={handleCreateChange("name")}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                placeholder="VD: hocvien@example.com"
                type="email"
                value={createForm.email}
                onChange={handleCreateChange("email")}
              />
            </div>


            {/* Chọn trường */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Trường</label>

              {currentRole === "school_manager" ? (
                // ⭐ Manager: hiển thị cố định trường của mình, không cho chọn
                <div className="px-3 py-2 rounded-md border bg-muted/40 text-sm">
                  {managerSchoolName}
                </div>
              ) : (
                <Select
                  value={selectedSchoolId}
                  onValueChange={(val) => setSelectedSchoolId(val)}
                  disabled={loadingSchools}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingSchools ? "Đang tải trường..." : "Chọn trường"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không gắn trường —</SelectItem>
                    {schools.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                        {s.code ? ` (${s.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>




            {/* Chọn lớp */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Lớp học</label>
              <Select
                value={selectedClassroomId}
                onValueChange={(val) => setSelectedClassroomId(val)}
                disabled={
                  loadingClasses ||
                  selectedSchoolId === "none" ||
                  classrooms.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedSchoolId === "none"
                        ? "Chọn trường trước"
                        : loadingClasses
                          ? "Đang tải lớp..."
                          : "Chọn lớp (không bắt buộc)"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Không gắn lớp —</SelectItem>
                  {classrooms.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                      {c.grade ? ` - Khối ${c.grade}` : ""}
                      {c.code ? ` (${c.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Mật khẩu mặc định: <span className="font-mono">123456</span>{" "}
              (học viên có thể đổi sau).
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleCreateUser}
                disabled={creating}
              >
                {creating ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa học viên */}
      <Dialog
        open={editOpen && currentRole !== "teacher"}
        onOpenChange={(open) => {
          if (!open) {
            setEditOpen(false);
            setEditingUser(null);
            setEditForm({ name: "", email: "" });

            // 🔑 Chỉ reset schoolId nếu KHÔNG phải school_manager
            if (currentRole === "school_manager") {
              setSelectedClassroomId("none");
            } else {
              setSelectedSchoolId("none");
              setSelectedClassroomId("none");
            }
          } else {
            setEditOpen(true);
          }
        }}
      >

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin học sinh</DialogTitle>
            <DialogDescription>
              Cập nhật họ tên, email, trường và lớp học của học sinh.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Họ tên</label>
              <Input
                placeholder="VD: Nguyễn Văn A"
                value={editForm.name}
                onChange={handleEditChange("name")}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                placeholder="VD: hocvien@example.com"
                type="email"
                value={editForm.email}
                onChange={handleEditChange("email")}
              />
            </div>

            {/* Chọn trường */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Trường</label>

              {currentRole === "school_manager" ? (
                // ⭐ Manager: cố định trường, không cho chọn
                <div className="px-3 py-2 rounded-md border bg-muted/40 text-sm">
                  {managerSchoolName}
                </div>
              ) : (
                <Select
                  value={selectedSchoolId}
                  onValueChange={(val) => setSelectedSchoolId(val)}
                  disabled={loadingSchools}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingSchools ? "Đang tải trường..." : "Chọn trường"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không gắn trường —</SelectItem>
                    {schools.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                        {s.code ? ` (${s.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>


            {/* Chọn lớp */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Lớp học</label>
              <Select
                value={selectedClassroomId}
                onValueChange={(val) => setSelectedClassroomId(val)}
                disabled={
                  loadingClasses ||
                  selectedSchoolId === "none" ||
                  classrooms.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedSchoolId === "none"
                        ? "Chọn trường trước"
                        : loadingClasses
                          ? "Đang tải lớp..."
                          : "Chọn lớp (không bắt buộc)"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Không gắn lớp —</SelectItem>
                  {classrooms.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                      {c.grade ? ` - Khối ${c.grade}` : ""}
                      {c.code ? ` (${c.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setEditingUser(null);
                  setEditForm({ name: "", email: "" });

                  if (currentRole === "school_manager") {
                    setSelectedClassroomId("none");
                  } else {
                    setSelectedSchoolId("none");
                    setSelectedClassroomId("none");
                  }
                }}
              >
                Hủy
              </Button>

              <Button
                type="button"
                onClick={handleUpdateUser}
                disabled={editing}
              >
                {editing ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudents;
