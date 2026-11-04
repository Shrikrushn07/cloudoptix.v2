import { CloudProvider, CloudProviderId, PolicyRule, Workload } from '../../types';
import { HeterogeneousGraph, PlacementAlgorithmId, MultiObjectiveWeights } from '../types';
import { evaluateHardFeasibilityForWorkload } from '../feasibility/feasibilityEngine';
import { calculateCandidateObjectives } from '../optimization/multiObjective';
import { GraphSageModel } from '../gnn/graphSageModel';
import { evaluateCloudCandidates } from '../../services/aiEngine';

export interface PlacementDecisionOutput {
  algorithmId: PlacementAlgorithmId;
  workloadId: string;
  selectedCloud: CloudProviderId | null; // null if no feasible candidate
  isFeasible: boolean;
  score: number;
  decisionTimeUs: number; // microseconds
  rejectionReason?: string;
  candidateScores: Record<CloudProviderId, { score: number; isFeasible: boolean; reasons: string[] }>;
}

export class BaselinePlacementSuite {
  private roundRobinIndex: number = 0;
  private readonly cloudIds: CloudProviderId[] = ['aws', 'azure', 'gcp'];

  /**
   * 1. Random Feasible Placement
   */
  public runRandomFeasible(
    workload: Workload,
    clouds: Record<string, CloudProvider>,
    policies: PolicyRule[],
    seed: number = 42
  ): PlacementDecisionOutput {
    const start = performance.now();
    const mask = evaluateHardFeasibilityForWorkload(workload, clouds, policies);

    const candidateScores: Record<CloudProviderId, any> = {} as any;
    this.cloudIds.forEach((cid) => {
      candidateScores[cid] = {
        score: mask.results[cid].isFeasible ? 0.5 : 0.0,
        isFeasible: mask.results[cid].isFeasible,
        reasons: mask.results[cid].rejectionReasons,
      };
    });

    let selectedCloud: CloudProviderId | null = null;
    if (mask.feasibleCandidates.length > 0) {
      // Deterministic pseudo-random selection
      const hash = Math.abs(Math.sin(seed * 37 + workload.name.length * 13)) * 10000;
      const pickIdx = Math.floor(hash) % mask.feasibleCandidates.length;
      selectedCloud = mask.feasibleCandidates[pickIdx];
    }

    const elapsed = Math.round((performance.now() - start) * 1000);
    return {
      algorithmId: 'random_feasible',
      workloadId: workload.id,
      selectedCloud,
      isFeasible: !!selectedCloud,
      score: selectedCloud ? 50 : 0,
      decisionTimeUs: elapsed,
      rejectionReason: selectedCloud ? undefined : 'No feasible placement found across all cloud candidates',
      candidateScores,
    };
  }

  /**
   * 2. Round Robin Placement
   */
  public runRoundRobin(
    workload: Workload,
    clouds: Record<string, CloudProvider>,
    policies: PolicyRule[]
  ): PlacementDecisionOutput {
    const start = performance.now();
    const mask = evaluateHardFeasibilityForWorkload(workload, clouds, policies);

    const candidateScores: Record<CloudProviderId, any> = {} as any;
    this.cloudIds.forEach((cid) => {
      candidateScores[cid] = {
        score: mask.results[cid].isFeasible ? 0.6 : 0.0,
        isFeasible: mask.results[cid].isFeasible,
        reasons: mask.results[cid].rejectionReasons,
      };
    });

    let selectedCloud: CloudProviderId | null = null;
    if (mask.feasibleCandidates.length > 0) {
      // Find next feasible in round robin order
      for (let i = 0; i < this.cloudIds.length; i++) {
        const candidate = this.cloudIds[(this.roundRobinIndex + i) % this.cloudIds.length];
        if (mask.results[candidate]?.isFeasible) {
          selectedCloud = candidate;
          this.roundRobinIndex = (this.roundRobinIndex + i + 1) % this.cloudIds.length;
          break;
        }
      }
    }

    const elapsed = Math.round((performance.now() - start) * 1000);
    return {
      algorithmId: 'round_robin',
      workloadId: workload.id,
      selectedCloud,
      isFeasible: !!selectedCloud,
      score: selectedCloud ? 60 : 0,
      decisionTimeUs: elapsed,
      rejectionReason: selectedCloud ? undefined : 'No feasible placement found across all cloud candidates',
      candidateScores,
    };
  }

