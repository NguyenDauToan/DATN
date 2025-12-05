import { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReadingSubQuestion = {
  label: string;        // Question 1, Question 2...
  options: string[];    // A,B,C,D
  correctIndex: number; // 0..3
};

export function AddQuestionDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState("");

  // form cơ bản
  const [form, setForm] = useState({
    content: "",
    skill: "",
    grade: "",
    level: "",
    type: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: 0,
  });
  const [writingCorrectAnswer, setWritingCorrectAnswer] = useState("");

  // audio listening
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);

  // dùng chung: Reading passage / Listening transcript
  const [passageOrTranscript, setPassageOrTranscript] = useState("");

  // bộ câu con (dùng cho Reading cloze + Listening nhiều câu)
  const [subQuestions, setSubQuestions] = useState<ReadingSubQuestion[]>(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        label: `Question ${i + 1}`,
        options: ["", "", "", ""],
        correctIndex: 0,
      }))
  );

  const isExamGrade = ["thptqg", "ielts", "toeic", "vstep"].includes(
    form.grade
  );
  const isExamReading = isExamGrade && form.skill === "reading";
  const isListeningMulti = form.skill === "listening"; // listening luôn là nhiều câu

  // ========== COMMON HANDLERS ==========

  const handleChangeOption = (index: number, value: string) => {
    const updated = [...form.options];
    updated[index] = value;
    setForm({ ...form, options: updated });
  };

  const handleUploadAudio = async (file: File) => {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("Chưa đăng nhập");

    const formData = new FormData();
    formData.append("audio", file);

    try {
      setAudioUploading(true);
      const res = await axios.post(
        "https://english-backend-uoic.onrender.com/api/questions/upload-audio",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setAudioUrl(res.data.audioUrl);
      toast.success("Tải audio thành công");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Lỗi khi upload file audio"
      );
    } finally {
      setAudioUploading(false);
    }
  };

  // ========== SUB QUESTION HANDLERS (Reading/Listening nhiều câu) ==========

  const handleSubLabelChange = (qIndex: number, value: string) => {
    setSubQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, label: value } : q))
    );
  };

  const handleSubOptionChange = (
    qIndex: number,
    optIndex: number,
    value: string
  ) => {
    setSubQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
            ...q,
            options: q.options.map((opt, j) =>
              j === optIndex ? value : opt
            ),
          }
          : q
      )
    );
  };

  const handleSubCorrectChange = (qIndex: number, value: string) => {
    const idx = Number(value) || 0;
    setSubQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, correctIndex: idx } : q))
    );
  };

  const handleAddSubQuestion = () => {
    setSubQuestions((prev) => [
      ...prev,
      {
        label: `Question ${prev.length + 1}`,
        options: ["", "", "", ""],
        correctIndex: 0,
      },
    ]);
  };

  const handleRemoveSubQuestion = (index: number) => {
    setSubQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // ========== SUBMIT ==========

  const resetAll = () => {
    setForm({
      content: "",
      skill: "",
      grade: "",
      level: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: 0,
    });
    setPassageOrTranscript("");
    setSubQuestions(
      Array.from({ length: 4 }, (_, i) => ({
        label: `Question ${i + 1}`,
        options: ["", "", "", ""],
        correctIndex: 0,
      }))
    );
    setAudioUrl(null);
    setWritingCorrectAnswer("");
    setExplanation("");
  };

  const validateSubQuestions = (labelPrefix: string) => {
    for (let i = 0; i < subQuestions.length; i++) {
      const q = subQuestions[i];
      if (q.options.some((o) => !o.trim())) {
        toast.error(`${labelPrefix} ${i + 1}: thiếu đáp án`);
        return false;
      }
      if (
        q.correctIndex < 0 ||
        q.correctIndex >= q.options.length ||
        !q.options[q.correctIndex].trim()
      ) {
        toast.error(
          `${labelPrefix} ${i + 1}: đáp án đúng không hợp lệ`
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return toast.error("Chưa đăng nhập");
    }

    // ---- MODE 1: Kỳ thi + Reading cloze (nhiều câu) ----
    if (isExamReading) {
      if (!form.grade) return toast.error("Vui lòng chọn kỳ thi");
      if (!passageOrTranscript.trim()) {
        return toast.error("Vui lòng nhập đoạn văn Reading");
      }
      if (!validateSubQuestions("Câu Reading")) return;

      const payload = {
        content: passageOrTranscript.trim(),
        type: "reading_cloze",
        skill: "reading",
        grade: form.grade,
        level: "medium",
        subQuestions: subQuestions.map((q) => ({
          label: q.label,
          options: q.options,
          correctIndex: q.correctIndex,
        })),
        tags: ["reading_cloze"],
        explanation: explanation || undefined,
      };

      try {
        setLoading(true);
        await axios.post("https://english-backend-uoic.onrender.com/api/questions", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast.success(
          `Đã thêm 1 bộ Reading cloze (${subQuestions.length} câu) cho kỳ thi ${form.grade.toUpperCase()}`
        );

        resetAll();
        setOpen(false);
        onSuccess?.();
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.message ||
          "Lỗi khi thêm câu hỏi Reading cloze"
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // ---- MODE 2: Listening (luôn nhiều câu – có thể cho mọi grade) ----
    if (isListeningMulti) {
      if (!form.grade) return toast.error("Vui lòng chọn lớp / kỳ thi");
      if (!form.level) return toast.error("Vui lòng chọn level");
      if (!audioUrl) {
        return toast.error("Vui lòng upload file audio Listening");
      }
      if (!passageOrTranscript.trim()) {
        return toast.error("Vui lòng nhập transcript / mô tả bài Listening");
      }
      if (!validateSubQuestions("Câu Listening")) return;

      const payload = {
        content: passageOrTranscript.trim(), // transcript / mô tả
        type: "reading_cloze",              // dùng chung logic cloze
        skill: "listening",
        grade: form.grade,
        level: form.level || "medium",
        audioUrl,
        subQuestions: subQuestions.map((q) => ({
          label: q.label,
          options: q.options,
          correctIndex: q.correctIndex,
        })),
        tags: ["listening_audio"],
        explanation: explanation || undefined,
      };

      try {
        setLoading(true);
        await axios.post("https://english-backend-uoic.onrender.com/api/questions", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast.success(
          `Đã thêm 1 bài Listening (${subQuestions.length} câu) cho ${isExamGrade ? "kỳ thi" : "lớp"
          } ${form.grade.toUpperCase()}`
        );

        resetAll();
        setOpen(false);
        onSuccess?.();
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.message ||
          "Lỗi khi thêm bài Listening nhiều câu"
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // ---- MODE 3: Còn lại (Reading/ Writing/ Speaking câu đơn) ----
    if (!form.content || !form.grade || !form.skill || !form.level) {
      return toast.error(
        "Vui lòng điền đầy đủ nội dung, kỹ năng, lớp/kỳ thi và level"
      );
    }

    // 👉 Speaking: câu đơn, không cần đáp án/options
    if (form.skill === "speaking") {
      const payload: any = {
        content: form.content,
        type: "speaking",
        skill: "speaking",
        grade: form.grade,
        level: form.level,
        explanation: explanation || undefined,
        // nếu sau này backend cho phép audioUrl cho speaking thì thêm ở đây:
        // audioUrl: audioUrl || undefined,
      };

      try {
        setLoading(true);
        await axios.post("https://english-backend-uoic.onrender.com/api/questions", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Thêm câu Speaking thành công");
        setOpen(false);
        resetAll();
        onSuccess?.();
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.message || "Lỗi khi thêm câu Speaking"
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // 👉 Writing: xử lý riêng
    if (form.skill === "writing") {
      if (
        form.type !== "writing_sentence_order" &&
        form.type !== "writing_add_words" &&
        form.type !== "writing_paragraph"
      ) {
        return toast.error("Vui lòng chọn loại câu hỏi Writing");
      }

      // writing_paragraph: chỉ lưu, không chấm tự động
      if (form.type === "writing_paragraph") {
        const payload: any = {
          content: form.content,
          type: form.type,
          skill: form.skill,
          grade: form.grade,
          level: form.level,
        };

        try {
          setLoading(true);
          await axios.post("https://english-backend-uoic.onrender.com/api/questions", payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Thêm câu Writing (viết đoạn văn) thành công");
          setOpen(false);
          resetAll();
          onSuccess?.();
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message || "Lỗi khi thêm câu Writing"
          );
        } finally {
          setLoading(false);
        }
        return;
      }

      // writing_sentence_order & writing_add_words: cần đáp án chuẩn (string)
      if (!writingCorrectAnswer.trim()) {
        return toast.error("Vui lòng nhập đáp án đúng cho câu Writing");
      }

      const payload: any = {
        content: form.content,
        type: form.type, // writing_sentence_order / writing_add_words
        answer: writingCorrectAnswer.trim(),
        skill: form.skill,
        grade: form.grade,
        level: form.level,
      };

      try {
        setLoading(true);
        await axios.post("https://english-backend-uoic.onrender.com/api/questions", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Thêm câu Writing thành công");
        setOpen(false);
        resetAll();
        onSuccess?.();
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Lỗi khi thêm câu Writing"
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // 👉 Các skill khác: dùng logic cũ (MCQ / fill_blank / true_false)
    if (form.options.some((o) => !o.trim())) {
      return toast.error("Vui lòng điền đầy đủ các đáp án lựa chọn");
    }

    const payload: any = {
      content: form.content,
      type: form.type,
      options: form.options,
      answer: form.options[form.correctAnswer],
      skill: form.skill,
      grade: form.grade,
      level: form.level,
      explanation: explanation || undefined,
    };

    try {
      setLoading(true);
      await axios.post("https://english-backend-uoic.onrender.com/api/questions", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Thêm câu hỏi thành công 🎉");
      setOpen(false);
      resetAll();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi thêm câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  // ========== UI ==========

  const renderSubQuestionsBlock = () => (
    <div className="space-y-4">
      {subQuestions.map((q, qIndex) => (
        <div
          key={qIndex}
          className="rounded-xl border border-muted p-3 space-y-3 bg-muted/30"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <Label>Tên câu hỏi / vị trí chỗ trống</Label>
              <Input
                value={q.label}
                onChange={(e) =>
                  handleSubLabelChange(qIndex, e.target.value)
                }
              />
            </div>
            {subQuestions.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                className="mt-6 text-red-600"
                onClick={() => handleRemoveSubQuestion(qIndex)}
              >
                Xóa
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {q.options.map((opt, optIndex) => (
              <div key={optIndex}>
                <Label>
                  Đáp án {String.fromCharCode(65 + optIndex)}
                </Label>
                <Input
                  value={opt}
                  onChange={(e) =>
                    handleSubOptionChange(
                      qIndex,
                      optIndex,
                      e.target.value
                    )
                  }
                />
              </div>
            ))}
          </div>

          <div>
            <Label>Đáp án đúng</Label>
            <Select
              value={q.correctIndex.toString()}
              onValueChange={(val) =>
                handleSubCorrectChange(qIndex, val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn đáp án đúng" />
              </SelectTrigger>
              <SelectContent>
                {q.options.map((opt, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {opt || `Đáp án ${String.fromCharCode(65 + idx)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={handleAddSubQuestion}
      >
        + Thêm câu nữa
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          + Thêm câu hỏi
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isExamGrade
              ? "Thêm câu hỏi / bài cho kỳ thi"
              : "Thêm câu hỏi mới"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lớp / Kỳ thi */}
          <div>
            <Label>Lớp / Kỳ thi</Label>
            <Select
              value={form.grade}
              onValueChange={(val) =>
                setForm((prev) => ({ ...prev, grade: val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp / kỳ thi" />
              </SelectTrigger>
              <SelectContent className="p-0">
                <div className="max-h-60 overflow-y-auto">
                  {Array.from({ length: 7 }, (_, i) => 6 + i).map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      Lớp {g}
                    </SelectItem>
                  ))}
                  <SelectItem value="thptqg">THPTQG</SelectItem>
                  <SelectItem value="ielts">IELTS</SelectItem>
                  <SelectItem value="toeic">TOEIC</SelectItem>
                  <SelectItem value="vstep">VSTEP</SelectItem>
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Kỹ năng */}
          <div>
            <Label>Kỹ năng</Label>
            <Select
              value={form.skill}
              onValueChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  skill: val,
                  type:
                    val === "writing"
                      ? "writing_sentence_order"
                      : val === "speaking"
                        ? "speaking"
                        : prev.type === "writing_sentence_order" ||
                          prev.type === "writing_paragraph" ||
                          prev.type === "writing_add_words" ||
                          prev.type === "speaking"
                          ? "multiple_choice"
                          : prev.type,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn kỹ năng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="listening">Listening</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Listening: luôn multi-câu + audio + transcript */}
          {isListeningMulti && (
            <>
              <div className="rounded-xl border border-dashed p-3 bg-muted/40 text-xs text-muted-foreground">
                Bạn đang tạo <b>bài Listening</b> với <b>1 audio</b> và{" "}
                <b>nhiều câu hỏi</b>.
              </div>

              <div>
                <Label>File audio (Listening)</Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadAudio(file);
                  }}
                />
                {audioUploading && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Đang tải audio...
                  </p>
                )}
                {audioUrl && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground break-all">
                      {audioUrl}
                    </p>
                    <audio controls src={audioUrl} className="w-full" />
                  </div>
                )}
              </div>

              <div>
                <Label>Transcript / mô tả bài Listening</Label>
                <Textarea
                  rows={5}
                  placeholder="Nhập transcript hoặc mô tả nội dung bài nghe..."
                  value={passageOrTranscript}
                  onChange={(e) => setPassageOrTranscript(e.target.value)}
                />
              </div>

              <div>
                <Label>Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, level: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Danh sách câu hỏi listening */}
              {renderSubQuestionsBlock()}
            </>
          )}

          {/* Kỳ thi + Reading cloze */}
          {!isListeningMulti && isExamReading && (
            <>
              <div className="rounded-xl border border-dashed p-3 bg-muted/40 text-xs text-muted-foreground">
                Bạn đang tạo <b>bộ Reading cloze</b> cho kỳ thi{" "}
                <b>{form.grade.toUpperCase()}</b>.
              </div>

              <div>
                <Label>Đoạn văn (Reading passage)</Label>
                <Textarea
                  rows={8}
                  placeholder="Dán đoạn văn có chỗ trống 1, 2, 3, 4, ... tại đây"
                  value={passageOrTranscript}
                  onChange={(e) => setPassageOrTranscript(e.target.value)}
                />
              </div>

              <div>
                <Label>Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, level: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderSubQuestionsBlock()}
            </>
          )}

          {/* Câu đơn (reading / writing / speaking, hoặc reading lớp thường) */}
          {!isListeningMulti && !isExamReading && (
            <>
              <div>
                <Label>
                  {form.skill === "speaking"
                    ? "Đoạn văn / câu mẫu để học sinh đọc lại"
                    : "Nội dung câu hỏi"}
                </Label>
                <Textarea
                  rows={form.skill === "speaking" ? 6 : 4}
                  placeholder={
                    form.skill === "speaking"
                      ? "Nhập đoạn văn tiếng Anh chuẩn để học sinh đọc lại...\nVí dụ:\nMy favorite hobby is playing basketball. I play it three times a week..."
                      : "Nhập nội dung câu hỏi..."
                  }
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
                {form.skill === "speaking" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hệ thống sẽ dùng chính đoạn văn này làm đáp án chuẩn để so sánh với
                    phần đọc của học sinh (AI chấm độ chính xác và phát âm).
                  </p>
                )}
              </div>

              {/* Writing */}
              {form.skill === "writing" ? (
                <>
                  <div>
                    <Label>Loại câu hỏi Writing</Label>
                    <Select
                      value={form.type}
                      onValueChange={(val) =>
                        setForm((prev) => ({
                          ...prev,
                          type: val,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại câu hỏi Writing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="writing_sentence_order">
                          Sắp xếp câu (Writing Sentence Order)
                        </SelectItem>
                        <SelectItem value="writing_add_words">
                          Thêm từ còn thiếu (Writing Add Words)
                        </SelectItem>
                        <SelectItem value="writing_paragraph">
                          Viết đoạn văn (Writing Paragraph)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Level</Label>
                    <Select
                      value={form.level}
                      onValueChange={(val) =>
                        setForm({ ...form, level: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.type === "writing_paragraph" && (
                    <div className="rounded-md bg-muted/40 border border-dashed p-3 text-xs text-muted-foreground">
                      Câu Writing dạng <b>viết đoạn văn</b>. Hệ thống sẽ lưu câu trả lời
                      của học viên để giáo viên chấm tay, không tự chấm điểm.
                    </div>
                  )}

                  {(form.type === "writing_sentence_order" ||
                    form.type === "writing_add_words") && (
                      <div>
                        <Label>Đáp án đúng (dùng để chấm tự động)</Label>
                        <Textarea
                          rows={3}
                          placeholder="Nhập đáp án chuẩn..."
                          value={writingCorrectAnswer}
                          onChange={(e) =>
                            setWritingCorrectAnswer(e.target.value)
                          }
                        />
                      </div>
                    )}
                </>
              ) : form.skill === "speaking" ? (
                // Speaking UI
                <>
                  <div>
                    <Label>Level</Label>
                    <Select
                      value={form.level}
                      onValueChange={(val) =>
                        setForm({ ...form, level: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Gợi ý chấm điểm / ghi chú (tùy chọn)</Label>
                    <Textarea
                      rows={3}
                      placeholder="Ví dụ: chấm theo Pronunciation, Accuracy, Fluency..."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                    />
                  </div>

                  <div className="rounded-md bg-muted/40 border border-dashed p-3 text-xs text-muted-foreground">
                    Câu <b>Speaking luyện đọc</b>: học sinh sẽ ghi âm đọc lại đúng đoạn văn ở
                    trên. Hệ thống dùng AI (Whisper + Ollama) để chuyển giọng nói thành
                    văn bản và so sánh với đoạn chuẩn, gợi ý điểm về phát âm và độ chính xác.
                  </div>
                </>
              ) : (
                // Các skill khác: MCQ / Fill / True-False
                <>
                  <div>
                    <Label>Loại câu hỏi</Label>
                    <Select
                      value={form.type}
                      onValueChange={(val) =>
                        setForm({ ...form, type: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại câu hỏi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">
                          Multiple Choice
                        </SelectItem>
                        <SelectItem value="fill_blank">
                          Fill in the Blank
                        </SelectItem>
                        <SelectItem value="true_false">
                          True / False
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Level</Label>
                    <Select
                      value={form.level}
                      onValueChange={(val) =>
                        setForm({ ...form, level: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {form.options.map((opt, idx) => (
                      <div key={idx}>
                        <Label>Đáp án {idx + 1}</Label>
                        <Input
                          value={opt}
                          onChange={(e) =>
                            handleChangeOption(idx, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>Giải thích (tùy chọn)</Label>
                    <Textarea
                      rows={3}
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Đáp án đúng</Label>
                    <Select
                      value={form.correctAnswer.toString()}
                      onValueChange={(val) =>
                        setForm({
                          ...form,
                          correctAnswer: Number(val),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đáp án đúng" />
                      </SelectTrigger>
                      <SelectContent>
                        {form.options.map((opt, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {opt || `Đáp án ${idx + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Đang lưu..." : "Lưu câu hỏi"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================

export function ImportExcelDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skill, setSkill] = useState("");
  const [grade, setGrade] = useState("");
  const [level, setLevel] = useState("");

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("skill", skill);
    formData.append("grade", grade);
    formData.append("level", level);

    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await axios.post(
        "https://english-backend-uoic.onrender.com/api/questions/import",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success(res.data.message);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi import Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 ml-2">
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import câu hỏi từ Excel</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div>
            <Label>Kỹ năng</Label>
            <Select value={skill} onValueChange={setSkill}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn kỹ năng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="listening">Listening</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Lớp / Kỳ thi</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp / kỳ thi" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 7 }, (_, i) => 6 + i).map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    Lớp {g}
                  </SelectItem>
                ))}
                <SelectItem value="thptqg">Kỳ thi THPTQG</SelectItem>
                <SelectItem value="ielts">Kỳ thi IELTS</SelectItem>
                <SelectItem value="toeic">Kỳ thi TOEIC</SelectItem>
                <SelectItem value="vstep">Kỳ thi VSTEP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) =>
            e.target.files?.[0] && handleImport(e.target.files[0])
          }
        />
      </DialogContent>
    </Dialog>
  );
}
