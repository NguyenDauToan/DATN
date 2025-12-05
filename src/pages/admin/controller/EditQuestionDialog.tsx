import { useState, useEffect } from "react";
import axios from "axios";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

interface EditQuestionDialogProps {
    question: any;
    onSuccess?: () => void;
}

export const EditQuestionDialog = ({ question, onSuccess }: EditQuestionDialogProps) => {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState(question.content || "");
    const [answer, setAnswer] = useState(question.answer || "");
    const [grade, setGrade] = useState(question.grade || "6");
    const [type, setType] = useState(question.type || "multiple_choice");
    const [level, setLevel] = useState(question.level || "easy");
    const [skill, setSkill] = useState(question.skill || "");
    const [loading, setLoading] = useState(false);
    const [skillsList, setSkillsList] = useState<{ name: string; displayName: string }[]>([]);

    // Lấy danh sách skill từ backend
    useEffect(() => {
        const fetchSkills = async () => {
          try {
            const res = await axios.get("https://english-backend-uoic.onrender.com/api/skills", {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            // res.data là mảng skill trực tiếp
            if (Array.isArray(res.data)) setSkillsList(res.data);
          } catch (err) {
            console.error("Lỗi tải danh sách kỹ năng:", err);
          }
        };
        fetchSkills();
      }, []);
      
    useEffect(() => {
        if (skillsList.length > 0 && question.skill) {
            const exists = skillsList.find((s) => s.name === question.skill);
            if (exists) setSkill(question.skill);
        }
    }, [skillsList, question.skill]);

    const handleSave = async () => {
        if (!content.trim() || !answer.trim()) {
            return toast.error("Câu hỏi và đáp án không được để trống");
        }

        try {
            setLoading(true);
            await axios.put(
                `https://english-backend-uoic.onrender.com/api/questions/${question._id}`,
                { content, answer, grade, type, level, skill },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            toast.success("Cập nhật câu hỏi thành công");
            onSuccess?.();
            setOpen(false);
        } catch (err) {
            console.error(err);
            toast.error("Cập nhật thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Chỉnh sửa</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa câu hỏi</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 mt-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Câu hỏi</label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Đáp án</label>
                        <Input
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="w-full rounded-lg border"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Select value={grade} onValueChange={setGrade}>
                            <SelectTrigger className="w-[120px] rounded-lg">
                                <SelectValue placeholder="Lớp" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 7 }, (_, i) => 6 + i).map((g) => (
                                    <SelectItem key={g} value={String(g)}>Lớp {g}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="w-[150px] rounded-lg">
                                <SelectValue placeholder="Loại câu hỏi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
                                <SelectItem value="fill_blank">Điền chỗ trống</SelectItem>
                                <SelectItem value="true_false">Đúng / Sai</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={level} onValueChange={setLevel}>
                            <SelectTrigger className="w-[120px] rounded-lg">
                                <SelectValue placeholder="Cấp độ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Dễ</SelectItem>
                                <SelectItem value="medium">Trung bình</SelectItem>
                                <SelectItem value="hard">Khó</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={skill} onValueChange={setSkill}>
                            <SelectTrigger className="w-[150px] rounded-lg">
                                <SelectValue placeholder="Kỹ năng" />
                            </SelectTrigger>
                            <SelectContent>
                                {skillsList.map((s) => (
                                    <SelectItem key={s.name} value={s.name}>
                                        {s.displayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                    </div>
                </div>

                <DialogFooter className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Đang lưu..." : "Lưu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
