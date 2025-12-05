"use client";

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
  Search,
  MoreHorizontal,
  Eye,
  RotateCcw,
  Trash2,
  Globe2,
  Timer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type School = {
  _id: string;
  name: string;
  code?: string;
};

type Classroom = {
  _id: string;
  name: string;
  code?: string;
  school?: string;
  grade?: string;
};

type SchoolYear = {
  _id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
};

type MockExam = {
  _id?: string;
  name: string;
  examType: "thptqg" | "ielts" | "toeic" | "vstep" | "other";
  description?: string;
  duration: number;
  level?: "easy" | "medium" | "hard" | "mixed";
  grade?: string;
  skill?: string;
  year?: number;
  officialName?: string;
  tags?: string[];
  isActive?: boolean;
  totalQuestions?: number;
  slug?: string;

  scope?: "class" | "grade";
  school?: School | null;
  classroom?: Classroom | null;
  gradeKey?: string;

  schoolYear?: SchoolYear | string | null;
  status?: "pending" | "approved" | "rejected";

  isArchived?: boolean;
  archivedAt?: string;
};

type ExamQuestion = {
  _id: string;
  content: string;
  skill?: string;
  type?: string;
  grade?: string;
  level?: string;
  subQuestions?: any[];
};

type MockExamDetail = MockExam & {
  questions?: ExamQuestion[];
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

const getExamTypeDisplay = (exam: MockExam) => {
  if (exam.scope === "class") {
    return "-";
  }

  if (
    exam.gradeKey &&
    ["6", "7", "8", "9", "10", "11", "12"].includes(exam.gradeKey)
  ) {
    return `Lớp ${exam.gradeKey}`;
  }

  if (exam.gradeKey === "thptqg" || exam.grade === "thptqg") {
    return "THPTQG";
  }

  return examTypeLabel[exam.examType] || exam.examType;
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

const getApproveStatusBadge = (status?: string) => {
  if (!status) {
    return (
      <Badge className="bg-slate-50 text-slate-700 border border-slate-200">
        Không rõ
      </Badge>
    );
  }

  if (status === "pending") {
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
        Chờ duyệt
      </Badge>
    );
  }

  if (status === "approved") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
        Đã duyệt
      </Badge>
    );
  }

  if (status === "rejected") {
    return (
      <Badge className="bg-rose-50 text-rose-700 border border-rose-200">
        Bị từ chối
      </Badge>
    );
  }

  return (
    <Badge className="bg-slate-50 text-slate-700 border border-slate-200">
      {status}
    </Badge>
  );
};

