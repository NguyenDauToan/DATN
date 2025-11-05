import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, User, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AdminNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Logo & title */}
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-100 rounded-xl flex items-center justify-center">
            <img
              src="/Logo.png"
              alt="Logo"
              className="w-10 h-10 object-contain"  // 🔹 tăng từ 6 → 10
            />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">
            Trang quản trị Hệ thống luyện thi tiếng Anh
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notification button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
          >
            <Bell className="h-5 w-5" />
          </Button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-full border border-gray-200 hover:shadow-md transition"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-indigo-500 text-white font-semibold">
                    AD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-56 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden"
              align="end"
              forceMount
            >
              {/* Header user info */}
              <div className="px-3 py-3 border-b bg-gray-50">
                <p className="font-medium text-gray-800">Admin User</p>
                <p className="text-sm text-gray-500 truncate">
                  admin@example.com
                </p>
              </div>

              <DropdownMenuItem className="flex items-center gap-2 text-gray-700 hover:bg-indigo-50">
                <User className="h-4 w-4 text-indigo-500" />
                Hồ sơ cá nhân
              </DropdownMenuItem>

              <DropdownMenuItem className="flex items-center gap-2 text-gray-700 hover:bg-indigo-50">
                <Settings className="h-4 w-4 text-indigo-500" />
                Cài đặt
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
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
