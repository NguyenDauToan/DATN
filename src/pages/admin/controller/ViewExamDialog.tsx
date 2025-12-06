import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";

interface Exam {
  _id: string;
  title: string;
  grade: string;
  level: string;
  duration: number;
  questions: { content: string; type: string; options?: string[]; answer?: string }[];
}

interface ViewExamDialogProps {
  examId: string;
  onClose: () => void;
  children?: React.ReactNode; // optional
}

export default function ViewExamDialog({ examId, onClose }: ViewExamDialogProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`https://english-backend-uoic.onrender.com/api/exams/${examId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setExam(res.data);
      } catch (err) {
        console.error(err);
        toast.error("❌ Lỗi khi tải chi tiết đề thi");
        onClose(); // đóng dialog nếu lỗi
      }
    };
    fetchExam();
  }, [examId, token, onClose]);

  return (
    <Dialog open={true} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white/90 backdrop-blur-md z-10">
          <DialogTitle>Chi tiết đề thi</DialogTitle>
        </DialogHeader>

        {exam ? (
          <div className="space-y-4 p-2">
            <p><strong>Tên đề:</strong> {exam.title}</p>
            <p>
              <strong>Lớp:</strong> {exam.grade} | <strong>Level:</strong> {exam.level} |{" "}
              <strong>Thời gian:</strong> {exam.duration} phút
            </p>

            <div>
              <strong>Danh sách câu hỏi:</strong>
              <ul className="list-decimal list-inside space-y-2 mt-2">
                {exam.questions.map((q, idx) => (
                  <li key={idx}>
                    <p><strong>Câu {idx + 1} ({q.type}):</strong> {q.content}</p>
                    {q.options && (
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {q.options.map((opt, i) => <li key={i}>{opt}</li>)}
                      </ul>
                    )}
                    {q.answer && <p className="mt-1 text-green-700">Đáp án: {q.answer}</p>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-right mt-4">
              <DialogClose asChild>
                <Button>Đóng</Button>
              </DialogClose>
            </div>
          </div>
        ) : (
          <p>Đang tải chi tiết đề thi...</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
