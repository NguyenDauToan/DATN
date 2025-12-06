"use client";

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
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  PlusCircle,
  Globe2,
  Timer,
} from "lucide-react";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadMockExamExcelDialog } from "./UploadMockExamExcelDialog";

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
  grade?: string;
};

type SchoolYear = {
  _id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
};

type MockExam = {
  _id?: string;
  name: string;
  examType: "thptqg" | "ielts" | "toeic" | "vstep" | "other";
  description?: string;
  duration: number;
  level?: "easy" | "medium" | "hard" | "mixed";
  grade?: string;
  skill?: string;
  year?: number;
  officialName?: string;
  tags?: string[];
  isActive?: boolean;
  totalQuestions?: number;
  slug?: string;

  schoolId?: string;
  classroomId?: string;
  scope?: "class" | "grade";
  gradeKey?: string;

  startTime?: string;
  endTime?: string;

  school?: School | null;
  classroom?: Classroom | null;

  schoolYear?: SchoolYear | string | null;

  status?: "pending" | "approved" | "rejected";
  isArchived?: boolean;
  archivedAt?: string;
};

const examTypeLabel: Record<MockExam["examType"], string> = {
  thptqg: "THPTQG",
  ielts: "IELTS",
  toeic: "TOEIC",
  vstep: "VSTEP",
  other: "Kỳ thi khác",
};

const levelLabel: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
  mixed: "Nhiều mức độ",
};

const levelBadgeClass: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  hard: "bg-rose-50 text-rose-700 border border-rose-200",
  mixed: "bg-sky-50 text-sky-700 border border-sky-200",
};

const token =
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

/* =========================
  AddMockExamDialog
  ========================= */
