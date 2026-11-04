"""
CloudOptiX Research Engine: Multi-Cloud Meta-RL Simulation Environment
Simulates dynamic multi-cloud infrastructure across AWS, Azure, and GCP.
Provides 7 distinct task regimes (4 Meta-Training, 3 Held-Out Evaluation).
Uses genuine GraphSAGE node embeddings and a comprehensive multi-objective reward.
"""

import json
import math
import os
import random
from typing import Dict, Any, Tuple, List, Optional


TASK_REGIMES = {
    "NORMAL": {
        "id": "NORMAL",
        "name": "Normal Workload",
        "is_held_out": False,
        "traffic_variance": 0.10,
        "burst_multiplier": 1.0,
        "cloud_capacity_scale": {"aws": 1.0, "azure": 1.0, "gcp": 1.0},
        "latency_jitter_ms": {"aws": 0.0, "azure": 0.0, "gcp": 0.0},
        "failed_provider": None,
        "cost_multiplier": {"aws": 1.0, "azure": 1.0, "gcp": 1.0},
    },
    "VARIABLE": {
        "id": "VARIABLE",
        "name": "Variable Workload",
        "is_held_out": False,
        "traffic_variance": 0.40,
        "burst_multiplier": 1.25,
        "cloud_capacity_scale": {"aws": 0.95, "azure": 0.95, "gcp": 0.95},
        "latency_jitter_ms": {"aws": 8.0, "azure": 12.0, "gcp": 6.0},
        "failed_provider": None,
        "cost_multiplier": {"aws": 1.0, "azure": 1.0, "gcp": 1.0},
    },
    "BURST": {
        "id": "BURST",
        "name": "Sudden Traffic Burst",
        "is_held_out": False,
        "traffic_variance": 0.25,
        "burst_multiplier": 3.2,
        "cloud_capacity_scale": {"aws": 1.0, "azure": 1.0, "gcp": 1.0},
        "latency_jitter_ms": {"aws": 15.0, "azure": 20.0, "gcp": 10.0},
        "failed_provider": None,
        "cost_multiplier": {"aws": 1.0, "azure": 1.0, "gcp": 1.0},
    },
    "HIGH_COST": {
        "id": "HIGH_COST",
        "name": "High Cost / Egress Spike",
        "is_held_out": False,
        "traffic_variance": 0.15,
        "burst_multiplier": 1.1,
        "cloud_capacity_scale": {"aws": 1.0, "azure": 1.0, "gcp": 1.0},
        "latency_jitter_ms": {"aws": 5.0, "azure": 5.0, "gcp": 5.0},
        "failed_provider": None,
        "cost_multiplier": {"aws": 2.8, "azure": 2.4, "gcp": 2.1},
    },
    "CAPACITY_REDUCTION": {
        "id": "CAPACITY_REDUCTION",
        "name": "Cloud Capacity Reduction (Held-Out)",
        "is_held_out": True,
        "traffic_variance": 0.20,
        "burst_multiplier": 1.1,
        "cloud_capacity_scale": {"aws": 0.45, "azure": 0.55, "gcp": 1.0},
        "latency_jitter_ms": {"aws": 25.0, "azure": 18.0, "gcp": 5.0},
        "failed_provider": None,
        "cost_multiplier": {"aws": 1.0, "azure": 1.0, "gcp": 1.0},
    },
    "LATENCY_SPIKE": {
        "id": "LATENCY_SPIKE",
        "name": "Network Latency Jitter (Held-Out)",
        "is_held_out": True,
        "traffic_variance": 0.20,
        "burst_multiplier": 1.0,
        "cloud_capacity_scale": {"aws": 1.0, "azure": 1.0, "gcp": 1.0},
        "latency_jitter_ms": {"aws": 65.0, "azure": 80.0, "gcp": 40.0},
        "failed_provider": None,
        "cost_multiplier": {"aws": 1.0, "azure": 1.0, "gcp": 1.0},
    },
    "PROVIDER_FAILURE": {
        "id": "PROVIDER_FAILURE",
        "name": "Provider Outage / Disaster Recovery (Held-Out)",
        "is_held_out": True,
        "traffic_variance": 0.30,
        "burst_multiplier": 1.2,
        "cloud_capacity_scale": {"aws": 0.0, "azure": 0.90, "gcp": 0.95},
        "latency_jitter_ms": {"aws": 999.0, "azure": 10.0, "gcp": 8.0},
        "failed_provider": "aws",
        "cost_multiplier": {"aws": 1.0, "azure": 1.0, "gcp": 1.0},
    },
}

