// src/pages/ExamReviewPage.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios"; // nếu không dùng có thể xoá
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";

type QuestionType = "multiple_choice" | "true_false" | "fill_blank";

interface Question {
  _id: string;
  content: string;
  type: QuestionType;
  options?: string[];
  answer: string;
}

interface ExamData {
  _id: string;
  title: string;
  duration: number;
  questions: Question[];
}

interface ReviewLocationState {
  exam: ExamData;
  answers: (string | null)[];
  score: number;
  timeUsed: number;
}

const ExamReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ReviewLocationState | null;

  if (!state) {
    // Không có dữ liệu (F5, vào thẳng URL) thì quay về danh sách
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <p className="text-slate-700 text-sm">
            Không tìm thấy dữ liệu bài thi để xem lại.
          </p>
          <Button onClick={() => navigate("/exams")}>Quay về danh sách bài thi</Button>
        </div>
      </div>
    );
  }

  const { exam, answers, score, timeUsed } = state;

  const [currentIndex, setCurrentIndex] = useState(0);

  const question = exam.questions[currentIndex];
  const totalQuestions = exam.questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const rawUserAnswer = answers[currentIndex];
  const userAnswerNorm = rawUserAnswer?.trim().toLowerCase() || "";
  const correctAnswerNorm = String(question.answer).trim().toLowerCase();
  const isAnswered = !!userAnswerNorm;
  const isCorrect = isAnswered && userAnswerNorm === correctAnswerNorm;

  const percentage = (score / totalQuestions) * 100;
  const usedMinutes = Math.floor(timeUsed / 60);
  const usedSeconds = timeUsed % 60;

  const handlePrevious = () =>
    setCurrentIndex((prev) => Math.max(prev - 1, 0));

  const handleNext = () =>
    setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
        {/* HEADER CHUNG */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-slate-200 bg-white/80 hover:bg-slate-50 shadow-sm"
            onClick={() => navigate("/exams")}
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </Button>

          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              Điểm:{" "}
              <span className="font-semibold text-slate-900">
                {score}/{totalQuestions} ({percentage.toFixed(0)}%)
              </span>
            </span>
            <span className="text-xs text-slate-400">
              Câu {currentIndex + 1}/{totalQuestions}
            </span>
            <span className="text-xs text-slate-400">
              Thời gian làm bài: {usedMinutes} phút {usedSeconds} giây
            </span>
          </div>
        </div>

        {/* HAI CỘT: ĐỀ THI + ĐIỀU HƯỚNG */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* CỘT TRÁI: NỘI DUNG XEM LẠI */}
          <div className="flex-1 space-y-6">
            {/* Header bài thi */}
            <Card className="shadow-md rounded-3xl bg-white/90 border border-slate-200">
              <CardHeader className="p-5 border-b border-slate-100">
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-xl md:text-2xl font-bold text-slate-900">
                    {exam.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                      Xem lại bài thi
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {totalQuestions} câu hỏi
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-xs ${
                        percentage >= 70
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {percentage >= 70 ? "Đạt" : "Không đạt"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Progress
                      value={(score / totalQuestions) * 100}
                      className="h-2 rounded-full bg-slate-100"
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Thẻ câu hỏi + kết quả */}
            <Card className="shadow-lg rounded-3xl bg-white/95 border border-slate-200">
              <CardHeader className="pb-3 px-5 pt-5">
                <div className="flex items-center justify-between gap-3">
                  {/* Câu số */}
                  <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-3 py-1 shadow-sm">
                    <span className="text-[11px] uppercase tracking-wide text-sky-500 mr-1">
                      Câu
                    </span>
                    <span className="text-sm font-semibold text-sky-700">
                      {currentIndex + 1}
                    </span>
                  </span>

                  {/* Nhãn kết quả câu này */}
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                      !isAnswered
                        ? "bg-slate-50 text-slate-600 border-slate-200"
                        : isCorrect
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {!isAnswered && "Chưa trả lời"}
                    {isAnswered && isCorrect && (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Đúng
                      </>
                    )}
                    {isAnswered && !isCorrect && (
                      <>
                        <XCircle className="w-3 h-3" /> Sai
                      </>
                    )}
                  </span>
                </div>

                <CardTitle className="mt-3 text-lg md:text-xl font-semibold text-slate-900 leading-relaxed">
                  {question.content}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-5 pb-5 pt-1 space-y-4">
                {/* Multiple Choice */}
                {question.type === "multiple_choice" &&
                  question.options &&
                  question.options.length > 0 && (
                    <div className="grid gap-3">
                      {question.options.map((opt, idx) => {
                        const optNorm = opt.trim().toLowerCase();
                        const isCorrectOption = optNorm === correctAnswerNorm;
                        const isUserOption = optNorm === userAnswerNorm;

                        let optionClasses =
                          "justify-start text-left py-3.5 px-4 rounded-2xl text-sm md:text-base border transition-all duration-150 flex items-center gap-3";

                        if (isCorrectOption) {
                          optionClasses +=
                            " bg-emerald-500 text-white border-emerald-600 shadow-md";
                        } else if (isUserOption && !isCorrectOption) {
                          optionClasses +=
                            " bg-rose-500 text-white border-rose-600 shadow-md";
                        } else {
                          optionClasses +=
                            " bg-white border-slate-200 text-slate-800";
                        }

                        return (
                          <div key={idx} className={optionClasses}>
                            <span
                              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${
                                isCorrectOption || isUserOption
                                  ? "bg-black/10"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            <span className="ml-2">
                              {isCorrectOption && (
                                <CheckCircle2 className="w-5 h-5 opacity-90" />
                              )}
                              {isUserOption && !isCorrectOption && (
                                <XCircle className="w-5 h-5 opacity-90" />
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* True / False */}
                {question.type === "true_false" && (
                  <div className="grid grid-cols-2 gap-3">
                    {["true", "false"].map((val) => {
                      const label = val === "true" ? "Đúng" : "Sai";
                      const isCorrectOption = correctAnswerNorm === val;
                      const isUserOption = userAnswerNorm === val;

                      let btnClasses =
                        "py-3.5 rounded-2xl text-sm md:text-base border transition-all duration-150 flex items-center justify-center gap-2";

                      if (isCorrectOption) {
                        btnClasses +=
                          " bg-emerald-500 text-white border-emerald-600 shadow-md";
                      } else if (isUserOption && !isCorrectOption) {
                        btnClasses +=
                          " bg-rose-500 text-white border-rose-600 shadow-md";
                      } else {
                        btnClasses +=
                          " bg-white border-slate-200 text-slate-800";
                      }

                      return (
                        <div key={val} className={btnClasses}>
                          {val === "true" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          <span>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fill Blank */}
                {question.type === "fill_blank" && (
                  <div className="space-y-3 text-sm md:text-base">
                    <div
                      className={`px-3 py-2 rounded-2xl border ${!isAnswered
                        ? "bg-slate-50 border-slate-200 text-slate-500"
                        : isCorrect
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                    >
                      <span className="font-semibold">Câu trả lời của bạn: </span>
                      <span>
                        {isAnswered ? rawUserAnswer : "(Chưa trả lời)"}
                      </span>
                    </div>
                    <div className="px-3 py-2 rounded-2xl border bg-sky-50 border-sky-200 text-sky-900">
                      <span className="font-semibold">Đáp án đúng: </span>
                      <span>{question.answer}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nút chuyển câu */}
            <div className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                variant="outline"
                className="flex items-center gap-2 rounded-2xl py-3 px-4 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" /> Câu trước
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === totalQuestions - 1}
                className="flex items-center gap-2 rounded-2xl py-3 px-5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Câu tiếp <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* CỘT PHẢI: ĐIỀU HƯỚNG CÂU HỎI */}
          <div className="lg:w-64 xl:w-72 w-full lg:sticky lg:top-24 h-fit">
            <Card className="bg-white/90 border border-slate-200 shadow-md rounded-2xl p-4">
              <p className="text-xs font-semibold mb-3 text-slate-600 text-center uppercase tracking-wide">
                Điều hướng câu hỏi
              </p>
              <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-5 gap-2 justify-items-center">
                {exam.questions.map((q, idx) => {
                  const ans = answers[idx];
                  const ansNorm = ans?.trim().toLowerCase() || "";
                  const correctNorm = String(q.answer).trim().toLowerCase();
                  const answered = !!ansNorm;
                  const correct = answered && ansNorm === correctNorm;
                  const isCurrent = idx === currentIndex;

                  let baseClasses =
                    "relative w-9 h-9 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center";
                  let stateClasses = "";

                  if (isCurrent) {
                    stateClasses =
                      "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow";
                  } else if (!answered) {
                    stateClasses =
                      "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100";
                  } else if (correct) {
                    stateClasses =
                      "bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600 shadow";
                  } else {
                    stateClasses =
                      "bg-rose-500 text-white border border-rose-600 hover:bg-rose-600 shadow";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`${baseClasses} ${stateClasses}`}
                    >
                      <span>{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamReviewPage;
