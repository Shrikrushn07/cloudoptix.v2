import { CloudProvider, CloudProviderId, Workload } from '../../types';
import {
  HeterogeneousGraph,
  GraphNode,
  GraphEdge,
  GraphNodeFeatures,
  CloudNodeFeatures,
} from '../types';

// Workload dependency pairs (representing microservice call-graphs)
export const KNOWN_WORKLOAD_DEPENDENCIES: Array<{
  sourceType: string;
  targetType: string;
  callFrequencyPerSec: number;
  payloadKb: number;
}> = [
  { sourceType: 'Checkout API', targetType: 'Payment Gateway', callFrequencyPerSec: 140, payloadKb: 12 },
  { sourceType: 'Checkout API', targetType: 'Auth & Identity', callFrequencyPerSec: 110, payloadKb: 4 },
  { sourceType: 'Checkout API', targetType: 'Notification Service', callFrequencyPerSec: 35, payloadKb: 6 },
  { sourceType: 'Recommendation Engine', targetType: 'Realtime WebSockets', callFrequencyPerSec: 90, payloadKb: 18 },
  { sourceType: 'Document Processing', targetType: 'Batch Analytics', callFrequencyPerSec: 25, payloadKb: 120 },
  { sourceType: 'ML Training', targetType: 'Batch Analytics', callFrequencyPerSec: 15, payloadKb: 450 },
  { sourceType: 'Video Processing', targetType: 'Notification Service', callFrequencyPerSec: 20, payloadKb: 8 },
];

export function normalizeWorkloadFeatures(w: Workload): number[] {
  // 6 continuous dimensions normalized in [0, 1]
  const cpuNorm = Math.min(1.0, Math.max(0.05, w.cpuCores / 64)); // max 64 cores
  const memNorm = Math.min(1.0, Math.max(0.05, w.memoryGb / 256)); // max 256 GB
  const latencyNorm = Math.min(1.0, Math.max(0.05, w.latencyMs / 100)); // 0-100 ms
  const slaNorm = Math.max(0.0, (w.slaTargetPercent - 99.0) / 0.999); // 99.0 to 99.999%
  const priorityWeight =
    w.priority === 'CRITICAL' ? 1.0 : w.priority === 'HIGH' ? 0.75 : w.priority === 'MEDIUM' ? 0.5 : 0.25;
  const costNorm = Math.min(1.0, w.costPerHour / 2.0);

  return [
    Number(cpuNorm.toFixed(4)),
    Number(memNorm.toFixed(4)),
    Number(latencyNorm.toFixed(4)),
    Number(slaNorm.toFixed(4)),
    Number(priorityWeight.toFixed(4)),
    Number(costNorm.toFixed(4)),
  ];
}

export function normalizeCloudFeatures(c: CloudProvider): number[] {
  // 6 continuous dimensions normalized in [0, 1]
  const cpuAvailableRatio = Math.max(0, 1.0 - c.cpuUtilizedPercent / 100);
  const memAvailableRatio = Math.max(0, 1.0 - c.memoryUtilizedPercent / 100);
  // Cost: lower is better, normalized
  const costNorm = Math.min(1.0, c.costPerHour / 15.0);
  const latencyNorm = Math.min(1.0, c.averageLatencyMs / 80.0);
  const slaReliability = Math.max(0.0, (c.uptime90d - 99.9) / 0.099);
  // Carbon intensity: GCP=190g, Azure=310g, AWS=375g. Normalizing 100-500g
  const carbonNorm = Math.min(1.0, Math.max(0, (c.carbonIntensityGrams - 150) / 300));

  return [
    Number(cpuAvailableRatio.toFixed(4)),
    Number(memAvailableRatio.toFixed(4)),
    Number(costNorm.toFixed(4)),
    Number(latencyNorm.toFixed(4)),
    Number(slaReliability.toFixed(4)),
    Number(carbonNorm.toFixed(4)),
  ];
}

