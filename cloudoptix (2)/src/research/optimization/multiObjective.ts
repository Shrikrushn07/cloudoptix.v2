import { CloudProvider, CloudProviderId, Workload } from '../../types';
import { CandidateObjectiveScores, MultiObjectiveWeights } from '../types';
import { KNOWN_WORKLOAD_DEPENDENCIES } from '../graph/graphBuilder';

export const DEFAULT_OBJECTIVE_WEIGHTS: MultiObjectiveWeights = {
  costWeight: 0.25,
  latencyWeight: 0.20,
  slaWeight: 0.20,
  utilizationWeight: 0.15,
  carbonWeight: 0.10,
  communicationWeight: 0.10,
};

/**
 * Mathematical Formulation:
 *
 * Let W be the workload and C be the candidate cloud provider.
 * The multi-objective scalar utility is defined as:
 *
 *   U(W, C) = w_cost * u_cost(W, C)
 *           + w_lat * u_lat(W, C)
 *           + w_sla * u_sla(W, C)
 *           + w_util * u_util(C)
 *           + w_carbon * u_carbon(C)
 *           + w_comm * u_comm(W, C)
 *
 * Subject to:
 *   sum(w_i) = 1.0,  w_i >= 0
 *   u_i in [0, 100]
 *
 * Objective Functions:
 * 1. Cost Utility (u_cost):
 *    Calculated from estimated cost per compute unit:
 *    u_cost = clamp(100 - (estCost / maxBudget) * 50, 0, 100)
 *
 * 2. Latency Utility (u_lat):
 *    Headroom against workload latency requirement:
 *    u_lat = clamp(100 - (predictedLatency / targetLatency) * 60, 0, 100)
 *
 * 3. SLA Compliance Utility (u_sla):
 *    Margin above minimum SLA:
 *    u_sla = clamp((uptime90d - 99.8) / 0.199 * 100, 0, 100)
 *
 * 4. Resource Utilization / Headroom Utility (u_util):
 *    Balance cluster loads to prevent hot-spots:
 *    u_util = (100 - cpuUtilizedPercent) * 0.6 + (100 - memoryUtilizedPercent) * 0.4
 *
 * 5. Carbon Sustainability Utility (u_carbon):
 *    Grid carbon intensity (gCO2/kWh):
 *    GCP (190g) -> ~90, Azure (310g) -> ~65, AWS (375g) -> ~50
 *    u_carbon = clamp(100 - (carbonIntensityGrams / 500) * 100, 0, 100)
 *
 * 6. Inter-Workload Communication Locality Utility (u_comm):
 *    If dependent services are co-located in C, cross-cloud egress cost is 0.
 *    If cross-cloud, egress cost + WAN latency penalty applies.
 */

export function calculateCandidateObjectives(
  workload: Workload,
  cloudId: CloudProviderId,
  cloud: CloudProvider,
  allWorkloads: Workload[],
  weights: MultiObjectiveWeights = DEFAULT_OBJECTIVE_WEIGHTS
): {
  scores: CandidateObjectiveScores;
  estimatedCostPerHour: number;
  estimatedLatencyMs: number;
  carbonGrams: number;
} {
  // 1. Cost calculation
  const baseMultiplier = cloudId === 'gcp' ? 0.085 : cloudId === 'azure' ? 0.092 : 0.105;
  const estimatedCostPerHour = Number(
    (workload.cpuCores * baseMultiplier + workload.memoryGb * 0.015).toFixed(2)
  );
  // Cost utility: cheaper is higher score
  const costScore = Math.max(10, Math.min(100, Math.round(100 - (estimatedCostPerHour / 4.0) * 45)));

  // 2. Latency calculation
  const stressPenalty = cloud.cpuUtilizedPercent > 80 ? 15 : 0;
  const estimatedLatencyMs = cloud.averageLatencyMs + stressPenalty;
  const targetLatency = workload.latencyMs || 50;
  const latencyRatio = estimatedLatencyMs / targetLatency;
  const latencyScore = Math.max(10, Math.min(100, Math.round(100 - (latencyRatio - 0.4) * 55)));

  // 3. SLA compliance
  const requiredSla = workload.slaTargetPercent || 99.9;
  const slaDelta = cloud.uptime90d - requiredSla;
  const slaScore = Math.max(
    15,
    Math.min(100, Math.round(85 + (slaDelta >= 0 ? slaDelta * 80 : slaDelta * 250)))
  );

  // 4. Resource Headroom / Utilization
  const cpuHeadroom = Math.max(0, 100 - cloud.cpuUtilizedPercent);
  const memHeadroom = Math.max(0, 100 - cloud.memoryUtilizedPercent);
  const utilizationScore = Math.round(cpuHeadroom * 0.6 + memHeadroom * 0.4);

  // 5. Carbon Impact
  // Normalized: 100g = 100%, 500g = 0%
  const carbonGrams = cloud.carbonIntensityGrams || 300;
  const carbonScore = Math.max(15, Math.min(100, Math.round(100 - ((carbonGrams - 100) / 400) * 85)));

  // 6. Inter-workload communication cost & co-location affinity
  let totalCalls = 0;
  let colocatedCalls = 0;

  // Find all dependencies involving this workload
  KNOWN_WORKLOAD_DEPENDENCIES.forEach((dep) => {
    if (dep.sourceType === workload.type) {
      // Find downstream workloads
      const targets = allWorkloads.filter((w) => w.type === dep.targetType && w.id !== workload.id);
      targets.forEach((tgt) => {
        totalCalls += dep.callFrequencyPerSec;
        if (tgt.cloud === cloudId) {
          colocatedCalls += dep.callFrequencyPerSec;
        }
      });
    } else if (dep.targetType === workload.type) {
      // Find upstream workloads
      const sources = allWorkloads.filter((w) => w.type === dep.sourceType && w.id !== workload.id);
      sources.forEach((src) => {
        totalCalls += dep.callFrequencyPerSec;
        if (src.cloud === cloudId) {
          colocatedCalls += dep.callFrequencyPerSec;
        }
      });
    }
  });

  const communicationScore =
    totalCalls > 0
      ? Math.round(40 + (colocatedCalls / totalCalls) * 60)
      : 80; // neutral default if no active dependencies

  // Normalize weights to sum to 1.0
  const weightSum =
    weights.costWeight +
    weights.latencyWeight +
    weights.slaWeight +
    weights.utilizationWeight +
    weights.carbonWeight +
    weights.communicationWeight || 1.0;

  const wCost = weights.costWeight / weightSum;
  const wLat = weights.latencyWeight / weightSum;
  const wSla = weights.slaWeight / weightSum;
  const wUtil = weights.utilizationWeight / weightSum;
  const wCarbon = weights.carbonWeight / weightSum;
  const wComm = weights.communicationWeight / weightSum;

  const compositeScalarizedScore = Math.round(
    costScore * wCost +
      latencyScore * wLat +
      slaScore * wSla +
      utilizationScore * wUtil +
      carbonScore * wCarbon +
      communicationScore * wComm
  );

  const scores: CandidateObjectiveScores = {
    costScore,
    latencyScore,
    slaScore,
    utilizationScore,
    carbonScore,
    communicationScore,
    compositeScalarizedScore,
  };

  return {
    scores,
    estimatedCostPerHour,
    estimatedLatencyMs,
    carbonGrams,
  };
}
