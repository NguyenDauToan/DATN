import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

interface Activity {
  id: number;
  title: string;
  subject: string;
  date: string;
  score: number;
  status: "completed" | "failed";
}

const activities: Activity[] = [
  {
    id: 1,
    title: "Bài kiểm tra Chương 1",
    subject: "Toán học",
    date: "Hôm nay, 14:30",
    score: 85,
    status: "completed",
  },
  {
    id: 2,
    title: "Luyện tập Ngữ pháp",
    subject: "Tiếng Anh",
    date: "Hôm qua, 10:15",
    score: 92,
    status: "completed",
  },
  {
    id: 3,
    title: "Bài tập Lịch sử",
    subject: "Lịch sử",
    date: "2 ngày trước",
    score: 65,
    status: "failed",
  },
  {
    id: 4,
    title: "Thí nghiệm Vật lý",
    subject: "Vật lý",
    date: "3 ngày trước",
    score: 78,
    status: "completed",
  },
];

export function RecentActivityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Hoạt động gần đây
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1">
              <div className={`mt-1 ${
                activity.status === "completed" ? "text-success" : "text-destructive"
              }`}>
                {activity.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground">{activity.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${
                activity.score >= 80 ? "text-success" : 
                activity.score >= 60 ? "text-accent" : "text-destructive"
              }`}>
                {activity.score}
              </p>
              <p className="text-xs text-muted-foreground">điểm</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
