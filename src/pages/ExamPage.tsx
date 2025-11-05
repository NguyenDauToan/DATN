// src/pages/ExamPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Clock, ArrowLeft, ArrowRight, Send, RotateCcw } from "lucide-react";

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

const ExamPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [exam, setExam] = useState<ExamData | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(string | null)[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);

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

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
                <div className="text-center">
                    <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg"></div>
                    <p className="mt-6 text-indigo-600 text-xl font-medium animate-pulse">Đang tải bài thi...</p>
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

    const handleNext = () => {
        if (!answers[currentIndex]) {
            alert("Vui lòng trả lời câu hỏi trước khi tiếp tục!");
            return;
        }
        if (currentIndex < exam.questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            let s = 0;
            exam.questions.forEach((q, idx) => {
                const userAnswer = answers[idx]?.trim().toLowerCase();
                const correctAnswer = String(q.answer).trim().toLowerCase();
                if (userAnswer === correctAnswer) s += 1;
            });
            setScore(s);
            setShowResult(true);
        }
    };

    const handlePrevious = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));
    const handleRestart = () => {
        setCurrentIndex(0);
        setAnswers(Array(exam.questions.length).fill(null));
        setShowResult(false);
        setScore(0);
    };

    if (showResult) {
        const percentage = (score / exam.questions.length) * 100;
        const isPassed = percentage >= 70;

        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-12 px-4 flex justify-center items-center">
                <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden max-w-lg w-full backdrop-blur-md bg-white/80">
                    <CardHeader className="text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-12 relative">
                        <div className="absolute inset-0 bg-black/10 rounded-t-3xl"></div>
                        <div className="relative z-10 mb-6">
                            {isPassed ? (
                                <CheckCircle2 className="w-28 h-28 mx-auto animate-bounce" />
                            ) : (
                                <XCircle className="w-28 h-28 mx-auto animate-pulse" />
                            )}
                        </div>
                        <CardTitle className="text-4xl font-bold mb-2 relative z-10">{exam.title}</CardTitle>
                        <div className="text-7xl font-extrabold mb-2 relative z-10 animate-pulse">{score}/{exam.questions.length}</div>
                        <p className="text-xl relative z-10">{percentage.toFixed(0)}% - {isPassed ? "Đạt" : "Không đạt"}</p>
                    </CardHeader>
                    <CardContent className="py-8 flex justify-center gap-4 relative z-10">
                        <Button
                            onClick={handleRestart}
                            size="lg"
                            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                        >
                            <RotateCcw className="w-5 h-5" /> Làm lại
                        </Button>
                        <Button
                            onClick={() => navigate("/exams")}
                            size="lg"
                            variant="outline"
                            className="rounded-xl border-indigo-300 hover:bg-indigo-50 transition-all duration-300 hover:scale-105"
                        >
                            Danh sách bài thi
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-8 px-4 flex gap-6">

            {/* Main Content */}
            <div className="flex-1 max-w-4xl space-y-6">

                {/* Exam Header */}
                <Card className="shadow-lg rounded-3xl backdrop-blur-md bg-white/90 border-0">
                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-3xl">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl md:text-3xl font-bold">{exam.title}</CardTitle>
                            <div className="flex items-center gap-2 text-white/90">
                                <Clock className="w-5 h-5" />
                                <span className="text-lg font-medium">{exam.duration} phút</span>
                            </div>
                        </div>
                        <Progress value={progress} className="h-3 rounded-full mt-4 bg-white/20" />
                        <div className="flex justify-between text-sm text-white/80 mt-1">
                            <span>Câu {currentIndex + 1}/{exam.questions.length}</span>
                            <span>{progress.toFixed(0)}%</span>
                        </div>
                    </CardHeader>
                </Card>

                {/* Question Card */}
                <Card className="shadow-lg rounded-3xl hover:shadow-2xl transition-all duration-300 backdrop-blur-md bg-white/90 border-0">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl md:text-2xl font-semibold text-gray-800 leading-relaxed">{question.content}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* Multiple Choice */}
                        {question.type === "multiple_choice" && question.options && (
                            <div className="grid gap-3">
                                {question.options.map((opt, idx) => (
                                    <Button
                                        key={idx}
                                        variant={answers[currentIndex] === opt ? "default" : "outline"}
                                        className={`justify-start text-left py-4 px-6 rounded-2xl transition-all duration-200 hover:scale-105 ${answers[currentIndex] === opt
                                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border-0"
                                            : "hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300"
                                            }`}
                                        onClick={() => handleSelect(opt)}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="w-8 h-8 flex items-center justify-center font-bold bg-white/20 rounded-full text-lg">
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="text-lg">{opt}</span>
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* True/False */}
                        {question.type === "true_false" && (
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant={answers[currentIndex] === "true" ? "default" : "outline"}
                                    className={`py-4 rounded-2xl transition-all duration-200 hover:scale-105 ${answers[currentIndex] === "true"
                                        ? "bg-green-500 text-white shadow-lg border-0"
                                        : "hover:bg-green-50 border-green-200 hover:border-green-300"
                                        }`}
                                    onClick={() => handleSelect("true")}
                                >
                                    <CheckCircle2 className="inline w-5 h-5 mr-2" /> Đúng
                                </Button>
                                <Button
                                    variant={answers[currentIndex] === "false" ? "default" : "outline"}
                                    className={`py-4 rounded-2xl transition-all duration-200 hover:scale-105 ${answers[currentIndex] === "false"
                                        ? "bg-red-500 text-white shadow-lg border-0"
                                        : "hover:bg-red-50 border-red-200 hover:border-red-300"
                                        }`}
                                    onClick={() => handleSelect("false")}
                                >
                                    <XCircle className="inline w-5 h-5 mr-2" /> Sai
                                </Button>
                            </div>
                        )}

                        {/* Fill Blank */}
                        {question.type === "fill_blank" && (
                            <Input
                                type="text"
                                className="h-14 text-lg rounded-2xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
                                value={answers[currentIndex] || ""}
                                onChange={(e) => handleSelect(e.target.value)}
                                placeholder="Nhập câu trả lời..."
                            />
                        )}

                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4">
                    <Button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        variant="outline"
                        className="flex items-center gap-2 rounded-2xl py-3 px-5 border-indigo-300 hover:bg-indigo-50 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="w-4 h-4" /> Câu trước
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="flex items-center gap-2 rounded-2xl py-3 px-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 hover:scale-105"
                    >
                        {currentIndex === exam.questions.length - 1 ? (
                            <>
                                <Send className="w-4 h-4" /> Nộp bài
                            </>
                        ) : (
                            <>
                                Câu tiếp <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Sidebar Question Navigator */}
            <div className="w-48 bg-white/90 shadow-lg p-4 flex flex-col items-center sticky top-8 h-fit rounded-2xl backdrop-blur-md border-0">
                <p className="text-sm font-semibold mb-3 text-gray-600 text-center">Điều hướng</p>
                <div className="grid grid-cols-4 gap-2">
                    {exam.questions.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 hover:scale-110 ${idx === currentIndex
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                                : answers[idx]
                                    ? "bg-green-200 text-green-800 hover:bg-green-300"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </div>

        </div>

    );
};

export default ExamPage;
