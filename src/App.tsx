import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Practice from "./pages/Practice";
import Exams from "./pages/Exams";
import ExamDetail from "./pages/ExamDetail";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { useAuth } from "./data/AuthContext.jsx";
import AuthDialog from "./pages/user/AuthDialog";
import AdminDashboard from "./pages/admin/AdminDashboard.js";
import AdminQuestions from "./pages/admin/AdminQuestion.js";
import AdminLayout from "./pages/admin/AdminLayout.js";
import AdminTests from "./pages/admin/AdminTest.js";
import AdminUsers from "./pages/admin/AdminUser.js";
import AddExamModal from "./pages/admin/AddExam.js";
import ProtectedRoute from "./routes/ProtectedRoute .tsx";
import ExamPage from "./pages/ExamPage.tsx";
const queryClient = new QueryClient();

// ============================
// Header component
// ============================
const Header = () => {
  const { user,logout, setUser } = useAuth();
  const [openAuth, setOpenAuth] = useState(false);
  const navigate = useNavigate();

  // ✅ Hàm đăng xuất an toàn (xóa hết dữ liệu user)
  const handleLogout = () => {
    logout();       // xóa localStorage + reset user
    setUser(null);  // phòng trường hợp context chưa kịp re-render
    navigate("/");  // quay lại trang chủ
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 border-b bg-white/80 backdrop-blur-md px-6 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-base">E</span>
            </div>
            <span className="font-semibold text-lg text-gray-800">ExamPro</span>
          </div>
        </div>

        {/* Nút đăng nhập / đăng xuất */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user.name}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Đăng xuất</span>
            </Button>
          </div>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm px-4"
            onClick={() => setOpenAuth(true)}
          >
            <LogIn className="h-4 w-4" />
            <span>Đăng nhập</span>
          </Button>
        )}
      </header>

      {/* Auth Dialog */}
      <AuthDialog
        open={openAuth}
        onClose={() => setOpenAuth(false)}
        onLoginSuccess={(user) => {
          setUser(user);
          setOpenAuth(false);
          // ✅ Nếu là admin → vào /admin, còn lại → /
          navigate(user.role === "admin" ? "/admin" : "/");
        }}
      />
    </>
  );
};

// ============================
// Layout chính của app
// ============================
const AppLayout = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin"); // ✅ kiểm tra có phải trang admin không

  return (
    <div className="flex min-h-screen w-full">
      {/* ✅ Ẩn sidebar và header nếu là trang admin */}
      {!isAdminPage && <AppSidebar />}
      <main className="flex-1 overflow-auto">
        {!isAdminPage && <Header />}

        <Routes>
          {/* User routes */}
          <Route path="/" element={<Index />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/exams/:id" element={<ExamPage />} />
          <Route path="/results" element={<Results />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="addExam" element={<AddExamModal />} />
            <Route path="questions" element={<AdminQuestions />} />
            <Route path="tests" element={<AdminTests />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

// ============================
// App root
// ============================
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SidebarProvider>
        <AppLayout />
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
