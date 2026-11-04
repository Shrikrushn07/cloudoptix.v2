import { CloudProviderId, WorkloadPriority, WorkloadType } from '../types';

export interface GraphNodeFeatures {
  // Normalized features [0, 1]
  cpu: number;
  memory: number;
  latencyRequirement: number;
  slaRequirement: number;
  priorityWeight: number;
  costSensitivity: number;
}

export interface CloudNodeFeatures {
  cpuAvailableRatio: number;
  memoryAvailableRatio: number;
  normalizedCostRate: number;
  normalizedLatency: number;
  slaReliability: number;
  carbonIntensityNormalized: number;
}

export type NodeType = 'WORKLOAD' | 'CLOUD_PROVIDER' | 'REGION_POOL';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  features: number[]; // Feature vector for GNN
  featureNames: string[];
  metadata: Record<string, any>;
  x?: number;
  y?: number;
}

export type EdgeType = 'CANDIDATE_PLACEMENT' | 'WORKLOAD_DEPENDENCY' | 'CROSS_CLOUD_INTERCONNECT';

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  features: number[]; // e.g. latency, bandwidth, policy status
  weight: number;
  metadata?: Record<string, any>;
}

export interface HeterogeneousGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  workloadNodeIds: string[];
  cloudNodeIds: string[];
  adjacencyList: Record<string, string[]>;
}

export interface FeasibilityCheckResult {
  candidateCloud: CloudProviderId;
  isFeasible: boolean;
  cpuFeasible: boolean;
  memoryFeasible: boolean;
  slaFeasible: boolean;
  latencyFeasible: boolean;
  policyFeasible: boolean;
  rejectionReasons: string[];
  cpuUtilizationIfPlaced: number;
  memoryUtilizationIfPlaced: number;
  predictedLatencyMs: number;
  availableSlaPercent: number;
}

export interface HardFeasibilityMaskResult {
  workloadId: string;
  allCandidatesFeasible: boolean;
  hasAnyFeasibleCandidate: boolean;
  results: Record<CloudProviderId, FeasibilityCheckResult>;
  feasibleCandidates: CloudProviderId[];
  infeasibleCandidates: CloudProviderId[];
}

export interface MultiObjectiveWeights {
  costWeight: number;       // default 0.25
  latencyWeight: number;    // default 0.20
  slaWeight: number;        // default 0.20
  utilizationWeight: number;// default 0.15
  carbonWeight: number;     // default 0.10
  communicationWeight: number; // default 0.10
}

export interface CandidateObjectiveScores {
  costScore: number;       // 0-100 (higher = better/cheaper)
  latencyScore: number;    // 0-100
  slaScore: number;        // 0-100
  utilizationScore: number;// 0-100
  carbonScore: number;     // 0-100
  communicationScore: number; // 0-100
  compositeScalarizedScore: number; // weighted combination
}

export interface GnnCandidateScore {
  cloud: CloudProviderId;
  rawGnnScore: number;      // raw prediction from GraphSAGE [0, 1]
  maskedScore: number;      // 0 if infeasible, else rawGnnScore
  isFeasible: boolean;
  feasibilityDetails: FeasibilityCheckResult;
  objectiveScores: CandidateObjectiveScores;
  estimatedCostPerHour: number;
  estimatedLatencyMs: number;
  carbonGrams: number;
  rank: number;
}

export interface GnnPlacementRecommendation {
  id: string;
  timestamp: string;
  workloadId: string;
  workloadName: string;
  currentCloud?: CloudProviderId;
  recommendedCloud: CloudProviderId | null; // null if no feasible candidate!
  isFeasible: boolean;
  status: 'OPTIMAL_PLACEMENT' | 'NO_FEASIBLE_PLACEMENT' | 'CONSTRAINED_SUBOPTIMAL';
  modelConfidence: number;
  candidateRankings: GnnCandidateScore[];
  summaryExplanation: string;
  rejectionRationales: Record<CloudProviderId, string>;
  topInfluencingFactors: { factor: string; score: number; importance: string }[];
  graphMetrics: {
    nodeDegree: number;
    connectedDependenciesCount: number;
    candidateCount: number;
  };
  inferenceLatencyMs: number;
}

export type PlacementAlgorithmId =
  | 'random_feasible'
  | 'round_robin'
  | 'best_fit'
  | 'baseline_weighted_scoring'
  | 'graphsage_unmasked'
  | 'graphsage_feasibility_masked';

export interface ExperimentRunConfig {
  name: string;
  workloadCount: number;
  cloudProviders: CloudProviderId[];
  weights: MultiObjectiveWeights;
  cpuCapacityThresholdPercent: number; // e.g. 85%
  memoryCapacityThresholdPercent: number;
  slaMarginPercent: number;
  enableInterWorkloadDependencies: boolean;
  randomSeed: number;
  algorithmsToRun: PlacementAlgorithmId[];
}

export interface SingleAlgorithmBenchmarkResult {
  algorithmId: PlacementAlgorithmId;
  algorithmName: string;
  totalCostPerHour: number;
  totalMonthlyCost: number;
  costReductionVsBaselinePercent: number; // relative to baseline_weighted_scoring
  slaViolationRatePercent: number;
  averageLatencyMs: number;
  averageCloudUtilizationPercent: number;
  totalCarbonIntensityKgPerDay: number;
  feasiblePlacementRatePercent: number;
  infeasibleAssignmentsCount: number;
  unplacedWorkloadsCount: number;
  averageDecisionTimeUs: number; // microseconds
  runtimeMemoryFootprintKb: number;
  overallScore: number; // 0-100
}

export interface BenchmarkRunReport {
  runId: string;
  timestamp: string;
  config: ExperimentRunConfig;
  workloadCount: number;
  results: Record<PlacementAlgorithmId, SingleAlgorithmBenchmarkResult>;
  winningAlgorithmId: PlacementAlgorithmId;
  keyInsights: string[];
}

export interface GraphSageModelWeights {
  version: string;
  architecture: string;
  inputDim: number;
  hiddenDim: number;
  embedDim: number;
  W_self_1: number[][];
  W_neigh_1: number[][];
  b_1: number[];
  W_self_2: number[][];
  W_neigh_2: number[][];
  b_2: number[];
  W_link: number[][];
  b_link: number[];
  W_out?: number[];
  b_out?: number;
  trainedEpochs: number;
  finalLoss: number;
  trainingTimestamp: string;
  datasetSize: number;
}
