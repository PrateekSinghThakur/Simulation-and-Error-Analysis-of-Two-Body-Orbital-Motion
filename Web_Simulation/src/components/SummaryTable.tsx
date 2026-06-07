import React from "react";

type MethodStats = {
  steps: number;
  rejectedSteps?: number;
  finalEnergyRelErr: number;
  finalAngMomRelErr: number;
  maxEnergyRelErr: number;
  maxAngMomRelErr: number;
};

type SummaryTableProps = {
  stats: Record<string, MethodStats>;
};

const METHOD_LABELS: Record<string, { label: string; order: string; color: string }> = {
  euler: { label: "Euler", order: "O(h)", color: "text-red-400" },
  rk4: { label: "RK4", order: "O(h⁴)", color: "text-blue-400" },
  pc: { label: "Predictor-Corrector", order: "O(h²)", color: "text-emerald-400" },
  ark4: { label: "Adaptive RK4", order: "O(h⁴) adapt.", color: "text-violet-400" },
};

function fmtSci(v: number): string {
  if (v === 0) return "0";
  if (!isFinite(v) || isNaN(v)) return "—";
  return v.toExponential(2);
}

function qualityBadge(v: number) {
  if (v < 1e-9) return <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300">Excellent</span>;
  if (v < 1e-6) return <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">Good</span>;
  if (v < 1e-3) return <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/60 text-yellow-300">Fair</span>;
  return <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/60 text-red-300">Poor</span>;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ stats }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-xs text-slate-300">
        <thead>
          <tr className="bg-slate-800/80 border-b border-slate-700">
            <th className="text-left px-3 py-2.5 font-semibold text-slate-200">Method</th>
            <th className="text-center px-3 py-2.5 font-semibold text-slate-200">Order</th>
            <th className="text-right px-3 py-2.5 font-semibold text-slate-200">Steps</th>
            <th className="text-right px-3 py-2.5 font-semibold text-slate-200">ΔE/E₀ (final)</th>
            <th className="text-right px-3 py-2.5 font-semibold text-slate-200">ΔL/L₀ (final)</th>
            <th className="text-right px-3 py-2.5 font-semibold text-slate-200">max ΔE/E₀</th>
            <th className="text-right px-3 py-2.5 font-semibold text-slate-200">max ΔL/L₀</th>
            <th className="text-center px-3 py-2.5 font-semibold text-slate-200">Quality</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats).map(([key, s], i) => {
            const meta = METHOD_LABELS[key] ?? { label: key, order: "—", color: "text-slate-400" };
            return (
              <tr
                key={key}
                className={`border-b border-slate-700/40 ${i % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/10"} hover:bg-slate-700/30 transition-colors`}
              >
                <td className={`px-3 py-2 font-medium ${meta.color}`}>{meta.label}</td>
                <td className="px-3 py-2 text-center font-mono text-slate-400">{meta.order}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {s.steps.toLocaleString()}
                  {s.rejectedSteps !== undefined && s.rejectedSteps > 0 && (
                    <span className="text-slate-500 ml-1">(-{s.rejectedSteps})</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono">{fmtSci(s.finalEnergyRelErr)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtSci(s.finalAngMomRelErr)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtSci(s.maxEnergyRelErr)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtSci(s.maxAngMomRelErr)}</td>
                <td className="px-3 py-2 text-center">{qualityBadge(s.maxEnergyRelErr)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
