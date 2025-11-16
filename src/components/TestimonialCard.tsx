import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestimonialCardProps {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
  onClick?: () => void; // thêm props onClick
}

export const TestimonialCard = ({
  name,
  role,
  content,
  rating,
  onClick, // nhận props onClick
}: TestimonialCardProps) => {
  return (
    <Card
      className="h-full hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick} // gắn onClick vào Card
    >
      <CardContent className="p-6">
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-5 h-5",
                i < rating ? "fill-accent text-accent" : "text-muted"
              )}
            />
          ))}
        </div>
        <p className="text-muted-foreground mb-6 italic">"{content}"</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
            {name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
