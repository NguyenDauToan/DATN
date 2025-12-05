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
        console.error("Lỗi khi tải danh sách bài thi:", err);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [level, skill, grade, navigate]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:py-10">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full border-slate-200 bg-white hover:bg-slate-100"
              onClick={() => navigate("/practice")}
            >
              <ArrowLeft className="h-4 w-4 text-slate-700" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                Danh sách bài thi
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Lọc các bài thi theo kỹ năng, cấp độ và khối lớp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
              onClick={() => {
                // sau này có panel filter thì mở ở đây
              }}
            >
              <Filter className="h-4 w-4" />
              Bộ lọc
            </Button>
          </div>
        </header>

        {/* Summary pills */}
        <section className="flex flex-wrap items-center gap-2 md:gap-3">
          {level && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 md:text-sm">
              Cấp độ {level}
            </span>
          )}
          {skill && (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 md:text-sm">
              {skillLabels[skill]}
            </span>
          )}
          {grade && (
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 md:text-sm">
              Lớp {grade}
            </span>
          )}
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 md:text-sm">
            {exams.length} bài thi
          </span>
        </section>

        {/* Content */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
              <p className="text-sm text-slate-700 md:text-base">
                Đang tải danh sách bài thi...
              </p>
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                <span className="text-xl text-slate-500">📄</span>
              </div>
              <div>
                <p className="text-base font-medium text-slate-900 md:text-lg">
                  Chưa có bài thi phù hợp
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Thử thay đổi bộ lọc hoặc quay lại màn hình luyện tập.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
                onClick={() => navigate("/practice")}
              >
                Quay lại luyện tập
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
              {exams.map((exam, index) => (
                <div
                  key={exam._id || index}
                  className="transition-transform duration-150 hover:-translate-y-[2px]"
                >
                  <ExamCard
                    exam={{
                      _id: exam._id,
                      title: exam.title || "Bài thi không có tiêu đề",
                      description:
                        exam.description || "Bài thi do hệ thống tạo.",
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
        </section>
      </div>
    </main>
  );
};

export default Exams;
