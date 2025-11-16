import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ExamCard } from "@/components/ExamCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";
import { Level, Skill, Exam } from "@/types/exam";
import { testAPI } from "@/api/Api";

// mapping skill label cho hiển thị
const skillLabels: Record<Skill, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

const Exams = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const level = searchParams.get("level") as Level | null;
  const skill = searchParams.get("skill") as Skill | null;
  const grade = searchParams.get("grade") || null;

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("⚠️ Người dùng chưa đăng nhập");
          navigate("/login");
          return;
        }

        const res = await testAPI.getAll({
          skill: skill || undefined,
          grade: grade || undefined,
          level: level || undefined,
        });

        const data: Exam[] = Array.isArray(res.data)
          ? res.data
          : res.data.exams || res.data.data || [];

        setExams(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách bài thi:", err);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [level, skill, grade, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full border-slate-200 bg-white/70 hover:bg-slate-50 shadow-sm"
              onClick={() => navigate("/practice")}
            >
              <ArrowLeft className="h-4 w-4 text-slate-700" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Danh sách bài thi
              </h1>
              <p className="text-sm md:text-base text-slate-500">
                Chọn bài thi phù hợp với kỹ năng và cấp độ của bạn
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="gap-2 rounded-full border-slate-200 bg-white/80 hover:bg-slate-50 text-slate-800 shadow-sm"
          >
            <Filter className="h-4 w-4" />
            Bộ lọc
          </Button>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {level && (
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs md:text-sm font-medium border border-emerald-200">
              Cấp độ {level}
            </span>
          )}
          {skill && (
            <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs md:text-sm font-medium border border-sky-200">
              {skillLabels[skill]}
            </span>
          )}
          {grade && (
            <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs md:text-sm font-medium border border-violet-200">
              Lớp {grade}
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-white text-slate-600 text-xs md:text-sm border border-slate-200 shadow-sm">
            {exams.length} bài thi tìm thấy
          </span>
        </div>

        {/* Content container */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-xl p-4 md:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="h-10 w-10 rounded-full border-2 border-slate-200 border-t-sky-400 animate-spin" />
              <p className="text-slate-700 text-sm md:text-base">
                Đang tải danh sách bài thi...
              </p>
              <p className="text-slate-400 text-xs">
                Vui lòng chờ trong giây lát
              </p>
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center">
                <span className="text-3xl">📭</span>
              </div>
              <div>
                <p className="text-slate-900 font-medium text-base md:text-lg">
                  Không tìm thấy bài thi nào
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Hãy thử thay đổi bộ lọc hoặc chọn kỹ năng/cấp độ khác.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-2 border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                onClick={() => navigate("/practice")}
              >
                Quay lại chọn bài luyện tập
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {exams.map((exam, index) => (
                <div
                  key={exam._id || index}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <ExamCard
                    exam={{
                      _id: exam._id,
                      title: exam.title || "Bài thi không có tiêu đề",
                      description:
                        exam.description || "Bài thi được hệ thống tạo tự động.",
                      skill: exam.skill,
                      level: exam.level,
                      grade: exam.grade,
                      duration: exam.duration,
                      difficulty: exam.difficulty,
                      questionsCount:
                        exam.questionsCount || exam.questions?.length || 0,
                      questions: exam.questions || [],
                    }}
                    onStart={() => navigate(`/exams/${exam._id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Exams;
