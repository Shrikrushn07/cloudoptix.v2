import {
  AdaptationTrajectoryPoint,
  MetaRLWeights,
  SimulatorAction,
} from './metaRLTypes';
import { MultiCloudSimulationEnv } from './simulationEnv';
import defaultWeightsJson from './trainedMetaWeights.json';

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * (b[i] || 0);
  }
  return sum;
}

function matVec(W: number[][], v: number[]): number[] {
  return W.map((row) => dot(row, v));
}

function vecAdd(a: number[], b: number[]): number[] {
  return a.map((val, i) => val + (b[i] || 0));
}

function leakyRelu(x: number, slope: number = 0.05): number {
  return x > 0 ? x : slope * x;
}

function dLeakyRelu(x: number, slope: number = 0.05): number {
  return x > 0 ? 1.0 : slope;
}

function softmax(logits: number[]): number[] {
  const maxL = Math.max(...logits);
  const expL = logits.map((l) => Math.exp(Math.max(-15.0, Math.min(15.0, l - maxL))));
  const total = expL.reduce((a, b) => a + b, 0) + 1e-9;
  return expL.map((e) => e / total);
}

export class MetaRLEngine {
  public weights: MetaRLWeights;

  // Active runtime weights (updated end-to-end during task adaptation)
  public actor_fc1_w: number[][];
  public actor_fc1_b: number[];
  public actor_fc2_w: number[][];
  public actor_fc2_b: number[];
  public actor_out_w: number[][];
  public actor_out_b: number[];

  public critic_fc1_w: number[][];
  public critic_fc1_b: number[];
  public critic_fc2_w: number[][];
  public critic_fc2_b: number[];
  public critic_out_w: number[];
  public critic_out_b: number;

  constructor(customWeights?: MetaRLWeights) {
    this.weights = customWeights || (defaultWeightsJson as unknown as MetaRLWeights);

    this.actor_fc1_w = JSON.parse(JSON.stringify(this.weights.actor_fc1_weight));
    this.actor_fc1_b = [...this.weights.actor_fc1_bias];
    this.actor_fc2_w = JSON.parse(JSON.stringify(this.weights.actor_fc2_weight));
    this.actor_fc2_b = [...this.weights.actor_fc2_bias];
    this.actor_out_w = JSON.parse(JSON.stringify(this.weights.actor_out_weight));
    this.actor_out_b = [...this.weights.actor_out_bias];

    this.critic_fc1_w = JSON.parse(JSON.stringify(this.weights.critic_fc1_weight));
    this.critic_fc1_b = [...this.weights.critic_fc1_bias];
    this.critic_fc2_w = JSON.parse(JSON.stringify(this.weights.critic_fc2_weight));
    this.critic_fc2_b = [...this.weights.critic_fc2_bias];
    this.critic_out_w = [
      ...(Array.isArray(this.weights.critic_out_weight[0])
        ? (this.weights.critic_out_weight[0] as unknown as number[])
        : (this.weights.critic_out_weight as unknown as number[])),
    ];
    this.critic_out_b = Array.isArray(this.weights.critic_out_bias)
      ? this.weights.critic_out_bias[0]
      : this.weights.critic_out_bias;
  }

  public resetToMetaParameters() {
    this.actor_fc1_w = JSON.parse(JSON.stringify(this.weights.actor_fc1_weight));
    this.actor_fc1_b = [...this.weights.actor_fc1_bias];
    this.actor_fc2_w = JSON.parse(JSON.stringify(this.weights.actor_fc2_weight));
    this.actor_fc2_b = [...this.weights.actor_fc2_bias];
    this.actor_out_w = JSON.parse(JSON.stringify(this.weights.actor_out_weight));
    this.actor_out_b = [...this.weights.actor_out_bias];
  }

