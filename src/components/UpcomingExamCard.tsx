import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export type UpcomingExam = {
  _id: string;
  title: string;
  startTime: string;   // ISO date
  duration?: number;   // minutes
  skill?: string;
};

export function UpcomingExamCard({
  exams = [],
  loading = false,
  onOpenExam,
}: {
  exams?: UpcomingExam[];
  loading?: boolean;
  onOpenExam?: (id: string) => void;
}) {
  const fmtDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(d);
  };
  const fmtTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", { timeStyle: "short" }).format(d);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-accent" />
          Bài thi sắp tới
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="h-24 grid place-items-center text-muted-foreground">Đang tải...</div>
        ) : exams.length === 0 ? (
          <div className="h-24 grid place-items-center text-muted-foreground">Chưa có lịch thi.</div>
        ) : (
          exams.map((exam) => (
            <div
              key={exam._id}
              className="p-4 rounded-lg border border-border bg-gradient-to-br from-card to-muted/20 hover:shadow-md transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{exam.title}</h4>
                    <p className="text-sm text-muted-foreground">{exam.skill ?? "—"}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/10 text-accent">
                    {exam.duration ? `${exam.duration} phút` : "—"}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{fmtDate(exam.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{fmtTime(exam.startTime)}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => onOpenExam?.(exam._id)}
                >
                  Xem chi tiết
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
