// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  TrendingUp,
  Activity as ActivityIcon,
  Layers,
  Users,
  BarChart3,
  Clock,
  UserCheck,
  Inbox,
} from "lucide-react";
import { ResultStatsCard, RecentActivityCard } from "./components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QuickStats = {
  totalUsers?: number;
  totalTests?: number;
  totalResults?: number;
  totalQuestions?: number;
  examsToday?: number;
  onlineUsers?: number;
  newUsersThisWeek?: number;
  newTestsThisWeek?: number;
  pendingFeedbacks?: number;
};

type SkillStat = {
  skill: string;
  [key: string]: any;
};

type SchoolInfo = {
  _id: string;
  name: string;
  code?: string;
};

type ClassInfo = {
  _id: string;
  name: string;
  grade?: string;
  code?: string;
};

type CurrentUser = {
  name: string;
  email: string;
  role: string;
  school?: SchoolInfo | null;
  classroom?: ClassInfo | null;
  classes?: ClassInfo[];
};

const StatTile = ({
  label,
  value,
  Icon,
  delay = 0,
}: {
  label: string;
  value: number | string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  delay?: number;
}) => (
  <Card
    className="rounded-2xl border border-border/70 bg-card/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all animate-slide-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <CardContent className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div className="rounded-xl bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground leading-tight">
        {value}
      </p>
    </CardContent>
  </Card>
);

const prettyRole = (role?: string) => {
  if (!role) return "";
  switch (role) {
    case "admin":
      return "Quản trị hệ thống";
    case "school_manager":
      return "Quản lý trường";
    case "teacher":
      return "Giáo viên";
    case "student":
      return "Học viên";
    default:
      return role;
  }
};