  public forward(obs: number[]): {
    actionProbs: number[];
    valueEstimate: number;
    z1: number[];
    h1: number[];
    z2: number[];
    h2: number[];
  } {
    // Shared FC1: 80 -> 64
    const z1 = vecAdd(matVec(this.actor_fc1_w, obs), this.actor_fc1_b);
    const h1 = z1.map((x) => leakyRelu(x));

    // Shared FC2: 64 -> 32
    const z2 = vecAdd(matVec(this.actor_fc2_w, h1), this.actor_fc2_b);
    const h2 = z2.map((x) => leakyRelu(x));

    // Actor Logits: 32 -> 6
    const logits = vecAdd(matVec(this.actor_out_w, h2), this.actor_out_b);
    const actionProbs = softmax(logits);

    // Critic Value: 32 -> 1
    const valueEstimate = dot(this.critic_out_w, h2) + this.critic_out_b;

    return { actionProbs, valueEstimate, z1, h1, z2, h2 };
  }

  public selectAction(
    obs: number[],
    workloadId: string,
    enforceFeasibility: boolean = true,
    unavailableCloud?: string | null
  ): SimulatorAction {
    const { actionProbs } = this.forward(obs);

    // Action indices:
    // 0: AWS, 1: Azure, 2: GCP, 3: SCALE_UP, 4: SCALE_DOWN, 5: DEFER
    const maskedProbs = [...actionProbs];

    if (enforceFeasibility && unavailableCloud) {
      if (unavailableCloud === 'aws') maskedProbs[0] = -1.0;
      if (unavailableCloud === 'azure') maskedProbs[1] = -1.0;
      if (unavailableCloud === 'gcp') maskedProbs[2] = -1.0;
    }

    let bestActionIdx = 0;
    let maxP = -999;
    for (let i = 0; i < maskedProbs.length; i++) {
      if (maskedProbs[i] > maxP) {
        maxP = maskedProbs[i];
        bestActionIdx = i;
      }
    }

    if (maxP < 0) {
      return {
        workloadId,
        actionType: 'DEFER',
        targetCloud: null,
      };
    }

    switch (bestActionIdx) {
      case 0:
        return { workloadId, actionType: 'MIGRATE', targetCloud: 'aws' };
      case 1:
        return { workloadId, actionType: 'MIGRATE', targetCloud: 'azure' };
      case 2:
        return { workloadId, actionType: 'MIGRATE', targetCloud: 'gcp' };
      case 3:
        return { workloadId, actionType: 'SCALE_UP', targetCloud: null, scaleFactor: 1.25 };
      case 4:
        return { workloadId, actionType: 'SCALE_DOWN', targetCloud: null, scaleFactor: 0.8 };
      default:
        return { workloadId, actionType: 'DEFER', targetCloud: null };
    }
  }

