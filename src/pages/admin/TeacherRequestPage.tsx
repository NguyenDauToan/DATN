"use client";

import { useEffect, useState } from "react";
import api from "@/api/Api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    FileText,
    UploadCloud,
    CheckCircle2,
    XCircle,
    Clock3,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/data/AuthContext";
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://english-backend-uoic.onrender.com";

type Attachment = {
    fileName: string;
    url: string;
    mimeType?: string;
    size?: number;
};

type SimpleUser = { _id: string; name: string; email?: string };
type SimpleStudent = { _id: string; name: string; email?: string };

type SimpleClassroom = {
    _id: string;
    name: string;
    grade?: string;
    students?: SimpleStudent[]; // backend trả kèm nếu includeStudents=true
};

type TeacherRequest = {
    _id: string;
    title: string;
    type: "change_student_class" | "general" | "other" | string;
    description?: string;
    status: "pending" | "approved" | "rejected" | string;
    student?: SimpleUser;
    fromClassroom?: SimpleClassroom;
    toClassroom?: SimpleClassroom;
    attachments?: Attachment[];
    handledNote?: string;
    createdAt: string;
    updatedAt: string;
    teacher?: SimpleUser;
};

const TYPE_LABEL: Record<string, string> = {
    change_student_class: "Đổi lớp cho học sinh",
    general: "Góp ý / đề xuất chung",
    other: "Khác",
};

const STATUS_CONFIG: Record<
    string,
    { label: string; className: string; icon: React.ComponentType<any> }
> = {
    pending: {
        label: "Chờ xử lý",
        className: "border-amber-200 bg-amber-50 text-amber-700",
        icon: Clock3,
    },
    approved: {
        label: "Đã chấp nhận",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: CheckCircle2,
    },
    rejected: {
        label: "Từ chối",
        className: "border-rose-200 bg-rose-50 text-rose-700",
        icon: XCircle,
    },
    cancelled: {
        label: "Đã thu hồi",
        className: "border-slate-200 bg-slate-50 text-slate-700",
        icon: XCircle,
    },
};

