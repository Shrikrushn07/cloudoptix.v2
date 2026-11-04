"""
CloudOptiX Research Engine: GraphSAGE Multi-Objective Placement Model
PyTorch Implementation with Dense GraphSAGE Mean Aggregation,
Link Readout MLP, and TypeScript Weight Export.
"""

import os
from typing import Dict, Any, Tuple
import torch
import torch.nn as nn
import torch.nn.functional as F


class DenseSAGEConv(nn.Module):
    """
    GraphSAGE Mean-Aggregation Layer with separate self and neighbor transformations.
    H^{(l+1)} = normalize(LeakyReLU(W_self * H^{(l)} + W_neigh * AGG({H^{(l)}_u : u in N(v)}) + b))
    """
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.lin_self = nn.Linear(in_channels, out_channels, bias=True)
        self.lin_neigh = nn.Linear(in_channels, out_channels, bias=False)

        # Initialize with Xavier uniform
        nn.init.xavier_uniform_(self.lin_self.weight)
        nn.init.zeros_(self.lin_self.bias)
        nn.init.xavier_uniform_(self.lin_neigh.weight)

    def forward(self, x: torch.Tensor, norm_adj: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Node feature tensor [num_nodes, in_channels]
            norm_adj: Normalized adjacency matrix [num_nodes, num_nodes] (D^-1 * (A + I))
        Returns:
            out: L2-normalized node representations [num_nodes, out_channels]
        """
        neigh_agg = torch.matmul(norm_adj, x)
        out = self.lin_self(x) + self.lin_neigh(neigh_agg)
        out = F.leaky_relu(out, negative_slope=0.05)
        out = F.normalize(out, p=2, dim=-1)
        return out


class CloudOptiXGraphSAGE(nn.Module):
    """
    Constraint-Aware 2-Layer GraphSAGE Architecture for Heterogeneous Cloud Placement Graphs.
    Passes representations through 2 SAGE layers followed by a link-scoring readout MLP.
    """
    def __init__(
        self,
        node_in_dim: int = 6,
        hidden_dim: int = 16,
        embed_dim: int = 16,
        edge_feat_dim: int = 4,
        dropout_p: float = 0.1,
    ):
        super().__init__()
        self.node_in_dim = node_in_dim
        self.hidden_dim = hidden_dim
        self.embed_dim = embed_dim
        self.edge_feat_dim = edge_feat_dim

        # Layer 1: 6 -> 16
        self.conv1 = DenseSAGEConv(node_in_dim, hidden_dim)
        # Layer 2: 16 -> 16
        self.conv2 = DenseSAGEConv(hidden_dim, embed_dim)

        # Readout Link MLP: [w_embed (16) || c_embed (16) || candidate_features (4)] = 36 -> 16 -> 1
        link_in_dim = embed_dim * 2 + edge_feat_dim
        self.link_mlp = nn.Sequential(
            nn.Linear(link_in_dim, 16),
            nn.LeakyReLU(0.05),
            nn.Dropout(p=dropout_p),
            nn.Linear(16, 1),
        )

    def encode(self, x: torch.Tensor, norm_adj: torch.Tensor) -> torch.Tensor:
        """
        Computes 2-layer inductive message passing across the entire cloud-workload topology.
        """
        h1 = self.conv1(x, norm_adj)
        h2 = self.conv2(h1, norm_adj)
        return h2

    def score_candidates(
        self,
        node_embeds: torch.Tensor,
        candidate_pairs: torch.Tensor,
        interaction_features: torch.Tensor,
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            node_embeds: [num_nodes, embed_dim]
            candidate_pairs: [num_candidates, 2] with (workload_node_idx, cloud_node_idx)
            interaction_features: [num_candidates, 4] normalized interaction features
        Returns:
            logits: [num_candidates, 1]
            probabilities: [num_candidates, 1] in [0, 1]
        """
        w_idx = candidate_pairs[:, 0]
        c_idx = candidate_pairs[:, 1]
        w_rep = node_embeds[w_idx]
        c_rep = node_embeds[c_idx]

        joint_rep = torch.cat([w_rep, c_rep, interaction_features], dim=-1)
        logits = self.link_mlp(joint_rep)
        probabilities = torch.sigmoid(logits)
        return logits, probabilities

    def forward(
        self,
        x: torch.Tensor,
        norm_adj: torch.Tensor,
        candidate_pairs: torch.Tensor,
        interaction_features: torch.Tensor,
    ) -> torch.Tensor:
        """
        End-to-end forward pass producing placement probabilities in [0, 1].
        """
        node_embeds = self.encode(x, norm_adj)
        _, probs = self.score_candidates(node_embeds, candidate_pairs, interaction_features)
        return probs

    def export_weights_for_typescript(
        self,
        trained_epochs: int = 50,
        final_loss: float = 0.0,
        dataset_size: int = 140,
    ) -> Dict[str, Any]:
        """
        Exports weight matrices matching the TypeScript `GraphSageModelWeights` format
        for zero-overhead client-side and full-stack inference.
        """
        with torch.no_grad():
            w_out = self.link_mlp[3].weight.detach().cpu().squeeze().tolist()
            b_out = float(self.link_mlp[3].bias.detach().cpu().item())

            return {
                "version": "v1.0.0-graphsage-pytorch",
                "architecture": "GraphSAGE-2L-MeanAggregator",
                "inputDim": self.node_in_dim,
                "hiddenDim": self.hidden_dim,
                "embedDim": self.embedDim if hasattr(self, 'embedDim') else self.embed_dim,
                "W_self_1": self.conv1.lin_self.weight.detach().cpu().tolist(),
                "W_neigh_1": self.conv1.lin_neigh.weight.detach().cpu().tolist(),
                "b_1": self.conv1.lin_self.bias.detach().cpu().tolist(),
                "W_self_2": self.conv2.lin_self.weight.detach().cpu().tolist(),
                "W_neigh_2": self.conv2.lin_neigh.weight.detach().cpu().tolist(),
                "b_2": self.conv2.lin_self.bias.detach().cpu().tolist(),
                "W_link": self.link_mlp[0].weight.detach().cpu().tolist(),
                "b_link": self.link_mlp[0].bias.detach().cpu().tolist(),
                "W_out": w_out,
                "b_out": b_out,
                "trainedEpochs": trained_epochs,
                "finalLoss": round(final_loss, 5),
                "trainingTimestamp": torch.datetime if hasattr(torch, 'datetime') else "2026-11-01T12:00:00Z",
                "datasetSize": dataset_size,
            }

    def save_checkpoint(self, path: str, metadata: Dict[str, Any] = None):
        """
        Saves standard PyTorch state dictionary checkpoint.
        """
        os.makedirs(os.path.dirname(path), exist_ok=True)
        checkpoint = {
            "model_state_dict": self.state_dict(),
            "node_in_dim": self.node_in_dim,
            "hidden_dim": self.hidden_dim,
            "embed_dim": self.embed_dim,
            "edge_feat_dim": self.edge_feat_dim,
            "metadata": metadata or {},
        }
        torch.save(checkpoint, path)

    @classmethod
    def load_from_checkpoint(cls, path: str, device: str = "cpu") -> "CloudOptiXGraphSAGE":
        """
        Instantiates and loads model state from a PyTorch checkpoint.
        """
        checkpoint = torch.load(path, map_location=device, weights_only=False)
        model = cls(
            node_in_dim=checkpoint.get("node_in_dim", 6),
            hidden_dim=checkpoint.get("hidden_dim", 16),
            embed_dim=checkpoint.get("embed_dim", 16),
            edge_feat_dim=checkpoint.get("edge_feat_dim", 4),
        )
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(device)
        model.eval()
        return model
