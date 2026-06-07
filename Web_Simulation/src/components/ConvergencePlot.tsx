import React, { useRef, useEffect } from "react";
import { ConvergenceStudy } from "../core/analysis";

type ConvergencePlotProps = {
  study: ConvergenceStudy;
  width?: number;
  height?: number;
};

export const ConvergencePlot: React.FC<ConvergencePlotProps> = ({
  study,
  width = 480,
  height = 340,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const W = width;
    const H = height;
    const pad = { top: 30, right: 30, bottom: 55, left: 65 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    const { points } = study;
    if (points.length === 0) return;

    const hs = points.map((p) => p.h);
    const allErrors = [
      ...points.map((p) => p.eulerError),
      ...points.map((p) => p.rk4Error),
      ...points.map((p) => p.pcError),
    ].filter((e) => e > 0);

    const logHMin = Math.log10(Math.min(...hs));
    const logHMax = Math.log10(Math.max(...hs));
    const logEMin = Math.log10(Math.min(...allErrors)) - 0.5;
    const logEMax = Math.log10(Math.max(...allErrors)) + 0.5;

    const toX = (h: number) =>
      pad.left + ((Math.log10(h) - logHMin) / (logHMax - logHMin)) * plotW;
    const toY = (e: number) =>
      pad.top + (1 - (Math.log10(e) - logEMin) / (logEMax - logEMin)) * plotH;

    // Grid
    ctx.strokeStyle = "rgba(148,163,184,0.08)";
    ctx.lineWidth = 1;
    for (let lh = Math.ceil(logHMin); lh <= Math.floor(logHMax); lh++) {
      const x = pad.left + ((lh - logHMin) / (logHMax - logHMin)) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();
    }
    for (let le = Math.ceil(logEMin); le <= Math.floor(logEMax); le++) {
      const y = pad.top + (1 - (le - logEMin) / (logEMax - logEMin)) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    // Axis tick labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (let lh = Math.ceil(logHMin); lh <= Math.floor(logHMax); lh++) {
      const x = pad.left + ((lh - logHMin) / (logHMax - logHMin)) * plotW;
      ctx.fillText(`10${superscript(lh)}`, x, pad.top + plotH + 18);
    }
    ctx.textAlign = "right";
    for (let le = Math.ceil(logEMin); le <= Math.floor(logEMax); le++) {
      const y = pad.top + (1 - (le - logEMin) / (logEMax - logEMin)) * plotH;
      ctx.fillText(`10${superscript(le)}`, pad.left - 6, y + 4);
    }

    // Axis titles
    ctx.fillStyle = "#64748b";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Step Size h", pad.left + plotW / 2, H - 8);
    ctx.save();
    ctx.translate(14, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Global Error (max |x-x_ref|)", 0, 0);
    ctx.restore();

    // Reference lines (theoretical slopes)
    const hRef0 = points[0].h;
    const hRefN = points[points.length - 1].h;

    // O(h) reference line
    const eulerRef0 = points[0].eulerError;
    ctx.strokeStyle = "rgba(248,113,113,0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(hRef0), toY(eulerRef0));
    ctx.lineTo(toX(hRefN), toY(eulerRef0 * (hRefN / hRef0)));
    ctx.stroke();
    ctx.fillStyle = "rgba(248,113,113,0.6)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("O(h)", toX(hRefN) + 3, toY(eulerRef0 * (hRefN / hRef0)));

    // O(h⁴) reference line (using RK4 data)
    const rk4RefIdx = Math.floor(points.length / 2);
    const rk4Ref0 = points[rk4RefIdx].rk4Error;
    ctx.strokeStyle = "rgba(96,165,250,0.25)";
    ctx.beginPath();
    ctx.moveTo(toX(hRef0), toY(rk4Ref0 * Math.pow(hRef0 / points[rk4RefIdx].h, 4)));
    ctx.lineTo(toX(hRefN), toY(rk4Ref0 * Math.pow(hRefN / points[rk4RefIdx].h, 4)));
    ctx.stroke();
    ctx.fillStyle = "rgba(96,165,250,0.6)";
    ctx.fillText("O(h⁴)", toX(hRefN) + 3, toY(rk4Ref0 * Math.pow(hRefN / points[rk4RefIdx].h, 4)));

    ctx.setLineDash([]);

    // Plot lines
    const series = [
      { key: "eulerError" as const, color: "#f87171", label: "Euler" },
      { key: "rk4Error" as const, color: "#60a5fa", label: "RK4" },
      { key: "pcError" as const, color: "#34d399", label: "Pred-Corr" },
    ];

    for (const s of series) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let first = true;
      for (const p of points) {
        const e = p[s.key];
        if (e <= 0) continue;
        if (first) {
          ctx.moveTo(toX(p.h), toY(e));
          first = false;
        } else {
          ctx.lineTo(toX(p.h), toY(e));
        }
      }
      ctx.stroke();

      // Dots
      for (const p of points) {
        const e = p[s.key];
        if (e <= 0) continue;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(toX(p.h), toY(e), 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Title
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Convergence Study — Log-Log Error vs Step Size", W / 2, 18);

    // Slopes annotation
    const annotations = [
      { label: `Euler slope: ${study.eulerSlope.toFixed(2)}`, color: "#f87171", x: pad.left + 10 },
      { label: `RK4 slope: ${study.rk4Slope.toFixed(2)}`, color: "#60a5fa", x: pad.left + 10 },
      { label: `PC slope: ${study.pcSlope.toFixed(2)}`, color: "#34d399", x: pad.left + 10 },
    ];
    annotations.forEach((a, i) => {
      ctx.fillStyle = a.color;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(a.label, pad.left + 5, pad.top + 14 + i * 14);
    });
  }, [study, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, borderRadius: 12, border: "1px solid rgba(148,163,184,0.15)" }}
    />
  );
};

function superscript(n: number): string {
  const sup: Record<string, string> = {
    "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  };
  return String(n)
    .split("")
    .map((c) => sup[c] ?? c)
    .join("");
}
