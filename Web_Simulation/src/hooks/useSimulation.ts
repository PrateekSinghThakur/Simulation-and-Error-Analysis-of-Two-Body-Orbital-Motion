/**
 * Main simulation hook — runs all computations and caches results
 */

import { useMemo, useState } from "react";
import { StateVector, ALL_SCENARIOS, OrbitalScenario, computeOrbitalElements } from "../core/physicsModel";
import { eulerSolve, rk4Solve, predictorCorrectorSolve, adaptiveRK4Solve, referenceSolve } from "../core/solvers";
import { computeInvariants, runConvergenceStudy, runStepSizeSensitivity, downsample, downsampleResult } from "../core/analysis";
import { sampleSparse, reconstructOrbit } from "../core/lagrangeInterpolation";

export type MethodConfig = {
  label: string;
  key: string;
  color: string;
  lineStyle?: string;
};

export const METHODS: MethodConfig[] = [
  { label: "Euler", key: "euler", color: "#f87171" },
  { label: "RK4", key: "rk4", color: "#60a5fa" },
  { label: "Predictor-Corrector", key: "pc", color: "#34d399" },
  { label: "Adaptive RK4", key: "ark4", color: "#a78bfa" },
];

export type SimulationConfig = {
  scenarioIdx: number;
  h: number;
  tEnd: number;
  enabledMethods: Record<string, boolean>;
};

const MAX_PLOT_POINTS = 800;

