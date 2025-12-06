import { useState, useEffect, ReactNode } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, PlusCircle } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type School = {
  _id: string;
  name: string;
  code?: string;
};

type Classroom = {
  _id: string;
  name: string;
  code?: string;
  school?: string | School;
};

type SchoolYear = {
  _id: string;
  name: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
};

type AddExamModalProps = {
  onSuccess?: () => void | Promise<void>;
  children?: ReactNode;
};

export default function AddExamModal({ onSuccess, children }: AddExamModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ngân hàng câu hỏi
  const [questions, setQuestions] = useState<any[]>([]);

  // danh sách trường / lớp
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // năm học hiện tại
  const [currentYear, setCurrentYear] = useState<SchoolYear | null>(null);

  // role & context hiện tại
  const [currentRole] = useState(() => localStorage.getItem("role") || "");
  const token = localStorage.getItem("token");

  // trường / lớp bị khóa theo role
  const [lockedSchool, setLockedSchool] = useState<School | null>(null);
  // lớp của giáo viên (các lớp GV này dạy)
  const [teacherClasses, setTeacherClasses] = useState<Classroom[]>([]);
  const [applyForGrade, setApplyForGrade] = useState(false);
  const [form, setForm] = useState({
    title: "",
    level: "",
    grade: "",
    skill: "",
    duration: 30,
    selectedQuestions: [] as string[],
    schoolId: "",
    classroomId: "",
    schoolYearId: "", // gửi kèm năm học hiện tại
  });

  /* ========= LOAD CÂU HỎI ========= */
  const loadQuestions = async (grade?: string, level?: string, skill?: string) => {
    if (!token) return;
    try {
      const params: any = {};
      if (grade) params.grade = grade;
      if (level) params.level = level;
      if (skill) params.skill = skill;

      const res = await axios.get(`${API_BASE_URL}/api/questions/filter`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setQuestions(data);
    } catch (err) {
      console.error("Lỗi load questions:", err);
      setQuestions([]);
    }
  };

  /* ========= LOAD TRƯỜNG (cho admin) ========= */
  const loadSchools = async () => {
    if (!token) return;
    try {
      setLoadingSchools(true);
      const res = await axios.get<{ schools: School[] }>(
        `${API_BASE_URL}/api/admin/schools`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSchools(res.data.schools || []);
    } catch (err) {
      console.error("Lỗi load schools:", err);
      setSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  };

  /* ========= LOAD LỚP THEO TRƯỜNG (cho admin / school_manager) ========= */
  const loadClasses = async (schoolId: string) => {
    if (!token || !schoolId) {
      setClasses([]);
      return;
    }
    try {
      setLoadingClasses(true);

      const res = await axios.get<{ classrooms: Classroom[] }>(
        `${API_BASE_URL}/api/admin/classrooms`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { schoolId },
        }
      );

      setClasses(res.data.classrooms || []);
    } catch (err) {
      console.error("Lỗi load classes:", err);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  /* ========= LOAD PROFILE: khóa trường + lấy danh sách lớp cho teacher + năm học ========= */
  const loadProfileContext = async () => {
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE_URL}/api/profile/me`, {
        headers,
      });

      const user = res.data?.user || res.data || {};
      const school: School | null = user.school || null;
      const classroom: Classroom | null = user.classroom || null;

      if (school) {
        setLockedSchool(school);
        setForm((prev) => ({ ...prev, schoolId: school._id }));
      }

      if (currentRole === "teacher") {
        // giáo viên: lấy danh sách lớp mình phụ trách
        const resClasses = await axios.get(
          `${API_BASE_URL}/api/admin/users/my-students/by-class`,
          { headers }
        );

        const rawClasses = resClasses.data?.classes || resClasses.data || [];
        const mapped: Classroom[] = rawClasses.map((c: any) => ({
          _id: c.classroomId,
          name: c.name,
          code: "",
          school: c.school?._id || c.school,
        }));

        setTeacherClasses(mapped);

        const defaultClassId =
          classroom?._id || mapped[0]?._id || "";

        setForm((prev) => ({
          ...prev,
          schoolId: school?._id || prev.schoolId,
          classroomId: defaultClassId || prev.classroomId,
        }));
      }

      if (currentRole === "school_manager" && school) {
        await loadClasses(school._id);
      }
    } catch (err) {
      console.error("Lỗi load profile context:", err);
      if (currentRole === "admin") {
        loadSchools();
      }
    }
  };

  /* ========= EFFECT: grade/level/skill đổi -> load lại câu hỏi ========= */
  useEffect(() => {
    loadQuestions(form.grade, form.level, form.skill);
    setForm((prev) => ({ ...prev, selectedQuestions: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.grade, form.level, form.skill]);

  /* ========= EFFECT: mở modal -> load trường / profile ========= */
  useEffect(() => {
    if (open) {
      setLockedSchool(null);
      setTeacherClasses([]);
      setCurrentYear(null);

      // năm học hệ thống (isActive = true)
      loadCurrentSchoolYear();

      if (currentRole === "teacher" || currentRole === "school_manager") {
        loadProfileContext();
      } else {
        loadSchools();
      }
    } else {
      // reset như cũ
      setForm({
        title: "",
        level: "",
        grade: "",
        skill: "",
        duration: 30,
        selectedQuestions: [],
        schoolId: "",
        classroomId: "",
        schoolYearId: "",
      });
      setQuestions([]);
      setClasses([]);
      setLockedSchool(null);
      setTeacherClasses([]);
      setCurrentYear(null);
      setApplyForGrade(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);


  /* ========= EFFECT: chọn trường -> load lớp (trừ teacher) ========= */
  useEffect(() => {
    if (!form.schoolId) {
      setClasses([]);
      setForm((prev) => ({ ...prev, classroomId: "" }));
      return;
    }

    if (currentRole === "teacher") return;

    loadClasses(form.schoolId);
    setForm((prev) => ({ ...prev, classroomId: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.schoolId, currentRole]);

  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.level ||
      !form.grade ||
      !form.skill ||
      form.selectedQuestions.length === 0
    ) {
      return toast.error("Vui lòng điền đầy đủ thông tin và chọn câu hỏi");
    }

    if (!form.schoolId) {
      return toast.error("Vui lòng chọn trường cho đề thi");
    }
    // nếu áp dụng cho cả khối → chỉ cần grade, không bắt buộc classroomId
    if (applyForGrade) {
      if (!form.grade) {
        return toast.error(
          "Vui lòng chọn khối (Lớp 6, 7, 8, ...) để áp dụng cho cả khối"
        );
      }
    } else {
      // áp dụng cho 1 lớp cụ thể → bắt buộc classroomId
      if (!form.classroomId) {
        return toast.error("Vui lòng chọn lớp cho đề thi");
      }
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/api/exams`,
        {
          title: form.title,
          level: form.level,
          grade: form.grade,
          skill: form.skill,
          duration: form.duration,
          questions: form.selectedQuestions,
          schoolId: form.schoolId,
          classroomId: applyForGrade ? undefined : form.classroomId,
          schoolYearId: form.schoolYearId || currentYear?._id,
          // 👇 thêm để backend phân biệt
          scope: applyForGrade ? "grade" : "class",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Tạo đề thi thành công 🎉");
      setOpen(false);
      setForm({
        title: "",
        level: "",
        grade: "",
        skill: "",
        duration: 30,
        selectedQuestions: [],
        schoolId: "",
        classroomId: "",
        schoolYearId: "",
      });
      await onSuccess?.();
    } catch (err: any) {
      console.error("Lỗi tạo đề:", err);
      toast.error(err.response?.data?.message || "Lỗi khi tạo đề");
    } finally {
      setLoading(false);
    }
  };
  const loadCurrentSchoolYear = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/school-years`, {
        headers: { Authorization: `Bearer ${token}` },
        // không gửi includeInactive -> chỉ trả years (isActive=true)
      });

      const years: SchoolYear[] = res.data?.years || [];
      if (years.length > 0) {
        const year = years[0]; // hoặc chọn theo sort bạn muốn
        setCurrentYear(year);
        setForm(prev => ({ ...prev, schoolYearId: year._id }));
      } else {
        setCurrentYear(null);
        setForm(prev => ({ ...prev, schoolYearId: "" }));
      }
    } catch (err) {
      console.error("Lỗi load năm học hiện tại:", err);
      setCurrentYear(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow">
            <PlusCircle size={18} />
            Tạo đề thi
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-indigo-600">
            🎯 Tạo đề thi mới
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 mt-4">
          {/* Tên đề thi */}
          <div className="grid gap-2">
            <Label>Tên đề thi</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tên đề thi..."
              className="focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Năm học hiện tại (read-only) */}
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Năm học hiện tại</Label>
              <Input
                value={
                  currentYear?.name
                    ? currentYear.name
                    : "Chưa cấu hình năm học (isActive = true)"
                }
                disabled
                className="bg-slate-50"
              />

            </div>
          </div>

          {/* Trường & Lớp */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Trường */}
            <div>
              <Label>Trường</Label>
              {lockedSchool ? (
                <Input
                  value={`${lockedSchool.name}${lockedSchool.code ? ` (${lockedSchool.code})` : ""
                    }`}
                  disabled
                  className="bg-slate-50"
                />
              ) : (
                <Select
                  value={form.schoolId}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, schoolId: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loadingSchools ? "Đang tải..." : "Chọn trường"}
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
              )}
            </div>

            {/* Lớp */}
            <div>
              <Label>Lớp</Label>
              {currentRole === "teacher" ? (
                <Select
                  value={form.classroomId}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, classroomId: val }))
                  }
                  disabled={teacherClasses.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        teacherClasses.length === 0
                          ? "Bạn chưa được gán lớp nào"
                          : "Chọn lớp"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherClasses.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name} {c.code ? `(${c.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={form.classroomId}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, classroomId: val }))
                  }
                  disabled={
                    applyForGrade ||                // nếu áp dụng cho khối thì khoá chọn lớp
                    (!form.schoolId && !lockedSchool) ||
                    loadingClasses
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !form.schoolId && !lockedSchool
                          ? "Chọn trường trước"
                          : loadingClasses
                            ? "Đang tải lớp..."
                            : classes.length === 0
                              ? "Không có lớp"
                              : "Chọn lớp"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name} {c.code ? `(${c.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(currentRole === "admin" || currentRole === "school_manager") && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="apply-grade"
                    type="checkbox"
                    checked={applyForGrade}
                    onChange={(e) => setApplyForGrade(e.target.checked)}
                  />
                  <Label
                    htmlFor="apply-grade"
                    className="text-xs font-normal text-muted-foreground"
                  >
                    Áp dụng cho toàn bộ khối {form.grade || "…"}
                    (tất cả lớp cùng khối trong trường)
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Khối, Level, Skill */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Khối (grade)</Label>
              <Select
                value={form.grade}
                onValueChange={(val) => setForm({ ...form, grade: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khối" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }, (_, i) => 6 + i).map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      Lớp {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Level</Label>
              <Select
                value={form.level}
                onValueChange={(val) => setForm({ ...form, level: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Kỹ năng</Label>
              <Select
                value={form.skill}
                onValueChange={(val) => setForm({ ...form, skill: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kỹ năng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="listening">Listening</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                  <SelectItem value="speaking">Speaking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Thời gian */}
          <div>
            <Label>⏱ Thời gian làm bài (phút)</Label>
            <Input
              type="number"
              min={1}
              value={form.duration}
              onChange={(e) =>
                setForm({ ...form, duration: Number(e.target.value) })
              }
              className="max-w-[200px]"
            />
          </div>

          {/* Danh sách câu hỏi */}
          <div>
            <Label className="mb-2 block">🧩 Chọn câu hỏi</Label>
            <div className="max-h-80 overflow-y-auto border rounded-lg p-3 bg-muted/30">
              {questions.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          questions.length > 0 &&
                          questions.every((q) =>
                            form.selectedQuestions.includes(q._id)
                          )
                        }
                        onChange={(e) => {
                          setForm((prev) => ({
                            ...prev,
                            selectedQuestions: e.target.checked
                              ? questions.map((q) => q._id)
                              : [],
                          }));
                        }}
                      />
                      <span className="font-medium text-sm">Chọn tất cả</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Đã chọn {form.selectedQuestions.length}/
                      {questions.length} câu
                    </span>
                  </div>

                  <div className="space-y-1">
                    {questions.map((q) => (
                      <label
                        key={q._id}
                        className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition
                          ${form.selectedQuestions.includes(q._id)
                            ? "bg-indigo-50 border border-indigo-200"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.selectedQuestions.includes(q._id)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...form.selectedQuestions, q._id]
                              : form.selectedQuestions.filter(
                                (id) => id !== q._id
                              );
                            setForm({ ...form, selectedQuestions: updated });
                          }}
                        />
                        <div className="text-sm">
                          <div>{q.content}</div>
                          {q.explanation && (
                            <div className="text-xs text-slate-500 mt-1">
                              Giải thích: {q.explanation}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, selectedQuestions: [] })
                    }
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Bỏ chọn tất cả
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ❗ Chưa có câu hỏi trong ngân hàng
                </p>
              )}
            </div>
          </div>

          {/* Nút Lưu */}
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              form.selectedQuestions.length === 0 ||
              !form.schoolId ||
              (!applyForGrade && !form.classroomId)
            }
            className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Đang lưu...
              </span>
            ) : (
              "💾 Lưu đề thi"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
