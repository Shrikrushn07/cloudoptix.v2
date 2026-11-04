import { CloudProvider, CloudProviderId, PolicyRule, Workload } from '../../types';
import {
  SimulatedCloudState,
  SimulatedWorkloadState,
  SimulatorAction,
  SimulatorStepResult,
  TaskRegimeConfig,
  TaskRegimeId,
} from './metaRLTypes';
import { HeterogeneousGraph } from '../types';
import { buildMultiCloudGraph } from '../graph/graphBuilder';
import { defaultGraphSageModel } from '../gnn/graphSageModel';
import { evaluateHardFeasibilityForWorkload } from '../feasibility/feasibilityEngine';

export const TASK_REGIMES: Record<TaskRegimeId, TaskRegimeConfig> = {
  NORMAL: {
    id: 'NORMAL',
    name: 'Normal Workload',
    description: 'Balanced nominal traffic, standard diurnal load profile, all 3 cloud providers healthy.',
    isHeldOut: false,
    trafficVariance: 0.1,
    burstMultiplier: 1.0,
    cloudCapacityScale: { aws: 1.0, azure: 1.0, gcp: 1.0 },
    networkLatencyJitterMs: { aws: 0, azure: 0, gcp: 0 },
    failedProvider: null,
    costMultiplier: { aws: 1.0, azure: 1.0, gcp: 1.0 },
  },
  VARIABLE: {
    id: 'VARIABLE',
    name: 'Variable Workload',
    description: 'Stochastic traffic arrivals with high variance across microservices (+/- 40%).',
    isHeldOut: false,
    trafficVariance: 0.4,
    burstMultiplier: 1.25,
    cloudCapacityScale: { aws: 0.95, azure: 0.95, gcp: 0.95 },
    networkLatencyJitterMs: { aws: 8, azure: 12, gcp: 6 },
    failedProvider: null,
    costMultiplier: { aws: 1.0, azure: 1.0, gcp: 1.0 },
  },
  BURST: {
    id: 'BURST',
    name: 'Sudden Traffic Burst',
    description: 'Flash-sale event injecting 3.2x traffic surge on Checkout and Payment APIs.',
    isHeldOut: false,
    trafficVariance: 0.25,
    burstMultiplier: 3.2,
    cloudCapacityScale: { aws: 1.0, azure: 1.0, gcp: 1.0 },
    networkLatencyJitterMs: { aws: 15, azure: 20, gcp: 10 },
    failedProvider: null,
    costMultiplier: { aws: 1.0, azure: 1.0, gcp: 1.0 },
  },
  HIGH_COST: {
    id: 'HIGH_COST',
    name: 'High Cost / Egress Spike',
    description: 'Cross-cloud egress surcharges 3.5x and spot instance market price spikes.',
    isHeldOut: false,
    trafficVariance: 0.15,
    burstMultiplier: 1.1,
    cloudCapacityScale: { aws: 1.0, azure: 1.0, gcp: 1.0 },
    networkLatencyJitterMs: { aws: 5, azure: 5, gcp: 5 },
    failedProvider: null,
    costMultiplier: { aws: 2.8, azure: 2.4, gcp: 2.1 },
  },
  CAPACITY_REDUCTION: {
    id: 'CAPACITY_REDUCTION',
    name: 'Cloud Capacity Reduction (Held-Out)',
    description: 'Hardware node pool degradation halving available CPU/Memory on AWS and Azure.',
    isHeldOut: true,
    trafficVariance: 0.2,
    burstMultiplier: 1.1,
    cloudCapacityScale: { aws: 0.45, azure: 0.55, gcp: 1.0 },
    networkLatencyJitterMs: { aws: 25, azure: 18, gcp: 5 },
    failedProvider: null,
    costMultiplier: { aws: 1.0, azure: 1.0, gcp: 1.0 },
  },
  LATENCY_SPIKE: {
    id: 'LATENCY_SPIKE',
    name: 'Network Latency Jitter (Held-Out)',
    description: 'Undersea fiber cut inducing severe WAN latency (+70ms) and packet jitter.',
    isHeldOut: true,
    trafficVariance: 0.2,
    burstMultiplier: 1.0,
    cloudCapacityScale: { aws: 1.0, azure: 1.0, gcp: 1.0 },
    networkLatencyJitterMs: { aws: 65, azure: 80, gcp: 40 },
    failedProvider: null,
    costMultiplier: { aws: 1.0, azure: 1.0, gcp: 1.0 },
  },
  PROVIDER_FAILURE: {
    id: 'PROVIDER_FAILURE',
    name: 'Provider Outage / Disaster Recovery (Held-Out)',
    description: 'Catastrophic AWS region outage. Requires immediate zero-violation migration to GCP/Azure.',
    isHeldOut: true,
    trafficVariance: 0.3,
    burstMultiplier: 1.2,
    cloudCapacityScale: { aws: 0.0, azure: 0.9, gcp: 0.95 },
    networkLatencyJitterMs: { aws: 999, azure: 10, gcp: 8 },
    failedProvider: 'aws',
    costMultiplier: { aws: 1.0, azure: 1.0, gcp: 1.0 },
  },
};