export function useSimulation(config: SimulationConfig) {
  const { scenarioIdx, h, tEnd, enabledMethods } = config;
  const scenario: OrbitalScenario = ALL_SCENARIOS[scenarioIdx];
  const initState: StateVector = scenario.state;

  return useMemo(() => {
    // ── Run all solvers ──────────────────────────────────────
    const eulerRes = eulerSolve(initState, tEnd, h);
    const rk4Res = rk4Solve(initState, tEnd, h);
    const pcRes = predictorCorrectorSolve(initState, tEnd, h);
    const ark4Res = adaptiveRK4Solve(initState, tEnd, h, 1e-7);
    const refRes = referenceSolve(initState, tEnd);

    // ── Orbital elements ─────────────────────────────────────
    const orbElem = computeOrbitalElements(initState);

    // ── Invariants ───────────────────────────────────────────
    const eulerInv = computeInvariants(eulerRes);
    const rk4Inv = computeInvariants(rk4Res);
    const pcInv = computeInvariants(pcRes);
    const ark4Inv = computeInvariants(ark4Res);

    // ── Orbit plot data (downsampled) ─────────────────────────
    function orbitPoints(res: typeof eulerRes) {
      const ds = downsampleResult(res, MAX_PLOT_POINTS);
      return ds.states.map((s, i) => ({ x: s[0], y: s[1], t: ds.t[i] }));
    }
    const refOrbit = orbitPoints(refRes);
    const eulerOrbit = orbitPoints(eulerRes);
    const rk4Orbit = orbitPoints(rk4Res);
    const pcOrbit = orbitPoints(pcRes);
    const ark4Orbit = orbitPoints(ark4Res);

    // Combined chart data for energy & angular momentum
    function buildCombinedInvariantData(maxPts = MAX_PLOT_POINTS) {
      const refT = downsample(refRes.t, maxPts);
      return refT.map((t, i) => {
        const ti = refRes.t[Math.round(i * (refRes.t.length / maxPts))];
        const row: Record<string, number> = { t: ti ?? t };
        // interpolated index for each method
        const findIdx = (arr: number[], tv: number) => {
          let best = 0;
          let bestDiff = Infinity;
          for (let j = 0; j < arr.length; j++) {
            const diff = Math.abs(arr[j] - tv);
            if (diff < bestDiff) { bestDiff = diff; best = j; }
          }
          return best;
        };
        const eiIdx = findIdx(eulerInv.t, ti ?? t);
        const riIdx = findIdx(rk4Inv.t, ti ?? t);
        const piIdx = findIdx(pcInv.t, ti ?? t);
        const aiIdx = findIdx(ark4Inv.t, ti ?? t);
        row.euler_eRel = eulerInv.energyRelErr[eiIdx] ?? 0;
        row.rk4_eRel = rk4Inv.energyRelErr[riIdx] ?? 0;
        row.pc_eRel = pcInv.energyRelErr[piIdx] ?? 0;
        row.ark4_eRel = ark4Inv.energyRelErr[aiIdx] ?? 0;
        row.euler_lRel = eulerInv.angMomRelErr[eiIdx] ?? 0;
        row.rk4_lRel = rk4Inv.angMomRelErr[riIdx] ?? 0;
        row.pc_lRel = pcInv.angMomRelErr[piIdx] ?? 0;
        row.ark4_lRel = ark4Inv.angMomRelErr[aiIdx] ?? 0;
        return row;
      });
    }

    const combinedInvariantData = buildCombinedInvariantData();

    // ── Convergence study (only for circular orbit for clarity) ──
    const convStudy = runConvergenceStudy(initState, Math.min(tEnd, 2 * Math.PI));

    // ── Step size sensitivity ────────────────────────────────
    const sensitivityRK4 = runStepSizeSensitivity(initState, tEnd, "rk4");
    const sensitivityEuler = runStepSizeSensitivity(initState, tEnd, "euler");

    // ── Lagrange interpolation ───────────────────────────────
    const { nodes: lagrangeNodes, sparseStates } = sampleSparse(
      rk4Res.t, rk4Res.states, 9  // 9 sparse nodes
    );
    const lagrangeOrbit = reconstructOrbit(lagrangeNodes, sparseStates, 400);

    // ── Summary stats ─────────────────────────────────────────
    const summaryStats = {
      euler: {
        steps: eulerRes.steps,
        finalEnergyRelErr: eulerInv.energyRelErr[eulerInv.energyRelErr.length - 1],
        finalAngMomRelErr: eulerInv.angMomRelErr[eulerInv.angMomRelErr.length - 1],
        maxEnergyRelErr: Math.max(...eulerInv.energyRelErr),
        maxAngMomRelErr: Math.max(...eulerInv.angMomRelErr),
      },
      rk4: {
        steps: rk4Res.steps,
        finalEnergyRelErr: rk4Inv.energyRelErr[rk4Inv.energyRelErr.length - 1],
        finalAngMomRelErr: rk4Inv.angMomRelErr[rk4Inv.angMomRelErr.length - 1],
        maxEnergyRelErr: Math.max(...rk4Inv.energyRelErr),
        maxAngMomRelErr: Math.max(...rk4Inv.angMomRelErr),
      },
      pc: {
        steps: pcRes.steps,
        finalEnergyRelErr: pcInv.energyRelErr[pcInv.energyRelErr.length - 1],
        finalAngMomRelErr: pcInv.angMomRelErr[pcInv.angMomRelErr.length - 1],
        maxEnergyRelErr: Math.max(...pcInv.energyRelErr),
        maxAngMomRelErr: Math.max(...pcInv.angMomRelErr),
      },
      ark4: {
        steps: ark4Res.steps,
        rejectedSteps: ark4Res.rejectedSteps ?? 0,
        finalEnergyRelErr: ark4Inv.energyRelErr[ark4Inv.energyRelErr.length - 1],
        finalAngMomRelErr: ark4Inv.angMomRelErr[ark4Inv.angMomRelErr.length - 1],
        maxEnergyRelErr: Math.max(...ark4Inv.energyRelErr),
        maxAngMomRelErr: Math.max(...ark4Inv.angMomRelErr),
      },
    };

    return {
      scenario,
      orbElem,
      eulerRes, rk4Res, pcRes, ark4Res, refRes,
      eulerInv, rk4Inv, pcInv, ark4Inv,
      eulerOrbit, rk4Orbit, pcOrbit, ark4Orbit, refOrbit,
      combinedInvariantData,
      convStudy,
      sensitivityRK4,
      sensitivityEuler,
      lagrangeNodes,
      sparseStates,
      lagrangeOrbit,
      summaryStats,
      enabledMethods,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIdx, h, tEnd]);
}

export function useAnimationState() {
  const [animFrame, setAnimFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  return { animFrame, setAnimFrame, isPlaying, setIsPlaying };
}
