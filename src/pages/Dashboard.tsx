// src/pages/Dashboard.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  skillsAPI,
  dashboardAPI,
  authAPI,
  examProgressAPI,
  mockExamAPI,
} from "@/api/Api";

import {
  BookOpen,
  Clock,
  Trophy,
  Target,
  Headphones,
  Mic,
  PenTool,
  ShieldAlert,
  School as SchoolIcon,
  Users,
  FileText,
  ArrowRight,
  Calendar,
  AlertCircle
} from "lucide-react";

import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { DashboardMe, QuickStats, UpcomingExam } from "@/api/Api";

import {
  InProgressExam,
  InProgressExamCard,
} from "@/components/InProgressExamCard.tsx";
import {
  RecentActivityCard,
  type Activity,
} from "@/components/RecentActivityCard";

// ========================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const skillIcons: Record<string, any> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
};

const explainAxiosError = (err: any) => {
  const status = err?.response?.status;
  const msg =
    err?.response?.data?.message || err?.message || "Không rõ nguyên nhân";
  return { status, msg };
};

// ========================

const Dashboard = () => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [mustUpdateProfile, setMustUpdateProfile] = useState(false);

  const [skills, setSkills] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [inProgressExams, setInProgressExams] = useState<InProgressExam[]>([]);

  // ✅ danh sách đề thi được giao cho học sinh
  const [assignedExams, setAssignedExams] = useState<any[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ========================
  // Kiểm tra tài khoản
  // ========================
  useEffect(() => {
    let cancelled = false;

    const checkUser = async () => {
      try {
        const res = await authAPI.getCurrentUser();
        if (cancelled) return;

        const user = res.data?.user as any;
        setCurrentUser(user || null);

        if (user?.isActive === false) {
          setBlocked(true);
        }

        if (user?.role === "student") {
          const needProfileUpdate =
            user.needUpdateClass ||                 // 👈 dùng cờ từ backend
            !user.school ||                         // hoặc chưa có trường
            !user.classroom ||                      // hoặc chưa có lớp
            !user.grade;                            // hoặc chưa có khối
          setMustUpdateProfile(needProfileUpdate);
        }
      } catch (err) {
        console.error("CHECK USER ERROR:", err);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    };

    checkUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const isStudent = currentUser?.role === "student";

  // ========================
  // Load dữ liệu dashboard (stats, skills, progress, upcoming mock)
  // ========================
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [skillsRes, dashRes, progressRes, upcomingRes] =
        await Promise.allSettled([
          skillsAPI.getAll(),
          dashboardAPI.me(),
          examProgressAPI.me(),
          mockExamAPI.getUpcoming(),
        ]);

      // ------ skills ------
      if (skillsRes.status === "fulfilled") {
        const list = skillsRes.value.data?.skills ?? [];
        setSkills(list);
      } else {
        const info = explainAxiosError(skillsRes.reason);
        console.error("SKILLS ERROR:", info);
        setErrorMessage("Không tải được danh sách kỹ năng.");
      }

      // ------ dashboard (quick stats + recent activities) ------
      if (dashRes.status === "fulfilled") {
        const data = (dashRes.value.data ?? {}) as DashboardMe;
        setQuickStats(data.quickStats ?? null);

        const serverActs = (data as any).recentActivities ?? [];
        const mappedActs: Activity[] = (Array.isArray(serverActs)
          ? serverActs
          : []
        ).map((a: any) => ({
          id: a._id || a.id,
          testTitle: a.examName || a.testTitle || a.title || "Bài thi",
          score:
            typeof a.score === "number"
              ? a.score
              : typeof a.mark === "number"
                ? a.mark
                : 0,
          finishedAt:
            a.finishedAt ||
            a.completedAt ||
            a.submittedAt ||
            a.createdAt ||
            new Date().toISOString(),
          examType: a.examType || a.type,
        }));
        setActivities(mappedActs);
      } else {
        const info = explainAxiosError(dashRes.reason);
        console.error("DASHBOARD ERROR:", info);
        setErrorMessage((prev) =>
          prev ? prev : "Không tải được thống kê tổng quan."
        );
      }

      // ------ in-progress (map sang InProgressExamCard) ------
      if (progressRes.status === "fulfilled") {
        const raw = progressRes.value.data ?? [];

        const mapped: InProgressExam[] = (Array.isArray(raw) ? raw : []).map(
          (p: any) => {
            const isMock =
              typeof p.isMock === "boolean"
                ? p.isMock
                : p.examType === "mock" || p.exam?.examType === "mock";

            return {
              _id: p._id,
              examId: p.examId || p.exam?._id,
              title: p.title || p.exam?.name || "Đề không tên",
              isMock,
              duration: p.duration ?? p.exam?.duration,
              timeLeft:
                p.timeLeft ?? p.remainingSeconds ?? p.remainingTimeSec ?? undefined,
              skill: p.skill || p.exam?.skill,
              updatedAt: p.updatedAt || p.lastSavedAt || p.createdAt,
            };
          }
        );

        setInProgressExams(mapped);
      } else {
        const info = explainAxiosError(progressRes.reason);
        console.error("PROGRESS ERROR:", info);
      }

      // ------ upcoming (đề sắp diễn ra - mock exam) ------
      if (upcomingRes.status === "fulfilled") {
        const exams = upcomingRes.value.data?.exams ?? [];
        const mapped: UpcomingExam[] = exams.map((ex: any) => ({
          id: ex._id,
          title: ex.name,
          duration: ex.duration,
          startTime: ex.startTime,
          skill: ex.skill,
          schoolName: ex.school?.name,
          classroomName: ex.classroom?.name,
          grade: ex.gradeKey || ex.grade,
        }));
        setUpcomingExams(mapped);
      } else {
        const info = explainAxiosError(upcomingRes.reason);
        console.error("UPCOMING ERROR:", info);
      }
    } catch (err) {
      console.error("LOAD DASHBOARD ERROR:", err);
      const info = explainAxiosError(err);
      setErrorMessage(
        `Không tải được dữ liệu. (${info.status ?? "?"}) ${info.msg}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================
  // Load danh sách đề thi cho học sinh (đề giáo viên giao)
  // ========================
  const loadAssignedExams = useCallback(async () => {
    if (!isStudent) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingAssigned(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data) ? res.data : [];
      // backend đã filter theo trường / lớp / khối, status=approved cho student
      setAssignedExams(data);
    } catch (err) {
      console.error("LOAD ASSIGNED EXAMS ERROR:", err);
      const info = explainAxiosError(err);
      toast.error(info.msg || "Không tải được danh sách đề giáo viên giao");
    } finally {
      setLoadingAssigned(false);
    }
  }, [isStudent]);

  useEffect(() => {
    if (authChecked && !blocked && !mustUpdateProfile) {
      loadDashboardData();
      if (isStudent) {
        loadAssignedExams();
      }
    }
  }, [
    authChecked,
    blocked,
    mustUpdateProfile,
    loadDashboardData,
    loadAssignedExams,
    isStudent,
  ]);

  // ========================
  // Helpers
  // ========================

  const getStartTimeLabel = (iso?: string) => {
    if (!iso) return "Chưa thiết lập";
    const start = new Date(iso).getTime();
    const now = Date.now();
    const diff = start - now;

    if (diff <= 0) return "Đang mở";

    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return `Còn ${minutes} phút`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Còn khoảng ${hours} giờ`;
    const days = Math.round(hours / 24);
    return `Còn khoảng ${days} ngày`;
  };

  const handleOpenUpcomingExam = (ex: UpcomingExam) => {
    if (!ex.startTime) {
      navigate(`/mock-exams/${ex.id}`);
      return;
    }

    const now = Date.now();
    const start = new Date(ex.startTime).getTime();

    if (start > now) {
      toast.info(
        `Đề "${ex.title}" sẽ mở lúc ${new Date(ex.startTime).toLocaleString(
          "vi-VN",
          {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          }
        )}.`
      );
      return;
    }

    navigate(`/mock-exams/${ex.id}`);
  };

  const gradeLabel = currentUser?.grade ? `Khối ${currentUser.grade}` : "";
  const classroomName = currentUser?.classroom?.name || "";
  const schoolName = currentUser?.school?.name || "";
  const displayName =
    currentUser?.fullName ||
    currentUser?.name ||
    currentUser?.email ||
    "bạn";
  const currentYearName =
    currentUser?.currentSchoolYear?.name || "Chưa có năm học";
  const hasInProgress = inProgressExams && inProgressExams.length > 0;

  // skillScores cho phần "Kỹ năng mạnh nhất / Cần cải thiện"
  const defaultSkillScores = {
    listening: 0,
    speaking: 0,
    reading: 0,
    writing: 0,
  };

  const quickSkillScores: Record<string, number> =
    (quickStats as any)?.skillScores || {};

  const skillScores = { ...defaultSkillScores };

  // 1) Ưu tiên số liệu BE trả về trong quickStats.skillScores
  (["listening", "speaking", "reading", "writing"] as const).forEach((key) => {
    if (typeof quickSkillScores[key] === "number") {
      (skillScores as any)[key] = Math.round(quickSkillScores[key]);
    }
  });

  // 2) Với kỹ năng nào vẫn = 0 (hoặc BE không trả), fallback sang list "skills"
  if (Array.isArray(skills) && skills.length > 0) {
    skills.forEach((s: any) => {
      const k = s.name as "listening" | "speaking" | "reading" | "writing";
      if (!["listening", "speaking", "reading", "writing"].includes(k)) return;

      const v =
        typeof s.accuracy === "number"
          ? s.accuracy
          : typeof s.averageScore === "number"
            ? s.averageScore
            : 0;

      // chỉ overwrite nếu hiện tại đang 0 và v > 0
      if ((skillScores as any)[k] === 0 && typeof v === "number" && v > 0) {
        (skillScores as any)[k] = Math.round(v);
      }
    });
  }


  const strongestSkillEntry = Object.entries(skillScores).reduce(
    (a, b) => (a[1] >= b[1] ? a : b),
    ["listening", 0]
  );
  const weakestSkillEntry = Object.entries(skillScores).reduce(
    (a, b) => (a[1] <= b[1] ? a : b),
    ["listening", 0]
  );
  // Lọc danh sách đề giáo viên giao theo tab kỹ năng
  const filterAssignedExamsBySkill = (skillFilter: string) => {
    if (skillFilter === "all") return assignedExams;

    return assignedExams.filter((ex: any) => {
      // ưu tiên skill của đề
      if (ex.skill && ex.skill === skillFilter) return true;

      // fallback: nhìn vào skill của từng câu hỏi (nếu có populate)
      if (Array.isArray(ex.questions)) {
        return ex.questions.some((q: any) => q.skill === skillFilter);
      }
      return false;
    });
  };
  const overallScore =
    typeof quickStats?.accuracyPercent === "number"
      ? Math.round(quickStats.accuracyPercent)
      : Math.round(
        (skillScores.listening +
          skillScores.speaking +
          skillScores.reading +
          skillScores.writing) / 4
      ) || 0;
  const skillMeta = {
    listening: {
      icon: Headphones,
      color: "text-blue-600",
      bg: "bg-blue-100",
      name: "Nghe",
      en: "Listening",
    },
    speaking: {
      icon: Mic,
      color: "text-green-600",
      bg: "bg-green-100",
      name: "Nói",
      en: "Speaking",
    },
    reading: {
      icon: BookOpen,
      color: "text-purple-600",
      bg: "bg-purple-100",
      name: "Đọc",
      en: "Reading",
    },
    writing: {
      icon: PenTool,
      color: "text-orange-600",
      bg: "bg-orange-100",
      name: "Viết",
      en: "Writing",
    },
  } as const;

  const strongestSkill =
    skillMeta[strongestSkillEntry[0] as keyof typeof skillMeta];
  const weakestSkill =
    skillMeta[weakestSkillEntry[0] as keyof typeof skillMeta];

  // ========================
  // Các trạng thái đặc biệt
  // ========================

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="border border-slate-200 bg-white px-6 py-4 text-sm text-slate-700">
          Đang kiểm tra tài khoản...
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 border border-red-200 bg-red-50 p-6 text-red-800 rounded-sm">
          <div className="flex items-center gap-3 mb-3">
            <ShieldAlert className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Tài khoản bị khóa</h2>
          </div>
          <p className="text-sm mb-2">
            Vui lòng liên hệ quản trị viên hoặc giáo viên để được hỗ trợ.
          </p>
        </div>
      </div>
    );
  }

  if (mustUpdateProfile && isStudent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-lg w-full mx-4 border border-amber-200 bg-amber-50 p-6 text-amber-900 rounded-sm">
          <div className="flex items-center gap-3 mb-3">
            <ShieldAlert className="h-6 w-6" />
            <h2 className="text-lg font-semibold">
              Cần bổ sung thông tin trường, lớp, khối
            </h2>
          </div>
          <p className="text-sm mb-4">
            Vào mục Hồ sơ để cập nhật trường, lớp và khối. Sau đó quay lại
            trang này.
          </p>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-sm"
            onClick={() => navigate("/profile")}
          >
            Đi tới Hồ sơ
          </Button>
        </div>
      </div>
    );
  }

  // ========================
  // Giao diện chính – layout mới
  // ========================

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Student Info – Card gradient */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-blue-600">
                Xin chào, {displayName}!
              </CardTitle>
              <CardDescription className="mt-2">
                {isStudent ? (
                  <>
                    {schoolName || "Chưa cập nhật trường"}
                    {classroomName ? ` - ${classroomName}` : ""}
                  </>
                ) : (
                  <>Hệ thống luyện thi tiếng Anh 4 kỹ năng</>
                )}
              </CardDescription>
              {isStudent && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
                  <span className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3 py-1 rounded-sm">
                    <SchoolIcon className="h-3.5 w-3.5 text-slate-500" />
                    <span>{schoolName || "Chưa cập nhật trường"}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3 py-1 rounded-sm">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    <span>
                      {gradeLabel || "Khối / lớp"}
                      {classroomName ? ` • ${classroomName}` : ""}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3 py-1 rounded-sm">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>{currentYearName}</span>
                  </span>
                </div>
              )}
            </div>
            {isStudent && (
              <Badge variant="outline" className="text-lg px-4 py-2">
                {gradeLabel || "Khối ?"}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="size-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bài đã làm</p>
                <p className="text-blue-600">
                  {quickStats?.completedExams ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Target className="size-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tỷ lệ đúng</p>
                <p className="text-green-600">
                  {quickStats
                    ? `${quickStats.accuracyPercent.toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Trophy className="size-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Thời gian học</p>
                <p className="text-purple-600">
                  {quickStats
                    ? `${quickStats.studyTimeHours.toFixed(1)} giờ`
                    : "0 giờ"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="size-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đang làm dở</p>
                <p className="text-orange-600">{inProgressExams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill statistics + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bảng kỹ năng */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">
                Thống kê theo kỹ năng
              </CardTitle>
              <CardDescription className="text-xs">
                Điểm trung bình của bạn theo từng kỹ năng
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Ô tổng hợp ở trên cùng */}
              <div className="rounded-2xl bg-slate-50 px-6 py-5 text-center">
                <p className="text-xs text-slate-600 mb-1">
                  Điểm trung bình tổng hợp
                </p>
                <p className="text-3xl font-semibold text-blue-600 mb-3">
                  {overallScore}%
                </p>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-slate-900"
                    style={{
                      width: `${Math.max(0, Math.min(100, overallScore))}%`,
                    }}
                  />
                </div>
              </div>

              {/* 4 card kỹ năng – 2 cột giống ảnh */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["listening", "speaking", "reading", "writing"] as const).map(
                  (k) => {
                    const meta = skillMeta[k];
                    const value = (skillScores as any)[k] ?? 0;
                    const Icon = meta.icon;

                    return (
                      <div
                        key={k}
                        className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_0_0_1px_rgba(148,163,184,0.08)]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.bg}`}
                            >
                              <Icon className={`h-5 w-5 ${meta.color}`} />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-slate-900">
                                {meta.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {meta.en}
                              </p>
                            </div>
                          </div>

                          <span className="text-sm font-semibold text-slate-900">
                            {value}%
                          </span>
                        </div>

                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-slate-900"
                            style={{
                              width: `${Math.max(0, Math.min(100, value))}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Kỹ năng mạnh / yếu */}
        <Card className="h-full flex flex-col border-blue-200 bg-blue-50/50">
          <CardHeader className="shrink-0 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="size-5 text-blue-600" />
                  Đề thi sắp diễn ra
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Các bài kiểm tra được lên lịch
                </p>
              </div>
              {upcomingExams.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {upcomingExams.length} đề
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden pt-0">
            {upcomingExams.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-sm text-slate-500 px-4">
                <p>Hiện chưa có đề nào được hẹn giờ.</p>
              </div>
            ) : (
              <div className="h-full space-y-3 overflow-y-auto pr-1">
                {(() => {
                  const now = new Date();

                  return upcomingExams.map((ex) => {
                    const start = ex.startTime ? new Date(ex.startTime) : null;

                    let daysUntil: number | null = null;
                    let isToday = false;
                    let isPast = false;

                    if (start) {
                      const diff = start.getTime() - now.getTime();
                      daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      isToday = daysUntil === 0;
                      isPast = daysUntil < 0;
                    }

                    const isOpened = !!start && start.getTime() <= Date.now();

                    const skills = Array.isArray((ex as any).skills)
                      ? (ex as any).skills
                      : ex.skill
                        ? [ex.skill]
                        : [];

                    return (
                      <div
                        key={ex.id}
                        className={`p-3 border rounded-lg transition-colors ${isPast
                          ? "bg-gray-100 border-gray-300"
                          : isToday
                            ? "bg-green-50 border-green-300"
                            : "bg-white border-blue-200"
                          }`}
                      >
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h4
                                className={`font-semibold text-sm ${isPast
                                  ? "text-gray-600"
                                  : isToday
                                    ? "text-green-600"
                                    : "text-blue-600"
                                  }`}
                              >
                                {ex.title}
                              </h4>

                              {isToday && (
                                <Badge className="bg-green-600 text-xs">
                                  Hôm nay
                                </Badge>
                              )}

                              {isPast && (
                                <Badge variant="secondary" className="text-xs">
                                  Đã qua
                                </Badge>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-600 mb-1">
                              {ex.schoolName || "Trường của bạn"}
                              {ex.classroomName && ` • Lớp ${ex.classroomName}`}
                              {ex.grade && ` • Khối ${ex.grade}`}
                            </p>

                            <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                              {start && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  {start.toLocaleDateString("vi-VN", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {ex.duration} phút
                              </div>
                              {(ex as any).questionCount != null && (
                                <div className="flex items-center gap-1">
                                  <FileText className="size-3" />
                                  {(ex as any).questionCount} câu
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            onClick={() => handleOpenUpcomingExam(ex)}
                            variant={
                              isToday
                                ? "default"
                                : isPast
                                  ? "outline"
                                  : "secondary"
                            }
                            className="text-xs px-3 h-8 rounded-sm"
                          >
                            {isPast
                              ? "Làm bài"
                              : isToday
                                ? "Bắt đầu ngay"
                                : start && daysUntil !== null
                                  ? `Còn ${daysUntil} ngày`
                                  : isOpened
                                    ? "Vào đề"
                                    : "Chi tiết"}
                          </Button>
                        </div>

                        {skills.length > 0 && (
                          <div className="flex gap-2 mt-2 pt-2 border-t">
                            {skills.map((skill: string) => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="text-[11px] flex items-center gap-1"
                              >
                                {skill === "listening" && "🎧 Nghe"}
                                {skill === "speaking" && "🎤 Nói"}
                                {skill === "reading" && "📖 Đọc"}
                                {skill === "writing" && "✍️ Viết"}
                                {!["listening", "speaking", "reading", "writing"].includes(
                                  skill
                                ) && skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {!isToday &&
                          !isPast &&
                          daysUntil !== null &&
                          daysUntil <= 3 && (
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-orange-600">
                              <AlertCircle className="size-3" />
                              Sắp đến hạn! Hãy chuẩn bị ôn tập.
                            </div>
                          )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tests by skills – Tabs điều hướng tới /exams */}
      {/* Tests by skills – Tabs điều hướng tới /exams */}
      {/* Tests by skills – Tabs giống form mẫu */}
      <Tabs defaultValue="all" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="listening">🎧 Nghe</TabsTrigger>
          <TabsTrigger value="speaking">🎤 Nói</TabsTrigger>
          <TabsTrigger value="reading">📖 Đọc</TabsTrigger>
          <TabsTrigger value="writing">✍️ Viết</TabsTrigger>
        </TabsList>

        {["all", "listening", "speaking", "reading", "writing"].map(
          (skillFilter) => (
            <TabsContent key={skillFilter} value={skillFilter}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5 text-blue-600" />
                    {skillFilter === "all"
                      ? `Tất cả bài kiểm tra ${gradeLabel ? `- ${gradeLabel}` : ""}`
                      : `Bài kiểm tra kỹ năng ${skillFilter === "listening"
                        ? "Nghe"
                        : skillFilter === "speaking"
                          ? "Nói"
                          : skillFilter === "reading"
                            ? "Đọc"
                            : "Viết"
                      } ${gradeLabel ? `- ${gradeLabel}` : ""}`}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {!isStudent ? (
                    <p className="text-xs text-slate-500">
                      Chức năng này chỉ hiển thị danh sách đề cho học sinh.
                    </p>
                  ) : loadingAssigned ? (
                    <p className="text-xs text-slate-500 py-3">
                      Đang tải danh sách đề...
                    </p>
                  ) : (() => {
                    const exams = filterAssignedExamsBySkill(skillFilter);

                    if (!exams || exams.length === 0) {
                      return (
                        <p className="text-xs text-slate-500 py-3">
                          Chưa có bài kiểm tra phù hợp trong mục này.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {exams.map((ex: any) => {
                          const Icon =
                            (ex.skill && skillIcons[ex.skill]) || FileText;

                          // TODO: nếu có dữ liệu kết quả thì map vào 2 biến dưới
                          const hasCompleted = false;
                          const scoreLabel = "0/100";

                          return (
                            <div
                              key={ex._id}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="text-blue-600 mb-2">
                                    {ex.title || "Đề không tên"}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-3">
                                    {ex.description ||
                                      "Đề luyện tập trong trường của bạn."}
                                  </p>

                                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                                    <div className="flex items-center gap-1">
                                      <Clock className="size-4" />
                                      {ex.duration || 0} phút
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <FileText className="size-4" />
                                      {(ex.questions && ex.questions.length) ||
                                        ex.questionCount ||
                                        0}{" "}
                                      câu
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Trophy className="size-4" />
                                      10 điểm
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <Icon className="size-3" />
                                      {ex.skill === "listening" && "🎧 Nghe"}
                                      {ex.skill === "speaking" && "🎤 Nói"}
                                      {ex.skill === "reading" && "📖 Đọc"}
                                      {ex.skill === "writing" && "✍️ Viết"}
                                      {!ex.skill && "Tổng hợp kỹ năng"}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  {hasCompleted && (
                                    <Badge className="bg-green-100 text-green-700">
                                      Đã làm: {scoreLabel}
                                    </Badge>
                                  )}
                                  <Button
                                    onClick={() => navigate(`/exams/${ex._id}`)}
                                  >
                                    {hasCompleted ? "Làm lại" : "Bắt đầu"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          )
        )}
      </Tabs>



      {/* In Progress + Upcoming */}
      {/* Bài thi đang làm dở + Hoạt động gần đây */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <InProgressExamCard
          exams={inProgressExams}
          loading={loading}
          onContinue={(examId, isMock) =>
            navigate(isMock ? `/mock-exams/${examId}` : `/exams/${examId}`)
          }
        />

        <RecentActivityCard
          activities={activities}
          loading={loading}
        />
      </div>


      {/* Hoạt động gần đây */}

    </div>
  );
};

export default Dashboard;
