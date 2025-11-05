import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Level, Grade } from "@/types/exam";

type LevelOrGrade = Level | Grade | "thptqg";

interface LevelCardProps {
  level: LevelOrGrade;
  description: string;
  isCompleted?: boolean;
  progress?: number;
  onClick: () => void;
}

// 🎨 Màu cho từng cấp/lớp
const levelColors: Record<LevelOrGrade, string> = {
  A1: "from-green-500 to-green-600",
  A2: "from-blue-500 to-blue-600",
  B1: "from-yellow-500 to-yellow-600",
  B2: "from-orange-500 to-orange-600",
  C1: "from-red-500 to-red-600",
  C2: "from-purple-500 to-purple-600",
  "6": "from-cyan-500 to-cyan-600",
  "7": "from-sky-500 to-sky-600",
  "8": "from-indigo-500 to-indigo-600",
  "9": "from-violet-500 to-violet-600",
  "10": "from-fuchsia-500 to-fuchsia-600",
  "11": "from-pink-500 to-pink-600",
  "12": "from-rose-500 to-rose-600",
  thptqg: "from-gray-500 to-gray-600",
};

export function LevelCard({
  level,
  description,
  isCompleted,
  progress = 0,
  onClick,
}: LevelCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
      onClick={onClick}
    >
      <div className={`h-2 bg-gradient-to-r ${levelColors[level]}`} />
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-foreground">{level === "thptqg" ? "THPTQG" : `Lớp ${level}`}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {isCompleted && <CheckCircle2 className="h-6 w-6 text-success" />}
        </div>

        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tiến độ</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${levelColors[level]} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="pt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
          Nhấn để xem bài thi →
        </div>
      </CardContent>
    </Card>
  );
}
