# CloudOptiX
### AI-Driven Autonomous Resource Allocation and Workload Management in Multi-Cloud Environments

<p align="center">
  <strong>Intelligent • Constraint-Aware • Graph-Based • Multi-Cloud Optimization</strong>
</p>

CloudOptiX is an AI-driven multi-cloud workload placement and resource optimization platform designed to make intelligent infrastructure allocation decisions across heterogeneous cloud environments.

The project explores how **Graph Neural Networks (GNNs), specifically GraphSAGE**, can model relationships between workloads and cloud resources to support multi-objective placement decisions while respecting resource, latency, SLA, and policy constraints.

Rather than relying exclusively on traditional weighted scoring, CloudOptiX combines graph-based learning with deterministic feasibility enforcement to produce more informed and constraint-aware placement decisions.

---

## Table of Contents

- Overview
- Problem Statement
- Key Features
- System Architecture
- GraphSAGE Research Implementation
- Technology Stack
- Optimization Objectives
- Experimental Evaluation
- Project Structure
- Getting Started
- Research Contributions
- Limitations
- Future Scope
- Team
- License

---

## 1. Overview

Modern applications increasingly operate across multiple cloud providers, including AWS, Microsoft Azure, and Google Cloud Platform.

However, selecting the most suitable infrastructure for a workload is challenging because cloud environments differ in:

- Computational capacity
- Memory availability
- Infrastructure costs
- Network latency
- SLA requirements
- Resource utilization
- Environmental impact

CloudOptiX addresses this challenge through an intelligent workload placement framework that evaluates workload-resource relationships and identifies suitable placement candidates.

The research implementation uses a GraphSAGE-based architecture to learn node representations from a workload-resource graph. A pair-scoring network evaluates candidate workload-resource placements, while a hard feasibility mask prevents placements that violate defined constraints.

## 2. Problem Statement

Traditional cloud workload placement approaches often rely on static rules, heuristic algorithms, or weighted scoring mechanisms.

These approaches may struggle to capture complex relationships between workloads and heterogeneous cloud resources.

CloudOptiX investigates the following research question:

**Can a constraint-aware GraphSAGE-based approach support multi-objective workload placement decisions in heterogeneous multi-cloud environments?**

The system considers multiple optimization objectives while maintaining resource and operational constraints.

## 3. Key Features

### Graph-Based Workload Representation
- Represents workloads and cloud resources as nodes in a graph.
- Models relationships through graph edges.
- Extracts contextual node embeddings using GraphSAGE.

### Constraint-Aware Placement
- Evaluates CPU and memory requirements.
- Considers latency and SLA constraints.
- Applies hard feasibility filtering before final placement selection.

### Multi-Objective Optimization
- Infrastructure cost optimization.
- Latency-aware placement.
- SLA compliance.
- Resource utilization.
- Carbon impact estimation.
- Network communication considerations.

### GraphSAGE-Based Learning
- Two-layer GraphSAGE encoder.
- Learned 16-dimensional node embeddings.
- MLP-based workload-resource pair scoring.
- PyTorch-based model training and evaluation.

### Comparative Evaluation
The research implementation compares the proposed approach against:
- Random Feasible Placement
- Round Robin
- Best Fit
- Weighted Scoring Baseline
- GraphSAGE without Hard Mask
- GraphSAGE with Hard Mask

---

## 4. System Architecture

CloudOptiX follows a graph-based decision architecture.

**High-level workflow:**

1. Workload and cloud-resource information is collected.
2. Workloads and infrastructure resources are represented as graph nodes.
3. Relationships are represented through graph edges.
4. GraphSAGE generates contextual node embeddings.
5. An MLP scores workload-resource placement candidates.
6. A hard feasibility mask eliminates constraint-violating candidates.
7. The system selects a feasible placement based on candidate scores.
8. Evaluation metrics are used to compare placement strategies.

### Architecture Flow

```text
        Workload Information
                 |
                 v
       Cloud Resource Information
                 |
                 v
          Graph Construction
                 |
                 v
        Heterogeneous Graph
                 |
                 v
          GraphSAGE Encoder
                 |
                 v
        16-D Node Embeddings
                 |
                 v
       Workload-Resource Pair
              Features
                 |
                 v
          MLP Pair Scorer
                 |
                 v
        Candidate Placement Scores
                 |
                 v
        Hard Feasibility Mask
                 |
                 v
        Feasible Placement Selection
                 |
                 v
        Multi-Objective Evaluation
```

---

## 5. GraphSAGE Research Implementation

CloudOptiX includes a genuine PyTorch-based GraphSAGE training and evaluation pipeline.

### Graph Configuration

| Component | Configuration |
|---|---|
| Total graph nodes | 143 |
| Workload nodes | 140 |
| Cloud resource nodes | 3 |
| Graph edges | 1,787 |
| Node features | 6 |
| Pairwise interaction features | 4 |
| GraphSAGE layers | 2 |
| Embedding dimension | 16 |

### Model Architecture

The GraphSAGE encoder uses two layers:

- Input dimension: 6
- First GraphSAGE layer: 6 → 16
- Second GraphSAGE layer: 16 → 16

The generated embeddings are used by a pair-scoring MLP.

**Pair-scoring network:**

- Input dimension: 36
- Hidden dimension: 16
- Output dimension: 1

The 36-dimensional input combines:
- 16-dimensional workload embedding
- 16-dimensional cloud-resource embedding
- 4 pairwise interaction features

### Training Configuration

| Parameter | Value |
|---|---|
| Framework | PyTorch |
| Loss Function | BCEWithLogitsLoss |
| Optimizer | Adam |
| Initial Learning Rate | 0.015 |
| Weight Decay | 0.0001 |
| Scheduler | CosineAnnealingLR |
| Minimum Learning Rate | 0.0001 |
| Training Epochs | 40 |
| Dataset Split | 70% / 15% / 15% |
| Random Seed | 42 |

