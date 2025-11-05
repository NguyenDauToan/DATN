import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { StatCard } from "@/components/StatCard";
import { RecentActivityCard } from "@/components/RecentActivityCard";
import { UpcomingExamCard } from "@/components/UpcomingExamCard";
import { SkillCard } from "@/components/SkillCard";
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Award,
  Headphones,
  PenTool,
  Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const skillIcons: Record<string, any> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
};

const Index = () => {
  const navigate = useNavigate();

  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Lấy danh sách kỹ năng từ backend
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        setError(null);

        // 👉 Giả sử backend có route /api/skills hoặc /api/exams/skills
        const res = await axios.get("/api/skills");
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.skills || [];

        setSkills(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải kỹ năng:", err);
        setError("Không thể tải danh sách kỹ năng");
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-6 md:p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Chào mừng trở lại! 👋
          </h1>
          <p className="text-muted-foreground">
            Hãy tiếp tục hành trình học tập của bạn
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            title="Bài thi đã hoàn thành"
            value="24"
            icon={BookOpen}
            trend="+12% so với tháng trước"
            colorClass="text-primary"
          />
          <StatCard
            title="Tỷ lệ chính xác"
            value="87%"
            icon={Target}
            trend="+5% so với tuần trước"
            colorClass="text-success"
          />
          <StatCard
            title="Thời gian học"
            value="42h"
            icon={TrendingUp}
            trend="+8h so với tuần trước"
            colorClass="text-accent"
          />
          <StatCard
            title="Huy chương"
            value="15"
            icon={Award}
            trend="+3 huy chương mới"
            colorClass="text-chart-4"
          />
        </div>

        {/* Quick Start Section */}
        <div className="p-6 rounded-xl bg-gradient-primary text-primary-foreground">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Sẵn sàng luyện tập?</h2>
              <p className="opacity-90">Chọn cấp độ và kỹ năng để bắt đầu</p>
            </div>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/practice")}
              className="gap-2"
            >
              Bắt đầu ngay
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Skills Overview */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Kỹ năng luyện tập</h2>

          {loading ? (
            <p className="text-muted-foreground">Đang tải kỹ năng...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : skills.length === 0 ? (
            <p className="text-muted-foreground">Chưa có kỹ năng nào</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {skills.map((skill: any, index: number) => (
                <div
                  key={skill._id || skill.name || index}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <SkillCard
                    skill={skill.name}
                    title={skill.displayName || skill.name}
                    description={skill.description || "Không có mô tả"}
                    icon={skillIcons[skill.name] || BookOpen}
                    examCount={skill.examCount || 0}
                    onClick={() => navigate(`/practice?skill=${skill.name}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingExamCard />
          <RecentActivityCard />
        </div>
      </div>
    </div>
  );
};

export default Index;