export class MultiCloudSimulationEnv {
  public baseWorkloads: Workload[];
  public baseClouds: Record<string, CloudProvider>;
  public policies: PolicyRule[];

  public currentTask: TaskRegimeConfig;
  public cloudStates: Record<CloudProviderId, SimulatedCloudState>;
  public workloadStates: Map<string, SimulatedWorkloadState> = new Map();
  public currentStepIndex: number = 0;
  public maxStepsPerEpisode: number = 30;
  public graph: HeterogeneousGraph;
  public nodeEmbeddings: Record<string, number[]> = {};

  // Trajectory logging
  public totalCumulativeReward: number = 0;
  public totalMigrationsExecuted: number = 0;
  public totalSlaViolations: number = 0;
  public totalSafetyViolations: number = 0;

  constructor(
    baseWorkloads: Workload[],
    baseClouds: Record<string, CloudProvider>,
    policies: PolicyRule[]
  ) {
    this.baseWorkloads = baseWorkloads;
    this.baseClouds = baseClouds;
    this.policies = policies;
    this.currentTask = TASK_REGIMES.NORMAL;
    this.cloudStates = this.initCloudStates(this.currentTask);
    this.graph = buildMultiCloudGraph(this.baseWorkloads, this.baseClouds);
    this.computeGraphEmbeddings();
  }

  private computeGraphEmbeddings() {
    this.graph = buildMultiCloudGraph(this.baseWorkloads, this.baseClouds);
    this.nodeEmbeddings = defaultGraphSageModel.forwardEmbeddings(this.graph);
  }