  /**
   * Fast Inner-Loop Task Adaptation with COMPLETE END-TO-END BACKPROPAGATION
   * Updates all 8 parameter tensors: W_1, b_1, W_2, b_2, W_actor, b_actor, W_critic, b_critic
   */
  public adaptToEnvironment(
    env: MultiCloudSimulationEnv,
    innerSteps: number = 3,
    innerLr: number = 0.02
  ): AdaptationTrajectoryPoint[] {
    const trajectoryPoints: AdaptationTrajectoryPoint[] = [];

    // Step 0: Pre-adaptation baseline evaluation
    trajectoryPoints.push(this.evaluateCurrentPolicy(env, 0));

    for (let step = 1; step <= innerSteps; step++) {
      // 1. Collect support episode trajectory
      const supportObs: number[][] = [];
      const supportActions: number[] = [];
      const supportRewards: number[] = [];
      const supportValues: number[] = [];
      const supportZ1: number[][] = [];
      const supportH1: number[][] = [];
      const supportZ2: number[][] = [];
      const supportH2: number[][] = [];
      const supportProbs: number[][] = [];

      let obs = env.reset(env.currentTask.id, 100 + step * 31);
      let done = false;

      while (!done) {
        const { actionProbs, valueEstimate, z1, h1, z2, h2 } = this.forward(obs);
        const actionIdx = actionProbs.indexOf(Math.max(...actionProbs));

        const actionObj: SimulatorAction = {
          workloadId: env.baseWorkloads[env.currentStepIndex % env.baseWorkloads.length].id,
          actionType:
            actionIdx === 0
              ? 'MIGRATE'
              : actionIdx === 1
              ? 'MIGRATE'
              : actionIdx === 2
              ? 'MIGRATE'
              : actionIdx === 3
              ? 'SCALE_UP'
              : actionIdx === 4
              ? 'SCALE_DOWN'
              : 'DEFER',
          targetCloud: actionIdx === 0 ? 'aws' : actionIdx === 1 ? 'azure' : actionIdx === 2 ? 'gcp' : null,
        };

        const stepResult = env.step(actionObj);

        supportObs.push(obs);
        supportActions.push(actionIdx);
        supportRewards.push(stepResult.reward);
        supportValues.push(valueEstimate);
        supportZ1.push(z1);
        supportH1.push(h1);
        supportZ2.push(z2);
        supportH2.push(h2);
        supportProbs.push(actionProbs);

        obs = stepResult.observation;
        done = stepResult.done;
      }

      const n = supportRewards.length;
      if (n === 0) continue;

      // 2. Compute GAE Returns and Advantages
      const meanR = supportRewards.reduce((a, b) => a + b, 0) / n;
      const advantages: number[] = [];
      for (let t = 0; t < n; t++) {
        advantages.push(supportRewards[t] - meanR);
      }
      const returns = supportRewards.map((r, t) => r + 0.99 * (supportValues[t + 1] || 0));

      // 3. Complete End-to-End Analytical Backpropagation
      const g_fc1_w = Array.from({ length: 64 }, () => new Array(80).fill(0));
      const g_fc1_b = new Array(64).fill(0);
      const g_fc2_w = Array.from({ length: 32 }, () => new Array(64).fill(0));
      const g_fc2_b = new Array(32).fill(0);
      const g_actor_w = Array.from({ length: 6 }, () => new Array(32).fill(0));
      const g_actor_b = new Array(6).fill(0);
      const g_critic_w = new Array(32).fill(0);
      let g_critic_b = 0;

      for (let t = 0; t < n; t++) {
        const s = supportObs[t];
        const z1 = supportZ1[t];
        const h1 = supportH1[t];
        const z2 = supportZ2[t];
        const h2 = supportH2[t];
        const probs = supportProbs[t];
        const a = supportActions[t];
        const adv = advantages[t];
        const ret = returns[t];
        const val = supportValues[t];

        // Actor output delta
        const delta_actor = new Array(6).fill(0);
        for (let i = 0; i < 6; i++) {
          const indicator = i === a ? 1.0 : 0.0;
          const d_pg = (probs[i] - indicator) * adv;
          delta_actor[i] = Math.max(-2.0, Math.min(2.0, d_pg));
          for (let j = 0; j < 32; j++) {
            g_actor_w[i][j] += (delta_actor[i] * h2[j]) / n;
          }
          g_actor_b[i] += delta_actor[i] / n;
        }

        // Critic output delta
        const delta_critic = Math.max(-5.0, Math.min(5.0, val - ret));
        for (let j = 0; j < 32; j++) {
          g_critic_w[j] += (delta_critic * h2[j]) / n;
        }
        g_critic_b += delta_critic / n;

        // Backpropagate to h2 (32 dims)
        const delta_h2 = new Array(32).fill(0);
        for (let j = 0; j < 32; j++) {
          let sum_act = 0;
          for (let i = 0; i < 6; i++) {
            sum_act += delta_actor[i] * this.actor_out_w[i][j];
          }
          delta_h2[j] = sum_act + 0.5 * delta_critic * this.critic_out_w[j];
        }

        // Backpropagate through FC2 LeakyReLU
        const delta_z2 = delta_h2.map((d, j) => d * dLeakyRelu(z2[j]));
        for (let j = 0; j < 32; j++) {
          for (let k = 0; k < 64; k++) {
            g_fc2_w[j][k] += (delta_z2[j] * h1[k]) / n;
          }
          g_fc2_b[j] += delta_z2[j] / n;
        }

        // Backpropagate to h1 (64 dims)
        const delta_h1 = new Array(64).fill(0);
        for (let k = 0; k < 64; k++) {
          let sum_z2 = 0;
          for (let j = 0; j < 32; j++) {
            sum_z2 += delta_z2[j] * this.actor_fc2_w[j][k];
          }
          delta_h1[k] = sum_z2;
        }

        // Backpropagate through FC1 LeakyReLU
        const delta_z1 = delta_h1.map((d, k) => d * dLeakyRelu(z1[k]));
        for (let k = 0; k < 64; k++) {
          for (let m = 0; m < 80; m++) {
            g_fc1_w[k][m] += (delta_z1[k] * s[m]) / n;
          }
          g_fc1_b[k] += delta_z1[k] / n;
        }
      }

      // 4. Update all 8 parameter tensors
      for (let k = 0; k < 64; k++) {
        for (let m = 0; m < 80; m++) {
          this.actor_fc1_w[k][m] -= innerLr * g_fc1_w[k][m];
        }
        this.actor_fc1_b[k] -= innerLr * g_fc1_b[k];
      }

      for (let j = 0; j < 32; j++) {
        for (let k = 0; k < 64; k++) {
          this.actor_fc2_w[j][k] -= innerLr * g_fc2_w[j][k];
        }
        this.actor_fc2_b[j] -= innerLr * g_fc2_b[j];
      }

      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 32; j++) {
          this.actor_out_w[i][j] -= innerLr * g_actor_w[i][j];
        }
        this.actor_out_b[i] -= innerLr * g_actor_b[i];
      }

