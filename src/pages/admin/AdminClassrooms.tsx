// src/pages/admin/AdminClassrooms.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/data/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, PlusCircle, Trash2, PencilLine } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type SchoolYear = {
  _id: string;
  name: string; // "2024-2025"
  isActive?: boolean;
};

type SchoolYearResponse = {
  years: SchoolYear[];      // năm học hiện tại (isActive = true)
  oldYears?: SchoolYear[];  // năm học đã kết thúc
};

type School = {
  _id: string;
  name: string;
  code?: string;
};

type Teacher = {
  _id: string;
  name?: string;
  email?: string;
};

type Classroom = {
  _id: string;
  name: string;
  grade?: string;
  school: School;
  homeroomTeacher?: Teacher | null;
  students?: string[];
  schoolYear?: SchoolYear; // populated từ BE
};

type ClassroomForm = {
  name: string;
  grade: string;
  schoolId: string;
  homeroomTeacherId: string; // "none" = không gán GV
  schoolYearId: string;
};

export default function AdminClassrooms() {
  const { user: currentUser } = useAuth();
  const currentRole =
    typeof window !== "undefined" ? localStorage.getItem("role") || "" : "";
  const managerSchoolId =
    (currentUser?.school && (currentUser.school as any)._id) ||
    (currentUser?.school as any) ||
    "";
  const managerSchoolName =
    (currentUser?.school as any)?.name || "Trường của bạn";
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [oldSchoolYears, setOldSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Classroom | null>(null);
  const [filterSchoolId, setFilterSchoolId] = useState<string>(
    currentRole === "school_manager" && managerSchoolId ? managerSchoolId : "all"
  );
  const [filterYearId, setFilterYearId] = useState<string>("all");
  const isHistoryYear = (yearId: string) =>
    yearId !== "all" && oldSchoolYears.some((y) => y._id === yearId);
  const [form, setForm] = useState<ClassroomForm>({
    name: "",
    grade: "",
    schoolId: "",
    homeroomTeacherId: "none",
    schoolYearId: "",
  });

  const token = localStorage.getItem("token");

  const fetchSchools = async () => {
    if (!token) return;
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
      console.error("Lỗi lấy danh sách trường:", err);
      toast.error("Không tải được danh sách trường.");
    } finally {
      setLoadingSchools(false);
    }
  };
  useEffect(() => {
    if (currentRole === "school_manager" && managerSchoolId) {
      setFilterSchoolId(managerSchoolId);
      setForm((prev) => ({
        ...prev,
        schoolId: managerSchoolId,
      }));
    }
  }, [currentRole, managerSchoolId]);

  const fetchTeachers = async () => {
    if (!token) return;
    try {
      setLoadingTeachers(true);
      const res = await axios.get<Teacher[]>(
        `${API_BASE_URL}/api/admin/users/teachers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTeachers(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách giáo viên:", err);
      toast.error("Không tải được danh sách giáo viên.");
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchSchoolYears = async () => {
    if (!token) return;
    try {
      const res = await axios.get<SchoolYearResponse>(
        `${API_BASE_URL}/api/admin/school-years?includeInactive=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const activeYears = res.data.years || [];
      const oldYears = res.data.oldYears || [];

      setSchoolYears(activeYears);
      setOldSchoolYears(oldYears);

      // chọn năm học đang sử dụng (thường chỉ còn 1 do backend đã tắt năm khác)
      if (activeYears.length > 0) {
        const current = activeYears[activeYears.length - 1];

        // nếu đang "all" hoặc rỗng thì set sang năm hiện tại
        setFilterYearId((prev) => {
          if (!prev || prev === "all" || prev.startsWith("__")) {
            return current._id;
          }
          return prev;
        });

        // form thêm lớp: nếu chưa có schoolYearId thì default theo năm hiện tại
        setForm((prev) => ({
          ...prev,
          schoolYearId: prev.schoolYearId || current._id,
        }));
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách năm học:", err);
      toast.error("Không tải được danh sách năm học.");
    }
  };
  const fetchClassrooms = async (
    schoolId?: string,
    schoolYearId?: string
  ) => {
    if (!token) return;
    try {
      setLoading(true);
      const params: any = {};

      if (schoolId && schoolId !== "all") params.schoolId = schoolId;
      if (schoolYearId && schoolYearId !== "all") {
        params.schoolYearId = schoolYearId;
      }

      // Xác định có phải đang xem năm lịch sử không
      const useHistoryApi =
        schoolYearId &&
        schoolYearId !== "all" &&
        oldSchoolYears.some((y) => y._id === schoolYearId);

      const url = useHistoryApi
        ? `${API_BASE_URL}/api/admin/classrooms/history`
        : `${API_BASE_URL}/api/admin/classrooms`;

      const res = await axios.get<{ classrooms: Classroom[] }>(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setClassrooms(res.data.classrooms || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách lớp:", err);
      toast.error("Không tải được danh sách lớp.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchTeachers();
    fetchSchoolYears();
  }, []);

  useEffect(() => {
    fetchClassrooms(filterSchoolId, filterYearId);
  }, [filterSchoolId, filterYearId]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      grade: "",
      schoolId: "",
      homeroomTeacherId: "none",
      schoolYearId: "",
    });
  };

  const openCreate = () => {
    // khi tạo mới, default năm học = năm đang filter nếu là 1 id hợp lệ
    const yearIdToUse =
      filterYearId &&
        filterYearId !== "all" &&
        !filterYearId.startsWith("__")
        ? filterYearId
        : schoolYears[schoolYears.length - 1]?._id || "";

    setEditing(null);
    setForm((prev) => ({
      ...prev,
      name: "",
      grade: "",
      schoolId: prev.schoolId, // giữ trường nếu muốn
      homeroomTeacherId: "none",
      schoolYearId: yearIdToUse,
    }));
    setDialogOpen(true);
  };

  const openEdit = (cls: Classroom) => {
    setEditing(cls);
    setForm({
      name: cls.name || "",
      grade: cls.grade || "",
      schoolId: cls.school?._id || "",
      homeroomTeacherId: cls.homeroomTeacher?._id || "none",
      schoolYearId: cls.schoolYear?._id || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.warning("Tên lớp không được để trống.");
      return;
    }
    if (!form.schoolId) {
      toast.warning("Vui lòng chọn trường cho lớp.");
      return;
    }
    if (!form.grade) {
      toast.warning("Vui lòng chọn khối lớp.");
      return;
    }
    if (!form.schoolYearId) {
      toast.warning("Vui lòng chọn năm học.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      grade: form.grade,
      schoolId:
        currentRole === "school_manager" && managerSchoolId
          ? managerSchoolId
          : form.schoolId,
      schoolYearId: form.schoolYearId,
      homeroomTeacherId:
        form.homeroomTeacherId && form.homeroomTeacherId !== "none"
          ? form.homeroomTeacherId
          : undefined,
    };

    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (editing) {
        await axios.put(
          `${API_BASE_URL}/api/admin/classrooms/${editing._id}`,
          payload,
          { headers }
        );
        toast.success("Cập nhật lớp học thành công.");
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/classrooms`, payload, {
          headers,
        });
        toast.success("Tạo lớp học thành công.");
      }

      setDialogOpen(false);
      resetForm();
      fetchClassrooms(filterSchoolId, filterYearId);
    } catch (err: any) {
      console.error("SAVE CLASSROOM ERROR:", err?.response || err);
      toast.error(
        err?.response?.data?.message || "Lưu thông tin lớp học thất bại."
      );
    }
  };

  const handleDelete = async (cls: Classroom) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xoá lớp "${cls.name}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/classrooms/${cls._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Đã xoá lớp học.");
      fetchClassrooms(filterSchoolId, filterYearId);
    } catch (err: any) {
      console.error("DELETE CLASSROOM ERROR:", err?.response || err);
      toast.error(
        err?.response?.data?.message || "Xoá lớp học thất bại."
      );
    }
  };

  const gradeLabel = (g?: string) => {
    if (!g) return "—";
    if (["ielts", "IELTS"].includes(g.toLowerCase())) return "IELTS";
    if (["toeic"].includes(g.toLowerCase())) return "TOEIC";
    if (["vstep"].includes(g.toLowerCase())) return "VSTEP";
    return `Lớp ${g}`;
  };

  const grades = [
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "ielts",
    "toeic",
    "vstep",
  ];

  const totalBySchool = classrooms.reduce<
    Record<
      string,
      { name: string; code?: string; classes: number; students: number }
    >
  >((acc, cls) => {
    const id = cls.school?._id || "unknown";
    if (!acc[id]) {
      acc[id] = {
        name: cls.school?.name || "Không rõ",
        code: cls.school?.code,
        classes: 0,
        students: 0,
      };
    }
    acc[id].classes += 1;
    acc[id].students += cls.students?.length || 0;
    return acc;
  }, {});

  const allYears = [...schoolYears, ...oldSchoolYears];
  const historyView =
    filterYearId !== "all" && oldSchoolYears.some((y) => y._id === filterYearId);
  const currentYearLabel =
    filterYearId === "all"
      ? "Tất cả năm học"
      : `${historyView ? "Lịch sử năm học" : "Năm học"} ${allYears.find((y) => y._id === filterYearId)?.name || ""
      }`;

  const totalSchools = Object.keys(totalBySchool).length;
  const totalClasses = Object.values(totalBySchool).reduce(
    (sum, s) => sum + s.classes,
    0
  );
  const totalStudents = Object.values(totalBySchool).reduce(
    (sum, s) => sum + s.students,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Card thống kê bên trái */}
        <Card className="w-full lg:max-w-md border-none bg-gradient-to-br from-sky-50 via-white to-blue-50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                  Thống kê theo trường
                </p>
                <p className="text-xs text-slate-500">{currentYearLabel}</p>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <div>
                  <span className="font-semibold text-slate-900">
                    {totalSchools}
                  </span>{" "}
                  trường
                </div>
                <div>
                  <span className="font-semibold text-slate-900">
                    {totalClasses}
                  </span>{" "}
                  lớp
                </div>
                <div>
                  <span className="font-semibold text-slate-900">
                    {totalStudents}
                  </span>{" "}
                  HS
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-1">
            {Object.values(totalBySchool).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Chưa có dữ liệu lớp học.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {Object.entries(totalBySchool).map(([id, s]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-xs shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        {s.name} {s.code ? `(${s.code})` : ""}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {currentYearLabel}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                        {s.classes} lớp
                      </div>
                      <div className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {s.students} HS
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filter + nút bên phải */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center lg:mt-4">
          {/* Lọc theo trường */}
          <div className="min-w-[220px]">
            {currentRole === "school_manager" ? (
              // Manager: khóa trường, chỉ hiển thị
              <div className="px-3 py-2 rounded-md border bg-muted/40 text-sm">
                {managerSchoolName}
              </div>
            ) : (
              <Select
                value={filterSchoolId}
                onValueChange={(val) => setFilterSchoolId(val)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Chọn trường" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trường</SelectItem>
                  {schools.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name} {s.code ? `(${s.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Lọc theo năm học */}
          <div className="min-w-[160px]">
            <Select
              value={filterYearId}
              onValueChange={(val) => setFilterYearId(val)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Năm học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả năm học</SelectItem>

                {/* nhóm: năm học hiện tại */}
                {schoolYears.length > 0 && (
                  <SelectItem
                    value="__active_header"
                    disabled
                    className="text-xs text-muted-foreground"
                  >
                    — Năm học hiện tại —
                  </SelectItem>
                )}
                {schoolYears.map((y) => (
                  <SelectItem key={y._id} value={y._id}>
                    {y.name}
                  </SelectItem>
                ))}

                {/* nhóm: năm học đã kết thúc */}
                {oldSchoolYears.length > 0 && (
                  <>
                    <SelectItem
                      value="__old_header"
                      disabled
                      className="text-xs text-muted-foreground"
                    >
                      — Năm học đã kết thúc —
                    </SelectItem>
                    {oldSchoolYears.map((y) => (
                      <SelectItem key={y._id} value={y._id}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="h-9 rounded-xl"
            onClick={openCreate}
            disabled={historyView} // không cho thêm lớp trong chế độ xem lịch sử
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Thêm lớp học
          </Button>

        </div>
      </div>

      {/* Bảng lớp học */}
      <Card>
        <CardHeader>
          <CardTitle>
            {historyView ? "Danh sách lớp học (lịch sử)" : "Danh sách lớp học"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải danh sách lớp...
            </div>
          ) : classrooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có lớp học nào. Hãy thêm lớp mới.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên lớp</TableHead>
                    <TableHead>Khối</TableHead>
                    <TableHead>Trường</TableHead>
                    <TableHead>Giáo viên tiếng Anh</TableHead>
                    <TableHead>Năm học</TableHead>
                    <TableHead>Học sinh</TableHead>
                    <TableHead className="text-right w-[150px]">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classrooms.map((cls) => (
                    <TableRow key={cls._id}>
                      <TableCell className="font-medium">
                        {cls.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {gradeLabel(cls.grade)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">
                            {cls.school?.name || "—"}
                          </span>
                          {cls.school?.code && (
                            <span className="text-xs text-muted-foreground">
                              {cls.school.code}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cls.homeroomTeacher ? (
                          <div className="flex flex-col text-sm">
                            <span className="font-medium">
                              {cls.homeroomTeacher.name || "Không rõ"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {cls.homeroomTeacher.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Chưa gán giáo viên tiếng Anh
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cls.schoolYear?.name ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {cls.students?.length || 0} HS
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {historyView ? (
                          <span className="text-xs text-muted-foreground">
                            Lịch sử (không chỉnh sửa)
                          </span>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(cls)}
                            >
                              <PencilLine className="h-4 w-4 mr-1" />
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(cls)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Xoá
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog thêm/sửa lớp */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Cập nhật lớp học" : "Thêm lớp học"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Tên lớp</Label>
              <Input
                placeholder="VD: 7A1, 10A2, IELTS 1..."
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Khối lớp</Label>
                <Select
                  value={form.grade}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, grade: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khối" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g} value={g}>
                        {gradeLabel(g)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                {currentRole === "school_manager" ? (
                  // Manager: hiển thị cố định trường, không cho chọn
                  <div className="px-3 py-2 rounded-md border bg-muted/40 text-sm">
                    {managerSchoolName}
                  </div>
                ) : (
                  <Select
                    value={form.schoolId}
                    onValueChange={(val) =>
                      setForm((prev) => ({ ...prev, schoolId: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trường" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name} {s.code ? `(${s.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1 md:col-span-1">
                <Label>Năm học</Label>
                <Select
                  value={form.schoolYearId}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, schoolYearId: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn năm học" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map((y) => (
                      <SelectItem key={y._id} value={y._id}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Giáo viên tiếng Anh (tuỳ chọn)</Label>
              <Select
                value={form.homeroomTeacherId}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, homeroomTeacherId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giáo viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không gán giáo viên</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name || "Không tên"}{" "}
                      {t.email ? `- ${t.email}` : ""}
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
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Hủy
              </Button>
              <Button type="button" onClick={handleSave}>
                {editing ? "Cập nhật" : "Tạo lớp"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
