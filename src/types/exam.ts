// Trình độ CEFR (dành cho tiếng Anh)
export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

// Lớp học (dành cho học sinh)
export type Grade = "6" | "7" | "8" | "9" | "10" | "11" | "12";

// Kỹ năng thi
export type Skill = "listening" | "reading" | "writing" | "speaking";

// Câu hỏi trong bài thi
export type QuestionType = "multiple_choice" | "fill_blank" | "true_false";

export interface Question {
  _id?: string;
  id: number;
  type: QuestionType;
  question: string;
  content?: string;
  options?: string[];
  answer?: string | number;
  userAnswer?: string | number;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;

  skill?: Skill;
  level?: Level;
  grade?: Grade;
  correctAnswer?: string; // thêm vào cho TS
}

// Bài thi
export interface Exam {
  _id: string;
  title: string;
  skill: Skill;
  level?: Level; // Cho phép null/undefined nếu chỉ dùng grade
  grade?: Grade; // Cho phép null/undefined nếu chỉ dùng level
  duration: number; // phút
  questionsCount: number;
  questions: Question[];
  description: string;
  difficulty: "easy" | "medium" | "hard";
  completed?: boolean;
  score?: number;
  audioUrl?: string;
}

// Kết quả thi
export interface ExamResult {
  examId: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number; // giây
  completedAt: Date;
  answers: Question[];
}
