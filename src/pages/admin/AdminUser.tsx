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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Loader2,
} from "lucide-react";

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách user:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error("Lỗi khi xóa user:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getRoleBadge = (u: any) => {
    if (u.role === "admin")
      return (
        <Badge className="bg-red-500/90 text-white shadow-sm">Admin</Badge>
      );
    if (u.role === "teacher")
      return (
        <Badge className="bg-blue-500/90 text-white shadow-sm">Teacher</Badge>
      );
    return <Badge variant="outline">Student</Badge>;
  };

  const total = users.length;
  const admins = users.filter((u) => u.role === "admin").length;
  const teachers = users.filter((u) => u.role === "teacher").length;
  const students = users.filter((u) => u.role === "student").length;
  const blocked = users.filter((u) => !u.isActive).length;

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh] animate-fade-in">
        <Loader2 className="animate-spin h-6 w-6 text-primary mr-2" />
        <p className="text-sm text-muted-foreground">
          Đang tải danh sách người dùng...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            User management
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Quản lý người dùng
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Theo dõi, tìm kiếm và cập nhật quyền, trạng thái tài khoản trong hệ
            thống.
          </p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
          <CardContent className="py-3.5 px-4 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Tổng người dùng
            </span>
            <span className="text-xl font-semibold text-foreground">{total}</span>
          </CardContent>
        </Card>
        <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
          <CardContent className="py-3.5 px-4 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Admin / Teacher
            </span>
            <span className="text-sm text-foreground">
              <span className="font-semibold">{admins}</span> admin ·{" "}
              <span className="font-semibold">{teachers}</span> teacher
            </span>
          </CardContent>
        </Card>
        <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
          <CardContent className="py-3.5 px-4 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Học viên
            </span>
            <span className="text-xl font-semibold text-foreground">
              {students}
            </span>
          </CardContent>
        </Card>
        <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
          <CardContent className="py-3.5 px-4 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Tài khoản bị chặn
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
              Danh sách người dùng
              <Badge variant="outline" className="text-[11px]">
                {filteredUsers.length}/{users.length} hiển thị
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Tìm kiếm theo tên, email và thao tác nhanh trên từng tài khoản.
            </CardDescription>
          </div>

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
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground text-sm"
                    >
                      Không có người dùng nào phù hợp với từ khóa tìm kiếm.
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
                                {user.role === "admin"
                                  ? "Quản trị viên"
                                  : user.role === "teacher"
                                  ? "Giáo viên"
                                  : "Học viên"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>{getRoleBadge(user)}</TableCell>
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
                                      `http://localhost:5000/api/admin/users/${user._id}/active`,
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

                              {user.role !== "admin" && (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="cursor-pointer">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Chỉnh sửa quyền
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {["admin", "teacher", "student"].map(
                                      (r) => (
                                        <DropdownMenuItem
                                          key={r}
                                          className="cursor-pointer"
                                          onClick={async () => {
                                            if (r === user.role) return;
                                            try {
                                              await axios.put(
                                                `http://localhost:5000/api/admin/users/${user._id}`,
                                                { role: r },
                                                {
                                                  headers: {
                                                    Authorization: `Bearer ${token}`,
                                                  },
                                                }
                                              );
                                              fetchUsers();
                                            } catch (err) {
                                              console.error(err);
                                            }
                                          }}
                                        >
                                          {r.charAt(0).toUpperCase() +
                                            r.slice(1)}
                                        </DropdownMenuItem>
                                      )
                                    )}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}

                              {user.role !== "admin" ? (
                                <DropdownMenuItem
                                  onClick={() => deleteUser(user._id)}
                                  className="text-red-600 focus:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Xóa tài khoản
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  disabled
                                  className="text-gray-400 cursor-not-allowed"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Không thể xóa admin
                                </DropdownMenuItem>
                              )}
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
    </div>
  );
};

export default AdminUsers;