export function buildMultiCloudGraph(
  workloads: Workload[],
  clouds: Record<string, CloudProvider>,
  options: { includeDependencies?: boolean; includeInterconnects?: boolean } = {}
): HeterogeneousGraph {
  const { includeDependencies = true, includeInterconnects = true } = options;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const adjacencyList: Record<string, string[]> = {};
  const workloadNodeIds: string[] = [];
  const cloudNodeIds: string[] = [];

  const addEdge = (edge: GraphEdge) => {
    edges.push(edge);
    if (!adjacencyList[edge.source]) adjacencyList[edge.source] = [];
    if (!adjacencyList[edge.target]) adjacencyList[edge.target] = [];
    adjacencyList[edge.source].push(edge.target);
    adjacencyList[edge.target].push(edge.source);
  };

  // 1. Build Cloud Provider Nodes
  const cloudKeys: CloudProviderId[] = ['aws', 'azure', 'gcp'];
  cloudKeys.forEach((cid, index) => {
    const cloud = clouds[cid];
    if (cloud) {
      const nodeId = `cloud_${cid}`;
      cloudNodeIds.push(nodeId);
      nodes.push({
        id: nodeId,
        label: `${cloud.shortName} (${cloud.region})`,
        type: 'CLOUD_PROVIDER',
        features: normalizeCloudFeatures(cloud),
        featureNames: [
          'cpuAvailableRatio',
          'memoryAvailableRatio',
          'costRate',
          'avgLatency',
          'slaReliability',
          'carbonIntensity',
        ],
        metadata: {
          cloudId: cid,
          region: cloud.region,
          uptime90d: cloud.uptime90d,
          costPerHour: cloud.costPerHour,
          carbonGrams: cloud.carbonIntensityGrams,
          cpuUtilized: cloud.cpuUtilizedPercent,
          memoryUtilized: cloud.memoryUtilizedPercent,
        },
        x: 200 + index * 300,
        y: 120,
      });
    }
  });

  // 2. Build Workload Nodes
  workloads.forEach((w, index) => {
    const nodeId = `wl_${w.id}`;
    workloadNodeIds.push(nodeId);

    const wlFeatures = normalizeWorkloadFeatures(w);
    const cols = 4;
    const row = Math.floor(index / cols);
    const col = index % cols;

    nodes.push({
      id: nodeId,
      label: w.name,
      type: 'WORKLOAD',
      features: wlFeatures,
      featureNames: [
        'cpuCoresNorm',
        'memoryGbNorm',
        'latencyTargetNorm',
        'slaTargetNorm',
        'priorityWeight',
        'costNorm',
      ],
      metadata: {
        workloadId: w.id,
        name: w.name,
        type: w.type,
        currentCloud: w.cloud,
        cpuCores: w.cpuCores,
        memoryGb: w.memoryGb,
        priority: w.priority,
        slaTargetPercent: w.slaTargetPercent,
        latencyMs: w.latencyMs,
      },
      x: 120 + col * 220,
      y: 280 + row * 110,
    });

    // 3. Candidate Placement Edges (Bipartite Workload <-> Cloud Candidates)
    cloudKeys.forEach((cid) => {
      const cloudNodeId = `cloud_${cid}`;
      const cloud = clouds[cid];
      if (cloud) {
        const isCurrentPlacement = w.cloud === cid;
        // Edge feature vector: [isCurrentPlacement (1/0), baselineLatency, estimatedCost]
        const baseCost = Number((w.cpuCores * (cid === 'gcp' ? 0.085 : cid === 'azure' ? 0.092 : 0.105)).toFixed(2));
        const edgeWeight = isCurrentPlacement ? 1.0 : 0.65;

        addEdge({
          id: `edge_cand_${w.id}_${cid}`,
          source: nodeId,
          target: cloudNodeId,
          type: 'CANDIDATE_PLACEMENT',
          weight: edgeWeight,
          features: [
            isCurrentPlacement ? 1.0 : 0.0,
            cloud.averageLatencyMs / 100.0,
            Math.min(1.0, baseCost / 10.0),
          ],
          metadata: {
            cloudId: cid,
            workloadId: w.id,
            isCurrentPlacement,
            estimatedCost: baseCost,
          },
        });
      }
    });
  });

  // 4. Inter-Workload Dependency Edges
  if (includeDependencies) {
    const workloadByType: Record<string, Workload[]> = {};
    workloads.forEach((w) => {
      if (!workloadByType[w.type]) workloadByType[w.type] = [];
      workloadByType[w.type].push(w);
    });

    KNOWN_WORKLOAD_DEPENDENCIES.forEach((dep) => {
      const sources = workloadByType[dep.sourceType] || [];
      const targets = workloadByType[dep.targetType] || [];

      sources.forEach((src) => {
        targets.forEach((tgt) => {
          if (src.id !== tgt.id) {
            addEdge({
              id: `edge_dep_${src.id}_${tgt.id}`,
              source: `wl_${src.id}`,
              target: `wl_${tgt.id}`,
              type: 'WORKLOAD_DEPENDENCY',
              weight: Math.min(1.0, dep.callFrequencyPerSec / 150),
              features: [
                dep.callFrequencyPerSec / 200,
                dep.payloadKb / 500,
                src.cloud === tgt.cloud ? 1.0 : 0.0, // co-located benefit
              ],
              metadata: {
                callFrequencyPerSec: dep.callFrequencyPerSec,
                payloadKb: dep.payloadKb,
                isColocated: src.cloud === tgt.cloud,
              },
            });
          }
        });
      });
    });
  }

  // 5. Cross-Cloud Interconnect Edges
  if (includeInterconnects) {
    const crossLatencyMatrix: Record<string, number> = {
      'aws-azure': 18,
      'aws-gcp': 24,
      'azure-gcp': 21,
    };

    const cloudPairs: [CloudProviderId, CloudProviderId][] = [
      ['aws', 'azure'],
      ['aws', 'gcp'],
      ['azure', 'gcp'],
    ];

    cloudPairs.forEach(([c1, c2]) => {
      const key = `${c1}-${c2}`;
      const lat = crossLatencyMatrix[key] || 20;
      addEdge({
        id: `edge_interconnect_${c1}_${c2}`,
        source: `cloud_${c1}`,
        target: `cloud_${c2}`,
        type: 'CROSS_CLOUD_INTERCONNECT',
        weight: Math.max(0.2, 1.0 - lat / 50),
        features: [lat / 50, 0.08], // latencyNorm, egressRate
        metadata: {
          latencyMs: lat,
          egressCostPerGb: 0.08,
        },
      });
    });
  }

  return {
    nodes,
    edges,
    workloadNodeIds,
    cloudNodeIds,
    adjacencyList,
  };
}
