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
import { useAuth } from "./data/AuthContext.js";
import LoginPage from "./pages/user/LoginPage.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.js";
import AdminQuestions from "./pages/admin/AdminQuestion.js";
import AdminLayout from "./pages/admin/AdminLayout.js";
import AdminTests from "./pages/admin/AdminTest.js";
import AdminStudents from "./pages/admin/AdminStudents.tsx";
import AddExamModal from "./pages/admin/AddExam.js";
import { ProtectedRoute } from "./routes/ProtectedRoute.tsx";
import AdminFeedback from "./pages/admin/components/AdminFeedback.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import AdaptiveLearning from "@/pages/user/AdaptiveLearning";
import Leaderboard from "@/pages/user/Leaderboard.tsx";
import ChatBubble from "@/pages/user/ChatBubble";
import Header from "@/components/Header"; // dùng Header bạn đã tạo
import ExamReviewPage from "./pages/ExamPageReview.tsx";
import MockExams from "./pages/user/Examtest.tsx";
import AdminMockExams from "./pages/admin/AdminMockExams.tsx";
import SystemAssistantChat from "./pages/user/SystemAssistantChat.tsx";
import AdminSchools from "./pages/admin/AdminSchool.tsx";
import AdminSchoolManagers from "./pages/admin/AdminSchoolManagers.tsx";
import AdminTeachers from "./pages/admin/AdminTeachers.tsx";
import AdminClassrooms from "./pages/admin/AdminClassrooms.tsx";
import { ImageOff } from "lucide-react";
import ExamApprovalPage from "./pages/admin/ExamApprovalPage.tsx";
import AdminProfilePage from "./pages/admin/components/AdminProfilePage.tsx";
import ResultStatsPage from "./pages/admin/AdminResultStatsPage.tsx";
import AdminSchoolYears from "./pages/admin/AdminSchoolYears.tsx";
import AdminArchivedMockExams from "./pages/admin/AdminArchivedMockExams.tsx";
import TeacherRequestPage from "./pages/admin/TeacherRequestPage.tsx";
const queryClient = new QueryClient();

// ============================
// Layout chính
// ============================
const AppLayout = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";
  const isAdminPage = location.pathname.startsWith("/admin");

  if (isLoginPage) {
    return <LoginPage />;
  }
  const mainClassName = isAdminPage
    ? "flex-1 p-0 ml-2"                 // ✅ KHÔNG overflow cho admin
    : "flex-1 p-2 overflow-auto";
  return (
    <div className="flex flex-col min-h-screen w-full">
      {!isAdminPage && <Header />}

      <main className={mainClassName}>
        <Routes>

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/exams" element={<Exams />} />
          <Route
            path="/exams/:id"
            element={
              <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
                <ExamPage />
              </ProtectedRoute>
            }
          />
          <Route path="/results" element={<Results />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/adaptive" element={<AdaptiveLearning />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/exams/:id/review" element={<ExamReviewPage />} />
          <Route path="/mock-exams" element={<MockExams />} />
          <Route
            path="/mock-exams/:id"
            element={
              <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
                <ExamPage isMock />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "school_manager", "teacher"]}
              >
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="addExam" element={<AddExamModal />} />
            <Route path="questions" element={<AdminQuestions />} />
            <Route path="tests" element={<AdminTests />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="AdminMocdata" element={<AdminMockExams />} />
            <Route path="AdminSchool" element={<AdminSchools />} />
            <Route path="AdminTeacher" element={<AdminTeachers />} />
            <Route path="AdminSchoolManagers" element={<AdminSchoolManagers />} />
            <Route path="AdminClassrooms" element={<AdminClassrooms />} />
            <Route path="Examapprove" element={<ExamApprovalPage />} />
            <Route path="result-stats" element={<ResultStatsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="/admin/school-years" element={<AdminSchoolYears />} />
            <Route path="/admin/mock-exams/archive" element={<AdminArchivedMockExams />} />
            <Route path="/admin/teacher-requests" element={<TeacherRequestPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdminPage && <ChatBubble />}
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