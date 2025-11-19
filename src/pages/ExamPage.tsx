// src/pages/ExamPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
  RotateCcw,
  Flag,
} from "lucide-react";

// ================= TYPES =================

type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "reading_cloze";

interface ReadingSubQuestion {
  label?: string;
  options: string[];
  correctIndex: number;
}

type AnswerValue = string | null | string[];

interface Question {
  _id: string;
  content: string;
  type: QuestionType;
  options?: string[];
  answer: string;
  subQuestions?: ReadingSubQuestion[];
}

interface ExamPageProps {
  isMock?: boolean;
}

interface ExamData {
  _id: string;
  title: string;
  duration: number; // phút
  questions: Question[];
}

// Chuẩn hóa dữ liệu từ backend
const normalizeQuestions = (rawQuestions: any[]): Question[] => {
  return (rawQuestions || []).map((item: any, idxQ: number) => {
    const q = item.question || item;

    // reading_cloze
    if (
      q.type === "reading_cloze" &&
      Array.isArray(q.subQuestions) &&
      q.subQuestions.length > 0
    ) {
      const normalizedSubs: ReadingSubQuestion[] = q.subQuestions.map(
        (sub: any) => ({
          label: sub.label,
          options: Array.isArray(sub.options) ? sub.options : [],
          correctIndex:
            typeof sub.correctIndex === "number" ? sub.correctIndex : 0,
        })
      );

      const question: Question = {
        _id: q._id || String(q.questionNumber || idxQ + 1),
        content: q.content,
        type: "reading_cloze",
        options: [],
        answer: "",
        subQuestions: normalizedSubs,
      };

      return question;
    }

    // Các loại câu hỏi bình thường
    const optsObj = q.options || {};
    const optionsArr: string[] = Array.isArray(q.options)
      ? q.options
      : [optsObj.A, optsObj.B, optsObj.C, optsObj.D].filter(Boolean);

    let answerText = "";

    if (typeof q.answer === "string" && q.answer.trim()) {
      answerText = q.answer;
    } else if (typeof q.correctIndex === "number" && optionsArr[q.correctIndex]) {
      answerText = optionsArr[q.correctIndex];
    } else if (q.correctOption) {
      const idx = ["A", "B", "C", "D"].indexOf(
        String(q.correctOption).toUpperCase()
      );
      if (idx >= 0 && optionsArr[idx]) answerText = optionsArr[idx];
    }

    const question: Question = {
      _id: q._id || String(q.questionNumber || idxQ + 1),
      content: q.content,
      type: (q.type as QuestionType) || "multiple_choice",
      options: optionsArr,
      answer: answerText,
    };

    return question;
  });
};

// ================= COMPONENT =================