export default function TeacherRequestPage() {
    const { user } = useAuth();
    const role = user?.role as
        | "admin"
        | "school_manager"
        | "teacher"
        | "student"
        | undefined;

    const isTeacher = role === "teacher";
    const isManager = role === "school_manager" || role === "admin";

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [requests, setRequests] = useState<TeacherRequest[]>([]);

    const [title, setTitle] = useState("");
    const [type, setType] =
        useState<"change_student_class" | "general" | "other">("general");
    const [description, setDescription] = useState("");

    const [studentId, setStudentId] = useState("");
    const [fromClassroomId, setFromClassroomId] = useState("");
    const [toClassroomId, setToClassroomId] = useState("");
    const [files, setFiles] = useState<FileList | null>(null);

    const [classrooms, setClassrooms] = useState<SimpleClassroom[]>([]);
    const [allStudents, setAllStudents] = useState<SimpleStudent[]>([]);
    const [studentClassMap, setStudentClassMap] = useState<
        Record<string, { classroomId: string; classroomName: string; grade?: string }>
    >({});

    const [loadingClasses, setLoadingClasses] = useState(false);

    const loadClassrooms = async () => {
        try {
            setLoadingClasses(true);
            // yêu cầu backend trả kèm students
            const res = await api.get("/admin/classrooms", {
                params: { includeStudents: true },
            });

            const clsList: SimpleClassroom[] = res.data?.classrooms || [];
            setClassrooms(clsList);

            const map: Record<
                string,
                { classroomId: string; classroomName: string; grade?: string }
            > = {};
            const studentArr: SimpleStudent[] = [];

            clsList.forEach((cls) => {
                (cls.students || []).forEach((st) => {
                    // nếu một học sinh thuộc nhiều lớp, ưu tiên lớp gặp đầu tiên
                    if (!map[st._id]) {
                        map[st._id] = {
                            classroomId: cls._id,
                            classroomName: cls.name,
                            grade: cls.grade,
                        };
                        studentArr.push(st);
                    }
                });
            });

            setStudentClassMap(map);
            setAllStudents(studentArr);
        } catch (err) {
            console.error(err);
            toast.error("Không thể tải danh sách lớp / học sinh.");
        } finally {
            setLoadingClasses(false);
        }
    };

    const loadRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get("/teacher-requests");
            setRequests(res.data || []);
        } catch {
            toast.error("Không thể tải danh sách yêu cầu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
        if (isTeacher) {
            loadClassrooms();
        }
    }, []);

    // khi chọn học sinh -> tự set lớp hiện tại
    const handleChangeStudent = (id: string) => {
        setStudentId(id);

        const info = studentClassMap[id];
        if (info) {
            setFromClassroomId(info.classroomId);
        } else {
            setFromClassroomId("");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFiles(e.target.files);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            return toast.error("Vui lòng nhập tiêu đề yêu cầu.");
        }

        if (type === "change_student_class") {
            if (!studentId) {
                return toast.error("Vui lòng chọn học sinh.");
            }
            if (!fromClassroomId) {
                return toast.error(
                    "Không xác định được lớp hiện tại của học sinh. Vui lòng kiểm tra lại."
                );
            }
            if (!toClassroomId) {
                return toast.error("Vui lòng chọn lớp đề xuất.");
            }
            if (fromClassroomId === toClassroomId) {
                return toast.error("Lớp đề xuất phải khác lớp hiện tại.");
            }
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("type", type);

            if (description.trim())
                formData.append("description", description.trim());
            if (studentId.trim()) formData.append("studentId", studentId.trim());
            if (fromClassroomId.trim())
                formData.append("fromClassroomId", fromClassroomId.trim());
            if (toClassroomId.trim())
                formData.append("toClassroomId", toClassroomId.trim());

            if (files && files.length > 0) {
                Array.from(files).forEach((file) => {
                    formData.append("files", file);
                });
            }

            await api.post("/teacher-requests", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Đã gửi yêu cầu tới Ban giám hiệu.");
            setTitle("");
            setDescription("");
            setStudentId("");
            setFromClassroomId("");
            setToClassroomId("");
            setFiles(null);

            const input = document.getElementById(
                "teacher-request-files"
            ) as HTMLInputElement | null;
            if (input) input.value = "";

            loadRequests();
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                "Lỗi khi gửi yêu cầu. Vui lòng thử lại.";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecallRequest = async (req: TeacherRequest) => {
        const ok = window.confirm(
            "Bạn có chắc muốn thu hồi yêu cầu này? Sau khi thu hồi, Ban giám hiệu sẽ không xử lý nữa."
        );
        if (!ok) return;

        try {
            await api.patch(`/teacher-requests/${req._id}/cancel`, {});
            toast.success("Đã thu hồi yêu cầu.");
            loadRequests();
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                "Lỗi khi thu hồi yêu cầu. Vui lòng thử lại.";
            toast.error(msg);
        }
    };

    const renderStatusBadge = (status: string) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["pending"];
        const Icon = cfg.icon;
        return (
            <Badge
                variant="outline"
                className={`flex items-center gap-1.5 border px-2 py-0.5 text-[11px] ${cfg.className}`}
            >
                <Icon className="h-3 w-3" />
                {cfg.label}
            </Badge>
        );
    };

    const handleUpdateStatus = async (
        req: TeacherRequest,
        status: "approved" | "rejected"
    ) => {
        try {
            const defaultNote =
                status === "approved" ? "Đã chấp nhận yêu cầu." : "Từ chối yêu cầu.";
            const note = window.prompt(
                "Nhập ghi chú cho giáo viên (có thể để trống):",
                defaultNote
            );

            await api.patch(`/teacher-requests/${req._id}/status`, {
                status,
                handledNote: note ?? "",
            });

            toast.success("Cập nhật trạng thái yêu cầu thành công.");
            loadRequests();
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                "Lỗi khi cập nhật trạng thái yêu cầu.";
            toast.error(msg);
        }
    };

    const currentClassInfo =
        studentId && studentClassMap[studentId]
            ? studentClassMap[studentId]
            : undefined;

    return (
        <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-sky-50/60 via-background to-background py-6">
            <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4">
                {/* Header */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            <FileText className="h-6 w-6 text-primary" />
                            {isTeacher ? "Yêu cầu gửi Ban giám hiệu" : "Yêu cầu từ giáo viên"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isTeacher
                                ? "Giáo viên gửi đề xuất, kiến nghị, hoặc yêu cầu đổi lớp cho học sinh kèm file Word/PDF (nếu có)."
                                : "Xem và xử lý các yêu cầu được gửi từ giáo viên trong trường."}
                        </p>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-xs">
                        {isTeacher ? "Tổng số yêu cầu đã gửi" : "Tổng số yêu cầu nhận"}:{" "}
                        {requests.length}
                    </Badge>
                </div>

                {/* Content */}
                <div
                    className={
                        isTeacher
                            ? "grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]"
                            : "grid gap-4 md:grid-cols-1"
                    }
                >
                    {/* Form: chỉ giáo viên mới thấy */}
                    {isTeacher && (
                        <Card className="border border-border/70 bg-card/95 backdrop-blur-sm shadow-sm rounded-3xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">
                                    Tạo yêu cầu mới
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Điền nội dung yêu cầu và đính kèm file Word/PDF nếu cần trình
                                    bày chi tiết.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">
                                            Tiêu đề yêu cầu{" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            placeholder="VD: Đề xuất đổi lớp cho học sinh Nguyễn Văn A"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="h-9 rounded-2xl text-sm"
                                        />
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-foreground">
                                                Loại yêu cầu
                                            </label>
                                            <select
                                                className="h-9 w-full rounded-2xl border border-border bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                                                value={type}
                                                onChange={(e) =>
                                                    setType(
                                                        e.target.value as
                                                        | "change_student_class"
                                                        | "general"
                                                        | "other"
                                                    )
                                                }
                                            >
                                                <option value="general">Góp ý / đề xuất chung</option>
                                                <option value="change_student_class">
                                                    Đổi lớp cho học sinh
                                                </option>
                                                <option value="other">Khác</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-foreground">
                                                Học sinh
                                            </label>
                                            <select
                                                className="h-9 w-full rounded-2xl border border-border bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                                                value={studentId}
                                                onChange={(e) => handleChangeStudent(e.target.value)}
                                                disabled={loadingClasses || allStudents.length === 0}
                                            >
                                                <option value="">
                                                    {loadingClasses
                                                        ? "Đang tải danh sách học sinh..."
                                                        : "Chọn học sinh"}
                                                </option>
                                                {allStudents.map((st) => (
                                                    <option key={st._id} value={st._id}>
                                                        {st.name} {st.email ? `(${st.email})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {type === "change_student_class" && (
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-foreground">
                                                    Lớp hiện tại
                                                </label>
                                                <Input
                                                    className="h-9 rounded-2xl text-xs bg-muted/60"
                                                    value={
                                                        currentClassInfo
                                                            ? `${currentClassInfo.classroomName}${currentClassInfo.grade
                                                                ? ` - Khối ${currentClassInfo.grade}`
                                                                : ""
                                                            }`
                                                            : studentId
                                                                ? "Học sinh chưa được gán lớp"
                                                                : "Chưa chọn học sinh"
                                                    }
                                                    readOnly
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-foreground">
                                                    Lớp đề xuất
                                                </label>
                                                <select
                                                    className="h-9 w-full rounded-2xl border border-border bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                                                    value={toClassroomId}
                                                    onChange={(e) => setToClassroomId(e.target.value)}
                                                    disabled={loadingClasses}
                                                >
                                                    <option value="">
                                                        {loadingClasses
                                                            ? "Đang tải danh sách lớp..."
                                                            : "Chọn lớp đề xuất"}
                                                    </option>
                                                    {classrooms.map((cls) => (
                                                        <option key={cls._id} value={cls._id}>
                                                            {cls.name}{" "}
                                                            {cls.grade ? `- Khối ${cls.grade}` : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">
                                            Nội dung chi tiết
                                        </label>
                                        <Textarea
                                            placeholder="Mô tả rõ lý do, hoàn cảnh, và đề xuất xử lý..."
                                            rows={4}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="resize-none rounded-2xl text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">
                                            Đính kèm file (Word / PDF)
                                        </label>
                                        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/40 px-3 py-2.5 text-xs">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <UploadCloud className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                        Chấp nhận tối đa 5 file, định dạng .doc, .docx,
                                                        .pdf
                                                    </span>
                                                </div>
                                                <label
                                                    htmlFor="teacher-request-files"
                                                    className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
                                                >
                                                    Chọn file
                                                </label>
                                            </div>
                                            <input
                                                id="teacher-request-files"
                                                type="file"
                                                multiple
                                                accept=".pdf,.doc,.docx"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                            {files && files.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Array.from(files).map((f) => (
                                                        <Badge
                                                            key={f.name + f.size}
                                                            variant="outline"
                                                            className="flex items-center gap-1 rounded-2xl border-indigo-100 bg-indigo-50/70 text-[11px] text-indigo-700"
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                            <span className="max-w-[140px] truncate">
                                                                {f.name}
                                                            </span>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className="rounded-2xl px-5"
                                        >
                                            {submitting && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Gửi yêu cầu
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* List: dùng chung cho cả GV & school_manager/admin */}
                    <Card className="border border-border/70 bg-card/95 backdrop-blur-sm shadow-sm rounded-3xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">
                                {isTeacher ? "Yêu cầu đã gửi" : "Danh sách yêu cầu"}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {isTeacher
                                    ? "Theo dõi trạng thái xử lý yêu cầu từ Ban giám hiệu / Ban quản lý."
                                    : "Xem chi tiết và duyệt / từ chối các yêu cầu do giáo viên gửi."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? (
                                <div className="flex h-40 items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                        <p className="text-xs text-muted-foreground">
                                            Đang tải danh sách yêu cầu...
                                        </p>
                                    </div>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                                    <FileText className="h-7 w-7 text-muted-foreground/80" />
                                    <p>Chưa có yêu cầu nào.</p>
                                </div>
                            ) : (
                                <div className="flex max-h-[480px] flex-col gap-2 overflow-y-auto pr-1">
                                    {requests.map((req) => {
                                        const TypeLabel = TYPE_LABEL[req.type] || "Khác";

                                        return (
                                            <div
                                                key={req._id}
                                                className="group rounded-2xl border border-border/70 bg-background/80 px-3 py-2.5 text-xs transition-all hover:border-primary/40 hover:shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="space-y-[2px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="line-clamp-1 text-[13px] font-semibold text-foreground">
                                                                {req.title}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                                            <Badge
                                                                variant="outline"
                                                                className="border-sky-200 bg-sky-50/70 text-[10px] font-medium text-sky-700"
                                                            >
                                                                {TypeLabel}
                                                            </Badge>
                                                            {renderStatusBadge(req.status)}
                                                            <span>
                                                                Gửi lúc{" "}
                                                                {new Date(
                                                                    req.createdAt
                                                                ).toLocaleString("vi-VN", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </span>
                                                        </div>

                                                        {isManager && req.teacher && (
                                                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                                Giáo viên:{" "}
                                                                <span className="font-medium text-foreground">
                                                                    {req.teacher.name}
                                                                </span>{" "}
                                                                {req.teacher.email && (
                                                                    <span className="text-xs">
                                                                        ({req.teacher.email})
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {isTeacher && req.status === "pending" && (
                                                        <div className="flex flex-col gap-1">
                                                            <Button
                                                                variant="outline"
                                                                className="h-7 rounded-2xl px-2 text-[11px] text-slate-700 border-slate-200 hover:bg-slate-50"
                                                                onClick={() => handleRecallRequest(req)}
                                                            >
                                                                <XCircle className="mr-1 h-3 w-3" />
                                                                Thu hồi
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {isManager && req.status === "pending" && (
                                                        <div className="flex flex-col gap-1">
                                                            <Button
                                                                className="h-7 rounded-2xl px-2 text-[11px]"
                                                                onClick={() =>
                                                                    handleUpdateStatus(req, "approved")
                                                                }
                                                            >
                                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                Chấp nhận
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                className="h-7 rounded-2xl px-2 text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50"
                                                                onClick={() =>
                                                                    handleUpdateStatus(req, "rejected")
                                                                }
                                                            >
                                                                <XCircle className="mr-1 h-3 w-3" />
                                                                Từ chối
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                {req.description && (
                                                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                                                        {req.description}
                                                    </p>
                                                )}

                                                {req.type === "change_student_class" && (
                                                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                                        {req.student && (
                                                            <span>
                                                                Học sinh:{" "}
                                                                <span className="font-medium text-foreground">
                                                                    {req.student.name}
                                                                </span>
                                                            </span>
                                                        )}
                                                        {req.fromClassroom && (
                                                            <span>
                                                                Từ lớp:{" "}
                                                                <span className="font-medium text-foreground">
                                                                    {req.fromClassroom.name}
                                                                </span>
                                                            </span>
                                                        )}
                                                        {req.toClassroom && (
                                                            <span>
                                                                Sang lớp:{" "}
                                                                <span className="font-medium text-foreground">
                                                                    {req.toClassroom.name}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {req.attachments && req.attachments.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {req.attachments.map((att, idx) => {
                                                            const fileUrl = `${API_BASE_URL}${att.url}`; // GHÉP BASE + PATH TỪ DB

                                                            return (
                                                                <a
                                                                    key={att.url + idx}
                                                                    href={fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100"
                                                                    download // nếu muốn browser tự tải xuống
                                                                >
                                                                    <FileText className="h-3 w-3" />
                                                                    <span className="max-w-[120px] truncate">
                                                                        {att.fileName}
                                                                    </span>
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}


                                                {req.handledNote && (
                                                    <p className="mt-1 text-[11px] text-emerald-700">
                                                        Ghi chú từ Ban giám hiệu: {req.handledNote}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
