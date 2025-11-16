// src/pages/admin/components/AdminNavbar.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bell,
  Search,
  User as UserIcon,
  Settings,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/data/AuthContext.jsx";
import "../../../styles/Header.css";

export function AdminNavbar() {
  const { logout, user } = useAuth();

  const initial =
    typeof user?.name === "string" && user.name.trim().length
      ? user.name.trim().charAt(0).toUpperCase()
      : "A";

  return (
    <header
      className="
        header
        sticky top-0 inset-x-0 z-30
        h-16
        bg-gradient-to-r from-indigo-50/90 via-sky-50/90 to-blue-50/90
        backdrop-blur-md
        border-b border-sidebar-border/60
        shadow-[0_1px_0_0_rgba(99,102,241,0.15)]
        m-0
        transition-[background-color,box-shadow,transform]
        duration-300
      "
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-300/60 via-sky-300/60 to-blue-300/60"
      />
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
        {/* Left: Sidebar trigger + Search */}
        <div className="flex items-center gap-3 md:gap-4">
          <SidebarTrigger className="h-9 w-9 rounded-lg bg-white/80 hover:bg-indigo-100/80 text-indigo-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-[1px]" />

          {/* Search desktop */}
          <div className="relative hidden w-[18rem] lg:w-[26rem] md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500/70" />
            <Input
              placeholder="Tìm kiếm học viên, bài thi..."
              className="
                h-10 pl-10 rounded-xl
                bg-white/80
                border-indigo-200/70
                focus-visible:ring-2 focus-visible:ring-indigo-300
                focus-visible:border-indigo-300
                placeholder:text-indigo-900/40
                transition-all
                shadow-sm focus:shadow-md
              "
            />
          </div>
        </div>

        {/* Right: Bell + Avatar */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Notification */}
          <Button
            variant="ghost"
            size="icon"
            className="
              relative h-9 w-9 rounded-lg
              hover:bg-indigo-100/70 text-indigo-700
              transition-all
            "
            aria-label="Thông báo"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white/80 animate-pulse" />
          </Button>

          {/* Avatar + dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="
                  h-9 w-9 rounded-xl p-0
                  hover:bg-indigo-100/70
                  transition-all
                  shadow-sm hover:shadow-md
                "
                aria-label="Tài khoản"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-indigo-600 text-white font-semibold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="
                w-64 bg-white/95 backdrop-blur
                border border-gray-200
                rounded-xl shadow-xl
                animate-slide-in
              "
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {user?.name ?? "Admin User"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user?.email ?? "admin@example.com"}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {(user?.role === "admin" || user?.role === "teacher") && (
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/admin")}
                  className="gap-2 text-gray-700 hover:bg-indigo-50 cursor-pointer transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-indigo-600" />
                  Trang quản trị
                </DropdownMenuItem>
              )}

              <DropdownMenuItem className="gap-2 text-gray-700 hover:bg-indigo-50 cursor-pointer transition-colors">
                <UserIcon className="h-4 w-4 text-indigo-600" />
                Hồ sơ
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-gray-700 hover:bg-indigo-50 cursor-pointer transition-colors">
                <Settings className="h-4 w-4 text-indigo-600" />
                Cài đặt
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={logout}
                className="gap-2 text-red-600 hover:bg-red-50 focus:text-red-700 cursor-pointer transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
