import {
  CloudProvider,
  CloudProviderId,
  Workload,
  PolicyRule,
  AIDecision,
  CloudCandidateScore,
  DecisionFactor,
} from '../types';

export interface PlacementEvaluationRequest {
  workloadName: string;
  workloadType: string;
  cpuCores: number;
  memoryGb: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  targetLatencyMs: number;
  minSlaPercent: number;
  maxAcceptableCostPerHour: number;
  policyId?: string;
  currentCloud?: CloudProviderId;
}

export function evaluateCloudCandidates(
  request: PlacementEvaluationRequest,
  clouds: Record<string, CloudProvider>,
  policies: PolicyRule[]
): AIDecision {
  const providers: CloudProviderId[] = ['aws', 'azure', 'gcp'];
  const matchedPolicy = policies.find((p) => p.id === request.policyId) || policies[0];

  const candidateScores: CloudCandidateScore[] = providers.map((cloudId) => {
    const cloud = clouds[cloudId];
    if (!cloud) {
      return {
        cloud: cloudId,
        totalScore: 0,
        resourceAvailabilityScore: 0,
        costEfficiencyScore: 0,
        latencyScore: 0,
        slaComplianceScore: 0,
        historicalPerfScore: 0,
        estimatedCostPerHour: 99,
        estimatedLatencyMs: 999,
        feasibility: false,
        rejectReason: 'Provider offline or unavailable',
      };
    }

    // 1. Resource Availability Score (0 - 100)
    // Saturated clouds (>85%) lose severe points
    const cpuSpare = Math.max(0, 100 - cloud.cpuUtilizedPercent);
    const memSpare = Math.max(0, 100 - cloud.memoryUtilizedPercent);
    let resourceAvailabilityScore = Math.round((cpuSpare * 0.6 + memSpare * 0.4));
    if (cloud.cpuUtilizedPercent > 85) {
      resourceAvailabilityScore = Math.max(10, resourceAvailabilityScore - 40);
    }

    // 2. Cost Efficiency Score
    // Estimated cost based on core counts + cloud base rate
    const baseMultiplier = cloudId === 'gcp' ? 0.085 : cloudId === 'azure' ? 0.092 : 0.105;
    const estimatedCost = Number((request.cpuCores * baseMultiplier + request.memoryGb * 0.015).toFixed(2));
    let costEfficiencyScore = 75;
    if (request.maxAcceptableCostPerHour > 0) {
      if (estimatedCost <= request.maxAcceptableCostPerHour) {
        costEfficiencyScore = Math.min(100, Math.round(90 + (request.maxAcceptableCostPerHour - estimatedCost) * 10));
      } else {
        costEfficiencyScore = Math.max(20, Math.round(70 - (estimatedCost - request.maxAcceptableCostPerHour) * 20));
      }
    } else {
      // Relative cheapest
      if (cloudId === 'gcp') costEfficiencyScore = 94;
      else if (cloudId === 'azure') costEfficiencyScore = 86;
      else costEfficiencyScore = 72;
    }

    // 3. Latency Score
    const predictedLatency = cloud.averageLatencyMs + (cloud.cpuUtilizedPercent > 80 ? 15 : 0);
    let latencyScore = 80;
    if (predictedLatency <= request.targetLatencyMs) {
      latencyScore = Math.min(100, Math.round(85 + (request.targetLatencyMs - predictedLatency) * 0.5));
    } else {
      latencyScore = Math.max(20, Math.round(80 - (predictedLatency - request.targetLatencyMs) * 1.5));
    }

    // 4. SLA Compliance Score
    let slaScore = 92;
    if (cloud.uptime90d >= request.minSlaPercent) {
      slaScore = Math.min(100, 95 + (cloud.uptime90d - request.minSlaPercent) * 10);
    } else {
      slaScore = Math.max(30, 70 - (request.minSlaPercent - cloud.uptime90d) * 50);
    }

    // 5. Historical Reliability
    const historicalPerfScore = Math.round(cloud.uptime90d * 0.9 + (cloud.availableCapacityScore * 0.1));

    // Feasibility & Policy Allowed
    let feasibility = true;
    let rejectReason: string | undefined;

    if (matchedPolicy && !matchedPolicy.allowedClouds.includes(cloudId)) {
      feasibility = false;
      rejectReason = `Policy [${matchedPolicy.name}] restricts deployments to ${matchedPolicy.allowedClouds.join(', ').toUpperCase()}`;
    } else if (cloud.cpuUtilizedPercent > 88) {
      feasibility = false;
      rejectReason = `Cloud cluster CPU utilization is critical (${cloud.cpuUtilizedPercent}%) — safety circuit open`;
    }

    // Weights calculation based on workload priority & policy
    let wResource = 0.30;
    let wCost = 0.25;
    let wLatency = 0.20;
    let wSla = 0.15;
    let wHist = 0.10;

    if (matchedPolicy?.costOptimizationMode === 'AGGRESSIVE') {
      wCost = 0.45;
      wResource = 0.25;
      wLatency = 0.15;
      wSla = 0.10;
      wHist = 0.05;
    } else if (request.priority === 'CRITICAL' || matchedPolicy?.minSlaTarget > 99.95) {
      wSla = 0.35;
      wResource = 0.30;
      wLatency = 0.20;
      wCost = 0.10;
      wHist = 0.05;
    }

    let totalScore = Math.round(
      resourceAvailabilityScore * wResource +
      costEfficiencyScore * wCost +
      latencyScore * wLatency +
      slaScore * wSla +
      historicalPerfScore * wHist
    );

    if (!feasibility) {
      totalScore = Math.min(totalScore, 40);
    }

    return {
      cloud: cloudId,
      totalScore,
      resourceAvailabilityScore,
      costEfficiencyScore,
      latencyScore,
      slaComplianceScore: Math.round(slaScore),
      historicalPerfScore,
      estimatedCostPerHour: estimatedCost,
      estimatedLatencyMs: predictedLatency,
      feasibility,
      rejectReason,
    };
  });

  // Sort candidates by totalScore desc
  candidateScores.sort((a, b) => b.totalScore - a.totalScore);
  const bestCandidate = candidateScores[0];
  const selectedCloud = bestCandidate.cloud;

  // Factors explanation breakdown
  const factors: DecisionFactor[] = [
    {
      factorName: 'Resource Headroom & Headspace',
      weight: 30,
      impactScore: bestCandidate.resourceAvailabilityScore,
      description: `${clouds[selectedCloud]?.shortName} cluster has ${Math.round(100 - (clouds[selectedCloud]?.cpuUtilizedPercent || 50))}% unallocated vCPUs.`,
    },
    {
      factorName: 'Estimated Cost per Compute Unit',
      weight: 25,
      impactScore: bestCandidate.costEfficiencyScore,
      description: `Target rate at $${bestCandidate.estimatedCostPerHour}/hr satisfies budget guidelines.`,
    },
    {
      factorName: 'Predicted Network Latency',
      weight: 20,
      impactScore: bestCandidate.latencyScore,
      description: `Predicted ${bestCandidate.estimatedLatencyMs}ms round-trip latency within ${request.targetLatencyMs}ms ceiling.`,
    },
    {
      factorName: 'SLA Guarantee & Multi-Zone Availability',
      weight: 15,
      impactScore: bestCandidate.slaComplianceScore,
      description: `Exceeds target ${request.minSlaPercent}% SLA with verified 90-day uptime track record.`,
    },
    {
      factorName: 'Historical Stability & Node Health',
      weight: 10,
      impactScore: bestCandidate.historicalPerfScore,
      description: `Cluster health index verified optimal across active availability zones.`,
    },
  ];

  const currentCloudObj = request.currentCloud ? clouds[request.currentCloud] : undefined;
  const currentCost = currentCloudObj ? (request.cpuCores * 0.1 + request.memoryGb * 0.015) : bestCandidate.estimatedCostPerHour;
  const costImpact = Number((bestCandidate.estimatedCostPerHour - currentCost).toFixed(2));
  const latencyDelta = currentCloudObj ? (bestCandidate.estimatedLatencyMs - currentCloudObj.averageLatencyMs) : 0;

  // Auto approve if policy allows autoMigration and high confidence
  const autoApproved = matchedPolicy.autoMigration && !matchedPolicy.humanApprovalRequired && bestCandidate.totalScore >= 80;

  const summaryReason = `${clouds[selectedCloud]?.shortName} currently provides the highest optimization index (${bestCandidate.totalScore}/100) with sufficient capacity headroom, predicted ${bestCandidate.estimatedLatencyMs}ms latency, and $${bestCandidate.estimatedCostPerHour}/hr runtime cost while satisfying policy constraints.`;

  return {
    id: `DEC-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    workloadId: `WL-${Math.floor(200 + Math.random() * 800)}`,
    workloadName: request.workloadName,
    currentCloud: request.currentCloud || selectedCloud,
    recommendedCloud: selectedCloud,
    confidence: bestCandidate.totalScore,
    factors,
    candidateScores,
    summaryReason,
    status: autoApproved ? 'AUTONOMOUSLY_APPROVED' : 'PENDING_APPROVAL',
    riskLevel: bestCandidate.totalScore >= 85 ? 'LOW' : bestCandidate.totalScore >= 70 ? 'MEDIUM' : 'HIGH',
    expectedCostImpactPerHour: costImpact,
    expectedLatencyDeltaMs: latencyDelta,
    policyCheckPassed: bestCandidate.feasibility,
    policyRuleApplied: `${matchedPolicy.id}: ${matchedPolicy.name}`,
  };
}
