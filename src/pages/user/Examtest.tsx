// src/pages/MockExams.tsx
"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Target,
  Clock,
  BarChart3,
} from "lucide-react";
import { mockExamAPI } from "@/api/Api";

type MockExam = {
  _id: string;
  name: string;
  tag?: string;
  description?: string;
  duration?: string;
  level?: string;
  examType?: string;
  slug?: string;
};

export default function MockExams() {
  const navigate = useNavigate();

  const [exams, setExams] = useState<MockExam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMockExams = async () => {
      try {
        setLoading(true);
        const res = await mockExamAPI.getAll({ active: true });
        setExams(res.data.exams || []);
      } catch (err) {
        console.error("Lỗi tải danh sách kỳ thi thử:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMockExams();
  }, []);

  const handleStartExam = (exam: MockExam) => {
    navigate(`/mock-exams/${exam._id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8 animate-fade-in">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-r from-indigo-600 via-sky-500 to-blue-500 px-6 py-7 text-primary-foreground shadow-lg md:px-8">
          <div className="pointer-events-none absolute -left-10 -top-24 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-100/90">
                Mock Exam Center
              </p>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Trung tâm thi thử & kỳ thi lớn
              </h1>
              <p className="text-sm md:text-base text-sky-50/90">
                Thi thử THPTQG, IELTS, TOEIC, VSTEP và nhiều kỳ thi quan trọng
                khác. Thi online, chấm điểm tự động và theo dõi tiến bộ của bạn.
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-white/15 px-3 py-1 font-medium ring-1 ring-white/40">
                  <Clock className="mr-1 inline-block h-3 w-3" />
                  Mô phỏng thời gian thi thật
                </span>
                <span className="rounded-full bg-black/10 px-3 py-1 font-medium ring-1 ring-sky-200/60">
                  <Target className="mr-1 inline-block h-3 w-3" />
                  Bám sát cấu trúc đề chuẩn
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 text-right">
              <div className="rounded-2xl bg-black/15 px-4 py-3 text-xs shadow-md backdrop-blur">
                <p className="text-[11px] uppercase tracking-wide text-sky-100/80">
                  Thi thử thông minh
                </p>
                <p className="mt-1 text-sm font-semibold">
                  Hệ thống chấm điểm tự động
                </p>
                <p className="mt-1 text-[11px] text-sky-50/90">
                  Xem lại bài làm, phân tích điểm mạnh – yếu theo từng kỹ năng.
                </p>
              </div>

              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5 rounded-xl bg-white text-indigo-700 shadow-sm hover:bg-sky-50"
                onClick={() => navigate("/practice")}
              >
                Vào trang luyện tập
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </section>

        {/* LIST EXAMS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                Chọn kỳ thi thử
              </h2>
              <p className="text-sm text-muted-foreground">
                Danh sách các đề thi thử THPTQG, IELTS, TOEIC, VSTEP,...
              </p>
            </div>
            {exams.length > 0 && !loading && (
              <span className="hidden text-xs text-muted-foreground md:inline-flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5" />
                {exams.length} kỳ thi đang có
              </span>
            )}
          </div>

          {loading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card
                  key={i}
                  className="h-full overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-sm animate-pulse"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-indigo-200 via-sky-200 to-violet-200" />
                  <CardContent className="space-y-3 p-5">
                    <div className="h-4 w-2/3 rounded bg-muted" />
                    <div className="h-3 w-1/4 rounded bg-muted" />
                    <div className="h-14 w-full rounded bg-muted" />
                    <div className="flex gap-3">
                      <div className="h-3 w-20 rounded bg-muted" />
                      <div className="h-3 w-24 rounded bg-muted" />
                    </div>
                    <div className="mt-2 h-8 w-28 rounded-full bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : exams.length === 0 ? (
            // No data
            <Card className="border-dashed border-2 border-muted/70 bg-card/60 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Hiện chưa có kỳ thi thử nào được cấu hình.
                </p>
                <p className="text-xs text-muted-foreground">
                  Khi admin thêm đề thi thử, danh sách sẽ hiển thị tại đây.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl"
                  onClick={() => navigate("/practice")}
                >
                  Tạm thời vào mục luyện tập
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Exam cards
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              {exams.map((exam, index) => (
                <div
                  key={exam._id}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <Card className="group relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-500" />
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base md:text-lg font-semibold text-slate-900">
                            {exam.name}
                          </CardTitle>
                          <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                            {exam.tag && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                                {exam.tag}
                              </span>
                            )}
                            {exam.examType && (
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                                {exam.examType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {exam.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {exam.description}
                        </p>
                      )}

                      <div className="mt-1 flex items-center justify-between gap-3 pt-1 text-[11px] text-muted-foreground">
                        <div className="flex flex-wrap gap-2">
                          {exam.duration && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 border border-slate-200">
                              <Clock className="h-3 w-3" />
                              {exam.duration}
                            </span>
                          )}
                          {exam.level && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 border border-slate-200">
                              <Target className="h-3 w-3" />
                              {exam.level}
                            </span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          className="gap-1.5 rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                          onClick={() => handleStartExam(exam)}
                        >
                          Vào thi
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