const ExamPage = ({ isMock = false }: ExamPageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerValue[]>([]);
  const [flags, setFlags] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // ⏱ Thời gian còn lại (giây) và thời gian đã dùng (giây)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeUsed, setTimeUsed] = useState<number>(0);
  const isCriticalTime = (timeLeft ?? 0) <= 90;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // === PROGRESS: hàm build payload answers, dùng chung cho saveProgress + saveResult
  const buildAnswersPayload = (examData: ExamData, ans: AnswerValue[]) => {
    return examData.questions.map((q, idx) => {
      const value = ans[idx];

      if (q.type === "reading_cloze") {
        const arr = Array.isArray(value) ? value : [];
        const safeArray = q.subQuestions?.map((_, i) => arr[i] ?? "") ?? [];
        return {
          questionId: q._id,
          answer: JSON.stringify(safeArray),
        };
      }

      return {
        questionId: q._id,
        answer: (value ?? "").toString(),
      };
    });
  };

  // === PROGRESS: lưu trạng thái đang làm
  const saveProgress = async () => {
    if (!exam || showResult) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const answersPayload = buildAnswersPayload(exam, answers);

      const payload: any = {
        answers: answersPayload,
        currentIndex,
        timeUsed,
        timeLeft: timeLeft ?? 0,
        ...(isMock ? { mockExamId: exam._id } : { testId: exam._id }),
      };

      await axios.post("/api/exam-progress/save", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Lỗi lưu trạng thái bài thi:", err);
    }
  };

  // === PROGRESS: tự động lưu mỗi khi answers / currentIndex / timeLeft đổi (debounce 5s)
  useEffect(() => {
    if (!exam || showResult) return;

    const timeout = setTimeout(() => {
      console.log("AUTO SAVE exam-progress"); // debug
      saveProgress();
    }, 5000);

    return () => clearTimeout(timeout);
  }, [answers, currentIndex, exam, showResult]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        if (!id) {
          navigate(isMock ? "/mock-exams" : "/exams");
          return;
        }

        const url = isMock ? `/api/mock-exams/${id}` : `/api/exams/${id}`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Chuẩn hóa examData
        const raw = isMock ? res.data.exam || res.data : res.data;
        const mappedQuestions = normalizeQuestions(raw.questions || []);

        const examData: ExamData = {
          _id: raw._id,
          title: isMock ? raw.name : raw.title,
          duration: raw.duration || 60,
          questions: mappedQuestions,
        };

        setExam(examData);

        // === PROGRESS: thử khôi phục tiến độ đang làm dở
        let restored = false;
        try {
          const progressRes = await axios.get(
            "/api/exam-progress/by-exam",
            {
              headers: { Authorization: `Bearer ${token}` },
              params: isMock
                ? { mockExamId: examData._id }
                : { testId: examData._id },
            }
          );

          const prog = progressRes.data; // giả định: null hoặc {answers, currentIndex, timeUsed, timeLeft}
          if (prog && Array.isArray(prog.answers)) {
            const restoredAnswers: AnswerValue[] = examData.questions.map((q) => {
              const item = prog.answers.find(
                (a: any) => a.questionId === q._id
              );
              if (!item) return null;

              if (q.type === "reading_cloze") {
                try {
                  return JSON.parse(item.answer || "[]");
                } catch {
                  return [];
                }
              }
              return item.answer ?? "";
            });

            setAnswers(restoredAnswers);
            setFlags(Array(examData.questions.length).fill(false));
            setCurrentIndex(prog.currentIndex ?? 0);
            setTimeUsed(prog.timeUsed ?? 0);
            setTimeLeft(
              typeof prog.timeLeft === "number"
                ? prog.timeLeft
                : examData.duration * 60
            );

            restored = true;
          }
        } catch (err) {
          console.warn("Không khôi phục được trạng thái bài thi:", err);
        }

        // nếu không có progress -> khởi tạo mới
        if (!restored) {
          setAnswers(Array(examData.questions.length).fill(null));
          setFlags(Array(examData.questions.length).fill(false));
          setTimeLeft(examData.duration * 60);
          setTimeUsed(0);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error(err);
        alert("Không tải được bài thi");
        navigate(isMock ? "/mock-exams" : "/exams");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchExam();
  }, [id, navigate, isMock]);

  // Timer + auto nộp khi hết giờ
  useEffect(() => {
    if (showResult) return;
    if (timeLeft === null) return;
    if (!exam) return;

    if (timeLeft <= 0) {
      gradeExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : prev));
      setTimeUsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, showResult, exam]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-300 border-t-sky-500 rounded-full animate-spin mx-auto shadow-md" />
          <p className="mt-5 text-sky-700 text-lg font-semibold">
            Đang tải bài thi...
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );

  if (!exam) return null;
  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">
          Đề thi này chưa có câu hỏi. Vui lòng kiểm tra lại cấu hình đề.
        </p>
      </div>
    );
  }

  const question = exam.questions[currentIndex];
  const progress = ((currentIndex + 1) / exam.questions.length) * 100;

  const handleSelect = (value: string) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentIndex] = value;
      return copy;
    });
  };

  const handleSelectSub = (subIndex: number, value: string) => {
    setAnswers((prev) => {
      const copy = [...prev];
      const current = Array.isArray(copy[currentIndex])
        ? [...(copy[currentIndex] as string[])]
        : [];
      current[subIndex] = value;
      copy[currentIndex] = current;
      return copy;
    });
  };

  const gradeExam = async () => {
    const s = calculateScore();
    setScore(s);
    setShowResult(true);
    await saveResultToServer();
  };

  const handleNext = () => {
    if (currentIndex < exam.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      gradeExam();
    }
  };

  const handlePrevious = () =>
    setCurrentIndex((prev) => Math.max(prev - 1, 0));

  const handleRestart = () => {
    if (!exam) return;
    setCurrentIndex(0);
    setAnswers(Array(exam.questions.length).fill(null));
    setFlags(Array(exam.questions.length).fill(false));
    setShowResult(false);
    setScore(0);
    setTimeLeft(exam.duration * 60);
    setTimeUsed(0);
  };

  const handleSubmitAll = () => {
    const confirmSubmit = window.confirm(
      "Bạn có chắc chắn muốn nộp bài?\nNhững câu chưa trả lời sẽ được tính là sai."
    );
    if (!confirmSubmit) return;
    gradeExam();
  };

  const calculateScore = () => {
    if (!exam) return 0;
    let s = 0;

    exam.questions.forEach((q, idx) => {
      if (q.type === "reading_cloze" && q.subQuestions?.length) {
        const ansArray = Array.isArray(answers[idx])
          ? (answers[idx] as string[])
          : [];
        q.subQuestions.forEach((sub, subIdx) => {
          const correct =
            sub.options?.[sub.correctIndex] ??
            "".toString().trim().toLowerCase();
          const user = (ansArray[subIdx] ?? "").trim().toLowerCase();
          if (correct && user === correct) s += 1;
        });
      } else {
        const userAnswer = (answers[idx] ?? "")
          .toString()
          .trim()
          .toLowerCase();
        const correctAnswer = String(q.answer ?? "")
          .trim()
          .toLowerCase();
        if (userAnswer === correctAnswer) s += 1;
      }
    });

    return s;
  };

  // Gửi kết quả lên backend để lưu vào collection Result
  const saveResultToServer = async () => {
    if (!exam) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("Không có token, không thể lưu kết quả");
        return;
      }

      const answersPayload = buildAnswersPayload(exam, answers);

      const payload: any = {
        timeSpent: timeUsed,
        answers: answersPayload,
        ...(isMock ? { mockExamId: exam._id } : { testId: exam._id }),
      };

      await axios.post("/api/results", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // === PROGRESS: nộp bài xong thì xoá trạng thái đang làm dở
      try {
        await axios.post(
          "/api/exam-progress/finish",
          isMock ? { mockExamId: exam._id } : { testId: exam._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.warn("Không xoá được exam-progress sau khi nộp:", err);
      }
    } catch (err) {
      console.error("Lỗi lưu kết quả vào /api/results:", err);
    }
  };

  const toggleFlagCurrent = () => {
    setFlags((prev) => {
      const copy = [...prev];
      copy[currentIndex] = !copy[currentIndex];
      return copy;
    });
  };

  const totalItems = exam.questions.reduce((sum, q) => {
    if (q.type === "reading_cloze" && q.subQuestions?.length) {
      return sum + q.subQuestions.length;
    }
    return sum + 1;
  }, 0);

  if (showResult) {
    const totalQuestions = totalItems;
    const correctCount = score;
    const score10 = (correctCount / totalQuestions) * 10;
    const percentage = (correctCount / totalQuestions) * 100;
    const isPassed = score10 >= 5;
    const usedMinutes = Math.floor(timeUsed / 60);
    const usedSeconds = timeUsed % 60;

    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50 py-10 px-4 flex justify-center items-center">
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden max-w-xl w-full bg-white/90 backdrop-blur">
          <CardHeader className="text-center bg-gradient-to-r from-sky-500 to-indigo-500 text-white py-10 relative">
            <div className="absolute inset-0 bg-black/10 rounded-t-3xl" />
            <div className="relative z-10 mb-4">
              {isPassed ? (
                <CheckCircle2 className="w-20 h-20 mx-auto text-emerald-300" />
              ) : (
                <XCircle className="w-20 h-20 mx-auto text-rose-200" />
              )}
            </div>

            <CardTitle className="relative z-10 text-2xl md:text-3xl font-bold mb-1">
              {exam.title}
            </CardTitle>

            <div className="relative z-10 mt-2 flex flex-col items-center gap-1">
              <span className="inline-flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">
                  {score10.toFixed(1)}
                </span>
                <span className="text-lg opacity-80">/ 10</span>
              </span>

              <span className="text-sm text-slate-100/90">
                {correctCount}/{totalQuestions} câu đúng •{" "}
                {percentage.toFixed(0)}%
              </span>

              <span
                className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${isPassed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
                  }`}
              >
                {isPassed ? "Đạt" : "Không đạt"}
              </span>
            </div>

            <p className="text-xs mt-3 relative z-10 text-slate-100/80">
              Thời gian làm bài: {usedMinutes} phút {usedSeconds} giây
            </p>
          </CardHeader>

          <CardContent className="py-6 px-6 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button
              onClick={handleRestart}
              size="lg"
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-2xl shadow-md flex items-center gap-2 justify-center w-full sm:w-auto"
            >
              <RotateCcw className="w-5 h-5" /> Làm lại
            </Button>

            <Button
              onClick={() =>
                navigate(`/exams/${exam._id}/review`, {
                  state: {
                    exam,
                    answers,
                    score10,
                    correctCount,
                    timeUsed,
                  },
                })
              }
              size="lg"
              variant="outline"
              className="rounded-2xl border-sky-200 text-slate-800 bg-white hover:bg-slate-50 w-full sm:w-auto"
            >
              Xem lại bài thi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ================= RENDER MAIN =================

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-5">
        {/* HEADER */}
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-slate-200 bg-white/90 hover:bg-slate-50 shadow-sm"
                onClick={() => navigate(isMock ? "/mock-exams" : "/exams")}
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" />
              </Button>

              <div className="flex flex-col min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">
                  {exam.title}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-slate-600">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                    Bài thi trắc nghiệm
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {exam.questions.length} câu hỏi
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                    Thời lượng: {exam.duration} phút
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                Câu
                <span className="font-semibold text-slate-800">
                  {currentIndex + 1}/{exam.questions.length}
                </span>
              </span>
              <span className="text-[11px] text-slate-400">
                {progress.toFixed(0)}% hoàn thành
              </span>
            </div>
          </div>

          <div className="w-full">
            <Progress
              value={progress}
              className="h-2 rounded-full bg-slate-100"
            />
          </div>
        </header>

        <main className="grid gap-3 lg:grid-cols-[minmax(0,2.5fr)_minmax(260px,0.8fr)] items-start">
          {/* LEFT */}
          <section className="space-y-4">
            <Card className="shadow-lg rounded-3xl bg-white/95 border border-slate-200">
              <CardHeader className="pb-3 px-5 pt-5 border-b border-slate-100/60">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-3 py-1 shadow-sm">
                    <span className="text-[11px] uppercase tracking-wide text-sky-500 mr-1">
                      Câu
                    </span>
                    <span className="text-sm font-semibold text-sky-700">
                      {currentIndex + 1}
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline text-[11px] uppercase tracking-wide text-slate-400">
                      {question.type === "multiple_choice" &&
                        "Chọn đáp án đúng"}
                      {question.type === "true_false" && "Đúng / Sai"}
                      {question.type === "fill_blank" && "Điền vào chỗ trống"}
                      {question.type === "reading_cloze" &&
                        "Đọc đoạn văn và chọn đáp án cho từng chỗ trống"}
                    </span>

                    <Button
                      type="button"
                      variant={flags[currentIndex] ? "outline" : "ghost"}
                      size="icon"
                      className={`h-8 w-8 rounded-full border flex items-center justify-center ${flags[currentIndex]
                        ? "border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100"
                        : "border-amber-200 text-amber-500 hover:bg-amber-50"
                        }`}
                      onClick={toggleFlagCurrent}
                      title={
                        flags[currentIndex]
                          ? "Bỏ đánh dấu"
                          : "Đánh dấu xem lại"
                      }
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <CardTitle
                  className={`mt-4 whitespace-pre-line leading-relaxed text-slate-900 normal-case ${question.type === "reading_cloze"
                    ? "text-base md:text-lg"
                    : "text-lg md:text-xl"
                    }`}
                >
                  {question.type === "reading_cloze" ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-4 border border-slate-100 text-slate-900 normal-case font-normal">
                      {question.content}
                    </div>
                  ) : (
                    <span className="normal-case font-normal">{question.content}</span>
                  )}
                </CardTitle>

              </CardHeader>

              <CardContent className="px-5 pb-5 pt-4 space-y-4">
                {/* reading_cloze */}
                {question.type === "reading_cloze" &&
                  question.subQuestions &&
                  question.subQuestions.length > 0 && (
                    <div className="mt-2 space-y-5">
                      {question.subQuestions.map((sub, subIdx) => {
                        const subAnswers = Array.isArray(answers[currentIndex])
                          ? (answers[currentIndex] as string[])
                          : [];
                        const selected = subAnswers[subIdx] || "";

                        return (
                          <div
                            key={subIdx}
                            className="border-t border-slate-100 pt-4"
                          >
                            <p className="text-sm font-semibold text-slate-800 mb-3">
                              {sub.label ||
                                `Question ${currentIndex + 1}.${subIdx + 1}`}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {sub.options.map((opt, optIdx) => {
                                const active = selected === opt;
                                return (
                                  <Button
                                    key={optIdx}
                                    type="button"
                                    variant={active ? "default" : "outline"}
                                    className={`h-full w-full py-3 px-2 rounded-2xl text-xs md:text-sm transition-all duration-150 ${active
                                      ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md border-0"
                                      : "bg-white hover:bg-sky-50 border-slate-200 hover:border-sky-200"
                                      }`}
                                    onClick={() => handleSelectSub(subIdx, opt)}
                                  >
                                    <span className="flex flex-row items-center justify-center gap-3">
                                      <span
                                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${active
                                          ? "bg-white/20"
                                          : "bg-slate-100 text-slate-700"
                                          }`}
                                      >
                                        {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <span className="text-sm md:text-base">
                                        {opt}
                                      </span>
                                    </span>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* Multiple choice */}
                {question.type === "multiple_choice" &&
                  question.options &&
                  question.options.length > 0 && (
                    <div className="grid gap-3">
                      {question.options.map((opt, idx) => {
                        const active = answers[currentIndex] === opt;
                        return (
                          <Button
                            key={idx}
                            type="button"
                            variant={active ? "default" : "outline"}
                            className={`justify-start text-left py-3.5 px-4 rounded-2xl text-sm md:text-base transition-all duration-150 ${active
                              ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md border-0"
                              : "bg-white hover:bg-sky-50 border-slate-200 hover:border-sky-200"
                              }`}
                            onClick={() => handleSelect(opt)}
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${active
                                  ? "bg-white/20"
                                  : "bg-slate-100 text-slate-700"
                                  }`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span>{opt}</span>
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  )}

                {/* True / False */}
                {question.type === "true_false" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={
                        answers[currentIndex] === "true" ? "default" : "outline"
                      }
                      className={`py-3.5 rounded-2xl text-sm md:text-base transition-all duration-150 ${answers[currentIndex] === "true"
                        ? "bg-emerald-500 text-white shadow-md border-0"
                        : "bg-white hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300"
                        }`}
                      onClick={() => handleSelect("true")}
                    >
                      <CheckCircle2 className="inline w-4 h-4 mr-2" /> Đúng
                    </Button>
                    <Button
                      type="button"
                      variant={
                        answers[currentIndex] === "false"
                          ? "default"
                          : "outline"
                      }
                      className={`py-3.5 rounded-2xl text-sm md:text-base transition-all duration-150 ${answers[currentIndex] === "false"
                        ? "bg-rose-500 text-white shadow-md border-0"
                        : "bg-white hover:bg-rose-50 border-rose-200 hover:border-rose-300"
                        }`}
                      onClick={() => handleSelect("false")}
                    >
                      <XCircle className="inline w-4 h-4 mr-2" /> Sai
                    </Button>
                  </div>
                )}

                {/* Fill blank */}
                {question.type === "fill_blank" && (
                  <Input
                    type="text"
                    className="h-12 text-base rounded-2xl border-2 border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all duration-150"
                    value={(answers[currentIndex] as string) || ""}
                    onChange={(e) => handleSelect(e.target.value)}
                    placeholder="Nhập câu trả lời..."
                  />
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between gap-3 pt-1">
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
                className="flex items-center gap-2 rounded-2xl py-3 px-5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white shadow-md"
              >
                {currentIndex === exam.questions.length - 1 ? (
                  <>
                    <Send className="w-4 h-4" /> Nộp &amp; xem kết quả
                  </>
                ) : (
                  <>
                    Câu tiếp <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </section>

          {/* RIGHT */}
          <aside className="lg:sticky lg:top-24 space-y-4 lg:w-72">
            {/* Điều hướng câu hỏi */}
            <Card className="bg-white/90 border border-slate-200 shadow-md rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold mb-3 text-slate-600 text-center tracking-wide">
                Điều hướng câu hỏi
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {exam.questions.map((_, idx) => {
                  const isCurrent = idx === currentIndex;
                  const answered = !!answers[idx];
                  const flagged = flags[idx];

                  const baseClasses =
                    "relative w-9 h-9 rounded-xl text-xs font-medium transition-all duration-150 flex items-center justify-center";
                  let stateClasses = "";

                  if (isCurrent) {
                    stateClasses =
                      "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow";
                  } else if (answered) {
                    stateClasses =
                      "bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600 shadow";
                  } else {
                    stateClasses =
                      "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`${baseClasses} ${stateClasses}`}
                    >
                      <span>{idx + 1}</span>
                      {flagged && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Thời gian còn lại + nút nộp */}
            <Card className="bg-white/90 border border-slate-200 shadow-md rounded-2xl px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 tracking-wide">
                  Thời gian còn lại
                </span>
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest border ${isCriticalTime
                      ? "bg-rose-600 text-white border-rose-700 shadow-md animate-pulse"
                      : "bg-slate-900/5 text-slate-700 border-slate-200"
                    }`}
                >
                  <Clock className="w-4 h-4" />
                  {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleSubmitAll}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-rose-300 text-rose-600 bg-white hover:bg-rose-50 text-xs md:text-sm"
              >
                <Send className="w-4 h-4" />
                Nộp bài
              </Button>
            </Card>
          </aside>

        </main>
      </div>
    </div>
  );
};

export default ExamPage;
