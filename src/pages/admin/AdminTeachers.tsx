// src/pages/admin/AdminTeachers.tsx
import type React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
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
import { Search, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";

// Select cho phần chọn trường
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type School = {
  _id: string;
  name: string;
  code?: string;
};

const AdminTeachers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // role hiện tại
  const [currentRole] = useState(() => localStorage.getItem("role") || "");
  const token = localStorage.getItem("token");

  // dialog tạo teacher
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    schoolId: "",
  });

  // trường bị khóa theo school_manager
  const [lockedSchool, setLockedSchool] = useState<School | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teachers = (res.data || []).filter(
        (u: any) => u.role === "teacher"
      );
      setUsers(teachers);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách giáo viên:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      const res = await axios.get<{ schools: School[] }>(
        `${API_BASE_URL}/api/admin/schools`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSchools(res.data.schools || []);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách trường:", err);
    } finally {
      setLoadingSchools(false);
    }
  };

  // lấy trường từ profile cho school_manager
  const fetchProfileSchool = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const school: School | null = res.data?.school || null;
      if (school) {
        setLockedSchool(school);
        setCreateForm((prev) => ({ ...prev, schoolId: school._id }));
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin trường từ profile:", err);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa giáo viên này?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error("Lỗi khi xóa giáo viên:", err);
    }
  };

  useEffect(() => {
    fetchUsers();

    // admin: load toàn bộ trường
    // school_manager: khóa theo trường của mình
    if (currentRole === "school_manager") {
      fetchProfileSchool();
    } else {
      fetchSchools();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (u: any) =>
    u.isActive ? (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
        Hoạt động
      </Badge>
    ) : (
      <Badge className="bg-rose-50 text-rose-700 border border-rose-200">
        Bị chặn
      </Badge>
    );

  const getRoleBadge = () => (
    <Badge className="bg-blue-500/90 text-white shadow-sm">Teacher</Badge>
  );

  const getSchoolLabel = (user: any) => {
    const userSchoolId =
      typeof user.school === "string" ? user.school : user.school?._id;
    if (!userSchoolId) return "—";

    const s = schools.find((sc) => sc._id === userSchoolId);
    // nếu school_manager, users trả về đã populate school, fallback dùng user.school
    if (!s && user.school && typeof user.school === "object") {
      return user.school.code
        ? `${user.school.name} (${user.school.code})`
        : user.school.name;
    }

    if (!s) return "—";
    return s.code ? `${s.name} (${s.code})` : s.name;
  };

  const total = users.length;
  const active = users.filter((u) => u.isActive).length;
  const blocked = users.filter((u) => !u.isActive).length;

  const handleCreateChange =
    (field: "name" | "email") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // chọn trường trong dialog (chỉ dùng cho admin)
  const handleSelectSchool = (value: string) => {
    setCreateForm((prev) => ({
      ...prev,
      schoolId: value,
    }));
  };

  const handleCreateUser = async () => {
    if (!createForm.name.trim() || !createForm.email.trim()) {
      alert("Tên và email không được để trống.");
      return;
    }
    if (!createForm.schoolId) {
      alert("Giáo viên phải được gán vào một trường.");
      return;
    }

    try {
      setCreating(true);
      await axios.post(
        `${API_BASE_URL}/api/admin/users`,
        {
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          role: "teacher",
          school: createForm.schoolId, // với school_manager backend cũng override bằng req.user.school
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Tạo tài khoản giáo viên thành công.");
      setCreateOpen(false);
      setCreateForm({
        name: "",
        email: "",
        schoolId: lockedSchool?._id || "",
      });
      fetchUsers();
    } catch (err: any) {
      console.error("Lỗi tạo giáo viên:", err);
      alert(
        err?.response?.data?.message ||
          "Lỗi khi tạo tài khoản giáo viên. Vui lòng thử lại."
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh] animate-fade-in">
        <Loader2 className="animate-spin h-6 w-6 text-primary mr-2" />
        <p className="text-sm text-muted-foreground">
          Đang tải danh sách giáo viên...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
   
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
          <CardContent className="py-3.5 px-4 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Tổng giáo viên
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
              {active}
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
              Danh sách giáo viên
              <Badge variant="outline" className="text-[11px]">
                {filteredUsers.length}/{users.length} hiển thị
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Tìm kiếm theo tên, email và thao tác nhanh trên từng giáo viên.
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

            <Button
              className="h-10 rounded-xl sm:ml-2"
              onClick={() => setCreateOpen(true)}
            >
              Thêm giáo viên
            </Button>
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
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground text-sm"
                    >
                      Không có giáo viên nào phù hợp với từ khóa tìm kiếm.
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
                                Giáo viên
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getSchoolLabel(user)}
                        </TableCell>
                        <TableCell>{getStatusBadge(user)}</TableCell>
                        <TableCell className="text-right">
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
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa thông tin
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={async () => {
                                  try {
                                    const res = await axios.put(
                                      `${API_BASE_URL}/api/admin/users/${user._id}/active`,
                                      { isActive: !user.isActive },
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      }
                                    );
                                    setUsers((prev) =>
                                      prev.map((u) =>
                                        u._id === user._id ? res.data : u
                                      )
                                    );
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                              >
                                {user.isActive
                                  ? "Chặn tài khoản"
                                  : "Mở khóa tài khoản"}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => deleteUser(user._id)}
                                className="text-red-600 focus:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa tài khoản
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Dialog tạo giáo viên */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm giáo viên mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản giáo viên và gán vào một trường.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Họ tên</label>
              <Input
                placeholder="VD: Nguyễn Văn A"
                value={createForm.name}
                onChange={handleCreateChange("name")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                placeholder="VD: giaovien@example.com"
                type="email"
                value={createForm.email}
                onChange={handleCreateChange("email")}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1">
                  Trường
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-primary/40 text-primary"
                  >
                    BẮT BUỘC
                  </Badge>
                </label>
              </div>

              {lockedSchool ? (
                <>
                  <Input
                    value={`${lockedSchool.name}${
                      lockedSchool.code ? ` (${lockedSchool.code})` : ""
                    }`}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Bạn là quản lý trường, tất cả giáo viên tạo mới sẽ thuộc{" "}
                    <span className="font-semibold">{lockedSchool.name}</span>.
                  </p>
                </>
              ) : (
                <>
                  <Select
                    value={createForm.schoolId}
                    onValueChange={handleSelectSchool}
                    disabled={loadingSchools}
                  >
                    <SelectTrigger className="h-10 rounded-xl border border-input bg-background/70">
                      <SelectValue
                        placeholder={
                          loadingSchools
                            ? "Đang tải danh sách trường..."
                            : "Chọn trường"
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
                  <p className="text-[11px] text-muted-foreground">
                    Giáo viên chỉ có thể quản lý học sinh trong trường này.
                  </p>
                </>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Mật khẩu mặc định: <span className="font-mono">123456</span>{" "}
              (giáo viên có thể đổi sau).
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
    </div>
  );
};

export default AdminTeachers;
