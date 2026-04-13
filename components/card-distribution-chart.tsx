"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartPoint = {
  name: string;
  value: number;
};

export function CardDistributionChart({ data }: { data: ChartPoint[] }) {
  const chartData = data.length ? data : [{ name: "Keine Karten", value: 0 }];

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(235, 247, 241, 0.72)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "rgba(235, 247, 241, 0.72)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.06)" }}
            contentStyle={{
              background: "rgba(11, 24, 20, 0.92)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "#ecf7f2",
            }}
          />
          <Bar dataKey="value" fill="#35d6a4" radius={[6, 6, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
