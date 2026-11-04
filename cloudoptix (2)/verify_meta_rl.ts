import { INITIAL_CLOUDS, INITIAL_POLICIES, INITIAL_WORKLOADS } from './src/data/initialData';
import { MultiCloudSimulationEnv, TASK_REGIMES } from './src/research/metaRl/simulationEnv';
import { defaultMetaRLEngine, MetaRLEngine } from './src/research/metaRl/metaRLEngine';
import { getCachedBenchmarkResults, runLiveEvaluationOnRegime } from './src/research/metaRl/metaRLBenchmark';

async function runMetaRLVerification() {
  console.log('='.repeat(80));
  console.log('CLOUDOTPIX RESEARCH ENGINE: META-RL SYSTEM VERIFICATION');
  console.log('Framework: Graph-Aware Meta-Reinforcement Learning (Meta-PPO / MAML)');
  console.log('='.repeat(80));

  let passedTests = 0;
  let totalTests = 0;

  function assert(cond: boolean, name: string) {
    totalTests++;
    if (cond) {
      console.log(`[PASS] ${name}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${name}`);
      process.exitCode = 1;
    }
  }

  // TEST 1: MultiCloudSimulationEnv instantiation & observation dimension
  console.log('\n--- 1. Simulator Environment & Observation Tests ---');
  const env = new MultiCloudSimulationEnv(INITIAL_WORKLOADS, INITIAL_CLOUDS, INITIAL_POLICIES);
  const obs = env.reset('NORMAL', 42);

  assert(obs.length === 80, `Observation dimension is exactly 80 (received: ${obs.length})`);
  assert(env.workloadStates.size === INITIAL_WORKLOADS.length, `Simulator loaded ${INITIAL_WORKLOADS.length} workloads`);
  assert(Object.keys(env.cloudStates).length === 3, 'All 3 cloud providers initialized (AWS, Azure, GCP)');

  // TEST 2: Task Regimes Configuration & Isolation
  console.log('\n--- 2. Task Regimes & Task Isolation Tests ---');
  const regimes = Object.keys(TASK_REGIMES);
  assert(regimes.length === 7, `Total 7 task regimes defined (received: ${regimes.length})`);

  const trainRegimes = regimes.filter((r) => !TASK_REGIMES[r as keyof typeof TASK_REGIMES].isHeldOut);
  const heldOutRegimes = regimes.filter((r) => TASK_REGIMES[r as keyof typeof TASK_REGIMES].isHeldOut);
  assert(trainRegimes.length === 4, `4 Meta-Training Regimes: ${trainRegimes.join(', ')}`);
  assert(heldOutRegimes.length === 3, `3 Held-Out Evaluation Regimes: ${heldOutRegimes.join(', ')}`);

  // Verify Provider Failure Regime State
  const failureObs = env.reset('PROVIDER_FAILURE', 101);
  assert(env.cloudStates.aws.isAvailable === false, 'AWS correctly marked as unavailable in PROVIDER_FAILURE regime');
  assert(env.cloudStates.aws.healthStatus === 'OUTAGE', 'AWS healthStatus is OUTAGE');
  assert(env.cloudStates.azure.isAvailable === true, 'Azure remains available');
  assert(env.cloudStates.gcp.isAvailable === true, 'GCP remains available');

  // TEST 3: State Transitions, Actions, and Safety Controller Intercept
  console.log('\n--- 3. Action Execution & Safety Controller Tests ---');
  // Attempt to assign workload to failed AWS
  const unsafeAction = {
    workloadId: INITIAL_WORKLOADS[0].id,
    actionType: 'MIGRATE' as const,
    targetCloud: 'aws' as const,
  };
  const stepRes = env.step(unsafeAction);
  assert(stepRes.info.wasSafetyOverridden === true, 'Safety Controller successfully intercepted placement on failed provider (AWS)');
  assert(stepRes.metrics.safetyViolated === true, 'Safety violation flag recorded');
  assert(stepRes.info.actionExecuted.targetCloud !== 'aws', `Workload safely rerouted away from AWS to ${stepRes.info.actionExecuted.targetCloud?.toUpperCase()}`);

  // Test Valid Migration to GCP
  const validAction = {
    workloadId: INITIAL_WORKLOADS[1].id,
    actionType: 'MIGRATE' as const,
    targetCloud: 'gcp' as const,
  };
  const validRes = env.step(validAction);
  assert(validRes.info.wasSafetyOverridden === false, 'Valid action allowed without override');
  assert(validRes.metrics.migrationOverheadCost > 0, `Migration egress overhead charged ($${validRes.metrics.migrationOverheadCost})`);

  // TEST 4: Meta-RL Actor-Critic Forward Pass Parity
  console.log('\n--- 4. Actor-Critic Policy Forward Pass Tests ---');
  const engine = new MetaRLEngine();
  const forwardOut = engine.forward(obs);
  const probSum = forwardOut.actionProbs.reduce((a, b) => a + b, 0);

  assert(forwardOut.actionProbs.length === 6, 'Actor outputs 6 action probabilities');
  assert(Math.abs(probSum - 1.0) < 1e-4, `Probabilities sum to 1.0 (actual: ${probSum.toFixed(6)})`);
  assert(typeof forwardOut.valueEstimate === 'number', `Critic scalar value estimated (${forwardOut.valueEstimate.toFixed(3)})`);

  // TEST 5: Fast Inner-Loop Adaptation Dynamics & Full Backprop Verification
  console.log('\n--- 5. Fast Inner-Loop Adaptation & Full Backpropagation Tests ---');
  const initialFc1_00 = engine.actor_fc1_w[0][0];
  const initialActor_00 = engine.actor_out_w[0][0];
  const adaptationHistory = engine.adaptToEnvironment(env, 3, 0.02);

  assert(adaptationHistory.length === 4, `Adaptation trajectory collected 4 evaluation points (Steps 0, 1, 2, 3)`);
  assert(Math.abs(engine.actor_fc1_w[0][0] - initialFc1_00) > 1e-7, 'Full backprop verified: FC1 layer-1 weights updated during adaptation');
  assert(Math.abs(engine.actor_out_w[0][0] - initialActor_00) > 1e-7, 'Full backprop verified: Actor output layer weights updated during adaptation');

  console.log('Adaptation curve on PROVIDER_FAILURE:');
  adaptationHistory.forEach((h) => {
    console.log(`  Step ${h.step}: Reward=${h.meanReward > 0 ? '+' : ''}${h.meanReward.toFixed(3)}, SLA Violations=${h.slaViolationRate.toFixed(1)}%, Cost=$${h.meanCost.toFixed(2)}`);
  });

  // TEST 6: 7-Algorithm Benchmark Cache Integrity & Multi-Seed Fields
  console.log('\n--- 6. 7-Algorithm Benchmark Cache Integrity ---');
  const cachedRows = getCachedBenchmarkResults();
  assert(cachedRows.length === 7, `Cached benchmark contains all 7 algorithms (found: ${cachedRows.length})`);
  const proposedRow = cachedRows.find((r) => r.algorithmId === 'graph-aware-meta-rl');
  assert(proposedRow !== undefined, 'Found proposed Graph-Aware Meta-RL row');
  assert(proposedRow?.adaptationStepsRequired === 3, 'Proposed algorithm requires 3 adaptation steps');
  assert((proposedRow as any)?.costStdDev !== undefined, 'Multi-seed cost standard deviation present');

  console.log('\n' + '='.repeat(80));
  console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('='.repeat(80));

  if (passedTests === totalTests) {
    console.log('ALL TESTS PASSED SUCCESSFULLY (Exit Code 0)');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMetaRLVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
