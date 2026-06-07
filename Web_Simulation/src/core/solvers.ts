/**
 * Numerical ODE Solvers for Two-Body Orbital Motion
 * Implements: Euler, RK4, Predictor-Corrector (AB2-AM2), Adaptive RK4
 */

import { StateVector, derivatives } from "./physicsModel";

export type SolverResult = {
  t: number[];
  states: StateVector[];
  steps: number;
  rejectedSteps?: number;
};

// ─────────────────────────────────────────────────────────────
// Vector arithmetic helpers
// ─────────────────────────────────────────────────────────────

function vecAdd(a: StateVector, b: StateVector): StateVector {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

function vecScale(a: StateVector, s: number): StateVector {
  return [a[0] * s, a[1] * s, a[2] * s, a[3] * s];
}

function vecNorm(a: StateVector): number {
  return Math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2 + a[3] ** 2);
}

// ─────────────────────────────────────────────────────────────
// 1. Euler Method (O(h) — first-order)
// ─────────────────────────────────────────────────────────────

export function eulerSolve(
  initialState: StateVector,
  tEnd: number,
  h: number
): SolverResult {
  const t: number[] = [0];
  const states: StateVector[] = [initialState];
  let state = initialState;
  let time = 0;
  let steps = 0;

  while (time < tEnd - 1e-12) {
    const dt = Math.min(h, tEnd - time);
    const f = derivatives(state);
    state = vecAdd(state, vecScale(f, dt));
    time += dt;
    steps++;
    t.push(time);
    states.push([...state] as StateVector);
  }

  return { t, states, steps };
}

// ─────────────────────────────────────────────────────────────
// 2. RK4 Method (O(h⁴) — fourth-order)
// ─────────────────────────────────────────────────────────────

function rk4Step(state: StateVector, h: number): StateVector {
  const k1 = derivatives(state);
  const k2 = derivatives(vecAdd(state, vecScale(k1, h / 2)));
  const k3 = derivatives(vecAdd(state, vecScale(k2, h / 2)));
  const k4 = derivatives(vecAdd(state, vecScale(k3, h)));

  return vecAdd(
    state,
    vecScale(
      vecAdd(
        vecAdd(k1, vecScale(k2, 2)),
        vecAdd(vecScale(k3, 2), k4)
      ),
      h / 6
    )
  );
}

export function rk4Solve(
  initialState: StateVector,
  tEnd: number,
  h: number
): SolverResult {
  const t: number[] = [0];
  const states: StateVector[] = [initialState];
  let state = initialState;
  let time = 0;
  let steps = 0;

  while (time < tEnd - 1e-12) {
    const dt = Math.min(h, tEnd - time);
    state = rk4Step(state, dt);
    time += dt;
    steps++;
    t.push(time);
    states.push([...state] as StateVector);
  }

  return { t, states, steps };
}

// ─────────────────────────────────────────────────────────────
// 3. Predictor–Corrector: Adams–Bashforth 2-step + Adams–Moulton 2-step
//    AB2 (predictor): y_{n+1}^* = y_n + h/2*(3f_n - f_{n-1})
//    AM2 (corrector): y_{n+1}  = y_n + h/2*(f_{n+1}^* + f_n)
//    Startup: one RK4 step
// ─────────────────────────────────────────────────────────────

export function predictorCorrectorSolve(
  initialState: StateVector,
  tEnd: number,
  h: number
): SolverResult {
  const t: number[] = [0];
  const states: StateVector[] = [initialState];
  let steps = 0;

  if (tEnd <= 0) return { t, states, steps };

  // Startup: RK4 first step
  const h0 = Math.min(h, tEnd);
  const s1 = rk4Step(initialState, h0);
  t.push(h0);
  states.push([...s1] as StateVector);
  steps++;

  if (h0 >= tEnd - 1e-12) return { t, states, steps };

  let prevState = initialState;
  let currState = s1;
  let time = h0;
  let prevF = derivatives(prevState);
  let currF = derivatives(currState);

  while (time < tEnd - 1e-12) {
    const dt = Math.min(h, tEnd - time);

    // AB2 Predictor: y* = y_n + h/2*(3f_n - f_{n-1})
    const predicted = vecAdd(
      currState,
      vecScale(vecAdd(vecScale(currF, 3), vecScale(prevF, -1)), dt / 2)
    );

    // AM2 Corrector: y_{n+1} = y_n + h/2*(f* + f_n)
    const predictedF = derivatives(predicted);
    const corrected = vecAdd(
      currState,
      vecScale(vecAdd(predictedF, currF), dt / 2)
    );

    prevState = currState;
    prevF = currF;
    currState = corrected;
    currF = derivatives(corrected);
    time += dt;
    steps++;
    t.push(time);
    states.push([...currState] as StateVector);
  }

  return { t, states, steps };
}