  private initCloudStates(task: TaskRegimeConfig): Record<CloudProviderId, SimulatedCloudState> {
    const cloudIds: CloudProviderId[] = ['aws', 'azure', 'gcp'];
    const states = {} as Record<CloudProviderId, SimulatedCloudState>;

    cloudIds.forEach((cid) => {
      const base = this.baseClouds[cid] || {
        id: cid,
        name: cid.toUpperCase(),
        region: 'us-east-1',
        nodesActive: 32,
        cpuUtilizedPercent: 45,
        memoryUtilizedPercent: 50,
        costPerHour: cid === 'aws' ? 1.45 : cid === 'azure' ? 1.35 : 1.25,
        averageLatencyMs: cid === 'aws' ? 24 : cid === 'azure' ? 28 : 22,
        uptime90d: 99.98,
        carbonIntensityGrams: cid === 'gcp' ? 190 : cid === 'azure' ? 310 : 375,
      };

      const capScale = task.cloudCapacityScale[cid] ?? 1.0;
      const isFailed = task.failedProvider === cid || capScale <= 0.01;
      const totalCores = Math.max(16, Math.floor(base.nodesActive * 16 * capScale));
      const totalMemoryGb = Math.max(64, Math.floor(((base as any).memoryCapacityGb || 8000) * capScale));
      const jitter = task.networkLatencyJitterMs[cid] || 0;
      const costMult = task.costMultiplier[cid] || 1.0;

      states[cid] = {
        id: cid,
        name: base.name,
        region: base.region,
        totalCpuCores: totalCores,
        totalMemoryGb: totalMemoryGb,
        allocatedCpuCores: Math.floor(totalCores * (isFailed ? 1.0 : base.cpuUtilizedPercent / 100)),
        allocatedMemoryGb: Math.floor(totalMemoryGb * (isFailed ? 1.0 : base.memoryUtilizedPercent / 100)),
        cpuUtilizedPercent: isFailed ? 100 : base.cpuUtilizedPercent,
        memoryUtilizedPercent: isFailed ? 100 : base.memoryUtilizedPercent,
        costPerHourRate: base.costPerHour * costMult,
        baselineLatencyMs: base.averageLatencyMs,
        currentLatencyMs: isFailed ? 999 : base.averageLatencyMs + jitter,
        carbonIntensityGrams: base.carbonIntensityGrams,
        egressCostPerGb: cid === 'aws' ? 0.09 * costMult : cid === 'azure' ? 0.08 * costMult : 0.07 * costMult,
        isAvailable: !isFailed,
        healthStatus: isFailed ? 'OUTAGE' : capScale < 0.8 ? 'DEGRADED' : 'HEALTHY',
      };
    });

    return states;
  }

  public reset(taskRegime: TaskRegimeId = 'NORMAL', seed: number = 42): number[] {
    this.currentTask = TASK_REGIMES[taskRegime] || TASK_REGIMES.NORMAL;
    this.currentStepIndex = 0;
    this.totalCumulativeReward = 0;
    this.totalMigrationsExecuted = 0;
    this.totalSlaViolations = 0;
    this.totalSafetyViolations = 0;

    // Initialize cloud states for this task regime
    this.cloudStates = this.initCloudStates(this.currentTask);

    // Initialize simulated workloads
    this.workloadStates.clear();
    this.baseWorkloads.forEach((w, idx) => {
      const pseudoRand = Math.sin(seed * 733 + idx * 47) * 1000;
      const noise = pseudoRand - Math.floor(pseudoRand);

      const burstFactor =
        this.currentTask.id === 'BURST' && (w.type === 'Checkout API' || w.type === 'Payment Gateway')
          ? this.currentTask.burstMultiplier
          : 1.0 + (noise - 0.5) * this.currentTask.trafficVariance;

      // If assigned cloud has failed, mark as degraded
      const assigned = w.cloud as CloudProviderId;
      const isCloudFailed = this.currentTask.failedProvider === assigned;

      this.workloadStates.set(w.id, {
        id: w.id,
        name: w.name,
        type: w.type,
        cpuCores: Math.ceil(w.cpuCores * Math.min(2.0, burstFactor)),
        memoryGb: w.memoryGb,
        allocatedCloud: isCloudFailed ? null : assigned,
        status: isCloudFailed ? 'QUARANTINED' : 'RUNNING',
        currentTrafficRps: Math.floor(120 * burstFactor),
        measuredLatencyMs: isCloudFailed ? 999 : w.latencyMs + (this.currentTask.networkLatencyJitterMs[assigned] || 0),
        slaTargetPercent: w.slaTargetPercent,
        currentSlaPercent: isCloudFailed ? 92.0 : w.currentSlaPercent,
        priority: w.priority,
        policyId: w.policyId,
        migrationCooldownSteps: 0,
      });
    });

    // Recompute cluster utilization based on initial allocations
    this.updateCloudUtilizationMetrics();

    // Return observation for the first active workload
    return this.getObservation(this.baseWorkloads[0].id);
  }

