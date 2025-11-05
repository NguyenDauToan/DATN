import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Award, ArrowRight } from "lucide-react";
import { Exam } from "@/types/exam";

interface ExamCardProps {
  exam: Exam;
  onStart: () => void;
}

const difficultyColors = {
  easy: "text-success bg-success/10",
  medium: "text-accent bg-accent/10",
  hard: "text-destructive bg-destructive/10",
};

const difficultyLabels = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export function ExamCard({ exam, onStart }: ExamCardProps) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg group">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-foreground">{exam.title}</h3>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${difficultyColors[exam.difficulty]}`}>
                {difficultyLabels[exam.difficulty]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{exam.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{exam.duration} phút</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{exam.questionsCount} câu hỏi</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            <span>Cấp độ {exam.level}</span>
          </div>
        </div>

        {exam.completed && exam.score !== undefined && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-sm font-medium text-success">
              Đã hoàn thành • Điểm: {exam.score}/100
            </p>
          </div>
        )}

        <Button 
          onClick={onStart}
          className="w-full group-hover:bg-primary/90 transition-all"
        >
          {exam.completed ? "Làm lại" : "Bắt đầu"}
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
