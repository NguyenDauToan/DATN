import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { StatCard } from "@/components/StatCard";
import { RecentActivityCard } from "@/components/RecentActivityCard";
import { UpcomingExamCard } from "@/components/UpcomingExamCard";
import { SkillCard } from "@/components/SkillCard";
import { skillsAPI, dashboardAPI,authAPI  } from "@/api/Api";
import {
  BookOpen, Target, TrendingUp, Award,
  Headphones, PenTool, Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { DashboardMe, QuickStats, RecentActivity, UpcomingExam } from "@/api/Api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const skillIcons: Record<string, any> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
};

type Quick = {
  completedExams: number;
  accuracyPercent: number;
  studyTimeHours: number;
};

type Activity = {
  id: string;
  testTitle: string;
  score: number;
  finishedAt: string;
};

type Upcoming = {
  _id: string;
  title: string;
  startTime: string;
  duration?: number;
  skill?: string;
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [quick, setQuick] = useState<QuickStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingExam[]>([]);
  const [blocked, setBlocked] = useState(false);

  const explainAxiosError = (err: any) => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err?.message || "Không rõ nguyên nhân";
    const url = err?.config?.url;
    return { status, msg, url };
  };
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const res = await authAPI.getCurrentUser(); // GET /api/auth/me
        const user = res.data.user;
        if (user && user.isActive === false) {
          setBlocked(true);
        }
      } catch (err: any) {
        console.error("CHECK USER ERROR:", err?.response?.status, err?.response?.data);
      }
    };

    checkUserStatus();
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDebug(null);

    const [skillsRes, dashRes] = await Promise.allSettled([
      skillsAPI.getAll(),    // GET /api/skills -> { skills: [...] }
      dashboardAPI.me(),     // GET /api/dashboard/me -> { quickStats, recentActivities, upcomingExams }
    ]);

    const debugInfo: any = {};

    if (skillsRes.status === "fulfilled") {
      const list = skillsRes.value.data?.skills ?? [];
      setSkills(list);
      debugInfo.skills = { ok: true, count: list.length };
    } else {
      const info = explainAxiosError(skillsRes.reason);
      debugInfo.skills = { ok: false, ...info };
      setError(`Lỗi tải kỹ năng (${info.status ?? "?"}): ${info.msg}`);
    }

    if (dashRes.status === "fulfilled") {
      const data = (dashRes.value.data ?? {}) as DashboardMe;
      setQuick(data.quickStats ?? null);
      setActivities(data.recentActivities ?? []);
      setUpcoming(data.upcomingExams ?? []);
      debugInfo.dashboard = { ok: true };
    } else {
      const info = explainAxiosError(dashRes.reason);
      debugInfo.dashboard = { ok: false, ...info };
      setError(prev =>
        prev
          ? `${prev} • Lỗi thống kê (${info.status ?? "?"}): ${info.msg}`
          : `Lỗi thống kê (${info.status ?? "?"}): ${info.msg}`
      );
    }

    setDebug(debugInfo);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-6 md:p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Chào mừng trở lại! 👋</h1>
          <p className="text-muted-foreground">Hãy tiếp tục hành trình học tập của bạn</p>
        </div>
        <Dialog open={blocked} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Tài khoản đã bị khóa
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button variant="destructive" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        {/* Error box */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">Đã xảy ra lỗi</p>
              <p className="text-sm mt-0.5">{error}</p>
              {debug && (
                <details className="mt-2 text-red-800">
                  <summary className="cursor-pointer text-sm underline">Chi tiết kỹ thuật</summary>
                  <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-white/70 p-3 text-xs text-red-900">
                    {JSON.stringify(debug, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            <Button variant="destructive" onClick={fetchAll}>Thử lại</Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Bài thi đã hoàn thành" value={quick?.completedExams ?? 0} icon={BookOpen} trend="" colorClass="text-primary" />
          <StatCard title="Tỷ lệ chính xác" value={quick ? `${quick.accuracyPercent}%` : "0%"} icon={Target} trend="" colorClass="text-success" />
          <StatCard title="Thời gian học" value={quick ? `${quick.studyTimeHours}h` : "0h"} icon={TrendingUp} trend="" colorClass="text-accent" />
          <StatCard title="Huy chương" value="—" icon={Award} trend="" colorClass="text-chart-4" />
        </div>

        {/* Quick Start */}
        <div className="p-6 rounded-xl bg-gradient-primary text-primary-foreground">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Sẵn sàng luyện tập?</h2>
              <p className="opacity-90">Chọn cấp độ và kỹ năng để bắt đầu</p>
            </div>
            <Button size="lg" variant="secondary" onClick={() => navigate("/practice")} className="gap-2">
              Bắt đầu ngay <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Kỹ năng luyện tập</h2>

          {loading ? (
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          ) : !error && skills.length === 0 ? (
            <p className="text-muted-foreground">Chưa có kỹ năng nào</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {skills.map((skill: any, index: number) => (
                <div key={skill._id || skill.name || index} className="animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <SkillCard
                    skill={skill.name}
                    title={skill.displayName || skill.name}
                    description={skill.description || `Câu hỏi: ${skill.questionCount || 0} • Đề: ${skill.examCount || 0}`}
                    icon={skillIcons[skill.name] || BookOpen}
                    examCount={skill.examCount || 0}
                    onClick={() => navigate(`/practice?skill=${skill.name}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity + Upcoming: truyền dữ liệu vào thẻ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingExamCard exams={upcoming} loading={loading} />
          <RecentActivityCard activities={activities} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