  /**
   * 3. Best Fit (Greedy Resource Headroom)
   */
  public runBestFit(
    workload: Workload,
    clouds: Record<string, CloudProvider>,
    policies: PolicyRule[]
  ): PlacementDecisionOutput {
    const start = performance.now();
    const mask = evaluateHardFeasibilityForWorkload(workload, clouds, policies);

    const candidateScores: Record<CloudProviderId, any> = {} as any;
    let bestCloud: CloudProviderId | null = null;
    let bestHeadroom = -1;

    this.cloudIds.forEach((cid) => {
      const cloud = clouds[cid];
      const isFeasible = mask.results[cid]?.isFeasible || false;
      const cpuHeadroom = cloud ? 100 - cloud.cpuUtilizedPercent : 0;
      const memHeadroom = cloud ? 100 - cloud.memoryUtilizedPercent : 0;
      const headroomScore = cpuHeadroom * 0.6 + memHeadroom * 0.4;

      candidateScores[cid] = {
        score: Math.round(headroomScore),
        isFeasible,
        reasons: mask.results[cid]?.rejectionReasons || [],
      };

      if (isFeasible && headroomScore > bestHeadroom) {
        bestHeadroom = headroomScore;
        bestCloud = cid;
      }
    });

    const elapsed = Math.round((performance.now() - start) * 1000);
    return {
      algorithmId: 'best_fit',
      workloadId: workload.id,
      selectedCloud: bestCloud,
      isFeasible: !!bestCloud,
      score: bestCloud ? candidateScores[bestCloud].score : 0,
      decisionTimeUs: elapsed,
      rejectionReason: bestCloud ? undefined : 'No feasible placement found across all cloud candidates',
      candidateScores,
    };
  }

  /**
   * 4. Baseline 1 — Existing Weighted Scoring (Preserved from src/services/aiEngine.ts)
   */
  public runBaseline1ExistingWeighted(
    workload: Workload,
    clouds: Record<string, CloudProvider>,
    policies: PolicyRule[]
  ): PlacementDecisionOutput {
    const start = performance.now();

    // Call preserved legacy engine
    const legacyDecision = evaluateCloudCandidates(
      {
        workloadName: workload.name,
        workloadType: workload.type,
        cpuCores: workload.cpuCores,
        memoryGb: workload.memoryGb,
        priority: workload.priority,
        targetLatencyMs: workload.latencyMs,
        minSlaPercent: workload.slaTargetPercent,
        maxAcceptableCostPerHour: workload.costPerHour * 1.5,
        policyId: workload.policyId,
        currentCloud: workload.cloud,
      },
      clouds,
      policies
    );

    const candidateScores: Record<CloudProviderId, any> = {} as any;
    legacyDecision.candidateScores.forEach((cs) => {
      candidateScores[cs.cloud] = {
        score: cs.totalScore,
        isFeasible: cs.feasibility,
        reasons: cs.rejectReason ? [cs.rejectReason] : [],
      };
    });

    // NOTE ON BASELINE 1 LIMITATION:
    // The legacy weighted scorer soft-penalizes infeasible candidates (totalScore capped at 40),
    // but still selects the highest scored candidate even if feasibility is false!
    const bestCandidate = legacyDecision.candidateScores[0];
    const isActuallyFeasible = bestCandidate.feasibility;

    const elapsed = Math.round((performance.now() - start) * 1000);
    return {
      algorithmId: 'baseline_weighted_scoring',
      workloadId: workload.id,
      selectedCloud: legacyDecision.recommendedCloud,
      isFeasible: isActuallyFeasible,
      score: bestCandidate.totalScore,
      decisionTimeUs: elapsed,
      rejectionReason: isActuallyFeasible ? undefined : bestCandidate.rejectReason,
      candidateScores,
    };
  }