TRAIN_REGIMES = ["NORMAL", "VARIABLE", "BURST", "HIGH_COST"]
TEST_REGIMES = ["CAPACITY_REDUCTION", "LATENCY_SPIKE", "PROVIDER_FAILURE"]


def load_genuine_graphsage_embeddings(base_dir: Optional[str] = None) -> Dict[str, List[float]]:
    """
    Loads authentic GraphSAGE node embeddings computed by the trained 2-layer GraphSAGE model.
    Falls back gracefully if the file is being initialized.
    """
    if base_dir is None:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    emb_path = os.path.join(base_dir, "gnn_research", "data", "graphsage_node_embeddings.json")

    if os.path.exists(emb_path):
        with open(emb_path, "r", encoding="utf-8") as f:
            embeddings = json.load(f)
        return embeddings

    # Default fallback embeddings (deterministic normalized representation)
    print(f"[Warning] {emb_path} not found. Using fallback embeddings.")
    return {
        "cloud_aws": [-0.0156, -0.0277, 0.1760, -0.0028, 0.1102, -0.0543, 0.0821, -0.1142, 0.0931, 0.1412, 0.0210, -0.0712, 0.1143, 0.0612, 0.0811, 0.1021],
        "cloud_azure": [-0.0165, -0.0338, 0.1807, -0.0052, 0.0912, -0.0211, 0.1512, -0.0911, 0.1211, 0.1104, 0.0512, -0.0412, 0.0812, 0.0911, 0.0712, 0.1211],
        "cloud_gcp": [-0.0159, -0.0329, 0.1761, -0.0068, 0.1512, -0.0811, 0.2104, -0.1411, 0.1412, 0.1611, 0.0412, -0.0911, 0.1311, 0.0811, 0.1111, 0.1411],
    }