  private updateCloudUtilizationMetrics() {
    // Reset allocated cores & mem
    const cloudIds: CloudProviderId[] = ['aws', 'azure', 'gcp'];
    cloudIds.forEach((cid) => {
      const cloud = this.cloudStates[cid];
      if (!cloud.isAvailable) {
        cloud.allocatedCpuCores = cloud.totalCpuCores;
        cloud.allocatedMemoryGb = cloud.totalMemoryGb;
        cloud.cpuUtilizedPercent = 100;
        cloud.memoryUtilizedPercent = 100;
        return;
      }

      let usedCpu = 0;
      let usedMem = 0;
      this.workloadStates.forEach((w) => {
        if (w.allocatedCloud === cid && w.status !== 'QUARANTINED') {
          usedCpu += w.cpuCores;
          usedMem += w.memoryGb;
        }
      });

      cloud.allocatedCpuCores = usedCpu;
      cloud.allocatedMemoryGb = usedMem;
      cloud.cpuUtilizedPercent = Math.min(100, Number(((usedCpu / cloud.totalCpuCores) * 100).toFixed(1)));
      cloud.memoryUtilizedPercent = Math.min(100, Number(((usedMem / cloud.totalMemoryGb) * 100).toFixed(1)));
    });
  }

  public getObservation(workloadId: string): number[] {
    const wl = this.workloadStates.get(workloadId);
    const wlNodeId = `wl_${workloadId}`;
    const wlEmbedding = this.nodeEmbeddings[wlNodeId] || new Array(16).fill(0.05);

    // 3 Cloud Embeddings (16 each = 48 total)
    const awsEmb = this.nodeEmbeddings['cloud_aws'] || new Array(16).fill(0.05);
    const azEmb = this.nodeEmbeddings['cloud_azure'] || new Array(16).fill(0.05);
    const gcpEmb = this.nodeEmbeddings['cloud_gcp'] || new Array(16).fill(0.05);

    // Dynamic metrics vector (16 dims)
    const dynamicMetrics: number[] = [
      // Cloud CPU utilizations
      (this.cloudStates.aws?.cpuUtilizedPercent || 50) / 100,
      (this.cloudStates.azure?.cpuUtilizedPercent || 50) / 100,
      (this.cloudStates.gcp?.cpuUtilizedPercent || 50) / 100,
      // Cloud Memory utilizations
      (this.cloudStates.aws?.memoryUtilizedPercent || 50) / 100,
      (this.cloudStates.azure?.memoryUtilizedPercent || 50) / 100,
      (this.cloudStates.gcp?.memoryUtilizedPercent || 50) / 100,
      // Cloud availability flags (1.0 = available, 0.0 = outage)
      this.cloudStates.aws?.isAvailable ? 1.0 : 0.0,
      this.cloudStates.azure?.isAvailable ? 1.0 : 0.0,
      this.cloudStates.gcp?.isAvailable ? 1.0 : 0.0,
      // Workload current state
      wl ? Math.min(1.0, wl.cpuCores / 32) : 0.2,
      wl ? Math.min(1.0, wl.memoryGb / 128) : 0.2,
      wl ? Math.min(1.0, wl.measuredLatencyMs / 100) : 0.3,
      wl ? Math.max(0.0, (wl.currentSlaPercent - 98.0) / 2.0) : 0.9,
      // Task regime one-hot or intensity indicators
      this.currentTask.burstMultiplier / 3.5,
      (this.currentTask.costMultiplier.aws - 1.0) / 2.0,
      this.currentStepIndex / this.maxStepsPerEpisode,
    ];

    return [...wlEmbedding, ...awsEmb, ...azEmb, ...gcpEmb, ...dynamicMetrics];
  }