const renderScopeInfo = (exam: MockExam) => {
  if (!exam.scope) {
    if (exam.classroom?.name || exam.school?.name) {
      return [
        exam.school?.name && `Trường ${exam.school.name}`,
        exam.classroom?.name && `Lớp ${exam.classroom.name}`,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    return "Chưa gắn trường / lớp";
  }

  if (exam.scope === "class") {
    const schoolName = exam.school?.name
      ? `Trường ${exam.school.name}`
      : "Trường ?";
    const className = exam.classroom?.name
      ? `Lớp ${exam.classroom.name}`
      : "Lớp ?";
    return `${schoolName} · ${className}`;
  }

  const schoolName = exam.school?.name
    ? `Trường ${exam.school.name}`
    : "Trường ?";
  const gradeLabel =
    exam.gradeKey &&
    ["6", "7", "8", "9", "10", "11", "12"].includes(exam.gradeKey)
      ? `Khối ${exam.gradeKey}`
      : exam.grade || exam.gradeKey || "Khối ?";
  return `${schoolName} · ${gradeLabel} (cả khối)`;
};

const renderSchoolYearName = (exam: MockExam) => {
  if (!exam.schoolYear) return "-";

  if (typeof exam.schoolYear === "string") {
    return exam.schoolYear || "-";
  }

  return exam.schoolYear.name || "-";
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return iso;
  }
};

export default function AdminArchivedMockExams() {
  const [exams, setExams] = useState<MockExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<MockExamDetail | null>(null);

  const rawUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;
  const role = currentUser?.role;
  const isAdminOrSM = role === "admin" || role === "school_manager";

  const loadArchivedExams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }

      const res = await axios.get("http://localhost:5000/api/mock-exams", {
        headers: { Authorization: `Bearer ${token}` },
        params: { archived: true }, // ⬅️ lấy đề đã lưu trữ
      });

      const list: MockExam[] = res.data?.exams || res.data || [];
      setExams(list);
    } catch (err: any) {
      console.error(
        "loadArchivedExams error:",
        err?.response?.status,
        err?.response?.data
      );
      const msg =
        err?.response?.data?.message ||
        "Không thể tải danh sách đề thi thử đã lưu trữ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id?: string) => {
    if (!id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
      return;
    }

    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setSelectedExam(null);

      const res = await axios.get(
        `http://localhost:5000/api/mock-exams/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const exam: MockExamDetail = res.data?.exam || res.data;
      setSelectedExam(exam);
    } catch (err: any) {
      console.error(
        "load exam detail error:",
        err?.response?.status,
        err?.response?.data
      );
      toast.error(
        err?.response?.data?.message || "Không thể tải chi tiết đề thi thử"
      );
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedExam(null);
  };

  const handleRestore = async (id?: string) => {
    if (!id) return;
    if (
      !confirm(
        "Bạn có chắc chắn muốn khôi phục đề thi thử này khỏi kho lưu trữ?"
      )
    )
      return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
      return;
    }

    try {
      await axios.patch(
        `http://localhost:5000/api/mock-exams/${id}/restore`,
        // nếu muốn chọn năm học khác ở UI, có thể truyền body { schoolYearId: "..." }
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Đã khôi phục đề thi thử khỏi kho lưu trữ");
      loadArchivedExams();
    } catch (err: any) {
      console.error(
        "restore mock-exam error:",
        err?.response?.status,
        err?.response?.data
      );
      toast.error(
        err?.response?.data?.message || "Khôi phục đề thi thử thất bại"
      );
    }
  };

  const handleDeleteForever = async (id?: string) => {
    if (!id) return;
    if (
      !confirm(
        "Bạn có chắc chắn muốn XÓA VĨNH VIỄN đề thi này? Hành động này không thể hoàn tác."
      )
    )
      return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/mock-exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Đã xóa vĩnh viễn đề thi thử");
      loadArchivedExams();
    } catch (err: any) {
      console.error(
        "delete mock-exam forever error:",
        err?.response?.status,
        err?.response?.data
      );
      toast.error(
        err?.response?.data?.message ||
          "Xóa vĩnh viễn đề thi thử thất bại. Chỉ xóa được đề đang ở trong kho lưu trữ."
      );
    }
  };

  useEffect(() => {
    loadArchivedExams();
  }, []);

  const filteredExams = exams.filter((exam) => {
    const search = searchTerm.toLowerCase();
    const schoolYearName =
      typeof exam.schoolYear === "object" && exam.schoolYear?.name
        ? exam.schoolYear.name.toLowerCase()
        : typeof exam.schoolYear === "string"
        ? exam.schoolYear.toLowerCase()
        : "";

    return (
      exam.name.toLowerCase().includes(search) ||
      (exam.grade && exam.grade.toLowerCase().includes(search)) ||
      examTypeLabel[exam.examType].toLowerCase().includes(search) ||
      schoolYearName.includes(search)
    );
  });

  const totalQuestions = exams.reduce(
    (sum, exam) => sum + (exam.totalQuestions || 0),
    0
  );

  if (!isAdminOrSM) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <p className="text-sm text-muted-foreground">
          Bạn không có quyền truy cập kho lưu trữ đề thi thử.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 animate-fade-in">
        <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">
          Đang tải kho lưu trữ đề thi thử...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      {/* HEADER */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Mock test archive
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-700 to-slate-500 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Kho lưu trữ đề thi thử
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
              Nơi lưu các đề thi thử đã ngừng sử dụng theo từng năm học. Bạn có
              thể khôi phục hoặc xóa vĩnh viễn các đề này.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm theo tên đề, lớp, năm học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-background/80 focus-visible:ring-1 focus-visible:ring-primary/70"
              />
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Tổng đề trong kho
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

          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Tổng số câu
              </span>
              <span className="text-xl font-semibold text-foreground">
                {totalQuestions}
              </span>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Kỳ thi
              </span>
              <span className="text-sm text-foreground">
                <span className="font-semibold">
                  {exams.filter((e) => e.examType === "thptqg").length}
                </span>{" "}
                THPTQG ·{" "}
                <span className="font-semibold">
                  {exams.filter((e) => e.examType === "ielts").length}
                </span>{" "}
                IELTS
              </span>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Trạng thái duyệt
              </span>
              <span className="text-sm text-foreground">
                <span className="font-semibold">
                  {exams.filter((e) => e.status === "approved").length}
                </span>{" "}
                đã duyệt ·{" "}
                <span className="font-semibold">
                  {exams.filter((e) => e.status === "pending").length}
                </span>{" "}
                chờ duyệt
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* TABLE */}
      <Card className="shadow-sm border border-border/80 rounded-3xl bg-card/95 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base md:text-lg font-semibold text-foreground">
                Danh sách đề thi thử đã lưu trữ
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Chỉ hiển thị các đề có trạng thái{" "}
                <span className="font-medium">đã lưu trữ</span>. Bạn có thể
                khôi phục để dùng lại cho năm học khác, hoặc xóa vĩnh viễn.
              </CardDescription>
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
                    Áp dụng cho
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Năm học
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Lưu trữ lúc
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Số câu
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Mức độ
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Trạng thái duyệt
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
                      onClick={() => handleOpenDetail(exam._id)}
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
                          {getExamTypeDisplay(exam)}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground max-w-[220px]">
                        {renderScopeInfo(exam)}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {renderSchoolYearName(exam)}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(exam.archivedAt)}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {exam.totalQuestions ?? 0}
                      </TableCell>

                      <TableCell className="text-sm">
                        {getLevelBadge(exam.level)}
                      </TableCell>

                      <TableCell className="text-sm">
                        {getApproveStatusBadge(exam.status)}
                      </TableCell>

                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleOpenDetail(exam._id)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleRestore(exam._id)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" /> Khôi phục
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={() => handleDeleteForever(exam._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Xóa vĩnh viễn
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      Kho lưu trữ hiện đang trống.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG CHI TIẾT */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => !open && handleCloseDetail()}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedExam?.name || "Chi tiết đề thi thử (kho lưu trữ)"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Xem thông tin chi tiết đề thi thử đã lưu trữ.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Đang tải chi tiết đề thi thử...
              </p>
            </div>
          ) : !selectedExam ? (
            <p className="text-sm text-muted-foreground py-4">
              Không có dữ liệu đề thi.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Kỳ thi
                  </p>
                  <p className="text-sm">
                    {getExamTypeDisplay(selectedExam)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Mức độ
                  </p>
                  <div>{getLevelBadge(selectedExam.level)}</div>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Thời gian
                  </p>
                  <p className="text-sm flex items-center gap-1">
                    <Timer className="h-3 w-3" /> {selectedExam.duration} phút
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Năm học
                  </p>
                  <p className="text-sm">
                    {renderSchoolYearName(selectedExam)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Áp dụng cho
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {renderScopeInfo(selectedExam)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Trạng thái
                  </p>
                  <div>{getApproveStatusBadge(selectedExam.status)}</div>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Trạng thái lưu trữ
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedExam.isArchived
                      ? `Đang lưu trữ từ ${formatDateTime(
                          selectedExam.archivedAt
                        )}`
                      : "Chưa lưu trữ"}
                  </p>
                </div>
              </div>

              {selectedExam.description && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Mô tả
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedExam.description}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Danh sách câu hỏi ({selectedExam.questions?.length || 0})
                </p>
                {selectedExam.questions && selectedExam.questions.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border rounded-xl p-3 bg-muted/40 space-y-2">
                    {selectedExam.questions.map((q, index) => (
                      <div
                        key={q._id || index}
                        className="text-sm border-b last:border-b-0 border-border/40 pb-2 last:pb-0"
                      >
                        <p className="font-medium">
                          Câu {index + 1}:{" "}
                          <span className="font-normal">{q.content}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Kỹ năng: {q.skill || "Không rõ"} · Loại:{" "}
                          {q.type || "Không rõ"} · Lớp: {q.grade || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Đề thi chưa có câu hỏi hoặc bạn không có quyền xem danh sách
                    câu hỏi.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
