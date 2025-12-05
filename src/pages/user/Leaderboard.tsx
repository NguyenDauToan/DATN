// src/pages/Leaderboard.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@/data/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Timer, Users, Activity } from "lucide-react";

type LeaderboardType = "score" | "attempts" | "speed";
type ScopeType = "system" | "school" | "class";

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

const scopeLabels: Record<ScopeType, string> = {
  system: "Toàn hệ thống",
  school: "Theo trường",
  class: "Theo lớp",
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Leaderboard = () => {
  const { user } = useAuth();
  const role = (user as any)?.role as
    | "student"
    | "teacher"
    | "admin"
    | "school_manager"
    | undefined;

  const [type, setType] = useState<LeaderboardType>("score");
  const [scope, setScope] = useState<ScopeType>("system");
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // lấy schoolId / classroomId từ user (có thể là id hoặc object)
  const schoolId = useMemo(() => {
    if (!user) return undefined;
    const s: any = (user as any).school;
    return typeof s === "string" ? s : s?._id;
  }, [user]);

  const classroomId = useMemo(() => {
    if (!user) return undefined;
    const c: any = (user as any).classroom;
    return typeof c === "string" ? c : c?._id;
  }, [user]);

  // Các scope được phép theo role + dữ liệu có sẵn
  const availableScopes: ScopeType[] = useMemo(() => {
    if (!role) return ["system"];

    if (role === "admin") {
      // backend cho admin xem toàn hệ thống / theo trường / theo lớp
      return ["system", "school", "class"];
    }

    if (role === "teacher" || role === "school_manager") {
      // backend luôn khóa trong trường mình:
      // - không có "toàn hệ thống" thực sự, nên dùng "system" để biểu diễn "Trường của tôi"
      // - nếu có lớp thì thêm scope "class"
      return classroomId ? ["system", "class"] as ScopeType[] : ["system"];
    }

    if (role === "student") {
      // sinh viên đúng theo mô tả backend
      return classroomId
        ? (["system", "school", "class"] as ScopeType[])
        : (["system", "school"] as ScopeType[]);
    }

    return ["system"];
  }, [role, classroomId]);

  // Nếu scope hiện tại không còn hợp lệ (do thay role / classroom), tự động chuyển
  useEffect(() => {
    if (!availableScopes.includes(scope)) {
      setScope(availableScopes[0]);
    }
  }, [availableScopes, scope]);

  // helper label scope theo role + backend
  const getScopeLabel = (s: ScopeType): string => {
    if (s === "system") {
      if (role === "admin") return "Toàn hệ thống";
      if (role === "teacher" || role === "school_manager") return "Trường của tôi";
      // student hoặc chưa đăng nhập
      return "Toàn hệ thống";
    }
    if (s === "school") {
      if (role === "student") return "Trường của bạn";
      if (role === "admin") return "Theo trường";
    }
    if (s === "class") {
      if (role === "teacher" || role === "school_manager") return "Theo lớp trong trường";
      if (role === "student") return "Lớp của bạn";
    }
    return scopeLabels[s];
  };

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, scope, schoolId, classroomId, role]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("Không có token → không gọi leaderboard");
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      const params: any = {
        type,
        limit: 20,
      };

      // mapping scope → query params đúng như comment trong backend
      if (scope === "school" && schoolId) {
        params.schoolId = schoolId;
      }
      if (scope === "class" && classroomId) {
        params.classroomId = classroomId;
      }
      // scope = system → không gửi schoolId / classroomId

      const res = await axios.get(`${API_BASE_URL}/api/leaderboard`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLeaderboard(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải leaderboard:", err);
      setLeaderboard([]);
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
      ? leaderboard.reduce((s, i) => s + (i.attempts ?? 0), 0) /
        totalStudents
      : undefined;

  const subtitleScope = getScopeLabel(scope);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-10 space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-amber-500/90 text-white">
                <Trophy className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Bảng xếp hạng
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Thống kê thứ hạng học sinh theo{" "}
              {typeLabels[type].toLowerCase()} ·{" "}
              {subtitleScope.toLowerCase()}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Xếp hạng được cập nhật theo kết quả làm bài</span>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Type pills */}
          <div className="inline-flex rounded-full bg-white border border-slate-200 p-1">
            {(["score", "attempts", "speed"] as LeaderboardType[]).map((t) => {
              const isActive = type === t;
              return (
                <Button
                  key={t}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-full px-4 text-xs md:text-sm ${
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

          {/* Scope pills */}
          <div className="inline-flex rounded-full bg-white border border-slate-200 p-1">
            {availableScopes.map((s) => {
              const isActive = scope === s;
              return (
                <Button
                  key={s}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-full px-3 text-xs md:text-sm ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  onClick={() => setScope(s)}
                >
                  {getScopeLabel(s)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
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

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
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

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-500">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Phạm vi xếp hạng</p>
                <p className="text-lg font-semibold text-slate-900">
                  {getScopeLabel(scope)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABLE */}
        <Card className="rounded-3xl border-slate-200 bg-white shadow-md">
          <CardHeader className="pb-3">
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
                Chưa có dữ liệu bảng xếp hạng cho phạm vi này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
                              ? "bg-amber-50/50"
                              : index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50/60"
                          }`}
                        >
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-slate-800">
                                {rank}
                              </span>
                              {rank <= 3 && (
                                <Trophy
                                  className={`w-4 h-4 ${
                                    rank === 1
                                      ? "text-amber-500"
                                      : rank === 2
                                      ? "text-slate-400"
                                      : "text-amber-300"
                                  }`}
                                />
                              )}
                            </div>
                          </td>

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

                          <td className="px-4 py-3 align-middle">
                            <span className="font-medium text-slate-900">
                              {(item.totalScore ?? 0).toFixed(1)}
                            </span>
                          </td>

                          <td className="px-4 py-3 align-middle">
                            <span className="text-slate-700">
                              {item.attempts ?? 0}
                            </span>
                          </td>

                          <td className="px-4 py-3 align-middle">
                            {item.averageTime != null ? (
                              <div className="inline-flex items-center gap-1 text-slate-700">
                                <Timer className="w-4 h-4 text-slate-400" />
                                <span>{item.averageTime.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
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
