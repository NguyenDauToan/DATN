// src/pages/admin/ResultStatsPage.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@/data/AuthContext";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type UserRole =
  | "admin"
  | "school_manager"
  | "teacher"
  | "student"
  | string
  | undefined;

type School = {
  _id: string;
  name: string;
  code?: string;
};
type SchoolYear = {
  _id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
};

type Classroom = {
  _id: string;
  name: string;
  code?: string;
  school?: string | School;
  homeroomTeacher?: {
    _id: string;
    name?: string;
    email?: string;
  } | null;
};


type PerTestStats = {
  testId: string;
  testTitle: string;
  count: number;
  avgScore: number;
};

type StudentStats = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  count: number;
  avgScore: number;
  minScore: number;
  maxScore: number;

  // 👇 thêm
  className?: string;
  classCode?: string;
};

type SchoolStats = {
  schoolId: string;
  totalResults: number;
  totalStudents: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  perTest: PerTestStats[];
  perStudent: StudentStats[];
};

type ClassStats = {
  classroomId: string;
  classroomName: string;
  classroomCode?: string;

  // 👇 thêm
  schoolName?: string;
  schoolCode?: string;

  totalResults: number;
  totalStudents: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  perTest: PerTestStats[];
  perStudent: StudentStats[];
};

export default function ResultStatsPage() {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  const [schools, setSchools] = useState<School[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");

  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);

  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSchoolStats, setLoadingSchoolStats] = useState(false);
  const [loadingClassStats, setLoadingClassStats] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const axiosAuth = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
    [token]
  );

  const isAdmin = role === "admin";
  const isSchoolManager = role === "school_manager";
  const isTeacher = role === "teacher";
  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        setLoadingYears(true);
        setError(null);

        const res = await axiosAuth.get<{
          years: SchoolYear[];
          oldYears?: SchoolYear[];
        }>("/api/admin/school-years", {
          params: { includeInactive: true },
        });

        // years = năm hiện tại, oldYears = năm đã kết thúc
        const active = res.data.years || [];
        const old = res.data.oldYears || [];

        // gộp lại, active trước rồi đến old
        setSchoolYears([...active, ...old]);

        // nếu muốn auto chọn năm hiện tại:
        if (active.length > 0 && selectedYear === "all") {
          setSelectedYear(active[0]._id); // năm active đầu tiên
        }
      } catch (err: any) {
        console.error("Lỗi lấy danh sách năm học:", err?.response || err);
        setError((prev) => prev || "Không tải được danh sách năm học.");
        setSchoolYears([]);
      } finally {
        setLoadingYears(false);
      }
    };

    fetchSchoolYears();
  }, [axiosAuth]); // chỉ cần axiosAuth
  const currentSchoolName =
  schools.find((s) => s._id === selectedSchoolId)?.name ||
  (user as any)?.school?.name ||
  "";
  

  // ========= 1. LOAD TRƯỜNG =========
  useEffect(() => {
    const initSchools = async () => {
      try {
        setError(null);

        if (isAdmin) {
          setLoadingSchools(true);
          const res = await axiosAuth.get<{ schools: School[] }>(
            "/api/admin/schools"
          );
          const list = res.data.schools || [];
          setSchools(list);
        } else if (isSchoolManager || isTeacher) {
          const schoolId =
            (user?.school as any)?._id || (user?.school as any) || "";
          const schoolName =
            (user?.school as any)?.name || (user as any)?.schoolName || "";

          if (schoolId) {
            setSchools([
              {
                _id: schoolId,
                name: schoolName || "Trường của bạn",
              },
            ]);
            setSelectedSchoolId(schoolId);
          } else {
            setError("Tài khoản của bạn chưa được gán trường.");
          }
        }
      } catch (err: any) {
        console.error("Lỗi lấy danh sách trường:", err?.response || err);
        setError("Không tải được danh sách trường.");
      } finally {
        setLoadingSchools(false);
      }
    };

    initSchools();
  }, [axiosAuth, isAdmin, isSchoolManager, isTeacher, user]);

  // ========= 2. KHI CÓ / CHỌN TRƯỜNG / NĂM =========
  useEffect(() => {
    if (!selectedSchoolId) {
      setSchoolStats(null);
      setClassrooms([]);
      setSelectedClassroomId("");
      return;
    }

    const fetchSchoolStats = async () => {
      try {
        setLoadingSchoolStats(true);
        setError(null);

        const res = await axiosAuth.get<SchoolStats>(
          `/api/results/stats/school/${selectedSchoolId}`,
          {
            params: {
              year: selectedYear === "all" ? undefined : selectedYear, // 🔁
            },
          }
        );
        setSchoolStats(res.data);
      } catch (err: any) {
        console.error("Lỗi thống kê theo trường:", err?.response || err);
        setError(
          err?.response?.data?.message || "Không lấy được thống kê theo trường."
        );
        setSchoolStats(null);
      } finally {
        setLoadingSchoolStats(false);
      }
    };

    const fetchClassrooms = async () => {
      try {
        setError(null);
        setLoadingClasses(true);
    
        const params: any = {
          schoolId: selectedSchoolId,
        };
    
        if (selectedYear !== "all") {
          params.schoolYearId = selectedYear;
        }
    
        const res = await axiosAuth.get<{ classrooms: Classroom[] }>(
          "/api/admin/classrooms",
          { params }
        );
    
        let list = res.data.classrooms || [];
    
        // 👇 GIỚI HẠN LỚP CHO GIÁO VIÊN
        if (isTeacher && user?._id) {
          const meId = (user as any)._id;
          list = list.filter(
            (c) => c.homeroomTeacher && (c.homeroomTeacher as any)._id === meId
          );
        }
    
        if (list.length === 0) {
          setClassrooms([]);
          setSelectedClassroomId("");
    
          if (isTeacher) {
            setError("Bạn chưa được gán làm giáo viên cho lớp nào trong trường / năm này.");
          }
        } else {
          setClassrooms(list);
    
          if (isTeacher) {
            // Giáo viên: auto chọn lớp đầu tiên trong các lớp của mình
            setSelectedClassroomId(list[0]._id);
          } else {
            // Admin / school_manager: giữ lựa chọn cũ nếu còn tồn tại
            setSelectedClassroomId((prev) =>
              prev && list.some((c) => c._id === prev) ? prev : ""
            );
          }
        }
      } catch (err: any) {
        console.error("Lỗi lấy danh sách lớp:", err?.response || err);
        setError("Không tải được danh sách lớp.");
        setClassrooms([]);
        setSelectedClassroomId("");
      } finally {
        setLoadingClasses(false);
      }
    };
    


    fetchSchoolStats();
    fetchClassrooms();
  }, [
    axiosAuth,
    selectedSchoolId,
    selectedYear, // đổi năm -> refetch
    isTeacher,
    isSchoolManager,
    isAdmin,
    user,
  ]);

  