function AddMockExamDialog({
  onSuccess,
  currentUser,
}: {
  onSuccess?: () => void;
  currentUser?: any;
}) {
  const role = currentUser?.role;
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isSchoolManager = role === "school_manager";

  const teacherGradeValue =
    isTeacher && currentUser
      ? currentUser.classroom && typeof currentUser.classroom === "object"
        ? currentUser.classroom.grade
        : currentUser.grade
      : undefined;

  const teacherGradeLabel = teacherGradeValue
    ? `Lớp ${teacherGradeValue}`
    : "Lớp của bạn";

  const initialExamKey =
    isTeacher && teacherGradeValue ? `Lop${teacherGradeValue}` : "thptqg";

  const currentSchoolId = !isAdmin
    ? currentUser?.school && typeof currentUser.school === "object"
      ? currentUser.school._id
      : currentUser?.school
    : "";

  const currentSchoolName =
    !isAdmin && currentUser?.school && typeof currentUser.school === "object"
      ? currentUser.school.name
      : "";

  const currentClassroomId = isTeacher
    ? currentUser?.classroom && typeof currentUser.classroom === "object"
      ? currentUser.classroom._id
      : currentUser?.classroom
    : "";

  const currentClassroomName =
    isTeacher &&
      currentUser?.classroom &&
      typeof currentUser.classroom === "object"
      ? currentUser.classroom.name
      : "";

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentSchoolYear, setCurrentSchoolYear] =
    useState<SchoolYear | null>(null);
  const [loadingSchoolYear, setLoadingSchoolYear] = useState(false);

  const [examKey, setExamKey] = useState<string>(initialExamKey);

  const [form, setForm] = useState<MockExam>({
    name: "",
    examType: "thptqg",
    description: "",
    duration: 60,
    level: "mixed",
    grade: "",
    skill: "mixed",
    tags: [],
    totalQuestions: 40,
    slug: "",
    schoolId: currentSchoolId || "",
    classroomId: currentClassroomId || "",
    startTime: "",
    endTime: "",
  });

  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const handleChange = (field: keyof MockExam, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const gradeMap: Record<string, { label: string; queryGrade: string }> = {
    Lop6: { label: "Lớp 6", queryGrade: "6" },
    Lop7: { label: "Lớp 7", queryGrade: "7" },
    Lop8: { label: "Lớp 8", queryGrade: "8" },
    Lop9: { label: "Lớp 9", queryGrade: "9" },
    Lop10: { label: "Lớp 10", queryGrade: "10" },
    Lop11: { label: "Lớp 11", queryGrade: "11" },
    Lop12: { label: "Lớp 12", queryGrade: "12" },
  };

  const loadCurrentSchoolYear = async () => {
    const tokenLocal =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!tokenLocal) return;
    try {
      setLoadingSchoolYear(true);
      const res = await axios.get(
        "https://english-backend-uoic.onrender.com/api/mock-exams/meta/current-year",
        {
          headers: { Authorization: `Bearer ${tokenLocal}` },
        }
      );
      const year: SchoolYear = res.data?.schoolYear || res.data;
      setCurrentSchoolYear(year);
    } catch (err) {
      console.error("Lỗi load năm học hiện tại:", err);
      setCurrentSchoolYear(null);
    } finally {
      setLoadingSchoolYear(false);
    }
  };

  // lấy gradeKey từ lớp được chọn
  const getGradeKeyFromClassroom = (): string | null => {
    if (!form.classroomId) return null;
    const selectedClass = classes.find((c) => c._id === form.classroomId);
    if (selectedClass?.grade) return String(selectedClass.grade);
    return null;
  };

  const handleExamKeyChange = (val: string) => {
    setExamKey(val);

    if (val === "none") {
      // chế độ "chỉ theo lớp" -> cho phép chọn lớp
      handleChange("examType", "thptqg");
      handleChange("grade", "");
      return;
    }

    // chọn khối / kỳ thi cố định -> áp dụng cho cả khối, xóa lớp
    handleChange("classroomId", "");

    if (gradeMap[val]) {
      handleChange("examType", "thptqg");
      handleChange("grade", gradeMap[val].label);
    } else if (val === "thptqg") {
      handleChange("examType", "thptqg");
      handleChange("grade", "thptqg");
    } else if (val === "ielts" || val === "toeic" || val === "vstep") {
      handleChange("examType", val as MockExam["examType"]);
      handleChange("grade", val);
    } else {
      handleChange("examType", "other");
      handleChange("grade", "");
    }
  };

  const getGradeKeyFromExamKey = (key: string): string | null => {
    if (!key || key === "none") return null;
    if (gradeMap[key]) return gradeMap[key].queryGrade;
    if (key === "thptqg") return "thptqg";
    return null;
  };

  const loadBankQuestions = async () => {
    const tokenLocal =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!tokenLocal) return;

    let queryGrade = "";

    if (form.classroomId) {
      const selectedClass = classes.find((c) => c._id === form.classroomId);
      if (selectedClass?.grade) {
        queryGrade = String(selectedClass.grade);
      }
    }

    if (!queryGrade && isTeacher && teacherGradeValue) {
      queryGrade = String(teacherGradeValue);
    }

    if (!queryGrade) {
      if (gradeMap[examKey]) {
        queryGrade = gradeMap[examKey].queryGrade;
      } else if (["thptqg", "ielts", "toeic", "vstep"].includes(examKey)) {
        queryGrade = examKey;
      }
    }

    if (!queryGrade) {
      setBankQuestions([]);
      setSelectedQuestionIds([]);
      return;
    }

    try {
      setLoadingQuestions(true);
      const res = await axios.get("https://english-backend-uoic.onrender.com/api/questions/filter", {
        headers: { Authorization: `Bearer ${tokenLocal}` },
        params: { grade: queryGrade },
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setBankQuestions(data);
      setSelectedQuestionIds([]);
    } catch (err) {
      console.error(err);
      setBankQuestions([]);
      toast.error("Không tải được câu hỏi cho lớp / kỳ thi này");
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    loadBankQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examKey, form.classroomId, teacherGradeValue, classes.length]);

  const loadSchools = async () => {
    const tokenLocal =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!tokenLocal) return;

    try {
      setLoadingSchools(true);
      const res = await axios.get("https://english-backend-uoic.onrender.com/api/admin/schools", {
        headers: { Authorization: `Bearer ${tokenLocal}` },
      });
      const data: School[] = (res.data?.schools || res.data || []) as School[];
      setSchools(data);
    } catch (err) {
      console.error("Lỗi load schools:", err);
      setSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadClasses = async (
    schoolId: string,
    opts?: { teacherOnly?: boolean }
  ) => {
    const tokenLocal =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!tokenLocal || !schoolId) {
      setClasses([]);
      return;
    }

    try {
      setLoadingClasses(true);
      const params: any = { schoolId };
      if (opts?.teacherOnly && currentUser?._id) {
        params.teacherId = currentUser._id;
      }

      const res = await axios.get(
        "https://english-backend-uoic.onrender.com/api/admin/classrooms",
        {
          headers: { Authorization: `Bearer ${tokenLocal}` },
          params,
        }
      );
      const data: Classroom[] = (res.data?.classrooms || res.data || []) as Classroom[];
      setClasses(data);
    } catch (err) {
      console.error("Lỗi load classes:", err);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    if (!form.schoolId) {
      setClasses([]);
      setForm((prev) => ({ ...prev, classroomId: "" }));
      return;
    }

    if (isTeacher) {
      loadClasses(form.schoolId, { teacherOnly: true });
      return;
    }

    loadClasses(form.schoolId);
    setForm((prev) => ({ ...prev, classroomId: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.schoolId, isTeacher]);

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const autoPickQuestionsBySkill = (): string[] => {
    if (!bankQuestions.length) return [];

    const groups: Record<string, string[]> = {
      reading: [],
      listening: [],
      writing: [],
      speaking: [],
      other: [],
    };

    bankQuestions.forEach((q: any) => {
      const skill = (q.skill || "").toLowerCase();
      if (skill === "reading") groups.reading.push(q._id);
      else if (skill === "listening") groups.listening.push(q._id);
      else if (skill === "writing") groups.writing.push(q._id);
      else if (skill === "speaking") groups.speaking.push(q._id);
      else groups.other.push(q._id);
    });

    const totalTarget = form.totalQuestions || 40;
    const skillsOrder = ["reading", "listening", "writing", "speaking"];
    const basePerSkill = Math.floor(totalTarget / 4);

    const picked: string[] = [];
    const leftovers: string[] = [];

    for (const sk of skillsOrder) {
      const pool = shuffle(groups[sk]);
      const take = Math.min(basePerSkill, pool.length);
      picked.push(...pool.slice(0, take));
      leftovers.push(...pool.slice(take));
    }

    leftovers.push(...shuffle(groups.other));

    const needMore = totalTarget - picked.length;
    if (needMore > 0) picked.push(...leftovers.slice(0, needMore));

    return Array.from(new Set(picked));
  };

  const isClassLockedByExamKey = !isTeacher && examKey !== "none";

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      return toast.error("Vui lòng nhập tên đề thi thử");
    }
    if (!form.duration || form.duration <= 0) {
      return toast.error("Thời gian làm bài phải lớn hơn 0");
    }
    if (!form.schoolId) {
      return toast.error("Vui lòng chọn trường áp dụng đề thi");
    }

    let gradeKey: string | null = null;
    let scope: "class" | "grade";

    // GIÁO VIÊN: BẮT BUỘC PHẢI GẮN VỚI LỚP MÌNH
    if (isTeacher) {
      if (!form.classroomId) {
        return toast.error("Giáo viên chỉ được tạo đề cho lớp mình giảng dạy. Vui lòng chọn lớp bạn phụ trách.");
      }
      scope = "class";
      gradeKey =
        getGradeKeyFromClassroom() ||
        (teacherGradeValue ? String(teacherGradeValue) : null);
    } else {
      // ADMIN / SCHOOL_MANAGER: GIỮ NG NGHIỆP VỤ CŨ
      if (form.classroomId) {
        scope = "class";
        gradeKey =
          getGradeKeyFromClassroom() || null;
      } else {
        const _gradeKey = getGradeKeyFromExamKey(examKey);
        if (!_gradeKey) {
          return toast.error(
            "Vui lòng chọn khối hợp lệ (Lớp 6–12, THPTQG) hoặc gắn đề với một lớp cụ thể."
          );
        }
        gradeKey = _gradeKey;
        scope = "grade";
      }
    }

    let finalQuestionIds = selectedQuestionIds;
    if (finalQuestionIds.length === 0) {
      finalQuestionIds = autoPickQuestionsBySkill();
      if (finalQuestionIds.length === 0) {
        return toast.error("Không tìm được câu hỏi phù hợp để tạo đề thi thử");
      }
    }

    const tokenLocal =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!tokenLocal) {
      toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(
        "https://english-backend-uoic.onrender.com/api/mock-exams",
        {
          name: form.name,
          examType: form.examType,
          description: form.description,
          duration: form.duration,
          level: form.level,
          grade: form.grade,
          skill: form.skill,
          tags: form.tags,
          totalQuestions: finalQuestionIds.length,
          slug: form.slug || undefined,
          questions: finalQuestionIds,
          schoolId: form.schoolId,
          classroomId: scope === "class" ? form.classroomId : undefined,
          scope,
          gradeKey: scope === "grade" ? gradeKey : undefined,
        },
        {
          headers: { Authorization: `Bearer ${tokenLocal}` },
        }
      );
      window.dispatchEvent(
        new CustomEvent("exam:created", { detail: { kind: "mock" as const } })
      );
      toast.success("Tạo đề thi thử thành công");
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
        "Lỗi khi tạo đề thi thử. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };


  const handleAutoGenerate = async () => {
    let gradeKey: string | null = null;
    let scope: "class" | "grade";

    if (isTeacher) {
      // GIÁO VIÊN: CHỈ ĐƯỢC TẠO ĐỀ THEO LỚP CỦA MÌNH
      if (!form.classroomId) {
        return toast.error("Giáo viên chỉ được tạo đề cho lớp mình giảng dạy. Vui lòng chọn lớp bạn phụ trách.");
      }
      scope = "class";
      gradeKey =
        getGradeKeyFromClassroom() ||
        (teacherGradeValue ? String(teacherGradeValue) : null);
    } else {
      // ADMIN / SCHOOL_MANAGER
      if (form.classroomId) {
        scope = "class";
        gradeKey =
          getGradeKeyFromClassroom() || null;
      } else {
        if (isTeacher && teacherGradeValue) {
          scope = "grade";
          gradeKey = String(teacherGradeValue);
        } else {
          const _gradeKey = getGradeKeyFromExamKey(examKey);
          if (!_gradeKey) {
            return toast.error(
              "Vui lòng chọn khối hợp lệ (Lớp 6–12, THPTQG) hoặc gắn đề với một lớp cụ thể."
            );
          }
          scope = "grade";
          gradeKey = _gradeKey;
        }
      }
    }

    if (!gradeKey) {
      return toast.error(
        "Không xác định được khối để tạo đề tự động. Vui lòng kiểm tra lại lớp / khối."
      );
    }

    if (!form.schoolId) {
      return toast.error("Vui lòng chọn trường áp dụng đề thi");
    }

    const tokenLocal =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!tokenLocal) {
      toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        "https://english-backend-uoic.onrender.com/api/mock-exams/auto-generate",
        {
          gradeKey,
          name: form.name?.trim() || undefined,
          totalQuestions: form.totalQuestions || 40,
          duration: form.duration || 60,
          level: form.level || "mixed",
          schoolId: form.schoolId,
          classroomId: scope === "class" ? form.classroomId : undefined,
          scope,
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
        },
        {
          headers: { Authorization: `Bearer ${tokenLocal}` },
        }
      );
      window.dispatchEvent(
        new CustomEvent("exam:created", { detail: { kind: "mock" as const } })
      );
      toast.success("Đã tạo đề thi thử tự động từ ngân hàng câu hỏi");
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
        "Lỗi khi tạo đề tự động. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };


  const resetForm = () => {
    setExamKey("thptqg");
    setForm({
      name: "",
      examType: "thptqg",
      description: "",
      duration: 60,
      level: "mixed",
      grade: "",
      skill: "mixed",
      tags: [],
      totalQuestions: 40,
      slug: "",
      schoolId: currentSchoolId || "",
      classroomId: isTeacher ? "" : currentClassroomId || "",
      startTime: "",
      endTime: "",
    });
    setBankQuestions([]);
    setSelectedQuestionIds([]);
    setClasses([]);
  };

  const handleSubmitScheduled = async () => {
    if (!form.startTime) {
      return toast.error("Vui lòng chọn thời gian bắt đầu (start time)");
    }

    if (!form.name.trim()) {
      return toast.error("Vui lòng nhập tên đề thi thử");
    }
    if (!form.duration || form.duration <= 0) {
      return toast.error("Thời gian làm bài phải lớn hơn 0");
    }
    if (!form.schoolId) {
      return toast.error("Vui lòng chọn trường áp dụng đề thi");
    }

    let gradeKey: string | null = null;
    let scope: "class" | "grade";

    // GIÁO VIÊN: BẮT BUỘC PHẢI GẮN VỚI LỚP MÌNH
    if (isTeacher) {
      if (!form.classroomId) {
        return toast.error("Giáo viên chỉ được tạo đề cho lớp mình giảng dạy. Vui lòng chọn lớp bạn phụ trách.");
      }
      scope = "class";
      gradeKey =
        getGradeKeyFromClassroom() ||
        (teacherGradeValue ? String(teacherGradeValue) : null);
    } else {
      if (form.classroomId) {
        scope = "class";
        gradeKey =
          getGradeKeyFromClassroom() || null;
      } else {
        const _gradeKey = getGradeKeyFromExamKey(examKey);
        if (!_gradeKey) {
          return toast.error(
            "Vui lòng chọn khối hợp lệ (Lớp 6–12, THPTQG) hoặc gắn đề với một lớp cụ thể."
          );
        }
        gradeKey = _gradeKey;
        scope = "grade";
      }
    }

    let finalQuestionIds = selectedQuestionIds;
    if (finalQuestionIds.length === 0) {
      finalQuestionIds = autoPickQuestionsBySkill();
      if (finalQuestionIds.length === 0) {
        return toast.error("Không tìm được câu hỏi phù hợp để tạo đề thi thử");
      }
    }

    const tokenLocal =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!tokenLocal) {
      toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        "https://english-backend-uoic.onrender.com/api/mock-exams",
        {
          name: form.name,
          examType: form.examType,
          description: form.description,
          duration: form.duration,
          level: form.level,
          grade: form.grade,
          skill: form.skill,
          tags: form.tags,
          totalQuestions: finalQuestionIds.length,
          slug: form.slug || undefined,
          questions: finalQuestionIds,
          schoolId: form.schoolId,
          classroomId: scope === "class" ? form.classroomId : undefined,
          scope,
          gradeKey: scope === "grade" ? gradeKey : undefined,
          startTime: form.startTime,
          endTime: form.endTime || undefined,
        },
        {
          headers: { Authorization: `Bearer ${tokenLocal}` },
        }
      );
      window.dispatchEvent(
        new CustomEvent("exam:created", { detail: { kind: "mock" as const } })
      );
      toast.success("Tạo đề thi thử và đặt lịch thi thành công");
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      console.error(
        "ERR CREATE SCHEDULED:",
        err?.response?.status,
        err?.response?.data
      );
      toast.error(
        err?.response?.data?.message ||
        "Lỗi khi tạo đề thi thử có lịch. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (val) {
          loadCurrentSchoolYear();
          if (isAdmin) {
            loadSchools();
          } else if (isSchoolManager && currentSchoolId) {
            setForm((prev) => ({ ...prev, schoolId: currentSchoolId }));
            loadClasses(currentSchoolId);
          } else if (isTeacher && currentSchoolId) {
            setForm((prev) => ({
              ...prev,
              schoolId: currentSchoolId,
              classroomId: "",
            }));
            loadClasses(currentSchoolId, { teacherOnly: true });
          }
          loadBankQuestions();
        } else {
          resetForm();
          setCurrentSchoolYear(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 rounded-2xl bg-card text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <PlusCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Thêm đề thi thử</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl rounded-3xl max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Thêm đề thi thử mới</DialogTitle>
          <DialogDescription className="text-xs">
            Đề do giáo viên tạo sẽ ở trạng thái <b>chờ duyệt</b> cho tới khi
            admin/phụ trách phê duyệt. Bạn có thể để hệ thống tạo đề tự động
            hoặc tự chọn câu hỏi.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 overflow-y-auto pr-1">
          {/* TRƯỜNG / LỚP */}
          <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-3">
            <p className="text-xs font-medium">
              Áp dụng đề thi thử cho Trường / Lớp cụ thể.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Trường */}
              <div className="space-y-2">
                <Label>Trường</Label>
                {isAdmin ? (
                  <Select
                    value={form.schoolId || ""}
                    onValueChange={(val) =>
                      setForm((prev) => ({ ...prev, schoolId: val }))
                    }
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
                ) : (
                  <Input
                    value={currentSchoolName || "Trường của bạn"}
                    disabled
                    className="bg-muted/60"
                  />
                )}
              </div>

              {/* Lớp */}
              <div className="space-y-2">
                <Label>Lớp</Label>
                {isTeacher ? (
                  <Select
                    value={form.classroomId || ""}
                    onValueChange={(val) =>
                      setForm((prev) => ({ ...prev, classroomId: val }))
                    }
                    disabled={loadingClasses || classes.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingClasses
                            ? "Đang tải lớp..."
                            : classes.length === 0
                              ? "Bạn chưa được gán lớp nào"
                              : "Chọn lớp bạn phụ trách"
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
                ) : (
                  <Select
                    value={form.classroomId || ""}
                    onValueChange={(val) =>
                      setForm((prev) => ({ ...prev, classroomId: val }))
                    }
                    disabled={
                      !form.schoolId || loadingClasses || isClassLockedByExamKey
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isClassLockedByExamKey
                            ? "Đang áp dụng cho cả khối (không chọn lớp riêng)"
                            : !form.schoolId
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
                {!isTeacher && (
                  <p className="text-[11px] text-muted-foreground">
                    Nếu chọn khối ở phần "Lớp / Kỳ thi" phía dưới, đề sẽ áp dụng
                    cho cả khối và mục Lớp sẽ bị khóa.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* NĂM HỌC */}
          <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-3">
            <p className="text-xs font-medium">
              Năm học áp dụng cho đề thi thử (đang dùng năm học hiện tại trong
              hệ thống).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Năm học hiện tại</Label>
                <Input
                  value={
                    loadingSchoolYear
                      ? "Đang tải năm học hiện tại..."
                      : currentSchoolYear?.name ||
                      "Chưa cấu hình năm học hiện tại"
                  }
                  disabled
                  className="bg-muted/60"
                />
                {currentSchoolYear?.startDate &&
                  currentSchoolYear?.endDate && (
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(
                        currentSchoolYear.startDate
                      ).toLocaleDateString("vi-VN")}{" "}
                      –{" "}
                      {new Date(
                        currentSchoolYear.endDate
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  )}
              </div>
            </div>
          </div>

          {/* LỊCH THI */}
          <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-3">
            <p className="text-xs font-medium">
              Lịch thi (tùy chọn). Nếu không chọn, đề sẽ làm được ngay sau khi
              được duyệt.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Thời gian mở đề (Start time)</Label>
                <Input
                  type="datetime-local"
                  value={form.startTime || ""}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Học sinh chỉ thấy đề sau thời điểm này.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Thời gian đóng đề (End time)</Label>
                <Input
                  type="datetime-local"
                  value={form.endTime || ""}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Có thể bỏ trống nếu không giới hạn thời gian đóng đề.
                </p>
              </div>
            </div>
          </div>

          {/* PHẦN 1: TẠO ĐỀ TỰ ĐỘNG */}
          <div className="space-y-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
            <p className="text-xs font-medium text-primary">
              Tạo đề tự động: Chọn lớp/kỳ thi, số câu và thời gian làm bài, hệ
              thống sẽ random câu hỏi đủ 4 kỹ năng.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="auto-name">Tên đề thi</Label>
                <Input
                  id="auto-name"
                  placeholder="VD: Đề thi thử Lớp 6 - HK1 - Lần 1"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto-grade">Lớp / Kỳ thi</Label>
                {isTeacher ? (
                  <Input
                    id="auto-grade"
                    value={teacherGradeLabel}
                    disabled
                    className="bg-muted/60"
                  />
                ) : (
                  <Select value={examKey} onValueChange={handleExamKeyChange}>
                    <SelectTrigger id="auto-grade">
                      <SelectValue placeholder="Chọn lớp hoặc kỳ thi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Không (chỉ theo lớp)
                      </SelectItem>
                      <SelectItem value="Lop6">Lớp 6</SelectItem>
                      <SelectItem value="Lop7">Lớp 7</SelectItem>
                      <SelectItem value="Lop8">Lớp 8</SelectItem>
                      <SelectItem value="Lop9">Lớp 9</SelectItem>
                      <SelectItem value="Lop10">Lớp 10</SelectItem>
                      <SelectItem value="Lop11">Lớp 11</SelectItem>
                      <SelectItem value="Lop12">Lớp 12</SelectItem>
                      <SelectItem value="thptqg">THPTQG</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[2fr_auto] gap-3 items-end">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Số câu muốn random</Label>
                  <Input
                    type="number"
                    min={4}
                    value={form.totalQuestions}
                    onChange={(e) =>
                      handleChange(
                        "totalQuestions",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Hệ thống sẽ cố gắng chia đều cho 4 kỹ năng.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Thời gian làm bài (phút)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.duration}
                    onChange={(e) =>
                      handleChange("duration", Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAutoGenerate}
                disabled={submitting}
                className="rounded-xl mt-1 md:mt-0"
              >
                {submitting ? "Đang tạo đề..." : "Tạo đề tự động"}
              </Button>
            </div>
          </div>

          {/* PHẦN 2: TẠO ĐỀ THỦ CÔNG */}
          <div className="space-y-3 rounded-xl border border-border/40 bg-muted/10 p-3">
            <p className="text-xs font-medium">
              Tạo đề thủ công: Chọn lớp/kỳ thi, tự chọn câu hỏi từ ngân hàng rồi
              bấm Lưu đề.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Lớp / Kỳ thi</Label>
                {isTeacher ? (
                  <Input
                    value={teacherGradeLabel}
                    disabled
                    className="bg-muted/60"
                  />
                ) : (
                  <Select value={examKey} onValueChange={handleExamKeyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn lớp hoặc kỳ thi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Không (chỉ theo lớp)
                      </SelectItem>
                      <SelectItem value="Lop6">Lớp 6</SelectItem>
                      <SelectItem value="Lop7">Lớp 7</SelectItem>
                      <SelectItem value="Lop8">Lớp 8</SelectItem>
                      <SelectItem value="Lop9">Lớp 9</SelectItem>
                      <SelectItem value="Lop10">Lớp 10</SelectItem>
                      <SelectItem value="Lop11">Lớp 11</SelectItem>
                      <SelectItem value="Lop12">Lớp 12</SelectItem>
                      <SelectItem value="thptqg">THPTQG</SelectItem>
                      <SelectItem value="ielts">IELTS</SelectItem>
                      <SelectItem value="toeic">TOEIC</SelectItem>
                      <SelectItem value="vstep">VSTEP</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Thời gian làm bài (phút)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration}
                  onChange={(e) =>
                    handleChange("duration", Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            {/* BANK QUESTION LIST */}
            <div className="space-y-2">
              <Label>Câu hỏi từ ngân hàng (tùy chọn)</Label>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                {loadingQuestions ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Đang tải câu hỏi...
                  </p>
                ) : bankQuestions.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={
                            bankQuestions.length > 0 &&
                            bankQuestions.every((q) =>
                              selectedQuestionIds.includes(q._id)
                            )
                          }
                          onChange={(e) => {
                            setSelectedQuestionIds(
                              e.target.checked
                                ? bankQuestions.map((q) => q._id)
                                : []
                            );
                          }}
                        />
                        <span className="font-medium text-sm">
                          Chọn tất cả (nếu không chọn, hệ thống sẽ random theo
                          ngân hàng này khi Lưu đề).
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Đã chọn {selectedQuestionIds.length}/
                        {bankQuestions.length} câu
                      </span>
                    </div>

                    <div className="space-y-1">
                      {bankQuestions.map((q) => (
                        <label
                          key={q._id}
                          className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition
                          ${selectedQuestionIds.includes(q._id)
                              ? "bg-indigo-50 border border-indigo-200"
                              : "hover:bg-gray-50"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedQuestionIds.includes(q._id)}
                            onChange={(e) => {
                              setSelectedQuestionIds((prev) =>
                                e.target.checked
                                  ? [...prev, q._id]
                                  : prev.filter((id) => id !== q._id)
                              );
                            }}
                          />
                          <span className="text-sm">
                            {q.content}
                            {q.skill && (
                              <span className="ml-1 text-[11px] text-muted-foreground">
                                ({q.skill})
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Chưa có câu hỏi nào trong ngân hàng cho lớp / kỳ thi này.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                disabled={submitting}
                className="rounded-xl"
              >
                Hủy
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl"
              >
                {submitting ? "Đang lưu..." : "Lưu đề (không đặt lịch)"}
              </Button>

              <Button
                onClick={handleSubmitScheduled}
                disabled={submitting}
                className="rounded-xl bg-primary text-primary-foreground"
                type="button"
              >
                {submitting ? "Đang lưu & đặt lịch..." : "Lưu & đặt lịch thi"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* =========== LIST + EDIT =========== */

type ExamQuestion = {
  _id: string;
  content: string;
  skill?: string;
  type?: string;
  grade?: string;
  level?: string;
  subQuestions?: any[];
};

type MockExamDetail = MockExam & {
  questions?: ExamQuestion[];
};

export default function AdminMockExams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState<
    MockExam["examType"] | "all"
  >("all");
  const [exams, setExams] = useState<MockExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedExam, setSelectedExam] =
    useState<MockExamDetail | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<MockExam | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadMockExams = async () => {
    try {
      setLoading(true);
      const tokenLocal = localStorage.getItem("token");
      if (!tokenLocal) {
        toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }

      const res = await axios.get("https://english-backend-uoic.onrender.com/api/mock-exams", {
        headers: { Authorization: `Bearer ${tokenLocal}` },
      });

      const list = res.data?.exams || res.data || [];
      console.log("mock exams FE ===>", list[0]);
      setExams(list);
    } catch (err: any) {
      console.error(
        "loadMockExams error:",
        err?.response?.status,
        err?.response?.data
      );
      const msg =
        err?.response?.data?.message || "Không thể tải danh sách đề thi thử";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id?: string) => {
    if (!id) return;

    const tokenLocal = localStorage.getItem("token");
    if (!tokenLocal) {
      toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
      return;
    }

    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setSelectedExam(null);

      const res = await axios.get(
        `https://english-backend-uoic.onrender.com/api/mock-exams/${id}`,
        {
          headers: { Authorization: `Bearer ${tokenLocal}` },
        }
      );

      const exam: MockExamDetail = res.data?.exam || res.data;
      setSelectedExam(exam);
    } catch (err: any) {
      console.error(
        "load exam detail error:",
        err?.response?.status,
        err?.response?.data
      );
      toast.error(
        err?.response?.data?.message || "Không thể tải chi tiết đề thi thử"
      );
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = (exam: MockExam) => {
    if (!exam._id) return;
    setEditingExam({
      ...exam,
      name: exam.name || "",
      duration: exam.duration || 60,
      level: exam.level || "mixed",
      grade: exam.grade || "",
      skill: exam.skill || "mixed",
      startTime: exam.startTime || "",
      endTime: exam.endTime || "",
      isActive: exam.isActive !== false,
      status: exam.status || "pending",
    });
    setEditOpen(true);
  };

  const handleChangeEdit = (field: keyof MockExam, value: any) => {
    setEditingExam((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const rawUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;
  const role = currentUser?.role;
  const canApprove = role === "admin" || role === "school_manager";

  const handleSaveEdit = async () => {
    if (!editingExam || !editingExam._id) return;

    if (!editingExam.name?.trim()) {
      return toast.error("Vui lòng nhập tên đề thi thử");
    }
    if (!editingExam.duration || editingExam.duration <= 0) {
      return toast.error("Thời gian làm bài phải lớn hơn 0");
    }

    const tokenLocal = localStorage.getItem("token");
    if (!tokenLocal) {
      toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
      return;
    }

    try {
      setEditSubmitting(true);

      await axios.put(
        `https://english-backend-uoic.onrender.com/api/mock-exams/${editingExam._id}`,
        {
          name: editingExam.name?.trim(),
          duration: editingExam.duration,
          level: editingExam.level,
          grade: editingExam.grade,
          skill: editingExam.skill,
          startTime: editingExam.startTime || undefined,
          endTime: editingExam.endTime || undefined,
          isActive: editingExam.isActive !== false,
          status: canApprove ? editingExam.status : undefined,
        },
        {
          headers: { Authorization: `Bearer ${tokenLocal}` },
        }
      );

      toast.success("Cập nhật đề thi thử thành công");
      setEditOpen(false);
      setEditingExam(null);
      loadMockExams();
    } catch (err: any) {
      console.error(
        "update mock-exam error:",
        err?.response?.status,
        err?.response?.data
      );
      toast.error(
        err?.response?.data?.message || "Lỗi khi cập nhật đề thi thử"
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedExam(null);
  };

  const getExamTypeDisplay = (exam: MockExam) => {
    if (exam.scope === "class") {
      return "-";
    }

    if (
      exam.gradeKey &&
      ["6", "7", "8", "9", "10", "11", "12"].includes(exam.gradeKey)
    ) {
      return `Lớp ${exam.gradeKey}`;
    }

    if (exam.gradeKey === "thptqg" || exam.grade === "thptqg") {
      return "THPTQG";
    }

    return examTypeLabel[exam.examType] || exam.examType;
  };

  useEffect(() => {
    loadMockExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredExams = exams.filter((exam) => {
    const search = searchTerm.toLowerCase();
    const schoolYearName =
      typeof exam.schoolYear === "object" && exam.schoolYear?.name
        ? exam.schoolYear.name.toLowerCase()
        : typeof exam.schoolYear === "string"
          ? exam.schoolYear.toLowerCase()
          : "";

    const matchesSearch =
      exam.name.toLowerCase().includes(search) ||
      (exam.grade && exam.grade.toLowerCase().includes(search)) ||
      examTypeLabel[exam.examType].toLowerCase().includes(search) ||
      schoolYearName.includes(search);

    const matchesType =
      examTypeFilter === "all" || exam.examType === examTypeFilter;

    return matchesSearch && matchesType;
  });

  const totalQuestions = exams.reduce(
    (sum, exam) => sum + (exam.totalQuestions || 0),
    0
  );

  const handleArchive = async (id?: string) => {
    if (!id) return;
    if (
      !confirm(
        "Bạn có chắc chắn muốn chuyển đề thi thử này vào kho lưu trữ?"
      )
    )
      return;

    const tokenLocal = localStorage.getItem("token");
    if (!tokenLocal) {
      toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
      return;
    }

    try {
      await axios.patch(
        `https://english-backend-uoic.onrender.com/api/mock-exams/${id}/archive`,
        null,
        {
          headers: { Authorization: `Bearer ${tokenLocal}` },
        }
      );
      toast.success("Đề thi thử đã được chuyển vào kho lưu trữ");
      loadMockExams();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "Chuyển đề thi thử vào kho lưu trữ thất bại";
      toast.error(msg);
    }
  };

  const renderScopeInfo = (exam: MockExam) => {
    if (!exam.scope) {
      if (exam.classroom?.name || exam.school?.name) {
        return [
          exam.school?.name && `Trường ${exam.school.name}`,
          exam.classroom?.name && `Lớp ${exam.classroom.name}`,
        ]
          .filter(Boolean)
          .join(" · ");
      }
      return "Chưa gắn trường / lớp";
    }

    if (exam.scope === "class") {
      const schoolName = exam.school?.name
        ? `Trường ${exam.school.name}`
        : "Trường ?";
      const className = exam.classroom?.name
        ? `Lớp ${exam.classroom.name}`
        : "Lớp ?";
      return `${schoolName} · ${className}`;
    }

    const schoolName = exam.school?.name
      ? `Trường ${exam.school.name}`
      : "Trường ?";
    const gradeLabel =
      exam.gradeKey &&
        ["6", "7", "8", "9", "10", "11", "12"].includes(exam.gradeKey)
        ? `Khối ${exam.gradeKey}`
        : exam.grade || exam.gradeKey || "Khối ?";
    return `${schoolName} · ${gradeLabel} (cả khối)`;
  };

  const getLevelBadge = (level?: string) => {
    if (!level) {
      return (
        <Badge className="bg-slate-50 text-slate-700 border border-slate-200">
          Không rõ
        </Badge>
      );
    }

    return (
      <Badge
        className={
          levelBadgeClass[level] ||
          "bg-slate-50 text-slate-700 border border-slate-200"
        }
      >
        {levelLabel[level] || level}
      </Badge>
    );
  };

  const getApproveStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <Badge className="bg-slate-50 text-slate-700 border border-slate-200">
          Không rõ
        </Badge>
      );
    }

    if (status === "pending") {
      return (
        <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
          Chờ duyệt
        </Badge>
      );
    }

    if (status === "approved") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
          Đã duyệt
        </Badge>
      );
    }

    if (status === "rejected") {
      return (
        <Badge className="bg-rose-50 text-rose-700 border border-rose-200">
          Bị từ chối
        </Badge>
      );
    }

    return (
      <Badge className="bg-slate-50 text-slate-700 border border-slate-200">
        {status}
      </Badge>
    );
  };

  const renderSchoolYearName = (exam: MockExam) => {
    if (!exam.schoolYear) return "-";
    if (typeof exam.schoolYear === "string") {
      return exam.schoolYear || "-";
    }
    return exam.schoolYear.name || "-";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 animate-fade-in">
        <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">
          Đang tải danh sách đề thi thử...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      {/* HEADER + ACTIONS */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Mock test paper management
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
              Quản lý đề thi thử
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
              Thêm, quản lý các đề thi thử cho các kỳ thi như THPTQG, IELTS,
              TOEIC, VSTEP... Học viên có thể làm thử giống cấu trúc đề thật.
            </p>
          </div>

          {/* ... bên trong header actions ... */}
          <div className="flex flex-wrap gap-3 justify-end">
            <AddMockExamDialog
              onSuccess={loadMockExams}
              currentUser={currentUser}
            />


          </div>

        </div>

        {/* MINI STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Tổng đề thi thử
              </span>
              <span className="text-xl font-semibold text-foreground">
                {exams.length}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {filteredExams.length !== exams.length &&
                  `${filteredExams.length} đang hiển thị`}
              </span>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Tổng số câu dự kiến
              </span>
              <span className="text-xl font-semibold text-foreground">
                {totalQuestions}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Trung bình{" "}
                {exams.length > 0
                  ? Math.round((totalQuestions / exams.length) * 10) / 10
                  : 0}{" "}
                câu / đề
              </span>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Kỳ thi (cố định)
              </span>
              <span className="text-sm text-foreground">
                <span className="font-semibold">
                  {exams.filter((e) => e.examType === "thptqg").length}
                </span>{" "}
                THPTQG ·{" "}
                <span className="font-semibold">
                  {exams.filter((e) => e.examType === "ielts").length}
                </span>{" "}
                IELTS ·{" "}
                <span className="font-semibold">
                  {exams.filter((e) => e.examType === "toeic").length}
                </span>{" "}
                TOEIC
              </span>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all animate-slide-in">
            <CardContent className="py-3.5 px-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Trạng thái hiển thị
              </span>
              <span className="text-sm text-foreground">
                <span className="font-semibold">
                  {exams.filter((e) => e.isActive !== false).length}
                </span>{" "}
                đang mở ·{" "}
                <span className="font-semibold">
                  {exams.filter((e) => e.isActive === false).length}
                </span>{" "}
                tạm ẩn
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* TABLE */}
      <Card className="shadow-sm border border-border/80 rounded-3xl bg-card/95 backdrop-blur animate-slide-in">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base md:text-lg font-semibold text-foreground">
                Danh sách đề thi thử
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Tìm kiếm, lọc theo kỳ thi và thao tác trên từng đề thi thử.
              </CardDescription>
            </div>

            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm theo tên đề, lớp, kỳ thi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-background/80 focus-visible:ring-1 focus-visible:ring-primary/70"
                />
              </div>

              <Select
                value={examTypeFilter}
                onValueChange={(val) =>
                  setExamTypeFilter(val as MockExam["examType"] | "all")
                }
              >
                <SelectTrigger className="md:w-40 h-10 rounded-xl bg-background/80">
                  <SelectValue placeholder="Kỳ thi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="thptqg">THPTQG</SelectItem>
                  <SelectItem value="ielts">IELTS</SelectItem>
                  <SelectItem value="toeic">TOEIC</SelectItem>
                  <SelectItem value="vstep">VSTEP</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="rounded-2xl overflow-hidden border border-border/70 bg-background/60">
            <Table>
              <TableHeader className="bg-muted/60 backdrop-blur">
                <TableRow className="border-border/60">
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Đề thi
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Kỳ thi
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Áp dụng cho
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Mức độ
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Thời gian
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Năm học
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Số câu dự kiến
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Trạng thái duyệt
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Hiển thị
                  </TableHead>
                  <TableHead className="text-right font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredExams.length > 0 ? (
                  filteredExams.map((exam, idx) => (
                    <TableRow
                      key={exam._id || exam.slug || idx}
                      className="hover:bg-primary/5 transition-all cursor-pointer group"
                      style={{ animationDelay: `${idx * 35}ms` }}
                      onClick={() => handleOpenDetail(exam._id)}
                    >
                      <TableCell className="font-medium text-sm text-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span className="line-clamp-1 group-hover:text-primary transition-colors">
                            {exam.name}
                          </span>
                          {exam.grade && (
                            <span className="text-[11px] text-muted-foreground">
                              Lớp / band: {exam.grade}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px]">
                          <Globe2 className="h-3 w-3" />
                          {getExamTypeDisplay(exam)}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground max-w-[220px]">
                        {renderScopeInfo(exam)}
                      </TableCell>

                      <TableCell className="text-sm">
                        {getLevelBadge(exam.level)}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {exam.duration} phút
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {renderSchoolYearName(exam)}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {exam.totalQuestions ?? 0}
                      </TableCell>

                      <TableCell className="text-sm">
                        {getApproveStatusBadge(exam.status)}
                      </TableCell>

                      <TableCell className="text-sm">
                        <Badge
                          className={
                            exam.isActive !== false
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }
                        >
                          {exam.isActive !== false ? "Đang mở" : "Tạm ẩn"}
                        </Badge>
                      </TableCell>

                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted/80"
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="border border-border/70 rounded-xl bg-card/95 backdrop-blur shadow-lg"
                          >
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleOpenDetail(exam._id)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleOpenEdit(exam)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={() => handleArchive(exam._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Chuyển vào
                              lưu trữ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      Chưa có đề thi thử nào phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* DETAIL DIALOG */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => !open && handleCloseDetail()}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedExam?.name || "Chi tiết đề thi thử"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thông tin chi tiết đề thi thử, phạm vi áp dụng và danh sách câu
              hỏi.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Đang tải chi tiết đề thi thử...
              </p>
            </div>
          ) : !selectedExam ? (
            <p className="text-sm text-muted-foreground py-4">
              Không có dữ liệu đề thi.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Kỳ thi
                  </p>
                  <p className="text-sm">
                    {getExamTypeDisplay(selectedExam)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Mức độ
                  </p>
                  <div>{getLevelBadge(selectedExam.level)}</div>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Thời gian
                  </p>
                  <p className="text-sm flex items-center gap-1">
                    <Timer className="h-3 w-3" /> {selectedExam.duration} phút
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Năm học
                  </p>
                  <p className="text-sm">
                    {renderSchoolYearName(selectedExam)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Áp dụng cho
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {renderScopeInfo(selectedExam)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Trạng thái
                  </p>
                  <div>{getApproveStatusBadge(selectedExam.status)}</div>
                </div>
              </div>

              {selectedExam.description && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Mô tả
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedExam.description}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Danh sách câu hỏi ({selectedExam.questions?.length || 0})
                </p>
                {selectedExam.questions && selectedExam.questions.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border rounded-xl p-3 bg-muted/40 space-y-2">
                    {selectedExam.questions.map((q, index) => (
                      <div
                        key={q._id || index}
                        className="text-sm border-b last:border-b-0 border-border/40 pb-2 last:pb-0"
                      >
                        <p className="font-medium">
                          Câu {index + 1}:{" "}
                          <span className="font-normal">{q.content}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Kỹ năng: {q.skill || "Không rõ"} · Loại:{" "}
                          {q.type || "Không rõ"} · Lớp: {q.grade || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Đề thi chưa có câu hỏi hoặc bạn không có quyền xem danh
                    sách câu hỏi.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditOpen(false);
            setEditingExam(null);
          }
        }}
      >
        <DialogContent className="max-w-xl rounded-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa đề thi thử</DialogTitle>
            <DialogDescription className="text-xs">
              Cập nhật thông tin đề thi thử, thời gian, mức độ và trạng thái
              hiển thị.
            </DialogDescription>
          </DialogHeader>

          {!editingExam ? (
            <p className="text-sm text-muted-foreground py-4">
              Không có dữ liệu đề thi để chỉnh sửa.
            </p>
          ) : (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tên đề thi</Label>
                  <Input
                    value={editingExam.name || ""}
                    onChange={(e) => handleChangeEdit("name", e.target.value)}
                    placeholder="Nhập tên đề thi"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Thời gian (phút)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingExam.duration || 60}
                    onChange={(e) =>
                      handleChangeEdit(
                        "duration",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mức độ</Label>
                  <Select
                    value={editingExam.level || "mixed"}
                    onValueChange={(val) => handleChangeEdit("level", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Dễ</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="hard">Khó</SelectItem>
                      <SelectItem value="mixed">Nhiều mức độ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lớp / band (hiển thị)</Label>
                  <Input
                    value={editingExam.grade || ""}
                    onChange={(e) =>
                      handleChangeEdit("grade", e.target.value)
                    }
                    placeholder="VD: Lớp 12, THPTQG, IELTS 6.0+..."
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-3">
                <p className="text-[11px] font-medium">
                  Lịch thi (tùy chọn). Nếu để trống, đề có thể làm sau khi được
                  duyệt.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="space-y-2">
                    <Label>Thời gian mở đề (Start time)</Label>
                    <Input
                      type="datetime-local"
                      value={editingExam.startTime || ""}
                      onChange={(e) =>
                        handleChangeEdit("startTime", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thời gian đóng đề (End time)</Label>
                    <Input
                      type="datetime-local"
                      value={editingExam.endTime || ""}
                      onChange={(e) =>
                        handleChangeEdit("endTime", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Hiển thị</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingExam.isActive !== false}
                      onChange={(e) =>
                        handleChangeEdit("isActive", e.target.checked)
                      }
                    />
                    <span className="text-sm">
                      {editingExam.isActive !== false
                        ? "Đề đang mở cho học sinh"
                        : "Đề đang tạm ẩn"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Trạng thái duyệt</Label>
                  {canApprove ? (
                    <Select
                      value={editingExam.status || "pending"}
                      onValueChange={(val) =>
                        handleChangeEdit("status", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ duyệt</SelectItem>
                        <SelectItem value="approved">Đã duyệt</SelectItem>
                        <SelectItem value="rejected">Bị từ chối</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>{getApproveStatusBadge(editingExam.status)}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={editingExam.description || ""}
                  onChange={(e) =>
                    handleChangeEdit("description", e.target.value)
                  }
                  rows={3}
                  placeholder="Ghi chú thêm về cấu trúc, nội dung đề thi..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setEditingExam(null);
                  }}
                  disabled={editSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  className="rounded-xl"
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={editSubmitting}
                >
                  {editSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
