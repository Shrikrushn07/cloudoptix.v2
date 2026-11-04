import { CloudProvider, CloudProviderId, PolicyRule, Workload } from '../../types';
import { FeasibilityCheckResult, HardFeasibilityMaskResult } from '../types';

export interface FeasibilityEngineOptions {
  cpuUtilizationLimitPercent?: number; // e.g. 85% safety ceiling
  memoryUtilizationLimitPercent?: number; // e.g. 90%
  enforceLatencyCeiling?: boolean;
  enforceSlaFloor?: boolean;
  enforcePolicies?: boolean;
}

export function evaluateHardFeasibilityForWorkload(
  workload: Workload,
  clouds: Record<string, CloudProvider>,
  policies: PolicyRule[],
  options: FeasibilityEngineOptions = {}
): HardFeasibilityMaskResult {
  const {
    cpuUtilizationLimitPercent = 85,
    memoryUtilizationLimitPercent = 90,
    enforceLatencyCeiling = true,
    enforceSlaFloor = true,
    enforcePolicies = true,
  } = options;

  const cloudIds: CloudProviderId[] = ['aws', 'azure', 'gcp'];
  const matchedPolicy = policies.find((p) => p.id === workload.policyId && p.isActive);

  const results: Record<CloudProviderId, FeasibilityCheckResult> = {} as any;
  const feasibleCandidates: CloudProviderId[] = [];
  const infeasibleCandidates: CloudProviderId[] = [];

  cloudIds.forEach((cid) => {
    const cloud = clouds[cid];
    const rejectionReasons: string[] = [];

    if (!cloud) {
      results[cid] = {
        candidateCloud: cid,
        isFeasible: false,
        cpuFeasible: false,
        memoryFeasible: false,
        slaFeasible: false,
        latencyFeasible: false,
        policyFeasible: false,
        rejectionReasons: [`Provider '${cid}' is offline or unregistered`],
        cpuUtilizationIfPlaced: 100,
        memoryUtilizationIfPlaced: 100,
        predictedLatencyMs: 999,
        availableSlaPercent: 0,
      };
      infeasibleCandidates.push(cid);
      return;
    }

    // 1. CPU Capacity Check
    // Approximate additional load: workload.cpuCores / total cluster node capability
    const clusterTotalCores = Math.max(64, cloud.nodesActive * 16);
    const addedCpuPercent = Number(((workload.cpuCores / clusterTotalCores) * 100).toFixed(1));
    const isCurrentCloud = workload.cloud === cid;
    const cpuUtilizationIfPlaced = isCurrentCloud
      ? cloud.cpuUtilizedPercent
      : Math.min(100, cloud.cpuUtilizedPercent + addedCpuPercent);

    const cpuFeasible = cpuUtilizationIfPlaced <= cpuUtilizationLimitPercent;
    if (!cpuFeasible) {
      rejectionReasons.push(
        `CPU Capacity Exceeded: Target cluster projected at ${cpuUtilizationIfPlaced}% (Safety Limit: ${cpuUtilizationLimitPercent}%)`
      );
    }

    // 2. Memory Capacity Check
    const clusterTotalRamGb = cloud.memoryCapacityGb || 8000;
    const addedMemPercent = Number(((workload.memoryGb / clusterTotalRamGb) * 100).toFixed(1));
    const memoryUtilizationIfPlaced = isCurrentCloud
      ? cloud.memoryUtilizedPercent
      : Math.min(100, cloud.memoryUtilizedPercent + addedMemPercent);

    const memoryFeasible = memoryUtilizationIfPlaced <= memoryUtilizationLimitPercent;
    if (!memoryFeasible) {
      rejectionReasons.push(
        `Memory Threshold Exceeded: Projected memory footprint ${memoryUtilizationIfPlaced}% > ${memoryUtilizationLimitPercent}% limit`
      );
    }

    // 3. SLA Compliance Check
    // For critical workloads or policy targets, cloud 90-day SLA must be >= workload requirement
    const requiredSla = workload.slaTargetPercent || 99.9;
    const availableSla = cloud.uptime90d;
    const slaFeasible = !enforceSlaFloor || availableSla >= requiredSla - 0.005;
    if (!slaFeasible) {
      rejectionReasons.push(
        `SLA Incompatible: Cloud uptime (${availableSla}%) falls below workload guarantee (${requiredSla}%)`
      );
    }

    // 4. Latency Constraint Check
    // If high stress, network queuing increases latency
    const stressPenalty = cloud.cpuUtilizedPercent > 80 ? 15 : 0;
    const predictedLatency = cloud.averageLatencyMs + stressPenalty;
    const maxAllowedLatency = workload.latencyMs || 60;
    const latencyFeasible = !enforceLatencyCeiling || predictedLatency <= maxAllowedLatency * 1.25;
    if (!latencyFeasible) {
      rejectionReasons.push(
        `Latency Ceiling Violated: Projected round-trip ${predictedLatency}ms exceeds threshold (${maxAllowedLatency}ms)`
      );
    }

    // 5. Cloud Placement Policy & Compliance Check
    let policyFeasible = true;
    if (enforcePolicies && matchedPolicy) {
      if (matchedPolicy.allowedClouds.length > 0 && !matchedPolicy.allowedClouds.includes(cid)) {
        policyFeasible = false;
        rejectionReasons.push(
          `Policy Restriction: Policy [${matchedPolicy.name}] explicitly restricts deployment to [${matchedPolicy.allowedClouds.join(', ').toUpperCase()}]`
        );
      }
      if (matchedPolicy.maxAllowedLatencyMs && predictedLatency > matchedPolicy.maxAllowedLatencyMs) {
        policyFeasible = false;
        rejectionReasons.push(
          `Policy Latency Cap: Projected ${predictedLatency}ms exceeds policy SLA cap of ${matchedPolicy.maxAllowedLatencyMs}ms`
        );
      }
      if (matchedPolicy.minSlaTarget && availableSla < matchedPolicy.minSlaTarget) {
        policyFeasible = false;
        rejectionReasons.push(
          `Policy SLA Target: Cloud uptime ${availableSla}% fails policy requirement of ${matchedPolicy.minSlaTarget}%`
        );
      }
    }

    const isFeasible = cpuFeasible && memoryFeasible && slaFeasible && latencyFeasible && policyFeasible;

    results[cid] = {
      candidateCloud: cid,
      isFeasible,
      cpuFeasible,
      memoryFeasible,
      slaFeasible,
      latencyFeasible,
      policyFeasible,
      rejectionReasons,
      cpuUtilizationIfPlaced,
      memoryUtilizationIfPlaced,
      predictedLatencyMs: predictedLatency,
      availableSlaPercent: availableSla,
    };

    if (isFeasible) {
      feasibleCandidates.push(cid);
    } else {
      infeasibleCandidates.push(cid);
    }
  });

  return {
    workloadId: workload.id,
    allCandidatesFeasible: feasibleCandidates.length === cloudIds.length,
    hasAnyFeasibleCandidate: feasibleCandidates.length > 0,
    results,
    feasibleCandidates,
    infeasibleCandidates,
  };
}
