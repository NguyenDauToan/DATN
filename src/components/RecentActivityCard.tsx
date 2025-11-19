import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import "../styles/RecentActivityCard.css";

export type Activity = {
  id: string;
  testTitle: string;
  score: number;          // 0..10
  finishedAt: string;     // ISO date
  examType?: string;      // ví dụ: "thptqg", "ielts"
};

export function RecentActivityCard({
  activities = [],
  loading = false,
}: {
  activities?: Activity[];
  loading?: boolean;
}) {
  const fmt = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  const renderExamType = (examType?: string) => {
    if (!examType) return null;
    let label = examType;
    if (examType === "thptqg") label = "Đề thi THPT QG";
    if (examType === "ielts") label = "Đề thi IELTS";
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-[11px] text-sky-700 border border-sky-100 ml-1">
        {label}
      </span>
    );
  };

  return (
    <Card className="h-[420px] flex flex-col">
      <CardHeader className="shrink-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Hoạt động gần đây
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-0">
        {loading ? (
          <div className="h-full grid place-items-center text-muted-foreground">
            Đang tải...
          </div>
        ) : activities.length === 0 ? (
          <div className="h-full grid place-items-center text-muted-foreground">
            Chưa có hoạt động.
          </div>
        ) : (
          <div className="h-full max-h-full overflow-y-auto pr-1 space-y-2 soft-scrollbar">
            {activities.map((a) => {
              const status: "completed" | "failed" =
                a.score >= 5 ? "completed" : "failed";
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`mt-1 ${
                        status === "completed"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {a.testTitle || "Bài thi"}
                        {renderExamType(a.examType)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {fmt(a.finishedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        a.score >= 8
                          ? "text-success"
                          : a.score >= 5
                          ? "text-accent"
                          : "text-destructive"
                      }`}
                    >
                      {a.score}
                    </p>
                    <p className="text-xs text-muted-foreground">điểm</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
