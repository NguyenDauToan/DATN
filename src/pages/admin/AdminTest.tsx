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
  Copy,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import AddExamModal from "./AddExam";
import { GenerateExamAI } from "./GenerateExamAI";
import { toast } from "sonner";
import ViewExamDialog from "./controller/ViewExamDialog";
import EditExamDialog from "./controller/EditExamDialog";

export default function AdminTests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openExamId, setOpenExamId] = useState<string | null>(null);
  const [editExamId, setEditExamId] = useState<string | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/exams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExams(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách đề thi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredExams = exams.filter(
    (exam) =>
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.grade?.toString().includes(searchTerm)
  );

  const totalQuestions = exams.reduce(
    (sum, exam) => sum + (exam.questions?.length || 0),
    0
  );

  const getLevelBadge = (level: string) => {
    const map: Record<string, string> = {
      easy: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      medium: "bg-amber-50 text-amber-700 border border-amber-200",
      hard: "bg-rose-50 text-rose-700 border border-rose-200",
    };

    const label =
      level === "easy"
        ? "Dễ"
        : level === "medium"
        ? "Trung bình"
        : level === "hard"
        ? "Khó"
        : level;

    return (
      <Badge className={map[level] || "bg-slate-50 text-slate-700 border border-slate-200"}>
        {label}
      </Badge>
    );
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đề thi này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa đề thi thành công");
      loadExams();
    } catch {
      toast.error("Xóa đề thi thất bại");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 animate-fade-in">
        <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Đang tải dữ liệu đề thi...</p>
      </div>
    );

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      {/* HEADER + ACTIONS */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Exam management
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
              Quản lý đề thi
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
              Theo dõi, chỉnh sửa và tạo mới các đề thi. Tối ưu ngân hàng đề cho từng khối
              lớp và mức độ.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            <AddExamModal onSuccess={loadExams}>
              <Button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card text-foreground shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all">
                <PlusCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Thêm đề thi</span>
              </Button>
            </AddExamModal>

            <GenerateExamAI onSuccess={loadExams}>
              <Button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-primary to-sky-500 text-white shadow-md hover:shadow-lg hover:translate-y-[-1px] transition-all">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Tạo đề bằng AI</span>
              </Button>
            </GenerateExamAI>
          </div>
        </div>

        {/* MINI STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Tổng đề thi
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
                Tổng số câu hỏi
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
                Lớp đang được dùng
              </span>
              <span className="text-xl font-semibold text-foreground">
                {Array.from(new Set(exams.map((e) => e.grade))).filter(Boolean).length}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Đa dạng theo khối lớp
              </span>
            </CardContent>
          </Card>
          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Mức độ đề
              </span>
              <span className="text-sm text-foreground">
                <span className="font-semibold">
                  {exams.filter((e) => e.level === "easy").length}
                </span>{" "}
                dễ ·{" "}
                <span className="font-semibold">
                  {exams.filter((e) => e.level === "medium").length}
                </span>{" "}
                TB ·{" "}
                <span className="font-semibold">
                  {exams.filter((e) => e.level === "hard").length}
                </span>{" "}
                khó
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* LIST CARD */}
      <Card className="shadow-sm border border-border/80 rounded-3xl bg-card/95 backdrop-blur animate-slide-in">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base md:text-lg font-semibold text-foreground">
                Danh sách đề thi
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Tìm kiếm, xem nhanh và thao tác trên từng đề thi.
              </CardDescription>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm theo tên đề, lớp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-background/80 focus-visible:ring-1 focus-visible:ring-primary/70"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="rounded-2xl overflow-hidden border border-border/70 bg-background/60">
            <Table>
              <TableHeader className="bg-muted/60 backdrop-blur">
                <TableRow className="border-border/60">
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Tên đề thi
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Lớp
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Mức độ
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Thời gian
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Số câu hỏi
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
                      key={exam._id}
                      className="hover:bg-primary/5 transition-all cursor-pointer group"
                      onClick={() => setOpenExamId(exam._id)}
                      style={{ animationDelay: `${idx * 35}ms` }}
                    >
                      <TableCell className="font-medium text-sm text-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span className="line-clamp-1 group-hover:text-primary transition-colors">
                            {exam.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            ID: {exam._id.slice(-6)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {exam.grade || "-"}
                      </TableCell>
                      <TableCell className="text-sm">{getLevelBadge(exam.level)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {exam.duration} phút
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {exam.questions?.length || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenExamId(exam._id);
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditExamId(exam._id);
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => e.stopPropagation()}
                              className="cursor-pointer"
                            >
                              <Copy className="mr-2 h-4 w-4" /> Sao chép
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteExam(exam._id);
                              }}
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
                      colSpan={6}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      Không tìm thấy đề thi nào phù hợp với từ khóa hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {openExamId && (
        <ViewExamDialog examId={openExamId} onClose={() => setOpenExamId(null)} />
      )}
      {editExamId && (
        <EditExamDialog
          examId={editExamId}
          onClose={() => setEditExamId(null)}
          onSuccess={loadExams}
        />
      )}
    </div>
  );
}
