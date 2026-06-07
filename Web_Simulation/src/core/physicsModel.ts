/**
 * Two-Body Orbital Motion — Core Physics Model
 * Non-dimensional formulation: G*M = μ = 1
 * State vector: [x, y, vx, vy]
 */

export type StateVector = [number, number, number, number]; // [x, y, vx, vy]

/** Gravitational parameter (non-dimensional: G*M = 1) */
export const MU = 1.0;

/**
 * Equations of motion for the reduced two-body problem.
 * d/dt [x, y, vx, vy] = [vx, vy, -μx/r³, -μy/r³]
 */
export function derivatives(state: StateVector): StateVector {
  const [x, y, vx, vy] = state;
  const r2 = x * x + y * y;
  const r3 = r2 * Math.sqrt(r2);
  const ax = -MU * x / r3;
  const ay = -MU * y / r3;
  return [vx, vy, ax, ay];
}

/**
 * Specific orbital energy (per unit mass)
 * E = 0.5*(vx²+vy²) - μ/r
 */
export function computeEnergy(state: StateVector): number {
  const [x, y, vx, vy] = state;
  const r = Math.sqrt(x * x + y * y);
  const v2 = vx * vx + vy * vy;
  return 0.5 * v2 - MU / r;
}

/**
 * Specific angular momentum (z-component)
 * L = x*vy - y*vx
 */
export function computeAngularMomentum(state: StateVector): number {
  const [x, y, vx, vy] = state;
  return x * vy - y * vx;
}

/**
 * Euclidean distance from origin
 */
export function computeRadius(state: StateVector): number {
  const [x, y] = state;
  return Math.sqrt(x * x + y * y);
}

/**
 * Orbital scenario initial conditions
 * Returns { state, label, description }
 */
export type OrbitalScenario = {
  label: string;
  description: string;
  state: StateVector;
  color: string;
  expectedOrbit: string;
};

/**
 * Circular orbit: v = sqrt(μ/r), r = 1
 * E = -0.5, L = 1
 */
export const circularOrbit: OrbitalScenario = {
  label: "Circular",
  description: "v = √(μ/r), e = 0 — Baseline validation",
  state: [1.0, 0.0, 0.0, 1.0],
  color: "#60a5fa",
  expectedOrbit: "Perfect circle (e = 0)",
};

/**
 * Elliptical orbit: v = 0.85*v_circular
 * E < 0, bound orbit with e > 0
 */
export const ellipticalOrbit: OrbitalScenario = {
  label: "Elliptical",
  description: "v = 0.85·√(μ/r), e ≈ 0.3 — Perturbed velocity",
  state: [1.0, 0.0, 0.0, 0.85],
  color: "#34d399",
  expectedOrbit: "Ellipse (e ≈ 0.3)",
};

/**
 * Escape trajectory: v >= v_escape = sqrt(2μ/r)
 * E >= 0, unbound orbit (hyperbolic)
 */
export const escapeTrajectory: OrbitalScenario = {
  label: "Escape",
  description: "v = √(2μ/r), E = 0 — Parabolic escape",
  state: [1.0, 0.0, 0.0, Math.sqrt(2)],
  color: "#f87171",
  expectedOrbit: "Parabola (E = 0)",
};

export const ALL_SCENARIOS = [circularOrbit, ellipticalOrbit, escapeTrajectory];

/**
 * Compute classical orbital elements from state
 */
export function computeOrbitalElements(state: StateVector) {
  const [, , vx, vy] = state;
  const r = computeRadius(state);
  const v2 = vx * vx + vy * vy;
  const E = 0.5 * v2 - MU / r;
  const L = computeAngularMomentum(state);
  // Semi-major axis
  const a = E < 0 ? -MU / (2 * E) : Infinity;
  // Eccentricity from vis-viva and angular momentum
  // e² = 1 + 2EL²/μ²
  const e2 = Math.max(0, 1 + (2 * E * L * L) / (MU * MU));
  const e = Math.sqrt(e2);
  return { a, e, E, L };
}
