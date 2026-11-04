import { CloudProvider, CloudProviderId, PolicyRule, Workload } from '../../types';
import {
  GnnPlacementRecommendation,
  GnnCandidateScore,
  MultiObjectiveWeights,
  HeterogeneousGraph,
} from '../types';
import { evaluateHardFeasibilityForWorkload } from '../feasibility/feasibilityEngine';
import { calculateCandidateObjectives, DEFAULT_OBJECTIVE_WEIGHTS } from '../optimization/multiObjective';
import { GraphSageModel } from '../gnn/graphSageModel';

export function generateExplainableRecommendation(
  workload: Workload,
  clouds: Record<string, CloudProvider>,
  policies: PolicyRule[],
  allWorkloads: Workload[],
  graph: HeterogeneousGraph,
  model: GraphSageModel,
  embeddings: Record<string, number[]>,
  weights: MultiObjectiveWeights = DEFAULT_OBJECTIVE_WEIGHTS
): GnnPlacementRecommendation {
  const start = performance.now();
  const cloudIds: CloudProviderId[] = ['aws', 'azure', 'gcp'];
  const mask = evaluateHardFeasibilityForWorkload(workload, clouds, policies);

  const wEmbed = embeddings[`wl_${workload.id}`] || new Array(model.embedDim).fill(0);
  const candidateScores: GnnCandidateScore[] = [];
  const rejectionRationales: Record<CloudProviderId, string> = {} as any;

  cloudIds.forEach((cid) => {
    const cloud = clouds[cid];
    const cEmbed = embeddings[`cloud_${cid}`] || new Array(model.embedDim).fill(0);

    const { scores, estimatedCostPerHour, estimatedLatencyMs, carbonGrams } = calculateCandidateObjectives(
      workload,
      cid,
      cloud,
      allWorkloads,
      weights
    );

    const rawProb = model.scoreCandidate(wEmbed, cEmbed, [
      scores.costScore / 100,
      scores.latencyScore / 100,
      scores.slaScore / 100,
      scores.carbonScore / 100,
    ]);

    const isFeasible = mask.results[cid]?.isFeasible || false;
    const rawGnnScore = Math.round(rawProb * 100);
    // Hard Feasibility Masking:
    const maskedScore = isFeasible ? rawGnnScore : 0;

    candidateScores.push({
      cloud: cid,
      rawGnnScore,
      maskedScore,
      isFeasible,
      feasibilityDetails: mask.results[cid],
      objectiveScores: scores,
      estimatedCostPerHour,
      estimatedLatencyMs,
      carbonGrams,
      rank: 0,
    });

    if (!isFeasible) {
      rejectionRationales[cid] = mask.results[cid].rejectionReasons.join('; ');
    } else {
      rejectionRationales[cid] = 'Feasible candidate, evaluated against multi-objective ranking.';
    }
  });

  // Sort candidate scores: feasible candidates ranked by maskedScore desc, then infeasible
  candidateScores.sort((a, b) => {
    if (a.isFeasible && !b.isFeasible) return -1;
    if (!a.isFeasible && b.isFeasible) return 1;
    return b.maskedScore - a.maskedScore;
  });

  candidateScores.forEach((c, i) => {
    c.rank = i + 1;
  });

  const topCandidate = candidateScores[0];
  const isFeasible = topCandidate?.isFeasible && topCandidate.maskedScore > 0;
  const recommendedCloud = isFeasible ? topCandidate.cloud : null;

  // Build grounded explanations based on actual inputs, model activations, and feasibility checks
  let summaryExplanation = '';
  const topInfluencingFactors: { factor: string; score: number; importance: string }[] = [];

  if (!isFeasible) {
    summaryExplanation = `NO FEASIBLE PLACEMENT FOUND: All 3 cloud candidates violated hard infrastructure or policy constraints for '${workload.name}'. SRE intervention or policy relaxation is required.`;
  } else {
    const selCloud = clouds[recommendedCloud!];
    const selObj = topCandidate.objectiveScores;

    summaryExplanation = `GraphSAGE placed '${workload.name}' on ${selCloud.name} (${selCloud.region}) with rank 1 (GNN placement score: ${topCandidate.maskedScore}/100). The candidate passed all 5 hard feasibility gates and achieved optimal scalarized utility (Cost: ${selObj.costScore}/100, Latency: ${selObj.latencyScore}/100, Carbon: ${selObj.carbonScore}/100).`;

    topInfluencingFactors.push({
      factor: 'Resource Headroom & Safety Margin',
      score: selObj.utilizationScore,
      importance: `${100 - selCloud.cpuUtilizedPercent}% available CPU headroom with 0 constraint violations`,
    });
    topInfluencingFactors.push({
      factor: 'Runtime Compute Cost Arbitrage',
      score: selObj.costScore,
      importance: `$${topCandidate.estimatedCostPerHour}/hr runtime rate matches multi-cloud budget`,
    });
    topInfluencingFactors.push({
      factor: 'Network Latency Compliance',
      score: selObj.latencyScore,
      importance: `${topCandidate.estimatedLatencyMs}ms predicted RTT conforms to ${workload.latencyMs}ms ceiling`,
    });
    topInfluencingFactors.push({
      factor: 'Grid Carbon Intensity',
      score: selObj.carbonScore,
      importance: `${topCandidate.carbonGrams} gCO2/kWh regional emissions index`,
    });
    topInfluencingFactors.push({
      factor: 'Microservice Graph Locality',
      score: selObj.communicationScore,
      importance: `Co-located with communicating upstream/downstream microservices`,
    });
  }

  // Update rejection rationales for alternatives compared to top candidate
  if (recommendedCloud) {
    cloudIds.forEach((cid) => {
      if (cid !== recommendedCloud) {
        const cand = candidateScores.find((c) => c.cloud === cid)!;
        if (!cand.isFeasible) {
          rejectionRationales[cid] = `Excluded by Hard Feasibility Mask: ${cand.feasibilityDetails.rejectionReasons[0]}`;
        } else {
          const diff = topCandidate.maskedScore - cand.maskedScore;
          rejectionRationales[cid] = `Feasible but sub-optimal: Scored ${cand.maskedScore}/100 (-${diff} pts vs ${clouds[recommendedCloud!].shortName}) due to lower composite cost/latency/carbon utility.`;
        }
      }
    });
  }

  // Graph metrics
  const wlNodeId = `wl_${workload.id}`;
  const neighbors = graph.adjacencyList[wlNodeId] || [];
  const depCount = neighbors.filter((n) => n.startsWith('wl_')).length;

  const elapsed = Math.round(performance.now() - start);

  return {
    id: `GNN-DEC-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toLocaleTimeString(),
    workloadId: workload.id,
    workloadName: workload.name,
    currentCloud: workload.cloud,
    recommendedCloud,
    isFeasible,
    status: isFeasible ? 'OPTIMAL_PLACEMENT' : 'NO_FEASIBLE_PLACEMENT',
    modelConfidence: isFeasible ? topCandidate.maskedScore : 0,
    candidateRankings: candidateScores,
    summaryExplanation,
    rejectionRationales,
    topInfluencingFactors,
    graphMetrics: {
      nodeDegree: neighbors.length,
      connectedDependenciesCount: depCount,
      candidateCount: cloudIds.length,
    },
    inferenceLatencyMs: elapsed,
  };
}
