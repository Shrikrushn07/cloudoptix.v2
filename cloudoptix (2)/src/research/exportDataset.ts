import fs from 'fs';
import path from 'path';
import { CloudProvider, CloudProviderId, PolicyRule, Workload } from '../types';
import { INITIAL_CLOUDS, INITIAL_WORKLOADS, INITIAL_POLICIES } from '../data/initialData';
import { buildMultiCloudGraph, normalizeCloudFeatures, normalizeWorkloadFeatures } from './graph/graphBuilder';
import { calculateCandidateObjectives, DEFAULT_OBJECTIVE_WEIGHTS } from './optimization/multiObjective';
import { evaluateHardFeasibilityForWorkload } from './feasibility/feasibilityEngine';

export function generateExpandedWorkloads(baseWorkloads: Workload[], targetCount = 150, seed = 42): Workload[] {
  const result: Workload[] = [...baseWorkloads];
  const types: Workload['type'][] = [
    'Checkout API',
    'Payment Gateway',
    'Auth & Identity',
    'Batch Analytics',
    'ML Training',
    'Notification Service',
    'Recommendation Engine',
    'Document Processing',
    'Realtime WebSockets',
    'Video Processing',
  ];
  const clouds: CloudProviderId[] = ['aws', 'azure', 'gcp'];
  const priorities: Workload['priority'][] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  // Seeded deterministic pseudo-random number generator
  let currentSeed = seed;
  const rand = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = baseWorkloads.length; i < targetCount; i++) {
    const id = `WL-${200 + i}`;
    const type = types[Math.floor(rand() * types.length)];
    const cloud = clouds[Math.floor(rand() * clouds.length)];
    const priority = priorities[Math.floor(rand() * priorities.length)];

    const cpuCores = [2, 4, 8, 16, 32, 48, 64][Math.floor(rand() * 7)];
    const memoryGb = cpuCores * (rand() > 0.5 ? 4 : 2);
    const latencyMs = Math.round(15 + rand() * 65);
    const slaTargetPercent = Number((99.9 + rand() * 0.099).toFixed(3));
    const costPerHour = Number((cpuCores * 0.09 + memoryGb * 0.012 + rand() * 0.2).toFixed(2));

    result.push({
      id,
      name: `${type} Node-${i + 1}`,
      type,
      cloud,
      region: cloud === 'aws' ? 'us-east-1' : cloud === 'azure' ? 'eastus2' : 'us-central1',
      cpuCores,
      cpuUtilPercent: Math.round(35 + rand() * 55),
      memoryGb,
      memUtilPercent: Math.round(30 + rand() * 55),
      priority,
      latencyMs,
      slaTargetPercent,
      currentSlaPercent: Number((slaTargetPercent - rand() * 0.02).toFixed(3)),
      costPerHour,
      status: 'Running',
      tags: ['enterprise', 'multi-cloud', type.toLowerCase().replace(/[^a-z0-9]/g, '-')],
      lastOptimizedAt: `${Math.round(5 + rand() * 50)}m ago`,
      policyId: priority === 'CRITICAL' ? 'POL-01' : 'POL-02',
    });
  }

  return result;
}