const AdminDashboard = () => {
  const [resultStats, setResultStats] = useState<SkillStat[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>({});
  const [activities, setActivities] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const headers = { Authorization: `Bearer ${token}` };

        const [resDashboard, resSkillStats, resMe] = await Promise.all([
          axios.get("https://english-backend-uoic.onrender.com/api/admin/dashboard", { headers }),
          axios.get(
            "https://english-backend-uoic.onrender.com/api/results/system/skill-stats",
            { headers }
          ),
          axios.get("https://english-backend-uoic.onrender.com/api/profile/me", { headers }),
        ]);

        const dashData = resDashboard.data || {};
        setQuickStats(dashData.quickStats || {});
        setActivities(dashData.activities || []);

        const statsObj = resSkillStats.data || {};
        const statsArray: SkillStat[] = Object.keys(statsObj).map((skill) => ({
          skill,
          ...statsObj[skill],
        }));
        setResultStats(statsArray);

        const me = resMe.data?.user || resMe.data || null;
        setCurrentUser(me);
      } catch (err) {
        console.error("Admin dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAll();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-sm">
            Đang tải dữ liệu tổng quan hệ thống...
          </p>
        </div>
      </div>
    );
  }

  const role = currentUser?.role;
  const schoolName = currentUser?.school?.name;
  const classroomName = currentUser?.classroom?.name;

  // Với teacher, backend trả về mảng classes: ClassInfo[]
  const teacherClasses =
    currentUser?.classes && currentUser.classes.length
      ? currentUser.classes
          .map((c) => c?.name)
          .filter(Boolean) as string[]
      : [];

  const homeroomLabel =
    role === "teacher" && teacherClasses.length > 0
      ? `Phụ trách lớp: ${teacherClasses.join(", ")}`
      : role === "student" && classroomName
      ? `Lớp: ${classroomName}`
      : "";

  return (
    <div className="bg-gradient-subtle min-h-[calc(100vh-4rem)] animate-fade-in">
      <div className="space-y-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-r from-primary to-sky-500 px-6 py-6 md:px-8 md:py-7 text-primary-foreground shadow-md animate-slide-in">
          <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/80">
                Admin overview
              </p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Bảng điều khiển hệ thống
              </h1>
              <p className="text-sm md:text-base text-primary-foreground/85 max-w-xl">
                Toàn cảnh hoạt động của học viên, đề thi và kết quả theo kỹ
                năng trong hệ thống ExamPro.
              </p>

              {currentUser && (
                <div className="mt-3 text-xs md:text-sm space-y-1 text-primary-foreground/90">
                  <p>
                    Tài khoản:{" "}
                    <span className="font-semibold">{currentUser.name}</span>{" "}
                    · {prettyRole(currentUser.role)}
                  </p>
                  {schoolName && (
                    <p>
                      Trường:{" "}
                      <span className="font-semibold">{schoolName}</span>
                    </p>
                  )}
                  {homeroomLabel && (
                    <p>
                      {homeroomLabel}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium shadow-sm ring-1 ring-white/40">
                Hôm nay:{" "}
                {new Date().toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
              <div className="flex flex-col gap-1 rounded-2xl bg-black/10 px-3 py-2 text-xs">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>
                    {quickStats.totalResults ?? 0} lượt làm bài •{" "}
                    {quickStats.totalTests ?? 0} đề thi
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {quickStats.examsToday ?? 0} lượt làm hôm nay •{" "}
                    {quickStats.onlineUsers ?? 0} học viên đang hoạt động
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK STATS GRID */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Tổng người dùng"
            value={quickStats.totalUsers ?? 0}
            Icon={Users}
            delay={40}
          />
          <StatTile
            label="Tổng đề thi"
            value={quickStats.totalTests ?? 0}
            Icon={Layers}
            delay={80}
          />
          <StatTile
            label="Số lượt làm bài"
            value={quickStats.totalResults ?? 0}
            Icon={TrendingUp}
            delay={120}
          />
          <StatTile
            label="Câu hỏi trong hệ thống"
            value={quickStats.totalQuestions ?? 0}
            Icon={ActivityIcon}
            delay={160}
          />
        </section>

        {/* MAIN GRID */}
        <section className="space-y-6">
          {/* HÀNG 1: KẾT QUẢ THEO KỸ NĂNG */}
          <Card className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                  📊 Kết quả theo kỹ năng
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Điểm trung bình, độ chính xác và số câu đã làm theo từng kỹ
                  năng (tổng hợp toàn hệ thống hoặc trong phạm vi bạn quản lý).
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/20">
                {role === "admin"
                  ? "Toàn hệ thống"
                  : schoolName
                  ? `Trường: ${schoolName}`
                  : "Phạm vi tài khoản"}
              </span>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/80">
                <ResultStatsCard resultStats={resultStats} />
              </div>
              {(!resultStats || resultStats.length === 0) && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Chưa có dữ liệu thống kê theo kỹ năng.
                </p>
              )}
            </CardContent>
          </Card>

          {/* HÀNG 2: HOẠT ĐỘNG + THỐNG KÊ NHANH */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
            {/* HOẠT ĐỘNG GẦN ĐÂY */}
            <Card className="h-full flex flex-col rounded-3xl border border-border/80 bg-card/95 backdrop-blur-sm shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                <div>
                  <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                    🕓 Hoạt động gần đây
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Các bài làm mới nhất của học viên trong phạm vi bạn quản lý.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                  Realtime snapshot
                </span>
              </CardHeader>
              <CardContent className="pt-2 flex-1 flex flex-col">
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/80 flex-1">
                  <RecentActivityCard activities={activities} />
                </div>
              </CardContent>
            </Card>

            {/* THỐNG KÊ NHANH */}
            <Card className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg md:text-xl font-semibold flex items-center gap-2">
                  📅 Thống kê nhanh
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Tình hình trong hôm nay và 7 ngày gần đây.
                </p>
              </CardHeader>

              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Lượt làm bài hôm nay
                    </p>
                    <p className="text-lg md:text-xl font-semibold">
                      {quickStats.examsToday ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Học viên đang hoạt động
                    </p>
                    <p className="text-lg md:text-xl font-semibold">
                      {quickStats.onlineUsers ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-sky-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Học viên mới (7 ngày)
                    </p>
                    <p className="text-lg md:text-xl font-semibold">
                      {quickStats.newUsersThisWeek ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Đề thi mới (7 ngày)
                    </p>
                    <p className="text-lg md:text-xl font-semibold">
                      {quickStats.newTestsThisWeek ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:col-span-2">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center">
                    <Inbox className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Phản hồi chờ xử lý
                    </p>
                    <p className="text-lg md:text-xl font-semibold">
                      {quickStats.pendingFeedbacks ?? 0}
                    </p>
                  </div>
                </div>
                
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
