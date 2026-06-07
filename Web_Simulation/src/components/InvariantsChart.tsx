import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type InvariantsChartProps = {
  data: Record<string, number>[];
  mode: "energy" | "angmom";
  enabledMethods: Record<string, boolean>;
  title: string;
};

const METHOD_COLORS: Record<string, string> = {
  euler: "#f87171",
  rk4: "#60a5fa",
  pc: "#34d399",
  ark4: "#a78bfa",
};

const METHOD_LABELS: Record<string, string> = {
  euler: "Euler",
  rk4: "RK4",
  pc: "Pred-Corr",
  ark4: "Adaptive RK4",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">t = {Number(label).toFixed(3)}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-mono">
          {entry.name}: {entry.value?.toExponential(3)}
        </p>
      ))}
    </div>
  );
};

export const InvariantsChart: React.FC<InvariantsChartProps> = ({
  data,
  mode,
  enabledMethods,
  title,
}) => {
  const suffix = mode === "energy" ? "_eRel" : "_lRel";

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-slate-300 mb-3 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis
            dataKey="t"
            stroke="#475569"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            label={{ value: "Time", position: "insideBottomRight", offset: -5, fill: "#64748b", fontSize: 10 }}
            tickFormatter={(v) => Number(v).toFixed(1)}
          />
          <YAxis
            stroke="#475569"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickFormatter={(v) => v.toExponential(0)}
            scale="log"
            domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
          />
          {Object.entries(enabledMethods)
            .filter(([, v]) => v)
            .map(([key]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={`${key}${suffix}`}
                name={METHOD_LABELS[key]}
                stroke={METHOD_COLORS[key]}
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
