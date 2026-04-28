import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EngineAssessment } from "@/lib/engine";

export const FactorChart = ({ data }: { data: EngineAssessment["factorChartData"] }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            angle={-20}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v: number, name: string) =>
              name === "score" ? [`${v}/100`, "Sub-score"] : [`${v}%`, "Weight"]
            }
          />
          <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          <Bar dataKey="weight" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
