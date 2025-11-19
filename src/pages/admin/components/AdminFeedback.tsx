"use client";

import { useEffect, useState, useRef  } from "react";
import api from "@/api/Api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageCircle, User, Loader2 } from "lucide-react";
import { io, Socket } from "socket.io-client";

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    // cho DOM render xong rồi mới scroll
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/feedback");
      setFeedbacks(res.data || []);
    } catch {
      toast.error("Không thể tải danh sách phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);
  useEffect(() => {
    // kết nối socket
    const s = io("http://localhost:5000", {
      query: {
        token: localStorage.getItem("token") || "",
      },
    });
  
    setSocket(s);
  
    // Khi có feedback mới từ học sinh
    s.on("admin_new_message", (fb: any) => {
      setFeedbacks((prev) => {
        // tránh trùng nếu đã tồn tại
        const idx = prev.findIndex((x) => x._id === fb._id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...fb };
          return next;
        }
        // thêm lên đầu (hoặc cuối tuỳ UI)
        return [fb, ...prev];
      });
    });
  
    // (tuỳ bạn) nếu muốn nhận luôn update khi giáo viên khác reply từ nơi khác,
    // có thể nghe thêm event khác như "receive_message_for_admin"
  
    return () => {
      s.off("admin_new_message");
      s.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!selectedUser) return;
    scrollToBottom();
  }, [feedbacks, selectedUser]);
  const handleReply = async (feedbackId: string) => {
    if (!selectedUser) return;
    const text = replyText[selectedUser._id];
    if (!text?.trim()) return toast.error("Vui lòng nhập phản hồi!");

    try {
      await api.post(`/feedback/${feedbackId}/reply`, { reply: text });
      toast.success("Đã gửi phản hồi!");
      setReplyText((prev) => ({ ...prev, [selectedUser._id]: "" }));
      fetchFeedbacks();
    } catch {
      toast.error("Lỗi khi gửi phản hồi.");
    }
  };

  const handleEndConversation = async () => {
    if (!selectedUser || userFeedbacks.length === 0) {
      return toast.error("Không có hội thoại nào để kết thúc.");
    }

    const last = userFeedbacks[userFeedbacks.length - 1];

    try {
      await api.post(`/feedback/${last._id}/end-conversation`);
      toast.success("Đã kết thúc cuộc hội thoại với học sinh.");
      fetchFeedbacks();
    } catch {
      toast.error("Lỗi khi kết thúc hội thoại.");
    }
  };

  // Unique users có feedback
  const users = [
    ...new Map(
      feedbacks
        .filter((f) => f.user?._id)
        .map((f) => [f.user._id, f.user])
    ).values(),
  ];

  const userFeedbacks = selectedUser
    ? feedbacks
      .filter((fb) => fb.user?._id === selectedUser._id)
      .slice()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    : [];

  const userEnded = userFeedbacks.some((fb) => fb.ended);
  const hasTeacherReply = userFeedbacks.some((fb) => fb.reply);

  // Chấp nhận yêu cầu liên hệ
  const handleAcceptRequest = async () => {
    if (!selectedUser || userFeedbacks.length === 0) {
      return toast.error("Không có yêu cầu nào để chấp nhận.");
    }

    const last = userFeedbacks[userFeedbacks.length - 1];

    try {
      await api.post(`/feedback/${last._id}/reply`, {
        reply:
          "Thầy/cô đã nhận được yêu cầu, em cứ gửi câu hỏi tại đây nhé.",
      });
      toast.success("Đã chấp nhận yêu cầu và mở cuộc hội thoại.");
      fetchFeedbacks();
    } catch {
      toast.error("Lỗi khi chấp nhận yêu cầu.");
    }
  };

  // Chỉ hiện số chưa đọc nếu chưa click vào user đó
  const unreadCount = (userId: string) => {
    if (selectedUser && selectedUser._id === userId) return 0;
    return feedbacks.filter(
      (fb) => fb.user?._id === userId && !fb.reply
    ).length;
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Đang tải phản hồi của học sinh...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-indigo-50/60 via-background to-background py-6 animate-fade-in">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              Hộp thư phản hồi học sinh
            </h1>
            <p className="text-sm text-muted-foreground">
              Xem và trả lời góp ý, câu hỏi của học sinh theo dạng hội thoại.
            </p>
          </div>
          <Badge
            variant="outline"
            className="self-start md:self-auto border-primary/30"
          >
            Tổng số cuộc hội thoại: {users.length || 0}
          </Badge>
        </div>

        {users.length === 0 ? (
          <Card className="border-dashed border-2 border-muted/60 bg-card/60 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Chưa có phản hồi nào từ học sinh.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-border/70 bg-card/95 backdrop-blur-sm shadow-lg rounded-3xl">
            <div className="flex h-[70vh]">
              {/* Sidebar */}
              <div className="w-72 border-r border-border/70 bg-gradient-to-b from-indigo-50/80 to-background/60">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Danh sách học sinh
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Chọn một học sinh để xem lịch sử phản hồi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3 pb-4 px-3">
                  <div className="flex max-h-[56vh] flex-col gap-1 overflow-y-auto pr-1">
                    {users.map((u) => {
                      const active = selectedUser?._id === u._id;
                      const count = unreadCount(u._id);

                      return (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className={[
                            "group flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-all",
                            active
                              ? "bg-indigo-100/90 text-indigo-900 shadow-sm ring-1 ring-indigo-200"
                              : "hover:bg-muted/70 text-foreground/80",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={[
                                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                                active
                                  ? "bg-indigo-600 text-white"
                                  : "bg-indigo-100 text-indigo-700",
                              ].join(" ")}
                            >
                              {u.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="flex flex-col">
                              <span className="line-clamp-1 font-medium">
                                {u.name || "Không tên"}
                              </span>
                              <span className="text-[11px] text-muted-foreground line-clamp-1">
                                {u.email || "Không có email"}
                              </span>
                            </div>
                          </div>

                          {count > 0 && (
                            <span className="flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white shadow-sm">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </div>

              {/* Chat Area */}
              <div className="flex flex-1 flex-col">
                {selectedUser ? (
                  <>
                    {/* Chat header */}
                    <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-indigo-50/80 to-sky-50/80 px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white shadow-sm">
                          {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-foreground">
                            Trò chuyện với {selectedUser.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {selectedUser.email || "Không có email"} •{" "}
                            {userFeedbacks.length} tin nhắn
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="text-[11px] border-emerald-200 text-emerald-700"
                      >
                        Học sinh đang chọn
                      </Badge>

                      <div className="flex items-center gap-2">
                        {!userEnded &&
                          !hasTeacherReply &&
                          userFeedbacks.length > 0 ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-[11px] border-emerald-300 text-emerald-700"
                              onClick={handleAcceptRequest}
                            >
                              Chấp nhận yêu cầu
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-[11px] border-rose-300 text-rose-700"
                              onClick={handleEndConversation}
                            >
                              Từ chối
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-[11px]"
                            onClick={handleEndConversation}
                          >
                            Kết thúc hội thoại
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 space-y-3 overflow-y-auto bg-muted/40 px-5 py-4 animate-fade-in">
                      {userFeedbacks.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Học sinh này chưa gửi phản hồi nào.
                        </div>
                      ) : (
                        userFeedbacks.map((fb) => (
                          <div
                            key={fb._id}
                            className="space-y-2 animate-slide-in"
                          >
                            {/* Học sinh */}
                            <div className="flex justify-start">
                              <div className="max-w-[75%] rounded-3xl rounded-tl-none bg-white shadow-sm ring-1 ring-indigo-100/70 px-4 py-3">
                                <p className="text-sm text-foreground">
                                  {fb.message}
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground text-right">
                                  HS •{" "}
                                  {new Date(fb.createdAt).toLocaleString(
                                    "vi-VN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Giảng viên */}
                            {fb.reply && (
                              <div className="flex justify-end">
                                <div className="max-w-[75%] rounded-3xl rounded-tr-none bg-indigo-600 text-white shadow-sm px-4 py-3">
                                  <p className="text-sm">{fb.reply}</p>
                                  <p className="mt-1 text-[11px] text-indigo-100/90 text-right">
                                    GV •{" "}
                                    {new Date(
                                      fb.updatedAt ??
                                      fb.repliedAt ??
                                      fb.createdAt
                                    ).toLocaleString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                       <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-border/60 bg-background px-5 py-3">
                      <div className="flex items-end gap-3">
                        <Textarea
                          placeholder={`Phản hồi cho ${selectedUser.name}...`}
                          rows={2}
                          value={replyText[selectedUser._id] || ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [selectedUser._id]: e.target.value,
                            }))
                          }
                          className="flex-1 resize-none rounded-2xl border-border/70 bg-muted/60 shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-400"
                        />
                        <Button
                          className="rounded-2xl bg-indigo-600 px-5 shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all"
                          onClick={() => {
                            const text = replyText[selectedUser._id]?.trim();
                            if (!text) {
                              return toast.error("Vui lòng nhập phản hồi!");
                            }

                            // luôn gửi gắn với tin nhắn mới nhất của học sinh
                            if (userFeedbacks.length === 0) {
                              return toast.error(
                                "Chưa có lịch sử nào với học sinh này để gắn phản hồi."
                              );
                            }

                            const last = userFeedbacks[userFeedbacks.length - 1];
                            handleReply(last._id);
                          }}
                        >
                          Gửi
                        </Button>
                      </div>
                    </div>

                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground animate-fade-in">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/80" />
                    <p className="text-sm">
                      Chọn một học sinh bên trái để bắt đầu hội thoại 💬
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
