// ChatBubble.tsx
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/api/Api";
import { io, Socket } from "socket.io-client";
import { MessageCircle, X } from "lucide-react";

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [message, setMessage] = useState("");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(false);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const getLastSeen = () => {
    const val = localStorage.getItem("chat_last_seen");
    return val ? Number(val) : 0;
  };

  const setLastSeen = (time: number) => {
    if (!time) return;
    localStorage.setItem("chat_last_seen", String(time));
  };

  const updateLastSeenFromList = (list: any[]) => {
    const lastReplyTime = list
      .filter((fb) => fb.reply)
      .reduce((max, fb) => {
        const t = new Date(
          fb.updatedAt ?? fb.repliedAt ?? fb.createdAt
        ).getTime();
        return isNaN(t) ? max : Math.max(max, t);
      }, 0);

    if (lastReplyTime) setLastSeen(lastReplyTime);
  };

  const recomputeUnread = (list: any[]) => {
    const lastSeen = getLastSeen();
    if (!lastSeen) {
      setUnreadCount(0);
      return;
    }

    const count = list.filter((fb) => {
      if (!fb.reply) return false;
      const t = new Date(
        fb.updatedAt ?? fb.repliedAt ?? fb.createdAt
      ).getTime();
      return !isNaN(t) && t > lastSeen;
    }).length;

    setUnreadCount(count);
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await api.get("/feedback/mine");
      const list: any[] = res.data || [];
      list.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setFeedbacks(list);

      // tính lại unread từ localStorage
      recomputeUnread(list);

      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "auto" });
        setInitialLoaded(true);
      }, 100);
    } catch {
      toast.error("Không thể tải phản hồi");
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return toast.error("Vui lòng nhập nội dung!");
    try {
      setLoading(true);
      const res = await api.post("/feedback", { message });
      const fb = res.data?.feedback ?? res.data;
      if (!fb || !fb._id) return;

      setFeedbacks((prev) => {
        const exists = prev.some((x) => x._id === fb._id);
        if (exists) return prev;
        const next = [...prev, fb];
        // gửi từ HS không làm tăng unread
        return next;
      });

      socket?.emit("send_message", fb);
      setMessage("");
      scrollToBottom();
    } catch (err) {
      console.error(err);
      toast.error("Gửi phản hồi thất bại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    openRef.current = open;
    if (open) {
      // mở popup: đánh dấu đã đọc tất cả reply hiện có
      updateLastSeenFromList(feedbacks);
      setUnreadCount(0);
    }
  }, [open, feedbacks]);

  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);

    s.on("receive_message", (data: any) => {
      if (!data || !data._id) return;

      setFeedbacks((prev) => {
        const exists = prev.some((x) => x._id === data._id);
        if (exists) return prev;
        const next = [...prev, data];

        // nếu popup đang đóng và đây là reply của GV → tăng unread
        if (!openRef.current && data.reply) {
          setUnreadCount((c) => (c >= 99 ? 99 : c + 1));
          toast.info("Bạn có phản hồi mới từ giáo viên 💬");
        }

        return next;
      });

      if (initialLoaded) scrollToBottom();
    });

    fetchFeedbacks();

    return () => {
      s.off("receive_message");
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (feedbacks.length > 0) {
      const timeout = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeout);
    }
  }, [feedbacks]);

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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

  return (
    <>
      {/* Bubble – chỉ hiện khi đóng */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
        >
          <div className="relative">
            <MessageCircle className="h-5 w-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-rose-500/60 animate-ping" />
              </>
            )}
          </div>
          <span>Hỏi giáo viên</span>
        </button>
      )}

      {/* Popup chat */}
      {open && (
        <div
          className={`fixed inset-0 z-40 flex items-end justify-end bg-black/20 backdrop-blur-sm p-4 ${
            isClosing ? "animate-chat-overlay-out" : "animate-chat-overlay-in"
          }`}
        >
          <Card
            className={`relative flex h-[520px] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-white to-slate-50 shadow-2xl ${
              isClosing ? "animate-chat-out" : "animate-chat-in"
            }`}
            onAnimationEnd={handleCardAnimationEnd}
          >
            {/* Close button */}
            <button
              onClick={handleCloseClick}
              className="absolute right-3 top-3 rounded-full bg-white/70 p-1 text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-indigo-500/90 to-sky-500/90 px-4 py-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 shadow-sm">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Phản hồi với giáo viên</h3>
                <p className="text-[11px] text-indigo-100/90">
                  Gửi câu hỏi hoặc góp ý. Giáo viên sẽ trả lời tại đây.
                </p>
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/80 px-3 py-4">
              {feedbacks.length === 0 && (
                <p className="mt-20 text-center text-sm text-gray-500">
                  💬 Chưa có cuộc trò chuyện nào. Hãy gửi tin nhắn đầu tiên!
                </p>
              )}

              {feedbacks.map((fb) => (
                <div key={fb._id} className="space-y-2 animate-slide-in">
                  {/* Học sinh */}
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-3xl rounded-tr-none bg-indigo-500/90 px-3.5 py-2.5 text-sm text-white shadow-md">
                      <p>{fb.message}</p>
                      <p className="mt-1 text-right text-[11px] text-indigo-100/80">
                        {formatTime(fb.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Giáo viên */}
                  {fb.reply && (
                    <div className="flex justify-start">
                      <div className="max-w-[75%] rounded-3xl rounded-tl-none bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-md ring-1 ring-slate-200">
                        <p>{fb.reply}</p>
                        <p className="mt-1 text-right text-[11px] text-slate-400">
                          GV • {formatTime(fb.updatedAt ?? fb.repliedAt)}
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
                  placeholder="Nhập tin nhắn..."
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 resize-none rounded-2xl border-border/60 bg-slate-50/80 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={loading}
                  className="mb-[2px] rounded-2xl bg-indigo-600 px-4 text-sm font-medium shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-95"
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
