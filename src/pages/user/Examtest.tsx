// src/pages/MockExams.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Clock, BarChart3 } from "lucide-react";
import { mockExamAPI } from "@/api/Api";
import { toast } from "sonner";

type MockExam = {
  _id: string;
  name: string;
  tag?: string;
  description?: string;
  duration?: number;
  level?: string;
  examType?: string;
  slug?: string;
  startTime?: string;
  endTime?: string;
};

type ExamStatus = "upcoming" | "active" | "ended";

const formatShortDateTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};

const getExamStatus = (exam: MockExam, now: Date): ExamStatus => {
  const { startTime, endTime } = exam;

  if (startTime) {
    const start = new Date(startTime);
    if (now < start) return "upcoming";
  }

  if (endTime) {
    const end = new Date(endTime);
    if (now > end) return "ended";
  }

  return "active";
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

  const now = useMemo(() => new Date(), [exams.length, loading]);

  const handleStartExam = (exam: MockExam) => {
    const current = new Date();
    const status = getExamStatus(exam, current);

    if (status === "upcoming") {
      const startLabel = formatShortDateTime(exam.startTime);
      return toast.warning(
        startLabel
          ? `Đề này chỉ mở từ ${startLabel}. Bạn chưa thể vào thi.`
          : "Đề này chưa mở."
      );
    }

    if (status === "ended") {
      const endLabel = formatShortDateTime(exam.endTime);
      return toast.error(
        endLabel
          ? `Đề thi này đã hết thời gian làm (đóng lúc ${endLabel}).`
          : "Đề thi này đã kết thúc."
      );
    }

    navigate(`/mock-exams/${exam._id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
        {/* HERO */}
        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm md:px-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
                Mock Exam Center
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Thi thử các kỳ thi quan trọng
              </h1>
              <p className="text-sm text-slate-600 md:text-base">
                Thi thử THPTQG, IELTS, TOEIC, VSTEP và nhiều kỳ thi khác. Hệ
                thống chấm điểm tự động, mô phỏng thời gian làm bài thật và
                lưu lại kết quả để bạn theo dõi tiến bộ.
              </p>

              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700 ring-1 ring-sky-100">
                  <Clock className="h-3 w-3" />
                  Mô phỏng thời gian thi thật
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 font-medium text-slate-700 ring-1 ring-slate-200">
                  <Target className="h-3 w-3" />
                  Bám sát cấu trúc đề chuẩn
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 text-right">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Gợi ý
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Nên thi thử trước khi thi thật
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  Chọn 1–2 đề phù hợp trình độ, làm trọn bộ trong một lần để
                  quen áp lực thời gian.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-xl border-slate-300 text-slate-800 hover:bg-slate-100"
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
              <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
                Chọn kỳ thi thử
              </h2>
              <p className="text-sm text-slate-600">
                Danh sách các đề thi thử THPTQG, IELTS, TOEIC, VSTEP,...
              </p>
            </div>
            {exams.length > 0 && !loading && (
              <span className="hidden items-center gap-1 text-xs text-slate-500 md:inline-flex">
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
                  className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse"
                >
                  <div className="h-1 w-full bg-slate-100" />
                  <CardContent className="space-y-3 p-5">
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/4 rounded bg-slate-100" />
                    <div className="h-14 w-full rounded bg-slate-100" />
                    <div className="flex gap-3">
                      <div className="h-3 w-20 rounded bg-slate-100" />
                      <div className="h-3 w-24 rounded bg-slate-100" />
                    </div>
                    <div className="mt-2 h-8 w-28 rounded-full bg-slate-100" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : exams.length === 0 ? (
            // No data
            <Card className="border-2 border-dashed border-slate-200 bg-slate-50/60">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <p className="text-sm text-slate-600">
                  Hiện chưa có kỳ thi thử nào được cấu hình.
                </p>
                <p className="text-xs text-slate-500">
                  Khi admin thêm đề thi thử, danh sách sẽ hiển thị tại đây.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl border-slate-300"
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
              {exams.map((exam, index) => {
                const status = getExamStatus(exam, now);
                const startLabel = formatShortDateTime(exam.startTime);
                const endLabel = formatShortDateTime(exam.endTime);

                return (
                  <div
                    key={exam._id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <Card className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
                      <div className="absolute inset-x-0 top-0 h-1 bg-slate-100" />
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="text-base font-semibold text-slate-900 md:text-lg">
                              {exam.name}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                              {exam.tag && (
                                <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium ring-1 ring-slate-200">
                                  {exam.tag}
                                </span>
                              )}
                              {exam.examType && (
                                <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700 ring-1 ring-sky-100">
                                  {exam.examType}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* STATUS CHIP */}
                          {status === "active" && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                              Đang mở
                            </span>
                          )}
                          {status === "upcoming" && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100">
                              Sắp mở
                            </span>
                          )}
                          {status === "ended" && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                              Đã kết thúc
                            </span>
                          )}
                        </div>

                        {exam.description && (
                          <p className="text-sm text-slate-600 line-clamp-3">
                            {exam.description}
                          </p>
                        )}

                        <div className="mt-1 flex items-center justify-between gap-3 pt-1 text-[11px] text-slate-600">
                          <div className="flex flex-wrap gap-2">
                            {exam.duration && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                                <Clock className="h-3 w-3" />
                                {exam.duration} phút
                              </span>
                            )}
                            {exam.level && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                                <Target className="h-3 w-3" />
                                {exam.level}
                              </span>
                            )}

                            {/* Time info */}
                            {exam.startTime && status === "upcoming" && (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 ring-1 ring-amber-100">
                                Mở lúc {startLabel}
                              </span>
                            )}
                            {status === "active" && exam.endTime && (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 ring-1 ring-emerald-100">
                                Đang mở · Đóng lúc {endLabel}
                              </span>
                            )}
                            {status === "ended" && exam.endTime && (
                              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-600 ring-1 ring-slate-200">
                                Đã đóng lúc {endLabel}
                              </span>
                            )}
                          </div>

                          {/* Nút chỉ hiện khi đang active */}
                          {status === "active" && (
                            <Button
                              size="sm"
                              className="gap-1.5 rounded-xl bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                              onClick={() => handleStartExam(exam)}
                            >
                              Vào thi
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
