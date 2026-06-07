import React from "react";
import { ALL_SCENARIOS } from "../core/physicsModel";
import { METHODS } from "../hooks/useSimulation";

export type SimConfig = {
  scenarioIdx: number;
  h: number;
  tEnd: number;
  enabledMethods: Record<string, boolean>;
};

type ControlPanelProps = {
  config: SimConfig;
  onChange: (patch: Partial<SimConfig>) => void;
  isAnimating: boolean;
  onToggleAnimation: () => void;
};

const H_OPTIONS = [
  { value: 0.1, label: "h = 0.1 (coarse)" },
  { value: 0.05, label: "h = 0.05" },
  { value: 0.01, label: "h = 0.01" },
  { value: 0.005, label: "h = 0.005 (fine)" },
  { value: 0.001, label: "h = 0.001 (very fine)" },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onChange,
  isAnimating,
  onToggleAnimation,
}) => {
  const toggleMethod = (key: string) => {
    onChange({
      enabledMethods: {
        ...config.enabledMethods,
        [key]: !config.enabledMethods[key],
      },
    });
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
          <span className="text-lg">⚙️</span> Simulation Controls
        </h2>
        <p className="text-xs text-slate-500">Non-dimensional units: G·M = μ = 1</p>
      </div>

      {/* Scenario */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
          Orbital Scenario
        </label>
        <div className="flex flex-col gap-2">
          {ALL_SCENARIOS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => onChange({ scenarioIdx: i })}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all border ${
                config.scenarioIdx === i
                  ? "border-slate-500 bg-slate-700/80 shadow-inner"
                  : "border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/40"
              }`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <div>
                <div className="text-sm font-semibold text-slate-200">{s.label}</div>
                <div className="text-xs text-slate-500">{s.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step Size */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
          Step Size h
        </label>
        <select
          value={config.h}
          onChange={(e) => onChange({ h: Number(e.target.value) })}
          className="w-full bg-slate-700/80 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {H_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Integration Time */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
          Integration Time (t_end = {config.tEnd.toFixed(1)})
        </label>
        <input
          type="range"
          min={Math.PI}
          max={20 * Math.PI}
          step={Math.PI / 2}
          value={config.tEnd}
          onChange={(e) => onChange({ tEnd: Number(e.target.value) })}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>π ≈ 3.14</span>
          <span>20π ≈ 62.8</span>
        </div>
      </div>

      {/* Methods Toggle */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
          Numerical Methods
        </label>
        <div className="flex flex-col gap-1.5">
          {METHODS.map((m) => (
            <button
              key={m.key}
              onClick={() => toggleMethod(m.key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all border ${
                config.enabledMethods[m.key]
                  ? "border-slate-600 bg-slate-700/60"
                  : "border-slate-700/30 bg-slate-800/20 opacity-50"
              }`}
            >
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: m.color }}
              />
              <span className="text-slate-300">{m.label}</span>
              <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${config.enabledMethods[m.key] ? "bg-slate-600 text-slate-300" : "bg-slate-700 text-slate-500"}`}>
                {config.enabledMethods[m.key] ? "ON" : "OFF"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Animation Toggle */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
          Orbit Animation
        </label>
        <button
          onClick={onToggleAnimation}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isAnimating
              ? "bg-violet-600 hover:bg-violet-500 text-white"
              : "bg-slate-700 hover:bg-slate-600 text-slate-300"
          }`}
        >
          {isAnimating ? "⏸ Pause Animation" : "▶ Play Animation"}
        </button>
      </div>
    </div>
  );
};
