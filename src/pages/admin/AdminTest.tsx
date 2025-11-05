import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, MoreHorizontal, Edit, Trash2, Eye, Copy } from "lucide-react";
import AddExamModal from "./AddExam"; // ✅ import modal tạo đề
import { GenerateExamAI } from "./GenerateExamAI";
import { toast } from "sonner";

export default function AdminTests() {
    const [searchTerm, setSearchTerm] = useState("");
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");

    // 🔹 Load danh sách đề thi
    const loadExams = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:5000/api/exams", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setExams(res.data);
        } catch (err) {
            console.error("Lỗi khi tải danh sách đề thi:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExams();
    }, []);

    const filteredExams = exams.filter(
        (exam) =>
            exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exam.grade?.toString().includes(searchTerm)
    );

    const getLevelBadge = (level: string) => {
        switch (level) {
            case "easy":
                return <Badge className="bg-green-100 text-green-700">Dễ</Badge>;
            case "medium":
                return <Badge className="bg-yellow-100 text-yellow-700">Trung bình</Badge>;
            case "hard":
                return <Badge className="bg-red-100 text-red-700">Khó</Badge>;
            default:
                return <Badge variant="secondary">{level}</Badge>;
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    const handleDeleteExam = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa đề thi này?")) return;

        try {
            setLoading(true);
            await axios.delete(`http://localhost:5000/api/exams/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("✅ Đã xóa đề thi thành công");
            // Tải lại danh sách
            loadExams();
        } catch (err) {
            console.error("Lỗi khi xóa đề thi:", err);
            toast.error("❌ Xóa đề thi thất bại");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="space-y-6">
            {/* 🔹 Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý đề thi</h1>
                    <p className="text-muted-foreground">
                        Tạo và quản lý các đề thi trong hệ thống
                    </p>
                </div>

                {/* 2 nút gần nhau */}
                <div className="flex gap-2">
                    <AddExamModal onSuccess={loadExams} />
                    <GenerateExamAI onSuccess={loadExams} />
                </div>
            </div>

            {/* 🔹 Danh sách đề thi */}
            <Card className="shadow-soft">
                <CardHeader>
                    <CardTitle>Danh sách đề thi</CardTitle>
                    <CardDescription>Tổng cộng {exams.length} đề thi</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Tìm kiếm đề thi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên đề thi</TableHead>
                                    <TableHead>Lớp</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead>Số câu hỏi</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredExams.length > 0 ? (
                                    filteredExams.map((exam) => (
                                        <TableRow key={exam._id}>
                                            <TableCell className="font-medium">{exam.title}</TableCell>
                                            <TableCell>{exam.grade}</TableCell>
                                            <TableCell>{getLevelBadge(exam.level)}</TableCell>
                                            <TableCell>{exam.duration} phút</TableCell>
                                            <TableCell>{exam.questions?.length || 0}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Copy className="mr-2 h-4 w-4" /> Sao chép
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDeleteExam(exam._id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Xóa
                                                        </DropdownMenuItem>

                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                                            Không có đề thi nào
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