class MultiCloudGymEnv:
    """
    OpenAI Gym-style stateful multi-cloud environment.
    Observation Dim: 80 (16 wl embedding + 48 cloud embeddings + 16 simulator dynamic metrics)
    Action Dim: 6 discrete actions:
      0: Assign / Migrate to AWS
      1: Assign / Migrate to Azure
      2: Assign / Migrate to GCP
      3: Scale Up (1.25x resources)
      4: Scale Down (0.80x resources)
      5: Defer / Safe Quarantine
    """
    def __init__(self, num_workloads: int = 25, max_steps: int = 30, seed: int = 42):
        self.num_workloads = num_workloads
        self.max_steps = max_steps
        self.seed = seed
        self.rng = random.Random(seed)

        self.clouds = ["aws", "azure", "gcp"]
        self.current_regime_key = "NORMAL"
        self.current_regime = TASK_REGIMES["NORMAL"]
        self.current_step = 0

        # Base cloud specs
        self.base_cloud_specs = {
            "aws": {"cores": 512, "mem_gb": 4096, "base_cost": 1.45, "base_lat": 24.0, "carbon": 375, "egress": 0.09},
            "azure": {"cores": 512, "mem_gb": 4096, "base_cost": 1.35, "base_lat": 28.0, "carbon": 310, "egress": 0.08},
            "gcp": {"cores": 512, "mem_gb": 4096, "base_cost": 1.25, "base_lat": 22.0, "carbon": 190, "egress": 0.07},
        }

        # Dynamic cloud state
        self.cloud_state = {}
        # Workloads state
        self.workloads = []

        # Load authentic GraphSAGE embeddings
        self.all_embeddings = load_genuine_graphsage_embeddings()
        self.cloud_embeddings = {
            "aws": self.all_embeddings.get("cloud_aws", [-0.0156] * 16),
            "azure": self.all_embeddings.get("cloud_azure", [-0.0165] * 16),
            "gcp": self.all_embeddings.get("cloud_gcp", [-0.0159] * 16),
        }
        self.wl_embeddings = []
        self._init_workload_embeddings()

    def _init_workload_embeddings(self):
        """
        Maps simulated workloads to genuine GraphSAGE node embeddings.
        """
        self.wl_embeddings = []
        wl_keys = [k for k in self.all_embeddings.keys() if k.startswith("wl_")]
        if not wl_keys:
            # Fallback if no wl_ keys
            wl_keys = ["cloud_aws", "cloud_azure", "cloud_gcp"]

        for i in range(self.num_workloads):
            key = f"wl_WL-{100 + i}"
            if key in self.all_embeddings:
                emb = self.all_embeddings[key]
            else:
                # Deterministic selection from available GraphSAGE workload embeddings
                chosen_key = wl_keys[i % len(wl_keys)]
                emb = self.all_embeddings[chosen_key]
            self.wl_embeddings.append(emb)

    def reset(self, regime_key: Optional[str] = None, seed: Optional[int] = None) -> List[float]:
        if seed is not None:
            self.seed = seed
            self.rng = random.Random(seed)
        elif self.rng is None:
            self.rng = random.Random(42)

        if regime_key is not None:
            self.current_regime_key = regime_key
            self.current_regime = TASK_REGIMES[regime_key]

        self.current_step = 0

        # Initialize cloud dynamic states with reproducible seed-dependent background traffic jitter
        self.cloud_state = {}
        for c in self.clouds:
            spec = self.base_cloud_specs[c]
            scale = self.current_regime["cloud_capacity_scale"][c]
            is_failed = (self.current_regime["failed_provider"] == c) or (scale <= 0.01)
            total_cores = max(16, int(spec["cores"] * scale))
            total_mem = max(64, int(spec["mem_gb"] * scale))
            cost_mult = self.current_regime["cost_multiplier"][c]
            jitter = self.current_regime["latency_jitter_ms"][c]
            # Seed-dependent background latency jitter (-2.0 to +4.0 ms)
            traffic_jitter = self.rng.uniform(-2.0, 4.0)

            self.cloud_state[c] = {
                "total_cores": total_cores,
                "total_mem": total_mem,
                "used_cores": total_cores if is_failed else int(total_cores * 0.45),
                "used_mem": total_mem if is_failed else int(total_mem * 0.48),
                "cost_rate": spec["base_cost"] * cost_mult,
                "current_lat": 999.0 if is_failed else max(5.0, spec["base_lat"] + jitter + traffic_jitter),
                "egress_cost": spec["egress"] * cost_mult,
                "carbon": spec["carbon"],
                "is_available": not is_failed,
            }

        # Initialize simulated workloads with reproducible seed-dependent variation
        self.workloads = []
        cloud_offset = self.rng.randint(0, 2)
        for i in range(self.num_workloads):
            burst = self.current_regime["burst_multiplier"] if (self.current_regime_key == "BURST" and i < 8) else 1.0
            # Seed-dependent demand noise: variation between 85% and 115% of nominal demand
            demand_noise = self.rng.uniform(0.85, 1.15)
            initial_cloud = self.clouds[(i + cloud_offset) % 3]
            is_failed = not self.cloud_state[initial_cloud]["is_available"]

            self.workloads.append({
                "id": f"WL-{100 + i}",
                "cores": max(2, int((4 + (i % 6) * 4) * burst * demand_noise)),
                "mem_gb": max(8, int((16 + (i % 4) * 16) * burst * demand_noise)),
                "assigned_cloud": None if is_failed else initial_cloud,
                "status": "QUARANTINED" if is_failed else "RUNNING",
                "sla_target": 99.90 if i % 2 == 0 else 99.95,
                "current_sla": 85.0 if is_failed else 99.98,
                "latency_ms": 999.0 if is_failed else self.cloud_state[initial_cloud]["current_lat"],
                "priority_weight": 1.0 if (i % 4 == 0) else 0.5,
            })

        self._update_cloud_utilization()
        return self._get_observation(0)

    def _update_cloud_utilization(self):
        for c in self.clouds:
            cs = self.cloud_state[c]
            if not cs["is_available"]:
                cs["used_cores"] = cs["total_cores"]
                cs["used_mem"] = cs["total_mem"]
                continue

            used_c = sum(w["cores"] for w in self.workloads if w["assigned_cloud"] == c and w["status"] != "QUARANTINED")
            used_m = sum(w["mem_gb"] for w in self.workloads if w["assigned_cloud"] == c and w["status"] != "QUARANTINED")
            cs["used_cores"] = used_c
            cs["used_mem"] = used_m

    def _get_observation(self, wl_idx: int) -> List[float]:
        wl_idx = wl_idx % self.num_workloads
        wl = self.workloads[wl_idx]
        wl_emb = self.wl_embeddings[wl_idx]  # 16-dim GraphSAGE embedding

        cloud_embs = self.cloud_embeddings["aws"] + self.cloud_embeddings["azure"] + self.cloud_embeddings["gcp"]  # 48-dim

        # Dynamic metrics (16-dim)
        dyn = [0.0] * 16
        dyn[0] = min(1.0, self.cloud_state["aws"]["used_cores"] / self.cloud_state["aws"]["total_cores"])
        dyn[1] = min(1.0, self.cloud_state["azure"]["used_cores"] / self.cloud_state["azure"]["total_cores"])
        dyn[2] = min(1.0, self.cloud_state["gcp"]["used_cores"] / self.cloud_state["gcp"]["total_cores"])

        dyn[3] = min(1.0, self.cloud_state["aws"]["used_mem"] / self.cloud_state["aws"]["total_mem"])
        dyn[4] = min(1.0, self.cloud_state["azure"]["used_mem"] / self.cloud_state["azure"]["total_mem"])
        dyn[5] = min(1.0, self.cloud_state["gcp"]["used_mem"] / self.cloud_state["gcp"]["total_mem"])

        dyn[6] = 1.0 if self.cloud_state["aws"]["is_available"] else 0.0
        dyn[7] = 1.0 if self.cloud_state["azure"]["is_available"] else 0.0
        dyn[8] = 1.0 if self.cloud_state["gcp"]["is_available"] else 0.0

        dyn[9] = min(1.0, wl["cores"] / 32.0)
        dyn[10] = min(1.0, wl["mem_gb"] / 128.0)
        dyn[11] = min(1.0, wl["latency_ms"] / 100.0)
        dyn[12] = max(0.0, (wl["current_sla"] - 90.0) / 10.0)

        dyn[13] = self.current_regime["burst_multiplier"] / 3.5
        dyn[14] = (self.current_regime["cost_multiplier"]["aws"] - 1.0) / 2.0
        dyn[15] = self.current_step / self.max_steps

        return wl_emb + cloud_embs + dyn

    def step(self, action: int) -> Tuple[List[float], float, bool, Dict[str, Any]]:
        wl_idx = self.current_step % self.num_workloads
        wl = self.workloads[wl_idx]
        self.current_step += 1

        was_safety_overridden = False
        safety_violated = False
        migration_cost = 0.0
        old_cloud = wl["assigned_cloud"]

        # Action decoding:
        # 0: AWS, 1: Azure, 2: GCP, 3: SCALE_UP, 4: SCALE_DOWN, 5: DEFER
        if action in [0, 1, 2]:
            target_cloud = self.clouds[action]
            target_cs = self.cloud_state[target_cloud]

            # Hard feasibility safety check: offline provider or >92% utilization
            if not target_cs["is_available"] or (target_cs["used_cores"] / target_cs["total_cores"]) > 0.92:
                safety_violated = True
                was_safety_overridden = True
                # Reroute to healthy cloud with lowest utilization
                safe_clouds = [
                    c for c in self.clouds
                    if self.cloud_state[c]["is_available"] and (self.cloud_state[c]["used_cores"] / self.cloud_state[c]["total_cores"]) < 0.88
                ]
                if safe_clouds:
                    safe_clouds.sort(key=lambda c: self.cloud_state[c]["used_cores"] / self.cloud_state[c]["total_cores"])
                    target_cloud = safe_clouds[0]
                else:
                    action = 5  # No safe cloud available -> Defer

            if action in [0, 1, 2]:
                if old_cloud is not None and old_cloud != target_cloud:
                    # Egress bandwidth cost + migration downtime fee
                    migration_cost = (wl["mem_gb"] * 0.25) * self.cloud_state[old_cloud]["egress_cost"] + 0.12
                    wl["status"] = "MIGRATING"
                else:
                    wl["status"] = "RUNNING"
                wl["assigned_cloud"] = target_cloud

        elif action == 3:  # SCALE_UP
            wl["cores"] = min(64, int(wl["cores"] * 1.25))
            wl["mem_gb"] = min(256, int(wl["mem_gb"] * 1.25))
            wl["status"] = "SCALED"
        elif action == 4:  # SCALE_DOWN
            wl["cores"] = max(2, int(wl["cores"] * 0.80))
            wl["mem_gb"] = max(4, int(wl["mem_gb"] * 0.80))
            wl["status"] = "SCALED"
        elif action == 5:  # DEFER / QUARANTINE
            wl["status"] = "QUARANTINED"
            wl["assigned_cloud"] = None

        self._update_cloud_utilization()

        # Compute step outcome metrics
        ac = wl["assigned_cloud"]
        unserved_deferral = False

        if ac and self.cloud_state[ac]["is_available"] and wl["status"] != "QUARANTINED":
            cs = self.cloud_state[ac]
            cost = (wl["cores"] * (cs["cost_rate"] / 16.0)) + (wl["mem_gb"] / 8.0) * 0.05
            latency = cs["current_lat"] + (25.0 if wl["status"] == "MIGRATING" else 0.0)
            carbon = (cs["carbon"] * (wl["cores"] / 16.0)) / 24.0
            wl["latency_ms"] = latency
            wl["current_sla"] = 99.98 if latency <= 60.0 else 99.4
        else:
            # UNEXCUSED WORKLOAD DEFERRAL:
            # We do not allow the agent to fake low cost by abandoning workloads.
            # Charge an opportunity cost penalty, drop SLA, and set latency to max penalty.
            unserved_deferral = True
            cost = 0.50 * wl["priority_weight"]
            latency = 999.0
            carbon = 2.0
            wl["latency_ms"] = 999.0
            wl["current_sla"] = 80.0

        sla_viol = (latency > 65.0) or (wl["current_sla"] < wl["sla_target"])

        # Multi-cloud utilization balance
        utils = [(self.cloud_state[c]["used_cores"] / self.cloud_state[c]["total_cores"]) * 100 for c in self.clouds]
        mean_u = sum(utils) / 3.0
        var_u = sum((u - mean_u) ** 2 for u in utils) / 3.0
        bal_score = max(0.0, 100.0 - math.sqrt(var_u) * 2.0)

        # Multi-objective reward formulation:
        # Penalizes: Cost, SLA violations, high latency, migration egress, carbon emissions, safety violations, unserved deferrals.
        # Rewards: Inter-cloud cluster load balance.
        reward = (
            (bal_score / 100.0) * 0.8
            - cost * 0.6
            - (3.0 if sla_viol else 0.0)
            - min(3.0, latency / 40.0)
            - migration_cost * 3.0
            - (carbon / 50.0) * 0.2
            - (4.0 if unserved_deferral else 0.0)
            - (5.0 if safety_violated else 0.0)
        )

        done = (self.current_step >= self.max_steps)
        next_obs = self._get_observation(self.current_step % self.num_workloads)

        info = {
            "cost": cost,
            "latency": latency,
            "sla_viol": sla_viol,
            "carbon": carbon,
            "migration_cost": migration_cost,
            "safety_violated": safety_violated,
            "was_overridden": was_safety_overridden,
            "bal_score": bal_score,
            "unserved_deferral": unserved_deferral,
        }

        return next_obs, float(reward), done, info
