// src/api/api.ts
import axios, { AxiosResponse } from "axios";

// ----------------- Axios instance -----------------
const api = axios.create({
  baseURL: "/api", // dùng proxy Vite dev server
});

// Interceptor thêm token tự động
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor xử lý 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("❌ Token hết hạn hoặc không hợp lệ. Logout tự động.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      window.location.href = "/"; // hoặc redirect về login
    }
    return Promise.reject(error);
  }
);

// ----------------- Types -----------------
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: "student" | "teacher" | "admin";
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: "student" | "teacher" | "admin";
    isActive?: boolean;
  };
}

export interface QuestionData {
  content: string;
  type: "multiple_choice" | "fill_blank" | "true_false";
  options?: string[];
  answer: string;
  skill: "grammar" | "vocabulary" | "reading" | "listening";
  level?: "easy" | "medium" | "hard";
}

export interface TestData {
  title: string;
  description?: string;
  questions: string[];
  duration?: number;
}

export interface AnswerItem {
  questionId: string;
  selected: string;
  isCorrect: boolean;
}

export interface ResultData {
  studentId?: string;
  testId: string;
  answers: AnswerItem[];
  score: number;
}

// ----------------- AUTH -----------------
export const authAPI = {
  register: (data: RegisterData): Promise<AxiosResponse<LoginResponse>> =>
    api.post("/auth/register", data),

  login: (data: LoginData): Promise<AxiosResponse<LoginResponse>> =>
    api.post("/auth/login", data),

  getCurrentUser: (): Promise<AxiosResponse<{ user: LoginResponse["user"] }>> =>
    api.get("/auth/me"),

  updateUser: (data: Partial<LoginResponse["user"]>): Promise<AxiosResponse<{ user: LoginResponse["user"] }>> =>
    api.put("/auth/update", data),

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Server logout lỗi (bỏ qua vì token ở localStorage):", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
    }
  },
};

// ----------------- QUESTION -----------------
export interface AIGenerateData {
  grade: string;
  level: string;
  skill: string;
  amount?: number;
}

export const questionAPI = {
  create: (data: QuestionData): Promise<AxiosResponse> => api.post("/questions", data),
  getAll: (): Promise<AxiosResponse> => api.get("/questions"),
  getOne: (id: string): Promise<AxiosResponse> => api.get(`/questions/${id}`),
  update: (id: string, data: QuestionData): Promise<AxiosResponse> => api.put(`/questions/${id}`, data),
  remove: (id: string): Promise<AxiosResponse> => api.delete(`/questions/${id}`),

  generateAI: (data: AIGenerateData): Promise<AxiosResponse> =>
    api.post("/ai", data),
};

// ----------------- TEST -----------------
export const testAPI = {
  getAll: (filters?: { skill?: string; grade?: string; level?: string }): Promise<AxiosResponse> => {
    const params = new URLSearchParams();
    if (filters?.skill) params.append("skill", filters.skill);
    if (filters?.grade) params.append("grade", filters.grade);
    if (filters?.level) params.append("level", filters.level);
    const url = `/exams${params.toString() ? `?${params.toString()}` : ""}`;
    return api.get(url); // token tự gắn
  },

  getOne: (id: string): Promise<AxiosResponse> => api.get(`/exams/${id}`),

  createAI: (data: {
    title?: string;
    description?: string;
    duration: number;
    grade: string;
    level: string;
    skill: string;
    numQuestions: number;
  }): Promise<AxiosResponse> => api.post("/exam-ai/create", data),

  saveExam: (exam: {
    title?: string;
    grade: string;
    skill: string;
    level: string;
    duration: number;
    questions: string[];
  }): Promise<AxiosResponse> => api.post("/exams/save", exam),
};

// ----------------- RESULT -----------------
export const resultAPI = {
  create: (data: ResultData): Promise<AxiosResponse> => api.post("/results", data),
  getMyResults: (): Promise<AxiosResponse> => api.get("/results/me"),
  getByTest: (testId: string): Promise<AxiosResponse> => api.get(`/results/test/${testId}`),
  getLeaderboard: (type: "score" | "attempts" | "speed" = "score") =>
    api.get(`/leaderboard?type=${type}&limit=10`),
};
// ----------------- SKILLS -----------------
export type SkillItem = {
  name: string;
  displayName?: string;
  description?: string;
  questionCount?: number;
  examCount?: number;
};

export const skillsAPI = {
  // GET /api/skills  -> { skills: SkillItem[] }
  getAll: (): Promise<AxiosResponse<{ skills: SkillItem[] }>> => api.get("/skills"),
};

// ----------------- DASHBOARD (student) -----------------
export type QuickStats = {
  completedExams: number;
  accuracyPercent: number;   // %
  studyTimeHours: number;    // hours
};

export type RecentActivity = {
  id: string;
  testTitle: string;
  score: number;
  finishedAt: string;
};

export type UpcomingExam = {
  _id: string;
  title: string;
  startTime: string;
  duration?: number;
  skill?: string;
};
export type DashboardMe = {
  quickStats: QuickStats;
  recentActivities: RecentActivity[];
  upcomingExams: UpcomingExam[];
};

export const dashboardAPI = {
  me: (): Promise<AxiosResponse<DashboardMe>> => api.get("/dashboard/me"),
};
// ----------------- EXPORT -----------------
export default api;
