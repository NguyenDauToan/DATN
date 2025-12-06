// ChatBubble.tsx
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/api/Api";
import { io, Socket } from "socket.io-client";
import { X, Bot } from "lucide-react";

type AssistantMsg = {
  id: string;
  from: "user" | "bot";
  text: string;
  createdAt: string;
};

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // ---- trạng thái chat với GIÁO VIÊN (feedback) ----
  const [message, setMessage] = useState("");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationEnded, setConversationEnded] = useState(false);

  // ---- trạng thái chat với TRỢ LÝ HỆ THỐNG ----
  const [mode, setMode] = useState<"assistant" | "teacher">("assistant");
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMsgs, setAssistantMsgs] = useState<AssistantMsg[]>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(false);

  // 👇 LẤY userId TỪ localStorage (không cần useAuth)
  const [userId] = useState<string>(() => {
    return localStorage.getItem("userId") || "";
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
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

      // Trạng thái hội thoại hiện tại = trạng thái của tin cuối
      const lastItem = list[list.length - 1];
      const lastEnded = !!lastItem?.ended;

      setConversationEnded(lastEnded);
      recomputeUnread(list);

      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "auto" });
        setInitialLoaded(true);
      }, 100);
    } catch {
      toast.error("Không thể tải phản hồi");
    }
  };

  // ----- gửi tin nhắn cho GIÁO VIÊN -----
  const handleSendTeacher = async () => {
    if (conversationEnded) {
      toast.info(
        "Giáo viên đã kết thúc cuộc trò chuyện. Hãy dùng Trợ lý hệ thống hoặc bấm 'Liên hệ giáo viên' để mở cuộc trò chuyện mới."
      );
      setMode("assistant");
      return;
    }

    if (!message.trim()) return toast.error("Vui lòng nhập nội dung!");

    try {
      setLoading(true);
      const res = await api.post("/feedback", { message });
      const fb = res.data?.feedback ?? res.data;
      if (!fb || !fb._id) return;

      // ⚠ Nếu backend không tìm được lớp / GVCN => không có toTeacher
      if (!fb.toTeacher) {
        toast.error(
          "Tài khoản của bạn chưa được gán vào lớp và giáo viên chủ nhiệm, nên không thể gửi tin trực tiếp."
        );
        setMode("assistant");
        return;
      }

      setFeedbacks((prev) => {
        const exists = prev.some((x) => x._id === fb._id);
        if (exists) return prev;
        return [...prev, fb];
      });

      // gửi lên socket cho server, trong fb đã có school / classroom / toTeacher
      socket?.emit("send_message", fb);

      setMessage("");
      scrollToBottom();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "Gửi phản hồi thất bại! Vui lòng kiểm tra lại.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ----- khi bấm "Liên hệ giáo viên" từ Bot -----
  // KHÔNG còn khái niệm chấp nhận/từ chối, HS bấm là gửi luôn cho GVCN
  const handleContactTeacher = async () => {
    // nếu đã có hội thoại đang mở (chưa kết thúc) thì chỉ cần chuyển tab
    const needOpenNew =
      feedbacks.length === 0 || conversationEnded === true;

    setMode("teacher");

    if (!needOpenNew) return;

    try {
      setLoading(true);

      const autoText =
        "Em cần giáo viên hỗ trợ thêm về hệ thống/bài học. Thầy/cô có thể phản hồi giúp em khi rảnh ạ.";

      const res = await api.post("/feedback", { message: autoText });
      const fb = res.data?.feedback ?? res.data;
      if (!fb || !fb._id) {
        toast.error("Không gửi được yêu cầu tới giáo viên.");
        setMode("assistant");
        return;
      }

      // ⚠ Kiểm tra đã map được tới giáo viên của lớp chưa
      if (!fb.toTeacher) {
        toast.error(
          "Tài khoản của bạn chưa được gán vào lớp và giáo viên chủ nhiệm, nên không thể liên hệ trực tiếp giáo viên."
        );
        setMode("assistant");
        return;
      }

      setConversationEnded(false); // mở lại hội thoại mới
      setFeedbacks((prev) => [...prev, fb]);
      socket?.emit("send_message", fb); // fb chứa thông tin school/classroom/toTeacher

      scrollToBottom();
      toast.success(
        "Đã gửi tin nhắn tới giáo viên. Bạn có thể tiếp tục trò chuyện tại đây."
      );
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "Gửi phản hồi thất bại! Vui lòng kiểm tra lại.";
      toast.error(msg);
      setMode("assistant");
    } finally {
      setLoading(false);
    }
  };

  // ----- gửi tin nhắn cho TRỢ LÝ HỆ THỐNG -----
  const handleSendAssistant = async () => {
    const text = assistantInput.trim();
    if (!text) {
      toast.error("Vui lòng nhập nội dung.");
      return;
    }

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
      setAssistantLoading(true);

      const userMsg: AssistantMsg = {
        id: Date.now().toString(),
        from: "user",
        text,
        createdAt: new Date().toISOString(),
      };
      setAssistantMsgs((prev) => [...prev, userMsg]);
      setAssistantInput("");
      scrollToBottom();

      const res = await api.post("/chat/support", { message: text });
      const replyText: string =
        res.data?.reply ||
        "Hiện tại mình chưa thể trả lời câu hỏi này. Bạn có thể hỏi lại theo cách khác nhé.";

      const botMsg: AssistantMsg = {
        id: Date.now().toString() + "_bot",
        from: "bot",
        text: replyText,
        createdAt: new Date().toISOString(),
      };
      setAssistantMsgs((prev) => [...prev, botMsg]);
      scrollToBottom();
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi gửi tin nhắn, thử lại sau.");
    } finally {
      setAssistantLoading(false);
    }
  };

  // greeting ban đầu
  useEffect(() => {
    setAssistantMsgs([
      {
        id: "welcome",
        from: "bot",
        text:
          "Xin chào 👋 Mình là Trợ lý hệ thống luyện thi. Bạn có thể hỏi về cách dùng hệ thống, lỗi, chọn đề… Nếu cần gặp giáo viên, hãy bấm nút 'Liên hệ giáo viên' bên dưới.",
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  useEffect(() => {
    openRef.current = open;
    if (open) {
      updateLastSeenFromList(feedbacks);
      setUnreadCount(0);
    }
  }, [open, feedbacks]);

  // 👇 KẾT NỐI SOCKET + JOIN ROOM THEO userId
  useEffect(() => {
    const s = io("https://english-backend-uoic.onrender.com", {
      query: {
        token: localStorage.getItem("token") || "",
      },
    });
    setSocket(s);

    if (userId) {
      s.emit("join_user", userId); // server cần handle event này
    }

    s.on("receive_message", (data: any) => {
      if (!data || !data._id) return;

      setFeedbacks((prev) => {
        const idx = prev.findIndex((x) => x._id === data._id);
        let next: any[];

        if (idx !== -1) {
          // cập nhật feedback cũ
          next = [...prev];
          next[idx] = { ...next[idx], ...data };
        } else {
          // thêm feedback mới
          next = [...prev, data];
        }

        // nếu đang đóng popup và đây là phản hồi của GV => tăng badge
        if (!openRef.current && data.reply) {
          setUnreadCount((c) => (c >= 99 ? 99 : c + 1));
          toast.info("Bạn có phản hồi mới từ giáo viên 💬");
        }

        return next;
      });

      if (data.reply) {
        // khi giáo viên trả lời thì chắc chắn đang có hội thoại mở
        setConversationEnded(false);
        // 👇 luôn chuyển sang tab GIÁO VIÊN khi có reply
        setMode("teacher");
      }
      if (data.ended) {
        setConversationEnded(true);
      }
      if (initialLoaded) scrollToBottom();
    });

    // 👇 GIÁO VIÊN KẾT THÚC HỘI THOẠI -> RECEIVE EVENT
    s.on("conversation_ended", (payload: any) => {
      if (!payload?.userId) return;
      // chỉ xử lý nếu là cuộc hội thoại của chính user hiện tại
      if (userId && String(payload.userId) !== String(userId)) return;

      setConversationEnded(true);
      toast.info(
        "Giáo viên đã kết thúc cuộc trò chuyện. Bạn sẽ được chuyển về Bot trợ lý."
      );
    });

    fetchFeedbacks();

    return () => {
      s.off("receive_message");
      s.off("conversation_ended");
      s.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    if (feedbacks.length > 0) {
      const timeout = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeout);
    }
  }, [feedbacks]);

  // Khi giáo viên kết thúc hội thoại -> tự chuyển sang bot + chèn thông báo
  useEffect(() => {
    if (conversationEnded) {
      setMode("assistant");
      setAssistantMsgs((prev) => [
        ...prev,
        {
          id: `ended-${Date.now()}`,
          from: "bot",
          text:
            "Giáo viên đã kết thúc cuộc trò chuyện hiện tại. Mình – Bot trợ lý – sẽ tiếp tục hỗ trợ bạn ở đây.",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [conversationEnded]);

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleOpen = () => {
    setIsClosing(false);
    setOpen(true);
    if (conversationEnded) setMode("assistant");
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

  const handleOverlayClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (e.target === e.currentTarget) {
      handleCloseClick();
    }
  };

  return (
    <>
      {/* Nút nổi – chỉ hiện khi popup đóng */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
        >
          <div className="relative">
            <Bot className="h-5 w-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-rose-500/60 animate-ping" />
              </>
            )}
          </div>
          <span>Bot trợ lý</span>
        </button>
      )}

      {/* Popup */}
      {open && (
        <div
          className={`fixed inset-0 z-40 flex items-end justify-end bg-black/20 backdrop-blur-sm p-4 ${
            isClosing
              ? "animate-chat-overlay-out"
              : "animate-chat-overlay-in"
          }`}
          onMouseDown={handleOverlayClick}
        >
          <Card
            className={`relative flex h-[520px] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-white to-slate-50 shadow-2xl ${
              isClosing ? "animate-chat-out" : "animate-chat-in"
            }`}
            onAnimationEnd={handleCardAnimationEnd}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={handleCloseClick}
              className="absolute right-3 top-3 rounded-full bg-white/70 p-1 text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header Bot trợ lý */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-indigo-500/95 to-sky-500/95 px-4 py-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Bot trợ lý</h3>
                <p className="text-[11px] text-indigo-100/90">
                  Sẵn sàng hỗ trợ bạn về hệ thống luyện thi. Nếu cần, bạn có
                  thể liên hệ trực tiếp giáo viên.
                </p>
              </div>
            </div>

            {/* Vùng chat */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/80 px-3 py-4">
              {mode === "assistant" ? (
                assistantMsgs.length === 0 ? (
                  <p className="mt-20 text-center text-sm text-gray-500">
                    💬 Hãy đặt câu hỏi về hệ thống luyện thi tiếng Anh THPT.
                  </p>
                ) : (
                  assistantMsgs.map((m) => (
                    <div key={m.id} className="space-y-2 animate-slide-in">
                      {m.from === "user" && (
                        <div className="flex justify-end">
                          <div className="max-w-[75%] rounded-3xl rounded-tr-none bg-sky-600 px-3.5 py-2.5 text-sm text-white shadow-md">
                            <p>{m.text}</p>
                            <p className="mt-1 text-right text-[11px] text-sky-100/80">
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
                              Bot trợ lý • {formatTime(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : feedbacks.length === 0 ? (
                <p className="mt-20 text-center text-sm text-gray-500">
                  💬 Bạn đang liên hệ giáo viên. Hãy gửi tin nhắn đầu tiên.
                </p>
              ) : (
                feedbacks.map((fb) => (
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
                ))
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 bg-white/95 px-3 py-3 space-y-2">
              {mode === "assistant" ? (
                <>
                  {/* Nút liên hệ giáo viên */}
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-900 shadow-sm">
                    <Button
                      className="w-full rounded-2xl bg-amber-500 text-white text-sm font-semibold shadow-md hover:bg-amber-600"
                      onClick={handleContactTeacher}
                      disabled={loading}
                    >
                      Liên hệ giáo viên
                    </Button>
                  </div>

                  {/* Input chat bot */}
                  <div className="flex items-end gap-2">
                    <Textarea
                      placeholder="Nhập câu hỏi về hệ thống luyện thi..."
                      rows={2}
                      value={assistantInput}
                      onChange={(e) => setAssistantInput(e.target.value)}
                      className="flex-1 resize-none rounded-2xl border-border/60 bg-slate-50/80 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (!assistantLoading) handleSendAssistant();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendAssistant}
                      disabled={assistantLoading}
                      className="mb-[2px] rounded-2xl bg-sky-600 px-4 text-sm font-medium shadow-md transition-all hover:bg-sky-700 hover:shadow-lg active:scale-95 disabled:opacity-60"
                    >
                      {assistantLoading ? "Đang gửi..." : "Gửi"}
                    </Button>
                  </div>
                </>
              ) : conversationEnded ? (
                // Giáo viên đã kết thúc
                <div className="space-y-3 text-xs text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="font-medium mb-1">
                      Giáo viên đã kết thúc cuộc trò chuyện.
                    </p>
                    <p>• Bạn vẫn có thể tiếp tục hỏi Bot trợ lý.</p>
                    <p>• Hoặc bấm lại "Liên hệ giáo viên" để mở cuộc trò chuyện mới.</p>
                  </div>
                  <Button
                    className="w-full rounded-2xl bg-sky-600 text-white text-sm font-semibold shadow-md hover:bg-sky-700"
                    onClick={() => setMode("assistant")}
                  >
                    Chat với Bot trợ lý
                  </Button>
                </div>
              ) : (
                // Input chat với giáo viên + nút thoát
                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    <Textarea
                      placeholder="Nhập tin nhắn cho giáo viên..."
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 resize-none rounded-2xl border-border/60 bg-slate-50/80 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (!loading) handleSendTeacher();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendTeacher}
                      disabled={loading}
                      className="mb-[2px] rounded-2xl bg-indigo-600 px-4 text-sm font-medium shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-95"
                    >
                      {loading ? "Đang gửi..." : "Gửi"}
                    </Button>
                  </div>

                  {/* nút thoát đoạn chat giáo viên */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-[11px] px-3 py-1"
                      onClick={() => setMode("assistant")}
                    >
                      Thoát chat giáo viên, quay về Bot trợ lý
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
