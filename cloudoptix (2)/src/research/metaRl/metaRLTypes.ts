import { CloudProviderId, WorkloadType, WorkloadPriority } from '../../types';

export type SimulationActionType = 'PLACE' | 'MIGRATE' | 'SCALE_UP' | 'SCALE_DOWN' | 'DEFER';

export type TaskRegimeId =
  | 'NORMAL'
  | 'VARIABLE'
  | 'BURST'
  | 'CAPACITY_REDUCTION'
  | 'LATENCY_SPIKE'
  | 'PROVIDER_FAILURE'
  | 'HIGH_COST';

export interface TaskRegimeConfig {
  id: TaskRegimeId;
  name: string;
  description: string;
  isHeldOut: boolean;
  trafficVariance: number;
  burstMultiplier: number;
  cloudCapacityScale: Record<CloudProviderId, number>;
  networkLatencyJitterMs: Record<CloudProviderId, number>;
  failedProvider: CloudProviderId | null;
  costMultiplier: Record<CloudProviderId, number>;
}

export interface SimulatedCloudState {
  id: CloudProviderId;
  name: string;
  region: string;
  totalCpuCores: number;
  totalMemoryGb: number;
  allocatedCpuCores: number;
  allocatedMemoryGb: number;
  cpuUtilizedPercent: number;
  memoryUtilizedPercent: number;
  costPerHourRate: number;
  currentLatencyMs: number;
  baselineLatencyMs: number;
  carbonIntensityGrams: number;
  egressCostPerGb: number;
  isAvailable: boolean;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'OUTAGE';
}

export interface SimulatedWorkloadState {
  id: string;
  name: string;
  type: WorkloadType;
  cpuCores: number;
  memoryGb: number;
  allocatedCloud: CloudProviderId | null;
  status: 'RUNNING' | 'MIGRATING' | 'SCALED' | 'QUARANTINED' | 'PENDING';
  currentTrafficRps: number;
  measuredLatencyMs: number;
  slaTargetPercent: number;
  currentSlaPercent: number;
  priority: WorkloadPriority;
  policyId: string;
  migrationCooldownSteps: number;
}

export interface SimulatorAction {
  workloadId: string;
  actionType: SimulationActionType;
  targetCloud: CloudProviderId | null; // For PLACE / MIGRATE
  scaleFactor?: number; // 0.8 to 1.5 for SCALING
}

export interface SimulatorStepResult {
  observation: number[];
  reward: number;
  done: boolean;
  metrics: {
    hourlyCost: number;
    latencyMs: number;
    slaViolated: boolean;
    carbonGramsPerHour: number;
    migrationOverheadCost: number;
    resourceBalanceScore: number;
    safetyViolated: boolean;
    actionOutcome: string;
  };
  info: {
    stepIndex: number;
    workloadId: string;
    actionExecuted: SimulatorAction;
    wasSafetyOverridden: boolean;
    safetyOverrideReason?: string;
  };
}

export interface MetaRLWeights {
  version: string;
  architecture: string;
  trainedTimestamp: string;
  metaEpochs: number;
  innerLearningRate: number;
  metaLearningRate: number;
  // Policy network (Actor)
  actor_fc1_weight: number[][];
  actor_fc1_bias: number[];
  actor_fc2_weight: number[][];
  actor_fc2_bias: number[];
  actor_out_weight: number[][];
  actor_out_bias: number[];
  // Value network (Critic)
  critic_fc1_weight: number[][];
  critic_fc1_bias: number[];
  critic_fc2_weight: number[][];
  critic_fc2_bias: number[];
  critic_out_weight: number[][];
  critic_out_bias: number[];
}

export interface AdaptationTrajectoryPoint {
  step: number;
  meanReward: number;
  slaViolationRate: number;
  meanCost: number;
  safetyViolations: number;
  p95LatencyMs: number;
}

export interface MetaRLBenchmarkComparisonRow {
  algorithmId: string;
  algorithmName: string;
  totalCostPerHour: number;
  costStdDev?: number;
  slaViolationRate: number;
  slaStdDev?: number;
  p95LatencyMs: number;
  p95StdDev?: number;
  carbonGrams: number;
  resourceUtilizationPercent: number;
  migrationCount: number;
  migrationOverheadCost: number;
  meanReward: number;
  rewardStdDev?: number;
  adaptationStepsRequired: number;
  safetyViolationCount: number;
  isMetaLearning: boolean;
  statusBadge: 'PROPOSED' | 'BASELINE' | 'HEURISTIC' | 'STATIC_GNN';
  evaluatedSeeds?: number[];
}
