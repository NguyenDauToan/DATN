import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LevelCard } from "@/components/LevelCard";
import { SkillCard } from "@/components/SkillCard";
import { Headphones, BookOpen, PenTool, Mic, ArrowLeft } from "lucide-react";
import { Grade } from "@/types/exam";
import { Button } from "@/components/ui/button";
import axios from "axios";
import AuthDialog from "./user/AuthDialog";

const skillIcons: Record<string, any> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
};

const levels: { level: Grade | "thptqg"; description: string }[] = [
  { level: "6", description: "Lớp 6 - Sơ cấp" },
  { level: "7", description: "Lớp 7 - Sơ cấp nâng cao" },
  { level: "8", description: "Lớp 8 - Trung cấp" },
  { level: "9", description: "Lớp 9 - Trung cấp nâng cao" },
  { level: "10", description: "Lớp 10 - Khá" },
  { level: "11", description: "Lớp 11 - Khá giỏi" },
  { level: "12", description: "Lớp 12 - Nâng cao" },
  { level: "thptqg", description: "Thi THPT Quốc Gia" },
];

const Practice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLevel, setSelectedLevel] = useState<Grade | "thptqg" | null>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const params = new URLSearchParams(location.search);
  const preselectedSkill = params.get("skill");

  // Kiểm tra token
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSkills = async () => {
      if (!token) {
        setAuthOpen(true); // chưa đăng nhập → mở dialog
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get("/api/skills", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data) ? res.data : res.data.skills || [];
        setSkills(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải kỹ năng:", err);
        setError("Không thể tải danh sách kỹ năng");
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, [token]);

  const handleLevelSelect = (level: Grade | "thptqg") => {
    if (!token) return setAuthOpen(true); // chưa đăng nhập → mở dialog
    setSelectedLevel(level);
    if (preselectedSkill) {
      navigate(`/exams?grade=${level}&skill=${preselectedSkill}`);
    }
  };

  const handleBack = () => setSelectedLevel(null);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-6 md:p-8 space-y-8 animate-fade-in">
        {!selectedLevel ? (
          <>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Chọn cấp độ của bạn
              </h1>
              <p className="text-muted-foreground">
                Chọn lớp hoặc kỳ thi bạn muốn luyện tập
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {levels.map((item, index) => (
                <div
                  key={item.level}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <LevelCard
                    level={item.level}
                    description={item.description}
                    progress={Math.floor(Math.random() * 100)}
                    onClick={() => handleLevelSelect(item.level)}
                  />
                </div>
              ))}
            </div>
          </>
        ) : !preselectedSkill ? (
          <>
            <div className="space-y-4">
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Chọn kỹ năng - {selectedLevel === "thptqg" ? "Thi THPT Quốc Gia" : `Lớp ${selectedLevel}`}
              </h1>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Đang tải kỹ năng...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : skills.length === 0 ? (
              <p className="text-muted-foreground">Chưa có kỹ năng nào</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {skills.map((item, index) => (
                  <div
                    key={item._id || item.name || index}
                    className="animate-slide-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <SkillCard
                      skill={item.name}
                      title={item.displayName || item.name}
                      description={item.description || "Không có mô tả"}
                      icon={skillIcons[item.name] || BookOpen}
                      examCount={item.examCount || 0}
                      onClick={() => navigate(`/exams?grade=${selectedLevel}&skill=${item.name}`)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Dialog thông báo chưa đăng nhập */}
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Practice;
