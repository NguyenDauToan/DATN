import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Users, HelpCircle, FileText, BarChart3, PieChart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: PieChart },
  { title: "Người dùng", url: "/admin/users", icon: Users },
  { title: "Câu hỏi", url: "/admin/questions", icon: HelpCircle },
  { title: "Đề thi", url: "/admin/tests", icon: FileText },
  { title: "Kết quả", url: "/admin/results", icon: BarChart3 },
  { title: "Báo cáo", url: "/admin/reports", icon: PieChart },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={cn(
      "bg-card border-r border-border transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title}>
                <NavLink
                  to={item.url}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-muted hover:text-foreground",
                    isActive(item.url)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && (
                    <span className="ml-3">{item.title}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}