// src/pages/ExamPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/api/Api"; // ✅ dùng axios instance chung
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Swal from "sweetalert2";
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

// ================= CONFIG & TYPES =================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const resolveMediaUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "reading_cloze"
  | "writing_sentence_order"
  | "speaking"
  | "writing_paragraph";

interface ReadingSubQuestion {
  label?: string;
  options: string[];
  correctIndex: number;
}

type AnswerValue = string | null | string[];

type SpeakingRecording =
  | {
      url: string;
      blob: Blob;
      uploaded?: boolean;
      aiScore?: number | null;
      aiLevel?: string | null;
      aiFeedback?: string | null;
      aiTranscript?: string | null;
      aiMax?: number | null;
    }
  | null;

interface Question {
  _id: string;
  content: string;
  type: QuestionType;
  options?: string[];
  answer: string;
  skill?: string;
  audioUrl?: string | null;
  subQuestions?: ReadingSubQuestion[];
  explanation?: string;
}

interface ExamPageProps {
  isMock?: boolean;
}

interface ExamData {
  _id: string;
  title: string;
  duration: number;
  questions: Question[];
}

// ================= HELPERS =================

// tách token cho câu writing sắp xếp câu
const getWritingTokens = (q: Question, value: AnswerValue): string[] => {
  if (Array.isArray(value)) return value as string[];
  const raw = q.content || "";
  const sep = raw.includes("/") ? "/" : " ";
  return raw
    .split(sep)
    .map((t) => t.trim())
    .filter(Boolean);
};

