// src/pages/admin/components/AdminSidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  MessageSquare,
  type LucideIcon,
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

type NavItem = { to: string; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { to: "/admin", label: "Trang chủ", icon: LayoutDashboard },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/tests", label: "Đề thi", icon: FileText },
  { to: "/admin/questions", label: "Câu hỏi", icon: BookOpen },
  { to: "/admin/feedback", label: "Phản hồi học viên", icon: MessageSquare },
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  return (
    <Sidebar
      collapsible="icon"
      className="
        z-30
        border-r border-sidebar-border/60
        bg-gradient-to-b from-indigo-50 via-slate-50 to-white
        shadow-[2px_0_10px_rgba(15,23,42,0.05)]
      "
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

        {/* Menu */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground px-3">
            Quản lý
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-1">
            <SidebarMenu className="space-y-1">
              {NAV_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const active = isActive(item.to);

                return (
                  <SidebarMenuItem
                    key={item.to}
                    className="relative animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Active bar bên trái */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1.5 rounded-r-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                    )}

                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.to}
                        className={[
                          "group flex items-center gap-3 rounded-lg transition-all duration-200 mx-2",
                          active
                            ? "bg-indigo-100 text-indigo-800 shadow-sm"
                            : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-800",
                          open
                            ? "px-3 py-2.5"
                            : "px-2 py-2 justify-center",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-7 w-7 items-center justify-center rounded-lg border border-transparent transition-all duration-200",
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
