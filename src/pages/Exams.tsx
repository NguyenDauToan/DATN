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

  // Lấy query params từ URL
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
          skill: skill || undefined, // nếu đã chọn skill từ Index thì gửi luôn
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
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-6 md:p-8 space-y-8 animate-fade-in">
        {/* Nút quay lại */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/practice")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>

          {/* Tiêu đề + bộ lọc */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Danh sách bài thi
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                {level && (
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    Cấp độ {level}
                  </span>
                )}
                {skill && (
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                    {skillLabels[skill]}
                  </span>
                )}
                {grade && (
                  <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
                    Lớp {grade}
                  </span>
                )}
                <span className="text-sm">• {exams.length} bài thi</span>
              </div>
            </div>

            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Bộ lọc
            </Button>
          </div>
        </div>

        {/* Hiển thị danh sách bài thi */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Đang tải dữ liệu...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Không tìm thấy bài thi nào
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {exams.map((exam, index) => (
              <div
                key={exam._id || index}
                className="animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ExamCard
                  exam={{
                    _id: exam._id,
                    title: exam.title || "Bài thi không có tiêu đề",
                    description: exam.description || "Không có mô tả",
                    skill: exam.skill,
                    level: exam.level,
                    grade: exam.grade,
                    duration: exam.duration,
                    difficulty: exam.difficulty,
                    questionsCount: exam.questionsCount || exam.questions?.length || 0, // ✅ Số câu hỏi
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
  );
};

export default Exams;
