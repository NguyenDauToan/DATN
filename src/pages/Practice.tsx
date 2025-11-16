// src/pages/Practice.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LevelCard } from "@/components/LevelCard";
import { SkillCard } from "@/components/SkillCard";
import { Headphones, BookOpen, PenTool, Mic, ArrowLeft } from "lucide-react";
import { Grade } from "@/types/exam";
import { Button } from "@/components/ui/button";
import AuthDialog from "./user/AuthDialog";
import { Skill } from "@/types/exam";
// Dùng instance API chung
import { skillsAPI, resultAPI } from "@/api/Api"; // chỉnh path cho khớp dự án của anh

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

type SkillItem = {
  name: string;
  displayName?: string;
  description?: string;
  examCount?: number;
  questionCount?: number;
};

type ResultForProgress = {
  answers: {
    grade: string;
    isCorrect: boolean;
    answer: string;
  }[];
};

const Practice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLevel, setSelectedLevel] = useState<Grade | "thptqg" | null>(null);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [errorSkills, setErrorSkills] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const params = new URLSearchParams(location.search);
  const preselectedSkill = params.get("skill");
  const [progressData, setProgressData] = useState<Record<string, number>>({});

  const token = localStorage.getItem("token");

  // ===== 1. Fetch skills =====
  useEffect(() => {
    const fetchSkills = async () => {
      if (!token) {
        setAuthOpen(true);
        setLoadingSkills(false);
        return;
      }
      try {
        setLoadingSkills(true);
        setErrorSkills(null);

        const res = await skillsAPI.getAll();
        // Backend trả về { skills: [...] }
        const data = res.data?.skills ?? [];
        setSkills(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải kỹ năng:", err);
        setErrorSkills("Không thể tải danh sách kỹ năng");
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchSkills();
  }, [token]);

  // ===== 2. Fetch progress theo cấp độ (dựa trên /api/results/me) =====
  useEffect(() => {
    const fetchProgress = async () => {
      if (!token) {
        setLoadingProgress(false);
        return;
      }
      try {
        setLoadingProgress(true);

        const res = await resultAPI.getMyResults();
        const data: ResultForProgress[] = res.data || [];

        const levelProgress: Record<string, number> = {};

        levels.forEach((lvl) => {
          let totalQuestions = 0;
          let answeredCorrectly = 0;

          data.forEach((r) => {
            (r.answers || []).forEach((a) => {
              if (a.grade === lvl.level) {
                totalQuestions++;
                if (a.isCorrect) answeredCorrectly++;
              }
            });
          });

          levelProgress[lvl.level] =
            totalQuestions > 0
              ? Math.floor((answeredCorrectly / totalQuestions) * 100)
              : 0;
        });

        setProgressData(levelProgress);
      } catch (err) {
        console.error("❌ Lỗi khi lấy tiến độ:", err);
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchProgress();
  }, [token]);

  // ===== 3. Handlers =====
  const handleLevelSelect = (level: Grade | "thptqg") => {
    if (!token) return setAuthOpen(true);
    setSelectedLevel(level);
    if (preselectedSkill) {
      navigate(`/exams?grade=${level}&skill=${preselectedSkill}`);
    }
  };

  const handleBack = () => setSelectedLevel(null);

  // ===== 4. UI =====
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50">
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
        {/* Bước 1: Chọn cấp độ */}
        {!selectedLevel ? (
          <>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                Chọn cấp độ của bạn
              </h1>
              <p className="text-sm text-slate-500">
                Hệ thống sẽ gợi ý bài luyện tập phù hợp với lớp hoặc kỳ thi bạn chọn.
              </p>
            </div>

            <div className="mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {levels.map((item, index) => (
                  <div
                    key={item.level}
                    className="animate-slide-in"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <LevelCard
                      level={item.level}
                      description={item.description}
                      progress={
                        loadingProgress ? 0 : progressData[item.level] || 0
                      }
                      onClick={() => handleLevelSelect(item.level)}
                    />
                  </div>
                ))}
              </div>
              {loadingProgress && (
                <p className="mt-2 text-xs text-slate-400">
                  Đang tải tiến độ học tập theo từng lớp...
                </p>
              )}
            </div>
          </>
        ) : !preselectedSkill ? (
          // Bước 2: Chọn kỹ năng
          <>
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="gap-2 px-0 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại chọn cấp độ
              </Button>

              <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Chọn kỹ năng luyện tập
                </h1>
                <p className="text-sm text-slate-500">
                  {selectedLevel === "thptqg"
                    ? "Luyện tập theo từng kỹ năng cho kỳ thi THPT Quốc Gia."
                    : `Luyện tập các kỹ năng tiếng Anh cho học sinh lớp ${selectedLevel}.`}
                </p>
              </div>
            </div>

            {/* Danh sách kỹ năng */}
            <div className="mt-4">
              {loadingSkills ? (
                <p className="text-slate-500 text-sm">Đang tải danh sách kỹ năng...</p>
              ) : errorSkills ? (
                <p className="text-red-500 text-sm">{errorSkills}</p>
              ) : skills.length === 0 ? (
                <p className="text-slate-500 text-sm">Chưa có kỹ năng nào.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {skills.map((item, index) => (
                    <div
                      key={item.name ?? index}
                      className="animate-slide-in"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <SkillCard
                        skill={item.name as Skill}
                        title={item.displayName || item.name}
                        description={
                          item.description ||
                          "Luyện tập các dạng câu hỏi để cải thiện kỹ năng này."
                        }
                        icon={skillIcons[item.name as Skill] || BookOpen}
                        examCount={item.examCount || 0}
                        questionCount={item.questionCount || 0}
                        onClick={() =>
                          navigate(`/exams?grade=${selectedLevel}&skill=${item.name}`)
                        }
                      />

                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Dialog yêu cầu đăng nhập */}
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Practice;
