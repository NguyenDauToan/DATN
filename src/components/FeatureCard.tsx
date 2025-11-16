import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "primary" | "secondary" | "accent";
}

export const FeatureCard = ({ icon: Icon, title, description, color }: FeatureCardProps) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <div className="text-center animate-fade-in">
      <div className={cn(
        "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center",
        colorClasses[color]
      )}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};
