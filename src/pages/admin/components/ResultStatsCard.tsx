import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const ResultStatsCard = ({ resultStats }: { resultStats: any[] }) => (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Thống kê kết quả làm bài
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Tổng hợp các bài thi của học sinh
        </p>
      </div>
  
      {resultStats && resultStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resultStats.map((stat, index) => (
            <div
              key={index}
              className="p-5 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition"
            >
              <span className="block text-sm font-medium text-gray-600">
                {stat.skill}
              </span>
              <span className="block text-3xl font-bold text-gray-900 mt-2">
                {(stat.accuracy * 100).toFixed(1)}%
              </span>
              <span className="block text-xs text-gray-500 mt-1">
                {stat.correct} / {stat.total} câu đúng
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Chưa có dữ liệu thống kê</p>
      )}
    </div>
  );
