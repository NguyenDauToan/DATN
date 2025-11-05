import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Eye } from "lucide-react";

const AdminResults = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTest, setSelectedTest] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");

  const mockResults = [
    {
      id: 1,
      studentName: "Nguyễn Văn A",
      studentEmail: "nguyenvana@email.com",
      testTitle: "TOEFL Reading Practice Test 1",
      score: 85,
      totalQuestions: 40,
      correctAnswers: 34,
      timeSpent: 55,
      completedAt: "2024-03-10 14:30",
      status: "completed"
    },
    {
      id: 2,
      studentName: "Trần Thị B",
      studentEmail: "tranthib@email.com",
      testTitle: "IELTS Grammar Fundamentals",
      score: 72,
      totalQuestions: 30,
      correctAnswers: 22,
      timeSpent: 40,
      completedAt: "2024-03-09 16:15",
      status: "completed"
    },
    {
      id: 3,
      studentName: "Lê Văn C",
      studentEmail: "levanc@email.com",
      testTitle: "Advanced Vocabulary Challenge",
      score: 68,
      totalQuestions: 25,
      correctAnswers: 17,
      timeSpent: 28,
      completedAt: "2024-03-08 10:45",
      status: "completed"
    },
    {
      id: 4,
      studentName: "Phạm Thị D",
      studentEmail: "phamthid@email.com",
      testTitle: "Business English Communication",
      score: 92,
      totalQuestions: 35,
      correctAnswers: 32,
      timeSpent: 45,
      completedAt: "2024-03-07 13:20",
      status: "completed"
    },
    {
      id: 5,
      studentName: "Hoàng Văn E",
      studentEmail: "hoangvane@email.com",
      testTitle: "TOEFL Reading Practice Test 1",
      score: 0,
      totalQuestions: 40,
      correctAnswers: 0,
      timeSpent: 0,
      completedAt: "2024-03-06 09:00",
      status: "abandoned"
    },
  ];

  const filteredResults = mockResults.filter(result => {
    const matchesSearch = result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTest = selectedTest === "all" || result.testTitle === selectedTest;
    const matchesStudent = selectedStudent === "all" || result.studentName === selectedStudent;
    return matchesSearch && matchesTest && matchesStudent;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-accent">Xuất sắc</Badge>;
    if (score >= 60) return <Badge className="bg-warning">Tốt</Badge>;
    if (score >= 40) return <Badge className="bg-orange-500 text-white">Trung bình</Badge>;
    return <Badge className="bg-destructive">Yếu</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return status === "completed" 
      ? <Badge className="bg-accent">Hoàn thành</Badge>
      : <Badge variant="secondary">Bỏ dở</Badge>;
  };

  const uniqueTests = [...new Set(mockResults.map(r => r.testTitle))];
  const uniqueStudents = [...new Set(mockResults.map(r => r.studentName))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kết quả thi</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý kết quả thi của học viên
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Danh sách kết quả</CardTitle>
          <CardDescription>
            Tổng cộng {mockResults.length} lượt thi trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email học viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedTest} onValueChange={setSelectedTest}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Chọn đề thi" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="all">Tất cả đề thi</SelectItem>
                {uniqueTests.map(test => (
                  <SelectItem key={test} value={test}>{test}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn học viên" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="all">Tất cả học viên</SelectItem>
                {uniqueStudents.map(student => (
                  <SelectItem key={student} value={student}>{student}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Đề thi</TableHead>
                  <TableHead>Điểm số</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian làm</TableHead>
                  <TableHead>Ngày hoàn thành</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{result.studentName}</div>
                        <div className="text-sm text-muted-foreground">{result.studentEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={result.testTitle}>
                        {result.testTitle}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-lg">{result.score}%</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getScoreBadge(result.score)}
                        <div className="text-sm text-muted-foreground mt-1">
                          {result.correctAnswers}/{result.totalQuestions} đúng
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(result.status)}</TableCell>
                    <TableCell>{result.timeSpent} phút</TableCell>
                    <TableCell>
                      {new Date(result.completedAt).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResults;