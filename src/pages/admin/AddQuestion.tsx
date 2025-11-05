import { useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddQuestionDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    content: "",
    skill: "",
    grade: "",
    level: "",
    type: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: 0,
  });

  const handleChangeOption = (index: number, value: string) => {
    const updated = [...form.options];
    updated[index] = value;
    setForm({ ...form, options: updated });
  };

  const handleSubmit = async () => {
    if (!form.content || !form.skill || !form.level || form.options.some(o => !o.trim())) {
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

    const token = localStorage.getItem("token");

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
      toast.error(err.response?.data?.message || "Lỗi khi thêm câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">+ Thêm câu hỏi</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm câu hỏi mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nội dung câu hỏi</Label>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
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
          <div>
            <Label>Level</Label>
            <Select value={form.level} onValueChange={(val) => setForm({ ...form, level: val })}>
              <SelectTrigger><SelectValue placeholder="Chọn level" /></SelectTrigger>
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
                <Input value={opt} onChange={(e) => handleChangeOption(idx, e.target.value)} />
              </div>
            ))}
          </div>

          <div>
            <Label>Đáp án đúng</Label>
            <Select
              value={form.correctAnswer.toString()}
              onValueChange={(val) => setForm({ ...form, correctAnswer: Number(val) })}
            >
              <SelectTrigger><SelectValue placeholder="Chọn đáp án đúng" /></SelectTrigger>
              <SelectContent>
                {form.options.map((opt, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>{opt || `Đáp án ${idx + 1}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
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
          <div>
            <Label>Lớp</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 7 }, (_, i) => 6 + i).map(g => (
                  <SelectItem key={g} value={String(g)}>Lớp {g}</SelectItem>
                ))}
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
