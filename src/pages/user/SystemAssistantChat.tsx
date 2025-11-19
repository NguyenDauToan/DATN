// src/components/SystemAssistantChat.tsx
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Bot, X } from "lucide-react";
import api from "@/api/Api";
import { toast } from "sonner";

type ChatMsg = {
    id: string;
    from: "user" | "bot";
    text: string;
    createdAt: string;
};

export default function SystemAssistantChat() {
    const [open, setOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [loading, setLoading] = useState(false);
    const [teacherChatOpen, setTeacherChatOpen] = useState(false); // 👈 thêm

    const chatEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 60);
    };
    useEffect(() => {
        const handler = (e: Event) => {
            const custom = e as CustomEvent<boolean>;
            const isOpen = !!custom.detail;
            setTeacherChatOpen(isOpen);

            // nếu giáo viên đang mở chat thì đóng trợ lý luôn
            if (isOpen) {
                setOpen(false);
                setIsClosing(false);
            }
        };

        window.addEventListener("teacher-chat-open", handler);
        return () => window.removeEventListener("teacher-chat-open", handler);
    }, []);
    useEffect(() => {
        if (open) scrollToBottom();
    }, [open, messages.length]);
    useEffect(() => {
        window.dispatchEvent(
          new CustomEvent("assistant-chat-open", { detail: open })
        );
      }, [open]);
    const handleOpen = () => {
        setIsClosing(false);
        setOpen(true);
    };

    const handleCloseClick = () => {
        setIsClosing(true);
    };

    const handleCardAnimationEnd = () => {
        if (isClosing) {
            setOpen(false);
            setIsClosing(false);
        }
    };

    const handleOverlayClick = () => {
        // click ra ngoài -> đóng
        setIsClosing(true);
    };

    const handleSend = async () => {
        const text = message.trim();
        if (!text) {
            toast.error("Vui lòng nhập nội dung.");
            return;
        }

        // Chặn sơ bộ những câu hỏi xin đáp án ở FE (backend vẫn kiểm tra lại)
        const lower = text.toLowerCase();
        if (
            lower.includes("đáp án") ||
            lower.includes("chọn đáp án") ||
            /câu\s*\d+\s*(là gì|đáp án|chọn)/i.test(lower)
        ) {
            toast.info(
                "Trợ lý hệ thống không cung cấp đáp án trực tiếp cho câu hỏi trong đề thi."
            );
            return;
        }

        try {
            setLoading(true);

            const userMsg: ChatMsg = {
                id: Date.now().toString(),
                from: "user",
                text,
                createdAt: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, userMsg]);
            setMessage("");
            scrollToBottom();

            const res = await api.post("/chat/support", { message: text });
            const replyText: string =
                res.data?.reply ||
                "Hiện tại mình chưa thể trả lời câu hỏi này. Bạn có thể hỏi lại theo cách khác nhé.";

            const botMsg: ChatMsg = {
                id: Date.now().toString() + "_bot",
                from: "bot",
                text: replyText,
                createdAt: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, botMsg]);
            scrollToBottom();
        } catch (err) {
            console.error(err);
            toast.error("Đã xảy ra lỗi khi gửi tin nhắn, thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (iso?: string) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <>
            {/* Nút nổi mở chat */}
            {!open && !teacherChatOpen && (
                <button
                    onClick={handleOpen}
                    className="fixed bottom-20 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-sky-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
                >
                    <Bot className="h-5 w-5" />
                    <span>Trợ lý hệ thống</span>
                </button>
            )}


            {/* Popup chat trợ lý hệ thống */}
            {open && (
                <div
                    className={`fixed inset-0 z-40 flex items-end justify-end bg-black/25 backdrop-blur-sm p-4 ${isClosing ? "animate-chat-overlay-out" : "animate-chat-overlay-in"
                        }`}
                    onClick={handleOverlayClick}
                >
                    <Card
                        className={`relative flex h-[520px] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-white to-slate-50 shadow-2xl ${isClosing ? "animate-chat-out" : "animate-chat-in"
                            }`}
                        onAnimationEnd={handleCardAnimationEnd}
                        onClick={(e) => e.stopPropagation()} // chặn click bên trong bubble làm đóng
                    >
                        {/* Close */}
                        <button
                            onClick={handleCloseClick}
                            className="absolute right-3 top-3 rounded-full bg-white/70 p-1 text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-800"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-sky-500/95 to-indigo-500/95 px-4 py-3 text-white">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 shadow-sm">
                                <MessageCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">
                                    Trợ lý hệ thống luyện thi
                                </h3>
                                <p className="text-[11px] text-sky-100/90">
                                    Chỉ trả lời câu hỏi về cách dùng hệ thống, không cung cấp đáp
                                    án đề thi.
                                </p>
                            </div>
                        </div>

                        {/* Chat area */}
                        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/80 px-3 py-4">
                            {messages.length === 0 && (
                                <p className="mt-20 text-center text-sm text-gray-500">
                                    💬 Hãy đặt câu hỏi về hệ thống luyện thi tiếng Anh THPT của
                                    bạn.
                                </p>
                            )}

                            {messages.map((m) => (
                                <div key={m.id} className="space-y-2 animate-slide-in">
                                    {m.from === "user" && (
                                        <div className="flex justify-end">
                                            <div className="max-w-[75%] rounded-3xl rounded-tr-none bg-indigo-500/90 px-3.5 py-2.5 text-sm text-white shadow-md">
                                                <p>{m.text}</p>
                                                <p className="mt-1 text-right text-[11px] text-indigo-100/80">
                                                    {formatTime(m.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {m.from === "bot" && (
                                        <div className="flex justify-start">
                                            <div className="max-w-[75%] rounded-3xl rounded-tl-none bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-md ring-1 ring-slate-200">
                                                <p>{m.text}</p>
                                                <p className="mt-1 text-right text-[11px] text-slate-400">
                                                    Trợ lý • {formatTime(m.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-border/60 bg-white/95 px-3 py-3">
                            <div className="flex items-end gap-2">
                                <Textarea
                                    placeholder="Nhập câu hỏi về hệ thống luyện thi..."
                                    rows={2}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="flex-1 resize-none rounded-2xl border-border/60 bg-slate-50/80 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-400"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            if (!loading) handleSend();
                                        }
                                    }}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={loading}
                                    className="mb-[2px] rounded-2xl bg-sky-600 px-4 text-sm font-medium shadow-md transition-all hover:bg-sky-700 hover:shadow-lg active:scale-95 disabled:opacity-60"
                                >
                                    {loading ? "Đang gửi..." : "Gửi"}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
