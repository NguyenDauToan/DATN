// src/api/api.ts
import axios, { AxiosResponse } from "axios";

// ----------------- Axios instance -----------------
const api = axios.create({
  baseURL: "/api", // dùng proxy Vite dev server
});

// Interceptor thêm token tự động
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    // đảm bảo luôn có headers (cast any để TS không kêu)
    if (!config.headers) {
      config.headers = {} as any;
    }

    (config.headers as any).Authorization = `Bearer ${token}`;
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
// ----------------- Types -----------------
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: "student" | "teacher" | "admin";

  // 👇 thêm 3 field cho học sinh
  grade?: string;        // khối / lớp (ví dụ "6", "7", ...)
  schoolId?: string;     // _id của School
  classroomId?: string;  // _id của Classroom
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

    // 👇 thêm nếu User model có các field này
    grade?: string;
    school?: string;      // hoặc { _id: string; name: string } nếu bạn populate
    classroom?: string;   // tương tự
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
export type AuthUser = LoginResponse["user"];

export type UpdateUserPayload = {
  name?: string;
  grade?: string;
  level?: string;
  schoolId?: string;
  classroomId?: string;
  avatar?: string;
};
export const authAPI = {
  register: (data: RegisterData): Promise<AxiosResponse<LoginResponse>> =>
    api.post<LoginResponse>("/auth/register", data),

  login: (data: LoginData): Promise<AxiosResponse<LoginResponse>> =>
    api.post<LoginResponse>("/auth/login", data),

  // GET /auth/me  -> { user: AuthUser }
  getCurrentUser: (): Promise<AxiosResponse<{ user: AuthUser }>> =>
    api.get<{ user: AuthUser }>("/auth/me"),

  // PUT /auth/update -> { user: AuthUser, token: string }
  updateUser: (
    data: UpdateUserPayload
  ): Promise<AxiosResponse<{ user: AuthUser; token: string }>> =>
    api.put<{ user: AuthUser; token: string }>("/auth/update", data),

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
  create: (data: QuestionData): Promise<AxiosResponse> =>
    api.post("/questions", data),

  // cho phép truyền bộ lọc + all=true
  getAll: (filters?: {
    skill?: string;
    level?: string;
    grade?: string;
    all?: boolean;
  }): Promise<AxiosResponse> => {
    const params: any = {};
    if (filters?.skill) params.skill = filters.skill;
    if (filters?.level) params.level = filters.level;
    if (filters?.grade) params.grade = filters.grade;
    if (filters?.all) params.all = true;

    return api.get("/questions", { params });
  },

  getOne: (id: string): Promise<AxiosResponse> =>
    api.get(`/questions/${id}`),

  update: (id: string, data: QuestionData): Promise<AxiosResponse> =>
    api.put(`/questions/${id}`, data),

  remove: (id: string): Promise<AxiosResponse> =>
    api.delete(`/questions/${id}`),

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
export const mockExamAPI = {
  getAll(params?: { examType?: string; active?: boolean }) {
    return api.get("/mock-exams", { params });
  },
  getDetail(idOrSlug: string) {
    return api.get(`/mock-exams/${idOrSlug}`);
  },
  create(data: any) {
    return api.post("/mock-exams", data);
  },
  update(id: string, data: any) {
    return api.put(`/mock-exams/${id}`, data);
  },
  delete(id: string) {
    return api.delete(`/mock-exams/${id}`);
  },
  getUpcoming: () => api.get("/mock-exams/upcoming"),
};
export const resultAPI = {
  create: (data: ResultData): Promise<AxiosResponse> =>
    api.post("/results", data),

  // thêm options để truyền lên query
  getMyResults: (opts?: {
    onlyCurrentClass?: boolean;
    classroomId?: string;
  }): Promise<AxiosResponse> =>
    api.get("/results/me", { params: opts }),

  getByTest: (testId: string): Promise<AxiosResponse> =>
    api.get(`/results/test/${testId}`),

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

export interface UpcomingExam {
  id: string;
  title: string;
  skill?: string;
  schoolName?: string | null;
  classroomName?: string | null;
  grade?: string | null;
  startTime: string;   // hoặc Date, tuỳ bạn parse
  duration: number;
  examType?: string;
}
export type InProgressExam = {
  _id: string;        // id của document progress
  examId: string;     // id bài thi gốc (Test hoặc MockExam)
  title: string;
  isMock?: boolean;   // true = mockExam, false = test thường
  duration?: number;  // phút
  timeLeft?: number;  // giây còn lại
  skill?: string;     // ví dụ: "Reading", "mixed", "thptqg"
  updatedAt: string;  // ISO date – lần lưu gần nhất
};
export type DashboardMe = {
  quickStats: QuickStats;
  recentActivities: RecentActivity[];
  upcomingExams: UpcomingExam[];
  inProgressExams?: InProgressExam[];   // 👈 THÊM DÒNG NÀY

};

export const dashboardAPI = {
  me: (): Promise<AxiosResponse<DashboardMe>> => api.get("/dashboard/me"),

};
export const examProgressAPI = {
  me: (): Promise<AxiosResponse<InProgressExam[]>> =>
    api.get("/exam-progress/me"),
};
export const examAPI = {
  getStatsByGrade: () => api.get("/exams/stats/by-grade"),
  // ...
};
// ----------------- EXPORT -----------------
export default api;
