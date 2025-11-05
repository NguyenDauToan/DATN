import { useState, useEffect } from "react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, PlusCircle } from "lucide-react";

export default function AddExamModal({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    level: "",
    grade: "",
    duration: 30,
    selectedQuestions: [] as string[],
  });

  const token = localStorage.getItem("token");

  // 🔹 Load câu hỏi
  const loadQuestions = async (grade?: string, level?: string) => {
    if (!token) return;
    try {
      const params: any = {};
      if (grade) params.grade = grade;
      if (level) params.level = level;

      const res = await axios.get("http://localhost:5000/api/questions/filter", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setQuestions(data);
    } catch (err) {
      console.error(err);
      setQuestions([]);
    }
  };

  useEffect(() => {
    loadQuestions(form.grade, form.level);
    setForm((prev) => ({ ...prev, selectedQuestions: [] }));
  }, [form.grade, form.level]);

  const handleSubmit = async () => {
    if (!form.title || !form.level || !form.grade || form.selectedQuestions.length === 0) {
      return toast.error("Vui lòng điền đầy đủ thông tin và chọn câu hỏi");
    }

    try {
      setLoading(true);
      await axios.post(
        "http://localhost:5000/api/exams",
        {
          title: form.title,
          level: form.level,
          grade: form.grade,
          duration: form.duration,
          questions: form.selectedQuestions,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Tạo đề thi thành công 🎉");
      setOpen(false);
      setForm({ title: "", level: "", grade: "", duration: 30, selectedQuestions: [] });
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo đề");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow">
          <PlusCircle size={18} />
          Tạo đề thi
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-indigo-600">
            🎯 Tạo đề thi mới
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 mt-4">
          {/* Tên đề thi */}
          <div className="grid gap-2">
            <Label>Tên đề thi</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tên đề thi..."
              className="focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Lớp & Level */}
          <div className="grid md:grid-cols-2 gap-4">
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
              <Label>Level</Label>
              <Select
                value={form.level}
                onValueChange={(val) => setForm({ ...form, level: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Thời gian */}
          <div>
            <Label>⏱ Thời gian làm bài (phút)</Label>
            <Input
              type="number"
              min={1}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              className="max-w-[200px]"
            />
          </div>

          {/* Danh sách câu hỏi */}
          <div>
            <Label className="mb-2 block">🧩 Chọn câu hỏi</Label>
            <div className="max-h-80 overflow-y-auto border rounded-lg p-3 bg-muted/30">
              {questions.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          questions.length > 0 &&
                          questions.every((q) => form.selectedQuestions.includes(q._id))
                        }
                        onChange={(e) => {
                          setForm((prev) => ({
                            ...prev,
                            selectedQuestions: e.target.checked
                              ? questions.map((q) => q._id)
                              : [],
                          }));
                        }}
                      />
                      <span className="font-medium text-sm">Chọn tất cả</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Đã chọn {form.selectedQuestions.length}/{questions.length} câu
                    </span>
                  </div>

                  <div className="space-y-1">
                    {questions.map((q) => (
                      <label
                        key={q._id}
                        className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition
                          ${
                            form.selectedQuestions.includes(q._id)
                              ? "bg-indigo-50 border border-indigo-200"
                              : "hover:bg-gray-50"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.selectedQuestions.includes(q._id)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...form.selectedQuestions, q._id]
                              : form.selectedQuestions.filter((id) => id !== q._id);
                            setForm({ ...form, selectedQuestions: updated });
                          }}
                        />
                        <span className="text-sm">{q.content}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, selectedQuestions: [] })}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Bỏ chọn tất cả
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ❗ Chưa có câu hỏi trong ngân hàng
                </p>
              )}
            </div>
          </div>

          {/* Nút Lưu */}
          <Button
            onClick={handleSubmit}
            disabled={loading || form.selectedQuestions.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Đang lưu...
              </span>
            ) : (
              "💾 Lưu đề thi"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
