// src/pages/Leaderboard.tsx
import { useEffect, useState } from "react";
import { resultAPI } from "@/api/Api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Timer, Users, Activity } from "lucide-react";

type LeaderboardType = "score" | "attempts" | "speed";

interface LeaderboardUser {
  _id: string;
  name: string;
  avatar?: string;
}

interface LeaderboardItem {
  user: LeaderboardUser;
  totalScore?: number;
  attempts?: number;
  averageTime?: number; // phút
}

const typeLabels: Record<LeaderboardType, string> = {
  score: "Tổng điểm",
  attempts: "Số lần thi",
  speed: "Tốc độ làm bài",
};

const Leaderboard = () => {
  const [type, setType] = useState<LeaderboardType>("score");
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await resultAPI.getLeaderboard(type);
      setLeaderboard(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = leaderboard.length;
  const bestScore =
    type === "score"
      ? Math.max(...leaderboard.map((i) => i.totalScore ?? 0), 0)
      : undefined;

  const avgAttempts =
    type === "attempts" && totalStudents
      ? leaderboard.reduce((s, i) => s + (i.attempts ?? 0), 0) / totalStudents
      : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-10 space-y-8 animate-fade-in">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-400 text-white shadow-md">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Bảng xếp hạng học sinh
              </h1>
              <p className="text-sm text-slate-500">
                Xem thứ hạng theo tổng điểm, số lần thi hoặc tốc độ làm bài.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Chế độ xếp hạng đang hoạt động</span>
          </div>
        </div>

        {/* FILTER PILL */}
        <div className="inline-flex rounded-full bg-white/80 border border-slate-200 p-1 shadow-sm">
          {(["score", "attempts", "speed"] as LeaderboardType[]).map((t) => {
            const isActive = type === t;
            return (
              <Button
                key={t}
                type="button"
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`rounded-full px-4 text-xs md:text-sm transition-all ${
                  isActive
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setType(t)}
              >
                {t === "score"
                  ? "Tổng điểm"
                  : t === "attempts"
                  ? "Số lần thi"
                  : "Tốc độ"}
              </Button>
            );
          })}
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <Card className="rounded-2xl border-slate-200 bg-white/90 shadow-sm animate-slide-in">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  Số học sinh trong bảng
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {totalStudents}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white/90 shadow-sm animate-slide-in">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-500">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  {type === "score"
                    ? "Điểm cao nhất"
                    : type === "attempts"
                    ? "Số lần thi trung bình"
                    : "Chỉ số tốc độ"}
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {type === "score" && bestScore !== undefined
                    ? bestScore.toFixed(1)
                    : type === "attempts" && avgAttempts !== undefined
                    ? avgAttempts.toFixed(1)
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white/90 shadow-sm animate-slide-in">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-500">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Chế độ xếp hạng</p>
                <p className="text-lg font-semibold text-slate-900">
                  {typeLabels[type]}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABLE */}
        <Card className="rounded-3xl border-slate-200 bg-white/95 shadow-lg animate-slide-in">
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-lg text-slate-900">
              Top học sinh
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">
                    Đang tải dữ liệu bảng xếp hạng...
                  </p>
                </div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-6 text-sm text-slate-500 text-center">
                Chưa có dữ liệu bảng xếp hạng. Hãy làm bài kiểm tra để bắt đầu
                ghi nhận thành tích.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Học sinh</th>
                      <th className="px-4 py-3 text-left">Tổng điểm</th>
                      <th className="px-4 py-3 text-left">Số lần thi</th>
                      <th className="px-4 py-3 text-left">
                        Thời gian TB (phút)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((item, index) => {
                      const rank = index + 1;
                      const isTop3 = rank <= 3;

                      return (
                        <tr
                          key={item.user._id}
                          className={`border-t border-slate-100 ${
                            isTop3
                              ? "bg-gradient-to-r from-amber-50/80 via-white to-transparent"
                              : index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50/40"
                          }`}
                        >
                          {/* Rank */}
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-slate-800">
                                {rank}
                              </span>
                              {rank === 1 && (
                                <Trophy className="w-4 h-4 text-amber-500" />
                              )}
                              {rank === 2 && (
                                <Trophy className="w-4 h-4 text-slate-400" />
                              )}
                              {rank === 3 && (
                                <Trophy className="w-4 h-4 text-amber-300" />
                              )}
                            </div>
                          </td>

                          {/* User */}
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-2">
                              {item.user.avatar ? (
                                <img
                                  src={item.user.avatar}
                                  alt={item.user.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                                  {item.user.name
                                    ?.split(" ")
                                    .slice(-1)[0]
                                    ?.charAt(0)
                                    .toUpperCase() || "U"}
                                </div>
                              )}
                              <span className="font-medium text-slate-900">
                                {item.user.name}
                              </span>
                            </div>
                          </td>

                          {/* Total Score */}
                          <td className="px-4 py-3 align-middle">
                            <span className="font-medium text-slate-900">
                              {(item.totalScore ?? 0).toFixed(1)}
                            </span>
                          </td>

                          {/* Attempts */}
                          <td className="px-4 py-3 align-middle">
                            <span className="text-slate-700">
                              {item.attempts ?? 0}
                            </span>
                          </td>

                          {/* Average Time */}
                          <td className="px-4 py-3 align-middle">
                            {item.averageTime != null ? (
                              <div className="inline-flex items-center gap-1 text-slate-700">
                                <Timer className="w-4 h-4 text-slate-400" />
                                <span>{item.averageTime.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
