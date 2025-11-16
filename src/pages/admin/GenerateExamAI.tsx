import { useState, useCallback, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { testAPI } from "@/api/Api";

type GenerateExamAIProps = {
  onSuccess?: () => void | Promise<void>;
  children?: ReactNode;
};

export function GenerateExamAI({ onSuccess, children }: GenerateExamAIProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [createdExam, setCreatedExam] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    grade: "",
    skill: "",
    level: "",
    duration: 45,
    numQuestions: 10,
  });

  const handleGenerate = useCallback(async () => {
    if (!form.grade || !form.skill || !form.numQuestions || !form.duration) {
      return toast.error("Vui lòng điền đầy đủ thông tin");
    }

    try {
      setLoading(true);
      const res = await testAPI.createAI(form); // gọi /exam-ai/create
      if (!res.data.questions?.length) return toast.error("Không có câu hỏi phù hợp");

      setQuestions(res.data.questions);
      setCreatedExam({
        title: form.title || `Đề thi lớp ${form.grade} - ${form.skill}`,
        grade: form.grade,
        skill: form.skill,
        level: form.level || "mixed",
        duration: form.duration,
        questions: res.data.questions.map((q: any) => q._id),
      });

      toast.success("🎉 AI đã chọn câu hỏi thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo đề thi AI");
    } finally {
      setLoading(false);
    }
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!createdExam || !questions.length) return toast.error("Chưa có đề thi để lưu");

    try {
      setLoading(true);
      await testAPI.saveExam(createdExam); // gọi /exams/save
      toast.success("✅ Đề thi đã lưu vào database!");
      await onSuccess?.();

      setOpen(false);
      setQuestions([]);
      setCreatedExam(null);
      setForm({
        title: "",
        grade: "",
        skill: "",
        level: "",
        duration: 45,
        numQuestions: 10,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu đề thi");
    } finally {
      setLoading(false);
    }
  }, [createdExam, questions, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className="bg-purple-600 hover:bg-purple-700 ml-2">
            🤖 Tạo đề thi AI
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo đề thi tự động bằng AI</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>Tên đề thi</Label>
            <Input
              placeholder="Nhập tên đề (có thể bỏ trống)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

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

          <div>
            <Label>Kỹ năng</Label>
            <Select
              value={form.skill}
              onValueChange={(val) => setForm({ ...form, skill: val })}
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
                <SelectItem value="mixed">Mixed (Tự random)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Thời gian (phút)</Label>
            <Input
              type="number"
              value={form.duration}
              onChange={(e) =>
                setForm({ ...form, duration: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <Label>Số câu hỏi</Label>
            <Input
              type="number"
              value={form.numQuestions}
              onChange={(e) =>
                setForm({ ...form, numQuestions: Number(e.target.value) })
              }
            />
          </div>

          <Button onClick={handleGenerate} className="w-full" disabled={loading}>
            {loading ? "⏳ Đang chọn câu hỏi..." : "Chọn câu hỏi & tạo đề thi AI"}
          </Button>

          {questions.length > 0 && (
            <div className="border p-3 rounded-lg bg-gray-50 space-y-2 mt-4">
              <h3 className="font-semibold text-lg">Danh sách câu hỏi:</h3>
              {questions.map((q, i) => (
                <div key={q._id || i} className="border p-2 rounded">
                  <p>
                    {i + 1}. {q.content}
                  </p>
                  {q.options?.length > 0 && (
                    <ul className="list-disc ml-5">
                      {q.options.map((opt: string, idx: number) => (
                        <li key={idx}>
                          {opt} {opt === q.answer && <b>(Đáp án đúng)</b>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              <Button onClick={handleSave} className="w-full mt-4" disabled={loading}>
                {loading ? "⏳ Đang lưu..." : "💾 Lưu đề thi"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
