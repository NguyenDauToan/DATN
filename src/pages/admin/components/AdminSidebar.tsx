// src/pages/admin/components/AdminSidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  MessageSquare,
  GraduationCap,
  School,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  type LucideIcon,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { useAuth } from "@/data/AuthContext"; // lấy user, role từ context

type NavItem = { to: string; label: string; icon: LucideIcon };
type UserRole = "admin" | "school_manager" | "teacher" | "student" | undefined;

const NAV_ITEMS: NavItem[] = [
  { to: "/admin", label: "Trang chủ", icon: LayoutDashboard },
  { to: "/admin/AdminSchool", label: "Trường học", icon: School },
  { to: "/admin/school-years", label: "Thêm năm học", icon: CalendarDays },
  { to: "/admin/AdminClassrooms", label: "Quản lý lớp", icon: GraduationCap },
  { to: "/admin/tests", label: "Đề thi", icon: FileText },
  { to: "/admin/AdminMocdata", label: "Đề thi thử", icon: FileText },
  { to: "/admin/questions", label: "Câu hỏi", icon: BookOpen },
  { to: "/admin/feedback", label: "Phản hồi học viên", icon: MessageSquare },

  // 👇 MỤC MỚI: YÊU CẦU GIÁO VIÊN
  {
    to: "/admin/teacher-requests",
    label: "Yêu cầu giáo viên",
    icon: FileText,
  },

  { to: "/admin/Examapprove", label: "Duyệt đề thi", icon: CheckSquare },
  { to: "/admin/result-stats", label: "Thống kê kết quả", icon: BarChart3 },
  { to: "/admin/mock-exams/archive", label: "Kho lưu trữ", icon: BarChart3 },
];

