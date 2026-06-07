import React, { useRef, useEffect } from "react";
import { StepSizeSensitivity } from "../core/analysis";

export const SensitivityOrbitChart: React.FC<{
  data: StepSizeSensitivity[];
  title: string;
  width?: number;
  height?: number;
}> = ({ data, title, width = 340, height = 340 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const W = width;
    const H = height;
    const pad = 30;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    // Get bounds from finest solution
    const finest = data[data.length - 1];
    const allX = finest.result.states.map((s) => s[0]);
    const allY = finest.result.states.map((s) => s[1]);
    const xMin = Math.min(...allX);
    const xMax = Math.max(...allX);
    const yMin = Math.min(...allY);
    const yMax = Math.max(...allY);
    const range = Math.max(xMax - xMin, yMax - yMin) * 1.2 || 2;
    const cx = W / 2 - ((xMin + xMax) / 2) * ((W - 2 * pad) / range);
    const cy = H / 2 + ((yMin + yMax) / 2) * ((H - 2 * pad) / range);
    const scale = (Math.min(W, H) - 2 * pad) / range;

    const toC = (x: number, y: number) => ({
      cx: cx + x * scale,
      cy: cy - y * scale,
    });

    // Grid
    ctx.strokeStyle = "rgba(148,163,184,0.06)";
    ctx.lineWidth = 1;
    for (let g = -3; g <= 3; g++) {
      const { cx: gx } = toC(g, 0);
      ctx.beginPath();
      ctx.moveTo(gx, pad);
      ctx.lineTo(gx, H - pad);
      ctx.stroke();
      const { cy: gy } = toC(0, g);
      ctx.beginPath();
      ctx.moveTo(pad, gy);
      ctx.lineTo(W - pad, gy);
      ctx.stroke();
    }

    // Central body
    const { cx: scx, cy: scy } = toC(0, 0);
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(scx, scy, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw orbits
    for (const s of data) {
      const maxPts = Math.min(s.result.states.length, 600);
      const step = Math.max(1, Math.floor(s.result.states.length / maxPts));
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < s.result.states.length; i += step) {
        const { cx: px, cy: py } = toC(s.result.states[i][0], s.result.states[i][1]);
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Title
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, W / 2, 18);

    // Legend
    data.forEach((s, i) => {
      ctx.fillStyle = s.color;
      ctx.fillRect(pad, pad + 20 + i * 16, 12, 2);
      ctx.fillStyle = s.color;
      ctx.font = "10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(s.label, pad + 16, pad + 26 + i * 16);
    });
  }, [data, title, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, borderRadius: 10, border: "1px solid rgba(148,163,184,0.12)" }}
    />
  );
};

export const SensitivityBarChart: React.FC<{
  eulerData: StepSizeSensitivity[];
  rk4Data: StepSizeSensitivity[];
}> = ({ eulerData, rk4Data }) => {
  const rows = eulerData.map((e, i) => ({
    h: e.h,
    label: e.label,
    eulerE: e.finalEnergyRelErr,
    eulerL: e.finalAngMomRelErr,
    rk4E: rk4Data[i]?.finalEnergyRelErr ?? 0,
    rk4L: rk4Data[i]?.finalAngMomRelErr ?? 0,
  }));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/40">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-800/80 border-b border-slate-700">
            <th className="text-left px-3 py-2.5 text-slate-400">Step Size</th>
            <th className="text-right px-3 py-2.5 text-red-400">Euler ΔE/E₀</th>
            <th className="text-right px-3 py-2.5 text-red-400">Euler ΔL/L₀</th>
            <th className="text-right px-3 py-2.5 text-blue-400">RK4 ΔE/E₀</th>
            <th className="text-right px-3 py-2.5 text-blue-400">RK4 ΔL/L₀</th>
            <th className="text-center px-3 py-2.5 text-slate-400">Improvement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const improv = row.eulerE > 0 && row.rk4E > 0
              ? Math.log10(row.eulerE / row.rk4E).toFixed(1)
              : "—";
            return (
              <tr key={i} className={`border-b border-slate-700/30 ${i % 2 === 0 ? "bg-slate-800/20" : ""}`}>
                <td className="px-3 py-2 font-mono text-slate-300">{row.label}</td>
                <td className="px-3 py-2 text-right font-mono text-red-400">{row.eulerE.toExponential(2)}</td>
                <td className="px-3 py-2 text-right font-mono text-red-400">{row.eulerL.toExponential(2)}</td>
                <td className="px-3 py-2 text-right font-mono text-blue-400">{row.rk4E.toExponential(2)}</td>
                <td className="px-3 py-2 text-right font-mono text-blue-400">{row.rk4L.toExponential(2)}</td>
                <td className="px-3 py-2 text-center">
                  <span className="text-emerald-400 font-mono">10^{improv}×</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
