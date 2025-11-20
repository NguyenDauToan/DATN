import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Award, Clock, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Result {
  _id: string;
  test: {
    title?: string;
    duration?: number;
  } | null;
  mockExam: {
    name?: string;
    officialName?: string;
    examType?: string; // ví dụ: "thpt_qg", "ielts"...
    grade?: string;
    year?: number;
    duration?: number;
  } | null;
  score: number; // thang 10
  timeSpent: number; // seconds
  finishedAt: string;
  details: {
    skill: string;
    score: number;
    total: number;
    accuracy: number;
  }[];
}

const Results = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/results/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy kết quả:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50">
        <div className="text-center space-y-2 animate-fade-in">
          <div className="w-12 h-12 border-4 border-sky-300 border-t-sky-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 text-sm">Đang tải kết quả học tập...</p>
        </div>
      </div>
    );

  const totalTests = results.length;

  if (!totalTests) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-0 shadow-xl rounded-3xl bg-white/90 backdrop-blur animate-fade-in">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold text-slate-900">
              Chưa có kết quả nào
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3 pb-6">
            <p className="text-sm text-slate-500">
              Hãy bắt đầu làm một bài kiểm tra để xem điểm số và tiến độ học tập
              của bạn tại đây.
            </p>
            <p className="text-xs text-slate-400">
              Sau khi hoàn thành bài thi, hệ thống sẽ lưu lại điểm và thống kê
              chi tiết cho bạn.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const totalTimeSeconds = results.reduce((sum, r) => sum + r.timeSpent, 0);
  const avgScore = totalScore / totalTests;

  const totalHours = Math.floor(totalTimeSeconds / 3600);
  const totalMinutes = Math.floor((totalTimeSeconds % 3600) / 60);

  const firstScore = results[results.length - 1]?.score ?? avgScore;
  const lastScore = results[0]?.score ?? avgScore;
  const improvement =
    firstScore > 0 ? ((lastScore - firstScore) / firstScore) * 100 : 0;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getExamTitle = (r: Result) => {
    return (
      r.test?.title ||
      r.mockExam?.officialName ||
      r.mockExam?.name ||
      "Không có tên bài test"
    );
  };

  const getExamBadge = (r: Result) => {
    if (r.mockExam) {
      const year = r.mockExam.year ? ` ${r.mockExam.year}` : "";
      // tuỳ bạn: check examType === "thpt_qg" thì ghi rõ
      return `Đề THPT QG${year}`;
    }
    return "Đề luyện tập";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50">
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Kết quả học tập
            </h1>
            <p className="text-sm text-slate-500">
              Theo dõi tiến độ, điểm số và thời gian luyện tập của bạn
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/80 border border-sky-100 px-4 py-2 shadow-sm animate-slide-in">
            <div className="h-8 w-8 rounded-full bg-sky-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-sky-600" />
            </div>
            <div className="text-xs leading-tight">
              <p className="font-semibold text-slate-800">Điểm trung bình</p>
              <p className="text-sky-600">
                {avgScore.toFixed(2)}/10 • {totalTests} bài
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className="border-0 shadow-md bg-gradient-to-br from-sky-50 to-sky-100 animate-slide-in"
            style={{ animationDelay: "40ms" }}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white shadow-sm">
                <Award className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Điểm trung bình
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {avgScore.toFixed(2)}/10
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100 animate-slide-in"
            style={{ animationDelay: "80ms" }}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white shadow-sm">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Bài đã hoàn thành
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalTests}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-indigo-100 animate-slide-in"
            style={{ animationDelay: "120ms" }}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white shadow-sm">
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Thời gian học
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalHours}h {totalMinutes}m
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100 animate-slide-in"
            style={{ animationDelay: "160ms" }}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white shadow-sm">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Mức cải thiện
                </p>
                <p
                  className={`text-2xl font-bold ${
                    improvement >= 0 ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {improvement >= 0 ? "+" : ""}
                  {improvement.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Results: gồm cả đề luyện + THPT QG (mockExam) */}
        <Card className="border border-slate-200/70 shadow-md bg-white/90 backdrop-blur animate-slide-in">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base md:text-lg font-semibold text-slate-900">
                Kết quả gần đây
              </CardTitle>
         
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {results.map((result, index) => {
              const safeScore = Math.min(result.score, 10);
              const percent = (safeScore / 10) * 100;
              const durationMinutes = Math.round(result.timeSpent / 60);

              const topSkills = (result.details || [])
                .slice(0, 2)
                .map((d) => d.skill)
                .filter(Boolean);

              const isGood = safeScore >= 7;
              const examTitle = getExamTitle(result);
              const examTypeLabel = getExamBadge(result);

              return (
                <div
                  key={result._id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:shadow-sm transition-all animate-slide-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">
                          {examTitle}
                        </h3>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            result.mockExam
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}
                        >
                          {examTypeLabel}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(result.finishedAt)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>Thời gian làm: {durationMinutes} phút</span>

                        {result.mockExam?.grade && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>Lớp: {result.mockExam.grade}</span>
                          </>
                        )}

                        {topSkills.length > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>Kỹ năng: {topSkills.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-sky-600">
                        {safeScore.toFixed(2)}/10
                      </p>
                      <span
                        className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          isGood
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}
                      >
                        {isGood ? "Đạt" : "Cần cố gắng thêm"}
                      </span>
                    </div>
                  </div>
                  <Progress value={Math.min(percent, 100)} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
