import { CloudProvider, PolicyRule, Workload } from '../../types';
import { MetaRLBenchmarkComparisonRow, TaskRegimeId } from './metaRLTypes';
import { MultiCloudSimulationEnv, TASK_REGIMES } from './simulationEnv';
import { defaultMetaRLEngine, MetaRLEngine } from './metaRLEngine';
import benchmarkDataJson from './benchmarkData.json';

export function getCachedBenchmarkResults(): MetaRLBenchmarkComparisonRow[] {
  return benchmarkDataJson as MetaRLBenchmarkComparisonRow[];
}

export function runLiveEvaluationOnRegime(
  baseWorkloads: Workload[],
  baseClouds: Record<string, CloudProvider>,
  policies: PolicyRule[],
  taskRegime: TaskRegimeId = 'PROVIDER_FAILURE',
  adaptSteps: number = 3
): {
  unadaptedResults: { meanReward: number; slaRate: number; cost: number; safetyViolations: number };
  adaptedResults: { meanReward: number; slaRate: number; cost: number; safetyViolations: number };
  adaptationHistory: Array<{ step: number; reward: number; slaRate: number }>;
} {
  const env = new MultiCloudSimulationEnv(baseWorkloads, baseClouds, policies);
  const engine = new MetaRLEngine();

  // 1. Evaluate unadapted baseline
  engine.resetToMetaParameters();
  let obs = env.reset(taskRegime, 42);
  let done = false;
  let unadaptedReward = 0;
  let unadaptedSlaViol = 0;
  let unadaptedCost = 0;
  let unadaptedSafety = 0;
  let steps = 0;

  while (!done) {
    const act = engine.selectAction(obs, baseWorkloads[steps % baseWorkloads.length].id, false);
    const res = env.step(act);
    unadaptedReward += res.reward;
    if (res.metrics.slaViolated) unadaptedSlaViol++;
    if (res.metrics.safetyViolated) unadaptedSafety++;
    unadaptedCost += res.metrics.hourlyCost;
    steps++;
    obs = res.observation;
    done = res.done;
  }

  // 2. Perform inner-loop adaptation
  const history = engine.adaptToEnvironment(env, adaptSteps, 0.02);

  // 3. Evaluate post-adaptation
  obs = env.reset(taskRegime, 999);
  done = false;
  let adaptedReward = 0;
  let adaptedSlaViol = 0;
  let adaptedCost = 0;
  let adaptedSafety = 0;
  steps = 0;

  while (!done) {
    const act = engine.selectAction(obs, baseWorkloads[steps % baseWorkloads.length].id, true);
    const res = env.step(act);
    adaptedReward += res.reward;
    if (res.metrics.slaViolated) adaptedSlaViol++;
    if (res.metrics.safetyViolated) adaptedSafety++;
    adaptedCost += res.metrics.hourlyCost;
    steps++;
    obs = res.observation;
    done = res.done;
  }

  return {
    unadaptedResults: {
      meanReward: Number((unadaptedReward / Math.max(1, steps)).toFixed(3)),
      slaRate: Number(((unadaptedSlaViol / Math.max(1, steps)) * 100).toFixed(1)),
      cost: Number((unadaptedCost / Math.max(1, steps)).toFixed(2)),
      safetyViolations: unadaptedSafety,
    },
    adaptedResults: {
      meanReward: Number((adaptedReward / Math.max(1, steps)).toFixed(3)),
      slaRate: Number(((adaptedSlaViol / Math.max(1, steps)) * 100).toFixed(1)),
      cost: Number((adaptedCost / Math.max(1, steps)).toFixed(2)),
      safetyViolations: adaptedSafety,
    },
    adaptationHistory: history.map((h) => ({
      step: h.step,
      reward: h.meanReward,
      slaRate: h.slaViolationRate,
    })),
  };
}