  public step(action: SimulatorAction): SimulatorStepResult {
    this.currentStepIndex++;
    const wl = this.workloadStates.get(action.workloadId);
    if (!wl) {
      throw new Error(`Workload ID '${action.workloadId}' not found in simulator.`);
    }

    let wasSafetyOverridden = false;
    let safetyOverrideReason: string | undefined;
    let migrationOverheadCost = 0;
    let safetyViolated = false;

    const baseWorkload = this.baseWorkloads.find((b) => b.id === action.workloadId) || {
      ...wl,
      costPerHour: 1.5,
      cloud: wl.allocatedCloud || 'aws',
    };

    // HARD FEASIBILITY SAFETY CONTROLLER
    if (action.actionType === 'PLACE' || action.actionType === 'MIGRATE') {
      const target = action.targetCloud;
      if (!target) {
        action.actionType = 'DEFER';
      } else {
        const cloud = this.cloudStates[target];
        // 1. Is provider completely offline?
        if (!cloud || !cloud.isAvailable) {
          safetyViolated = true;
          wasSafetyOverridden = true;
          safetyOverrideReason = `Safety Controller Intercept: Provider '${target}' is suffering an active outage.`;
        }
        // 2. Would placement exceed hard capacity limits (e.g. 92%)?
        else if (cloud.cpuUtilizedPercent > 92 || cloud.memoryUtilizedPercent > 92) {
          safetyViolated = true;
          wasSafetyOverridden = true;
          safetyOverrideReason = `Safety Controller Intercept: Provider '${target}' is over saturated (>92% util).`;
        }
      }

      if (wasSafetyOverridden) {
        this.totalSafetyViolations++;
        // Find safe fallback or quarantine
        const safeCandidates = (['aws', 'azure', 'gcp'] as CloudProviderId[]).filter(
          (c) => this.cloudStates[c]?.isAvailable && this.cloudStates[c]?.cpuUtilizedPercent < 88
        );
        if (safeCandidates.length > 0) {
          // Fallback to least loaded cloud
          safeCandidates.sort(
            (a, b) => this.cloudStates[a].cpuUtilizedPercent - this.cloudStates[b].cpuUtilizedPercent
          );
          action.targetCloud = safeCandidates[0];
        } else {
          action.actionType = 'DEFER';
          action.targetCloud = null;
        }
      }
    }

    // STATE TRANSITION EXECUTION
    let actionOutcome = 'NOOP';
    const oldCloud = wl.allocatedCloud;

    switch (action.actionType) {
      case 'PLACE': {
        if (action.targetCloud) {
          wl.allocatedCloud = action.targetCloud;
          wl.status = 'RUNNING';
          actionOutcome = `Placed on ${action.targetCloud.toUpperCase()}`;
        }
        break;
      }
      case 'MIGRATE': {
        if (action.targetCloud && action.targetCloud !== oldCloud) {
          // Migration cost = network egress + cold startup penalty
          const egressGb = wl.memoryGb * 0.25; // Working set transfer
          const egressRate = this.cloudStates[oldCloud || 'aws']?.egressCostPerGb || 0.08;
          migrationOverheadCost = Number((egressGb * egressRate + 0.12).toFixed(3));
          this.totalMigrationsExecuted++;

          wl.allocatedCloud = action.targetCloud;
          wl.status = 'MIGRATING';
          wl.migrationCooldownSteps = 1;
          actionOutcome = `Migrated from ${oldCloud?.toUpperCase() || 'NONE'} to ${action.targetCloud.toUpperCase()} (Cost: $${migrationOverheadCost})`;
        } else {
          actionOutcome = `Retained on ${oldCloud?.toUpperCase()}`;
        }
        break;
      }
      case 'SCALE_UP': {
        const factor = action.scaleFactor || 1.25;
        wl.cpuCores = Math.min(64, Math.ceil(wl.cpuCores * factor));
        wl.memoryGb = Math.min(256, Math.ceil(wl.memoryGb * factor));
        wl.status = 'SCALED';
        actionOutcome = `Scaled Up to ${wl.cpuCores} cores, ${wl.memoryGb}GB RAM`;
        break;
      }
      case 'SCALE_DOWN': {
        const factor = action.scaleFactor || 0.8;
        wl.cpuCores = Math.max(2, Math.floor(wl.cpuCores * factor));
        wl.memoryGb = Math.max(4, Math.floor(wl.memoryGb * factor));
        wl.status = 'SCALED';
        actionOutcome = `Scaled Down to ${wl.cpuCores} cores, ${wl.memoryGb}GB RAM`;
        break;
      }
      case 'DEFER': {
        wl.status = 'QUARANTINED';
        wl.allocatedCloud = null;
        actionOutcome = 'Workload Safely Quarantined / Deferred';
        break;
      }
    }

    // UPDATE LATENCY, SLA, AND COSTS POST-ACTION
    this.updateCloudUtilizationMetrics();

    const activeCloud = wl.allocatedCloud ? this.cloudStates[wl.allocatedCloud] : null;
    let hourlyCost = 0;
    let currentLatency = 999;
    let carbonGrams = 0;

    let unservedDeferral = false;
    if (activeCloud && activeCloud.isAvailable && wl.status !== 'QUARANTINED') {
      const coreHourlyRate = activeCloud.costPerHourRate / 16;
      hourlyCost = Number((wl.cpuCores * coreHourlyRate + (wl.memoryGb / 8) * 0.05).toFixed(3));
      currentLatency = activeCloud.currentLatencyMs + (wl.status === 'MIGRATING' ? 25 : 0);
      carbonGrams = Number(((activeCloud.carbonIntensityGrams * (wl.cpuCores / 16)) / 24).toFixed(1));
      wl.measuredLatencyMs = currentLatency;
      wl.currentSlaPercent = currentLatency <= wl.measuredLatencyMs ? 99.98 : 99.5;
    } else {
      unservedDeferral = true;
      hourlyCost = 0.50;
      currentLatency = 999;
      carbonGrams = 2;
      wl.measuredLatencyMs = 999;
      wl.currentSlaPercent = 80.0;
    }

    const slaViolated = currentLatency > 65 || wl.currentSlaPercent < wl.slaTargetPercent;
    if (slaViolated) {
      this.totalSlaViolations++;
    }

    // MULTI-CLOUD RESOURCE BALANCE SCORE
    const utils = (['aws', 'azure', 'gcp'] as CloudProviderId[]).map(
      (c) => this.cloudStates[c]?.cpuUtilizedPercent || 0
    );
    const meanUtil = utils.reduce((a, b) => a + b, 0) / 3;
    const variance = utils.reduce((sum, u) => sum + Math.pow(u - meanUtil, 2), 0) / 3;
    const resourceBalanceScore = Math.max(0, 100 - Math.sqrt(variance) * 2);

    // MULTI-OBJECTIVE REWARD FORMULATION
    const costPenalty = hourlyCost * 0.6;
    const slaPenalty = slaViolated ? 3.0 : 0.0;
    const latencyPenalty = Math.min(3.0, currentLatency / 40);
    const migrationPenalty = migrationOverheadCost * 3.0;
    const carbonPenalty = (carbonGrams / 50.0) * 0.2;
    const unservedPenalty = unservedDeferral ? 4.0 : 0.0;
    const balanceReward = (resourceBalanceScore / 100) * 0.8;
    const safetyPenalty = safetyViolated ? 5.0 : 0.0;

    const reward = Number(
      (balanceReward - costPenalty - slaPenalty - latencyPenalty - migrationPenalty - carbonPenalty - unservedPenalty - safetyPenalty).toFixed(3)
    );
    this.totalCumulativeReward += reward;

    const done = this.currentStepIndex >= this.maxStepsPerEpisode;

    // Next observation
    const nextWlIndex = this.currentStepIndex % this.baseWorkloads.length;
    const nextWlId = this.baseWorkloads[nextWlIndex].id;
    const nextObs = this.getObservation(nextWlId);

    return {
      observation: nextObs,
      reward,
      done,
      metrics: {
        hourlyCost,
        latencyMs: currentLatency,
        slaViolated,
        carbonGramsPerHour: carbonGrams,
        migrationOverheadCost,
        resourceBalanceScore,
        safetyViolated,
        actionOutcome,
      },
      info: {
        stepIndex: this.currentStepIndex,
        workloadId: wl.id,
        actionExecuted: action,
        wasSafetyOverridden,
        safetyOverrideReason,
      },
    };
  }
}