export function exportDatasetToJson(outputPath?: string) {
  const targetPath = outputPath || path.resolve(process.cwd(), 'gnn_research/data/dataset.json');
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const clouds: Record<string, CloudProvider> = INITIAL_CLOUDS;
  const policies: PolicyRule[] = INITIAL_POLICIES;
  const workloads = generateExpandedWorkloads(INITIAL_WORKLOADS, 140, 101);

  // Build full multi-cloud graph
  const graph = buildMultiCloudGraph(workloads, clouds, {
    includeDependencies: true,
    includeInterconnects: true,
  });

  const cloudIds: CloudProviderId[] = ['aws', 'azure', 'gcp'];

  // Map nodes to contiguous 0-based integer indices
  const nodeIndexMap: Record<string, number> = {};
  graph.nodes.forEach((n, idx) => {
    nodeIndexMap[n.id] = idx;
  });

  // Calculate normalized adjacency matrix D^-1 * (A + I) for GraphSAGE mean aggregation
  const N = graph.nodes.length;
  const rawAdj: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));

  // Self-loops
  for (let i = 0; i < N; i++) {
    rawAdj[i][i] = 1;
  }

  graph.edges.forEach((e) => {
    const srcIdx = nodeIndexMap[e.source];
    const tgtIdx = nodeIndexMap[e.target];
    if (srcIdx !== undefined && tgtIdx !== undefined) {
      rawAdj[srcIdx][tgtIdx] = 1;
      rawAdj[tgtIdx][srcIdx] = 1;
    }
  });

  const normAdj: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++) {
    const degree = rawAdj[i].reduce((s, v) => s + v, 0);
    const invDeg = degree > 0 ? 1.0 / degree : 1.0;
    for (let j = 0; j < N; j++) {
      normAdj[i][j] = Number((rawAdj[i][j] * invDeg).toFixed(5));
    }
  }

  // Workload candidate evaluations
  const workloadRecords = workloads.map((w) => {
    const wNodeId = `wl_${w.id}`;
    const wNodeIdx = nodeIndexMap[wNodeId];
    const feasibilityResult = evaluateHardFeasibilityForWorkload(w, clouds, policies);

    const candidates = cloudIds.map((cid, cIdx) => {
      const cloud = clouds[cid];
      const cNodeId = `cloud_${cid}`;
      const cNodeIdx = nodeIndexMap[cNodeId];

      const { scores, estimatedCostPerHour, estimatedLatencyMs, carbonGrams } = calculateCandidateObjectives(
        w,
        cid,
        cloud,
        workloads,
        DEFAULT_OBJECTIVE_WEIGHTS
      );

      const isFeasible = feasibilityResult.results[cid]?.isFeasible ?? true;

      // 4 continuous interaction features: [costNorm, latencyNorm, slaNorm, carbonNorm]
      const interaction = [
        scores.costScore / 100.0,
        scores.latencyScore / 100.0,
        scores.slaScore / 100.0,
        scores.carbonScore / 100.0,
      ];

      return {
        cloudId: cid,
        cloudNodeId: cNodeId,
        cloudNodeIdx: cNodeIdx,
        isFeasible,
        compositeUtility: scores.compositeScalarizedScore / 100.0,
        objectiveScores: scores,
        interaction,
        estimatedCostPerHour,
        estimatedLatencyMs,
        carbonGrams,
        rejectionReasons: feasibilityResult.results[cid]?.rejectionReasons || [],
      };
    });

    // Softmax ground truth target over composite utilities
    const maxU = Math.max(...candidates.map((c) => c.compositeUtility));
    const expSum = candidates.reduce((s, c) => s + Math.exp((c.compositeUtility - maxU) * 3.0), 0);
    const bestUtility = Math.max(...candidates.filter((c) => c.isFeasible).map((c) => c.compositeUtility));

    const enrichedCandidates = candidates.map((c) => ({
      ...c,
      targetProbability: Number((Math.exp((c.compositeUtility - maxU) * 3.0) / expSum).toFixed(4)),
      isOptimal: c.isFeasible && c.compositeUtility === bestUtility ? 1 : 0,
    }));

    return {
      workloadId: w.id,
      workloadName: w.name,
      workloadType: w.type,
      currentCloud: w.cloud,
      workloadNodeId: wNodeId,
      workloadNodeIdx: wNodeIdx,
      features: normalizeWorkloadFeatures(w),
      cpuCores: w.cpuCores,
      memoryGb: w.memoryGb,
      latencyMs: w.latencyMs,
      slaTargetPercent: w.slaTargetPercent,
      priority: w.priority,
      costPerHour: w.costPerHour,
      candidates: enrichedCandidates,
    };
  });

  const dataset = {
    metadata: {
      generatedAt: new Date().toISOString(),
      numWorkloads: workloads.length,
      numClouds: cloudIds.length,
      totalNodes: graph.nodes.length,
      totalEdges: graph.edges.length,
      nodeFeatureDim: 6,
      edgeInteractionDim: 4,
      cloudIds,
      description: 'CloudOptiX Multi-Cloud GraphSAGE Placement Benchmark Dataset',
    },
    clouds: Object.fromEntries(
      cloudIds.map((cid) => [
        cid,
        {
          id: cid,
          name: clouds[cid].name,
          shortName: clouds[cid].shortName,
          region: clouds[cid].region,
          features: normalizeCloudFeatures(clouds[cid]),
          uptime90d: clouds[cid].uptime90d,
          averageLatencyMs: clouds[cid].averageLatencyMs,
          costPerHour: clouds[cid].costPerHour,
          carbonIntensityGrams: clouds[cid].carbonIntensityGrams,
          cpuUtilizedPercent: clouds[cid].cpuUtilizedPercent,
          memoryUtilizedPercent: clouds[cid].memoryUtilizedPercent,
          nodeId: `cloud_${cid}`,
          nodeIdx: nodeIndexMap[`cloud_${cid}`],
        },
      ])
    ),
    graph: {
      nodes: graph.nodes.map((n) => ({
        id: n.id,
        idx: nodeIndexMap[n.id],
        label: n.label,
        type: n.type,
        features: n.features,
      })),
      edges: graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        sourceIdx: nodeIndexMap[e.source],
        target: e.target,
        targetIdx: nodeIndexMap[e.target],
        type: e.type,
        features: e.features,
        weight: e.weight,
      })),
      normalizedAdjacency: normAdj,
    },
    workloads: workloadRecords,
  };

  fs.writeFileSync(targetPath, JSON.stringify(dataset, null, 2), 'utf8');
  console.log(`[ExportDataset] Successfully exported ${workloads.length} workloads to ${targetPath}`);
  console.log(`[ExportDataset] Graph contains ${graph.nodes.length} nodes, ${graph.edges.length} edges.`);
  return targetPath;
}

// Allow direct CLI execution: npx tsx src/research/exportDataset.ts
if (process.argv[1]?.includes('exportDataset')) {
  exportDatasetToJson();
}