// ========= 3. TÍNH THỐNG KÊ THEO LỚP TỪ schoolStats =========
useEffect(() => {
  // chưa chọn lớp hoặc chưa có dữ liệu trường -> reset
  if (!selectedClassroomId || !schoolStats) {
    setClassStats(null);
    return;
  }

  const cls = classrooms.find((c) => c._id === selectedClassroomId);
  if (!cls) {
    setClassStats(null);
    return;
  }

  // lọc học sinh thuộc lớp này
  // YÊU CẦU: backend phải gán className / classCode cho từng dòng perStudent
  const inThisClass = (schoolStats.perStudent || []).filter((st) => {
    // match theo tên lớp + mã lớp (tuỳ bạn sử dụng cái nào đang có)
    const matchByName = st.className && st.className === cls.name;
    const matchByCode = st.classCode && cls.code && st.classCode === cls.code;
    return matchByName || matchByCode;
  });

  if (inThisClass.length === 0) {
    // không có học sinh nào trong lớp này có kết quả
    setClassStats({
      classroomId: cls._id,
      classroomName: cls.name,
      classroomCode: cls.code,
      schoolName: currentSchoolName || "",
      schoolCode: "",
      totalResults: 0,
      totalStudents: 0,
      avgScore: 0,
      minScore: 0,
      maxScore: 0,
      perTest: [],
      perStudent: [],
    });
    return;
  }

  // tổng số bài làm
  const totalResults = inThisClass.reduce((sum, st) => sum + st.count, 0);
  const totalStudents = inThisClass.length;

  // điểm TB lớp = TB của avgScore từng học sinh
  const avgScore =
    inThisClass.reduce((sum, st) => sum + st.avgScore, 0) / totalStudents;

  const minScore = Math.min(...inThisClass.map((st) => st.minScore));
  const maxScore = Math.max(...inThisClass.map((st) => st.maxScore));

  setClassStats({
    classroomId: cls._id,
    classroomName: cls.name,
    classroomCode: cls.code,
    schoolName: currentSchoolName || "",
    schoolCode: "",
    totalResults,
    totalStudents,
    avgScore,
    minScore,
    maxScore,
    perTest: [],            // hiện UI chưa dùng, để trống
    perStudent: inThisClass // dùng cho bảng "Kết quả theo học sinh trong lớp"
  });
}, [selectedClassroomId, schoolStats, classrooms, currentSchoolName]);

  // ====== HÀM EXPORT CSV ======
  const csvCell = (val: any) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv =
      "\uFEFF" +
      rows.map((r) => r.map(csvCell).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSchool = () => {
    if (!schoolStats) return;

    const currentYearObj =
    selectedYear === "all"
      ? null
      : schoolYears.find((y) => y._id === selectedYear);

  const labelYear =
    selectedYear === "all"
      ? "Tất cả năm học"
      : currentYearObj
      ? `Năm học ${currentYearObj.name}`
      : "Năm học (không xác định)";

    const headerSummary = [
      ["Trường", currentSchoolName || schoolStats.schoolId],
      ["Năm thống kê", labelYear],
      ["Tổng số bài làm", schoolStats.totalResults.toString()],
      ["Số học sinh", schoolStats.totalStudents.toString()],
      ["Điểm TB trường", schoolStats.avgScore.toFixed(2)],
      [
        "Min / Max",
        `${schoolStats.minScore.toFixed(2)} – ${schoolStats.maxScore.toFixed(
          2
        )}`,
      ],
      [""],
    ];

    // 👇 thêm cột "Lớp"
    const headerStudent = [
      ["Kết quả theo học sinh (toàn trường)"],
      ["Học sinh", "Email", "Lớp", "Số bài đã làm", "Điểm TB", "Min", "Max"],
    ];

    const rowsStudent = (schoolStats.perStudent || []).map((st) => {
      const classLabel = st.className
        ? st.classCode
          ? `${st.className} (${st.classCode})`
          : st.className
        : "";

      return [
        st.studentName,
        st.studentEmail || "",
        classLabel,
        st.count.toString(),
        st.avgScore.toFixed(2),
        st.minScore.toFixed(2),
        st.maxScore.toFixed(2),
      ];
    });

    const rows: string[][] = [
      ...headerSummary,
      ...headerStudent,
      ...rowsStudent,
    ];

    downloadCsv(
      `thong_ke_truong_${currentSchoolName || schoolStats.schoolId}.csv`,
      rows
    );
  };

  const handleExportClass = () => {
    if (!classStats) return;

    const className =
    classStats.classroomName +
    (classStats.classroomCode ? `_${classStats.classroomCode}` : "");

  const currentYearObj =
    selectedYear === "all"
      ? null
      : schoolYears.find((y) => y._id === selectedYear);

  const labelYear =
    selectedYear === "all"
      ? "Tất cả năm học"
      : currentYearObj
      ? `Năm học ${currentYearObj.name}`
      : "Năm học (không xác định)";

    const headerSummary = [
      // 👇 thêm dòng Trường
      [
        "Trường",
        classStats.schoolName ||
        currentSchoolName ||
        "", // fallback: currentSchoolName từ context
      ],
      ["Lớp", className],
      ["Năm thống kê", labelYear],
      ["Tổng số bài làm", classStats.totalResults.toString()],
      ["Số học sinh", classStats.totalStudents.toString()],
      ["Điểm TB lớp", classStats.avgScore.toFixed(2)],
      [
        "Min / Max",
        `${classStats.minScore.toFixed(2)} – ${classStats.maxScore.toFixed(
          2
        )}`,
      ],
      [""],
    ];

    const headerStudent = [
      ["Kết quả theo học sinh trong lớp"],
      ["Học sinh", "Email", "Số bài đã làm", "Điểm TB", "Min", "Max"],
    ];

    const rowsStudent = (classStats.perStudent || []).map((st) => [
      st.studentName,
      st.studentEmail || "",
      st.count.toString(),
      st.avgScore.toFixed(2),
      st.minScore.toFixed(2),
      st.maxScore.toFixed(2),
    ]);

    const rows: string[][] = [
      ...headerSummary,
      ...headerStudent,
      ...rowsStudent,
    ];

    downloadCsv(`thong_ke_lop_${className}.csv`, rows);
  };


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header page */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Báo cáo – Thống kê kết quả
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Thống kê kết quả học sinh
          </h1>
          <p className="text-sm text-slate-600">
            Xem nhanh hiệu suất làm bài theo trường và lớp, kèm xuất báo cáo CSV.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge
            variant="outline"
            className="text-xs px-3 py-1 border-slate-300 bg-white"
          >
            Vai trò:{" "}
            <span className="ml-1 font-semibold capitalize">
              {role || "unknown"}
            </span>
          </Badge>
          {currentSchoolName && (
            <span className="text-xs text-slate-500">
              Trường hiện tại:{" "}
              <span className="font-medium text-slate-800">
                {currentSchoolName}
              </span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Chọn trường + năm */}
      <Card className="border border-slate-200/80 shadow-sm bg-white/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            1. Chọn trường cần thống kê
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedSchoolId}
            onValueChange={setSelectedSchoolId}
            disabled={loadingSchools || !isAdmin}
          >
            <SelectTrigger className="w-full border-slate-200 focus:ring-indigo-500/40 focus:border-indigo-500">
              <SelectValue
                placeholder={
                  loadingSchools
                    ? "Đang tải danh sách trường..."
                    : "Chọn trường"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {schools.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name} {s.code ? `(${s.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isAdmin && (
            <p className="text-[11px] text-slate-500">
              School manager / Giáo viên chỉ xem được thống kê trường mình.
            </p>
          )}

          {/* Chọn năm thống kê */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-600">
              Năm thống kê
            </span>
            <Select
              value={selectedYear}
              onValueChange={setSelectedYear}
              disabled={loadingYears || schoolYears.length === 0}
            >
              <SelectTrigger className="w-full border-slate-200 focus:ring-indigo-500/40 focus:border-indigo-500">
                <SelectValue
                  placeholder={
                    loadingYears
                      ? "Đang tải năm học..."
                      : schoolYears.length === 0
                        ? "Chưa có năm học"
                        : "Chọn năm học"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả năm học</SelectItem>
                {schoolYears.map((y) => (
                  <SelectItem key={y._id} value={y._id}>
                    {y.name}
                    {y.isActive ? " (hiện tại)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-500">
              Chọn "Tất cả năm học" để xem toàn bộ kết quả, hoặc chọn 1 năm cụ thể.
            </p>
          </div>


        </CardContent>
      </Card>

      {/* Thống kê theo TRƯỜNG – chỉ admin */}
      {isAdmin && (
        <Card className="border border-slate-200/80 shadow-sm bg-gradient-to-br from-indigo-50/70 via-white to-slate-50">
          <CardHeader className="pb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                2. Thống kê theo trường{" "}
                {currentSchoolName && (
                  <span className="font-bold text-indigo-600">
                    – {currentSchoolName}
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Tổng quan kết quả làm bài của học sinh trong toàn trường.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!schoolStats}
              onClick={handleExportSchool}
              className="gap-1 border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700"
            >
              <Download className="w-4 h-4" />
              Xuất báo cáo trường
            </Button>
          </CardHeader>
          <CardContent>
            {loadingSchoolStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : !schoolStats ? (
              <p className="text-sm text-slate-500">
                Chưa có dữ liệu thống kê hoặc chưa chọn trường.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <SummaryBox
                    label="Tổng số bài làm"
                    value={schoolStats.totalResults}
                  />
                  <SummaryBox
                    label="Số học sinh"
                    value={schoolStats.totalStudents}
                  />
                  <SummaryBox
                    label="Điểm TB trường"
                    value={schoolStats.avgScore.toFixed(2)}
                  />
                  <SummaryBox
                    label="Min / Max"
                    value={`${schoolStats.minScore.toFixed(
                      2
                    )} – ${schoolStats.maxScore.toFixed(2)}`}
                  />
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-semibold mb-2 text-slate-900">
                    Kết quả theo học sinh (toàn trường)
                  </h3>
                  {schoolStats.perStudent.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Chưa có dữ liệu kết quả học sinh trong trường này.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="min-w-full text-xs md:text-sm">
                        <thead className="bg-slate-50/80">
                          <tr>
                            <Th>Học sinh</Th>
                            <Th>Email</Th>
                            <Th center>Số bài đã làm</Th>
                            <Th center>Điểm TB</Th>
                            <Th center>Min / Max</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {schoolStats.perStudent.map((st) => (
                            <tr
                              key={st.studentId}
                              className="odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 transition-colors"
                            >
                              <Td>{st.studentName}</Td>
                              <Td>{st.studentEmail || "-"}</Td>
                              <Td center>{st.count}</Td>
                              <Td center>{st.avgScore.toFixed(2)}</Td>
                              <Td center>
                                {st.minScore.toFixed(2)} –{" "}
                                {st.maxScore.toFixed(2)}
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chọn lớp */}
      <Card className="border border-slate-200/80 shadow-sm bg-white/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            {isAdmin ? "3. Chọn lớp cần xem" : "2. Chọn lớp cần xem"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={selectedClassroomId}
            onValueChange={setSelectedClassroomId}
            disabled={
              loadingClasses ||
              !selectedSchoolId ||
              classrooms.length === 0
            }
          >

            <SelectTrigger className="w-full border-slate-200 focus:ring-indigo-500/40 focus:border-indigo-500">
              <SelectValue
                placeholder={
                  !selectedSchoolId
                    ? "Chọn trường trước"
                    : loadingClasses
                      ? "Đang tải danh sách lớp..."
                      : classrooms.length === 0
                        ? "Không có lớp"
                        : "Chọn lớp"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {classrooms.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name} {c.code ? `(${c.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isTeacher && classrooms[0] && (
            <p className="text-[11px] text-slate-500">
              Bạn là giáo viên chủ nhiệm lớp{" "}
              <span className="font-semibold text-slate-800">
                {classrooms[0].name}
                {classrooms[0].code ? ` (${classrooms[0].code})` : ""}
              </span>
              . Thống kê bên dưới hiển thị theo lớp này.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Thống kê theo lớp */}
      <Card className="border border-slate-200/80 shadow-sm bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
        <CardHeader className="pb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              {isAdmin ? "4. " : "3. "}Kết quả theo lớp{" "}
              {classStats?.classroomName && (
                <span className="font-bold text-indigo-600">
                  – {classStats.classroomName}
                  {classStats.classroomCode
                    ? ` (${classStats.classroomCode})`
                    : ""}
                </span>
              )}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Thống kê chi tiết kết quả làm bài của từng học sinh trong lớp.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!classStats}
            onClick={handleExportClass}
            className="gap-1 border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700"
          >
            <Download className="w-4 h-4" />
            Xuất báo cáo lớp
          </Button>
        </CardHeader>
        <CardContent>
          {loadingClassStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : !classStats ? (
            <p className="text-sm text-slate-500">
              Chưa có dữ liệu thống kê hoặc chưa chọn lớp.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <SummaryBox
                  label="Tổng số bài làm"
                  value={classStats.totalResults}
                />
                <SummaryBox
                  label="Số học sinh"
                  value={classStats.totalStudents}
                />
                <SummaryBox
                  label="Điểm TB lớp"
                  value={classStats.avgScore.toFixed(2)}
                />
                <SummaryBox
                  label="Min / Max"
                  value={`${classStats.minScore.toFixed(
                    2
                  )} – ${classStats.maxScore.toFixed(2)}`}
                />
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-semibold mb-2 text-slate-900">
                  Kết quả theo học sinh trong lớp
                </h3>
                {classStats.perStudent.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Chưa có dữ liệu kết quả học sinh cho lớp này.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-xs md:text-sm">
                      <thead className="bg-slate-50/80">
                        <tr>
                          <Th>Học sinh</Th>
                          <Th>Email</Th>
                          <Th center>Số bài đã làm</Th>
                          <Th center>Điểm TB</Th>
                          <Th center>Min / Max</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStats.perStudent.map((st) => (
                          <tr
                            key={st.studentId}
                            className="odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 transition-colors"
                          >
                            <Td>{st.studentName}</Td>
                            <Td>{st.studentEmail || "-"}</Td>
                            <Td center>{st.count}</Td>
                            <Td center>{st.avgScore.toFixed(2)}</Td>
                            <Td center>
                              {st.minScore.toFixed(2)} –{" "}
                              {st.maxScore.toFixed(2)}
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type SummaryBoxProps = {
  label: string;
  value: string | number;
};

function SummaryBox({ label, value }: SummaryBoxProps) {
  return (
    <div className="border border-slate-200 rounded-2xl px-3 py-2.5 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-lg font-semibold text-slate-900">{value}</span>
    </div>
  );
}

type ThProps = {
  children: React.ReactNode;
  center?: boolean;
};

function Th({ children, center }: ThProps) {
  return (
    <th
      className={`px-3 py-2 text-[11px] md:text-xs font-semibold border-b border-slate-200 text-slate-700 ${center ? "text-center" : "text-left"
        }`}
    >
      {children}
    </th>
  );
}

type TdProps = {
  children: React.ReactNode;
  center?: boolean;
};

function Td({ children, center }: TdProps) {
  return (
    <td
      className={`px-3 py-2 border-b border-slate-200 text-[11px] md:text-xs text-slate-800 ${center ? "text-center" : "text-left"
        }`}
    >
      {children}
    </td>
  );
}
