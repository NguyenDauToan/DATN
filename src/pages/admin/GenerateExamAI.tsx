import { useState, useCallback, ReactNode, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { testAPI } from "@/api/Api";
import axios from "axios";

type GenerateExamAIProps = {
  onSuccess?: () => void | Promise<void>;
  children?: ReactNode;
};

type School = {
  _id: string;
  name: string;
  code?: string;
};

type Classroom = {
  _id: string;
  name: string;
  code?: string;
  school?: string;
};

type SchoolYear = {
  _id: string;
  name: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
};

type CurrentUser = {
  _id: string;
  name: string;
  role: "admin" | "school_manager" | "teacher" | "student" | string;
  school?: School | null;
  classroom?: Classroom | null;
  classes?: Classroom[];
  currentSchoolYear?: SchoolYear | string | null;
  schoolYear?: SchoolYear | string | null;
};

const token =
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

export function GenerateExamAI({ onSuccess, children }: GenerateExamAIProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [createdExam, setCreatedExam] = useState<any>(null);

  const [form, setForm] = useState({
    title: "",
    grade: "",
    skill: "",
    level: "",
    duration: 45,
    numQuestions: 10,
    schoolId: "",
    classroomId: "",
    schoolYearId: "",
  });

  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<Classroom[]>([]);
  const [currentYear, setCurrentYear] = useState<SchoolYear | null>(null);
  const [applyForGrade, setApplyForGrade] = useState(false);
  const role = currentUser?.role;
  const isAdmin = role === "admin";
  const isManager = role === "school_manager";
  const isTeacher = role === "teacher";

  /* ===================== API HELPERS ===================== */

  // load danh sách trường (chỉ dùng cho admin)
  const loadSchools = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingSchools(true);
      const res = await axios.get("https://english-backend-uoic.onrender.com/api/admin/schools", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: School[] = (res.data?.schools || res.data || []) as School[];
      setSchools(data);
    } catch (err) {
      console.error("Lỗi load schools:", err);
      setSchools([]);
      toast.error("Không tải được danh sách trường");
    } finally {
      setLoadingSchools(false);
    }
  }, []);

  // load danh sách lớp theo trường
  const loadClasses = useCallback(async (schoolId: string) => {
    if (!token || !schoolId) {
      setClasses([]);
      return;
    }
    try {
      setLoadingClasses(true);
      const res = await axios.get(
        "https://english-backend-uoic.onrender.com/api/admin/classrooms",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { schoolId },
        }
      );
      const data: Classroom[] = (res.data?.classrooms ||
        res.data ||
        []) as Classroom[];
      setClasses(data);
    } catch (err) {
      console.error("Lỗi load classes:", err);
      setClasses([]);
      toast.error("Không tải được danh sách lớp");
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  // load thông tin user hiện tại -> cố định trường / lớp theo role + năm học
  const loadProfile = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingProfile(true);
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get("https://english-backend-uoic.onrender.com/api/profile/me", {
        headers,
      });

      const user: CurrentUser = res.data?.user || res.data;
      setCurrentUser(user);


      const schoolId = user.school?._id || "";
      const classroomId =
        user.classroom?._id || user.classes?.[0]?._id || "";

      // gán sẵn trường/lớp nếu có
      setForm((prev) => ({
        ...prev,
        schoolId: schoolId || prev.schoolId,
        classroomId: classroomId || prev.classroomId,
      }));

      if (user.role === "admin") {
        await loadSchools();
      } else if (user.role === "school_manager") {
        if (schoolId) {
          await loadClasses(schoolId);
        }
      } else if (user.role === "teacher") {
        // 1️⃣ giáo viên: lấy danh sách lớp mình phụ trách
        const resClasses = await axios.get(
          "https://english-backend-uoic.onrender.com/api/admin/users/my-students/by-class",
          { headers }
        );
        const classesFromApi = resClasses.data?.classes || [];

        const myClasses: Classroom[] = classesFromApi.map((c: any) => ({
          _id: c.classroomId,
          name: c.name,
          code: "",
          school: c.school?._id || c.school,
        }));

        setTeacherClasses(myClasses);

        const defaultClassId =
          classroomId || (myClasses[0]?._id || "");

        setForm((prev) => ({
          ...prev,
          schoolId: schoolId || prev.schoolId,
          classroomId: defaultClassId || prev.classroomId,
        }));
      }
    } catch (err) {
      console.error("Lỗi load profile:", err);
      toast.error("Không tải được thông tin tài khoản");
    } finally {
      setLoadingProfile(false);
    }
  }, [loadClasses, loadSchools]);

  /* ===================== EFFECTS ===================== */
  const loadCurrentSchoolYear = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get("https://english-backend-uoic.onrender.com/api/admin/school-years", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const years: SchoolYear[] = res.data?.years || [];
      if (years.length > 0) {
        const year = years[0];
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
  }, []);
  // mở dialog -> load profile + dữ liệu liên quan
  useEffect(() => {
    if (open) {
      loadProfile();
      loadCurrentSchoolYear();
    } else {
      setQuestions([]);
      setCreatedExam(null);
      setForm({
        title: "",
        grade: "",
        skill: "",
        level: "",
        duration: 45,
        numQuestions: 10,
        schoolId: "",
        classroomId: "",
        schoolYearId: "",
      });
      setClasses([]);
      setCurrentYear(null);
      setApplyForGrade(false);
    }
  }, [open, loadProfile, loadCurrentSchoolYear]);


  // khi admin / manager đổi trường -> load lại lớp
  useEffect(() => {
    if (!form.schoolId) {
      setClasses([]);
      setForm((prev) => ({ ...prev, classroomId: "" }));
      return;
    }

    // giáo viên dùng teacherClasses, không cần load toàn bộ lớp trường
    if (isTeacher) return;

    loadClasses(form.schoolId);
  }, [form.schoolId, loadClasses, isTeacher]);

  /* ===================== HANDLERS ===================== */

  const handleGenerate = useCallback(async () => {
    if (!form.grade || !form.skill || !form.numQuestions || !form.duration) {
      return toast.error(
        "Vui lòng điền đầy đủ thông tin (lớp, kỹ năng, số câu, thời gian)"
      );
    }

    try {
      setLoading(true);
      const res = await testAPI.createAI({
        title: form.title,
        grade: form.grade,
        skill: form.skill,
        level: form.level,
        duration: form.duration,
        numQuestions: form.numQuestions,
        // năm học không bắt buộc cho bước sinh câu hỏi
      });
      if (!res.data.questions?.length)
        return toast.error("Không có câu hỏi phù hợp");

      setQuestions(res.data.questions);
      setCreatedExam({
        title: form.title || `Đề thi lớp ${form.grade} - ${form.skill}`,
        grade: form.grade,
        skill: form.skill,
        level: form.level || "mixed",
        duration: form.duration,
        questions: res.data.questions.map((q: any) => q._id),
        schoolId: form.schoolId || undefined,
        classroomId: form.classroomId || undefined,
        schoolYearId: form.schoolYearId || currentYear?._id,
      });

      toast.success("AI đã chọn câu hỏi thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Lỗi khi tạo đề thi AI");
    } finally {
      setLoading(false);
    }
  }, [form, currentYear]);

  const handleSave = useCallback(async () => {
    if (!createdExam || !questions.length)
      return toast.error("Chưa có đề thi để lưu");

    if (!form.schoolId) {
      return toast.error("Vui lòng chọn trường áp dụng đề thi");
    }

    // nếu áp dụng cho cả khối -> cần grade
    if (applyForGrade) {
      if (!form.grade) {
        return toast.error(
          "Vui lòng chọn khối (Lớp 6,7,8...) để áp dụng cho cả khối"
        );
      }
    } else {
      // áp dụng theo lớp -> cần classroomId
      if (!form.classroomId) {
        return toast.error("Vui lòng chọn lớp áp dụng đề thi");
      }
    }

    try {
      setLoading(true);
      await testAPI.saveExam({
        ...createdExam,
        schoolId: form.schoolId,
        classroomId: applyForGrade ? undefined : form.classroomId,
        schoolYearId: form.schoolYearId || currentYear?._id,
        // gợi ý thêm field để BE dễ phân biệt
        scope: applyForGrade ? "grade" : "class",
      });

      toast.success("Đề thi đã lưu vào database!");
      await onSuccess?.();

      setOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Lỗi khi lưu đề thi");
    } finally {
      setLoading(false);
    }
  }, [
    createdExam,
    questions,
    form.schoolId,
    form.classroomId,
    form.schoolYearId,
    form.grade,
    currentYear,
    onSuccess,
    applyForGrade,
  ]);

  /* ===================== RENDER ===================== */

  const displaySchoolName =
    currentUser?.school?.name ||
    schools.find((s) => s._id === form.schoolId)?.name ||
    "";

  const displayClassName =
    currentUser?.classroom?.name ||
    currentUser?.classes?.find((c) => c._id === form.classroomId)?.name ||
    classes.find((c) => c._id === form.classroomId)?.name ||
    "";


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className="bg-purple-600 hover:bg-purple-700 ml-2">
            🤖 Tạo đề thi AI
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo đề thi tự động bằng AI</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Năm học hiện tại */}
          <div className="space-y-2">
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

          {/* TRƯỜNG / LỚP ÁP DỤNG */}
          <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-3">
            <p className="text-xs font-medium">
              Áp dụng đề thi cho Trường / Lớp cụ thể.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Trường */}
              <div className="space-y-2">
                <Label>Trường</Label>

                {isManager || isTeacher ? (
                  // school_manager & teacher: trường cố định, chỉ hiển thị
                  <Input
                    value={displaySchoolName || "Chưa gắn trường"}
                    readOnly
                    disabled
                  />
                ) : (
                  // admin: chọn trường bình thường
                  <Select
                    value={form.schoolId || ""}
                    onValueChange={(val) =>
                      setForm((prev) => ({ ...prev, schoolId: val }))
                    }
                    disabled={loadingSchools || loadingProfile}
                  >
                    <SelectTrigger>
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
                )}
              </div>

              {/* Lớp */}
              <div className="space-y-2">
                <Label>Lớp</Label>

                {isTeacher ? (
                  // giáo viên: chọn một trong các lớp mình phụ trách
                  <Select
                    value={form.classroomId || ""}
                    onValueChange={(val) =>
                      setForm((prev) => ({ ...prev, classroomId: val }))
                    }
                    disabled={loadingProfile || teacherClasses.length === 0}
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
                  // admin + school_manager: chọn lớp trong trường
                  <Select
                    value={form.classroomId || ""}
                    onValueChange={(val) =>
                      setForm((prev) => ({ ...prev, classroomId: val }))
                    }
                    disabled={
                      applyForGrade || // nếu áp dụng cho cả khối thì khoá dropdown lớp
                      !form.schoolId ||
                      loadingClasses ||
                      loadingProfile
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !form.schoolId
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
                {(isAdmin || isManager) && (
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox
                      id="apply-grade"
                      checked={applyForGrade}
                      onCheckedChange={(checked) =>
                        setApplyForGrade(!!checked)
                      }
                    />
                    <Label
                      htmlFor="apply-grade"
                      className="text-xs font-normal text-muted-foreground"
                    >
                      Áp dụng cho toàn bộ khối{" "}
                      {form.grade || "…"} (tất cả lớp cùng khối trong trường)
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Các field còn lại */}
          <div>
            <Label>Tên đề thi</Label>
            <Input
              placeholder="Nhập tên đề (có thể bỏ trống)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <Label>Lớp</Label>
            <Select
              value={form.grade}
              onValueChange={(val) => setForm({ ...form, grade: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp" />
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

          <div>
            <Label>Cấp độ</Label>
            <Select
              value={form.level}
              onValueChange={(val) => setForm({ ...form, level: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn cấp độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="mixed">Mixed (Tự random)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Thời gian (phút)</Label>
            <Input
              type="number"
              value={form.duration}
              onChange={(e) =>
                setForm({ ...form, duration: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <Label>Số câu hỏi</Label>
            <Input
              type="number"
              value={form.numQuestions}
              onChange={(e) =>
                setForm({ ...form, numQuestions: Number(e.target.value) })
              }
            />
          </div>

          <Button onClick={handleGenerate} className="w-full" disabled={loading}>
            {loading ? "⏳ Đang chọn câu hỏi..." : "Chọn câu hỏi & tạo đề thi AI"}
          </Button>

          {questions.length > 0 && (
            <div className="border p-3 rounded-lg bg-gray-50 space-y-2 mt-4">
              <h3 className="font-semibold text-lg">Danh sách câu hỏi:</h3>
              {questions.map((q, i) => (
                <div key={q._id || i} className="border p-2 rounded">
                  <p>
                    {i + 1}. {q.content}
                  </p>

                  {q.options?.length > 0 ? (
                    <ul className="list-disc ml-5">
                      {q.options.map((opt: string, idx: number) => (
                        <li key={idx}>
                          {opt} {opt === q.answer && <b>(Đáp án đúng)</b>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    q.answer && (
                      <p className="text-green-700 text-sm mt-1">
                        Đáp án:{" "}
                        <span className="font-semibold">{q.answer}</span>
                      </p>
                    )
                  )}

                  {q.explanation && (
                    <p className="text-xs text-slate-600 mt-1">
                      Giải thích: {q.explanation}
                    </p>
                  )}
                </div>
              ))}

              <Button
                onClick={handleSave}
                className="w-full mt-4"
                disabled={loading}
              >
                {loading ? "⏳ Đang lưu..." : "💾 Lưu đề thi (gắn trường / lớp)"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
