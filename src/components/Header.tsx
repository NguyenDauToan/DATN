import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User as UserIcon, BarChart3, LayoutDashboard, Target, Brain, MessageSquare, Menu, X, GraduationCap } from "lucide-react";
import { useAuth } from "@/data/AuthContext.jsx";
import AuthDialog from "@/pages/user/AuthDialog";
import { useLocation } from "react-router-dom";
import { ClipboardList } from "lucide-react";

export default function Header() {
  const { user, logout, setUser } = useAuth();
  const [openAuth, setOpenAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    setUserDropdown(false);
  };

  const handleLoginSuccess = (user: any) => {
    setUser(user);
    setOpenAuth(false);
    navigate(user.role === "admin" || user.role === "teacher" ? "/admin" : "/dashboard");
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Menu items
  const items = [
    
  ];

  if (user && user.role === "student") {
    items.push(
      { title: "Luyện tập", url: "/practice", icon: Target },
      { title: "Cải thiện", url: "/adaptive", icon: Brain },
      { title: "Thi thử", url: "/mock-exams", icon: ClipboardList  },
  
      { title: "Bảng xếp hạng", url: "/leaderboard", icon: BarChart3 }
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-header-border bg-header-bg/95 backdrop-blur supports-[backdrop-filter]:bg-header-bg/80" style={{marginBottom:-25}}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <div
                className="flex items-center gap-2.5 cursor-pointer group"
                onClick={() => {
                  const token = localStorage.getItem("token");
                  if (!token && location.pathname === "/") {
                    setOpenAuth(true); // chỉ mở dialog
                  } else if (token) {
                    navigate("/dashboard"); // đã login → đi dashboard
                  } else {
                    navigate("/"); // đang ở trang khác, chưa login → đi index
                  }
                }}
                
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                </div>
                <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                  ExamPro
                </span>
              </div>

              {/* Desktop Navigation */}
              {user && (
                <nav className="hidden md:flex items-center gap-2">
                  {items.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${isActive
                          ? "bg-gradient-primary text-white shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      <span>{item.title}</span>
                    </NavLink>
                  ))}
                </nav>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  {/* Avatar button */}
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-secondary/60 to-secondary/40 border border-border/50 hover:from-secondary/80 hover:to-secondary/60 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white/20">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-foreground max-w-[120px] truncate">{user.name}</span>
                  </button>

                  {/* Dropdown */}
                  {userDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-fade-in">
                      <NavLink
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 transition font-medium"
                        onClick={() => setUserDropdown(false)}
                      >
                        <UserIcon className="h-4 w-4" /> Hồ sơ
                      </NavLink>
                      <NavLink
                        to="/results"
                        className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 transition font-medium"
                        onClick={() => setUserDropdown(false)}
                      >
                        <BarChart3 className="h-4 w-4" /> Kết quả
                      </NavLink>
                      <button
                        className="flex items-center gap-2 w-full px-4 py-3 hover:bg-gray-100 transition font-medium text-left"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" /> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => setOpenAuth(true)}
                  className="relative overflow-hidden bg-gradient-primary text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold rounded-xl group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  <LogIn className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                  Đăng nhập
                </Button>
              )}

              {/* Mobile menu toggle */}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden hover:bg-nav-hover"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && menuOpen && (
          <div className="md:hidden border-t border-header-border bg-header-bg">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {items.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium text-sm transition-all duration-300 overflow-hidden ${isActive
                      ? "bg-gradient-primary text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 z-10 transition-transform duration-300 group-hover:scale-110" />
                  <span className="z-10">{item.title}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <AuthDialog open={openAuth} onClose={() => setOpenAuth(false)} onLoginSuccess={handleLoginSuccess} />
    </>
  );
}
