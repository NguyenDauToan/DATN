import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Target } from "lucide-react";

interface ExammCardProps {
  name: string;
  description: string;
  totalTests: number;
  completedTests: number;
  estimatedTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  onClick?: () => void;
}

export const ExammCard = ({
  name,
  description,
  totalTests,
  completedTests,
  estimatedTime,
  difficulty,
  onClick,
}: ExammCardProps) => {
  const progress = (completedTests / totalTests) * 100;
  
  const difficultyColors = {
    Beginner: "bg-secondary/20 text-secondary",
    Intermediate: "bg-accent/20 text-accent",
    Advanced: "bg-destructive/20 text-destructive",
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-2 hover:border-primary/50" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
          </div>
          <Badge className={difficultyColors[difficulty]}>
            {difficulty}
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span>{totalTests} bài thi thử</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Thời gian: {estimatedTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            <span>Đã hoàn thành: {completedTests}/{totalTests}</span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
          Bắt đầu luyện thi
        </Button>
      </CardContent>
    </Card>
  );
};
