import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  colorClass?: string;
}

export function StatCard({ title, value, icon: Icon, trend, colorClass = "text-primary" }: StatCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className="text-xs text-success font-medium">{trend}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br from-${colorClass}/10 to-${colorClass}/5`}>
            <Icon className={`h-6 w-6 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
