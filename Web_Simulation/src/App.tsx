import { useState, useEffect, useRef, useCallback } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { OrbitPlot } from "./components/OrbitPlot";
import { InvariantsChart } from "./components/InvariantsChart";
import { ConvergencePlot } from "./components/ConvergencePlot";
import { SummaryTable } from "./components/SummaryTable";
import { MathFormulas, OrbitalElementsCard } from "./components/MathFormulas";
import { SensitivityOrbitChart, SensitivityBarChart } from "./components/SensitivityChart";
import { useSimulation } from "./hooks/useSimulation";

type Tab = "orbits" | "invariants" | "convergence" | "sensitivity" | "lagrange" | "theory";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "orbits", label: "Orbit Plots", icon: "🪐" },
  { key: "invariants", label: "Error Analysis", icon: "📈" },
  { key: "convergence", label: "Convergence Study", icon: "📉" },
  { key: "sensitivity", label: "Step-Size Sensitivity", icon: "🔬" },
  { key: "lagrange", label: "Lagrange Interpolation", icon: "📡" },
  { key: "theory", label: "Theory & Equations", icon: "📐" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("orbits");
  const [config, setConfig] = useState<{
    scenarioIdx: number;
    h: number;
    tEnd: number;
    enabledMethods: Record<string, boolean>;
  }>({
    scenarioIdx: 0,
    h: 0.05,
    tEnd: 4 * Math.PI,
    enabledMethods: { euler: true, rk4: true, pc: true, ark4: true },
  });

  const [animFrame, setAnimFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animRef = useRef<number | null>(null);
  const animStartRef = useRef<number>(0);

  const sim = useSimulation(config);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!animStartRef.current) animStartRef.current = timestamp;
    const elapsed = timestamp - animStartRef.current;
    const duration = 6000; // ms for full orbit
    const pct = ((elapsed % duration) / duration) * 100;
    setAnimFrame(pct);
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      animStartRef.current = 0;
      animRef.current = requestAnimationFrame(animate);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, animate]);

  const handleConfigChange = (patch: Partial<typeof config>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  // Build orbit series
  const orbitSeries = [
    {
      label: "Reference (RK4 fine)",
      color: "#475569",
      points: sim.refOrbit,
      visible: true,
      dashed: true,
    },
    {
      label: "Euler",
      color: "#f87171",
      points: sim.eulerOrbit,
      visible: config.enabledMethods.euler,
    },
    {
      label: "RK4",
      color: "#60a5fa",
      points: sim.rk4Orbit,
      visible: config.enabledMethods.rk4,
    },
    {
      label: "Predictor-Corrector",
      color: "#34d399",
      points: sim.pcOrbit,
      visible: config.enabledMethods.pc,
    },
    {
      label: "Adaptive RK4",
      color: "#a78bfa",
      points: sim.ark4Orbit,
      visible: config.enabledMethods.ark4,
    },
  ];

  // Sparse dots for Lagrange
  const sparseDots = sim.sparseStates.map((s) => ({ x: s[0], y: s[1] }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <div className="text-2xl">🌌</div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 leading-tight">
              Two-Body Orbital Simulation
            </h1>
            <p className="text-xs text-slate-500">
              Numerical Methods & Error Analysis — Euler · RK4 · Pred-Corr · Adaptive RK4
            </p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 font-mono">μ = GM = 1</span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 font-mono">
              h = {config.h}
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 font-mono">
              t ∈ [0, {config.tEnd.toFixed(2)}]
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col xl:flex-row gap-6">
        {/* Sidebar */}
        <aside className="xl:w-72 flex-shrink-0">
          <ControlPanel
            config={config}
            onChange={handleConfigChange}
            isAnimating={isPlaying}
            onToggleAnimation={() => setIsPlaying((p) => !p)}
          />

          {/* Orbital elements */}
          <div className="mt-4">
            <OrbitalElementsCard
              elements={sim.orbElem}
              scenario={sim.scenario.label}
              color={sim.scenario.color}
            />
          </div>

          {/* Quick Stats */}
          <div className="mt-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
              Solver Performance
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { key: "euler", label: "Euler", color: "#f87171" },
                { key: "rk4", label: "RK4", color: "#60a5fa" },
                { key: "pc", label: "Pred-Corr", color: "#34d399" },
                { key: "ark4", label: "Adaptive RK4", color: "#a78bfa" },
              ].map((m) => {
                const s = sim.summaryStats[m.key as keyof typeof sim.summaryStats];
                return (
                  <div key={m.key} className="flex items-center justify-between text-xs">
                    <span style={{ color: m.color }} className="font-medium">{m.label}</span>
                    <span className="font-mono text-slate-400">
                      ΔE: {s.finalEnergyRelErr.toExponential(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Tab Nav */}
          <nav className="flex flex-wrap gap-1 mb-6 bg-slate-900/50 rounded-xl p-1.5 border border-slate-800">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key
                    ? "bg-slate-700 text-slate-100 shadow"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>

          {/* ── TAB: Orbit Plots ────────────────────────────────── */}
          {tab === "orbits" && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-200">Orbital Trajectories</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {sim.scenario.label} orbit — {sim.scenario.expectedOrbit} — comparing all numerical methods
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPlaying && (
                      <span className="text-xs text-violet-400 animate-pulse font-medium">
                        ● Animating
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-center justify-center">
                  <OrbitPlot
                    series={orbitSeries}
                    title={`${sim.scenario.label} Orbit — All Methods`}
                    animFrame={animFrame}
                    showAnimation={isPlaying}
                    width={480}
                    height={480}
                  />

                  <div className="flex flex-col gap-4">
                    {/* Individual method orbits */}
                    {[
                      { s: sim.eulerOrbit, label: "Euler", color: "#f87171", key: "euler" },
                      { s: sim.rk4Orbit, label: "RK4", color: "#60a5fa", key: "rk4" },
                      { s: sim.pcOrbit, label: "Pred-Corr", color: "#34d399", key: "pc" },
                      { s: sim.ark4Orbit, label: "Adaptive RK4", color: "#a78bfa", key: "ark4" },
                    ]
                      .filter((m) => config.enabledMethods[m.key])
                      .slice(0, 2)
                      .map((m) => (
                        <OrbitPlot
                          key={m.label}
                          series={[
                            { label: "Reference", color: "#475569", points: sim.refOrbit, visible: true, dashed: true },
                            { label: m.label, color: m.color, points: m.s, visible: true },
                          ]}
                          title={`${m.label} vs Reference`}
                          width={220}
                          height={220}
                        />
                      ))}
                  </div>
                </div>
              </div>

              {/* Summary Table */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-base font-bold text-slate-200 mb-1">Accuracy Summary</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Relative errors in conserved quantities — smaller is better
                </p>
                <SummaryTable stats={sim.summaryStats} />
              </div>
            </div>
          )}

          {/* ── TAB: Invariants / Error Analysis ────────────────── */}
          {tab === "invariants" && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-base font-bold text-slate-200 mb-1">
                  Physical Invariant Conservation
                </h2>
                <p className="text-xs text-slate-500 mb-5">
                  Both energy E and angular momentum L should be exactly conserved.
                  Violations are pure numerical error — logarithmic scale reveals method quality.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InvariantsChart
                    data={sim.combinedInvariantData}
                    mode="energy"
                    enabledMethods={config.enabledMethods}
                    title="Relative Energy Error |ΔE/E₀| vs Time (log scale)"
                  />
                  <InvariantsChart
                    data={sim.combinedInvariantData}
                    mode="angmom"
                    enabledMethods={config.enabledMethods}
                    title="Relative Angular Momentum Error |ΔL/L₀| vs Time (log scale)"
                  />
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-base font-bold text-slate-200 mb-1">Error Analysis Summary</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Key insight: Angular momentum is a stronger invariant — typically better conserved than energy.
                  Euler shows secular drift; RK4/Adaptive RK4 show bounded oscillation.
                </p>
                <SummaryTable stats={sim.summaryStats} />

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Euler drift", desc: "Energy increases monotonically — characteristic of symplectic instability", color: "bg-red-900/30 border-red-700/40" },
                    { label: "RK4 stable", desc: "Energy oscillates but stays bounded — near-symplectic behaviour", color: "bg-blue-900/30 border-blue-700/40" },
                    { label: "PC moderate", desc: "Between Euler and RK4 — good for lower computational cost", color: "bg-emerald-900/30 border-emerald-700/40" },
                    { label: "Adaptive best", desc: "Automatic step control keeps error below tolerance at all times", color: "bg-violet-900/30 border-violet-700/40" },
                  ].map((card) => (
                    <div key={card.label} className={`border rounded-xl p-3 ${card.color}`}>
                      <div className="text-xs font-bold text-slate-200 mb-1">{card.label}</div>
                      <div className="text-xs text-slate-400">{card.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Convergence Study ───────────────────────────── */}
          {tab === "convergence" && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-base font-bold text-slate-200 mb-1">
                  Convergence Study — Order of Accuracy
                </h2>
                <p className="text-xs text-slate-500 mb-5">
                  Log-log plot of global error vs step size h. Slope = empirical order of convergence.
                  Reference solution: RK4 with h = 10⁻⁴.
                </p>

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <ConvergencePlot study={sim.convStudy} width={520} height={360} />

                  <div className="flex flex-col gap-4 flex-1">
                    {/* Slope summary */}
                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
                      <h3 className="text-sm font-bold text-slate-200 mb-3">
                        Empirical Convergence Orders
                      </h3>
                      {[
                        {
                          method: "Euler",
                          empirical: sim.convStudy.eulerSlope.toFixed(2),
                          theoretical: "1.00",
                          color: "#f87171",
                        },
                        {
                          method: "RK4",
                          empirical: sim.convStudy.rk4Slope.toFixed(2),
                          theoretical: "4.00",
                          color: "#60a5fa",
                        },
                        {
                          method: "Pred-Corr",
                          empirical: sim.convStudy.pcSlope.toFixed(2),
                          theoretical: "2.00",
                          color: "#34d399",
                        },
                      ].map((row) => (
                        <div
                          key={row.method}
                          className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0"
                        >
                          <span style={{ color: row.color }} className="text-sm font-medium">
                            {row.method}
                          </span>
                          <div className="flex gap-4 text-xs font-mono">
                            <span className="text-slate-400">
                              Theory: <span className="text-slate-200">O(h^{row.theoretical})</span>
                            </span>
                            <span className="text-slate-400">
                              Empirical: <span className="text-slate-200">O(h^{row.empirical})</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Raw data table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-700/40">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-800/80 border-b border-slate-700">
                            <th className="text-left px-3 py-2 text-slate-400">h</th>
                            <th className="text-right px-3 py-2 text-red-400">Euler err</th>
                            <th className="text-right px-3 py-2 text-blue-400">RK4 err</th>
                            <th className="text-right px-3 py-2 text-emerald-400">PC err</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sim.convStudy.points.map((p, i) => (
                            <tr
                              key={i}
                              className={`border-b border-slate-700/30 ${i % 2 === 0 ? "bg-slate-800/20" : ""}`}
                            >
                              <td className="px-3 py-1.5 font-mono text-slate-300">
                                {p.h.toExponential(2)}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-right text-red-400">
                                {p.eulerError.toExponential(3)}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-right text-blue-400">
                                {p.rk4Error.toExponential(3)}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-right text-emerald-400">
                                {p.pcError.toExponential(3)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-amber-950/30 border border-amber-700/30 rounded-xl p-3 text-xs text-amber-300">
                      <strong>📖 Reading the plot:</strong> A slope of 1 on a log-log plot means the error
                      decreases linearly with h (Euler). A slope of 4 means error decreases as h⁴ (RK4) —
                      10× smaller h gives 10,000× more accuracy.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Step-Size Sensitivity ───────────────────────── */}
          {tab === "sensitivity" && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-base font-bold text-slate-200 mb-1">Step-Size Sensitivity Analysis</h2>
                <p className="text-xs text-slate-500 mb-5">
                  Same orbit simulated with h = 0.1, 0.01, 0.001. Observe orbit distortion and invariant drift.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-red-400 mb-3 text-center">
                      Euler Method — Step Size Comparison
                    </h3>
                    <SensitivityOrbitChart
                      data={sim.sensitivityEuler}
                      title="Euler — h sensitivity"
                      width={340}
                      height={340}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-400 mb-3 text-center">
                      RK4 Method — Step Size Comparison
                    </h3>
                    <SensitivityOrbitChart
                      data={sim.sensitivityRK4}
                      title="RK4 — h sensitivity"
                      width={340}
                      height={340}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-base font-bold text-slate-200 mb-1">
                  Invariant Drift vs Step Size
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Comparing final relative energy and angular momentum errors across methods and step sizes.
                </p>
                <SensitivityBarChart
                  eulerData={sim.sensitivityEuler}
                  rk4Data={sim.sensitivityRK4}
                />

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {sim.sensitivityEuler.map((e, i) => (
                    <div
                      key={i}
                      className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3"
                    >
                      <div className="text-xs font-bold text-slate-300 mb-2">{e.label}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span style={{ color: e.color }}>Euler steps</span>
                          <span className="font-mono text-slate-300">{e.result.steps.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-400">RK4 steps</span>
                          <span className="font-mono text-slate-300">
                            {sim.sensitivityRK4[i]?.result.steps.toLocaleString() ?? "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Lagrange Interpolation ─────────────────────── */}
          {tab === "lagrange" && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-base font-bold text-slate-200 mb-1">
                  Lagrange Interpolation Module
                </h2>
                <p className="text-xs text-slate-500 mb-5">
                  Sparse RK4 trajectory points are used as interpolation nodes.
                  Lagrange polynomial reconstruction is compared against the dense RK4 reference.
                  This demonstrates numerical approximation beyond ODE solving.
                </p>

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <OrbitPlot
                    series={[
                      {
                        label: "RK4 Reference",
                        color: "#475569",
                        points: sim.rk4Orbit,
                        visible: true,
                        dashed: true,
                      },
                    ]}
                    title="Lagrange Reconstruction vs RK4 Reference"
                    width={460}
                    height={460}
                    lagrangeSeries={{
                      x: sim.lagrangeOrbit.x,
                      y: sim.lagrangeOrbit.y,
                    }}
                    sparseDots={sparseDots}
                  />

                  <div className="flex flex-col gap-4 flex-1">
                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
                      <h3 className="text-sm font-bold text-slate-200 mb-3">
                        Interpolation Configuration
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Sparse nodes (●)</span>
                          <span className="font-mono text-slate-200">{sim.sparseStates.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Polynomial degree</span>
                          <span className="font-mono text-slate-200">{sim.sparseStates.length - 1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reconstructed points</span>
                          <span className="font-mono text-slate-200">400</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Method</span>
                          <span className="font-mono text-slate-200">Global Lagrange</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
                      <h3 className="text-sm font-bold text-slate-200 mb-2">Algorithm</h3>
                      <div className="font-mono text-xs bg-slate-900/60 rounded-lg p-3 space-y-1 text-slate-300 border border-slate-700/30">
                        <div className="text-slate-500">{`// Lagrange basis polynomial`}</div>
                        <div>L_k(t) = ∏ (t−tⱼ)/(tₖ−tⱼ)</div>
                        <div className="text-slate-500 mt-1">{`// Interpolated value`}</div>
                        <div>p(t) = Σ yₖ · L_k(t)</div>
                        <div className="text-slate-500 mt-1">{`// Applied to each component`}</div>
                        <div>x(t), y(t), vₓ(t), vᵧ(t)</div>
                      </div>
                    </div>

                    <div className="bg-amber-950/30 border border-amber-700/30 rounded-xl p-3 text-xs text-amber-300">
                      <strong>⚠️ Runge's Phenomenon:</strong> High-degree Lagrange interpolation with equally-spaced nodes
                      can exhibit wild oscillations near the endpoints. This is visible for escape trajectories.
                      Use Chebyshev nodes or spline interpolation for production applications.
                    </div>

                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
                      <h3 className="text-sm font-bold text-slate-200 mb-2">Sparse Node Positions</h3>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-xs font-mono">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left text-slate-400 py-1">k</th>
                              <th className="text-right text-slate-400 py-1">t</th>
                              <th className="text-right text-slate-400 py-1">x</th>
                              <th className="text-right text-slate-400 py-1">y</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sim.sparseStates.map((s, i) => (
                              <tr key={i} className="border-b border-slate-700/20">
                                <td className="text-slate-500 py-0.5">{i}</td>
                                <td className="text-right text-slate-400">
                                  {sim.lagrangeNodes[i]?.toFixed(3) ?? "—"}
                                </td>
                                <td className="text-right text-amber-400">{s[0].toFixed(4)}</td>
                                <td className="text-right text-amber-400">{s[1].toFixed(4)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Theory & Equations ─────────────────────────── */}
          {tab === "theory" && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-base font-bold text-slate-200 mb-1">
                  Mathematical Formulation
                </h2>
                <p className="text-xs text-slate-500 mb-5">
                  Complete mathematical model for the two-body gravitational problem formulated as a first-order IVP.
                </p>
                <MathFormulas />
              </div>

              {/* Scenario-specific theory */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-base font-bold text-slate-200 mb-4">
                  Orbital Mechanics Reference
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      title: "🔵 Circular Orbit",
                      color: "#60a5fa",
                      items: [
                        "v = √(μ/r) — exact circular velocity",
                        "e = 0, constant radius r",
                        "E = −μ/(2a) < 0 (bound)",
                        "L = r·v = const, perfect conservation",
                        "Best validation: methods should trace perfect circle",
                      ],
                    },
                    {
                      title: "🟢 Elliptical Orbit",
                      color: "#34d399",
                      items: [
                        "v < v_circ — sub-circular velocity",
                        "0 < e < 1, semi-major axis a > r₀",
                        "Perihelion + aphelion defined by vis-viva",
                        "E < 0 (bound), L oscillates in direction",
                        "Tests symmetry and error accumulation over orbit",
                      ],
                    },
                    {
                      title: "🔴 Escape Trajectory",
                      color: "#f87171",
                      items: [
                        "v = √(2μ/r) — escape velocity",
                        "e = 1 (parabolic), E = 0",
                        "Body escapes to infinity",
                        "Tests solver near singularity (close approach)",
                        "Euler will fail dramatically — good demo",
                      ],
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4"
                    >
                      <h3
                        className="text-sm font-bold mb-3"
                        style={{ color: card.color }}
                      >
                        {card.title}
                      </h3>
                      <ul className="space-y-1.5">
                        {card.items.map((item, i) => (
                          <li key={i} className="text-xs text-slate-400 flex gap-2">
                            <span className="text-slate-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation framework */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-base font-bold text-slate-200 mb-4">
                  Validation Framework
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-200 mb-3">Reference Solution</h3>
                    <ul className="space-y-1 text-xs text-slate-400">
                      <li>• RK4 with h = 10⁻⁴ (very fine)</li>
                      <li>• Serves as "ground truth" for error analysis</li>
                      <li>• All methods compared against this</li>
                      <li>• Global error: max‖x(t) − x_ref(t)‖₂</li>
                    </ul>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-200 mb-3">Error Metrics</h3>
                    <ul className="space-y-1 text-xs text-slate-400">
                      <li>• Relative energy error: |ΔE/E₀|</li>
                      <li>• Relative angular momentum: |ΔL/L₀|</li>
                      <li>• Global position error vs reference</li>
                      <li>• Log-log convergence slope (empirical order)</li>
                    </ul>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-200 mb-3">Non-Dimensionalisation</h3>
                    <ul className="space-y-1 text-xs text-slate-400">
                      <li>• Length scale: r₀ = 1 (initial separation)</li>
                      <li>• Time scale: T = √(r₀³/GM)</li>
                      <li>• GM = μ = 1 by definition</li>
                      <li>• Circular period: T_circ = 2π (exact)</li>
                    </ul>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-200 mb-3">Code Architecture</h3>
                    <ul className="space-y-1 text-xs text-slate-400">
                      <li>• <code className="text-blue-400">core/physicsModel.ts</code> — IVP formulation</li>
                      <li>• <code className="text-blue-400">core/solvers.ts</code> — all 4 numerical methods</li>
                      <li>• <code className="text-blue-400">core/analysis.ts</code> — invariants, convergence</li>
                      <li>• <code className="text-blue-400">core/lagrangeInterp.ts</code> — interpolation</li>
                      <li>• <code className="text-blue-400">hooks/useSimulation.ts</code> — reactive computation</li>
                      <li>• <code className="text-blue-400">components/*.tsx</code> — visualisation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-8 py-4 text-center text-xs text-slate-600">
        Two-Body Orbital Simulation · Numerical Methods & Computations Project ·
        Euler · RK4 · Adams–Bashforth/Moulton · Adaptive RK4
      </footer>
    </div>
  );
}
