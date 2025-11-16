import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";

import Index from "./pages/Index.tsx";
import Practice from "./pages/Practice";
import Exams from "./pages/Exams";
import ExamPage from "./pages/ExamPage";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { useAuth } from "./data/AuthContext.jsx";
import AuthDialog from "./pages/user/AuthDialog";
import AdminDashboard from "./pages/admin/AdminDashboard.js"  ;
import AdminQuestions from "./pages/admin/AdminQuestion.js";
import AdminLayout from "./pages/admin/AdminLayout.js";
import AdminTests from "./pages/admin/AdminTest.js";
import AdminUsers from "./pages/admin/AdminUser.js";
import AddExamModal from "./pages/admin/AddExam.js";
import { ProtectedRoute } from "./routes/ProtectedRoute.tsx";
import AdminFeedback from "./pages/admin/components/AdminFeedback.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import AdaptiveLearning from "@/pages/user/AdaptiveLearning";
import Leaderboard from "@/pages/user/Leaderboard.tsx";
import ChatBubble from "@/pages/user/ChatBubble";
import Header from "@/components/Header"; // dùng Header bạn đã tạo
import ExamReviewPage from "./pages/ExamPageReview.tsx";
const queryClient = new QueryClient();

// ============================
// Layout chính
// ============================
const AppLayout = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const isIndexPage = location.pathname === "/"; // thêm biến kiểm tra trang index

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Header hiển thị trên tất cả user pages */}
      {!isAdminPage && <Header />}

      <main className="flex-1 overflow-auto p-4">
        <Routes>
          {/* User routes */}
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/exams/:id" element={<ExamPage />} />
          <Route path="/results" element={<Results />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/adaptive" element={<AdaptiveLearning />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/exams/:id/review" element={<ExamReviewPage />} />
          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="addExam" element={<AddExamModal />} />
            <Route path="questions" element={<AdminQuestions />} />
            <Route path="tests" element={<AdminTests />} />
            <Route path="feedback" element={<AdminFeedback />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminPage && !isIndexPage && <ChatBubble />}

    </div>
  );
};


// ============================
// Root
// ============================
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppLayout />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
