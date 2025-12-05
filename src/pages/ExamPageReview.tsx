// src/pages/ExamReviewPage.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  TrendingUp,
  Calendar,
  Award,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Headphones,
  Mic,
  BookOpen,
  PenTool,
} from "lucide-react";

type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "reading_cloze"
  | "writing_sentence_order"
  | "writing_paragraph"
  | "speaking";

interface SubQuestion {
  label?: string;
  options: string[];
  correctIndex: number;
}

interface Question {
  _id: string;
  content: string;
  type: QuestionType;
  options?: string[];
  answer: string;
  subQuestions?: SubQuestion[];
  explanation?: string;
  skill?: string;
}

interface ExamData {
  _id: string;
  title: string;
  duration: number;
  questions: Question[];
}

type AnswerValue = string | string[] | null;

interface ReviewLocationState {
  exam: ExamData;
  answers: AnswerValue[];
  score10: number; // thang 10
  correctCount: number; // số item đúng (câu + subQuestion)
  timeUsed: number;
}

// ===== Helpers =====
const normalizeText = (text: string) =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeSentence = (text: string) => normalizeText(text);

const getWritingUserSentence = (
  ans: string | string[] | null | undefined
): string => {
  if (Array.isArray(ans)) return ans.join(" ");
  if (typeof ans === "string") return ans;
  return "";
};

type SkillKey = "listening" | "reading" | "writing" | "speaking";

interface SkillStats {
  correct: number;
  total: number;
}

const ExamReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ReviewLocationState | null;

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <p className="text-slate-700 text-sm">
            Không tìm thấy dữ liệu bài thi để xem lại.
          </p>
          <Button onClick={() => navigate("/exams")}>
            Quay về danh sách bài thi
          </Button>
        </div>
      </div>
    );
  }

  const { exam, answers, score10, correctCount, timeUsed } = state;

  // ===== Tổng số item chấm đúng/sai (giống autoMax bên ExamPage) =====
  const totalItems = useMemo(
    () =>
      exam.questions.reduce((sum, q) => {
        if (q.type === "reading_cloze" && q.subQuestions?.length) {
          return sum + q.subQuestions.length;
        }
        if (q.type === "writing_sentence_order") return sum + 1;

        // Không tính speaking + writing_paragraph vào "câu đúng/sai"
        if (q.type === "speaking" || q.type === "writing_paragraph") {
          return sum;
        }

        // multiple_choice, true_false, fill_blank,...
        return sum + 1;
      }, 0),
    [exam.questions]
  );

  const totalPoints = totalItems;
  const percentage = totalPoints > 0 ? (correctCount / totalPoints) * 100 : 0;
  const passed = percentage >= 50; // hoặc score10 >= 5

  const usedMinutes = Math.floor(timeUsed / 60);
  const usedSeconds = timeUsed % 60;

  // ===== Điểm theo kỹ năng =====
  const skillStats = useMemo(() => {
    const stats: Record<SkillKey, SkillStats> = {
      listening: { correct: 0, total: 0 },
      reading: { correct: 0, total: 0 },
      writing: { correct: 0, total: 0 },
      speaking: { correct: 0, total: 0 },
    };

    const getSkill = (q: Question): SkillKey | null => {
      const s = q.skill?.toLowerCase();
      if (s === "listening") return "listening";
      if (s === "reading") return "reading";
      if (s === "writing") return "writing";
      if (s === "speaking") return "speaking";

      if (q.type === "reading_cloze") return "reading";
      if (q.type === "writing_sentence_order" || q.type === "fill_blank")
        return "writing";

      return null;
    };

    exam.questions.forEach((q, idx) => {
      const skillKey = getSkill(q);
      const ans = answers[idx];

      if (!skillKey) return;

      if (q.type === "reading_cloze" && q.subQuestions?.length) {
        const subAns = Array.isArray(ans) ? (ans as string[]) : [];
        q.subQuestions.forEach((sub, subIdx) => {
          const user = (subAns[subIdx] || "").trim().toLowerCase();
          const correct =
            (sub.options?.[sub.correctIndex] || "").trim().toLowerCase();

          stats[skillKey].total += 1;
          if (user && user === correct) {
            stats[skillKey].correct += 1;
          }
        });
      } else if (q.type === "writing_sentence_order") {
        const userSentence = getWritingUserSentence(ans);
        const correctSentence = String(q.answer || "");
        const userNorm = normalizeSentence(userSentence);
        const correctNorm = normalizeSentence(correctSentence);

        stats[skillKey].total += 1;
        if (userNorm && userNorm === correctNorm) {
          stats[skillKey].correct += 1;
        }
      } else if (q.type === "fill_blank") {
        const userNorm = normalizeText((ans ?? "").toString());
        const correctNorm = normalizeText(String(q.answer ?? ""));

        stats[skillKey].total += 1;
        if (userNorm && userNorm === correctNorm) {
          stats[skillKey].correct += 1;
        }
      }
    });

    return stats;
  }, [exam.questions, answers]);

  // ===== Trắc nghiệm (để vẽ Performance Insights) =====
  const mcStats = useMemo(() => {
    let total = 0;
    let correct = 0;

    exam.questions.forEach((q, idx) => {
      const ans = answers[idx];

      if (
        q.type === "multiple_choice" ||
        q.type === "true_false" ||
        q.type === "reading_cloze"
      ) {
        if (q.type === "reading_cloze" && q.subQuestions?.length) {
          const subAns = Array.isArray(ans) ? (ans as string[]) : [];
          q.subQuestions.forEach((sub, subIdx) => {
            const user = (subAns[subIdx] || "").trim().toLowerCase();
            const corr =
              (sub.options?.[sub.correctIndex] || "").trim().toLowerCase();

            total += 1;
            if (user && user === corr) correct += 1;
          });
        } else {
          total += 1;
          const userNorm = normalizeText((ans ?? "").toString());
          const correctNorm = normalizeText(String(q.answer ?? ""));
          if (userNorm && userNorm === correctNorm) correct += 1;
        }
      }
    });

    return { total, correct };
  }, [exam.questions, answers]);

  // ===== Tự luận (fill_blank + writing_sentence_order) =====
  const essayStats = useMemo(() => {
    let total = 0;
    let correct = 0;

    exam.questions.forEach((q, idx) => {
      const ans = answers[idx];

      if (q.type === "fill_blank") {
        total += 1;
        const userNorm = normalizeText((ans ?? "").toString());
        const correctNorm = normalizeText(String(q.answer ?? ""));
        if (userNorm && userNorm === correctNorm) correct += 1;
      }

      if (q.type === "writing_sentence_order") {
        total += 1;
        const userSentence = getWritingUserSentence(ans);
        const correctSentence = String(q.answer || "");
        const userNorm = normalizeSentence(userSentence);
        const correctNorm = normalizeSentence(correctSentence);
        if (userNorm && userNorm === correctNorm) correct += 1;
      }
    });

    return { total, correct };
  }, [exam.questions, answers]);

  // ============= RENDER =============
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Nút back + thông tin chung */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-slate-200 bg-white/80 hover:bg-slate-50 shadow-sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </Button>
          <div className="text-right text-xs text-slate-500">
            <div>
              Thời gian làm bài: {usedMinutes} phút {usedSeconds} giây
            </div>
            <div>
              Đúng {correctCount}/{totalPoints} • {percentage.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Result Summary */}
        <Card
          className={`mb-2 ${
            passed
              ? "bg-gradient-to-r from-green-50 to-blue-50"
              : "bg-gradient-to-r from-orange-50 to-red-50"
          }`}
        >
          <CardHeader>
            <div className="text-center">
              <div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                  passed ? "bg-green-100" : "bg-orange-100"
                } mb-4`}
              >
                {passed ? (
                  <Trophy className="size-10 text-green-600" />
                ) : (
                  <Award className="size-10 text-orange-600" />
                )}
              </div>
              <CardTitle
                className={`mb-2 ${
                  passed ? "text-green-600" : "text-orange-600"
                }`}
              >
                {passed
                  ? "Chúc mừng! Bạn đã hoàn thành bài kiểm tra"
                  : "Hoàn thành bài kiểm tra"}
              </CardTitle>
              <p className="text-gray-600">{exam.title}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-5xl mb-2">{percentage.toFixed(0)}%</p>
              <p className="text-gray-600 mb-4">
                {score10.toFixed(1)}/10 điểm · {correctCount}/{totalPoints} câu
                đúng
              </p>
              <Progress value={percentage} className="h-3 max-w-md mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-4 text-center">
                <CheckCircle className="size-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl text-green-600 mb-1">{correctCount}</p>
                <p className="text-sm text-gray-600">Đúng</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <XCircle className="size-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl text-red-600 mb-1">
                  {totalPoints - correctCount}
                </p>
                <p className="text-sm text-gray-600">Sai / Bỏ qua</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <Calendar className="size-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl text-blue-600 mb-1">
                  {exam.questions.length}
                </p>
                <p className="text-sm text-gray-600">Số câu hỏi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skill Breakdown */}
        <Card className="mb-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-purple-600" />
              Điểm theo kỹ năng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Listening */}
              {skillStats.listening.total > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Headphones className="size-5 text-blue-600" />
                    <span className="text-blue-600">Nghe (Listening)</span>
                  </div>
                  <p className="text-3xl text-blue-600 mb-2">
                    {skillStats.listening.correct}/
                    {skillStats.listening.total}
                  </p>
                  <Progress
                    value={
                      (skillStats.listening.correct /
                        skillStats.listening.total) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              )}

              {/* Speaking – nếu sau này có mapping correct/total thì thống kê ở đây */}
              {skillStats.speaking.total > 0 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Mic className="size-5 text-green-600" />
                    <span className="text-green-600">Nói (Speaking)</span>
                  </div>
                  <p className="text-3xl text-green-600 mb-2">
                    {skillStats.speaking.correct}/
                    {skillStats.speaking.total}
                  </p>
                  <Progress
                    value={
                      (skillStats.speaking.correct /
                        skillStats.speaking.total) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              )}

              {/* Reading */}
              {skillStats.reading.total > 0 && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="size-5 text-purple-600" />
                    <span className="text-purple-600">Đọc (Reading)</span>
                  </div>
                  <p className="text-3xl text-purple-600 mb-2">
                    {skillStats.reading.correct}/{skillStats.reading.total}
                  </p>
                  <Progress
                    value={
                      (skillStats.reading.correct /
                        skillStats.reading.total) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              )}

              {/* Writing */}
              {skillStats.writing.total > 0 && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <PenTool className="size-5 text-orange-600" />
                    <span className="text-orange-600">Viết (Writing)</span>
                  </div>
                  <p className="text-3xl text-orange-600 mb-2">
                    {skillStats.writing.correct}/{skillStats.writing.total}
                  </p>
                  <Progress
                    value={
                      (skillStats.writing.correct /
                        skillStats.writing.total) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Review */}
        <Card className="mb-2">
          <CardHeader>
            <CardTitle>Chi tiết đáp án</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {exam.questions.map((q, index) => {
                let studentAnswerDisplay = "";
                let isCorrect = false;
                let isAnswered = false;

                const isSubjective =
                  q.type === "writing_paragraph" || q.type === "speaking";

                // Phân loại từng dạng câu hỏi
                if (q.type === "writing_paragraph") {
                  const raw = (answers[index] as string | null) ?? "";
                  studentAnswerDisplay = raw;
                  isAnswered = !!normalizeText(raw);
                  isCorrect = false; // không dùng đúng/sai
                } else if (q.type === "speaking") {
                  const raw = (answers[index] as string | null) ?? "";
                  studentAnswerDisplay = raw; // transcript lưu ở answers[index]
                  isAnswered = !!normalizeText(raw);
                  isCorrect = false;
                } else if (
                  q.type === "reading_cloze" &&
                  q.subQuestions?.length
                ) {
                  const subAns = Array.isArray(answers[index])
                    ? (answers[index] as string[])
                    : [];
                  isAnswered = subAns.some((a) => a && a.trim() !== "");
                  isCorrect =
                    isAnswered &&
                    q.subQuestions.every((sub, i) => {
                      const user = (subAns[i] || "").trim().toLowerCase();
                      const corr =
                        (sub.options?.[sub.correctIndex] || "")
                          .trim()
                          .toLowerCase();
                      return user === corr;
                    });
                } else if (q.type === "writing_sentence_order") {
                  const userSentence = getWritingUserSentence(answers[index]);
                  const correctSentence = String(q.answer || "");
                  const userNorm = normalizeSentence(userSentence);
                  const correctNorm = normalizeSentence(correctSentence);
                  studentAnswerDisplay = userSentence;
                  isAnswered = !!userNorm;
                  isCorrect = isAnswered && userNorm === correctNorm;
                } else {
                  const raw = (answers[index] as string | null) ?? "";
                  const userNorm = normalizeText(raw);
                  const correctNorm = normalizeText(String(q.answer ?? ""));
                  studentAnswerDisplay = raw;
                  isAnswered = !!userNorm;
                  isCorrect = isAnswered && userNorm === correctNorm;
                }

                const cardColor = isSubjective
                  ? isAnswered
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                  : isCorrect
                  ? "border-green-200 bg-green-50"
                  : isAnswered
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-gray-50";

                return (
                  <div
                    key={q._id}
                    className={`p-4 rounded-lg border-2 ${cardColor}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                            isSubjective
                              ? isAnswered
                                ? "bg-blue-600 text-white"
                                : "bg-gray-400 text-white"
                              : isCorrect
                              ? "bg-green-600 text-white"
                              : isAnswered
                              ? "bg-red-600 text-white"
                              : "bg-gray-400 text-white"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </div>
                      {isSubjective ? (
                        isAnswered ? (
                          <Badge className="bg-blue-600">Đã nộp</Badge>
                        ) : (
                          <Badge variant="secondary">Bỏ qua</Badge>
                        )
                      ) : isCorrect ? (
                        <Badge className="bg-green-600">Đúng</Badge>
                      ) : isAnswered ? (
                        <Badge variant="destructive">Sai</Badge>
                      ) : (
                        <Badge variant="secondary">Bỏ qua</Badge>
                      )}
                    </div>

                    {/* Reading Cloze */}
                    {q.type === "reading_cloze" && q.subQuestions?.length ? (
                      <div className="space-y-4">
                        <p className="text-gray-800 mb-3">{q.content}</p>
                        {q.subQuestions.map((sub, subIdx) => {
                          const subAns = Array.isArray(answers[index])
                            ? (answers[index] as string[])
                            : [];
                          const user = (subAns[subIdx] || "").trim();
                          const correctOpt =
                            sub.options[sub.correctIndex] || "";
                          const subCorrect =
                            user &&
                            user.trim().toLowerCase() ===
                              correctOpt.trim().toLowerCase();

                          return (
                            <div
                              key={subIdx}
                              className={`p-3 rounded-md border ${
                                subCorrect
                                  ? "border-green-200 bg-green-50"
                                  : user
                                  ? "border-red-200 bg-red-50"
                                  : "border-gray-200 bg-white"
                              }`}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-800">
                                  {sub.label ||
                                    `Câu ${index + 1}.${subIdx + 1}`}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {subCorrect
                                    ? "Đúng"
                                    : user
                                    ? "Sai"
                                    : "Bỏ qua"}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {sub.options.map((opt, optIndex) => {
                                  const isCorrectOpt =
                                    opt.trim().toLowerCase() ===
                                    correctOpt.trim().toLowerCase();
                                  const isUserOpt =
                                    opt.trim().toLowerCase() ===
                                    user.trim().toLowerCase();

                                  return (
                                    <div
                                      key={optIndex}
                                      className={`p-2 rounded-lg border ${
                                        isCorrectOpt
                                          ? "border-green-600 bg-green-100"
                                          : isUserOpt && !isCorrectOpt
                                          ? "border-red-600 bg-red-100"
                                          : "border-gray-200 bg-white"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {isCorrectOpt && (
                                          <CheckCircle className="size-4 text-green-600" />
                                        )}
                                        {isUserOpt && !isCorrectOpt && (
                                          <XCircle className="size-4 text-red-600" />
                                        )}
                                        <span
                                          className={
                                            isCorrectOpt
                                              ? "text-green-700"
                                              : ""
                                          }
                                        >
                                          {opt}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-800 mb-3">{q.content}</p>

                        {/* Multiple choice + True/False */}
                        {(q.type === "multiple_choice" ||
                          q.type === "true_false") &&
                          q.options && (
                            <div className="space-y-2 mb-3">
                              {q.options.map((option, optIndex) => {
                                const isCorrectOpt =
                                  normalizeText(option) ===
                                  normalizeText(q.answer);
                                const isUserOpt =
                                  normalizeText(option) ===
                                  normalizeText(studentAnswerDisplay);

                                return (
                                  <div
                                    key={optIndex}
                                    className={`p-3 rounded-lg border ${
                                      isCorrectOpt
                                        ? "border-green-600 bg-green-100"
                                        : isUserOpt && !isCorrectOpt
                                        ? "border-red-600 bg-red-100"
                                        : "border-gray-200 bg-white"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isCorrectOpt && (
                                        <CheckCircle className="size-5 text-green-600" />
                                      )}
                                      {isUserOpt && !isCorrectOpt && (
                                        <XCircle className="size-5 text-red-600" />
                                      )}
                                      <span
                                        className={
                                          isCorrectOpt
                                            ? "text-green-700"
                                            : ""
                                        }
                                      >
                                        {option}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        {/* Fill blank + writing_sentence_order */}
                        {(q.type === "fill_blank" ||
                          q.type === "writing_sentence_order") && (
                          <div className="space-y-2">
                            <div
                              className={`p-3 rounded-lg border ${
                                !isAnswered
                                  ? "border-gray-200 bg-white"
                                  : isCorrect
                                  ? "border-green-600 bg-green-100"
                                  : "border-red-600 bg-red-100"
                              }`}
                            >
                              <p className="text-sm text-gray-600 mb-1">
                                Câu trả lời của bạn:
                              </p>
                              <p
                                className={
                                  isCorrect
                                    ? "text-green-700"
                                    : "text-red-700"
                                }
                              >
                                {isAnswered
                                  ? studentAnswerDisplay
                                  : "(Chưa trả lời)"}
                              </p>
                            </div>
                            {!isCorrect && (
                              <div className="p-3 rounded-lg border border-green-600 bg-green-100">
                                <p className="text-sm text-gray-600 mb-1">
                                  Đáp án đúng:
                                </p>
                                <p className="text-green-700">{q.answer}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Writing paragraph */}
                        {q.type === "writing_paragraph" && (
                          <div className="space-y-2">
                            <div className="p-3 rounded-lg border border-blue-200 bg-white">
                              <p className="text-sm text-gray-600 mb-1">
                                Đoạn văn của bạn:
                              </p>
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {isAnswered
                                  ? studentAnswerDisplay
                                  : "(Chưa trả lời)"}
                              </p>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              Câu Writing này được chấm điểm bằng AI/giáo viên,
                              không có đáp án đúng/sai cố định.
                            </p>
                          </div>
                        )}

                        {/* Speaking */}
                        {q.type === "speaking" && (
                          <div className="space-y-2">
                            <div className="p-3 rounded-lg border border-blue-200 bg-white">
                              <p className="text-sm text-gray-600 mb-1">
                                Transcript / nội dung AI nhận được:
                              </p>
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {isAnswered
                                  ? studentAnswerDisplay
                                  : "(Chưa nộp audio hoặc chưa được chấm)"}
                              </p>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              Điểm Speaking được chấm riêng dựa trên bài nói
                              của bạn.
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Giải thích nếu có */}
                    {q.explanation && (
                      <div className="mt-3 p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-900 text-sm">
                        <div className="font-semibold mb-1">Giải thích:</div>
                        <div className="whitespace-pre-wrap">
                          {q.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-purple-600" />
              Phân tích kết quả
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Trắc nghiệm */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Trắc nghiệm</span>
                  <span className="text-sm">
                    {mcStats.correct}/{mcStats.total}
                  </span>
                </div>
                <Progress
                  value={
                    mcStats.total > 0
                      ? (mcStats.correct / mcStats.total) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>

              {/* Tự luận (fill_blank + writing_sentence_order) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Tự luận</span>
                  <span className="text-sm">
                    {essayStats.correct}/{essayStats.total}
                  </span>
                </div>
                <Progress
                  value={
                    essayStats.total > 0
                      ? (essayStats.correct / essayStats.total) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={() => navigate("/dashboard")} size="lg">
            <ArrowLeft className="size-4 mr-2" />
            Quay về
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExamReviewPage;
