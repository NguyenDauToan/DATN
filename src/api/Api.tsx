// src/api/api.ts
import axios, { AxiosResponse } from "axios";

// ----------------- Axios instance -----------------
const api = axios.create({
  baseURL: "http://localhost:5000/api", // backend URL
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
// Dữ liệu backend trả về khi login
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "student" | "teacher" | "admin";
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
  questions: string[]; // array of Question IDs
  duration?: number;
}

export interface AnswerItem {
  questionId: string;
  selected: string;
  isCorrect: boolean;
}

export interface ResultData {
  studentId?: string; // optional, backend lấy từ token
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
  
    // ✅ Thêm hàm updateUser
    updateUser: (data: Partial<LoginResponse["user"]>): Promise<AxiosResponse<{ user: LoginResponse["user"] }>> =>
      api.put("/auth/update", data),
  
    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
    },
  };
  


// ----------------- QUESTION -----------------
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
  
    // 🌟 Gọi API AI tạo câu hỏi tự động
    generateAI: (data: AIGenerateData): Promise<AxiosResponse> =>
        api.post("/ai", data),
  };
  

  export const testAPI = {
    /* =========================
       📘 1. Lấy tất cả bài thi (có thể lọc)
       ========================= */
    getAll: (filters?: { skill?: string; grade?: string; level?: string }): Promise<AxiosResponse> => {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
  
      if (filters?.skill) params.append("skill", filters.skill);
      if (filters?.grade) params.append("grade", filters.grade);
      if (filters?.level) params.append("level", filters.level);
  
      const url = `/exams${params.toString() ? `?${params.toString()}` : ""}`;
  
      console.log("📡 GET", url, "with token:", token);
  
      return api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  
    /* =========================
       📄 2. Lấy chi tiết 1 bài thi
       ========================= */
    getOne: (id: string): Promise<AxiosResponse> => {
      const token = localStorage.getItem("token");
      console.log(`📡 GET /exams/${id} with token:`, token);
      return api.get(`/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  
    /* =========================
       🤖 3. Tạo bài thi bằng AI
       ========================= */
    createAI: (data: {
      title?: string;
      description?: string;
      duration: number;
      grade: string;
      level: string;
      skill: string;
      numQuestions: number;
    }): Promise<AxiosResponse> => {
      const token = localStorage.getItem("token");
      console.log("🤖 POST /exam-ai/create with data:", data);
      return api.post("/exam-ai/create", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    saveExam: (exam: {
      title?: string;
      grade: string;
      skill: string;
      level: string;
      duration: number;
      questions: string[]; // mảng _id câu hỏi
    }): Promise<AxiosResponse> => {
      const token = localStorage.getItem("token");
      console.log("💾 POST /exams/save with data:", exam);
      return api.post("/exams/save", exam, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  };


// ----------------- RESULT -----------------
export const resultAPI = {
  create: (data: ResultData): Promise<AxiosResponse> => api.post("/results", data),
  getMyResults: (): Promise<AxiosResponse> => api.get("/results/me"),
  getByTest: (testId: string): Promise<AxiosResponse> => api.get(`/results/exam/${testId}`),
};

export default api;
