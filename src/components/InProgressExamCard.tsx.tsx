import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, RotateCcw } from "lucide-react";
import "../styles/RecentActivityCard.css";

export type InProgressExam = {
  _id: string;        // id của document progress
  examId: string;     // id bài thi gốc (Test hoặc MockExam)
  title: string;
  isMock?: boolean;   // true = mockExam, false = test thường
  duration?: number;  // phút
  timeLeft?: number;  // giây còn lại
  skill?: string;     // ví dụ: "Reading", "mixed", "thptqg"...
  updatedAt: string;  // ISO date – lần lưu gần nhất
};

export function InProgressExamCard({
  exams = [],
  loading = false,
  onContinue,
}: {
  exams?: InProgressExam[];
  loading?: boolean;
  onContinue?: (examId: string, isMock: boolean) => void;
}) {
  const fmtDateTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  };

  const fmtTimeLeft = (sec?: number) => {
    if (!sec || sec <= 0) return "Chưa có thời gian";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}′${s.toString().padStart(2, "0")}″ còn lại`;
  };

  const count = exams.length;

  return (
    <Card className="h-[420px] flex flex-col">
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-slate-100 p-1.5">
              <RotateCcw className="h-4 w-4 text-slate-700" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Bài thi đang làm dở
              </CardTitle>
              <p className="text-xs text-slate-500">
                {count === 0
                  ? "Không có bài thi nào đang làm."
                  : `Bạn có ${count} bài thi đang làm dở.`}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
              <span>Đang tải danh sách...</span>
            </div>
          </div>
        ) : exams.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-sm text-slate-500 px-4">
            <p>Hiện tại bạn chưa có bài thi nào đang làm dở.</p>
            <p className="mt-1">
              Hãy bắt đầu một bài kiểm tra mới để hệ thống lưu lại tiến độ.
            </p>
          </div>
        ) : (
          <div className="h-full space-y-2.5 overflow-y-auto pr-1 soft-scrollbar">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="relative rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-sky-300 transition-colors"
              >
                {/* thanh màu nhỏ bên trái cho cảm giác “đang làm” */}
                <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sky-400" />

                <div className="flex items-start justify-between gap-3 pl-1">
                  <div className="space-y-1 flex-1">
                    <h4 className="font-medium text-sm md:text-[15px] text-slate-900 line-clamp-2">
                      {exam.title}
                    </h4>

                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                      {exam.skill && (
                        <span className="rounded-full bg-slate-50 px-2 py-0.5 border border-slate-200">
                          {exam.skill}
                        </span>
                      )}
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-100 text-emerald-700">
                        Đang làm dở
                      </span>
                      {exam.isMock && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 border border-amber-100 text-amber-700">
                          Đề thi thử
                        </span>
                      )}
                    </div>
                  </div>

                  {exam.duration && (
                    <div className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 border border-slate-200 shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{exam.duration} phút</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pl-1">
                  <span>Cập nhật: {fmtDateTime(exam.updatedAt)}</span>
                  <span>{fmtTimeLeft(exam.timeLeft)}</span>
                </div>

                <div className="mt-2.5 pl-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between rounded-lg text-xs md:text-sm border-slate-200 hover:border-sky-400 hover:bg-slate-50"
                    onClick={() => onContinue?.(exam.examId, !!exam.isMock)}
                  >
                    <span>Tiếp tục làm bài</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
