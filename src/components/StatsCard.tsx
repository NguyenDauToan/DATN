import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "secondary" | "accent";
}

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = "primary" 
}: StatsCardProps) => {
  const colorClasses = {
    primary: "from-primary/20 to-primary/5 text-primary",
    secondary: "from-secondary/20 to-secondary/5 text-secondary",
    accent: "from-accent/20 to-accent/5 text-accent",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "p-3 rounded-lg bg-gradient-to-br",
            colorClasses[color]
          )}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend.isPositive ? "bg-secondary/20 text-secondary" : "bg-destructive/20 text-destructive"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};
