/**
 * Analysis Module
 * Energy, angular momentum tracking, convergence study, error norms
 */

import { StateVector, computeEnergy, computeAngularMomentum } from "./physicsModel";
import {
  SolverResult,
  eulerSolve,
  rk4Solve,
  predictorCorrectorSolve,
  computeGlobalError,
  referenceSolve,
} from "./solvers";

export type InvariantTimeSeries = {
  t: number[];
  energy: number[];
  angMom: number[];
  energyRelErr: number[];
  angMomRelErr: number[];
};

/**
 * Compute energy and angular momentum time series from a solver result
 */
export function computeInvariants(result: SolverResult): InvariantTimeSeries {
  const { t, states } = result;
  const energy: number[] = [];
  const angMom: number[] = [];
  const energyRelErr: number[] = [];
  const angMomRelErr: number[] = [];

  const E0 = computeEnergy(states[0]);
  const L0 = computeAngularMomentum(states[0]);

  for (let i = 0; i < states.length; i++) {
    const E = computeEnergy(states[i]);
    const L = computeAngularMomentum(states[i]);
    energy.push(E);
    angMom.push(L);
    energyRelErr.push(Math.abs((E - E0) / (Math.abs(E0) + 1e-15)));
    angMomRelErr.push(Math.abs((L - L0) / (Math.abs(L0) + 1e-15)));
  }

  return { t, energy, angMom, energyRelErr, angMomRelErr };
}

// ─────────────────────────────────────────────────────────────
// Convergence Study
// ─────────────────────────────────────────────────────────────

export type ConvergencePoint = {
  h: number;
  eulerError: number;
  rk4Error: number;
  pcError: number;
};

export type ConvergenceStudy = {
  points: ConvergencePoint[];
  eulerSlope: number;
  rk4Slope: number;
  pcSlope: number;
};

/**
 * Run convergence study for multiple step sizes
 * Uses fine-step RK4 as reference
 */
export function runConvergenceStudy(
  initialState: StateVector,
  tEnd: number,
  stepSizes: number[] = [0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001]
): ConvergenceStudy {
  // Reference solution
  const ref = referenceSolve(initialState, tEnd);

  const points: ConvergencePoint[] = [];

  for (const h of stepSizes) {
    const euler = eulerSolve(initialState, tEnd, h);
    const rk4 = rk4Solve(initialState, tEnd, h);
    const pc = predictorCorrectorSolve(initialState, tEnd, h);

    points.push({
      h,
      eulerError: computeGlobalError(euler, ref),
      rk4Error: computeGlobalError(rk4, ref),
      pcError: computeGlobalError(pc, ref),
    });
  }

  // Compute empirical slopes via linear regression on log-log data
  const logH = points.map((p) => Math.log10(p.h));

  function slope(errors: number[]): number {
    const logE = errors.map((e) => Math.log10(Math.max(e, 1e-16)));
    const n = logH.length;
    const meanH = logH.reduce((a, b) => a + b, 0) / n;
    const meanE = logE.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (logH[i] - meanH) * (logE[i] - meanE);
      den += (logH[i] - meanH) ** 2;
    }
    return den > 0 ? num / den : 0;
  }

  return {
    points,
    eulerSlope: slope(points.map((p) => p.eulerError)),
    rk4Slope: slope(points.map((p) => p.rk4Error)),
    pcSlope: slope(points.map((p) => p.pcError)),
  };
}

// ─────────────────────────────────────────────────────────────
// Step Size Sensitivity
// ─────────────────────────────────────────────────────────────

export type StepSizeSensitivity = {
  h: number;
  label: string;
  color: string;
  result: SolverResult;
  invariants: InvariantTimeSeries;
  finalEnergyRelErr: number;
  finalAngMomRelErr: number;
};

export function runStepSizeSensitivity(
  initialState: StateVector,
  tEnd: number,
  method: "euler" | "rk4" | "pc" = "rk4"
): StepSizeSensitivity[] {
  const configs = [
    { h: 0.1, label: "h = 0.1", color: "#f87171" },
    { h: 0.01, label: "h = 0.01", color: "#fbbf24" },
    { h: 0.001, label: "h = 0.001", color: "#34d399" },
  ];

  return configs.map(({ h, label, color }) => {
    const result =
      method === "euler"
        ? eulerSolve(initialState, tEnd, h)
        : method === "pc"
        ? predictorCorrectorSolve(initialState, tEnd, h)
        : rk4Solve(initialState, tEnd, h);
    const invariants = computeInvariants(result);
    const n = invariants.energyRelErr.length - 1;
    return {
      h,
      label,
      color,
      result,
      invariants,
      finalEnergyRelErr: invariants.energyRelErr[n],
      finalAngMomRelErr: invariants.angMomRelErr[n],
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Downsample a time series for plotting performance
// ─────────────────────────────────────────────────────────────

export function downsample<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = arr.length / maxPoints;
  const out: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    out.push(arr[Math.round(i * step)]);
  }
  return out;
}

export function downsampleResult(
  result: SolverResult,
  maxPoints: number
): { t: number[]; states: StateVector[] } {
  const indices = downsample(
    Array.from({ length: result.t.length }, (_, i) => i),
    maxPoints
  );
  return {
    t: indices.map((i) => result.t[i]),
    states: indices.map((i) => result.states[i]),
  };
}