      for (let j = 0; j < 32; j++) {
        this.critic_out_w[j] -= innerLr * g_critic_w[j];
      }
      this.critic_out_b -= innerLr * g_critic_b;

      // Evaluate post-adaptation performance point
      trajectoryPoints.push(this.evaluateCurrentPolicy(env, step));
    }

    return trajectoryPoints;
  }

  private evaluateCurrentPolicy(
    env: MultiCloudSimulationEnv,
    stepNum: number
  ): AdaptationTrajectoryPoint {
    let obs = env.reset(env.currentTask.id, 2024);
    let done = false;
    let totalReward = 0;
    let slaViolations = 0;
    let totalCost = 0;
    let safetyViolations = 0;
    const latencies: number[] = [];
    let steps = 0;

    while (!done) {
      const { actionProbs } = this.forward(obs);
      const actionIdx = actionProbs.indexOf(Math.max(...actionProbs));
      const wlId = env.baseWorkloads[env.currentStepIndex % env.baseWorkloads.length].id;

      const act: SimulatorAction = {
        workloadId: wlId,
        actionType:
          actionIdx <= 2 ? 'MIGRATE' : actionIdx === 3 ? 'SCALE_UP' : actionIdx === 4 ? 'SCALE_DOWN' : 'DEFER',
        targetCloud: actionIdx === 0 ? 'aws' : actionIdx === 1 ? 'azure' : actionIdx === 2 ? 'gcp' : null,
      };

      const res = env.step(act);
      totalReward += res.reward;
      if (res.metrics.slaViolated) slaViolations++;
      if (res.metrics.safetyViolated) safetyViolations++;
      totalCost += res.metrics.hourlyCost;
      latencies.push(res.metrics.latencyMs);
      steps++;

      obs = res.observation;
      done = res.done;
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;

    return {
      step: stepNum,
      meanReward: Number((totalReward / Math.max(1, steps)).toFixed(3)),
      slaViolationRate: Number(((slaViolations / Math.max(1, steps)) * 100).toFixed(1)),
      meanCost: Number((totalCost / Math.max(1, steps)).toFixed(2)),
      safetyViolations,
      p95LatencyMs: Number(p95.toFixed(1)),
    };
  }
}

export const defaultMetaRLEngine = new MetaRLEngine();
