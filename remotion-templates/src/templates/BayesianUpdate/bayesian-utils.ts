/**
 * Math helpers and shared interfaces for BayesianUpdate.
 */

import type { EvidenceItem } from "./types";

// ── Gaussian curve generation ──────────────────────────────────────────────

export function gaussian(x: number, mean: number, std: number): number {
  const exp = -0.5 * ((x - mean) / std) ** 2;
  return Math.exp(exp) / (std * Math.sqrt(2 * Math.PI));
}

export function generateCurvePath(
  mean: number,
  std: number,
  width: number,
  height: number,
  steps: number = 200
): string {
  const points: string[] = [];
  const maxY = gaussian(mean, mean, std); // peak height

  for (let i = 0; i <= steps; i++) {
    const prob = (i / steps) * 100; // 0-100 probability
    const x = (prob / 100) * width;
    const y = height - (gaussian(prob, mean, std) / maxY) * height * 0.85;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  // Close the path along the bottom
  return `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`;
}

// ── Evidence state computation ─────────────────────────────────────────────

export interface DistributionState {
  mean: number;
  std: number;
}

export interface MultiHypothesisState {
  probabilities: number[];
}

// For multi variant: compute how probabilities shift across hypotheses
export function computeMultiHypothesisStates(
  priors: number[],
  evidence: EvidenceItem[]
): MultiHypothesisState[] {
  const states: MultiHypothesisState[] = [];

  // State 0: initial priors
  states.push({ probabilities: [...priors] });

  let currentProbs = [...priors];

  for (const e of evidence) {
    // Shift magnitude: magnitude scales 1-5 to 2-10% redistribution
    const shiftPercent = e.magnitude * 2;

    if (e.direction === "up") {
      // Increase hypothesis 0, decrease others proportionally
      const decrease = shiftPercent / (currentProbs.length - 1);
      currentProbs = currentProbs.map((p, i) => {
        if (i === 0) {
          return Math.min(98, p + shiftPercent);
        } else {
          return Math.max(0, p - decrease);
        }
      });
    } else {
      // Decrease hypothesis 0, increase others proportionally
      const increase = shiftPercent / (currentProbs.length - 1);
      currentProbs = currentProbs.map((p, i) => {
        if (i === 0) {
          return Math.max(0, p - shiftPercent);
        } else {
          return Math.min(98, p + increase);
        }
      });
    }

    // Normalize to sum ≈ 100
    const total = currentProbs.reduce((a, b) => a + b, 0);
    if (total > 0) {
      currentProbs = currentProbs.map(p => (p / total) * 100);
    }

    states.push({ probabilities: [...currentProbs] });
  }

  return states;
}

export function computeDistributionStates(
  prior: number,
  evidence: EvidenceItem[]
): DistributionState[] {
  const states: DistributionState[] = [];
  let currentMean = prior;
  let currentStd = 18; // Wide initial uncertainty

  // State 0: prior
  states.push({ mean: currentMean, std: currentStd });

  for (const e of evidence) {
    const shift = e.magnitude * 4; // 4-20% shift per evidence
    if (e.direction === "up") {
      currentMean = Math.min(98, currentMean + shift);
    } else {
      currentMean = Math.max(2, currentMean - shift);
    }
    // Each evidence tightens uncertainty slightly
    currentStd = Math.max(6, currentStd - e.magnitude * 1.2);
    states.push({ mean: currentMean, std: currentStd });
  }

  return states;
}