// ─────────────────────────────────────────────────────────────
// 4. Adaptive RK4 with Step-Size Control
//    Uses embedded RK4/RK2 pair for local error estimation
//    (Richardson extrapolation: compare full step vs two half-steps)
// ─────────────────────────────────────────────────────────────

export function adaptiveRK4Solve(
  initialState: StateVector,
  tEnd: number,
  hInit: number,
  tol: number = 1e-6
): SolverResult {
  const t: number[] = [0];
  const states: StateVector[] = [initialState];
  let state = initialState;
  let time = 0;
  let h = hInit;
  let steps = 0;
  let rejectedSteps = 0;

  const hMin = 1e-8;
  const hMax = hInit * 10;
  const safetyFactor = 0.9;

  while (time < tEnd - 1e-12) {
    h = Math.min(h, tEnd - time);
    if (h < hMin) {
      // Force step forward to avoid infinite loop
      h = hMin;
    }

    // Full step with h
    const y1 = rk4Step(state, h);

    // Two half-steps for error estimate
    const yHalf = rk4Step(state, h / 2);
    const y2 = rk4Step(yHalf, h / 2);

    // Error estimate (Richardson extrapolation)
    const err: StateVector = [
      y2[0] - y1[0],
      y2[1] - y1[1],
      y2[2] - y1[2],
      y2[3] - y1[3],
    ];
    const errNorm = vecNorm(err) / 15; // 15 = 2^4 - 1 for RK4

    if (errNorm <= tol || h <= hMin) {
      // Accept step (use the more accurate 2-half-step result)
      state = y2;
      time += h;
      steps++;
      t.push(time);
      states.push([...state] as StateVector);

      // Increase step size
      if (errNorm > 0) {
        const scale = safetyFactor * Math.pow(tol / errNorm, 0.2);
        h = Math.min(hMax, h * Math.min(5, Math.max(0.1, scale)));
      } else {
        h = Math.min(hMax, h * 2);
      }
    } else {
      // Reject step, reduce h
      const scale = safetyFactor * Math.pow(tol / errNorm, 0.25);
      h = h * Math.max(0.1, scale);
      rejectedSteps++;
    }
  }

  return { t, states, steps, rejectedSteps };
}

// ─────────────────────────────────────────────────────────────
// 5. Reference Solution (very fine RK4 for error analysis)
// ─────────────────────────────────────────────────────────────

export function referenceSolve(
  initialState: StateVector,
  tEnd: number
): SolverResult {
  return rk4Solve(initialState, tEnd, 1e-4);
}

// ─────────────────────────────────────────────────────────────
// Interpolation at specific times from a coarse solution
// ─────────────────────────────────────────────────────────────

export function interpolateState(
  t: number[],
  states: StateVector[],
  tQuery: number
): StateVector {
  // Binary search
  let lo = 0;
  let hi = t.length - 1;
  if (tQuery <= t[0]) return states[0];
  if (tQuery >= t[hi]) return states[hi];
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (t[mid] <= tQuery) lo = mid;
    else hi = mid;
  }
  // Linear interpolation
  const alpha = (tQuery - t[lo]) / (t[hi] - t[lo]);
  const s0 = states[lo];
  const s1 = states[hi];
  return [
    s0[0] + alpha * (s1[0] - s0[0]),
    s0[1] + alpha * (s1[1] - s0[1]),
    s0[2] + alpha * (s1[2] - s0[2]),
    s0[3] + alpha * (s1[3] - s0[3]),
  ];
}

// ─────────────────────────────────────────────────────────────
// Global error norm vs reference
// ─────────────────────────────────────────────────────────────

export function computeGlobalError(
  result: SolverResult,
  refResult: SolverResult
): number {
  // Evaluate at same time points as result, interpolate reference
  let maxErr = 0;
  for (let i = 0; i < result.t.length; i++) {
    const refState = interpolateState(refResult.t, refResult.states, result.t[i]);
    const err = Math.sqrt(
      (result.states[i][0] - refState[0]) ** 2 +
        (result.states[i][1] - refState[1]) ** 2
    );
    maxErr = Math.max(maxErr, err);
  }
  return maxErr;
}