  /**
   * 5. GraphSAGE Unmasked (Raw Neural Network Placement)
   */
  public runGraphSageUnmasked(
    workload: Workload,
    clouds: Record<string, CloudProvider>,
    policies: PolicyRule[],
    allWorkloads: Workload[],
    graph: HeterogeneousGraph,
    model: GraphSageModel,
    embeddings: Record<string, number[]>
  ): PlacementDecisionOutput {
    const start = performance.now();
    const wEmbed = embeddings[`wl_${workload.id}`] || new Array(model.embedDim).fill(0);
    const mask = evaluateHardFeasibilityForWorkload(workload, clouds, policies);

    const candidateScores: Record<CloudProviderId, any> = {} as any;
    let highestScore = -1;
    let selectedCloud: CloudProviderId = 'aws';

    this.cloudIds.forEach((cid) => {
      const cEmbed = embeddings[`cloud_${cid}`] || new Array(model.embedDim).fill(0);
      const { scores } = calculateCandidateObjectives(workload, cid, clouds[cid], allWorkloads);
      const rawProb = model.scoreCandidate(wEmbed, cEmbed, [
        scores.costScore / 100,
        scores.latencyScore / 100,
        scores.slaScore / 100,
        scores.carbonScore / 100,
      ]);

      const scaledScore = Math.round(rawProb * 100);
      const isFeasible = mask.results[cid]?.isFeasible || false;

      candidateScores[cid] = {
        score: scaledScore,
        isFeasible,
        reasons: mask.results[cid]?.rejectionReasons || [],
      };

      if (scaledScore > highestScore) {
        highestScore = scaledScore;
        selectedCloud = cid;
      }
    });

    // Unmasked: selects highest raw prediction, which may violate hard constraints
    const isActuallyFeasible = mask.results[selectedCloud]?.isFeasible || false;
    const elapsed = Math.round((performance.now() - start) * 1000);

    return {
      algorithmId: 'graphsage_unmasked',
      workloadId: workload.id,
      selectedCloud,
      isFeasible: isActuallyFeasible,
      score: highestScore,
      decisionTimeUs: elapsed,
      rejectionReason: isActuallyFeasible ? undefined : 'Unmasked GNN selected candidate violating constraints',
      candidateScores,
    };
  }

  /**
   * 6. GraphSAGE with Hard Feasibility Masking (Proposed Method)
   */
  public runGraphSageFeasibilityMasked(
    workload: Workload,
    clouds: Record<string, CloudProvider>,
    policies: PolicyRule[],
    allWorkloads: Workload[],
    graph: HeterogeneousGraph,
    model: GraphSageModel,
    embeddings: Record<string, number[]>,
    weights?: MultiObjectiveWeights
  ): PlacementDecisionOutput {
    const start = performance.now();
    const wEmbed = embeddings[`wl_${workload.id}`] || new Array(model.embedDim).fill(0);
    const mask = evaluateHardFeasibilityForWorkload(workload, clouds, policies);

    const candidateScores: Record<CloudProviderId, any> = {} as any;
    let bestFeasibleCloud: CloudProviderId | null = null;
    let highestFeasibleScore = -1;

    this.cloudIds.forEach((cid) => {
      const cEmbed = embeddings[`cloud_${cid}`] || new Array(model.embedDim).fill(0);
      const { scores } = calculateCandidateObjectives(workload, cid, clouds[cid], allWorkloads, weights);
      const rawProb = model.scoreCandidate(wEmbed, cEmbed, [
        scores.costScore / 100,
        scores.latencyScore / 100,
        scores.slaScore / 100,
        scores.carbonScore / 100,
      ]);

      const gnnScore = Math.round(rawProb * 100);
      const isFeasible = mask.results[cid]?.isFeasible || false;
      // Hard feasibility mask: score is multiplied by boolean indicator (1 if feasible, 0 if infeasible)
      const maskedScore = isFeasible ? gnnScore : 0;

      candidateScores[cid] = {
        score: maskedScore,
        rawGnnScore: gnnScore,
        isFeasible,
        reasons: mask.results[cid]?.rejectionReasons || [],
      };

      if (isFeasible && maskedScore > highestFeasibleScore) {
        highestFeasibleScore = maskedScore;
        bestFeasibleCloud = cid;
      }
    });

    const elapsed = Math.round((performance.now() - start) * 1000);
    return {
      algorithmId: 'graphsage_feasibility_masked',
      workloadId: workload.id,
      selectedCloud: bestFeasibleCloud,
      isFeasible: !!bestFeasibleCloud,
      score: bestFeasibleCloud ? candidateScores[bestFeasibleCloud].score : 0,
      decisionTimeUs: elapsed,
      rejectionReason: bestFeasibleCloud
        ? undefined
        : 'No feasible placement found: All cloud candidates violated hard constraints',
      candidateScores,
    };
  }
}

export const baselineSuite = new BaselinePlacementSuite();
