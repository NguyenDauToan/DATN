import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Skill } from "@/types/exam";

interface SkillCardProps {
  skill: Skill;
  title: string;
  description: string;
  icon: LucideIcon;
  examCount: number;
  onClick: () => void;
}

const skillGradients: Record<Skill, string> = {
  listening: "from-primary to-primary-glow",
  reading: "from-success to-success/80",
  writing: "from-accent to-accent-glow",
  speaking: "from-chart-4 to-chart-4/80",
};

export function SkillCard({ skill, title, description, icon: Icon, examCount, onClick }: SkillCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
      onClick={onClick}
    >
      <div className={`h-2 bg-gradient-to-r ${skillGradients[skill]}`} />
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className={`p-4 rounded-xl bg-gradient-to-br ${skillGradients[skill]} bg-opacity-10`}>
            <Icon className="h-8 w-8 text-foreground" />
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground">
            {examCount} bài thi
          </span>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="pt-2 text-sm text-primary font-medium group-hover:translate-x-2 transition-transform">
          Bắt đầu luyện tập →
        </div>
      </CardContent>
    </Card>
  );
}
