import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/data/AuthContext";
import { Brain, Sparkles, Activity } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Course {
  _id: string;
  title: string;
  description: string;
  topic: string;
  level: string;
}

interface RecommendationResponse {
  weakestSkill: string;
  stats: Record<string, number>; // 0–1
  suggestedCourses: Course[];
}

const skillLabels: Record<string, string> = {
  listening: "Nghe",
  speaking: "Nói",
  reading: "Đọc hiểu",
  writing: "Viết",
};


export default function AdaptiveLearning() {
  const { user } = useAuth();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // Map từ skill gợi ý sang tab trên Dashboard
  // Map skill từ BE sang tab trên Dashboard
  const mapSkillToDashboardTab = (skill: string): string => {
    // normalize vài case sai chính tả
    const normalized = skill.toLowerCase();
    if (normalized === "writting") return "writing";

    if (
      normalized === "listening" ||
      normalized === "speaking" ||
      normalized === "reading" ||
      normalized === "writing"
    ) {
      return normalized;
    }

    // nếu lỡ BE trả linh tinh thì cho về all
    return "all";
  };

  const goToSkillPractice = (skill: string) => {
    const tab = mapSkillToDashboardTab(skill);
    navigate(`/dashboard?skill=${tab}`);
  };


  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          "/api/recommendation",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setData(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải dữ liệu gợi ý");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">
            Đang phân tích dữ liệu học tập của bạn...
          </p>
        </div>
      </div>
    );
  }

  // ========== NO DATA ==========
  if (!data || !data.weakestSkill) {
    return (
      <div className="min-h-[420px] flex items-center justify-center bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50 animate-fade-in">
        <Card className="max-w-xl w-full shadow-lg border-dashed border-slate-200 bg-white/90 backdrop-blur transition-all duration-300 hover:shadow-xl">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-3">
            <Brain className="w-10 h-10 text-slate-400 mb-1" />
            <h2 className="text-lg font-semibold text-slate-800">
              Chưa đủ dữ liệu để gợi ý
            </h2>
            <p className="text-sm text-slate-500 max-w-sm">
              Hãy làm một vài bài kiểm tra trước. Hệ thống sẽ phân tích kết quả
              và gợi ý lộ trình luyện tập phù hợp cho bạn.
            </p>
            <Button
              className="mt-2"
              onClick={() => {
                toast.info("Hãy vào mục Luyện tập để làm bài nhé!");
              }}
            >
              Bắt đầu làm bài
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weakestLabel = skillLabels[data.weakestSkill] || data.weakestSkill;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-8 animate-fade-in">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-500 text-white shadow-md">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Luyện tập thông minh
              </h1>
              <p className="text-sm text-slate-500">
                Hệ thống phân tích kết quả của bạn và gợi ý nơi cần tập trung.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 animate-slide-in">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Chế độ gợi ý tự động đang hoạt động</span>
          </div>
        </div>

        {/* GRID: WEAK SKILL + STATS + RECOMMENDATIONS */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* LEFT: Weakest Skill + Stats */}
          <div className="space-y-6">
            {/* Weakest skill card */}
            <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white overflow-hidden animate-slide-in">
              <CardHeader className="relative pb-2">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <CardTitle className="text-lg font-semibold">
                    Kỹ năng cần cải thiện nhất
                  </CardTitle>
                </div>
                <p className="relative z-10 text-sm text-sky-100/90">
                  Dựa trên các bài kiểm tra gần đây của bạn.
                </p>
              </CardHeader>
              <CardContent className="relative z-10 pb-6 pt-1 space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 text-xs uppercase tracking-wide">
                    Ưu tiên luyện tập
                  </span>
                  <span className="text-xl font-semibold">
                    {weakestLabel}
                  </span>
                </div>
                <p className="text-sm text-sky-100/90">
                  Hãy ưu tiên làm thêm các bài tập {weakestLabel.toLowerCase()}.
                  Các bài gợi ý bên dưới đã được chọn phù hợp cho bạn.
                </p>

                <div className="pt-2">
                  <Button
                    size="sm"
                    className="bg-white/90 text-sky-700 hover:bg-white"
                    onClick={() => goToSkillPractice(data.weakestSkill)}   // 👈 DÙNG SKILL GỢI Ý
                  >
                    Làm bài theo kỹ năng này
                  </Button>
                </div>
              </CardContent>


            </Card>

            {/* Stats card */}
            <Card className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur shadow-md animate-slide-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg text-slate-900">
                  Mức độ thành thạo từng kỹ năng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(data.stats).map(([skill, value], index) => {
                  const label = skillLabels[skill] || skill;
                  const percent = Math.round(value * 100);

                  return (
                    <div
                      key={skill}
                      className="space-y-1.5 animate-slide-in"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">{label}</span>
                        <span className="font-medium text-slate-900">
                          {percent}%
                        </span>
                      </div>
                      <Progress
                        value={percent}
                        className="h-2 rounded-full bg-slate-100"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Suggested courses */}
          <div className="space-y-4 animate-slide-in">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                Gợi ý bài luyện tập
              </h2>
              <span className="text-xs text-slate-500">
                {data.suggestedCourses.length} bài phù hợp
              </span>
            </div>

            {data.suggestedCourses.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-slate-200 bg-white/80">
                <CardContent className="p-6 text-sm text-slate-500">
                  Hiện chưa có bài luyện tập gợi ý. Hãy làm thêm bài kiểm tra để
                  hệ thống hiểu rõ hơn về bạn.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {data.suggestedCourses.map((course, index) => (
                  <Card
                    key={course._id}
                    className="rounded-2xl border-slate-200 bg-white/95 hover:shadow-lg hover:-translate-y-[2px] transition-all duration-200 animate-slide-in"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="space-y-1">
                        <h3 className="text-base md:text-lg font-semibold text-slate-900">
                          {course.title}
                        </h3>
                        <p className="text-xs uppercase tracking-wide text-sky-500">
                          Chủ đề:{" "}
                          <span className="font-medium capitalize">
                            {course.topic || weakestLabel}
                          </span>
                        </p>
                        <p className="text-sm text-slate-500">
                          {course.description ||
                            "Bài luyện tập được thiết kế để cải thiện kỹ năng này."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-500">
                          Mức độ:{" "}
                          <span className="font-medium capitalize">
                            {course.level}
                          </span>
                        </span>
                        <Button
                          size="sm"
                          className="rounded-xl px-4"
                          onClick={() => {
                            // nếu sau này có course.skill thì ưu tiên nó:
                            // const skill = (course as any).skill || data.weakestSkill;
                            const skill = data.weakestSkill;
                            goToSkillPractice(skill);
                          }}
                        >
                          Làm ngay
                        </Button>

                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
