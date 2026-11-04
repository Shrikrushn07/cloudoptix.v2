"""
CloudOptiX Research Engine: FOMAML Meta-RL Training Pipeline
Implements First-Order Model-Agnostic Meta-Learning (FOMAML) with complete
end-to-end backpropagation through all 8 Actor-Critic layers.
Separates Support Trajectories (inner adaptation) from Query Trajectories (outer meta-update).
"""

import copy
import json
import os
import random
import time
from typing import Dict, Any, List

from environment import MultiCloudGymEnv, TRAIN_REGIMES, TEST_REGIMES
from meta_ppo import (
    PurePythonActorCritic,
    collect_trajectories_py,
    compute_gae_advantages,
    compute_full_gradients,
    apply_gradients,
    adapt_to_task_fomaml,
)


def run_meta_training(
    num_meta_epochs: int = 25,
    meta_lr: float = 0.02,
    inner_steps: int = 2,
    inner_lr: float = 0.02,
    seed: int = 42,
) -> Dict[str, Any]:
    random.seed(seed)
    rng = random.Random(seed)

    print("=" * 80)
    print("CLOUDOTPIX RESEARCH ENGINE: FOMAML GRAPH-AWARE META-REINFORCEMENT LEARNING")
    print(f"Algorithm: First-Order Model-Agnostic Meta-Learning (FOMAML)")
    print(f"Complete End-to-End Backpropagation through all 8 Parameter Tensors (7,495 params)")
    print(f"Meta-Epochs: {num_meta_epochs} | Inner Steps: {inner_steps} (alpha={inner_lr}, beta={meta_lr})")
    print(f"Meta-Training Task Regimes (4): {TRAIN_REGIMES}")
    print(f"Held-Out Evaluation Task Regimes (3): {TEST_REGIMES}")
    print("=" * 80)

    env = MultiCloudGymEnv(num_workloads=25, max_steps=30, seed=seed)
    meta_model = PurePythonActorCritic(obs_dim=80, act_dim=6, seed=seed)

    training_logs = {
        "meta_epochs": [],
        "mean_query_reward": [],
        "pre_adapt_reward": [],
        "post_adapt_reward": [],
        "task_rewards": {reg: [] for reg in TRAIN_REGIMES},
    }

    start_time = time.time()

    for epoch in range(1, num_meta_epochs + 1):
        # Accumulate query meta-gradients across all tasks
        # G_meta = sum_i grad_theta' L_query(theta'_i)
        g_meta = {
            "fc1_w": [[0.0] * meta_model.obs_dim for _ in range(meta_model.hidden1)],
            "fc1_b": [0.0] * meta_model.hidden1,
            "fc2_w": [[0.0] * meta_model.hidden1 for _ in range(meta_model.hidden2)],
            "fc2_b": [0.0] * meta_model.hidden2,
            "actor_w": [[0.0] * meta_model.hidden2 for _ in range(meta_model.act_dim)],
            "actor_b": [0.0] * meta_model.act_dim,
            "critic_w": [0.0] * meta_model.hidden2,
            "critic_b": 0.0,
        }

        epoch_query_rewards = []
        epoch_pre_rewards = []
        epoch_post_rewards = []

        # Loop over meta-training tasks
        for task_key in TRAIN_REGIMES:
            # 1. Measure Pre-Adaptation Performance on Support Batch
            supp_rng = random.Random(rng.randint(1, 1000000))
            supp_buf, supp_metrics = collect_trajectories_py(env, meta_model, num_episodes=1, regime_key=task_key, rng=supp_rng)
            epoch_pre_rewards.append(supp_metrics["mean_reward"])

            # 2. Task-Specific Inner Adaptation Step:
            #    theta'_i = theta - alpha * grad_theta L_support(theta)
            adapted_model = meta_model.clone()
            current_supp_buf = supp_buf
            for inner_step in range(inner_steps):
                if inner_step > 0:
                    # In multi-step inner adaptation, sample fresh support trajectory under current adapted policy
                    # using the independent support RNG stream, guaranteeing on-policy sampling and zero probability drift
                    current_supp_buf, _ = collect_trajectories_py(env, adapted_model, num_episodes=1, regime_key=task_key, rng=supp_rng)

                # Recompute value estimates under current adapted_model parameters
                curr_values = [adapted_model.forward(s)[1] for s in current_supp_buf.obs]
                _, last_val, _, _, _, _ = adapted_model.forward(current_supp_buf.obs[-1])
                returns, advantages = compute_gae_advantages(current_supp_buf.rewards, curr_values, current_supp_buf.dones, last_val)
                # compute_full_gradients re-evaluates forward pass on adapted_model, ensuring no stale probabilities
                supp_grads = compute_full_gradients(adapted_model, current_supp_buf, returns, advantages)
                apply_gradients(adapted_model, supp_grads, lr=inner_lr)

            # 3. Sample Separate Query Trajectory using Adapted Parameters theta'_i
            query_rng = random.Random(rng.randint(1, 1000000))
            query_buf, query_metrics = collect_trajectories_py(env, adapted_model, num_episodes=1, regime_key=task_key, rng=query_rng)
            epoch_query_rewards.append(query_metrics["mean_reward"])
            epoch_post_rewards.append(query_metrics["mean_reward"])
            training_logs["task_rewards"][task_key].append(query_metrics["mean_reward"])

            # 4. Compute Query Loss Gradient at theta'_i (FOMAML Meta-Gradient)
            _, last_q_val, _, _, _, _ = adapted_model.forward(query_buf.obs[-1])
            q_returns, q_advantages = compute_gae_advantages(query_buf.rewards, query_buf.values, query_buf.dones, last_q_val)
            query_grads = compute_full_gradients(adapted_model, query_buf, q_returns, q_advantages)

            # 5. Accumulate task meta-gradients
            for k in range(meta_model.hidden1):
                for m in range(meta_model.obs_dim):
                    g_meta["fc1_w"][k][m] += query_grads["fc1_w"][k][m] / len(TRAIN_REGIMES)
                g_meta["fc1_b"][k] += query_grads["fc1_b"][k] / len(TRAIN_REGIMES)

            for j in range(meta_model.hidden2):
                for k in range(meta_model.hidden1):
                    g_meta["fc2_w"][j][k] += query_grads["fc2_w"][j][k] / len(TRAIN_REGIMES)
                g_meta["fc2_b"][j] += query_grads["fc2_b"][j] / len(TRAIN_REGIMES)

            for i in range(meta_model.act_dim):
                for j in range(meta_model.hidden2):
                    g_meta["actor_w"][i][j] += query_grads["actor_w"][i][j] / len(TRAIN_REGIMES)
                g_meta["actor_b"][i] += query_grads["actor_b"][i] / len(TRAIN_REGIMES)

            for j in range(meta_model.hidden2):
                g_meta["critic_w"][j] += query_grads["critic_w"][j] / len(TRAIN_REGIMES)
            g_meta["critic_b"] += query_grads["critic_b"] / len(TRAIN_REGIMES)

        # 6. Outer Meta-Update on Meta-Parameters theta across all 8 layers:
        #    theta <- theta - beta * G_meta
        apply_gradients(meta_model, g_meta, lr=meta_lr)

        avg_query_reward = sum(epoch_query_rewards) / len(epoch_query_rewards)
        avg_pre = sum(epoch_pre_rewards) / len(epoch_pre_rewards)
        avg_post = sum(epoch_post_rewards) / len(epoch_post_rewards)

        training_logs["meta_epochs"].append(epoch)
        training_logs["mean_query_reward"].append(avg_query_reward)
        training_logs["pre_adapt_reward"].append(avg_pre)
        training_logs["post_adapt_reward"].append(avg_post)

        if epoch % 5 == 0 or epoch == 1:
            elapsed = time.time() - start_time
            print(
                f"Epoch [{epoch:02d}/{num_meta_epochs:02d}] | "
                f"Pre-Adapt: {avg_pre:+.3f} -> Post-Adapt Query: {avg_post:+.3f} | "
                f"Delta: {avg_post - avg_pre:+.3f} | "
                f"Elapsed: {elapsed:.1f}s"
            )

    # 7. Train Standard PPO Baseline (Pooled Multi-Task Training, Zero Inner-Loop)
    print("\nTraining Standard PPO Baseline (Pooled Multi-Task Training, Zero Adaptation)...")
    std_ppo_model = PurePythonActorCritic(obs_dim=80, act_dim=6, seed=seed + 10)
    for epoch in range(num_meta_epochs):
        for task_key in TRAIN_REGIMES:
            t_rng = random.Random(seed * 100 + epoch * 13 + 7)
            buf, _ = collect_trajectories_py(env, std_ppo_model, num_episodes=1, regime_key=task_key, rng=t_rng)
            _, last_val, _, _, _, _ = std_ppo_model.forward(buf.obs[-1])
            returns, advantages = compute_gae_advantages(buf.rewards, buf.values, buf.dones, last_val)
            grads = compute_full_gradients(std_ppo_model, buf, returns, advantages)
            apply_gradients(std_ppo_model, grads, lr=meta_lr)

    # 8. Checkpoint Serialization to JSON
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    ckpt_dir = os.path.join(curr_dir, "checkpoints")
    data_dir = os.path.join(curr_dir, "data")
    os.makedirs(ckpt_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)

    meta_weights = {
        "version": "v1.1.0-fomaml-meta-ppo",
        "architecture": "ActorCritic-80-64-32-6",
        "algorithm": "FOMAML (First-Order Model-Agnostic Meta-Learning)",
        "fullBackprop": True,
        "totalParameters": 7495,
        "trainedTimestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "metaEpochs": num_meta_epochs,
        "innerLearningRate": inner_lr,
        "metaLearningRate": meta_lr,
        "actor_fc1_weight": meta_model.fc1_w,
        "actor_fc1_bias": meta_model.fc1_b,
        "actor_fc2_weight": meta_model.fc2_w,
        "actor_fc2_bias": meta_model.fc2_b,
        "actor_out_weight": meta_model.actor_w,
        "actor_out_bias": meta_model.actor_b,
        "critic_fc1_weight": meta_model.fc1_w,
        "critic_fc1_bias": meta_model.fc1_b,
        "critic_fc2_weight": meta_model.fc2_w,
        "critic_fc2_bias": meta_model.fc2_b,
        "critic_out_weight": [meta_model.critic_w],
        "critic_out_bias": [meta_model.critic_b],
    }

    meta_ckpt_path = os.path.join(ckpt_dir, "meta_ppo_checkpoint.json")
    with open(meta_ckpt_path, "w", encoding="utf-8") as f:
        json.dump(meta_weights, f, indent=2)
    print(f"\n[Saved Meta Checkpoint]: {meta_ckpt_path}")

    std_weights = {
        "version": "v1.1.0-std-ppo",
        "architecture": "ActorCritic-80-64-32-6",
        "fullBackprop": True,
        "actor_fc1_weight": std_ppo_model.fc1_w,
        "actor_fc1_bias": std_ppo_model.fc1_b,
        "actor_fc2_weight": std_ppo_model.fc2_w,
        "actor_fc2_bias": std_ppo_model.fc2_b,
        "actor_out_weight": std_ppo_model.actor_w,
        "actor_out_bias": std_ppo_model.actor_b,
        "critic_fc1_weight": std_ppo_model.fc1_w,
        "critic_fc1_bias": std_ppo_model.fc1_b,
        "critic_fc2_weight": std_ppo_model.fc2_w,
        "critic_fc2_bias": std_ppo_model.fc2_b,
        "critic_out_weight": [std_ppo_model.critic_w],
        "critic_out_bias": [std_ppo_model.critic_b],
    }

    std_ckpt_path = os.path.join(ckpt_dir, "std_ppo_checkpoint.json")
    with open(std_ckpt_path, "w", encoding="utf-8") as f:
        json.dump(std_weights, f, indent=2)

    # Export to TypeScript src/research/metaRl/trainedMetaWeights.json
    frontend_ts_path = os.path.join(os.path.dirname(curr_dir), "src", "research", "metaRl", "trainedMetaWeights.json")
    with open(frontend_ts_path, "w", encoding="utf-8") as f:
        json.dump(meta_weights, f, indent=2)
    print(f"[Exported to Frontend Runtime]: {frontend_ts_path}")

    # Save training logs
    log_path = os.path.join(data_dir, "meta_training_log.json")
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(training_logs, f, indent=2)
    print(f"[Saved Training Log]: {log_path}")

    return {
        "meta_model": meta_model,
        "std_ppo_model": std_ppo_model,
        "training_logs": training_logs,
    }


if __name__ == "__main__":
    run_meta_training(num_meta_epochs=25, meta_lr=0.02, inner_steps=2, inner_lr=0.02, seed=42)
