import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";

interface Exam {
  id: number;
  title: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
}

const upcomingExams: Exam[] = [
  {
    id: 1,
    title: "Kiểm tra giữa kỳ",
    subject: "Toán học",
    date: "15/11/2025",
    time: "08:00",
    duration: "90 phút",
  },
  {
    id: 2,
    title: "Bài thi Cuối chương",
    subject: "Vật lý",
    date: "18/11/2025",
    time: "14:00",
    duration: "60 phút",
  },
  {
    id: 3,
    title: "Đánh giá Học kỳ",
    subject: "Tiếng Anh",
    date: "20/11/2025",
    time: "10:00",
    duration: "120 phút",
  },
];

export function UpcomingExamCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-accent" />
          Bài thi sắp tới
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingExams.map((exam) => (
          <div 
            key={exam.id}
            className="p-4 rounded-lg border border-border bg-gradient-to-br from-card to-muted/20 hover:shadow-md transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{exam.title}</h4>
                  <p className="text-sm text-muted-foreground">{exam.subject}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/10 text-accent">
                  {exam.duration}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{exam.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{exam.time}</span>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full mt-2">
                Xem chi tiết
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
