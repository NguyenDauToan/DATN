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
import { Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddQuestionDialog, ImportExcelDialog } from "./AddQuestion";
import { GenerateQuestionAI } from "./GenerateQuestionAI";

const AdminQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/questions?all=true", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      console.log("✅ Dữ liệu nhận được:", res.data);

      if (res.data && Array.isArray(res.data.questions)) {
        setQuestions(res.data.questions);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("❌ Lỗi tải danh sách câu hỏi:", err);
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
    } catch (err) {
      console.error(err);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === "all" || q.level === selectedLevel;
    const matchesType = selectedType === "all" || q.type === selectedType;
    return matchesSearch && matchesLevel && matchesType;
  });

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">📚 Quản lý câu hỏi</h1>
          <p className="text-muted-foreground">
            Thêm, tìm kiếm và quản lý ngân hàng câu hỏi trong hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddQuestionDialog onSuccess={fetchQuestions} />
          <ImportExcelDialog onSuccess={fetchQuestions} />
          <GenerateQuestionAI onSuccess={fetchQuestions} />  {/* Nút AI */}
        </div>
      </div>

      {/* Table Section */}
      <Card className="shadow-md rounded-2xl border border-gray-100">
        <CardHeader>
          <CardTitle>Danh sách câu hỏi</CardTitle>
          <CardDescription>
            Tổng cộng <b>{filteredQuestions.length}</b> câu hỏi hiển thị
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Bộ lọc */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[180px] rounded-lg">
                <SelectValue placeholder="Cấp độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="easy">Dễ</SelectItem>
                <SelectItem value="medium">Trung bình</SelectItem>
                <SelectItem value="hard">Khó</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px] rounded-lg">
                <SelectValue placeholder="Loại câu hỏi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
                <SelectItem value="fill_blank">Điền chỗ trống</SelectItem>
                <SelectItem value="true_false">Đúng / Sai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bảng câu hỏi (cuộn trong Card) */}
          <div className="rounded-lg border overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[40%]">Câu hỏi</TableHead>
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
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">Đang tải dữ liệu...</div>
                      </TableCell>
                    </TableRow>
                  ) : filteredQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Không có câu hỏi nào phù hợp
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuestions.map((q) => (
                      <TableRow key={q._id}>
                        <TableCell className="max-w-sm truncate" title={q.content}>
                          {q.content}
                        </TableCell>
                        <TableCell>{getTypeBadge(q.type)}</TableCell>
                        <TableCell>{getLevelBadge(q.level)}</TableCell>
                        <TableCell className="capitalize">{q.skill}</TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {q.answer}
                        </TableCell>
                        <TableCell>
                          {q.createdAt
                            ? new Date(q.createdAt).toLocaleDateString("vi-VN")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
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
