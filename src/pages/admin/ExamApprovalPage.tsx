import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Clock,
  School,
  Globe2,
} from "lucide-react";
import api from "@/api/Api";
import { getSocket } from "@/lib/socket";
type ExamStatus = "pending" | "approved" | "rejected";

/* -------- Đề thi theo kỹ năng (/api/exams) -------- */
type SkillExam = {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  grade?: string;
  level?: string;
  skill?: string;
  status: ExamStatus;
  createdAt: string;
  school?: { _id: string; name: string; code?: string };
  classroom?: { _id: string; name: string; code?: string };
  createdBy?: { _id: string; name?: string; email?: string };
};

/* -------- Đề thi thử (/api/mock-exams) -------- */
type MockExam = {
  _id: string;
  name: string;
  description?: string;
  duration: number;
  grade?: string;
  level?: string;
  skill?: string;
  status: ExamStatus;
  createdAt: string;
  examType: "thptqg" | "ielts" | "toeic" | "vstep" | "other";
  scope?: "class" | "grade";
  gradeKey?: string;
  school?: { _id: string; name: string; code?: string };
  classroom?: { _id: string; name: string; code?: string };
  createdBy?: { _id: string; name?: string; email?: string };
};

const examTypeLabel: Record<MockExam["examType"], string> = {
  thptqg: "THPTQG",
  ielts: "IELTS",
  toeic: "TOEIC",
  vstep: "VSTEP",
  other: "Kỳ thi khác",
};

const getStatusBadge = (status: ExamStatus) => {
  if (status === "pending") {
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs">
        Chờ duyệt
      </Badge>
    );
  }
  if (status === "approved") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs">
        Đã duyệt
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-50 text-rose-700 border border-rose-200 rounded-full px-3 py-1 text-xs">
      Bị từ chối
    </Badge>
  );
};

type RejectTarget =
  | { kind: "skill"; id: string }
  | { kind: "mock"; id: string }
  | null;
const getMockExamTypeDisplay = (exam: MockExam) => {
  // Nếu đề chỉ áp dụng cho 1 lớp thì không nên hiện THPTQG
  if (exam.scope === "class") {
    // ưu tiên hiển thị grade nếu có, ví dụ "Lớp 6"
    if (exam.grade) return exam.grade;
    return "Theo lớp";
  }

  // Nếu áp dụng cho cả khối 6–12
  if (
    exam.gradeKey &&
    ["6", "7", "8", "9", "10", "11", "12"].includes(exam.gradeKey)
  ) {
    return `Lớp ${exam.gradeKey}`;
  }

  // THPTQG
  if (exam.gradeKey === "thptqg" || exam.grade === "thptqg") {
    return "THPTQG";
  }

  // các loại cố định khác: IELTS, TOEIC, VSTEP, ...
  return examTypeLabel[exam.examType] || exam.examType;
};

