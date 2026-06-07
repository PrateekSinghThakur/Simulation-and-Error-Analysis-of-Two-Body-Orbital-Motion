/**
 * Lagrange Interpolation Module
 * Reconstructs the orbit from sparse trajectory points
 * Demonstrates numerical approximation beyond ODE solving
 */

import { StateVector } from "./physicsModel";

/**
 * Lagrange basis polynomial evaluated at t,
 * given nodes t_0...t_n, skipping index k
 */
function lagrangeBasis(t: number, nodes: number[], k: number): number {
  let result = 1.0;
  for (let j = 0; j < nodes.length; j++) {
    if (j !== k) {
      result *= (t - nodes[j]) / (nodes[k] - nodes[j]);
    }
  }
  return result;
}

/**
 * Evaluate Lagrange interpolating polynomial at t
 * given sparse nodes and values
 */
export function lagrangeInterpolate1D(
  t: number,
  nodes: number[],
  values: number[]
): number {
  let result = 0.0;
  for (let k = 0; k < nodes.length; k++) {
    result += values[k] * lagrangeBasis(t, nodes, k);
  }
  return result;
}

/**
 * Interpolate the full state vector at time t
 * from sparse (t_nodes, states) using Lagrange interpolation per component
 */
export function lagrangeInterpolateState(
  t: number,
  nodes: number[],
  states: StateVector[]
): StateVector {
  return [
    lagrangeInterpolate1D(t, nodes, states.map((s) => s[0])),
    lagrangeInterpolate1D(t, nodes, states.map((s) => s[1])),
    lagrangeInterpolate1D(t, nodes, states.map((s) => s[2])),
    lagrangeInterpolate1D(t, nodes, states.map((s) => s[3])),
  ];
}

/**
 * Extract N evenly-spaced sparse samples from a dense trajectory
 */
export function sampleSparse(
  t: number[],
  states: StateVector[],
  numNodes: number
): { nodes: number[]; sparseStates: StateVector[] } {
  const n = t.length;
  const nodes: number[] = [];
  const sparseStates: StateVector[] = [];

  for (let i = 0; i < numNodes; i++) {
    const idx = Math.round((i / (numNodes - 1)) * (n - 1));
    nodes.push(t[idx]);
    sparseStates.push(states[idx]);
  }
  return { nodes, sparseStates };
}

/**
 * Reconstruct a dense orbit trajectory from sparse nodes using Lagrange interpolation
 * Returns array of [x, y] positions
 */
export function reconstructOrbit(
  nodes: number[],
  sparseStates: StateVector[],
  numPoints: number
): { t: number[]; x: number[]; y: number[] } {
  const tStart = nodes[0];
  const tEnd = nodes[nodes.length - 1];
  const tOut: number[] = [];
  const xOut: number[] = [];
  const yOut: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const ti = tStart + (i / (numPoints - 1)) * (tEnd - tStart);
    const state = lagrangeInterpolateState(ti, nodes, sparseStates);
    tOut.push(ti);
    xOut.push(state[0]);
    yOut.push(state[1]);
  }
  return { t: tOut, x: xOut, y: yOut };
}

/**
 * Compute Lagrange interpolation error vs reference solution
 */
export function computeLagrangeError(
  nodes: number[],
  sparseStates: StateVector[],
  refT: number[],
  refStates: StateVector[]
): number[] {
  const errors: number[] = [];
  for (let i = 0; i < refT.length; i++) {
    const ti = refT[i];
    if (ti < nodes[0] || ti > nodes[nodes.length - 1]) {
      errors.push(0);
      continue;
    }
    const interp = lagrangeInterpolateState(ti, nodes, sparseStates);
    const ref = refStates[i];
    const err = Math.sqrt((interp[0] - ref[0]) ** 2 + (interp[1] - ref[1]) ** 2);
    errors.push(err);
  }
  return errors;
}
