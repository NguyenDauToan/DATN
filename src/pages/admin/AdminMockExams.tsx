"use client";

import { useState, useEffect } from "react";
import axios from "axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  PlusCircle,
  Globe2,
  Timer,
} from "lucide-react";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadMockExamExcelDialog } from "./UploadMockExamExcelDialog";

type MockExam = {
  _id?: string;
  name: string; // VD: "Đề minh họa 2025 - Lần 1"
  examType: "thptqg" | "ielts" | "toeic" | "vstep" | "other";
  description?: string;
  duration: number;
  level?: "easy" | "medium" | "hard" | "mixed";
  grade?: string; // lớp 12 / band 5.5+
  skill?: string; // mixed / listening / ...
  year?: number; // NĂM ĐỀ THI: 2022, 2023, 2024...
  officialName?: string; // "Đề chính thức 2023", "Đề minh họa 2025", ...
  tags?: string[];
  isActive?: boolean;
  totalQuestions?: number;
  slug?: string;
};

const examTypeLabel: Record<MockExam["examType"], string> = {
  thptqg: "THPTQG",
  ielts: "IELTS",
  toeic: "TOEIC",
  vstep: "VSTEP",
  other: "Kỳ thi khác",
};

const levelLabel: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
  mixed: "Nhiều mức độ",
};

const levelBadgeClass: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  hard: "bg-rose-50 text-rose-700 border border-rose-200",
  mixed: "bg-sky-50 text-sky-700 border border-sky-200",
};

const token =
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

/* =========================
   AddMockExamDialog
   (giờ hiểu là thêm "ĐỀ THI THỬ")
   ========================= */