const normalizeText = (text: string) =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

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
        skill: q.skill,
        audioUrl: q.audioUrl || null,
        explanation: q.explanation ?? "",
      };

      return question;
    }

    const optsObj = q.options || {};
    const optionsArr: string[] = Array.isArray(q.options)
      ? q.options
      : [optsObj.A, optsObj.B, optsObj.C, optsObj.D].filter(Boolean);

    let answerText = "";

    if (typeof q.answer === "string" && q.answer.trim()) {
      answerText = q.answer;
    } else if (
      typeof q.correctIndex === "number" &&
      optionsArr[q.correctIndex]
    ) {
      answerText = optionsArr[q.correctIndex];
    } else if (q.correctOption) {
      const idx = ["A", "B", "C", "D"].indexOf(
        String(q.correctOption).toUpperCase()
      );
      if (idx >= 0 && optionsArr[idx]) answerText = optionsArr[idx];
    }

    let questionType: QuestionType =
      (q.type as QuestionType) || "multiple_choice";

    if (q.skill === "speaking") {
      questionType = "speaking";
    }

    if (q.type === "speaking_cue_card" || q.type === "speaking_part2") {
      questionType = "speaking";
    }

    if (q.type === "writing_paragraph") {
      questionType = "writing_paragraph";
    }

    const question: Question = {
      _id: q._id || String(q.questionNumber || idxQ + 1),
      content: q.content,
      type: questionType,
      options: optionsArr,
      answer: answerText,
      skill: q.skill,
      audioUrl: q.audioUrl || null,
      explanation: q.explanation ?? "",
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

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeUsed, setTimeUsed] = useState<number>(0);
  const isCriticalTime = (timeLeft ?? 0) <= 90;

  const [maxScore, setMaxScore] = useState(0);
  const [autoCorrect, setAutoCorrect] = useState(0);
  const [autoMax, setAutoMax] = useState(0);

  const [writingEvaluations, setWritingEvaluations] = useState<any[]>([]);
  const [evaluatingWriting, setEvaluatingWriting] = useState(false);

  const [speakingRecordings, setSpeakingRecordings] = useState<
    SpeakingRecording[]
  >([]);
  const [currentRecorder, setCurrentRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingSpeaking, setUploadingSpeaking] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

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

      if (q.type === "writing_sentence_order") {
        const arr = Array.isArray(value)
          ? (value as string[])
          : getWritingTokens(q, value);
        return {
          questionId: q._id,
          answer: JSON.stringify(arr),
        };
      }

      return {
        questionId: q._id,
        answer: (value ?? "").toString(),
      };
    });
  };

  const saveProgress = async () => {
    if (!exam || showResult) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // interceptor cũng sẽ xử lý 401

      const answersPayload = buildAnswersPayload(exam, answers);

      const payload: any = {
        answers: answersPayload,
        currentIndex,
        timeUsed,
        timeLeft: timeLeft ?? 0,
        ...(isMock ? { mockExamId: exam._id } : { testId: exam._id }),
      };

      // ❗ Đã chuyển sang dùng api instance (bắn lên backend)
      await api.post("/exam-progress/save", payload);
    } catch (err) {
      console.error("Lỗi lưu trạng thái bài thi:", err);
    }
  };

  // autosave
  useEffect(() => {
    if (!exam || showResult) return;

    const timeout = setTimeout(() => {
      saveProgress();
    }, 5000);

    return () => clearTimeout(timeout);
  }, [answers, currentIndex, exam, showResult]);

  // load exam
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

        const url = isMock ? `/mock-exams/${id}` : `/exams/${id}`;
        // ❗ dùng api.get thay vì axios.get("/api/...")
        const res = await api.get(url);

        const raw = isMock ? res.data.exam || res.data : res.data;
        const mappedQuestions = normalizeQuestions(raw.questions || []);

        const examData: ExamData = {
          _id: raw._id,
          title: isMock ? raw.name : raw.title,
          duration: raw.duration || 60,
          questions: mappedQuestions,
        };

        setExam(examData);

        setSpeakingRecordings(
          Array<SpeakingRecording>(examData.questions.length).fill(null)
        );
        setWritingEvaluations(
          Array<any>(examData.questions.length).fill(null)
        );

        let restored = false;
        try {
          // ❗ cũng dùng api.get
          const progressRes = await api.get("/exam-progress/by-exam", {
            params: isMock
              ? { mockExamId: examData._id }
              : { testId: examData._id },
          });

          const prog = progressRes.data;
          if (prog && Array.isArray(prog.answers)) {
            const restoredAnswers: AnswerValue[] = examData.questions.map(
              (q) => {
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

                if (q.type === "writing_sentence_order") {
                  try {
                    const arr = JSON.parse(item.answer || "[]");
                    return Array.isArray(arr) ? arr : [];
                  } catch {
                    return [];
                  }
                }

                return item.answer ?? "";
              }
            );

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

  // timer
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
  }, [timeLeft, showResult, exam]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin" />
          <p className="text-sm text-slate-700">Đang tải bài thi...</p>
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

  // ================= HANDLERS =================

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

  const handleDropToken = (targetIdx: number) => {
    if (dragIndex === null) return;
    setAnswers((prev) => {
      const copy = [...prev];
      const baseTokens = getWritingTokens(question, copy[currentIndex]);
      if (
        dragIndex < 0 ||
        dragIndex >= baseTokens.length ||
        targetIdx < 0 ||
        targetIdx >= baseTokens.length
      )
        return prev;

      const updated = [...baseTokens];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(targetIdx, 0, moved);
      copy[currentIndex] = updated;
      return copy;
    });
    setDragIndex(null);
  };

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "Trình duyệt không hỗ trợ ghi âm. Vui lòng dùng Chrome hoặc trình duyệt mới hơn."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        setSpeakingRecordings((prev) => {
          const copy = [...prev];
          copy[currentIndex] = { url, blob };
          return copy;
        });

        setAnswers((prev) => {
          const copy = [...prev];
          if (!copy[currentIndex]) copy[currentIndex] = "[VOICE_ANSWER]";
          return copy;
        });

        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setCurrentRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Lỗi khi truy cập microphone:", err);
      alert("Không truy cập được micro. Vui lòng kiểm tra lại.");
    }
  };

  const handleStopRecording = () => {
    if (currentRecorder && isRecording) {
      currentRecorder.stop();
      setIsRecording(false);
      setCurrentRecorder(null);
    }
  };

  const handleUploadSpeaking = async () => {
    if (!exam) return;
    if (question.type !== "speaking") return;

    const rec = speakingRecordings[currentIndex];
    if (!rec || !rec.blob) {
      alert("Bạn chưa ghi âm câu trả lời cho câu này.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Bạn cần đăng nhập lại.");
      return;
    }

    const formData = new FormData();
    formData.append("questionId", question._id);
    if (exam._id) formData.append("examId", exam._id);

    formData.append(
      "audio",
      rec.blob,
      `speaking-${question._id}-${Date.now()}.webm`
    );

    try {
      setUploadingSpeaking(true);

      // ❗ dùng api.post, interceptor tự gắn Authorization
      const res = await api.post("/speaking-attempts/ai", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const aiResult = res.data?.aiResult;
      const attempt = res.data?.attempt;

      const transcriptFromAI =
        attempt?.transcript || aiResult?.transcript || "";

      setSpeakingRecordings((prev) => {
        const copy = [...prev];
        if (copy[currentIndex]) {
          copy[currentIndex] = {
            ...(copy[currentIndex] as Exclude<SpeakingRecording, null>),
            uploaded: !!attempt,
            aiScore: aiResult?.score ?? null,
            aiLevel: aiResult?.level ?? null,
            aiMax: aiResult?.maxScore ?? null,
            aiFeedback: aiResult?.feedback ?? null,
            aiTranscript: transcriptFromAI || null,
          };
        }
        return copy;
      });

      setAnswers((prev) => {
        const copy = [...prev];
        copy[currentIndex] = transcriptFromAI;
        return copy;
      });

      if (aiResult?.score != null) {
        const maxForThisQuestion =
          typeof aiResult.maxScore === "number" ? aiResult.maxScore : 0;

        const scoreStr = aiResult.score.toFixed(2);
        const maxStr = maxForThisQuestion ? maxForThisQuestion.toFixed(2) : "?";

        alert(
          `AI đã chấm Speaking:\n` +
            `Điểm câu này: ${scoreStr}/${maxStr}\n\n` +
            `Nhận xét: ${aiResult.feedback}\n\n` +
            `Transcript AI nhận được:\n${
              transcriptFromAI || "(không có nội dung)"
            }`
        );
      } else {
        alert(
          "Đã nộp audio, nhưng không lấy được điểm từ AI.\n\n" +
            (transcriptFromAI
              ? `Transcript AI nhận được:\n${transcriptFromAI}`
              : "")
        );
      }
    } catch (err: any) {
      console.error("Speaking AI error:", err?.response?.data || err);
      alert(
        err?.response?.data?.message ||
          JSON.stringify(err?.response?.data || "Lỗi khi nộp/chấm bài nói.")
      );
    } finally {
      setUploadingSpeaking(false);
    }
  };

  const handleEvaluateWriting = async () => {
    if (!exam) return;
    const q = exam.questions[currentIndex];
    if (q.type !== "writing_paragraph") return;

    const studentText = (answers[currentIndex] as string) || "";
    if (!studentText.trim()) {
      Swal.fire({
        title: "Chưa có bài viết",
        text: "Bạn chưa nhập đoạn văn.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        title: "Cần đăng nhập",
        text: "Bạn cần đăng nhập lại.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      setEvaluatingWriting(true);

      // ❗ dùng api.post
      const res = await api.post("/ai/writing-eval", {
        question: q.content,
        studentText,
      });

      const evaluation = res.data?.evaluation;
      if (!evaluation) {
        Swal.fire({
          title: "Lỗi",
          text: "Không nhận được dữ liệu chấm từ AI.",
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }

      // max gốc của AI (thường là 10)
      const baseMax =
        typeof evaluation.maxScore === "number" && evaluation.maxScore > 0
          ? evaluation.maxScore
          : 10;

      // chuẩn hoá về 0–1
      const normalizedScore =
        typeof evaluation.overallScore === "number" && baseMax > 0
          ? Math.max(0, Math.min(1, evaluation.overallScore / baseMax))
          : null;

      // điểm tối đa mỗi câu theo đề (10 / số câu)
      const questionCount = exam.questions.length || 1;
      const perQuestionMax = 10 / questionCount;
      const examPointForThisQuestion =
        normalizedScore != null ? normalizedScore * perQuestionMax : 0;

      // lưu vào state để gradeExam() dùng
      setWritingEvaluations((prev) => {
        const copy = [...prev];
        copy[currentIndex] = {
          ...evaluation,
          baseMaxScore: baseMax, // max gốc của AI (thường 10)
          maxScore: 1, // thang 0–1 nội bộ
          normalizedScore, // 0–1
          examPoint: examPointForThisQuestion, // điểm thực tế câu này dùng cho đề
          examMax: perQuestionMax, // điểm tối đa của câu trong đề
        };
        return copy;
      });

      // hiển thị popup theo thang điểm của đề
      const suggestionsText =
        evaluation.suggestions && evaluation.suggestions.length
          ? "<ul style='margin-top:6px;padding-left:18px;text-align:left;'>" +
            evaluation.suggestions.map((s: string) => `<li>${s}</li>`).join("") +
            "</ul>"
          : "";

      Swal.fire({
        title: "AI đã chấm Writing",
        icon: "success",
        html: `
          <p><b>Điểm câu này (tính vào bài thi):</b> ${examPointForThisQuestion.toFixed(
            2
          )}/${perQuestionMax.toFixed(2)}</p>
          ${
            suggestionsText
              ? `<p style="margin-top:8px;"><b>Gợi ý cải thiện:</b></p>${suggestionsText}`
              : ""
          }
        `,
        confirmButtonText: "OK",
      });
    } catch (err: any) {
      console.error("Writing eval error:", err?.response?.data || err);
      Swal.fire({
        title: "Lỗi",
        text:
          err?.response?.data?.message ||
          "Lỗi khi chấm bài viết Writing bằng AI.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      // đảm bảo nút “Chấm AI” được bật lại và state đã update
      setEvaluatingWriting(false);
    }
  };

  const calculateScore = () => {
    if (!exam) return { raw: 0, max: 10, autoCorrect: 0, autoMax: 0 };

    const questionCount = exam.questions.length || 1;
    const perQuestionMax = 10 / questionCount; // điểm tối đa mỗi câu

    let raw = 0; // tổng điểm thực tế (0–10)
    let autoCorrectLocal = 0; // đếm số item đúng (để hiển thị)
    let autoMaxLocal = 0; // tổng số item auto chấm

    exam.questions.forEach((q, idx) => {
      // ===== reading_cloze: chia điểm câu này cho từng blank =====
      if (q.type === "reading_cloze" && q.subQuestions?.length) {
        const ansArray = Array.isArray(answers[idx])
          ? (answers[idx] as string[])
          : [];

        const subCount = q.subQuestions.length;
        const perBlankMax = perQuestionMax / subCount;

        q.subQuestions.forEach((sub, subIdx) => {
          const correct = (sub.options?.[sub.correctIndex] ?? "")
            .trim()
            .toLowerCase();
          const user = (ansArray[subIdx] ?? "").trim().toLowerCase();

          autoMaxLocal += 1;

          if (correct && user === correct) {
            raw += perBlankMax;
            autoCorrectLocal += 1;
          }
        });

        return;
      }

      // ===== writing_sentence_order =====
      if (q.type === "writing_sentence_order") {
        autoMaxLocal += 1;

        const tokens = getWritingTokens(q, answers[idx]);
        const userSentenceNorm = normalizeText(tokens.join(" "));
        const correctSentenceNorm = normalizeText(String(q.answer ?? ""));

        if (
          userSentenceNorm &&
          correctSentenceNorm &&
          userSentenceNorm === correctSentenceNorm
        ) {
          raw += perQuestionMax;
          autoCorrectLocal += 1;
        }

        return;
      }

      // ===== speaking: dùng tỉ lệ aiScore/aiMax * perQuestionMax =====
      if (q.type === "speaking") {
        const rec = speakingRecordings[idx];
        const aiScore = rec?.aiScore ?? null;
        const aiMax = rec?.aiMax ?? 0;

        if (aiMax > 0 && aiScore != null) {
          const normalized = Math.max(
            0,
            Math.min(1, aiScore / aiMax)
          ); // 0–1
          raw += normalized * perQuestionMax;
        }

        return;
      }

      // ===== writing_paragraph: dùng normalized * perQuestionMax =====
      if (q.type === "writing_paragraph") {
        const ev = writingEvaluations[idx];

        let normalized: number | null = null;

        if (ev) {
          if (typeof ev.normalizedScore === "number") {
            normalized = ev.normalizedScore; // đã 0–1
          } else if (typeof ev.overallScore === "number") {
            const baseMax =
              typeof ev.baseMaxScore === "number" && ev.baseMaxScore > 0
                ? ev.baseMaxScore
                : typeof ev.maxScore === "number" && ev.maxScore > 0
                ? ev.maxScore
                : 10;
            normalized = ev.overallScore / baseMax; // chuẩn hoá về 0–1
          }
        }

        if (typeof normalized === "number" && Number.isFinite(normalized)) {
          const safeNorm = Math.max(0, Math.min(1, normalized));
          raw += safeNorm * perQuestionMax;
        }

        return;
      }

      // ===== các dạng auto chấm khác: multiple_choice, true_false, fill_blank =====
      autoMaxLocal += 1;

      const userAnswer = normalizeText((answers[idx] ?? "").toString());
      const correctAnswer = normalizeText(String(q.answer ?? ""));

      if (userAnswer && userAnswer === correctAnswer) {
        raw += perQuestionMax;
        autoCorrectLocal += 1;
      }
    });

    const max = 10; // tổng điểm tối đa của cả đề luôn là 10

    return { raw, max, autoCorrect: autoCorrectLocal, autoMax: autoMaxLocal };
  };

  const buildSpeakingSummary = () => {
    if (!exam) return [];

    return exam.questions
      .map((q, idx) => {
        if (q.type !== "speaking") return null;
        const rec = speakingRecordings[idx];
        if (!rec || rec.aiScore == null || rec.aiMax == null) return null;

        return {
          questionId: q._id,
          score: rec.aiScore,
          maxScore: rec.aiMax,
          level: rec.aiLevel || null,
          feedback: rec.aiFeedback || "",
          transcript: rec.aiTranscript || "",
        };
      })
      .filter((item) => item !== null);
  };

  const saveResultToServer = async () => {
    if (!exam) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("Không có token, không thể lưu kết quả");
        return;
      }

      const { raw, max, autoCorrect, autoMax } = calculateScore();
      const score10 = max > 0 ? (raw / max) * 10 : 0;

      // 1. Build payload cơ bản (như cũ)
      const baseAnswersPayload = buildAnswersPayload(exam, answers);

      // 2. Gắn thêm điểm AI cho câu writing_paragraph
      const answersPayload = baseAnswersPayload.map((item, idx) => {
        const q = exam.questions[idx];

        if (q.type !== "writing_paragraph") {
          return item;
        }

        const ev = writingEvaluations[idx];
        if (!ev) {
          // chưa bấm "Chấm AI" -> coi như không có điểm, backend sẽ tính 0
          return item;
        }

        // Điểm gốc trả về từ AI (thường 0–10)
        const overall =
          typeof ev.overallScore === "number" ? ev.overallScore : null;

        // max gốc của AI (thường 10)
        let baseMax: number | null = null;
        if (typeof ev.baseMaxScore === "number" && ev.baseMaxScore > 0) {
          baseMax = ev.baseMaxScore;
        } else if (typeof ev.maxScore === "number" && ev.maxScore > 0) {
          baseMax = ev.maxScore;
        } else {
          baseMax = 10;
        }

        return {
          ...item,
          aiScore: overall, // backend sẽ đọc ở đây
          aiMax: baseMax, // backend sẽ dùng để scale
          writingEval: ev, // để lưu kèm, FE có thể show chi tiết
        };
      });

      const speakingSummary = buildSpeakingSummary();

      const payload: any = {
        timeSpent: timeUsed,
        answers: answersPayload,
        scoreRaw: raw,
        maxScore: max,
        score10,
        autoCorrect,
        autoMax,
        speakingSummary,
        ...(isMock ? { mockExamId: exam._id } : { testId: exam._id }),
      };

      // ❗ dùng api.post
      await api.post("/results", payload);

      try {
        await api.post(
          "/exam-progress/finish",
          isMock ? { mockExamId: exam._id } : { testId: exam._id }
        );
      } catch (err) {
        console.warn("Không xoá được exam-progress sau khi nộp:", err);
      }
    } catch (err) {
      console.error("Lỗi lưu kết quả vào /api/results:", err);
    }
  };

  const gradeExam = async () => {
    if (!exam) return;

    const { raw, max, autoCorrect, autoMax } = calculateScore();

    setScore(raw);
    setMaxScore(max);
    setAutoCorrect(autoCorrect);
    setAutoMax(autoMax);
    setShowResult(true);

    await saveResultToServer();

    const score10 = max > 0 ? (raw / max) * 10 : 0;
    const correctCount = autoCorrect;

    const speakingSummary = buildSpeakingSummary();

    navigate(`/exams/${exam._id}/review`, {
      state: {
        exam,
        answers,
        score10, // vẫn truyền, nhưng ReviewPage sẽ tự tính lại
        correctCount,
        timeUsed,
        speakingSummary,
        writingEvaluations, // mảng cùng length với questions
      },
    });
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
    setSpeakingRecordings(
      Array<SpeakingRecording>(exam.questions.length).fill(null)
    );
    setWritingEvaluations(Array<any>(exam.questions.length).fill(null));
  };

  const handleSubmitAll = () => {
    const confirmSubmit = window.confirm(
      "Bạn có chắc chắn muốn nộp bài?\nNhững câu chưa trả lời sẽ được tính là sai (trừ Speaking/Writing được chấm riêng)."
    );
    if (!confirmSubmit) return;
    gradeExam();
  };

  const toggleFlagCurrent = () => {
    setFlags((prev) => {
      const copy = [...prev];
      copy[currentIndex] = !copy[currentIndex];
      return copy;
    });
  };

  // ================= SHOW RESULT CARD =================

  if (showResult) {
    const totalQuestions = autoMax;
    const correctCount = autoCorrect;
    const score10 = maxScore > 0 ? (score / maxScore) * 10 : 0;
    const percentage =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const isPassed = score10 >= 5;
    const usedMinutes = Math.floor(timeUsed / 60);
    const usedSeconds = timeUsed % 60;

    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 flex justify-center items-center">
        <Card className="max-w-xl w-full border border-slate-200 shadow-sm rounded-2xl bg-white">
          <CardHeader className="py-6 border-b border-slate-100">
            <CardTitle className="text-center text-xl md:text-2xl font-semibold text-slate-900">
              {exam.title}
            </CardTitle>
            <div className="mt-4 flex flex-col items-center gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  {score10.toFixed(1)}
                </span>
                <span className="text-sm text-slate-500">/ 10</span>
              </div>
              <p className="text-xs text-slate-600">
                {correctCount}/{totalQuestions} câu đúng ·{" "}
                {percentage.toFixed(0)}%
              </p>
              <span
                className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  isPassed
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {isPassed ? "Đạt yêu cầu" : "Chưa đạt"}
              </span>
              <p className="mt-2 text-xs text-slate-500">
                Thời gian làm bài: {usedMinutes} phút {usedSeconds} giây
              </p>
            </div>
          </CardHeader>

          <CardContent className="py-5 px-6 flex flex-col sm:flex-row justify-center gap-3">
            <Button
              onClick={handleRestart}
              size="sm"
              className="w-full sm:w-auto flex items-center gap-2 rounded-xl"
            >
              <RotateCcw className="w-4 h-4" /> Làm lại
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
                    speakingSummary: buildSpeakingSummary(),
                    writingEvaluations,
                  },
                })
              }
              size="sm"
              variant="outline"
              className="w-full sm:w-auto rounded-xl border-slate-300"
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-5">
        {/* HEADER */}
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-slate-200 bg-white hover:bg-slate-100"
                onClick={() => navigate(isMock ? "/mock-exams" : "/exams")}
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" />
              </Button>

              <div className="flex flex-col min-w-0">
                <h1 className="text-xl md:text-2xl font-semibold text-slate-900 truncate">
                  {exam.title}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-slate-600">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Bài thi
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {exam.questions.length} câu hỏi
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {exam.duration} phút
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                Câu{" "}
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
            <Card className="shadow-sm rounded-2xl bg-white border border-slate-200">
              <CardHeader className="pb-3 px-5 pt-5 border-b border-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-3 py-1">
                    <span className="text-[11px] uppercase tracking-wide text-slate-500 mr-1">
                      Câu
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {currentIndex + 1}
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline text-[11px] text-slate-500">
                      {question.type === "multiple_choice" &&
                        "Chọn một đáp án"}
                      {question.type === "true_false" && "Đúng / Sai"}
                      {question.type === "fill_blank" && "Điền vào chỗ trống"}
                      {question.type === "reading_cloze" &&
                        "Đọc đoạn văn và chọn đáp án"}
                      {question.type === "writing_sentence_order" &&
                        "Kéo thả để sắp xếp câu"}
                      {question.type === "writing_paragraph" &&
                        "Viết đoạn văn tiếng Anh"}
                      {question.type === "speaking" &&
                        "Ghi âm câu trả lời Speaking"}
                    </span>

                    <Button
                      type="button"
                      variant={flags[currentIndex] ? "outline" : "ghost"}
                      size="icon"
                      className={`h-8 w-8 rounded-full border ${flags[currentIndex]
                        ? "border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
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
                  className={`mt-4 whitespace-pre-line leading-relaxed text-slate-900 font-normal ${question.type === "reading_cloze"
                    ? "text-base md:text-lg"
                    : "text-lg md:text-xl"
                    }`}
                >
                  {question.type === "reading_cloze" ? (
                    <div className="space-y-3">
                      {question.audioUrl && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium text-slate-600 mb-2">
                            Nghe đoạn audio sau rồi trả lời các câu hỏi:
                          </p>
                          <audio
                            controls
                            src={resolveMediaUrl(question.audioUrl)}
                            className="w-full"
                          />
                        </div>
                      )}

                      <div className="rounded-xl bg-slate-50 px-4 py-4 border border-slate-100 text-slate-900">
                        {question.content}
                      </div>
                    </div>
                  ) : (
                    <span>{question.content}</span>
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
                            <p className="text-sm font-medium text-slate-800 mb-3">
                              {sub.label ||
                                `Câu hỏi ${currentIndex + 1}.${subIdx + 1}`}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {sub.options.map((opt, optIdx) => {
                                const active = selected === opt;
                                return (
                                  <Button
                                    key={optIdx}
                                    type="button"
                                    variant={active ? "default" : "outline"}
                                    className={`h-full w-full py-3 px-2 rounded-xl text-xs md:text-sm ${active
                                      ? "bg-slate-900 text-white border-slate-900"
                                      : "bg-white hover:bg-slate-50 border-slate-200"
                                      }`}
                                    onClick={() =>
                                      handleSelectSub(subIdx, opt)
                                    }
                                  >
                                    <span className="flex flex-row items-center justify-center gap-2">
                                      <span
                                        className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold ${active
                                          ? "bg-slate-800 text-white"
                                          : "bg-slate-100 text-slate-700"
                                          }`}
                                      >
                                        {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <span className="text-sm">
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

                {/* writing_sentence_order */}
                {question.type === "writing_sentence_order" && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Kéo thả các cụm từ để sắp xếp lại thành câu hoàn chỉnh.
                    </p>
                    <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 min-h-[56px]">
                      {getWritingTokens(question, answers[currentIndex]).map(
                        (token, idx) => (
                          <button
                            key={idx}
                            type="button"
                            draggable
                            onDragStart={() => setDragIndex(idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDropToken(idx)}
                            className="px-3 py-1 rounded-full bg-white border border-slate-200 text-sm cursor-move hover:border-slate-400 hover:bg-slate-50"
                          >
                            {token}
                          </button>
                        )
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      Câu bạn đang sắp xếp:{" "}
                      <span className="font-medium text-slate-700">
                        {getWritingTokens(
                          question,
                          answers[currentIndex]
                        ).join(" ") || "(chưa có)"}
                      </span>
                    </div>
                  </div>
                )}

                {/* writing_paragraph */}
                {question.type === "writing_paragraph" && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Viết đoạn văn tiếng Anh trả lời yêu cầu trên (khoảng
                      80–120 từ).
                    </p>
                    <Textarea
                      rows={6}
                      className="rounded-xl border border-slate-300 focus-visible:ring-slate-900 text-sm"
                      placeholder="Nhập đoạn văn tiếng Anh của bạn..."
                      value={(answers[currentIndex] as string) || ""}
                      onChange={(e) => handleSelect(e.target.value)}
                    />

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-500">
                        Bấm “Chấm AI” để hệ thống đánh giá đoạn văn (0–10 điểm)
                        và gợi ý chỉnh sửa.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl px-3 py-1.5 text-xs"
                        disabled={
                          evaluatingWriting ||
                          !answers[currentIndex] ||
                          !(answers[currentIndex] as string).trim()
                        }
                        onClick={handleEvaluateWriting}
                      >
                        {evaluatingWriting ? "Đang chấm..." : "Chấm AI"}
                      </Button>
                    </div>

                    {writingEvaluations[currentIndex] && (
                      <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-700">
                          Kết quả chấm AI:
                        </p>

                        {/* Điểm dùng để tính vào bài thi – cùng thang với Swal */}
                        <p className="text-xs text-slate-700">
                          {(() => {
                            const ev = writingEvaluations[currentIndex];
                            const examPoint: number | undefined = ev?.examPoint;
                            const examMax: number =
                              typeof ev?.examMax === "number" && ev.examMax > 0
                                ? ev.examMax
                                : 10 / exam.questions.length; // fallback

                            return (
                              <>
                                Điểm câu này (tính vào bài thi):{" "}
                                <span className="font-semibold">
                                  {examPoint != null ? examPoint.toFixed(2) : "—"}/
                                  {examMax.toFixed(2)}
                                </span>
                              </>
                            );
                          })()}
                        </p>
                        <div className="space-y-1 text-[11px] text-slate-600">
                          <p className="font-semibold">
                            Đoạn văn gợi ý (đã chỉnh sửa):
                          </p>
                          <p className="whitespace-pre-wrap bg-white border border-slate-200 rounded-lg px-3 py-2">
                            {writingEvaluations[currentIndex].correctedText ||
                              "(chưa có)"}
                          </p>
                        </div>

                        {Array.isArray(
                          writingEvaluations[currentIndex].suggestions
                        ) &&
                          writingEvaluations[currentIndex].suggestions
                            .length > 0 && (
                            <div className="space-y-1 text-[11px] text-slate-600">
                              <p className="font-semibold">
                                Gợi ý cải thiện:
                              </p>
                              <ul className="list-disc pl-5 space-y-0.5">
                                {writingEvaluations[
                                  currentIndex
                                ].suggestions.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {/* speaking */}
                {question.type === "speaking" && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Chuẩn bị câu trả lời, bấm ghi âm để nói và nộp để hệ
                      thống chấm tự động.
                    </p>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <p className="text-xs font-medium text-slate-700">
                        Ghi âm câu trả lời:
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          onClick={handleStartRecording}
                          disabled={isRecording}
                          className="rounded-xl"
                        >
                          {isRecording ? "Đang ghi..." : "Bắt đầu ghi"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleStopRecording}
                          disabled={!isRecording}
                          className="rounded-xl"
                        >
                          Dừng ghi
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleUploadSpeaking}
                          disabled={
                            uploadingSpeaking ||
                            !speakingRecordings[currentIndex]
                          }
                          className="rounded-xl"
                        >
                          {uploadingSpeaking
                            ? "Đang nộp & chấm..."
                            : "Nộp audio"}
                        </Button>
                      </div>

                      {speakingRecordings[currentIndex]?.url && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-slate-500">
                            Nghe lại câu trả lời:
                          </p>
                          <audio
                            controls
                            src={speakingRecordings[currentIndex]?.url}
                            className="w-full"
                          />
                        </div>
                      )}

                      {speakingRecordings[currentIndex]?.aiScore != null && (
                        <div className="mt-2 text-xs text-slate-700 space-y-1">
                          <p>
                            Điểm AI:{" "}
                            <span className="font-semibold">
                              {speakingRecordings[
                                currentIndex
                              ]?.aiScore?.toFixed(2)}
                              {speakingRecordings[currentIndex]?.aiMax != null
                                ? `/${speakingRecordings[
                                  currentIndex
                                ]?.aiMax!.toFixed(2)}`
                                : ""}
                            </span>{" "}
                            (
                            {speakingRecordings[currentIndex]?.aiLevel || "?"})
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="font-semibold">
                              Nội dung AI nhận được:
                            </p>
                            <p className="whitespace-pre-wrap bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px]">
                              {speakingRecordings[currentIndex]?.aiTranscript}
                            </p>
                          </div>
                          <p>
                            Nhận xét:{" "}
                            {speakingRecordings[currentIndex]?.aiFeedback}
                          </p>
                        </div>
                      )}

                      {speakingRecordings[currentIndex]?.uploaded && (
                        <p className="text-[11px] text-emerald-600">
                          Đã lưu bài nói lên hệ thống.
                        </p>
                      )}

                      <p className="text-[11px] text-slate-400">
                        Khi trình duyệt hỏi quyền micro, hãy chọn "Cho phép".
                      </p>
                    </div>
                  </div>
                )}

                {/* multiple_choice */}
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
                            className={`justify-start text-left py-3.5 px-4 rounded-xl text-sm md:text-base ${active
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white hover:bg-slate-50 border-slate-200"
                              }`}
                            onClick={() => handleSelect(opt)}
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${active
                                  ? "bg-slate-800 text-white"
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

                {/* true_false */}
                {question.type === "true_false" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={
                        answers[currentIndex] === "true"
                          ? "default"
                          : "outline"
                      }
                      className={`py-3.5 rounded-xl text-sm md:text-base ${answers[currentIndex] === "true"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white hover:bg-emerald-50 border-emerald-200"
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
                      className={`py-3.5 rounded-xl text-sm md:text-base ${answers[currentIndex] === "false"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white hover:bg-rose-50 border-rose-200"
                        }`}
                      onClick={() => handleSelect("false")}
                    >
                      <XCircle className="inline w-4 h-4 mr-2" /> Sai
                    </Button>
                  </div>
                )}

                {/* fill_blank */}
                {question.type === "fill_blank" && (
                  <Input
                    type="text"
                    className="h-11 text-base rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-0"
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
                className="flex items-center gap-2 rounded-xl py-3 px-4 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" /> Câu trước
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl py-3 px-5"
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
            <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold mb-3 text-slate-600 text-center">
                Điều hướng câu hỏi
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {exam.questions.map((_, idx) => {
                  const isCurrent = idx === currentIndex;
                  const answered = !!answers[idx];
                  const flagged = flags[idx];

                  const baseClasses =
                    "relative w-9 h-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center";
                  let stateClasses = "";

                  if (isCurrent) {
                    stateClasses =
                      "bg-sky-600 text-white border-sky-600 shadow-sm";
                  } else if (answered) {
                    stateClasses =
                      "bg-emerald-500 text-white border border-emerald-600";
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

            {/* Thời gian + nộp */}
            <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Thời gian còn lại
                </span>
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${isCriticalTime
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-50 text-slate-700 border-slate-200"
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
                className="w-full flex items-center justify-center gap-2 rounded-xl border-slate-300 text-slate-800 bg-white hover:bg-slate-50 text-xs md:text-sm"
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
