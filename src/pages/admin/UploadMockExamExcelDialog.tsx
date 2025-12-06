"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet } from "lucide-react";

type MockExamOption = {
  _id?: string;
  name: string;
  examType?: string; // để lọc THPTQG nếu cần
};

type UploadMockExamExcelDialogProps = {
  exams: MockExamOption[];
  onSuccess?: () => void;
};

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

/* =========================
   UploadMockExamExcelDialog
   ========================= */
export function UploadMockExamExcelDialog({
  exams,
  onSuccess,
}: UploadMockExamExcelDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mockExamId, setMockExamId] = useState<string>("");
  const [year, setYear] = useState<number | "">("");
  const [officialName, setOfficialName] = useState("");
  const [attempt, setAttempt] = useState<number | "">(1);
  const [file, setFile] = useState<File | null>(null);

  // Lọc chỉ các kỳ thi THPTQG (nếu bạn muốn chỉ dùng cho THPTQG)
  const thptExams = exams.filter(
    (e) => e.examType === "thptqg" || !e.examType // nếu field không có thì vẫn cho
  );

  // Debug: kiểm tra prop exams có dữ liệu không
  useEffect(() => {
    console.log("UploadMockExamExcelDialog exams:", exams);
  }, [exams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!mockExamId) {
      return toast.error("Vui lòng chọn kỳ thi thử");
    }
    if (!year) {
      return toast.error("Vui lòng nhập năm đề thi");
    }
    if (!officialName.trim()) {
      return toast.error("Vui lòng nhập tên / loại đề");
    }
    if (!file) {
      return toast.error("Vui lòng chọn file Excel");
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mockExamId", mockExamId);
      formData.append("year", String(year));
      formData.append("officialName", officialName);
      if (attempt) formData.append("attempt", String(attempt));
      formData.append("fileType", "excel");

      const token = getToken();

      await axios.post(
        "http://localhost:5000/api/mock-exam-papers/upload-excel",
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      toast.success("Upload file Excel đề thi thành công");
      setOpen(false);
      setMockExamId("");
      setYear("");
      setOfficialName("");
      setAttempt(1);
      setFile(null);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          "Lỗi khi upload file Excel. Vui lòng kiểm tra lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="flex items-center gap-2 rounded-2xl bg-card text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          disabled={thptExams.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {thptExams.length === 0
              ? "Chưa có kỳ thi để upload"
              : "Upload Excel đề thi"}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl rounded-3xl max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Upload Excel đề thi</DialogTitle>
          <DialogDescription className="text-xs">
            Chọn kỳ thi thử, năm đề thi và file Excel đáp án (A/B/C/D). Backend sẽ
            đọc Excel và lưu đáp án.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Kỳ thi thử</Label>
            <Select
              value={mockExamId}
              onValueChange={(val) => setMockExamId(val)}
              disabled={thptExams.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    thptExams.length === 0
                      ? "Chưa có kỳ thi THPTQG nào"
                      : "Chọn kỳ thi thử"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {thptExams.map((exam) => (
                  <SelectItem key={exam._id} value={exam._id!}>
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Năm đề thi</Label>
              <Input
                type="number"
                min={1990}
                max={2100}
                placeholder="VD: 2024"
                value={year}
                onChange={(e) =>
                  setYear(e.target.value ? Number(e.target.value) : "")
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Lần / Đợt (attempt)</Label>
              <Input
                type="number"
                min={1}
                value={attempt}
                onChange={(e) =>
                  setAttempt(e.target.value ? Number(e.target.value) : "")
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tên / loại đề</Label>
            <Input
              placeholder="VD: Đề chính thức 2024, Đề minh họa 2025"
              value={officialName}
              onChange={(e) => setOfficialName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>File Excel đáp án</Label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            <p className="text-[11px] text-muted-foreground">
              File Excel phải đúng định dạng mà backend đang đọc (một dòng/câu, cột
              số câu và cột đáp án A/B/C/D).
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || thptExams.length === 0}
              className="rounded-xl"
            >
              {submitting ? "Đang upload..." : "Upload Excel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