The training pipeline includes workload-identity-based data splitting, validation, checkpointing, and evaluation.

---

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React-based web application |
| Styling | Tailwind CSS |
| Backend | Node.js |
| AI / ML | Python, PyTorch |
| Graph Learning | GraphSAGE |
| Model Evaluation | Python-based research pipeline |
| Deployment | Vercel |
| Version Control | Git and GitHub |

---

## 7. Optimization Objectives

CloudOptiX investigates workload placement across multiple optimization dimensions.

| Objective | Purpose |
|---|---|
| Cost | Reduce estimated infrastructure expenditure |
| Latency | Minimize workload response delay |
| SLA | Maintain service-level requirements |
| Resource Headroom | Avoid resource over-allocation |
| Carbon Impact | Reduce estimated environmental impact |
| Network Communication | Consider communication overhead |

The research benchmark uses a multi-objective evaluation framework to compare placement strategies.

---

## 8. Experimental Evaluation

The current research evaluation uses a simulated benchmark containing 36 workloads and three cloud-resource nodes.

Six placement strategies are compared under the same benchmark configuration.

### Benchmark Results

| Strategy | Monthly Cost | SLA Violations | Latency |
|---|---:|---:|---:|
| Random Feasible | $71,248 | 0% | 30.8 ms |
| Round Robin | $71,474 | 0% | 31 ms |
| Best Fit | $67,364 | 0% | 25 ms |
| Weighted Baseline | $74,672 | 5.6% | 25.5 ms |
| GraphSAGE | $74,226 | 5.6% | 25 ms |
| GraphSAGE + Hard Mask | $67,364 | 0% | 25 ms |

### Key Observations

- GraphSAGE with hard feasibility masking achieved an estimated monthly cost of $67,364.
- This represents approximately 9.8% lower estimated cost than the weighted baseline.
- SLA violations decreased from 5.6% to 0% in the evaluated benchmark.
- Estimated carbon impact decreased from 243.8 kg/day to 202.9 kg/day compared with the weighted baseline.
- The proposed approach matched Best Fit on the reported cost, latency, and carbon metrics.

**Important:** These are results from a simulated research benchmark, not measurements from live AWS, Azure, or GCP deployments. The proposed approach does not outperform every baseline; its results demonstrate the potential of combining graph-based scoring with explicit constraint enforcement.

---

## 9. Project Structure

The repository is organized around the application and research implementation.

```text
CloudOptiX/
│
├── src/
│   └── services/
│       └── aiEngine.ts
│
├── gnn_research/
│   ├── model.py
│   ├── checkpoints/
│   │   └── graphsage_v1.pt
│   └── trainedWeights.json
│
├── public/
│
├── package.json
│
└── README.md
```

*Note: This is a high-level representation. Update the tree to match the latest repository structure before publishing.*

---

## 10. Getting Started

### Prerequisites

- Node.js
- npm
- Python 3
- Git

### Clone the Repository

```bash
git clone https://github.com/Shrikrushn07/cloudoptix.git

cd cloudoptix
```

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm run dev
```

The exact commands for the Python research pipeline depend on the available scripts and dependency files in the `gnn_research` directory.

---

## 11. Research Contributions

The key research contributions explored in CloudOptiX include:

1. **Graph-Based Infrastructure Representation:** Modeling workload-resource relationships using a heterogeneous graph.

2. **GraphSAGE-Based Representation Learning:** Learning contextual embeddings for workload and cloud-resource nodes.

3. **Pairwise Placement Scoring:** Using an MLP to evaluate workload-resource candidate relationships.

4. **Hard Constraint Enforcement:** Separating feasibility filtering from learned candidate scoring.

5. **Multi-Objective Evaluation:** Comparing cost, latency, SLA compliance, resource utilization, and estimated carbon impact.

6. **Comparative Benchmarking:** Evaluating the proposed approach against multiple heuristic and baseline placement strategies.

---

## 12. Limitations

The current implementation has several limitations:

- The benchmark uses simulated workload and cloud-resource data.
- Live cloud-provider telemetry integration has not been established as part of the reported experiment.
- The benchmark represents a limited workload population.
- Carbon impact values are estimates rather than directly metered emissions.
- The reported comparison is based on a single simulated benchmark run.
- Large-scale production deployment and real-world generalization require further validation.

These limitations define important directions for future research.

---

## 13. Future Scope

Potential future improvements include:

- Integration with live AWS, Azure, and GCP telemetry.
- Real-time workload monitoring and dynamic placement.
- Larger and more diverse benchmark datasets.
- Reinforcement learning for adaptive placement decisions.
- Advanced graph architectures and heterogeneous graph learning.
- Kubernetes-based workload orchestration.
- Carbon-aware scheduling using real-time energy information.
- Multi-cloud deployment automation and execution feedback.

---

## 14. Team

**Project: CloudOptiX**

Department of Information Technology  
Alliance University, Bengaluru, India

| Team Member |
|---|
| Shrikrushn Pramod Bhise |
| Shivam Yadav |
| Arya Nileshkumar Manoj |
| Mohemmed Adnan |

---

## 15. Project Links

- **GitHub Repository:** https://github.com/Shrikrushn07/cloudoptix
- **Live Demo:** https://cloudoptixv2.vercel.app/

---

## 16. License

This project is developed as an academic and research initiative. Licensing and reuse permissions should be defined through the repository's selected open-source license.

---

<p align="center">
  <strong>CloudOptiX — Towards Intelligent, Constraint-Aware Multi-Cloud Workload Orchestration.</strong>
</p>