/* =========================
   AddMockExamDialog
   (thêm "ĐỀ THI THỬ" + lấy câu hỏi theo kỳ thi)
   ========================= */
   function AddMockExamDialog({ onSuccess }: { onSuccess?: () => void }) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
  
    // form thông tin đề thi thử
    const [form, setForm] = useState<MockExam>({
      name: "",
      examType: "thptqg",
      description: "",
      duration: 60,
      level: "mixed",
      grade: "",
      skill: "mixed",
      tags: [],
      totalQuestions: 40,
      slug: "",
    });
  
    // ngân hàng câu hỏi theo kỳ thi (thptqg, ielts, toeic, vstep)
    const [bankQuestions, setBankQuestions] = useState<any[]>([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
  
    const handleChange = (field: keyof MockExam, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  
    // chỉ những examType này mới map trực tiếp sang grade của Question
    const GRADE_EXAM_TYPES: MockExam["examType"][] = [
      "thptqg",
      "ielts",
      "toeic",
      "vstep",
    ];
  
    // load câu hỏi từ ngân hàng theo examType (map sang grade)
    const loadBankQuestions = async (examType: MockExam["examType"]) => {
      if (!token) return;
  
      // nếu chọn "other" thì không load
      if (!GRADE_EXAM_TYPES.includes(examType)) {
        setBankQuestions([]);
        setSelectedQuestionIds([]);
        return;
      }
  
      try {
        setLoadingQuestions(true);
        const res = await axios.get("http://localhost:5000/api/questions/filter", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            grade: examType, // Question.grade = "thptqg" | "ielts" | "toeic" | "vstep"
            // nếu sau này muốn lọc thêm skill/level thì truyền thêm:
            // skill: "reading",
            // level: "easy",
          },
        });
  
        const data = Array.isArray(res.data) ? res.data : [];
        setBankQuestions(data);
        setSelectedQuestionIds([]);
      } catch (err) {
        console.error(err);
        setBankQuestions([]);
        toast.error("Không tải được câu hỏi cho kỳ thi này");
      } finally {
        setLoadingQuestions(false);
      }
    };
  
    // khi đổi kỳ thi -> load lại ngân hàng câu hỏi
    useEffect(() => {
      loadBankQuestions(form.examType);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.examType]);
  
    const handleSubmit = async () => {
      if (!form.name.trim()) {
        return toast.error("Vui lòng nhập tên đề thi thử");
      }
      if (!form.duration || form.duration <= 0) {
        return toast.error("Thời gian làm bài phải lớn hơn 0");
      }
  
      // nếu là các kỳ thi cố định thì bắt buộc phải chọn ít nhất 1 câu hỏi
      if (GRADE_EXAM_TYPES.includes(form.examType) && selectedQuestionIds.length === 0) {
        return toast.error("Vui lòng chọn ít nhất 1 câu hỏi từ ngân hàng cho kỳ thi này");
      }
  
      try {
        setSubmitting(true);
        await axios.post(
            "http://localhost:5000/api/mock-exams",
            {
              name: form.name,
              examType: form.examType,
              description: form.description,
              duration: form.duration,
              level: form.level,
              grade: form.grade,
              skill: form.skill,
              tags: form.tags,
              totalQuestions:
                GRADE_EXAM_TYPES.includes(form.examType) && selectedQuestionIds.length > 0
                  ? selectedQuestionIds.length
                  : form.totalQuestions,
              slug: form.slug || undefined,
          
              // ✅ gửi đúng key backend đang validate
              questions: selectedQuestionIds,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          
  
        toast.success("Tạo đề thi thử thành công");
        setOpen(false);
        setForm({
          name: "",
          examType: "thptqg",
          description: "",
          duration: 60,
          level: "mixed",
          grade: "",
          skill: "mixed",
          tags: [],
          totalQuestions: 40,
          slug: "",
        });
        setBankQuestions([]);
        setSelectedQuestionIds([]);
        onSuccess?.();
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.message ||
            "Lỗi khi tạo đề thi thử. Vui lòng thử lại."
        );
      } finally {
        setSubmitting(false);
      }
    };
  
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2 rounded-2xl bg-card text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <PlusCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Thêm đề thi thử</span>
          </Button>
        </DialogTrigger>
  
        <DialogContent className="max-w-xl rounded-3xl max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Thêm đề thi thử mới</DialogTitle>
            <DialogDescription className="text-xs">
              Cấu hình thông tin cơ bản cho đề thi thử. Sau đó chọn câu hỏi từ
              ngân hàng theo từng kỳ thi.
            </DialogDescription>
          </DialogHeader>
  
          <div className="mt-4 space-y-4 overflow-y-auto pr-1">
            {/* Tên đề thi */}
            <div className="space-y-2">
              <Label htmlFor="name">Tên đề thi</Label>
              <Input
                id="name"
                placeholder="VD: Đề thi thử THPTQG môn Anh 2025 - Lần 1"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
  
            {/* Loại kỳ thi + thời gian */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kỳ thi (cố định)</Label>
                <Select
                  value={form.examType}
                  onValueChange={(val) =>
                    handleChange("examType", val as MockExam["examType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kỳ thi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thptqg">THPTQG</SelectItem>
                    <SelectItem value="ielts">IELTS</SelectItem>
                    <SelectItem value="toeic">TOEIC</SelectItem>
                    <SelectItem value="vstep">VSTEP</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
  
              <div className="space-y-2">
                <Label>Thời gian làm bài (phút)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration}
                  onChange={(e) =>
                    handleChange("duration", Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>
  
            {/* Năm + loại đề */}
            {/* ... giữ nguyên các block năm, officialName, level, grade, skill, mô tả, totalQuestions, slug, tags ... */}
  
            {/* --- PHẦN CHỌN CÂU HỎI TỪ NGÂN HÀNG THEO KỲ THI --- */}
            {GRADE_EXAM_TYPES.includes(form.examType) && (
              <div className="space-y-2">
                <Label>
                  Câu hỏi từ ngân hàng ({form.examType.toUpperCase()})
                </Label>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                  {loadingQuestions ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Đang tải câu hỏi...
                    </p>
                  ) : bankQuestions.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={
                              bankQuestions.length > 0 &&
                              bankQuestions.every((q) =>
                                selectedQuestionIds.includes(q._id)
                              )
                            }
                            onChange={(e) => {
                              setSelectedQuestionIds(
                                e.target.checked
                                  ? bankQuestions.map((q) => q._id)
                                  : []
                              );
                            }}
                          />
                          <span className="font-medium text-sm">
                            Chọn tất cả
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Đã chọn {selectedQuestionIds.length}/
                          {bankQuestions.length} câu
                        </span>
                      </div>
  
                      <div className="space-y-1">
                        {bankQuestions.map((q) => (
                          <label
                            key={q._id}
                            className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition
                              ${
                                selectedQuestionIds.includes(q._id)
                                  ? "bg-indigo-50 border border-indigo-200"
                                  : "hover:bg-gray-50"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedQuestionIds.includes(q._id)}
                              onChange={(e) => {
                                setSelectedQuestionIds((prev) =>
                                  e.target.checked
                                    ? [...prev, q._id]
                                    : prev.filter((id) => id !== q._id)
                                );
                              }}
                            />
                            <span className="text-sm">
                              {q.content}
                              {q.skill && (
                                <span className="ml-1 text-[11px] text-muted-foreground">
                                  ({q.skill})
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Chưa có câu hỏi nào trong ngân hàng cho kỳ thi này.
                    </p>
                  )}
                </div>
              </div>
            )}
  
            {/* nút lưu */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="rounded-xl"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl"
              >
                {submitting ? "Đang lưu..." : "Lưu đề thi thử"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  

/* =========================
   AdminMockExams
   (hiểu là quản lý "ĐỀ THI THỬ")
   ========================= */

export default function AdminMockExams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState<
    MockExam["examType"] | "all"
  >("all");
  const [exams, setExams] = useState<MockExam[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMockExams = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/mock-exams", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = res.data?.exams || res.data || [];
      setExams(list);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách đề thi thử");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMockExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredExams = exams.filter((exam) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      exam.name.toLowerCase().includes(search) ||
      exam.grade?.toLowerCase().includes(search) ||
      examTypeLabel[exam.examType].toLowerCase().includes(search);
    const matchesType =
      examTypeFilter === "all" || exam.examType === examTypeFilter;

    return matchesSearch && matchesType;
  });

  const totalQuestions = exams.reduce(
    (sum, exam) => sum + (exam.totalQuestions || 0),
    0
  );

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Bạn có chắc chắn muốn xóa đề thi thử này?")) return;
  
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
      // nếu dùng react-router:
      // navigate("/login");
      return;
    }
  
    try {
      await axios.delete(`http://localhost:5000/api/mock-exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa đề thi thử");
      loadMockExams();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 403
          ? "Bạn không có quyền xóa đề thi thử"
          : "Xóa đề thi thử thất bại");
      toast.error(msg);
    }
  };
  
  const getLevelBadge = (level?: string) => {
    if (!level) {
      return (
        <Badge className="bg-slate-50 text-slate-700 border border-slate-200">
          Không rõ
        </Badge>
      );
    }

    return (
      <Badge
        className={
          levelBadgeClass[level] ||
          "bg-slate-50 text-slate-700 border border-slate-200"
        }
      >
        {levelLabel[level] || level}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 animate-fade-in">
        <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">
          Đang tải danh sách đề thi thử...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      {/* HEADER + ACTIONS */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Mock test paper management
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
              Quản lý đề thi thử
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
              Thêm, quản lý các đề thi thử cho các kỳ thi như THPTQG, IELTS,
              TOEIC, VSTEP... Học viên có thể làm thử giống cấu trúc đề thật.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            <AddMockExamDialog onSuccess={loadMockExams} />
            <UploadMockExamExcelDialog
              exams={exams}
              onSuccess={loadMockExams}
            />
          </div>
        </div>

        {/* MINI STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Tổng đề thi thử
              </span>
              <span className="text-xl font-semibold text-foreground">
                {exams.length}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {filteredExams.length !== exams.length &&
                  `${filteredExams.length} đang hiển thị`}
              </span>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Tổng số câu dự kiến
              </span>
              <span className="text-xl font-semibold text-foreground">
                {totalQuestions}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Trung bình{" "}
                {exams.length > 0
                  ? Math.round((totalQuestions / exams.length) * 10) / 10
                  : 0}{" "}
                câu / đề
              </span>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Kỳ thi (cố định)
              </span>
              <span className="text-sm text-foreground">
                <span className="font-semibold">
                  {exams.filter((e) => e.examType === "thptqg").length}
                </span>{" "}
                THPTQG ·{" "}
                <span className="font-semibold">
                  {exams.filter((e) => e.examType === "ielts").length}
                </span>{" "}
                IELTS ·{" "}
                <span className="font-semibold">
                  {exams.filter((e) => e.examType === "toeic").length}
                </span>{" "}
                TOEIC
              </span>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Trạng thái đề thi
              </span>
              <span className="text-sm text-foreground">
                <span className="font-semibold">
                  {exams.filter((e) => e.isActive !== false).length}
                </span>{" "}
                đang mở ·{" "}
                <span className="font-semibold">
                  {exams.filter((e) => e.isActive === false).length}
                </span>{" "}
                tạm ẩn
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* LIST TABLE */}
      <Card className="shadow-sm border border-border/80 rounded-3xl bg-card/95 backdrop-blur animate-slide-in">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base md:text-lg font-semibold text-foreground">
                Danh sách đề thi thử
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Tìm kiếm, lọc theo kỳ thi và thao tác trên từng đề thi thử.
              </CardDescription>
            </div>

            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm theo tên đề, lớp, kỳ thi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-background/80 focus-visible:ring-1 focus-visible:ring-primary/70"
                />
              </div>

              <Select
                value={examTypeFilter}
                onValueChange={(val) =>
                  setExamTypeFilter(val as MockExam["examType"] | "all")
                }
              >
                <SelectTrigger className="md:w-40 h-10 rounded-xl bg-background/80">
                  <SelectValue placeholder="Kỳ thi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="thptqg">THPTQG</SelectItem>
                  <SelectItem value="ielts">IELTS</SelectItem>
                  <SelectItem value="toeic">TOEIC</SelectItem>
                  <SelectItem value="vstep">VSTEP</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="rounded-2xl overflow-hidden border border-border/70 bg-background/60">
            <Table>
              <TableHeader className="bg-muted/60 backdrop-blur">
                <TableRow className="border-border/60">
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Đề thi
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Kỳ thi
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Mức độ
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Thời gian
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Năm
                  </TableHead>

                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Số câu dự kiến
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
                {filteredExams.length > 0 ? (
                  filteredExams.map((exam, idx) => (
                    <TableRow
                      key={exam._id || exam.slug || idx}
                      className="hover:bg-primary/5 transition-all cursor-pointer group"
                      style={{ animationDelay: `${idx * 35}ms` }}
                    >
                      <TableCell className="font-medium text-sm text-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span className="line-clamp-1 group-hover:text-primary transition-colors">
                            {exam.name}
                          </span>
                          {exam.grade && (
                            <span className="text-[11px] text-muted-foreground">
                              Lớp / band: {exam.grade}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px]">
                          <Globe2 className="h-3 w-3" />
                          {examTypeLabel[exam.examType]}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm">
                        {getLevelBadge(exam.level)}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {exam.duration} phút
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {exam.year || "-"}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {exam.totalQuestions ?? 0}
                      </TableCell>

                      <TableCell className="text-sm">
                        <Badge
                          className={
                            exam.isActive !== false
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }
                        >
                          {exam.isActive !== false ? "Đang mở" : "Tạm ẩn"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted/80"
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="border border-border/70 rounded-xl bg-card/95 backdrop-blur shadow-lg"
                          >
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={() => handleDelete(exam._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      Chưa có đề thi thử nào phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
