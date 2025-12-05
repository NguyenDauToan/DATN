// src/pages/admin/components/ResultStatsCard.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type SkillStat = {
  skill: string;
  accuracy: number; // 0–1 hoặc 0–100
  correct: number;
  total: number;
  [key: string]: any;
};

const SKILL_LABEL: Record<string, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

const SKILL_ORDER = ["reading", "listening", "writing", "speaking"];

function normalizeAccuracy(raw: number) {
  if (!Number.isFinite(raw)) return 0;
  const asPercent = raw > 1.5 ? raw : raw * 100;
  return Math.max(0, Math.min(100, asPercent));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-muted-foreground">
        Tỉ lệ đúng: <span className="font-semibold">{data.accuracy.toFixed(1)}%</span>
      </p>
      <p className="text-muted-foreground">
        Số câu đúng:{" "}
        <span className="font-semibold">
          {data.correct}/{data.total}
        </span>
      </p>
    </div>
  );
};

export const ResultStatsCard = ({ resultStats }: { resultStats: any[] }) => {
  if (!resultStats || resultStats.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Chưa có dữ liệu thống kê
      </div>
    );
  }

  // Map skill -> stat
  const statMap: Record<string, SkillStat> = {};
  for (const s of resultStats) {
    statMap[s.skill] = s;
  }

  // Build đủ 4 skill chính
  const filled: SkillStat[] = SKILL_ORDER.map((skill) => {
    if (statMap[skill]) return statMap[skill];
    return {
      skill,
      accuracy: 0,
      correct: 0,
      total: 0,
    };
  });

  // Skill lạ ngoài 4 skill thì push thêm
  for (const s of resultStats) {
    if (!SKILL_ORDER.includes(s.skill)) {
      filled.push(s);
    }
  }

  // Data cho chart
  const chartData = filled.map((s) => ({
    key: s.skill,
    label: SKILL_LABEL[s.skill] ?? s.skill,
    accuracy: normalizeAccuracy(Number(s.accuracy)),
    correct: s.correct ?? 0,
    total: s.total ?? 0,
  }));

  return (
    <div className="w-full h-[260px] sm:h-[280px] md:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 24, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="accuracy"
            radius={[10, 10, 4, 4]}
            // màu dựa trên biến CSS primary
            fill="hsl(var(--primary))"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
