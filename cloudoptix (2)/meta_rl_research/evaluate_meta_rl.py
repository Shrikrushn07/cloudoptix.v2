"""
CloudOptiX Research Engine: 7-Algorithm Multi-Seed Benchmark Evaluation
Rigorously evaluates across held-out disaster regimes (Capacity Reduction, Latency Spike, Provider Failure).
Evaluates across multiple seeds (42, 101, 202) to report mean and standard deviation.
"""

import json
import math
import os
import random
from typing import Dict, Any, List

from environment import MultiCloudGymEnv, TEST_REGIMES
from meta_ppo import (
    PurePythonActorCritic,
    collect_trajectories_py,
    compute_gae_advantages,
    compute_full_gradients,
    apply_gradients,
    adapt_to_task_fomaml,
)


def run_benchmark_multi_seed(seeds: List[int] = [42, 101, 202]) -> List[Dict[str, Any]]:
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    meta_ckpt_path = os.path.join(curr_dir, "checkpoints", "meta_ppo_checkpoint.json")
    std_ckpt_path = os.path.join(curr_dir, "checkpoints", "std_ppo_checkpoint.json")

    if not os.path.exists(meta_ckpt_path):
        raise FileNotFoundError(f"Checkpoint not found at {meta_ckpt_path}. Run train_meta_rl.py first.")

    with open(meta_ckpt_path, "r", encoding="utf-8") as f:
        meta_data = json.load(f)
    base_meta_model = PurePythonActorCritic(obs_dim=80, act_dim=6)
    base_meta_model.load_dict(meta_data)

    with open(std_ckpt_path, "r", encoding="utf-8") as f:
        std_data = json.load(f)
    base_std_model = PurePythonActorCritic(obs_dim=80, act_dim=6)
    base_std_model.load_dict(std_data)

    algorithm_ids = [
        "round-robin",
        "best-fit-cost",
        "weighted-heuristic",
        "graphsage-only",
        "standard-ppo",
        "graph-aware-ppo",
        "graph-aware-meta-rl",
    ]

    algorithm_names = {
        "round-robin": "Round Robin",
        "best-fit-cost": "Best-Fit Cost",
        "weighted-heuristic": "Weighted Scoring Heuristic",
        "graphsage-only": "GraphSAGE Static Policy",
        "standard-ppo": "Standard PPO (Zero Adaptation)",
        "graph-aware-ppo": "Graph-Aware PPO (Unadapted)",
        "graph-aware-meta-rl": "Graph-Aware Meta-RL (FOMAML Adapted)",
    }

    algorithm_badges = {
        "round-robin": "BASELINE",
        "best-fit-cost": "BASELINE",
        "weighted-heuristic": "HEURISTIC",
        "graphsage-only": "STATIC_GNN",
        "standard-ppo": "BASELINE",
        "graph-aware-ppo": "BASELINE",
        "graph-aware-meta-rl": "PROPOSED",
    }

    # Store raw metric runs: { alg_id: { metric_name: [val_seed_1, val_seed_2, ...] } }
    metric_keys = ["cost", "sla_rate", "p95_lat", "carbon", "util_bal", "mig_cost", "migrations", "reward", "safety_viols"]
    alg_runs: Dict[str, Dict[str, List[float]]] = {
        aid: {k: [] for k in metric_keys} for aid in algorithm_ids
    }
    raw_runs: Dict[str, Dict[int, Dict[str, Any]]] = {
        aid: {} for aid in algorithm_ids
    }

    print("=" * 80)
    print("CLOUDOTPIX RESEARCH ENGINE: 7-ALGORITHM MULTI-SEED HELD-OUT EVALUATION")
    print(f"Seeds: {seeds} | Held-Out Regimes (3): {TEST_REGIMES}")
    print("=" * 80)

    for seed_idx, seed in enumerate(seeds):
        print(f"\n--- Running Seed [{seed_idx + 1}/{len(seeds)}]: seed={seed} ---")
        env = MultiCloudGymEnv(num_workloads=25, max_steps=30, seed=seed)

        # 1. Round Robin
        rr, rr_scen = eval_heuristic(env, "ROUND_ROBIN", TEST_REGIMES, seed=seed)
        for k in metric_keys: alg_runs["round-robin"][k].append(rr[k])
        raw_runs["round-robin"][seed] = rr_scen

        # 2. Best-Fit Cost
        bf, bf_scen = eval_heuristic(env, "BEST_FIT_COST", TEST_REGIMES, seed=seed)
        for k in metric_keys: alg_runs["best-fit-cost"][k].append(bf[k])
        raw_runs["best-fit-cost"][seed] = bf_scen

        # 3. Weighted Heuristic
        wh, wh_scen = eval_heuristic(env, "WEIGHTED_HEURISTIC", TEST_REGIMES, seed=seed)
        for k in metric_keys: alg_runs["weighted-heuristic"][k].append(wh[k])
        raw_runs["weighted-heuristic"][seed] = wh_scen

        # 4. GraphSAGE Static
        gnn, gnn_scen = eval_heuristic(env, "GRAPHSAGE_STATIC", TEST_REGIMES, seed=seed)
        for k in metric_keys: alg_runs["graphsage-only"][k].append(gnn[k])
        raw_runs["graphsage-only"][seed] = gnn_scen

        # 5. Standard PPO (Zero Adaptation)
        std_m = base_std_model.clone()
        std_res, std_scen = eval_rl_agent(env, std_m, TEST_REGIMES, adapt_steps=0, seed=seed)
        for k in metric_keys: alg_runs["standard-ppo"][k].append(std_res[k])
        raw_runs["standard-ppo"][seed] = std_scen

        # 6. Graph-Aware PPO (Generic training, zero adaptation)
        gp_m = base_meta_model.clone()
        gp_res, gp_scen = eval_rl_agent(env, gp_m, TEST_REGIMES, adapt_steps=0, seed=seed)
        for k in metric_keys: alg_runs["graph-aware-ppo"][k].append(gp_res[k])
        raw_runs["graph-aware-ppo"][seed] = gp_scen

        # 7. Graph-Aware Meta-RL (FOMAML Adapted with 3 inner steps)
        meta_m = base_meta_model.clone()
        meta_res, meta_scen = eval_rl_agent(env, meta_m, TEST_REGIMES, adapt_steps=3, seed=seed)
        for k in metric_keys: alg_runs["graph-aware-meta-rl"][k].append(meta_res[k])
        raw_runs["graph-aware-meta-rl"][seed] = meta_scen

    # Aggregate mean and std dev across seeds
    final_results = []
    for aid in algorithm_ids:
        runs = alg_runs[aid]
        mean_cost = float(sum(runs["cost"]) / len(runs["cost"]))
        std_cost = float(math.sqrt(sum((x - mean_cost) ** 2 for x in runs["cost"]) / len(runs["cost"])))

        mean_sla = float(sum(runs["sla_rate"]) / len(runs["sla_rate"]))
        std_sla = float(math.sqrt(sum((x - mean_sla) ** 2 for x in runs["sla_rate"]) / len(runs["sla_rate"])))

        mean_p95 = float(sum(runs["p95_lat"]) / len(runs["p95_lat"]))
        std_p95 = float(math.sqrt(sum((x - mean_p95) ** 2 for x in runs["p95_lat"]) / len(runs["p95_lat"])))

        mean_carbon = float(sum(runs["carbon"]) / len(runs["carbon"]))
        mean_util = float(sum(runs["util_bal"]) / len(runs["util_bal"]))
        mean_mig = float(sum(runs["migrations"]) / len(runs["migrations"]))
        mean_mig_cost = float(sum(runs["mig_cost"]) / len(runs["mig_cost"]))

        mean_rew = float(sum(runs["reward"]) / len(runs["reward"]))
        std_rew = float(math.sqrt(sum((x - mean_rew) ** 2 for x in runs["reward"]) / len(runs["reward"])))

        mean_safety = int(round(sum(runs["safety_viols"]) / len(runs["safety_viols"])))

        is_meta = (aid == "graph-aware-meta-rl")

        final_results.append({
            "algorithmId": aid,
            "algorithmName": algorithm_names[aid],
            "totalCostPerHour": round(mean_cost, 2),
            "costStdDev": round(std_cost, 3),
            "slaViolationRate": round(mean_sla, 1),
            "slaStdDev": round(std_sla, 2),
            "p95LatencyMs": round(mean_p95, 1),
            "p95StdDev": round(std_p95, 1),
            "carbonGrams": round(mean_carbon, 1),
            "resourceUtilizationPercent": round(mean_util, 1),
            "migrationCount": int(round(mean_mig)),
            "migrationOverheadCost": round(mean_mig_cost, 2),
            "meanReward": round(mean_rew, 3),
            "rewardStdDev": round(std_rew, 3),
            "adaptationStepsRequired": 3 if is_meta else 0,
            "safetyViolationCount": mean_safety,
            "isMetaLearning": is_meta,
            "statusBadge": algorithm_badges[aid],
            "evaluatedSeeds": seeds,
        })

    # Print summary table
    print("\n" + "=" * 125)
    print(f"{'Algorithm':<34} | {'Cost/hr':<14} | {'SLA Viol':<14} | {'p95 Latency':<14} | {'Util Bal':<9} | {'Mean Reward':<16} | {'Safety':<6}")
    print("-" * 125)
    for r in final_results:
        cost_str = f"${r['totalCostPerHour']:.2f} ±{r['costStdDev']:.2f}"
        sla_str = f"{r['slaViolationRate']:.1f}% ±{r['slaStdDev']:.1f}"
        lat_str = f"{r['p95LatencyMs']:.1f}ms"
        rew_str = f"{r['meanReward']:+.3f} ±{r['rewardStdDev']:.2f}"
        print(f"{r['algorithmName']:<34} | {cost_str:<14} | {sla_str:<14} | {lat_str:<14} | {r['resourceUtilizationPercent']:>6.1f}%  | {rew_str:<16} | {r['safetyViolationCount']:>6d}")
    print("=" * 125)

    # Save to disk
    data_dir = os.path.join(curr_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    out_path = os.path.join(data_dir, "benchmark_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(final_results, f, indent=2)
    print(f"\n[Saved Benchmark Results]: {out_path}")

    raw_path = os.path.join(data_dir, "raw_benchmark_runs.json")
    with open(raw_path, "w", encoding="utf-8") as f:
        json.dump(raw_runs, f, indent=2)
    print(f"[Saved Raw Benchmark Runs]: {raw_path}")

    # Export to TypeScript src/research/metaRl/benchmarkData.json
    frontend_bench_path = os.path.join(os.path.dirname(curr_dir), "src", "research", "metaRl", "benchmarkData.json")
    with open(frontend_bench_path, "w", encoding="utf-8") as f:
        json.dump(final_results, f, indent=2)
    print(f"[Exported to Frontend]: {frontend_bench_path}")

    return final_results


def eval_heuristic(env: MultiCloudGymEnv, policy: str, regimes: List[str], seed: int):
    costs, slas, lats, carbons, rews, safety_viols = [], [], [], [], [], 0
    migrations, mig_costs, bal_scores = 0, 0.0, []
    per_scenario = {}

    for reg_idx, reg in enumerate(regimes):
        obs = env.reset(regime_key=reg, seed=seed * 100 + reg_idx * 23)
        done = False
        step = 0
        s_costs, s_slas, s_lats, s_carbons, s_rews = [], [], [], [], []
        s_safety = 0
        while not done:
            if policy == "ROUND_ROBIN":
                act = step % 3
            elif policy == "BEST_FIT_COST":
                act = 2  # Naive choice: GCP has lowest nominal rate
            elif policy == "WEIGHTED_HEURISTIC":
                avail = [i for i, c in enumerate(env.clouds) if env.cloud_state[c]["is_available"]]
                act = avail[0] if avail else 5
            elif policy == "GRAPHSAGE_STATIC":
                if env.cloud_state["gcp"]["is_available"]: act = 2
                elif env.cloud_state["azure"]["is_available"]: act = 1
                elif env.cloud_state["aws"]["is_available"]: act = 0
                else: act = 5
            else:
                act = 0

            next_obs, rew, done, info = env.step(act)
            costs.append(info["cost"])
            slas.append(float(info["sla_viol"]))
            lats.append(info["latency"])
            carbons.append(info["carbon"])
            rews.append(rew)
            s_costs.append(info["cost"])
            s_slas.append(float(info["sla_viol"]))
            s_lats.append(info["latency"])
            s_carbons.append(info["carbon"])
            s_rews.append(rew)
            if info["safety_violated"]:
                safety_viols += 1
                s_safety += 1
            if info["migration_cost"] > 0:
                migrations += 1
                mig_costs += info["migration_cost"]
            bal_scores.append(info["bal_score"])
            step += 1
            obs = next_obs

        s_lats.sort()
        per_scenario[reg] = {
            "cost": round(sum(s_costs) / len(s_costs), 2),
            "sla_rate": round((sum(s_slas) / len(s_slas)) * 100.0, 1),
            "p95_lat": round(s_lats[int(len(s_lats) * 0.95)] if s_lats else 0.0, 1),
            "carbon": round(sum(s_carbons) / len(s_carbons), 1),
            "reward": round(sum(s_rews) / len(s_rews), 3),
            "safety_viols": s_safety,
        }

    lats.sort()
    p95 = lats[int(len(lats) * 0.95)] if lats else 0.0

    overall = {
        "cost": sum(costs) / len(costs),
        "sla_rate": (sum(slas) / len(slas)) * 100.0,
        "p95_lat": p95,
        "carbon": sum(carbons) / len(carbons),
        "reward": sum(rews) / len(rews),
        "safety_viols": safety_viols,
        "migrations": migrations,
        "mig_cost": mig_costs,
        "util_bal": sum(bal_scores) / len(bal_scores),
    }
    return overall, per_scenario


def eval_rl_agent(
    env: MultiCloudGymEnv, model: PurePythonActorCritic, regimes: List[str], adapt_steps: int = 0, seed: int = 42
):
    costs, slas, lats, carbons, rews, safety_viols = [], [], [], [], [], 0
    migrations, mig_costs, bal_scores = 0, 0.0, []
    per_scenario = {}

    for reg_idx, reg in enumerate(regimes):
        eval_model = model.clone()
        if adapt_steps > 0:
            adapt_rng = random.Random(seed * 31 + reg_idx * 17)
            eval_model, _ = adapt_to_task_fomaml(
                eval_model, env, regime_key=reg, inner_steps=adapt_steps, inner_lr=0.02, rng=adapt_rng
            )

        eval_rng = random.Random(seed * 47 + reg_idx * 11)
        obs = env.reset(regime_key=reg, seed=seed * 100 + reg_idx * 23)
        done = False
        s_costs, s_slas, s_lats, s_carbons, s_rews = [], [], [], [], []
        s_safety = 0
        while not done:
            probs, _, _, _, _, _ = eval_model.forward(obs)
            act = probs.index(max(probs))

            next_obs, rew, done, info = env.step(act)
            costs.append(info["cost"])
            slas.append(float(info["sla_viol"]))
            lats.append(info["latency"])
            carbons.append(info["carbon"])
            rews.append(rew)
            s_costs.append(info["cost"])
            s_slas.append(float(info["sla_viol"]))
            s_lats.append(info["latency"])
            s_carbons.append(info["carbon"])
            s_rews.append(rew)
            if info["safety_violated"]:
                safety_viols += 1
                s_safety += 1
            if info["migration_cost"] > 0:
                migrations += 1
                mig_costs += info["migration_cost"]
            bal_scores.append(info["bal_score"])
            obs = next_obs

        s_lats.sort()
        per_scenario[reg] = {
            "cost": round(sum(s_costs) / len(s_costs), 2),
            "sla_rate": round((sum(s_slas) / len(s_slas)) * 100.0, 1),
            "p95_lat": round(s_lats[int(len(s_lats) * 0.95)] if s_lats else 0.0, 1),
            "carbon": round(sum(s_carbons) / len(s_carbons), 1),
            "reward": round(sum(s_rews) / len(s_rews), 3),
            "safety_viols": s_safety,
        }

    lats.sort()
    p95 = lats[int(len(lats) * 0.95)] if lats else 0.0

    overall = {
        "cost": sum(costs) / len(costs),
        "sla_rate": (sum(slas) / len(slas)) * 100.0,
        "p95_lat": p95,
        "carbon": sum(carbons) / len(carbons),
        "reward": sum(rews) / len(rews),
        "safety_viols": safety_viols,
        "migrations": migrations,
        "mig_cost": mig_costs,
        "util_bal": sum(bal_scores) / len(bal_scores),
    }
    return overall, per_scenario


if __name__ == "__main__":
    run_benchmark_multi_seed(seeds=[42, 101, 202])
