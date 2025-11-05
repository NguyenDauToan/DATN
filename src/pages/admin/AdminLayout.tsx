import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { AdminNavbar } from "./components/AdminNavbar";
import { AdminSidebar } from "./components/AdminSidebar";
import { LayoutDashboard, Users, FileText, Settings, ChevronLeft, BookOpen } from "lucide-react";

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Sidebar */}
            <aside
                className={`relative bg-white/90 backdrop-blur-sm border-r border-indigo-100 flex flex-col shadow-md transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-64"
                    }`}
            >
                {/* Nút thu/mở sidebar */}
                <button
                    onClick={() => setCollapsed((prev) => !prev)}
                    className="absolute -right-3 top-5 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
                    title="Thu gọn / Mở rộng"
                >
                    <ChevronLeft
                        className={`h-5 w-5 transform transition-transform duration-300 ${collapsed ? "rotate-180" : ""
                            }`}
                    />
                </button>

                {/* Tiêu đề */}
                {!collapsed && (
                    <h2 className="text-xl font-bold text-indigo-700 mb-6 mt-5 text-center">
                        🎓 Quản trị hệ thống
                    </h2>
                )}

                {/* Navigation */}
                <nav className="space-y-2 mt-4 px-3">
                    {[
                        { to: "/admin", label: "Trang chủ", icon: LayoutDashboard },
                        { to: "/admin/users", label: "Người dùng", icon: Users },
                        { to: "/admin/tests", label: "Đề thi", icon: FileText },
                        { to: "/admin/questions", label: "Câu hỏi", icon: BookOpen },
                        { to: "/admin/settings", label: "Cài đặt", icon: Settings },
                    ].map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/admin"}
                            className={({ isActive }) =>
                                `flex items-center gap-3 p-2 rounded-xl transition-all duration-300 group ${isActive
                                    ? "bg-indigo-100 text-indigo-700 font-semibold shadow-sm"
                                    : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
                                }`
                            }
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && (
                                <span className="whitespace-nowrap transition-all duration-300">
                                    {label}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Nội dung chính */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <AdminNavbar />
                <div className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
