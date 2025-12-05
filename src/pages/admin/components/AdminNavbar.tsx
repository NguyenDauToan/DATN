// src/pages/admin/components/AdminNavbar.tsx
import { useEffect, useState } from "react";
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
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/data/AuthContext.js";
import { io, Socket } from "socket.io-client";
import "../../../styles/Header.css";
import { useNavigate } from "react-router-dom";
type AdminNotification = {
  id: string;
  type: "feedback" | "exam" | "system";
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
  meta?: any;
};

export function AdminNavbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();            // 👈 THÊM

  const initial =
    typeof user?.name === "string" && user.name.trim().length
      ? user.name.trim().charAt(0).toUpperCase()
      : "A";

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const handleNotificationClick = (noti: AdminNotification) => {
    // đánh dấu đã đọc thông báo này
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === noti.id ? { ...n, read: true } : n
      )
    );

    if (noti.type === "feedback") {
      window.location.href = "/admin/feedback";
    } else {
      window.location.href = "/admin";
    }
  };


  // Kết nối socket và lắng nghe thông báo
  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const s = io("http://localhost:5000", {
      query: { token },
    });

    setSocket(s);

    s.on("admin_new_message", (fb: any) => {
      const noti: AdminNotification = {
        id: fb._id,
        type: "feedback",
        title: "Phản hồi mới từ học viên",
        message: `${fb.user?.name || "Học viên"}: ${fb.message}`,
        createdAt: fb.createdAt || new Date().toISOString(),
        read: false,
        meta: fb,
      };

      setNotifications((prev) => [noti, ...prev].slice(0, 50));
    });

    s.on("admin_exam_finished", (data: any) => {
      const noti: AdminNotification = {
        id:
          data.resultId ||
          `${data.userId}-${data.examId}-${data.finishedAt || Date.now()}`,
        type: "exam",
        title: "Học viên hoàn thành bài thi",
        message: `${data.userName || "Học viên"} • Đề: ${data.examTitle || data.examId || "Không rõ đề"
          } • Điểm: ${data.score}/${data.maxScore ?? 10}`,
        createdAt: data.finishedAt || new Date().toISOString(),
        read: false,
        meta: data,
      };

      setNotifications((prev) => [noti, ...prev].slice(0, 50));
    });

    return () => {
      s.off("admin_new_message");
      s.off("admin_exam_finished");
      s.disconnect();
    };
  }, []);

  // Load thông báo đã lưu từ localStorage khi mở trang
  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_notifications");
      if (raw) {
        const parsed: AdminNotification[] = JSON.parse(raw);
        setNotifications(parsed);
      }
    } catch (e) {
      console.error("Không đọc được admin_notifications từ localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("admin_notifications", JSON.stringify(notifications));
    } catch (e) {
      console.error("Không lưu được admin_notifications vào localStorage", e);
    }
  }, [notifications]);

  // Cập nhật số chưa đọc
  useEffect(() => {
    setUnread(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

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
      <div className="flex h-full w-full max-w-7xl mx-auto items-center justify-between gap-4 px-4 md:px-6">
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
          {/* Notification Bell + popup */}
          <DropdownMenu
            onOpenChange={(open) => {
              if (open) markAllAsRead();
            }}
          >
            <DropdownMenuTrigger asChild>
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
                {unread > 0 && (
                  <>
                    <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white ring-2 ring-white/80">
                      {unread > 9 ? "9+" : unread}
                    </span>
                    <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-rose-400/60 animate-ping" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="
                w-80 max-h-96 overflow-y-auto
                bg-white/95 backdrop-blur
                border border-gray-200
                rounded-xl shadow-xl
              "
            >
              <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-semibold">Thông báo</span>
                {notifications.length > 0 && (
                  <span className="text-[11px] text-gray-500">
                    {notifications.length} thông báo gần đây
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  Chưa có thông báo nào.
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="
    gap-2 items-start py-2.5 px-3 text-xs leading-snug cursor-pointer
    hover:bg-indigo-50/60
  "
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="mt-[2px]">
                      {n.type === "feedback" ? (
                        <MessageCircle className="h-4 w-4 text-indigo-500" />
                      ) : (
                        <LayoutDashboard className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-2 h-2 w-2 rounded-full bg-indigo-500" />
                    )}
                  </DropdownMenuItem>

                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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

              <DropdownMenuItem
                className="gap-2 text-gray-700 hover:bg-indigo-50 cursor-pointer transition-colors"
                onClick={() => navigate("/admin/profile")}   // 👈 SỬA Ở ĐÂY
              >
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
