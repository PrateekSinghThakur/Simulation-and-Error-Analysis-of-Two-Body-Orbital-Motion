import React, { useRef, useEffect, useCallback } from "react";

type OrbitSeries = {
  label: string;
  color: string;
  points: { x: number; y: number; t: number }[];
  visible: boolean;
  dashed?: boolean;
};

type OrbitPlotProps = {
  series: OrbitSeries[];
  title: string;
  animFrame?: number;
  showAnimation?: boolean;
  width?: number;
  height?: number;
  lagrangeSeries?: { x: number[]; y: number[] } | null;
  sparseDots?: { x: number; y: number }[];
};

export const OrbitPlot: React.FC<OrbitPlotProps> = ({
  series,
  title,
  animFrame = 0,
  showAnimation = false,
  width = 500,
  height = 500,
  lagrangeSeries = null,
  sparseDots = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Find data bounds
    const allPoints = series
      .filter((s) => s.visible)
      .flatMap((s) => s.points);

    if (allPoints.length === 0) return;

    const xs = allPoints.map((p) => p.x);
    const ys = allPoints.map((p) => p.y);
    if (lagrangeSeries) {
      xs.push(...lagrangeSeries.x);
      ys.push(...lagrangeSeries.y);
    }

    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);

    const pad = 40;
    const dataW = xMax - xMin || 2;
    const dataH = yMax - yMin || 2;
    const margin = 0.15;
    const plotW = W - 2 * pad;
    const plotH = H - 2 * pad;
    const scaleX = plotW / (dataW * (1 + 2 * margin));
    const scaleY = plotH / (dataH * (1 + 2 * margin));
    const scale = Math.min(scaleX, scaleY);
    const cx = W / 2 - ((xMin + xMax) / 2) * scale;
    const cy = H / 2 + ((yMin + yMax) / 2) * scale;

    const toCanvas = (x: number, y: number) => ({
      cx: cx + x * scale,
      cy: cy - y * scale,
    });

    // Grid lines
    ctx.strokeStyle = "rgba(148,163,184,0.08)";
    ctx.lineWidth = 1;
    for (let gx = Math.ceil(xMin - 1); gx <= Math.floor(xMax + 1); gx++) {
      const { cx: gcx } = toCanvas(gx, 0);
      ctx.beginPath();
      ctx.moveTo(gcx, pad);
      ctx.lineTo(gcx, H - pad);
      ctx.stroke();
    }
    for (let gy = Math.ceil(yMin - 1); gy <= Math.floor(yMax + 1); gy++) {
      const { cy: gcy } = toCanvas(0, gy);
      ctx.beginPath();
      ctx.moveTo(pad, gcy);
      ctx.lineTo(W - pad, gcy);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(148,163,184,0.3)";
    ctx.lineWidth = 1;
    const origin = toCanvas(0, 0);
    ctx.beginPath();
    ctx.moveTo(origin.cx, pad);
    ctx.lineTo(origin.cx, H - pad);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pad, origin.cy);
    ctx.lineTo(W - pad, origin.cy);
    ctx.stroke();

    // Central body (sun/star)
    const { cx: scx, cy: scy } = toCanvas(0, 0);
    const gradient = ctx.createRadialGradient(scx, scy, 0, scx, scy, 12);
    gradient.addColorStop(0, "#fef3c7");
    gradient.addColorStop(0.5, "#fbbf24");
    gradient.addColorStop(1, "rgba(251,191,36,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(scx, scy, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.arc(scx, scy, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw Lagrange reconstruction
    if (lagrangeSeries && lagrangeSeries.x.length > 0) {
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i < lagrangeSeries.x.length; i++) {
        const { cx: lx, cy: ly } = toCanvas(lagrangeSeries.x[i], lagrangeSeries.y[i]);
        if (i === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw sparse dots
    for (const dot of sparseDots ?? []) {
      const { cx: dx, cy: dy } = toCanvas(dot.x, dot.y);
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw orbits
    for (const s of series) {
      if (!s.visible || s.points.length < 2) continue;

      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.dashed ? 1.5 : 2;
      if (s.dashed) ctx.setLineDash([5, 3]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      const plotLen = showAnimation
        ? Math.max(2, Math.floor((animFrame / 100) * s.points.length))
        : s.points.length;

      for (let i = 0; i < plotLen; i++) {
        const { cx: px, cy: py } = toCanvas(s.points[i].x, s.points[i].y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated body position
      if (showAnimation && plotLen > 0) {
        const idx = plotLen - 1;
        const { cx: bx, cy: by } = toCanvas(s.points[idx].x, s.points[idx].y);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Glow
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 10);
        glow.addColorStop(0, s.color + "80");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(bx, by, 10, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Title
    ctx.fillStyle = "#e2e8f0";
    ctx.font = `bold ${12 * dpr / dpr}px 'Inter', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(title, W / 2, 20);

    // Axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${10 * dpr / dpr}px 'Inter', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("x (AU)", W / 2, H - 6);
    ctx.save();
    ctx.translate(14, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("y (AU)", 0, 0);
    ctx.restore();
  }, [series, title, animFrame, showAnimation, lagrangeSeries, sparseDots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
    draw();
  }, [width, height, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Legend
  const visibleSeries = series.filter((s) => s.visible);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        style={{ width, height, borderRadius: 12, border: "1px solid rgba(148,163,184,0.15)" }}
      />
      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {visibleSeries.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div
              className="w-6 h-0.5 rounded"
              style={{ backgroundColor: s.color, borderStyle: s.dashed ? "dashed" : "solid" }}
            />
            <span className="text-xs text-slate-400">{s.label}</span>
          </div>
        ))}
        {lagrangeSeries && (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 rounded" style={{ backgroundColor: "#f59e0b", borderStyle: "dashed" }} />
            <span className="text-xs text-slate-400">Lagrange Interp.</span>
          </div>
        )}
      </div>
    </div>
  );
};
