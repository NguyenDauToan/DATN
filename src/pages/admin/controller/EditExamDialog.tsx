// EditExamDialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";

interface Exam {
  _id: string;
  title: string;
  duration: number;
}

interface EditExamDialogProps {
  examId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditExamDialog({ examId, onClose, onSuccess }: EditExamDialogProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/exams/${examId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setExam(res.data);
      } catch (err) {
        console.error(err);
        toast.error("❌ Lỗi khi tải đề thi");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId, token, onClose]);

  const handleSave = async () => {
    if (!exam) return;
    try {
      setSaving(true);
      await axios.put(
        `http://localhost:5000/api/exams/${examId}`,
        {
          title: exam.title,
          duration: exam.duration,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Cập nhật đề thi thành công");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("❌ Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Dialog open={true} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đề thi</DialogTitle>
        </DialogHeader>

        {exam && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên đề</label>
              <Input
                value={exam.title}
                onChange={(e) => setExam({ ...exam, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Thời gian (phút)</label>
              <Input
                type="number"
                value={exam.duration}
                onChange={(e) => setExam({ ...exam, duration: Number(e.target.value) })}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
