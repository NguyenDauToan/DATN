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

  return (
    <Card className="h-[420px] flex flex-col">
      <CardHeader className="shrink-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-primary" />
          Bài thi đang làm dở
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-0">
        {loading ? (
          <div className="h-full grid place-items-center text-muted-foreground">
            Đang tải...
          </div>
        ) : exams.length === 0 ? (
          <div className="h-full grid place-items-center text-muted-foreground">
            Bạn chưa có bài thi nào đang làm dở.
          </div>
        ) : (
          <div className="h-full space-y-3 overflow-y-auto pr-1 soft-scrollbar">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="p-3 rounded-xl border border-slate-200 bg-white/90 hover:shadow-md hover:border-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm md:text-base text-slate-900 line-clamp-2">
                      {exam.title}
                    </h4>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                      {exam.skill && (
                        <span className="rounded-full bg-slate-50 px-2 py-0.5 border border-slate-200">
                          {exam.skill}
                        </span>
                      )}
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 border border-indigo-100 text-indigo-700">
                        Đang làm dở
                      </span>
                    </div>
                  </div>

                  {exam.duration && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 border border-slate-200">
                      <Clock className="h-3 w-3" />
                      {exam.duration} phút
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>Cập nhật: {fmtDateTime(exam.updatedAt)}</span>
                  <span>{fmtTimeLeft(exam.timeLeft)}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full rounded-xl text-xs md:text-sm"
                  onClick={() => onContinue?.(exam.examId, !!exam.isMock)}
                >
                  Tiếp tục làm bài
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
