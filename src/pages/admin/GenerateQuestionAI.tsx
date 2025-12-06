import { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // ⬅️ thêm import

export function GenerateQuestionAI({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<any>(null);

  // danh sách index các câu hỏi được chọn
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  const [form, setForm] = useState({
    grade: "",
    skill: "",
    level: "",
    type: "multiple_choice", // mặc định
  });

  const handleGenerate = async () => {
    if (!form.grade || !form.skill || !form.level || !form.type) {
      return toast.error(
        "Vui lòng chọn đầy đủ lớp, kỹ năng, cấp độ và loại câu hỏi!"
      );
    }

    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await axios.post(
        "https://english-backend-uoic.onrender.com/api/ai",
        { ...form },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGenerated(res.data);

      // mặc định chọn tất cả câu hỏi được tạo
      const total = res.data?.questions?.length || 0;
      setSelectedIndexes(total ? Array.from({ length: total }, (_, i) => i) : []);

      toast.success("🎉 AI đã tạo câu hỏi thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo câu hỏi AI");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generated?.questions?.length)
      return toast.error("Không có câu hỏi để lưu");

    const questions = generated.questions as any[];

    // lọc các câu hỏi được chọn
    const selectedQuestions = questions.filter((_, idx) =>
      selectedIndexes.includes(idx)
    );

    if (!selectedQuestions.length) {
      return toast.error("Vui lòng chọn ít nhất 1 câu hỏi để lưu");
    }

    const token = localStorage.getItem("token");

    const payload = selectedQuestions.map((q: any) => ({
      content: q.content,
      type: form.type, // với speaking sẽ là "speaking"
      options: q.options || [],
      answer: q.answer || "",
      explanation: q.explanation || "",
      skill: form.skill,
      level: form.level,
      grade: form.grade,
    }));

    try {
      await axios.post("https://english-backend-uoic.onrender.com/api/questions/bulk", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`✅ Đã lưu ${payload.length} câu hỏi`);
      onSuccess?.();
      setOpen(false);
      setGenerated(null);
      setSelectedIndexes([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu câu hỏi");
    }
  };

  // toggle chọn 1 câu
  const toggleSelect = (idx: number) => {
    setSelectedIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // chọn / bỏ chọn tất cả
  const toggleSelectAll = () => {
    if (!generated?.questions?.length) return;
    if (selectedIndexes.length === generated.questions.length) {
      setSelectedIndexes([]);
    } else {
      setSelectedIndexes(
        Array.from({ length: generated.questions.length }, (_, i) => i)
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 ml-2">
          🤖 Tạo câu hỏi AI
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo câu hỏi tự động bằng AI</DialogTitle>
          <DialogDescription>
            Chọn lớp, kỹ năng, cấp độ và (nếu cần) loại câu hỏi để AI tạo tự động
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Grade */}
          <div>
            <Label>Lớp</Label>
            <Select
              value={form.grade}
              onValueChange={(val) => setForm({ ...form, grade: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 7 }, (_, i) => 6 + i).map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    Lớp {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skill (có Speaking) */}
          <div>
            <Label>Kỹ năng</Label>
            <Select
              value={form.skill}
              onValueChange={(val) =>
                setForm((prev) => {
                  let nextType = prev.type;

                  if (val === "writing") {
                    nextType = prev.type.startsWith("writing_")
                      ? prev.type
                      : "writing_sentence_order";
                  } else if (val === "speaking") {
                    nextType = "speaking";
                  } else {
                    if (
                      prev.type.startsWith("writing_") ||
                      prev.type === "speaking"
                    ) {
                      nextType = "multiple_choice";
                    }
                  }

                  return {
                    ...prev,
                    skill: val,
                    type: nextType,
                  };
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn kỹ năng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Level */}
          <div>
            <Label>Cấp độ</Label>
            <Select
              value={form.level}
              onValueChange={(val) => setForm({ ...form, level: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn cấp độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type: Ẩn hoàn toàn khi skill = speaking */}
          {form.skill !== "speaking" && (
            <div>
              <Label>Loại câu hỏi</Label>
              <Select
                value={form.type}
                onValueChange={(val) => setForm({ ...form, type: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại câu hỏi" />
                </SelectTrigger>
                <SelectContent>
                  {form.skill === "writing" ? (
                    <>
                      <SelectItem value="writing_sentence_order">
                        Writing – Sắp xếp câu
                      </SelectItem>
                      <SelectItem value="writing_add_words">
                        Writing – Thêm từ còn thiếu
                      </SelectItem>
                      <SelectItem value="writing_paragraph">
                        Writing – Viết đoạn văn
                      </SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="multiple_choice">
                        Multiple Choice
                      </SelectItem>
                      <SelectItem value="fill_blank">
                        Fill in the Blank
                      </SelectItem>
                      <SelectItem value="true_false">
                        True / False
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.skill === "speaking" && (
            <p className="text-xs text-slate-500">
              Kỹ năng Speaking: hệ thống sẽ tự tạo <b>nhiệm vụ nói</b>, không cần chọn loại câu hỏi.
            </p>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? "🤔 AI đang tạo..." : "Tạo câu hỏi"}
          </Button>

          {generated && (
            <div className="border p-3 rounded-lg mt-4 bg-gray-50 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">Câu hỏi được tạo:</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {generated.questions?.length &&
                  selectedIndexes.length === generated.questions.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </Button>
              </div>

              {generated.questions?.map((q: any, i: number) => {
                const checked = selectedIndexes.includes(i);
                return (
                  <div
                    key={i}
                    className="border p-2 rounded flex gap-3 items-start"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleSelect(i)}
                      className="mt-1"
                    />

                    <div className="flex-1">
                      <p className="font-medium">
                        {i + 1}. {q.content}
                      </p>

                      {/* Nếu có options (multiple_choice) thì hiển thị */}
                      {q.options?.length > 0 ? (
                        <ul className="list-disc ml-5 mt-1">
                          {q.options.map((opt: string, idx: number) => (
                            <li key={idx}>
                              {opt}{" "}
                              {opt === q.answer && <b>(Đáp án đúng)</b>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        // Fill_blank / Writing / Speaking: hiển thị đáp án text
                        <p className="text-green-600 font-semibold mt-1">
                          Đáp án / Sample answer: {q.answer}
                        </p>
                      )}

                      {q.explanation && (
                        <p className="text-gray-600 mt-1">
                          Giải thích: {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              <Button
                onClick={handleSave}
                className="mt-3 w-full bg-green-600 hover:bg-green-700"
                disabled={!selectedIndexes.length}
              >
                💾 Lưu {selectedIndexes.length} câu hỏi đã chọn
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
