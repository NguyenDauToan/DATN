import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const RecentActivityCard = ({ activities }: { activities: any[] }) => (
  <Card className="shadow-soft">
    <CardHeader>
      <CardTitle>Hoạt động gần đây</CardTitle>
      <CardDescription>Các hoạt động mới nhất trong hệ thống</CardDescription>
    </CardHeader>
    <CardContent className="max-h-72 overflow-y-auto">
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((a, i) => (
            <div key={i} className="flex justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-medium">{a.action}</p>
                <p className="text-xs text-muted-foreground">{a.user}</p>
              </div>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có hoạt động nào</p>
        )}
      </div>
    </CardContent>
  </Card>
);
