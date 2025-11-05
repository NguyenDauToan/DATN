import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { Exam, Question, QuestionType } from "@/types/exam";
import axios from "axios";
import { toast } from "sonner";

const ExamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ------------------
  // Submit exam
  // ------------------
  const handleSubmit = async () => {
    if (!exam?._id) return;

    try {
      const payload = {
        testId: exam._id,
        answers: exam.questions.map((q) => ({
          questionId: q._id ?? q.id.toString(),
          answer: answers[q._id ?? q.id.toString()] ?? "",
        })),
        timeSpent: exam.duration * 60 - timeLeft,
      };

      await axios.post("/api/results", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setIsSubmitted(true);
      toast.success("Nộp bài thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi nộp bài. Vui lòng thử lại.");
    }
  };

  // ------------------
  // Timer
  // ------------------
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isSubmitted]);

  // ------------------
  // Fetch exam
  // ------------------
  useEffect(() => {
    if (!id) {
      toast.error("ID bài thi không hợp lệ");
      navigate("/exams");
      return;
    }

    const fetchExam = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/exams/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const mappedQuestions: Question[] = res.data.questions.map((q: any) => ({
          _id: q._id,
          id: q.id,
          type: q.type as QuestionType,
          content: q.content,
          options: q.options ?? [],
          answer: q.answer,
        }));

        setExam({ ...res.data, questions: mappedQuestions });
        setTimeLeft(res.data.duration * 60);
      } catch (err: any) {
        console.error(err);
        if (err.response?.status === 404) toast.error("Bài thi không tồn tại");
        else toast.error("Không tải được bài thi. Vui lòng thử lại");
        navigate("/exams");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id, navigate]);

  if (loading) return <p className="text-center mt-10">Đang tải bài thi...</p>;
  if (!exam) return <p className="text-center mt-10">Không tìm thấy bài thi</p>;

  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleAnswerSelect = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (currentQuestion < exam.questions.length - 1) setCurrentQuestion(currentQuestion + 1);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  // ------------------
  // Submitted view
  // ------------------
  if (isSubmitted) {
    const correctCount = exam.questions.filter(
      (q) => answers[q._id ?? q.id.toString()] === String(q.answer)
    ).length;
    const wrongCount = Object.keys(answers).length - correctCount;
    const score = Math.round((correctCount / exam.questions.length) * 100);

    return (
      <div className="min-h-screen p-6 max-w-3xl mx-auto">
        <Card className="text-center p-8">
          <CardContent>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="text-2xl font-bold mt-4">{exam.title}</h2>
            <p className="mt-2 text-muted-foreground">{score}/100 điểm</p>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-bold">{Object.keys(answers).length}</p>
                <p>Đã trả lời</p>
              </div>
              <div>
                <p className="font-bold text-green-600">{correctCount}</p>
                <p>Đúng</p>
              </div>
              <div>
                <p className="font-bold text-red-600">{wrongCount}</p>
                <p>Sai</p>
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <Button onClick={() => navigate("/exams")}>Về danh sách</Button>
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setAnswers({});
                  setCurrentQuestion(0);
                  setTimeLeft(exam.duration * 60);
                }}
              >
                Làm lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ------------------
  // Exam view
  // ------------------
  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Button>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="mb-4">
        <CardContent>
          <h3 className="text-lg font-semibold">{question.content}</h3>
          {question.type === "multiple_choice" && question.options.length > 0 ? (
            <RadioGroup
              value={answers[question._id ?? question.id.toString()] ?? ""}
              onValueChange={(val) =>
                handleAnswerSelect(question._id ?? question.id.toString(), val)
              }
            >
              <div className="space-y-2">
                {question.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center p-2 border rounded cursor-pointer ${
                      answers[question._id ?? question.id.toString()] === opt
                        ? "border-blue-500 bg-blue-50"
                        : ""
                    }`}
                    onClick={() =>
                      handleAnswerSelect(question._id ?? question.id.toString(), opt)
                    }
                  >
                    <RadioGroupItem value={opt} id={`opt-${idx}`} />
                    <Label htmlFor={`opt-${idx}`} className="ml-2">
                      {opt}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          ) : (
            <p className="text-gray-500">Không có lựa chọn nào</p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button onClick={handlePrevious} disabled={currentQuestion === 0}>
          Câu trước
        </Button>

        <div className="flex gap-1">
          {exam.questions.map((q, idx) => (
            <button
              key={idx}
              className={`w-8 h-8 rounded-full ${
                idx === currentQuestion
                  ? "bg-blue-500 text-white"
                  : answers[q._id ?? q.id.toString()]
                  ? "bg-green-200"
                  : "bg-gray-200"
              }`}
              onClick={() => setCurrentQuestion(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentQuestion === exam.questions.length - 1 ? (
          <Button onClick={handleSubmit}>Nộp bài</Button>
        ) : (
          <Button onClick={handleNext}>Câu tiếp</Button>
        )}
      </div>
    </div>
  );
};

export default ExamDetail;
