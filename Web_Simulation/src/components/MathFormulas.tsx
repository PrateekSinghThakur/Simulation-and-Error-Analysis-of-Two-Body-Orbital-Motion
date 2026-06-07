import React from "react";

type FormulaBlockProps = {
  title: string;
  children: React.ReactNode;
  color?: string;
};

const FormulaBlock: React.FC<FormulaBlockProps> = ({ title, children, color = "blue" }) => {
  const colorMap: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-950/20",
    emerald: "border-emerald-500/30 bg-emerald-950/20",
    violet: "border-violet-500/30 bg-violet-950/20",
    amber: "border-amber-500/30 bg-amber-950/20",
    red: "border-red-500/30 bg-red-950/20",
  };
  const titleMap: Record<string, string> = {
    blue: "text-blue-400",
    emerald: "text-emerald-400",
    violet: "text-violet-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };
  return (
    <div className={`border rounded-xl p-4 ${colorMap[color]}`}>
      <h3 className={`text-sm font-bold mb-3 ${titleMap[color]}`}>{title}</h3>
      {children}
    </div>
  );
};

const Eq: React.FC<{ children: string; sub?: string }> = ({ children, sub }) => (
  <div className="font-mono text-sm text-slate-200 bg-slate-900/50 rounded px-3 py-1.5 my-1 border border-slate-700/30">
    {children}
    {sub && <span className="text-xs text-slate-500 ml-2">— {sub}</span>}
  </div>
);

export const MathFormulas: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Physical Model */}
      <FormulaBlock title="📐 Equations of Motion (Non-dim.)" color="blue">
        <p className="text-xs text-slate-400 mb-2">State vector: q = [x, y, vₓ, vᵧ]ᵀ</p>
        <Eq sub="position">ẋ = vₓ,  ẏ = vᵧ</Eq>
        <Eq sub="acceleration">v̇ₓ = −μx/r³,  v̇ᵧ = −μy/r³</Eq>
        <Eq sub="radius">r = √(x² + y²),  μ = GM = 1</Eq>
      </FormulaBlock>

      {/* Conservation Laws */}
      <FormulaBlock title="⚡ Physical Invariants" color="emerald">
        <p className="text-xs text-slate-400 mb-2">Must be conserved exactly — violations = numerical error</p>
        <Eq sub="specific energy">E = ½(vₓ²+vᵧ²) − μ/r</Eq>
        <Eq sub="angular momentum">L = x·vᵧ − y·vₓ</Eq>
        <Eq sub="relative error">ΔE/E₀ = |E(t)−E₀| / |E₀|</Eq>
      </FormulaBlock>

      {/* Euler Method */}
      <FormulaBlock title="🔴 Euler Method (1st order)" color="red">
        <p className="text-xs text-slate-400 mb-2">Global error O(h), unstable for stiff systems</p>
        <Eq sub="update">yₙ₊₁ = yₙ + h·f(tₙ, yₙ)</Eq>
        <Eq sub="error">‖E‖ ∝ h¹</Eq>
      </FormulaBlock>

      {/* RK4 */}
      <FormulaBlock title="🔵 Runge-Kutta 4 (4th order)" color="blue">
        <p className="text-xs text-slate-400 mb-2">Gold standard, global error O(h⁴)</p>
        <Eq>k₁ = f(tₙ, yₙ)</Eq>
        <Eq>k₂ = f(tₙ+h/2, yₙ+hk₁/2)</Eq>
        <Eq>k₃ = f(tₙ+h/2, yₙ+hk₂/2)</Eq>
        <Eq>k₄ = f(tₙ+h, yₙ+hk₃)</Eq>
        <Eq sub="update">yₙ₊₁ = yₙ + h(k₁+2k₂+2k₃+k₄)/6</Eq>
      </FormulaBlock>

      {/* Predictor-Corrector */}
      <FormulaBlock title="🟢 Predictor-Corrector (2nd order)" color="emerald">
        <p className="text-xs text-slate-400 mb-2">AB2 predictor + AM2 corrector, startup with RK4</p>
        <Eq sub="AB2 predict">y* = yₙ + h/2·(3fₙ − fₙ₋₁)</Eq>
        <Eq sub="AM2 correct">yₙ₊₁ = yₙ + h/2·(f* + fₙ)</Eq>
        <Eq sub="error">‖E‖ ∝ h²</Eq>
      </FormulaBlock>

      {/* Adaptive RK4 */}
      <FormulaBlock title="🟣 Adaptive RK4 (auto step control)" color="violet">
        <p className="text-xs text-slate-400 mb-2">Richardson extrapolation for local error estimate</p>
        <Eq sub="full step">y₁ = RK4(yₙ, h)</Eq>
        <Eq sub="two half-steps">y₂ = RK4(RK4(yₙ, h/2), h/2)</Eq>
        <Eq sub="error estimate">ε = ‖y₂−y₁‖/15</Eq>
        <Eq sub="step control">hₙₑₓₜ = 0.9·h·(tol/ε)^(1/5)</Eq>
      </FormulaBlock>
    </div>
  );
};

export const OrbitalElementsCard: React.FC<{
  elements: { a: number; e: number; E: number; L: number };
  scenario: string;
  color: string;
}> = ({ elements, scenario, color }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-bold text-slate-200">{scenario} — Orbital Elements</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Semi-major axis a", value: isFinite(elements.a) ? elements.a.toFixed(4) : "∞ (unbound)", unit: " AU" },
          { label: "Eccentricity e", value: elements.e.toFixed(4), unit: "" },
          { label: "Total Energy E₀", value: elements.E.toFixed(6), unit: "" },
          { label: "Angular Mom. L₀", value: elements.L.toFixed(6), unit: "" },
        ].map((item) => (
          <div key={item.label} className="bg-slate-900/40 rounded-lg px-3 py-2">
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className="text-sm font-mono font-semibold text-slate-200">
              {item.value}{item.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
