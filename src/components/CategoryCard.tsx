import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  totalExercises: number;
  completedExercises: number;
  color: "primary" | "secondary" | "accent";
  onClick?: () => void;
}

export const CategoryCard = ({
  title,
  description,
  icon: Icon,
  totalExercises,
  completedExercises,
  color,
  onClick,
}: CategoryCardProps) => {
  const progress = (completedExercises / totalExercises) * 100;
  
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    accent: "bg-accent/10 text-accent border-accent/20",
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={cn("p-3 rounded-lg", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-medium">{completedExercises}/{totalExercises}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                color === "primary" && "bg-primary",
                color === "secondary" && "bg-secondary",
                color === "accent" && "bg-accent"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Button variant="ghost" className="w-full group-hover:bg-accent/10">
          Bắt đầu luyện tập
        </Button>
      </CardContent>
    </Card>
  );
};
