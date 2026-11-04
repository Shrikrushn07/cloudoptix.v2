import React, { useState, useMemo } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { buildMultiCloudGraph } from '../../research/graph/graphBuilder';
import { GraphNode, GraphEdge, NodeType } from '../../research/types';
import { CloudProviderLogo } from '../common/CloudProviderLogo';
import {
  Network,
  Cpu,
  Server,
  Layers,
  ArrowRightLeft,
  Info,
  Maximize2,
  Filter,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const GraphExplorerView: React.FC = () => {
  const { workloads, clouds } = useSimulation();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('cloud_gcp');
  const [filterEdgeType, setFilterEdgeType] = useState<'ALL' | 'CANDIDATE_PLACEMENT' | 'WORKLOAD_DEPENDENCY' | 'CROSS_CLOUD_INTERCONNECT'>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Generate real topological graph
  const graph = useMemo(() => {
    return buildMultiCloudGraph(workloads, clouds, {
      includeDependencies: true,
      includeInterconnects: true,
    });
  }, [workloads, clouds]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graph.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [graph, selectedNodeId]);

  // Connected edges for the selected node
  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return graph.edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [graph, selectedNodeId]);

  // Edges to render based on filter
  const visibleEdges = useMemo(() => {
    return graph.edges.filter((e) => {
      if (filterEdgeType === 'ALL') return true;
      return e.type === filterEdgeType;
    });
  }, [graph, filterEdgeType]);

  // Calculate coordinates for nodes
  // Cloud nodes across the top (y = 80)
  // Workload nodes in a grid below (y = 240, 360, 480)
  const nodePositions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};

    const cloudIds = ['cloud_aws', 'cloud_azure', 'cloud_gcp'];
    cloudIds.forEach((cid, i) => {
      pos[cid] = { x: 220 + i * 280, y: 80 };
    });

    const wlNodes = graph.nodes.filter((n) => n.type === 'WORKLOAD');
    const cols = 4;
    wlNodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      pos[node.id] = {
        x: 140 + col * 240,
        y: 220 + row * 110,
      };
    });

    return pos;
  }, [graph]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-purple-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Heterogeneous Multi-Cloud Graph Explorer
                </h1>
                <span className="text-[10px] font-mono font-bold bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40">
                  TOPOLOGY PIPELINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualizing {graph.nodes.length} nodes (workloads, cloud resource pools) and {graph.edges.length} multi-objective graph edges
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400">Edge Filter:</label>
          <select
            value={filterEdgeType}
            onChange={(e) => setFilterEdgeType(e.target.value as any)}
            className="bg-[#0b1120] border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Graph Edges ({graph.edges.length})</option>
            <option value="CANDIDATE_PLACEMENT">Candidate Placement Edges</option>
            <option value="WORKLOAD_DEPENDENCY">Microservice Call Dependencies</option>
            <option value="CROSS_CLOUD_INTERCONNECT">Cloud Interconnects</option>
          </select>
        </div>
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interactive SVG Canvas */}
        <div className="lg:col-span-3 bg-[#020617] border border-slate-800 rounded-2xl p-4 overflow-hidden relative shadow-2xl min-h-[580px] flex flex-col">
          {/* Canvas Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-850 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-950 border border-indigo-500" />
                <span>Cloud Provider Pool (3)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-900 border border-slate-700" />
                <span>Workload Node ({workloads.length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-indigo-500 inline-block" />
                <span>Candidate Edge</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-amber-400 inline-block border-t border-dashed" />
                <span>Dependency Call</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold cursor-pointer"
              >
                -
              </button>
              <span className="text-[10px]">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold cursor-pointer"
              >
                +
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* SVG Viewport */}
          <div className="flex-1 w-full overflow-auto cursor-crosshair">
            <svg
              className="w-full h-[540px] select-none"
              viewBox="0 0 1020 620"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', transition: 'transform 0.2s ease' }}
            >
              <defs>
                {/* Arrow markers */}
                <marker id="arrow-dep" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#F59E0B" />
                </marker>
                <marker id="arrow-cloud" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366F1" />
                </marker>
              </defs>

              {/* Render Visible Edges */}
              {visibleEdges.map((edge) => {
                const src = nodePositions[edge.source];
                const tgt = nodePositions[edge.target];
                if (!src || !tgt) return null;

                const isConnectedToSelected =
                  edge.source === selectedNodeId || edge.target === selectedNodeId;

                const isDep = edge.type === 'WORKLOAD_DEPENDENCY';
                const isInterconnect = edge.type === 'CROSS_CLOUD_INTERCONNECT';

                // Curve path calculation
                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2 + (isDep ? 25 : 0);
                const pathD = `M ${src.x} ${src.y} Q ${midX} ${midY} ${tgt.x} ${tgt.y}`;

                return (
                  <g key={edge.id}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={
                        isConnectedToSelected
                          ? isDep
                            ? '#F59E0B'
                            : '#818CF8'
                          : isDep
                          ? '#D97706'
                          : isInterconnect
                          ? '#059669'
                          : '#1E293B'
                      }
                      strokeWidth={isConnectedToSelected ? (isDep ? 2.5 : 2.0) : 1.0}
                      strokeOpacity={isConnectedToSelected ? 0.9 : 0.35}
                      strokeDasharray={isDep ? '4,4' : undefined}
                      markerEnd={isDep ? 'url(#arrow-dep)' : undefined}
                    />
                  </g>
                );
              })}

              {/* Render Workload Nodes */}
              {graph.nodes
                .filter((n) => n.type === 'WORKLOAD')
                .map((node) => {
                  const pos = nodePositions[node.id];
                  if (!pos) return null;
                  const isSelected = selectedNodeId === node.id;
                  const wl = node.metadata;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x - 70}, ${pos.y - 25})`}
                      onClick={() => setSelectedNodeId(node.id)}
                      className="cursor-pointer group"
                    >
                      <rect
                        width="140"
                        height="50"
                        rx="10"
                        fill={isSelected ? '#1E1B4B' : '#0B1120'}
                        stroke={isSelected ? '#6366F1' : '#334155'}
                        strokeWidth={isSelected ? 2 : 1}
                        className="transition-colors group-hover:stroke-indigo-400"
                      />
                      <text x="10" y="20" fill="#E2E8F0" fontSize="11" fontWeight="bold">
                        {node.label.length > 15 ? node.label.slice(0, 14) + '...' : node.label}
                      </text>
                      <text x="10" y="38" fill="#94A3B8" fontSize="9" fontFamily="monospace">
                        {wl.cpuCores}c • {wl.memoryGb}G • {wl.currentCloud?.toUpperCase()}
                      </text>
                      {/* Priority indicator */}
                      <circle
                        cx="125"
                        cy="20"
                        r="4"
                        fill={
                          wl.priority === 'CRITICAL'
                            ? '#F43F5E'
                            : wl.priority === 'HIGH'
                            ? '#F59E0B'
                            : '#10B981'
                        }
                      />
                    </g>
                  );
                })}

              {/* Render Cloud Nodes */}
              {graph.nodes
                .filter((n) => n.type === 'CLOUD_PROVIDER')
                .map((node) => {
                  const pos = nodePositions[node.id];
                  if (!pos) return null;
                  const isSelected = selectedNodeId === node.id;
                  const cloudMeta = node.metadata;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x - 85}, ${pos.y - 35})`}
                      onClick={() => setSelectedNodeId(node.id)}
                      className="cursor-pointer group"
                    >
                      <rect
                        width="170"
                        height="68"
                        rx="14"
                        fill={isSelected ? '#1E1B4B' : '#0B1120'}
                        stroke={isSelected ? '#6366F1' : '#475569'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="transition-colors group-hover:stroke-indigo-400"
                      />
                      <text x="14" y="24" fill="#F8FAFC" fontSize="12" fontWeight="bold">
                        {node.label}
                      </text>
                      <text x="14" y="44" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                        CPU: {cloudMeta.cpuUtilized}% • RAM: {cloudMeta.memoryUtilized}%
                      </text>
                      <text x="14" y="58" fill="#64748B" fontSize="9" fontFamily="monospace">
                        SLA: {cloudMeta.uptime90d}% • ${cloudMeta.costPerHour}/hr
                      </text>
                    </g>
                  );
                })}
            </svg>
          </div>
        </div>

        {/* Node Inspector Drawer */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">
                    {selectedNode.type} NODE
                  </span>
                  <h3 className="font-bold text-slate-100 text-sm">{selectedNode.label}</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {selectedNode.id}
                </span>
              </div>

              {/* Normalized Feature Vector for GNN */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
                  Normalized Feature Vector (x_v &in; [0, 1]^6)
                </span>
                <div className="p-3 bg-[#020617] rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                  {selectedNode.features.map((feat, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500 text-[10px]">
                        {selectedNode.featureNames[idx] || `f_${idx}`}:
                      </span>
                      <span className="font-bold text-indigo-300">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Edges & Neighbors */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono uppercase text-slate-400 font-bold">
                  <span>Graph Neighbors</span>
                  <span className="text-slate-200">Degree: {connectedEdges.length}</span>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-[11px] font-mono">
                  {connectedEdges.map((e) => {
                    const otherNodeId = e.source === selectedNode.id ? e.target : e.source;
                    const otherNode = graph.nodes.find((n) => n.id === otherNodeId);
                    const isDep = e.type === 'WORKLOAD_DEPENDENCY';

                    return (
                      <div
                        key={e.id}
                        onClick={() => setSelectedNodeId(otherNodeId)}
                        className="p-2 rounded-lg bg-[#020617] hover:bg-slate-850 border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="truncate text-slate-300 font-medium">{otherNode?.label || otherNodeId}</span>
                        <span
                          className={`text-[9px] px-1 rounded ${
                            isDep
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-indigo-950 text-indigo-300'
                          }`}
                        >
                          {isDep ? 'DEP' : 'CAND'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <span className="block text-[10px] uppercase font-bold text-slate-500">Node Properties</span>
                {Object.entries(selectedNode.metadata).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}:</span>
                    <span className="text-slate-200">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 text-xs">
              Click any node in the topology canvas to inspect features and graph connectivity.
            </div>
          )}

          <div className="p-3 bg-indigo-950/30 border border-indigo-700/30 rounded-xl text-[10px] font-mono text-indigo-300">
            GraphSAGE conducts inductive message passing over these microservice edges to compute placement embeddings.
          </div>
        </div>
      </div>
    </div>
  );
};
