import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Edit, Trash2, Filter, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddQuestionDialog, ImportExcelDialog } from "./AddQuestion";
import { GenerateQuestionAI } from "./GenerateQuestionAI";
import { EditQuestionDialog } from "./controller/EditQuestionDialog";
import { toast } from "sonner";

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/questions?all=true", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.data && Array.isArray(res.data.questions)) {
        setQuestions(res.data.questions);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("❌ Lỗi tải danh sách câu hỏi:", err);
      toast.error("Không thể tải danh sách câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/questions/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      toast.success("Đã xóa câu hỏi");
    } catch (err) {
      console.error(err);
      toast.error("Xóa thất bại");
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return toast.error("Chưa chọn câu hỏi nào");
    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.length} câu hỏi?`)) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          axios.delete(`http://localhost:5000/api/questions/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          })
        )
      );
      setQuestions((prev) => prev.filter((q) => !selectedIds.includes(q._id)));
      setSelectedIds([]);
      toast.success("Đã xóa các câu hỏi đã chọn");
    } catch (err) {
      console.error(err);
      toast.error("Xóa hàng loạt thất bại");
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.content
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === "all" || q.level === selectedLevel;
    const matchesType = selectedType === "all" || q.type === selectedType;
    const matchesGrade = selectedGrade === "all" || q.grade === selectedGrade;
    return matchesSearch && matchesLevel && matchesType && matchesGrade;
  });

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredQuestions.map((q) => q._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            Trắc nghiệm
          </Badge>
        );
      case "fill_blank":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
            Điền chỗ trống
          </Badge>
        );
      case "true_false":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
            Đúng / Sai
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-700">Khác</Badge>;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "easy":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
            Dễ
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
            Trung bình
          </Badge>
        );
      case "hard":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
            Khó
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-700">Không rõ</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO + ACTIONS */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            📚 Quản lý ngân hàng câu hỏi
          </h1>
          <p className="text-sm text-muted-foreground">
            Thêm mới, import từ Excel, dùng AI để sinh câu hỏi và quản lý theo lớp, loại, cấp độ.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <Badge variant="outline" className="border-primary/30 text-primary">
              Tổng: {questions.length} câu
            </Badge>
            <Badge variant="outline" className="border-blue-200 text-blue-700">
              Đang hiển thị: {filteredQuestions.length}
            </Badge>
            {selectedIds.length > 0 && (
              <Badge variant="outline" className="border-rose-200 text-rose-700">
                Đã chọn: {selectedIds.length}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <AddQuestionDialog onSuccess={fetchQuestions} />
          <ImportExcelDialog onSuccess={fetchQuestions} />
          <GenerateQuestionAI onSuccess={fetchQuestions} />
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={!selectedIds.length}
            className="transition-all hover:shadow-md"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa ({selectedIds.length || 0})
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card className="border border-border/70 bg-card/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all animate-slide-in">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Bộ lọc & tìm kiếm
            </CardTitle>
            <CardDescription>
              Lọc theo lớp, loại câu hỏi, cấp độ và nội dung.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="hidden md:inline-flex items-center gap-1 border-dashed border-primary/40"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            Gợi ý: kết hợp nhiều bộ lọc để thu hẹp kết quả
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo nội dung câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-[150px] rounded-xl text-xs md:text-sm">
                  <SelectValue placeholder="Lớp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lớp</SelectItem>
                  <SelectItem value="6">Lớp 6</SelectItem>
                  <SelectItem value="7">Lớp 7</SelectItem>
                  <SelectItem value="8">Lớp 8</SelectItem>
                  <SelectItem value="9">Lớp 9</SelectItem>
                  <SelectItem value="10">Lớp 10</SelectItem>
                  <SelectItem value="11">Lớp 11</SelectItem>
                  <SelectItem value="12">Lớp 12</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[150px] rounded-xl text-xs md:text-sm">
                  <SelectValue placeholder="Cấp độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả cấp độ</SelectItem>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[170px] rounded-xl text-xs md:text-sm">
                  <SelectValue placeholder="Loại câu hỏi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
                  <SelectItem value="fill_blank">Điền chỗ trống</SelectItem>
                  <SelectItem value="true_false">Đúng / Sai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="shadow-lg border border-border/70 bg-card/95 backdrop-blur-sm rounded-2xl transition-all hover:shadow-xl hover:-translate-y-[1px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base md:text-lg font-semibold">
                Danh sách câu hỏi
              </CardTitle>
              <CardDescription>
                Đang hiển thị <b>{filteredQuestions.length}</b> câu hỏi theo bộ lọc hiện tại.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="rounded-xl border border-border/70 overflow-hidden">
            <div className="max-h-[520px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredQuestions.length > 0 &&
                          selectedIds.length === filteredQuestions.length
                        }
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                    </TableHead>
                    <TableHead className="w-[40%]">Câu hỏi</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Cấp độ</TableHead>
                    <TableHead>Kỹ năng</TableHead>
                    <TableHead>Đáp án đúng</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                        Đang tải dữ liệu...
                      </TableCell>
                    </TableRow>
                  ) : filteredQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                        Không có câu hỏi nào phù hợp với bộ lọc hiện tại.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuestions.map((q) => (
                      <TableRow
                        key={q._id}
                        className="transition-all hover:bg-muted/60 hover:-translate-y-[1px]"
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(q._id)}
                            onChange={() => toggleSelectOne(q._id)}
                          />
                        </TableCell>
                        <TableCell
                          className="max-w-sm truncate text-sm"
                          title={q.content}
                        >
                          {q.content}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {q.grade || "-"}
                        </TableCell>
                        <TableCell>{getTypeBadge(q.type)}</TableCell>
                        <TableCell>{getLevelBadge(q.level)}</TableCell>
                        <TableCell className="capitalize text-xs md:text-sm">
                          {q.skill || "-"}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600 text-xs md:text-sm">
                          {q.answer}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {q.createdAt
                            ? new Date(q.createdAt).toLocaleDateString("vi-VN")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem asChild>
                                <EditQuestionDialog
                                  question={q}
                                  onSuccess={fetchQuestions}
                                />
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(q._id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQuestions;
