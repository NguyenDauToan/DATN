// src/pages/admin/AdminSchoolYears.tsx
import { useEffect, useState } from "react";
import axios from "axios";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, PlusCircle, Trash2, PencilLine } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://english-backend-uoic.onrender.com";

type SchoolYear = {
  _id: string;
  name: string; // "2024-2025"
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
};

type SchoolYearForm = {
  name: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  isActive: boolean;
};

type SchoolYearResponse = {
  years: SchoolYear[];     // năm học hiện tại
  oldYears?: SchoolYear[]; // năm học đã kết thúc
};

export default function AdminSchoolYears() {
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [oldYears, setOldYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolYear | null>(null);

  const [form, setForm] = useState<SchoolYearForm>({
    name: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const token = localStorage.getItem("token");

  const fetchYears = async () => {
    if (!token) return;
    try {
      setLoading(true);
      // lấy cả năm hiện tại + năm cũ
      const res = await axios.get<SchoolYearResponse>(
        `${API_BASE_URL}/api/admin/school-years?includeInactive=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setYears(res.data.years || []);
      setOldYears(res.data.oldYears || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách năm học:", err);
      toast.error("Không tải được danh sách năm học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (year: SchoolYear) => {
    setEditing(year);
    setForm({
      name: year.name || "",
      startDate: year.startDate ? year.startDate.substring(0, 10) : "",
      endDate: year.endDate ? year.endDate.substring(0, 10) : "",
      isActive: typeof year.isActive === "boolean" ? year.isActive : true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.warning("Tên năm học không được để trống.");
      return;
    }

    const payload: any = {
      name: form.name.trim(),
      isActive: form.isActive,
    };

    if (form.startDate) payload.startDate = form.startDate;
    if (form.endDate) payload.endDate = form.endDate;

    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (editing) {
        await axios.put(
          `${API_BASE_URL}/api/admin/school-years/${editing._id}`,
          payload,
          { headers }
        );
        toast.success("Cập nhật năm học thành công.");
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/school-years`, payload, {
          headers,
        });
        toast.success("Tạo năm học thành công.");
      }

      setDialogOpen(false);
      resetForm();
      fetchYears();
    } catch (err: any) {
      console.error("SAVE SCHOOL YEAR ERROR:", err?.response || err);
      toast.error(
        err?.response?.data?.message || "Lưu thông tin năm học thất bại."
      );
    }
  };

  const handleDelete = async (year: SchoolYear) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xoá năm học "${year.name}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/school-years/${year._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Đã xoá năm học.");
      fetchYears();
    } catch (err: any) {
      console.error("DELETE SCHOOL YEAR ERROR:", err?.response || err);
      toast.error(
        err?.response?.data?.message || "Xoá năm học thất bại."
      );
    }
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    return iso.substring(0, 10);
  };

  const hasAnyYear = years.length > 0 || oldYears.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Quản lý năm học</h2>
          <p className="text-sm text-muted-foreground">
            Tạo và cập nhật danh sách năm học (ví dụ: 2024-2025).
          </p>
        </div>

        <Button className="h-9 rounded-xl" onClick={openCreate}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Thêm năm học
        </Button>
      </div>

      {/* Bảng năm học */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách năm học</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải danh sách năm học...
            </div>
          ) : !hasAnyYear ? (
            <p className="text-sm text-muted-foreground">
              Chưa có năm học nào. Hãy thêm năm học mới.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên năm học</TableHead>
                    <TableHead>Bắt đầu</TableHead>
                    <TableHead>Kết thúc</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right w-[150px]">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Nhóm: Năm học hiện tại */}
                  {years.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={5} className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                          Năm học hiện tại
                        </TableCell>
                      </TableRow>
                      {years.map((y) => (
                        <TableRow key={y._id}>
                          <TableCell className="font-medium">
                            {y.name}
                          </TableCell>
                          <TableCell>{fmtDate(y.startDate || undefined)}</TableCell>
                          <TableCell>{fmtDate(y.endDate || undefined)}</TableCell>
                          <TableCell>
                            <span
                              className={
                                y.isActive
                                  ? "text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5"
                                  : "text-xs rounded-full bg-slate-100 text-slate-500 px-2 py-0.5"
                              }
                            >
                              {y.isActive ? "Đang sử dụng" : "Đã ẩn"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(y)}
                            >
                              <PencilLine className="h-4 w-4 mr-1" />
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(y)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Xoá
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}

                  {/* Nhóm: Năm học đã kết thúc */}
                  {oldYears.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={5} className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                          Năm học đã kết thúc
                        </TableCell>
                      </TableRow>
                      {oldYears.map((y) => (
                        <TableRow key={y._id}>
                          <TableCell className="font-medium">
                            {y.name}
                          </TableCell>
                          <TableCell>{fmtDate(y.startDate || undefined)}</TableCell>
                          <TableCell>{fmtDate(y.endDate || undefined)}</TableCell>
                          <TableCell>
                            <span className="text-xs rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">
                              Đã kết thúc
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(y)}
                            >
                              <PencilLine className="h-4 w-4 mr-1" />
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(y)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Xoá
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog thêm/sửa năm học */}
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
              {editing ? "Cập nhật năm học" : "Thêm năm học"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Tên năm học</Label>
              <Input
                placeholder="VD: 2024-2025"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Ngày bắt đầu (tuỳ chọn)</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Ngày kết thúc (tuỳ chọn)</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Đang sử dụng</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((prev) => ({ ...prev, isActive: v }))
                  }
                />
                <span className="text-xs text-muted-foreground">
                  {form.isActive
                    ? "Năm học đang được dùng để tạo lớp mới"
                    : "Ẩn năm học khỏi lựa chọn nhưng dữ liệu vẫn giữ"}
                </span>
              </div>
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
                {editing ? "Cập nhật" : "Tạo năm học"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
