import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Award, Clock, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Results = () => {
  const recentResults = [
    { id: 1, title: "Reading A1", score: 85, date: "2024-11-03", skill: "reading" },
    { id: 2, title: "Listening B1", score: 92, date: "2024-11-02", skill: "listening" },
    { id: 3, title: "Writing A2", score: 78, date: "2024-11-01", skill: "writing" },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-6 md:p-8 space-y-8 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Kết quả học tập
          </h1>
          <p className="text-muted-foreground">
            Theo dõi tiến độ và thành tích của bạn
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">87%</p>
                <p className="text-sm text-muted-foreground">Điểm TB</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <Target className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">42</p>
                <p className="text-sm text-muted-foreground">Bài hoàn thành</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">28h</p>
                <p className="text-sm text-muted-foreground">Thời gian học</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-4/10">
                <TrendingUp className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">+12%</p>
                <p className="text-sm text-muted-foreground">Cải thiện</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle>Kết quả gần đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentResults.map((result) => (
              <div 
                key={result.id}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{result.title}</h3>
                    <p className="text-sm text-muted-foreground">{result.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{result.score}</p>
                    <p className="text-xs text-muted-foreground">điểm</p>
                  </div>
                </div>
                <Progress value={result.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
