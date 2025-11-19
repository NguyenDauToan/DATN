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

  // form câu đơn (lớp 6–12)
  const [form, setForm] = useState({
    content: "",
    skill: "",
    grade: "",
    level: "",
    type: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: 0,
  });

  // form bộ Reading (kỳ thi lớn)
  const [readingPassage, setReadingPassage] = useState("");
  const [readingQuestions, setReadingQuestions] = useState<ReadingSubQuestion[]>(
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

  // ========== CÂU ĐƠN ==========
  const handleChangeOption = (index: number, value: string) => {
    const updated = [...form.options];
    updated[index] = value;
    setForm({ ...form, options: updated });
  };

  // ========== READING SET ==========
  const handleReadingLabelChange = (qIndex: number, value: string) => {
    setReadingQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, label: value } : q))
    );
  };

  const handleReadingOptionChange = (
    qIndex: number,
    optIndex: number,
    value: string
  ) => {
    setReadingQuestions((prev) =>
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

  const handleReadingCorrectChange = (qIndex: number, value: string) => {
    const idx = Number(value) || 0;
    setReadingQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, correctIndex: idx } : q))
    );
  };

  const handleAddReadingQuestion = () => {
    setReadingQuestions((prev) => [
      ...prev,
      {
        label: `Question ${prev.length + 1}`,
        options: ["", "", "", ""],
        correctIndex: 0,
      },
    ]);
  };

  const handleRemoveReadingQuestion = (index: number) => {
    setReadingQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // ========== SUBMIT ==========
  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return toast.error("Chưa đăng nhập");
    }

    // ---- MODE 1: kỳ thi lớn (THPTQG/IELTS/TOEIC/VSTEP) → 1 document reading_cloze ----
    if (isExamGrade) {
      if (!form.grade) return toast.error("Vui lòng chọn kỳ thi");
      if (!readingPassage.trim()) {
        return toast.error("Vui lòng nhập đoạn văn Reading");
      }

      for (let i = 0; i < readingQuestions.length; i++) {
        const q = readingQuestions[i];
        if (q.options.some((o) => !o.trim())) {
          return toast.error(`Câu Reading ${i + 1}: thiếu đáp án`);
        }
        if (
          q.correctIndex < 0 ||
          q.correctIndex >= q.options.length ||
          !q.options[q.correctIndex].trim()
        ) {
          return toast.error(`Câu Reading ${i + 1}: đáp án đúng không hợp lệ`);
        }
      }

      // payload đúng với backend: type = "reading_cloze", 1 document chứa subQuestions
      const payload = {
        content: readingPassage.trim(),       // đoạn văn
        type: "reading_cloze",
        skill: "reading",
        grade: form.grade,                    // thptqg / ielts / toeic / vstep
        // có thể set level chung cho đoạn, hoặc bỏ để BE dùng default
        level: "medium",
        subQuestions: readingQuestions.map((q) => ({
          label: q.label,
          options: q.options,
          correctIndex: q.correctIndex,
        })),
        tags: ["reading_cloze"],
      };

      try {
        setLoading(true);
        await axios.post("http://localhost:5000/api/questions", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast.success(
          `Đã thêm 1 câu Reading cloze (${readingQuestions.length} blank) cho kỳ thi ${form.grade.toUpperCase()}`
        );

        // reset
        setForm({
          content: "",
          skill: "",
          grade: "",
          level: "",
          type: "multiple_choice",
          options: ["", "", "", ""],
          correctAnswer: 0,
        });
        setReadingPassage("");
        setReadingQuestions(
          Array.from({ length: 4 }, (_, i) => ({
            label: `Question ${i + 1}`,
            options: ["", "", "", ""],
            correctIndex: 0,
          }))
        );
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

    // ---- MODE 2: lớp 6–12 → câu đơn như cũ ----
    if (
      !form.content ||
      !form.grade ||
      !form.skill ||
      !form.level ||
      form.options.some((o) => !o.trim())
    ) {
      return toast.error("Vui lòng điền đầy đủ thông tin và tất cả đáp án");
    }

    const payload = {
      content: form.content,
      type: form.type,
      options: form.options,
      answer: form.options[form.correctAnswer],
      skill: form.skill,
      grade: form.grade,
      level: form.level,
    };

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/questions", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Thêm câu hỏi thành công 🎉");
      setOpen(false);
      setForm({
        content: "",
        skill: "",
        level: "",
        grade: "",
        type: "multiple_choice",
        options: ["", "", "", ""],
        correctAnswer: 0,
      });
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi thêm câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDER ==========
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
              ? "Thêm bộ câu hỏi Reading cho kỳ thi"
              : "Thêm câu hỏi mới"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lớp / Kỳ thi – đặt lên trên cho dễ chọn trước */}
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

          {/* ========= FORM KỲ THI: READING SET ========= */}
          {isExamGrade ? (
            <>
              <div className="rounded-xl border border-dashed p-3 bg-muted/40 text-xs text-muted-foreground">
                Bạn đang chọn kỳ thi{" "}
                <b>{form.grade.toUpperCase()}</b>. Hệ thống sẽ lưu <b>1 câu hỏi
                Reading cloze</b> gồm nhiều blank (Question 1, Question 2,...)
                cho cùng một đoạn văn.
              </div>

              {/* Đoạn văn */}
              <div>
                <Label>Đoạn văn (Reading passage)</Label>
                <Textarea
                  rows={8}
                  placeholder="Dán đoạn văn có chỗ trống 1, 2, 3, 4, ... tại đây"
                  value={readingPassage}
                  onChange={(e) => setReadingPassage(e.target.value)}
                />
              </div>

              {/* Danh sách câu 1..n */}
              <div className="space-y-4">
                {readingQuestions.map((q, qIndex) => (
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
                            handleReadingLabelChange(qIndex, e.target.value)
                          }
                        />
                      </div>
                      {readingQuestions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="mt-6 text-red-600"
                          onClick={() =>
                            handleRemoveReadingQuestion(qIndex)
                          }
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
                              handleReadingOptionChange(
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
                          handleReadingCorrectChange(qIndex, val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đáp án đúng" />
                        </SelectTrigger>
                        <SelectContent>
                          {q.options.map((opt, idx) => (
                            <SelectItem key={idx} value={idx.toString()}>
                              {opt ||
                                `Đáp án ${String.fromCharCode(65 + idx)}`}
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
                  onClick={handleAddReadingQuestion}
                >
                  + Thêm câu Reading nữa
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* ========= FORM LỚP 6–12: CÂU ĐƠN ========= */}
              <div>
                <Label>Nội dung câu hỏi</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>

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
                <Label>Kỹ năng</Label>
                <Select
                  value={form.skill}
                  onValueChange={(val) =>
                    setForm({ ...form, skill: val })
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
  const [form, setForm] = useState({
    content: "",
    skill: "",
    grade: "",
    level: "",
    type: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: 0,
  });

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("skill", skill);
    formData.append("grade", grade);
    formData.append("level", level);

    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/questions/import", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
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
        <Button className="bg-green-600 hover:bg-green-700 ml-2">Import Excel</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import câu hỏi từ Excel</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div>
            <Label>Kỹ năng</Label>
            <Select value={skill} onValueChange={setSkill}>
              <SelectTrigger><SelectValue placeholder="Chọn kỹ năng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="listening">Listening</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Lớp / Kỳ thi */}
          <div>
            <Label>Lớp / Kỳ thi</Label>
            <Select
              value={form.grade}
              onValueChange={(val) => setForm((prev) => ({ ...prev, grade: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp / kỳ thi" />
              </SelectTrigger>
              <SelectContent>
                {/* Lớp 6–12 */}
                {Array.from({ length: 7 }, (_, i) => 6 + i).map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    Lớp {g}
                  </SelectItem>
                ))}

                {/* Các kỳ thi lớn dùng chung field grade */}
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
              <SelectTrigger><SelectValue placeholder="Chọn level" /></SelectTrigger>
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
          onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
        />
      </DialogContent>
    </Dialog>
  );
}
