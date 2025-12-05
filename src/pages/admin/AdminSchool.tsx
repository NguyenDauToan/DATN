  // src/pages/admin/AdminSchools.tsx
  import { useEffect, useState } from "react";
  import axios from "axios";
  import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
  import {
    Table,
    TableHeader,
    TableHead,
    TableRow,
    TableBody,
    TableCell,
  } from "@/components/ui/table";
  import { Button } from "@/components/ui/button";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { toast } from "sonner";
  import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
  } from "@/components/ui/select";
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://english-backend-uoic.onrender.com";

  interface ManagerInfo {
    _id: string;
    name?: string;
    email?: string;
    role?: string;
  }

  interface School {
    _id: string;
    name: string;
    code?: string;
    address?: string;
    manager?: ManagerInfo | null;
  }

  interface SchoolForm {
    name: string;
    code: string;
    address: string;
  }
  interface Ward {
    name: string;
    mergedFrom?: string[];
  }

  interface ProvinceApiItem {
    id: string;
    province: string;
    licensePlates?: string[];
    wards: Ward[];
  }

  const VIETNAM_PROVINCE_API = "https://vietnamlabs.com/api/vietnamprovince";

  export default function AdminSchools() {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<School | null>(null);
    const [form, setForm] = useState<SchoolForm>({
      name: "",
      code: "",
      address: "",
    });
    const [provinces, setProvinces] = useState<ProvinceApiItem[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedWard, setSelectedWard] = useState<string>("");
    const [addressLoading, setAddressLoading] = useState(false);
    const resetForm = () => {
      setEditing(null);
      setForm({
        name: "",
        code: "",
        address: "",
      });
      setSelectedProvince("");
      setSelectedWard("");
      setWards([]);
    };


    const openCreate = () => {
      resetForm();
      setDialogOpen(true);
    };

    const openEdit = (school: School) => {
      setEditing(school);
      setForm({
        name: school.name || "",
        code: school.code || "",
        address: school.address || "",
      });
      setDialogOpen(true);
    };

    const fetchSchools = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        const res = await axios.get<{ schools: School[] }>(
          `${API_BASE_URL}/api/admin/schools`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );

        setSchools(res.data.schools || []);
      } catch (err: any) {
        console.error("FETCH SCHOOLS ERROR:", err?.response || err);
        setError(
          err?.response?.data?.message ||
          "Không tải được danh sách trường học."
        );
        toast.error("Không tải được danh sách trường học.");
      } finally {
        setLoading(false);
      }
    };



    const handleChange =
      (field: keyof SchoolForm) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
          setForm((prev) => ({ ...prev, [field]: e.target.value }));
        };

    const handleSave = async () => {
      if (!form.name.trim()) {
        toast.warning("Tên trường không được để trống.");
        return;
      }

      try {
        setSaving(true);
        const token = localStorage.getItem("token");

        const payload = {
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          address: form.address.trim() || undefined,
          // KHÔNG gửi managerId nữa
        };

        if (editing) {
          await axios.put(
            `${API_BASE_URL}/api/admin/schools/${editing._id}`,
            payload,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            }
          );
          toast.success("Cập nhật trường học thành công.");
        } else {
          await axios.post(`${API_BASE_URL}/api/admin/schools`, payload, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          });
          toast.success("Tạo trường học thành công.");
        }

        setDialogOpen(false);
        resetForm();
        fetchSchools();
      } catch (err: any) {
        console.error("SAVE SCHOOL ERROR:", err?.response || err);
        toast.error(
          err?.response?.data?.message || "Lưu thông tin trường học thất bại."
        );
      } finally {
        setSaving(false);
      }
    };
    const handleDelete = async (school: School) => {
      if (
        !window.confirm(
          `Bạn có chắc muốn xoá trường "${school.name}"?\n` +
            `• Xoá an toàn: hệ thống sẽ chặn nếu vẫn còn lớp / học sinh / giáo viên / đề thi.\n` +
            `• Nếu vẫn muốn xoá kèm toàn bộ dữ liệu, hệ thống sẽ hỏi thêm lần nữa.`
        )
      ) {
        return;
      }
    
      const token = localStorage.getItem("token");
    
      try {
        // 1) Thử xoá "an toàn" (không force)
        await axios.delete(`${API_BASE_URL}/api/admin/schools/${school._id}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
    
        toast.success("Đã xoá trường học.");
        fetchSchools();
      } catch (err: any) {
        console.error("DELETE SCHOOL ERROR:", err?.response || err);
        const status = err?.response?.status;
        const msg = err?.response?.data?.message as string | undefined;
    
        // 2) Bị chặn vì còn dữ liệu -> hỏi có muốn xoá cứng không
        if (
          status === 400 &&
          msg &&
          msg.startsWith("Không thể xoá trường vì vẫn còn")
        ) {
          const confirmForce = window.confirm(
            msg +
              "\n\nBạn có muốn XOÁ LUÔN trường này và TOÀN BỘ dữ liệu liên quan (lớp, học sinh, giáo viên, đề thi, kết quả...) không?"
          );
    
          if (!confirmForce) {
            toast.error("Đã huỷ thao tác xoá trường.");
            return;
          }
    
          try {
            await axios.delete(
              `${API_BASE_URL}/api/admin/schools/${school._id}?force=true`,
              {
                headers: {
                  Authorization: token ? `Bearer ${token}` : "",
                },
              }
            );
    
            toast.success("Đã xoá trường và toàn bộ dữ liệu liên quan.");
            fetchSchools();
          } catch (forceErr: any) {
            console.error("FORCE DELETE SCHOOL ERROR:", forceErr?.response || forceErr);
            toast.error(
              forceErr?.response?.data?.message ||
                "Xoá trường (kèm dữ liệu) thất bại."
            );
          }
    
          return;
        }
    
        // 3) Lỗi khác
        toast.error(msg || "Xoá trường học thất bại.");
      }
    };
    
    // Lấy toàn bộ danh sách tỉnh (data: ProvinceApiItem[])
    const fetchProvinces = async () => {
      try {
        const res = await axios.get(VIETNAM_PROVINCE_API);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setProvinces(res.data.data);
        }
      } catch (err) {
        console.error("FETCH PROVINCES ERROR:", err);
        toast.error("Không tải được danh sách tỉnh/thành.");
      }
    };

    // Lấy danh sách phường/xã theo tỉnh
    const fetchWardsByProvince = async (provinceName: string) => {
      if (!provinceName) return;
      try {
        setAddressLoading(true);
        const res = await axios.get(VIETNAM_PROVINCE_API, {
          params: { province: provinceName },
        });

        if (res.data?.success && res.data.data?.wards) {
          setWards(res.data.data.wards);
        } else {
          setWards([]);
        }
      } catch (err) {
        console.error("FETCH WARDS ERROR:", err);
        setWards([]);
        toast.error("Không tải được danh sách phường/xã.");
      } finally {
        setAddressLoading(false);
      }
    };
    useEffect(() => {
      fetchSchools();
    }, []);

    // Khi mở form lần đầu, nếu chưa có provinces thì load
    useEffect(() => {
      if (dialogOpen && provinces.length === 0) {
        fetchProvinces();
      }
    }, [dialogOpen, provinces.length]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Quản lý trường học
          </h1>
          <Button onClick={openCreate}>+ Thêm trường</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách trường học</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-muted-foreground">
                Đang tải danh sách trường...
              </p>
            ) : schools.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có trường học nào. Hãy thêm trường mới.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên trường</TableHead>
                      <TableHead>Mã trường</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                      <TableHead>Quản lý trường</TableHead>
                      <TableHead className="w-[140px] text-right">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.code || "—"}</TableCell>
                        <TableCell>{s.address || "—"}</TableCell>
                        <TableCell>
                          {s.manager ? (
                            <div className="flex flex-col text-sm">
                              <span className="font-medium">
                                {s.manager.name || "Không rõ"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {s.manager.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Chưa gán quản lý
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(s)}
                          >
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(s)}
                          >
                            Xoá
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog thêm / sửa trường */}
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
                {editing ? "Cập nhật trường học" : "Thêm trường học"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tên trường</Label>
                <Input
                  placeholder="VD: THPT Nguyễn Trãi"
                  value={form.name}
                  onChange={handleChange("name")}
                />
              </div>

              <div className="space-y-2">
                <Label>Mã trường (tuỳ chọn)</Label>
                <Input
                  placeholder="VD: NTT_HS_01"
                  value={form.code}
                  onChange={handleChange("code")}
                />
              </div>

              <div className="space-y-2">
                <Label>Địa chỉ</Label>

                {/* Chọn Tỉnh/Thành */}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Select
                    value={selectedProvince}
                    onValueChange={(value) => {
                      setSelectedProvince(value);
                      setSelectedWard("");
                      setWards([]);
                      // gọi API lấy phường/xã theo tỉnh
                      fetchWardsByProvince(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tỉnh/thành" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((p) => (
                        <SelectItem key={p.id} value={p.province}>
                          {p.province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Chọn Phường/Xã */}
                  <Select
                    value={selectedWard}
                    onValueChange={(value) => {
                      setSelectedWard(value);
                      // Tự động ghép vào ô địa chỉ
                      setForm((prev) => ({
                        ...prev,
                        address: prev.address
                          ? `${value}, ${selectedProvince}, ${prev.address}`
                          : `${value}, ${selectedProvince}`,
                      }));
                    }}
                    disabled={!selectedProvince || addressLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedProvince
                            ? addressLoading
                              ? "Đang tải phường/xã..."
                              : "Chọn phường/xã"
                            : "Chọn tỉnh trước"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((w) => (
                        <SelectItem key={w.name} value={w.name}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ô nhập chi tiết (số nhà, đường, quận/huyện...) */}
                <Input
                  placeholder="VD: 123 Lê Lợi, Quận 1..."
                  value={form.address}
                  onChange={handleChange("address")}
                />
                <p className="text-xs text-muted-foreground">
                  Chọn tỉnh và phường/xã để tự động ghép vào, sau đó bạn có thể bổ sung số nhà, đường, quận/huyện nếu cần.
                </p>
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
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
