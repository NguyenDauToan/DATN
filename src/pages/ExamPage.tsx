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
    duration: number; // phút
    questions: Question[];
}

const ExamPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [exam, setExam] = useState<ExamData | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(string | null)[]>([]);
    const [flags, setFlags] = useState<boolean[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);

    // ⏱ Thời gian còn lại (giây) và thời gian đã dùng (giây)
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [timeUsed, setTimeUsed] = useState<number>(0);
    const isCriticalTime = (timeLeft ?? 0) <= 90; // 1 phút 30 giây

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    useEffect(() => {
        const fetchExam = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                const res = await axios.get(`/api/exams/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const examData: ExamData = {
                    _id: res.data._id,
                    title: res.data.title,
                    duration: res.data.duration,
                    questions: res.data.questions,
                };

                setExam(examData);
                setAnswers(Array(examData.questions.length).fill(null));
                setFlags(Array(examData.questions.length).fill(false));
                setTimeLeft(examData.duration * 60);
                setTimeUsed(0);
            } catch (err) {
                console.error(err);
                alert("Không tải được bài thi");
                navigate("/exams");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchExam();
    }, [id, navigate]);

    // Timer + auto nộp khi hết giờ
    useEffect(() => {
        if (showResult) return;
        if (timeLeft === null) return;
        if (!exam) return;

        if (timeLeft <= 0) {
            // Hết giờ: tự nộp + lưu DB
            gradeExam();
            return;
          }
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev !== null ? prev - 1 : prev));
            setTimeUsed((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, showResult, exam, answers]);

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

    const question = exam.questions[currentIndex];
    const progress = ((currentIndex + 1) / exam.questions.length) * 100;

    const handleSelect = (value: string) => {
        const newAnswers = [...answers];
        newAnswers[currentIndex] = value;
        setAnswers(newAnswers);
    };

    const gradeExam = async () => {
        const s = calculateScore();
        setScore(s);
        setShowResult(true);
      
        // Lưu vào DB (không chặn UI nếu lỗi)
        saveResultToServer();
      };

    // Cho phép chuyển câu dù chưa trả lời
    const handleNext = () => {
        if (currentIndex < exam.questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Câu cuối: nộp bài + lưu DB
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

    // Nộp toàn bộ bài (kể cả chưa làm) với confirm
    const handleSubmitAll = () => {
        const confirmSubmit = window.confirm(
          "Bạn có chắc chắn muốn nộp bài?\nNhững câu chưa trả lời sẽ được tính là sai."
        );
        if (!confirmSubmit) return;
      
        // Nộp bài + lưu kết quả
        gradeExam();
      };
      
    const calculateScore = () => {
        if (!exam) return 0;
        let s = 0;
        exam.questions.forEach((q, idx) => {
          const userAnswer = (answers[idx] ?? "").trim().toLowerCase();
          const correctAnswer = String(q.answer ?? "").trim().toLowerCase();
          if (userAnswer === correctAnswer) s += 1;
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
      
          // Map dữ liệu cho API /api/results
          const payload = {
            testId: exam._id,
            timeSpent: timeUsed, // giây
            answers: exam.questions.map((q, idx) => ({
              questionId: q._id,
              answer: answers[idx] ?? "", // câu chưa trả lời => chuỗi rỗng
            })),
          };
      
          await axios.post("/api/results", payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
      
          // Nếu muốn debug:
          // console.log("Đã lưu kết quả thành công");
        } catch (err) {
          console.error("Lỗi lưu kết quả vào /api/results:", err);
        }
      };
    // Đặt / bỏ cờ câu hiện tại
    const toggleFlagCurrent = () => {
        setFlags((prev) => {
            const copy = [...prev];
            copy[currentIndex] = !copy[currentIndex];
            return copy;
        });
    };

    if (showResult) {
        const totalQuestions = exam.questions.length;
        const correctCount = score; // hiện đang là số câu đúng
        const score10 = (correctCount / totalQuestions) * 10;
        const percentage = (correctCount / totalQuestions) * 100;
        const isPassed = score10 >= 5; // đạt từ 7/10 trở lên (muốn 5/10 thì đổi lại)
      
        const usedMinutes = Math.floor(timeUsed / 60);
        const usedSeconds = timeUsed % 60;
      
        return (
          <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50 py-10 px-4 flex justify-center items-center">
            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden max-w-xl w-full bg-white/90 backdrop-blur">
              {/* HEADER */}
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
      
                {/* Điểm thang 10 */}
                <div className="relative z-10 mt-2 flex flex-col items-center gap-1">
                  <span className="inline-flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold">
                      {score10.toFixed(1)}
                    </span>
                    <span className="text-lg opacity-80">/ 10</span>
                  </span>
      
                  <span className="text-sm text-slate-100/90">
                    {correctCount}/{totalQuestions} câu đúng • {percentage.toFixed(0)}%
                  </span>
      
                  <span
                    className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                      isPassed
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
      
              {/* BUTTONS */}
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
                        score10,       // nếu muốn dùng lại điểm 10
                        correctCount,  // số câu đúng
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
                            Thời lượng:{" "}
                            <span className="font-medium text-slate-800">
                                {exam.duration} phút
                            </span>
                        </span>
                        <span className="text-xs text-slate-400">
                            Câu {currentIndex + 1}/{exam.questions.length} •{" "}
                            {progress.toFixed(0)}% hoàn thành
                        </span>
                    </div>
                </div>

                {/* HAI CỘT: ĐỀ THI + ĐIỀU HƯỚNG */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* CỘT TRÁI: ĐỀ THI */}
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
                                            Bài thi trắc nghiệm
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            {exam.questions.length} câu hỏi
                                        </span>
                                    </div>
                                    <div className="mt-3">
                                        <Progress
                                            value={progress}
                                            className="h-2 rounded-full bg-slate-100"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Thẻ câu hỏi */}
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


                                    {/* Loại câu hỏi + nút đánh dấu nhỏ bên phải */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] md:text-xs uppercase tracking-wide text-slate-400">
                                            {question.type === "multiple_choice" && "Chọn đáp án đúng"}
                                            {question.type === "true_false" && "Đúng / Sai"}
                                            {question.type === "fill_blank" && "Điền vào chỗ trống"}
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
                                            title={flags[currentIndex] ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}
                                        >
                                            <Flag className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <CardTitle className="mt-3 text-lg md:text-xl font-semibold text-slate-900 leading-relaxed">
                                    {question.content}
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="px-5 pb-5 pt-1 space-y-4">
                                {/* Multiple Choice */}
                                {question.type === "multiple_choice" && question.options && (
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

                                {/* True/False */}
                                {question.type === "true_false" && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            type="button"
                                            variant={answers[currentIndex] === "true" ? "default" : "outline"}
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
                                            variant={answers[currentIndex] === "false" ? "default" : "outline"}
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

                                {/* Fill Blank */}
                                {question.type === "fill_blank" && (
                                    <Input
                                        type="text"
                                        className="h-12 text-base rounded-2xl border-2 border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all duration-150"
                                        value={answers[currentIndex] || ""}
                                        onChange={(e) => handleSelect(e.target.value)}
                                        placeholder="Nhập câu trả lời..."
                                    />
                                )}
                            </CardContent>
                        </Card>


                        {/* Nút chuyển câu (chỉ Prev/Next) */}
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
                    </div>

                    {/* CỘT PHẢI: ĐIỀU HƯỚNG + ĐỒNG HỒ + CỜ & NỘP BÀI */}
                    <div className="lg:w-64 xl:w-72 w-full lg:sticky lg:top-24 h-fit">
                        {/* Form điều hướng */}
                        <Card className="bg-white/90 border border-slate-200 shadow-md rounded-2xl p-4">
                            <p className="text-xs font-semibold mb-3 text-slate-600 text-center uppercase tracking-wide">
                                Điều hướng câu hỏi
                            </p>
                            <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-5 gap-2 justify-items-center">
                                {exam.questions.map((_, idx) => {
                                    const isCurrent = idx === currentIndex;
                                    const answered = !!answers[idx];
                                    const flagged = flags[idx];

                                    // base + màu chỉ phụ thuộc current / answered / normal
                                    let baseClasses =
                                        "relative w-9 h-9 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center";
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

                                            {/* dấu cờ nhỏ ở góc, không đổi màu nền */}
                                            {flagged && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Đồng hồ + nút Nộp bài giữ nguyên */}
                        <div className="mt-4 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex flex-col items-start gap-1" style={{ marginLeft: 10 }}>
                                    <span
                                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest border ${isCriticalTime
                                            ? "bg-rose-600 text-white border-rose-700 shadow-md animate-pulse"  // <= 1p30s: đỏ + nháy
                                            : "bg-slate-900/5 text-slate-700 border-slate-200"        // bình thường
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
                                    className="sm:w-auto w-full flex items-center justify-center gap-2 rounded-2xl border-rose-300 text-rose-600 bg-white hover:bg-rose-50 text-xs md:text-sm"
                                >
                                    <Send className="w-4 h-4" />
                                    Nộp bài
                                </Button>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default ExamPage;
