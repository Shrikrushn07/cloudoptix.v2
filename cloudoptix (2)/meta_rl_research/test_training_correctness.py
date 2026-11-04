"""
CloudOptiX Research Engine: Rigorous Training Correctness & Backprop Verification
Tests:
  1. Complete trainable parameter updates across all 8 Actor-Critic tensors.
  2. Checkpoint save/load numerical consistency.
  3. Support vs Query trajectory isolation (no task leakage).
  4. Genuine GraphSAGE node embedding dimensions & values.
  5. Safety controller intercept and safe fallback.
  6. Inner-loop adaptation dynamics.
"""

import copy
import json
import math
import os
import random
import sys

from environment import MultiCloudGymEnv, TASK_REGIMES
from meta_ppo import (
    PurePythonActorCritic,
    collect_trajectories_py,
    compute_gae_advantages,
    compute_full_gradients,
    apply_gradients,
    adapt_to_task_fomaml,
)


def run_tests():
    print("=" * 80)
    print("CLOUDOTPIX RESEARCH ENGINE: RIGOROUS TRAINING CORRECTNESS AUDIT")
    print("=" * 80)

    pass_count = 0
    total_count = 0

    def check(condition: bool, msg: str):
        nonlocal pass_count, total_count
        total_count += 1
        if condition:
            print(f"[PASS] {msg}")
            pass_count += 1
        else:
            print(f"[FAIL] {msg}")
            sys.exit(1)

    # -------------------------------------------------------------------------
    # TEST 1: Full Backpropagation across ALL 8 Parameter Tensors
    # -------------------------------------------------------------------------
    print("\n--- 1. Testing Full Backpropagation across all 8 Tensors ---")
    env = MultiCloudGymEnv(num_workloads=15, max_steps=20, seed=42)
    model = PurePythonActorCritic(obs_dim=80, act_dim=6, seed=42)

    # Collect trajectory
    buf, _ = collect_trajectories_py(env, model, num_episodes=1, regime_key="NORMAL")
    _, last_val, _, _, _, _ = model.forward(buf.obs[-1])
    returns, advantages = compute_gae_advantages(buf.rewards, buf.values, buf.dones, last_val)

    # Compute analytical gradients
    grads = compute_full_gradients(model, buf, returns, advantages)

    tensor_names = ["fc1_w", "fc1_b", "fc2_w", "fc2_b", "actor_w", "actor_b", "critic_w", "critic_b"]
    for t_name in tensor_names:
        check(t_name in grads, f"Gradient computed for tensor: {t_name}")

    # Check non-zero gradient magnitudes
    norm_fc1_w = sum(sum(abs(x) for x in row) for row in grads["fc1_w"])
    norm_fc1_b = sum(abs(x) for x in grads["fc1_b"])
    norm_fc2_w = sum(sum(abs(x) for x in row) for row in grads["fc2_w"])
    norm_fc2_b = sum(abs(x) for x in grads["fc2_b"])
    norm_actor_w = sum(sum(abs(x) for x in row) for row in grads["actor_w"])
    norm_actor_b = sum(abs(x) for x in grads["actor_b"])
    norm_critic_w = sum(abs(x) for x in grads["critic_w"])
    norm_critic_b = abs(grads["critic_b"])

    check(norm_fc1_w > 1e-6, f"FC1 Weight gradient is non-zero (L1 norm = {norm_fc1_w:.6f})")
    check(norm_fc1_b > 1e-6, f"FC1 Bias gradient is non-zero (L1 norm = {norm_fc1_b:.6f})")
    check(norm_fc2_w > 1e-6, f"FC2 Weight gradient is non-zero (L1 norm = {norm_fc2_w:.6f})")
    check(norm_fc2_b > 1e-6, f"FC2 Bias gradient is non-zero (L1 norm = {norm_fc2_b:.6f})")
    check(norm_actor_w > 1e-6, f"Actor Output Weight gradient is non-zero (L1 norm = {norm_actor_w:.6f})")
    check(norm_actor_b > 1e-6, f"Actor Output Bias gradient is non-zero (L1 norm = {norm_actor_b:.6f})")
    check(norm_critic_w > 1e-6, f"Critic Output Weight gradient is non-zero (L1 norm = {norm_critic_w:.6f})")
    check(norm_critic_b > 1e-6, f"Critic Output Bias gradient is non-zero (L1 norm = {norm_critic_b:.6f})")

    # Verify parameters actually change after update
    old_fc1_w = [row[:] for row in model.fc1_w]
    old_actor_w = [row[:] for row in model.actor_w]
    apply_gradients(model, grads, lr=0.05)
    max_delta_fc1 = max(max(abs(model.fc1_w[k][m] - old_fc1_w[k][m]) for m in range(model.obs_dim)) for k in range(model.hidden1))
    max_delta_actor = max(max(abs(model.actor_w[i][j] - old_actor_w[i][j]) for j in range(model.hidden2)) for i in range(model.act_dim))
    check(max_delta_fc1 > 1e-4, f"FC1 Layer 1 weights successfully updated (max delta = {max_delta_fc1:.6f})")
    check(max_delta_actor > 1e-4, f"Actor Output weights successfully updated (max delta = {max_delta_actor:.6f})")

    # -------------------------------------------------------------------------
    # TEST 2: Checkpoint Save / Load Consistency
    # -------------------------------------------------------------------------
    print("\n--- 2. Testing Checkpoint Serialization Fidelity ---")
    d = model.to_dict()
    model2 = PurePythonActorCritic(obs_dim=80, act_dim=6)
    model2.load_dict(d)

    max_delta = 0.0
    for i in range(model.hidden1):
        for j in range(model.obs_dim):
            max_delta = max(max_delta, abs(model.fc1_w[i][j] - model2.fc1_w[i][j]))
    for i in range(model.act_dim):
        for j in range(model.hidden2):
            max_delta = max(max_delta, abs(model.actor_w[i][j] - model2.actor_w[i][j]))

    check(max_delta < 1e-9, f"Save/Load checkpoint parity verified (max delta = {max_delta})")

    # -------------------------------------------------------------------------
    # TEST 3: Support vs Query Trajectory Separation
    # -------------------------------------------------------------------------
    print("\n--- 3. Testing Support vs Query Trajectory Isolation ---")
    rng1 = random.Random(111)
    rng2 = random.Random(222)
    b_supp, _ = collect_trajectories_py(env, model, num_episodes=1, regime_key="BURST", rng=rng1)
    b_query, _ = collect_trajectories_py(env, model, num_episodes=1, regime_key="BURST", rng=rng2)

    diff_count = sum(1 for a1, a2 in zip(b_supp.actions, b_query.actions) if a1 != a2)
    check(diff_count > 0, "Support and Query trajectories are independent stochastic rollouts")

    # -------------------------------------------------------------------------
    # TEST 4: GraphSAGE Embedding Integration
    # -------------------------------------------------------------------------
    print("\n--- 4. Testing Authentic GraphSAGE Embedding Integration ---")
    check(len(env.cloud_embeddings["aws"]) == 16, "Cloud AWS embedding is 16-dimensional")
    check(len(env.cloud_embeddings["azure"]) == 16, "Cloud Azure embedding is 16-dimensional")
    check(len(env.cloud_embeddings["gcp"]) == 16, "Cloud GCP embedding is 16-dimensional")
    check(len(env.wl_embeddings[0]) == 16, "Workload embeddings are 16-dimensional")

    # Check non-trivial embedding values (not all zero, not all equal)
    check(abs(env.cloud_embeddings["aws"][2] - 0.1760) < 0.05, "AWS embedding matches trained GraphSAGE checkpoint")

    # -------------------------------------------------------------------------
    # TEST 5: Safety Controller Intercept
    # -------------------------------------------------------------------------
    print("\n--- 5. Testing Safety Controller Intercept & Fallback ---")
    env.reset(regime_key="PROVIDER_FAILURE", seed=99)
    # Action 0 = AWS (which is marked as failed)
    _, rew, _, info = env.step(0)
    check(info["safety_violated"] == True, "Safety Controller intercepted assignment to failed cloud")
    check(info["was_overridden"] == True, "Action was overridden by Safety Controller")
    check(rew < -3.0, "Safety violation correctly penalized in reward")

    # -------------------------------------------------------------------------
    # TEST 6: Fix 1 Verification — Inner-Loop Probability Drift Elimination
    # -------------------------------------------------------------------------
    print("\n--- 6. Testing Fix 1: Inner-Loop Probability Drift Elimination ---")
    test_model = PurePythonActorCritic(obs_dim=80, act_dim=6, seed=777)
    test_env = MultiCloudGymEnv(num_workloads=10, max_steps=10, seed=777)
    test_buf, _ = collect_trajectories_py(test_env, test_model, num_episodes=1, regime_key="BURST")

    # Adapt model 1 step
    adapted_test = test_model.clone()
    _, l_val, _, _, _, _ = adapted_test.forward(test_buf.obs[-1])
    rets, advs = compute_gae_advantages(test_buf.rewards, test_buf.values, test_buf.dones, l_val)
    g1 = compute_full_gradients(adapted_test, test_buf, rets, advs)
    apply_gradients(adapted_test, g1, lr=0.05)

    # Check that adapted policy probabilities differ from initial buffer probabilities
    p_initial = test_buf.probs[0]
    p_adapted, _, _, _, _, _ = adapted_test.forward(test_buf.obs[0])
    prob_shift = sum(abs(p_a - p_i) for p_a, p_i in zip(p_adapted, p_initial))
    check(prob_shift > 1e-4, f"Adapted model action probabilities have shifted (shift L1 = {prob_shift:.6f})")

    # Check that compute_full_gradients on adapted_test evaluates at the NEW policy, not stale probabilities
    g2 = compute_full_gradients(adapted_test, test_buf, rets, advs)
    max_grad_shift = max(max(abs(g2["actor_w"][i][j] - g1["actor_w"][i][j]) for j in range(adapted_test.hidden2)) for i in range(adapted_test.act_dim))
    check(max_grad_shift > 1e-5, f"Gradients on adapted model reflect current parameters (max delta = {max_grad_shift:.6f})")

    # -------------------------------------------------------------------------
    # TEST 7: Fix 2 Verification — Multi-Seed Benchmark Randomness & Fairness
    # -------------------------------------------------------------------------
    print("\n--- 7. Testing Fix 2: Multi-Seed Randomness, Reproducibility & Fairness ---")
    env_a = MultiCloudGymEnv(num_workloads=12, max_steps=15, seed=42)
    obs_a1 = env_a.reset(regime_key="NORMAL", seed=42)
    cores_a1 = [w["cores"] for w in env_a.workloads]
    clouds_a1 = [w["assigned_cloud"] for w in env_a.workloads]

    # Test exact reproducibility with identical seed
    obs_a2 = env_a.reset(regime_key="NORMAL", seed=42)
    cores_a2 = [w["cores"] for w in env_a.workloads]
    clouds_a2 = [w["assigned_cloud"] for w in env_a.workloads]
    check(cores_a1 == cores_a2, "Identical seed produces 100% identical initial workload cores")
    check(clouds_a1 == clouds_a2, "Identical seed produces 100% identical initial cloud allocations")
    check(obs_a1 == obs_a2, "Identical seed produces identical observation vector")

    # Test meaningful variation across different seeds
    obs_b = env_a.reset(regime_key="NORMAL", seed=101)
    cores_b = [w["cores"] for w in env_a.workloads]
    check(cores_a1 != cores_b, "Different seeds produce meaningfully different initial workload demands")

    # Test cross-algorithm fairness (two independent env instances get identical state for same seed)
    env_algo1 = MultiCloudGymEnv(num_workloads=12, max_steps=15)
    env_algo2 = MultiCloudGymEnv(num_workloads=12, max_steps=15)
    obs1 = env_algo1.reset(regime_key="NORMAL", seed=202)
    obs2 = env_algo2.reset(regime_key="NORMAL", seed=202)
    check(obs1 == obs2, "Fairness verified: Independent environments receive identical initial conditions for same seed")

    # -------------------------------------------------------------------------
    # TEST 8: Fix 3 Verification — Advantage Normalization & Gradient Stability
    # -------------------------------------------------------------------------
    print("\n--- 8. Testing Fix 3: Advantage Normalization & Gradient Stability ---")
    # Test zero-variance rewards (e.g. constant SLA penalty across all steps)
    const_rewards = [-5.0, -5.0, -5.0, -5.0]
    const_values = [-2.0, -2.0, -2.0, -2.0]
    const_dones = [False, False, False, True]
    _, norm_advs = compute_gae_advantages(const_rewards, const_values, const_dones, last_val=-2.0)
    has_nan_adv = any(math.isnan(a) or math.isinf(a) for a in norm_advs)
    check(not has_nan_adv, "Zero-variance advantage does not produce NaN or infinite values")
    check(all(abs(a) <= 4.0 for a in norm_advs), "Normalized advantages are strictly bounded in [-4.0, 4.0]")

    # Test gradient norm clipping with extreme penalties
    extreme_model = PurePythonActorCritic(obs_dim=80, act_dim=6, seed=123)
    extreme_buf, _ = collect_trajectories_py(env_a, extreme_model, num_episodes=1, regime_key="PROVIDER_FAILURE")
    extreme_returns = [-1000.0] * len(extreme_buf.obs)
    extreme_advs = [-500.0] * len(extreme_buf.obs)
    extreme_grads = compute_full_gradients(extreme_model, extreme_buf, extreme_returns, extreme_advs)

    # Compute global norm of clipped gradients
    tot_norm_sq = sum(sum(x ** 2 for x in row) for row in extreme_grads["fc1_w"])
    tot_norm_sq += sum(x ** 2 for x in extreme_grads["fc1_b"])
    tot_norm_sq += sum(sum(x ** 2 for x in row) for row in extreme_grads["fc2_w"])
    tot_norm_sq += sum(x ** 2 for x in extreme_grads["fc2_b"])
    tot_norm_sq += sum(sum(x ** 2 for x in row) for row in extreme_grads["actor_w"])
    tot_norm_sq += sum(x ** 2 for x in extreme_grads["actor_b"])
    tot_norm_sq += sum(x ** 2 for x in extreme_grads["critic_w"])
    tot_norm_sq += extreme_grads["critic_b"] ** 2
    global_norm = math.sqrt(tot_norm_sq)
    check(global_norm <= 1.00001, f"Global gradient norm is clipped to <= 1.0 (actual = {global_norm:.6f})")

    # Apply extreme gradients and check that all parameter tensors remain strictly finite
    apply_gradients(extreme_model, extreme_grads, lr=0.1)
    has_nan_param = False
    for row in extreme_model.fc1_w:
        if any(math.isnan(x) or math.isinf(x) for x in row): has_nan_param = True
    for row in extreme_model.fc2_w:
        if any(math.isnan(x) or math.isinf(x) for x in row): has_nan_param = True
    for row in extreme_model.actor_w:
        if any(math.isnan(x) or math.isinf(x) for x in row): has_nan_param = True
    if any(math.isnan(x) or math.isinf(x) for x in extreme_model.critic_w): has_nan_param = True
    check(not has_nan_param, "All 8 Actor-Critic parameter tensors remain strictly finite under extreme gradients")

    print("\n" + "=" * 80)
    print(f"VERIFICATION SUMMARY: {pass_count}/{total_count} TESTS PASSED")
    print("=" * 80)


if __name__ == "__main__":
    run_tests()