export default function ExamApprovalPage() {
  const [skillExams, setSkillExams] = useState<SkillExam[]>([]);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);

  const [loadingSkill, setLoadingSkill] = useState(false);
  const [loadingMock, setLoadingMock] = useState(false);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<RejectTarget>(null);

  const loading = loadingSkill || loadingMock;

  /* -------- load đề thi kỹ năng đang pending -------- */
  const fetchSkillExams = async () => {
    try {
      setLoadingSkill(true);
      const res = await api.get<SkillExam[]>("/exams", {
        params: { status: "pending" },
      });
      setSkillExams(res.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
        "Lỗi tải danh sách đề thi (kỹ năng) chờ duyệt",
      );
    } finally {
      setLoadingSkill(false);
    }
  };

  /* -------- load đề thi thử đang pending -------- */
  const fetchMockExams = async () => {
    try {
      setLoadingMock(true);
      const res = await api.get<{ exams: MockExam[] }>("/mock-exams", {
        params: { status: "pending" },
      });
      setMockExams(res.data?.exams || []);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
        "Lỗi tải danh sách đề thi thử chờ duyệt",
      );
    } finally {
      setLoadingMock(false);
    }
  };

  const fetchAll = () => {
    fetchSkillExams();
    fetchMockExams();
  };

  useEffect(() => {
    fetchAll();
    const intervalId = setInterval(() => {
      fetchAll();
    }, 30_000);

    return () => clearInterval(intervalId);
  }, []);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("vi-VN");
  };

  /* -------- duyệt -------- */
  const handleApprove = async (kind: "skill" | "mock", id: string) => {
    try {
      setApprovingId(id);

      if (kind === "skill") {
        await api.patch(`/exams/${id}/approve`);
        toast.success("Đã duyệt đề thi");
        setSkillExams((prev) =>
          prev.map((e) => (e._id === id ? { ...e, status: "approved" } : e)),
        );
      } else {
        await api.patch(`/mock-exams/${id}/approve`);
        toast.success("Đã duyệt đề thi thử");
        setMockExams((prev) =>
          prev.map((e) => (e._id === id ? { ...e, status: "approved" } : e)),
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Lỗi khi duyệt đề thi / đề thi thử",
      );
    } finally {
      setApprovingId(null);
    }
  };

  /* -------- mở dialog từ chối -------- */
  const openRejectDialog = (kind: "skill" | "mock", id: string) => {
    setRejectTarget({ kind, id });
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  /* -------- xác nhận từ chối -------- */
  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    try {
      setApprovingId(rejectTarget.id);

      if (rejectTarget.kind === "skill") {
        await api.patch(`/exams/${rejectTarget.id}/reject`, {
          reason: rejectReason,
        });
        toast.success("Đã từ chối đề thi");
        setSkillExams((prev) =>
          prev.map((e) =>
            e._id === rejectTarget.id ? { ...e, status: "rejected" } : e,
          ),
        );
      } else {
        await api.patch(`/mock-exams/${rejectTarget.id}/reject`, {
          reason: rejectReason,
        });
        toast.success("Đã từ chối đề thi thử");
        setMockExams((prev) =>
          prev.map((e) =>
            e._id === rejectTarget.id ? { ...e, status: "rejected" } : e,
          ),
        );
      }

      setRejectDialogOpen(false);
      setRejectTarget(null);
      setRejectReason("");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
        "Lỗi khi từ chối đề thi / đề thi thử",
      );
    } finally {
      setApprovingId(null);
    }
  };

  const renderScopeInfo = (item: {
    school?: { name: string };
    classroom?: { name: string };
  }) => {
    if (item.school?.name || item.classroom?.name) {
      return [
        item.school?.name && `Trường ${item.school.name}`,
        item.classroom?.name && `Lớp ${item.classroom.name}`,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    return "Không gắn trường/lớp";
  };
  useEffect(() => {
    // load lần đầu
    fetchAll();

    const socket = getSocket();

    const handleCreated = (payload: { kind: "skill" | "mock" }) => {
      console.log("[socket] exam:created", payload);
      if (payload.kind === "skill") {
        fetchSkillExams();
      } else if (payload.kind === "mock") {
        fetchMockExams();
      }
    };

    const handleStatusChanged = (payload: {
      kind: "skill" | "mock";
      examId: string;
      status: ExamStatus;
    }) => {
      console.log("[socket] exam:statusChanged", payload);
      if (payload.kind === "skill") {
        setSkillExams((prev) =>
          prev.map((e) =>
            e._id === payload.examId ? { ...e, status: payload.status } : e,
          ),
        );
      } else {
        setMockExams((prev) =>
          prev.map((e) =>
            e._id === payload.examId ? { ...e, status: payload.status } : e,
          ),
        );
      }
    };

    socket.on("exam:created", handleCreated);
    socket.on("exam:statusChanged", handleStatusChanged);

    return () => {
      socket.off("exam:created", handleCreated);
      socket.off("exam:statusChanged", handleStatusChanged);
    };
  }, []);



  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Exam moderation
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
            Duyệt đề thi
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Admin / quản lý hệ thống xem, duyệt hoặc từ chối các đề thi giáo
            viên tạo (đề kỹ năng và đề thi thử).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 rounded-full px-4"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </Button>
      </div>

      {/* -------- Section 1: Đề thi theo kỹ năng -------- */}
      <Card className="border border-border/70 shadow-sm rounded-3xl bg-card/95 backdrop-blur mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg font-semibold">
              Đề thi theo kỹ năng chờ duyệt
            </CardTitle>
          </div>
          <Badge className="rounded-full px-3 py-1 text-xs bg-muted text-foreground border border-border/60">
            {skillExams.length} đề
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {loadingSkill && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Đang tải danh sách đề thi...
            </div>
          )}

          {!loadingSkill && skillExams.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Hiện không có đề thi nào ở trạng thái chờ duyệt.
            </div>
          )}

          {!loadingSkill && skillExams.length > 0 && (
            <div className="space-y-3">
              {skillExams.map((exam, idx) => (
                <div
                  key={exam._id}
                  className="group rounded-2xl border border-border/70 bg-background/80 hover:bg-primary/3 hover:border-primary/60 transition-all p-4 md:p-5 flex flex-col gap-4 md:gap-3 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base md:text-lg text-foreground">
                          {exam.title}
                        </span>
                        {getStatusBadge(exam.status)}
                      </div>

                      {exam.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {exam.description}
                        </p>
                      )}

                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {exam.duration} phút
                        </span>
                        {exam.grade && <span>| Lớp/Khối: {exam.grade}</span>}
                        {exam.level && <span>| Mức: {exam.level}</span>}
                        {exam.skill && <span>| Kỹ năng: {exam.skill}</span>}
                      </div>
                    </div>

                    <div className="min-w-[220px] space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <School className="w-3 h-3" />
                        <span>{renderScopeInfo(exam)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[11px] uppercase tracking-wide">
                          Tạo lúc:
                        </span>{" "}
                        {formatDate(exam.createdAt)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right text-xs">
                        {exam.createdBy?.name && (
                          <div className="font-medium">
                            {exam.createdBy.name}
                          </div>
                        )}
                        {exam.createdBy?.email && (
                          <div className="text-muted-foreground">
                            {exam.createdBy.email}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 rounded-full px-4"
                          disabled={approvingId === exam._id}
                          onClick={() => handleApprove("skill", exam._id)}
                        >
                          {approvingId === exam._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Duyệt
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex items-center gap-1 rounded-full px-4"
                          onClick={() => openRejectDialog("skill", exam._id)}
                        >
                          <XCircle className="w-4 h-4" />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* -------- Section 2: Đề thi thử -------- */}
      <Card className="border border-border/70 shadow-sm rounded-3xl bg-card/95 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg font-semibold">
              Đề thi thử chờ duyệt
            </CardTitle>
          </div>
          <Badge className="rounded-full px-3 py-1 text-xs bg-muted text-foreground border border-border/60">
            {mockExams.length} đề
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {loadingMock && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Đang tải danh sách đề thi thử...
            </div>
          )}

          {!loadingMock && mockExams.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Hiện không có đề thi thử nào ở trạng thái chờ duyệt.
            </div>
          )}

          {!loadingMock && mockExams.length > 0 && (
            <div className="space-y-3">
              {mockExams.map((exam, idx) => (
                <div
                  key={exam._id}
                  className="group rounded-2xl border border-border/70 bg-background/80 hover:bg-primary/3 hover:border-primary/60 transition-all p-4 md:p-5 flex flex-col gap-4 md:gap-3 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base md:text-lg text-foreground">
                          {exam.name}
                        </span>
                        {getStatusBadge(exam.status)}
                      </div>

                      <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground rounded-full bg-muted/80 px-2 py-0.5">
                        <Globe2 className="w-3 h-3" />
                        {getMockExamTypeDisplay(exam)}
                      </div>


                      {exam.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {exam.description}
                        </p>
                      )}

                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {exam.duration} phút
                        </span>
                        {exam.grade && <span>| Khối/Band: {exam.grade}</span>}
                        {exam.level && <span>| Mức: {exam.level}</span>}
                        {exam.skill && <span>| Kỹ năng: {exam.skill}</span>}
                      </div>
                    </div>

                    <div className="min-w-[220px] space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <School className="w-3 h-3" />
                        <span>{renderScopeInfo(exam)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[11px] uppercase tracking-wide">
                          Tạo lúc:
                        </span>{" "}
                        {formatDate(exam.createdAt)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right text-xs">
                        {exam.createdBy?.name && (
                          <div className="font-medium">
                            {exam.createdBy.name}
                          </div>
                        )}
                        {exam.createdBy?.email && (
                          <div className="text-muted-foreground">
                            {exam.createdBy.email}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 rounded-full px-4"
                          disabled={approvingId === exam._id}
                          onClick={() => handleApprove("mock", exam._id)}
                        >
                          {approvingId === exam._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Duyệt
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex items-center gap-1 rounded-full px-4"
                          onClick={() => openRejectDialog("mock", exam._id)}
                        >
                          <XCircle className="w-4 h-4" />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog từ chối dùng chung cho cả 2 loại */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đề thi</DialogTitle>
            <DialogDescription>
              Nhập lý do từ chối để giáo viên có thể chỉnh sửa lại đề thi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rejectReason">Lý do từ chối</Label>
            <Textarea
              id="rejectReason"
              placeholder="Ví dụ: Nội dung chưa phù hợp, cần bổ sung thêm câu hỏi mức độ khó..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectTarget(null);
                setRejectReason("");
              }}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="flex items-center gap-1"
              onClick={handleRejectConfirm}
              disabled={!rejectTarget || !rejectReason.trim()}
            >
              <XCircle className="w-4 h-4" />
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
