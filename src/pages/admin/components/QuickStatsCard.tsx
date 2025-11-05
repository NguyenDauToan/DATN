import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
  } from "@/components/ui/card";
  import { Users, FileText, MessageSquare, UserCheck } from "lucide-react";
  
  export const QuickStatsCard = ({ quickStats }: { quickStats: any }) => {
    const stats = [
      {
        title: "Bài thi hôm nay",
        value: quickStats.examsToday ?? 0,
        color: "text-blue-600",
        icon: <FileText className="h-6 w-6 text-blue-500" />,
        bg: "bg-blue-50 dark:bg-blue-950/40",
      },
      {
        title: "Học viên online",
        value: quickStats.onlineUsers ?? 0,
        color: "text-green-600",
        icon: <UserCheck className="h-6 w-6 text-green-500" />,
        bg: "bg-green-50 dark:bg-green-950/40",
        tooltipList: quickStats.onlineUserList,
      },
      {
        title: "Đề thi mới tuần này",
        value: quickStats.newExamsThisWeek ?? 0,
        color: "text-yellow-600",
        icon: <Users className="h-6 w-6 text-yellow-500" />,
        bg: "bg-yellow-50 dark:bg-yellow-950/40",
      },
      {
        title: "Phản hồi chờ xử lý",
        value: quickStats.pendingFeedbacks ?? 0,
        color: "text-red-600",
        icon: <MessageSquare className="h-6 w-6 text-red-500" />,
        bg: "bg-red-50 dark:bg-red-950/40",
      },
    ];
  
    return (
      <Card className="shadow-md backdrop-blur-md border border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Thống kê nhanh</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Các chỉ số hoạt động của hệ thống
          </CardDescription>
        </CardHeader>
  
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((item, index) => (
              <div
                key={index}
                className={`group relative flex items-center justify-between rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${item.bg}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-neutral-800/50 shadow-sm">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                </div>
  
                {/* Tooltip danh sách học viên online */}
                {item.tooltipList?.length > 0 && (
                  <div className="absolute left-0 bottom-0 translate-y-full mt-2 w-64 bg-white dark:bg-neutral-900 shadow-lg border border-border rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <p className="text-sm font-semibold mb-1 text-foreground">Đang online:</p>
                    <ul className="text-sm max-h-48 overflow-y-auto">
                      {item.tooltipList.map((u: any) => (
                        <li
                          key={u._id}
                          className="py-1 border-b border-border/30 last:border-0"
                        >
                          {u.name}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({u.email})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  