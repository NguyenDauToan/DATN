import { useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function GenerateQuestionAI({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<any>(null);

  const [form, setForm] = useState({
    grade: "",
    skill: "",
    level: "",
    type: "multiple_choice",
  });

  const handleGenerate = async () => {
    if (!form.grade || !form.skill || !form.level) {
      return toast.error("Vui lòng chọn đầy đủ lớp, kỹ năng, cấp độ và loại câu hỏi!");
    }

    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/api/ai",
        { ...form },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGenerated(res.data);
      toast.success("🎉 AI đã tạo câu hỏi thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo câu hỏi AI");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generated?.questions?.length) return toast.error("Không có câu hỏi để lưu");
  
    const token = localStorage.getItem("token");
  
    // ✅ Chỉ lấy đúng số câu AI tạo
    const payload = generated.questions.map((q: any) => ({
      content: q.content,
      type: form.type,
      options: q.options || [],
      answer: q.answer || "",
      explanation: q.explanation || "",
      skill: form.skill,
      level: form.level,
      grade: form.grade,
    }));
  
    console.log("Payload length:", payload.length); // kiểm tra
  
    try {
      await axios.post("http://localhost:5000/api/questions/bulk", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`✅ Đã lưu ${payload.length} câu hỏi`);
      onSuccess?.();
      setOpen(false);
      setGenerated(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu câu hỏi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 ml-2">🤖 Tạo câu hỏi AI</Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo câu hỏi tự động bằng AI</DialogTitle>
          <DialogDescription>Chọn lớp, kỹ năng, cấp độ và loại câu hỏi để AI tạo tự động</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Grade */}
          <div>
            <Label>Lớp</Label>
            <Select value={form.grade} onValueChange={(val) => setForm({ ...form, grade: val })}>
              <SelectTrigger><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 7 }, (_, i) => 6 + i).map(g => (
                  <SelectItem key={g} value={String(g)}>Lớp {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skill */}
          <div>
            <Label>Kỹ năng</Label>
            <Select value={form.skill} onValueChange={(val) => setForm({ ...form, skill: val })}>
              <SelectTrigger><SelectValue placeholder="Chọn kỹ năng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="listening">Listening</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Level */}
          <div>
            <Label>Cấp độ</Label>
            <Select value={form.level} onValueChange={(val) => setForm({ ...form, level: val })}>
              <SelectTrigger><SelectValue placeholder="Chọn cấp độ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div>
            <Label>Loại câu hỏi</Label>
            <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
              <SelectTrigger><SelectValue placeholder="Chọn loại câu hỏi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                <SelectItem value="true_false">True / False</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "🤔 AI đang tạo..." : "Tạo câu hỏi"}
          </Button>

          {generated && (
            <div className="border p-3 rounded-lg mt-4 bg-gray-50 space-y-2">
              <h3 className="font-semibold text-lg">Câu hỏi được tạo:</h3>
              <p>{generated.content}</p>

              {generated.questions?.map((q: any, i: number) => (
                <div key={i} className="border p-2 rounded">
                  <p>{i + 1}. {q.content}</p>

                  {/* Hiển thị options nếu có */}
                  {q.options?.length > 0 ? (
                    <ul className="list-disc ml-5">
                      {q.options.map((opt: string, idx: number) => (
                        <li key={idx}>
                          {opt} {opt === q.answer && <b>(Đáp án đúng)</b>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    // Hiển thị answer nếu không có options
                    <p className="text-green-600 font-semibold">Đáp án: {q.answer}</p>
                  )}

                  {/* Hiển thị giải thích nếu có */}
                  {q.explanation && <p className="text-gray-600 mt-1">Giải thích: {q.explanation}</p>}
                </div>
              ))}


              <Button onClick={handleSave} className="mt-3 w-full bg-green-600 hover:bg-green-700">
                💾 Lưu câu hỏi này
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