const USER_MGMT_ITEMS: NavItem[] = [
  { to: "/admin/students", label: "Quản lý học sinh", icon: Users },
  { to: "/admin/AdminTeacher", label: "Quản lý giáo viên", icon: Users },
  {
    to: "/admin/AdminSchoolManagers",
    label: "Quản lý của trường học",
    icon: Users,
  },
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const [userMgmtOpen, setUserMgmtOpen] = useState(true);

  const { user } = useAuth();
  const role = user?.role as UserRole;

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  // ====== LỌC MENU THEO ROLE ======

  const filterMainItemsByRole = (items: NavItem[]): NavItem[] => {
    // admin: full quyền
    if (role === "admin" || role === undefined) return items;

    if (role === "school_manager") {
      // school manager:
      // - Trang chủ
      // - Quản lý lớp
      // - Đề thi, Đề thi thử
      // - Câu hỏi
      // - Phản hồi
      // - Yêu cầu giáo viên
      // - Duyệt đề thi
      // - Thống kê kết quả
      const allowed = [
        "/admin",
        "/admin/school-years",
        "/admin/AdminClassrooms",
        "/admin/tests",
        "/admin/AdminMocdata",
        "/admin/questions",
        "/admin/feedback",
        "/admin/teacher-requests",
        "/admin/Examapprove",
        "/admin/result-stats",
      ];
      return items.filter((item) => allowed.includes(item.to));
    }

    if (role === "teacher") {
      // giáo viên:
      // - Trang chủ
      // - Đề thi, Đề thi thử, Câu hỏi
      // - Phản hồi học viên
      // - Yêu cầu giáo viên
      // - Thống kê kết quả
      const allowed = [
        "/admin",
        "/admin/tests",
        "/admin/AdminMocdata",
        "/admin/questions",
        "/admin/feedback",
        "/admin/teacher-requests",
        "/admin/result-stats",
      ];
      return items.filter((item) => allowed.includes(item.to));
    }

    // các role khác (student) không nên vào admin
    return [];
  };

  const filterUserMgmtByRole = (items: NavItem[]): NavItem[] => {
    if (role === "admin" || role === undefined) return items;

    if (role === "school_manager") {
      // school manager: quản lý học sinh, giáo viên
      const allowed = ["/admin/students", "/admin/AdminTeacher"];
      return items.filter((item) => allowed.includes(item.to));
    }

    if (role === "teacher") {
      // giáo viên: chỉ quản lý học sinh
      const allowed = ["/admin/students"];
      return items.filter((item) => allowed.includes(item.to));
    }

    return [];
  };

  const dashboardItem = NAV_ITEMS[0]; // luôn là /admin
  const otherItemsRaw = NAV_ITEMS.slice(1);

  const otherItems = filterMainItemsByRole(otherItemsRaw);
  const filteredUserMgmtItems = filterUserMgmtByRole(USER_MGMT_ITEMS);

  const isUserMgmtActive = filteredUserMgmtItems.some((item) =>
    isActive(item.to)
  );

  return (
    <Sidebar
      collapsible="icon"
      className={[
        "z-30 border-r border-sidebar-border/60",
        "bg-gradient-to-b from-indigo-50 via-slate-50 to-white",
        "shadow-[2px_0_10px_rgba(15,23,42,0.05)]",
        open ? "w-72 min-w-[18rem]" : "w-[80px] min-w-[80px]",
      ].join(" ")}
    >
      <SidebarContent>
        {/* Logo / Title */}
        <div className="px-4 py-4 border-b border-sidebar-border/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <span className="text-sm font-semibold">ET</span>
            </div>
            {open && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-indigo-900">
                  English Test
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Admin Dashboard
                </span>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground px-3">
            Quản lý
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-1">
            <SidebarMenu className="space-y-1">
              {/* 1. Trang chủ */}
              <SidebarMenuItem className="relative animate-fade-in">
                {(() => {
                  const Icon = dashboardItem.icon;
                  const active = isActive(dashboardItem.to);

                  return (
                    <>
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1.5 rounded-r-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                      )}
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink
                          to={dashboardItem.to}
                          className={[
                            "group flex items-center gap-3 rounded-lg mx-2",
                            "transition-all duration-200 ease-out",
                            "hover:translate-x-[2px] hover:shadow-sm",
                            active
                              ? "bg-indigo-100 text-indigo-800 shadow-sm"
                              : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-800",
                            open ? "px-3 py-2.5" : "px-2 py-2 justify-center",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-lg border border-transparent",
                              "transition-all duration-200 ease-out",
                              "group-hover:scale-[1.05]",
                              active
                                ? "bg-white text-indigo-600 border-indigo-200 shadow"
                                : "bg-indigo-50 text-indigo-500 group-hover:bg-white group-hover:border-indigo-100",
                            ].join(" ")}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          {open && (
                            <span className="truncate text-sm font-medium">
                              {dashboardItem.label}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </>
                  );
                })()}
              </SidebarMenuItem>

              {/* 2. Dropdown Quản lý người dùng (nếu có item sau khi lọc) */}
              {filteredUserMgmtItems.length > 0 && (
                <SidebarMenuItem className="relative">
                  <SidebarMenuButton
                    asChild
                    isActive={isUserMgmtActive}
                    onClick={() => setUserMgmtOpen((v) => !v)}
                  >
                    <button
                      type="button"
                      className={[
                        "group flex w-full items-center gap-3 rounded-lg mx-2",
                        "transition-all duration-200 ease-out",
                        "hover:translate-x-[2px] hover:shadow-sm",
                        isUserMgmtActive
                          ? "bg-indigo-100 text-indigo-800 shadow-sm"
                          : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-800",
                        open ? "px-3 py-2.5" : "px-2 py-2 justify-center",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-7 w-7 items-center justify-center rounded-lg border border-transparent",
                          "transition-all duration-200 ease-out",
                          "group-hover:scale-[1.05]",
                          isUserMgmtActive
                            ? "bg-white text-indigo-600 border-indigo-200 shadow"
                            : "bg-indigo-50 text-indigo-500 group-hover:bg-white group-hover:border-indigo-100",
                        ].join(" ")}
                      >
                        <Users className="h-4 w-4" />
                      </span>

                      {open && (
                        <>
                          <span className="truncate text-sm font-medium flex-1">
                            Quản lý người dùng
                          </span>
                          {userMgmtOpen ? (
                            <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 ease-out group-hover:translate-y-[1px]" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 ease-out group-hover:translate-x-[1px]" />
                          )}
                        </>
                      )}
                    </button>
                  </SidebarMenuButton>

                  {userMgmtOpen && (
                    <div className="mt-1 space-y-1">
                      {filteredUserMgmtItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.to);

                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={[
                              "group flex items-center gap-3 rounded-lg mx-4",
                              "transition-all duration-200 ease-out",
                              "hover:translate-x-[4px] hover:shadow-sm",
                              active
                                ? "bg-indigo-100 text-indigo-800 shadow-sm"
                                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-800",
                              open ? "px-3 py-2" : "px-2 py-2 justify-center",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-[11px]",
                                "transition-all duration-200 ease-out",
                                "group-hover:scale-[1.05]",
                                active
                                  ? "bg-white text-indigo-600 border-indigo-200 shadow"
                                  : "bg-indigo-50 text-indigo-500 group-hover:bg-white group-hover:border-indigo-100",
                              ].join(" ")}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            {open && (
                              <span className="truncate text-xs font-medium">
                                {item.label}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </SidebarMenuItem>
              )}

              {/* 3. Các item còn lại (đã lọc theo role) */}
              {otherItems.map((item, i) => {
                const Icon = item.icon;
                const active = isActive(item.to);

                return (
                  <SidebarMenuItem
                    key={item.to}
                    className="relative animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1.5 rounded-r-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                    )}

                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.to}
                        className={[
                          "group flex items-center gap-3 rounded-lg mx-2",
                          "transition-all duration-200 ease-out",
                          "hover:translate-x-[2px] hover:shadow-sm",
                          active
                            ? "bg-indigo-100 text-indigo-800 shadow-sm"
                            : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-800",
                          open ? "px-3 py-2.5" : "px-2 py-2 justify-center",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-7 w-7 items-center justify-center rounded-lg border border-transparent",
                            "transition-all duration-200 ease-out",
                            "group-hover:scale-[1.05]",
                            active
                              ? "bg-white text-indigo-600 border-indigo-200 shadow"
                              : "bg-indigo-50 text-indigo-500 group-hover:bg-white group-hover:border-indigo-100",
                          ].join(" ")}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        {open && (
                          <span className="truncate text-sm font-medium">
                            {item.label}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
