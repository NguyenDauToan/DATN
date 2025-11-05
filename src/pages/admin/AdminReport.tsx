import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Users, FileText, Target, Download } from "lucide-react";

const AdminReports = () => {
  // Mock data for charts
  const monthlyData = [
    { month: "T1", tests: 45, users: 12 },
    { month: "T2", tests: 52, users: 19 },
    { month: "T3", tests: 61, users: 25 },
    { month: "T4", tests: 58, users: 31 },
    { month: "T5", tests: 67, users: 28 },
    { month: "T6", tests: 73, users: 35 },
  ];

  const difficultyData = [
    { name: "Cơ bản", value: 45, color: "#22c55e" },
    { name: "Trung bình", value: 35, color: "#f59e0b" },
    { name: "Nâng cao", value: 20, color: "#ef4444" },
  ];

  const scoreDistribution = [
    { range: "0-40", count: 15 },
    { range: "41-60", count: 28 },
    { range: "61-80", count: 45 },
    { range: "81-100", count: 32 },
  ];

  const testTypeData = [
    { type: "TOEFL", attempts: 120 },
    { type: "IELTS", attempts: 89 },
    { type: "Vocabulary", attempts: 76 },
    { type: "Grammar", attempts: 64 },
    { type: "Business", attempts: 43 },
  ];

  const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Báo cáo và thống kê</h1>
          <p className="text-muted-foreground">
            Phân tích hiệu suất và xu hướng của hệ thống
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lượt thi tháng này</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">392</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-accent">+12.5%</span> so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng hoạt động</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">35</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-accent">+8.1%</span> so với tuần trước
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">76.8</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-accent">+2.3</span> điểm so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đề thi mới</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground">
              Được tạo trong tháng này
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Xu hướng theo tháng</CardTitle>
            <CardDescription>Số lượt thi và người dùng mới theo tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tests" fill="#3b82f6" name="Lượt thi" />
                <Bar dataKey="users" fill="#22c55e" name="Người dùng mới" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Difficulty Distribution */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Phân bố theo độ khó</CardTitle>
            <CardDescription>Tỷ lệ các bài thi theo mức độ khó</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Phân bố điểm số</CardTitle>
            <CardDescription>Số lượng học viên theo khoảng điểm</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Test Type Performance */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Hiệu suất theo loại bài thi</CardTitle>
            <CardDescription>Số lượt thi theo từng loại bài</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={testTypeData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="attempts" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Top học viên xuất sắc</CardTitle>
          <CardDescription>Những học viên có thành tích tốt nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Nguyễn Văn A", email: "nguyenvana@email.com", avgScore: 92.5, testsCompleted: 15 },
              { name: "Trần Thị B", email: "tranthib@email.com", avgScore: 89.3, testsCompleted: 12 },
              { name: "Lê Văn C", email: "levanc@email.com", avgScore: 87.8, testsCompleted: 18 },
              { name: "Phạm Thị D", email: "phamthid@email.com", avgScore: 85.2, testsCompleted: 10 },
              { name: "Hoàng Văn E", email: "hoangvane@email.com", avgScore: 83.7, testsCompleted: 14 },
            ].map((student, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{student.avgScore}%</p>
                  <p className="text-sm text-muted-foreground">{student.testsCompleted} bài thi</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;