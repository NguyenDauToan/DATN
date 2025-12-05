import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LevelCard } from "@/components/LevelCard";
import { SkillCard } from "@/components/SkillCard";
import {
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  ArrowLeft,
  ShieldAlert,
  School as SchoolIcon,
  Users,
} from "lucide-react";
import { Grade, Skill } from "@/types/exam";
import { Button } from "@/components/ui/button";
import AuthDialog from "./user/LoginPage";
import { skillsAPI, resultAPI, testAPI, authAPI } from "@/api/Api";

const skillIcons: Record<string, any> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
};

type ExamStatsByGrade = {
  grade: string;
  examCount: number;
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
  const [selectedLevel, setSelectedLevel] = useState<Grade | "thptqg" | null>(
    null
  );
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [errorSkills, setErrorSkills] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [examCountByLevel, setExamCountByLevel] = useState<
    Record<string, number>
  >({});
  const [examCountByLevelSkill, setExamCountByLevelSkill] = useState<
    Record<string, number>
  >({});
  const [progressData, setProgressData] = useState<Record<string, number>>({});

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [mustUpdateProfile, setMustUpdateProfile] = useState(false);

  const params = new URLSearchParams(location.search);
  const preselectedSkill = params.get("skill");

  const token = localStorage.getItem("token");

  const isStudent = currentUser?.role === "student";
  const gradeLabel = currentUser?.grade ? `Lớp ${currentUser.grade}` : null;
  const classroomName = currentUser?.classroom?.name || "";
  const schoolName = currentUser?.school?.name || "";

  // ===== 0. Lấy thông tin user =====
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setAuthOpen(true);
        return;
      }
      try {
        const res = await authAPI.getCurrentUser();
        const user = res.data.user;
        setCurrentUser(user || null);

        if (user && user.isActive === false) {
          setBlocked(true);
        }

        if (user && user.role === "student") {
          const needProfileUpdate =
            !user.school || !user.classroom || !user.grade;
          setMustUpdateProfile(needProfileUpdate);
        }
      } catch (err) {
        console.error("❌ Lỗi khi lấy thông tin người dùng:", err);
      }
    };
    fetchUser();
  }, [token]);

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

  // ===== 2. Fetch progress =====
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

  // ===== 3. Thống kê đề theo cấp độ + skill =====
  useEffect(() => {
    const fetchExamStats = async () => {
      if (!token) return;

      try {
        const res = await testAPI.getAll();
        const raw = res.data;
        const exams: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.exams)
          ? raw.exams
          : [];

        const byLevel: Record<string, number> = {};
        const byLevelSkill: Record<string, number> = {};

        exams.forEach((ex) => {
          const g = ex.grade;
          const s = ex.skill;
          if (!g) return;

          byLevel[g] = (byLevel[g] || 0) + 1;

          if (s) {
            const key = `${g}_${s}`;
            byLevelSkill[key] = (byLevelSkill[key] || 0) + 1;
          }
        });

        setExamCountByLevel(byLevel);
        setExamCountByLevelSkill(byLevelSkill);
      } catch (err) {
        console.error(
          "❌ Lỗi khi lấy thống kê bài thi theo cấp độ + skill:",
          err
        );
      }
    };

    fetchExamStats();
  }, [token]);

  // ===== 4. Handlers =====
  const handleLevelSelect = (level: Grade | "thptqg") => {
    if (!token) return setAuthOpen(true);
    setSelectedLevel(level);
    if (preselectedSkill) {
      navigate(`/exams?grade=${level}&skill=${preselectedSkill}`);
    }
  };

  const handleBack = () => setSelectedLevel(null);

  // ===== Guard: tài khoản bị khóa =====
  if (blocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <div className="flex items-center gap-3 mb-3">
            <ShieldAlert className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Tài khoản đã bị khóa</h2>
          </div>
          <p className="text-sm mb-3">
            Vui lòng liên hệ quản trị viên để được hỗ trợ mở khóa tài khoản.
          </p>
        </div>
      </div>
    );
  }

  // ===== Guard: học sinh chưa có trường / lớp / khối =====
  if (isStudent && mustUpdateProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-lg w-full mx-4 rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
          <div className="flex items-center gap-3 mb-3">
            <ShieldAlert className="h-6 w-6" />
            <h2 className="text-lg font-semibold">
              Cập nhật thông tin lớp, khối và trường
            </h2>
          </div>
          <p className="text-sm mb-2">
            Hệ thống chỉ hiển thị đề thi đúng với lớp/khối trong trường của
            bạn. Hãy cập nhật thông tin trong mục Hồ sơ trước khi luyện tập.
          </p>
          <p className="text-xs text-amber-800 mb-4">
            Sau khi cập nhật xong, quay lại trang Luyện tập để tiếp tục.
          </p>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => navigate("/profile")}
          >
            Đi tới Hồ sơ cá nhân
          </Button>
        </div>
      </div>
    );
  }

  // ===== UI chính =====
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            {isStudent ? "Luyện tập theo lớp" : "Chọn cấp độ luyện tập"}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            {isStudent
              ? "Các đề thi đã được lọc theo đúng trường, khối và lớp của bạn. Chọn kỹ năng muốn luyện tập."
              : "Hãy chọn lớp hoặc kỳ thi để hệ thống gợi ý các bài luyện tập phù hợp."}
          </p>

          {isStudent && (
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-800">
                <SchoolIcon className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {schoolName || "Chưa cập nhật trường"}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-800">
                <Users className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {gradeLabel || "Chưa cập nhật khối"}
                  {classroomName ? ` • ${classroomName}` : ""}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* === CASE 1: Học sinh – chỉ chọn kỹ năng === */}
        {isStudent ? (
          <section className="mt-2">
            {loadingSkills ? (
              <p className="text-sm text-slate-500">
                Đang tải danh sách kỹ năng...
              </p>
            ) : errorSkills ? (
              <p className="text-sm text-red-500">{errorSkills}</p>
            ) : skills.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có kỹ năng nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {skills.map((item, index) => {
                  const gradeKey = currentUser?.grade
                    ? String(currentUser.grade)
                    : "";
                  const examCountForSkill =
                    gradeKey && item.name
                      ? examCountByLevelSkill[`${gradeKey}_${item.name}`] || 0
                      : item.examCount || 0;

                  return (
                    <div key={item.name ?? index}>
                      <SkillCard
                        skill={item.name as Skill}
                        title={item.displayName || item.name}
                        description={
                          item.description ||
                          `Số đề phù hợp với lớp hiện tại: ${examCountForSkill}`
                        }
                        icon={skillIcons[item.name as Skill] || BookOpen}
                        examCount={examCountForSkill}
                        questionCount={item.questionCount || 0}
                        onClick={() =>
                          navigate(
                            `/exams?grade=${currentUser?.grade}&skill=${item.name}`
                          )
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {loadingProgress && (
              <p className="mt-3 text-xs text-slate-400">
                Đang tổng hợp tiến độ theo từng lớp...
              </p>
            )}
          </section>
        ) : (
          // === CASE 2: role khác – flow 2 bước ===
          <>
            {/* Bước 1: chọn cấp độ */}
            {!selectedLevel ? (
              <section className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {levels.map((item, index) => {
                    const examCount = preselectedSkill
                      ? examCountByLevelSkill[
                          `${item.level}_${preselectedSkill}`
                        ] || 0
                      : examCountByLevel[item.level] || 0;

                    return (
                      <div key={item.level}>
                        <LevelCard
                          level={item.level}
                          description={item.description}
                          progress={
                            loadingProgress
                              ? 0
                              : progressData[item.level] || 0
                          }
                          examCount={examCount}
                          onClick={() => handleLevelSelect(item.level)}
                        />
                      </div>
                    );
                  })}
                </div>
                {loadingProgress && (
                  <p className="mt-2 text-xs text-slate-400">
                    Đang tổng hợp tiến độ theo từng lớp...
                  </p>
                )}
              </section>
            ) : !preselectedSkill ? (
              // Bước 2: chọn kỹ năng
              <>
                <div className="flex items-center gap-3 mt-1">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="px-0 h-8 text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Quay lại chọn cấp độ
                  </Button>
                </div>

                <section className="space-y-3 mt-4">
                  <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                      Chọn kỹ năng luyện tập
                    </h2>
                    <p className="text-sm text-slate-600">
                      {selectedLevel === "thptqg"
                        ? "Luyện theo từng kỹ năng cho kỳ thi THPT Quốc Gia."
                        : `Các kỹ năng tiếng Anh dành cho học sinh lớp ${selectedLevel}.`}
                    </p>
                  </div>

                  {loadingSkills ? (
                    <p className="text-sm text-slate-500">
                      Đang tải danh sách kỹ năng...
                    </p>
                  ) : errorSkills ? (
                    <p className="text-sm text-red-500">{errorSkills}</p>
                  ) : skills.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Chưa có kỹ năng nào.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      {skills.map((item, index) => (
                        <div key={item.name ?? index}>
                          <SkillCard
                            skill={item.name as Skill}
                            title={item.displayName || item.name}
                            description={
                              item.description ||
                              "Luyện tập các dạng câu hỏi phổ biến cho kỹ năng này."
                            }
                            icon={skillIcons[item.name as Skill] || BookOpen}
                            examCount={item.examCount || 0}
                            questionCount={item.questionCount || 0}
                            onClick={() =>
                              navigate(
                                `/exams?grade=${selectedLevel}&skill=${item.name}`
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </>
        )}
      </div>

      {/* Dialog yêu cầu đăng nhập */}
    </div>
  );
};

export default Practice;
