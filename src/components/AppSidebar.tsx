import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  BarChart3,
  User,
  GraduationCap,
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
import { useAuth } from "@/data/AuthContext.jsx"; // ✅ import context

export function AppSidebar() {
  const { open } = useSidebar();
  const { user } = useAuth(); // ✅ lấy trạng thái đăng nhập

  // ✅ chỉ hiển thị "Hồ sơ" nếu user đã đăng nhập
  const items = [
    { title: "Trang chủ", url: "/", icon: LayoutDashboard },
    { title: "Luyện tập", url: "/practice", icon: Target },
    { title: "Kết quả", url: "/results", icon: BarChart3 },
    ...(user
      ? [{ title: "Hồ sơ", url: "/profile", icon: User }]
      : []), // nếu chưa login thì không thêm mục này
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground">ExamPro</span>
              <span className="text-xs text-muted-foreground">
                Học để thành công
              </span>
            </div>
          )}
        </div>

        {/* Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
