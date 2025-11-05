import { useEffect, useState } from "react";
import axios from "axios";
import { ResultStatsCard, QuickStatsCard, RecentActivityCard } from "./components/index.ts";

const AdminDashboard = () => {
    const [resultStats, setResultStats] = useState<any[]>([]);
    const [quickStats, setQuickStats] = useState<any>({});
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [res1, res2] = await Promise.all([
                    axios.get("http://localhost:5000/api/admin/dashboard", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get("http://localhost:5000/api/results/system/skill-stats", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                setQuickStats(res1.data.quickStats);
                setActivities(res1.data.activities);
                const statsArray = Object.keys(res2.data).map((skill) => ({
                    skill,
                    ...res2.data[skill],
                }));
                setResultStats(statsArray);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading)
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 animate-pulse text-lg">
                    Đang tải dữ liệu...
                </p>
            </div>
        );

    return (
        <div className="space-y-8 animate-fadeIn pb-10">
            {/* Kết quả kỹ năng */}
            <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                    📊 Thống kê kết quả theo kỹ năng
                </h2>
                <ResultStatsCard resultStats={resultStats} />
            </section>

            {/* Thống kê nhanh */}
            <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                    ⚡ Thống kê nhanh
                </h2>
                <QuickStatsCard quickStats={quickStats} />
            </section>

            {/* Hoạt động gần đây */}
            <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                    🕓 Hoạt động gần đây
                </h2>
                <RecentActivityCard activities={activities} />
            </section>
        </div>
    );

};

export default AdminDashboard;
