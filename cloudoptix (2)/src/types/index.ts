export type CloudProviderId = 'aws' | 'azure' | 'gcp';

export interface CloudProvider {
  id: CloudProviderId;
  name: string;
  shortName: string;
  logoColor: string;
  badgeBg: string;
  badgeBorder: string;
  region: string;
  zone: string;
  cpuCapacityGhz: number; // total GHz
  cpuUtilizedPercent: number;
  memoryCapacityGb: number; // total GB
  memoryUtilizedPercent: number;
  workloadCount: number;
  costPerHour: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  healthStatus: 'OPTIMAL' | 'HEALTHY' | 'WARNING' | 'CRITICAL';
  availableCapacityScore: number; // 0 - 100
  nodesActive: number;
  nodesTotal: number;
  egressCostPerGb: number;
  carbonIntensityGrams: number;
  uptime90d: number;
}

export type WorkloadType =
  | 'Checkout API'
  | 'Video Processing'
  | 'ML Training'
  | 'Image Processing'
  | 'Recommendation Engine'
  | 'Batch Analytics'
  | 'Document Processing'
  | 'Notification Service'
  | 'Auth & Identity'
  | 'Payment Gateway'
  | 'Realtime WebSockets';

export type WorkloadStatus =
  | 'Running'
  | 'Pending'
  | 'Optimizing'
  | 'Migrating'
  | 'Completed'
  | 'Warning'
  | 'Critical';

export type WorkloadPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Workload {
  id: string;
  name: string;
  type: WorkloadType;
  cloud: CloudProviderId;
  region: string;
  cpuCores: number;
  cpuUtilPercent: number;
  memoryGb: number;
  memUtilPercent: number;
  priority: WorkloadPriority;
  latencyMs: number;
  slaTargetPercent: number;
  currentSlaPercent: number;
  costPerHour: number;
  status: WorkloadStatus;
  aiRecommendation?: {
    recommendedCloud: CloudProviderId;
    confidence: number;
    potentialSavingsPerMonth: number;
    latencyDeltaMs: number;
    reason: string;
    actionType: 'MIGRATE' | 'RESIZE' | 'RETAIN';
  };
  tags: string[];
  lastOptimizedAt: string;
  policyId: string;
}

export interface DecisionFactor {
  factorName: string;
  weight: number; // percentage
  impactScore: number; // 0 - 100
  description: string;
}

export interface CloudCandidateScore {
  cloud: CloudProviderId;
  totalScore: number; // 0 - 100
  resourceAvailabilityScore: number;
  costEfficiencyScore: number;
  latencyScore: number;
  slaComplianceScore: number;
  historicalPerfScore: number;
  estimatedCostPerHour: number;
  estimatedLatencyMs: number;
  feasibility: boolean;
  rejectReason?: string;
}

export interface AIDecision {
  id: string;
  timestamp: string;
  workloadId: string;
  workloadName: string;
  currentCloud: CloudProviderId;
  recommendedCloud: CloudProviderId;
  confidence: number;
  factors: DecisionFactor[];
  candidateScores: CloudCandidateScore[];
  summaryReason: string;
  status: 'PENDING_APPROVAL' | 'AUTONOMOUSLY_APPROVED' | 'REJECTED' | 'EXECUTED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedCostImpactPerHour: number; // negative is savings
  expectedLatencyDeltaMs: number;
  policyCheckPassed: boolean;
  policyRuleApplied: string;
}

export interface AutonomousActionStep {
  timeOffsetMs: number;
  timestamp: string;
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED' | 'SKIPPED';
  stage: 'OBSERVE' | 'PREDICT' | 'OPTIMIZE' | 'DECIDE' | 'POLICY_CHECK' | 'ACT' | 'VERIFY' | 'LEARN';
}

export interface AutonomousAction {
  id: string;
  timestamp: string;
  workloadId: string;
  workloadName: string;
  sourceCloud: CloudProviderId;
  destinationCloud: CloudProviderId;
  triggerReason: string;
  policyApplied: string;
  resultStatus: 'SUCCESS' | 'IN_PROGRESS' | 'FAILED' | 'ROLLED_BACK';
  executionDurationSec: number;
  steps: AutonomousActionStep[];
  preMigrationSla: number;
  postMigrationSla: number;
  costDeltaMonthly: number;
  latencyDeltaMs: number;
  actor?: string;
  actorRole?: string;
}

export type UserRoleId = 'sre_admin' | 'finops_lead' | 'platform_eng';

export interface UserRolePermissions {
  canStressClouds: boolean;
  canDeployWorkloads: boolean;
  canMigrateWorkloads: boolean;
  canModifyPolicies: boolean;
  canRunWhatIf: boolean;
  canExportReports: boolean;
  canAdjustWeights: boolean;
  viewOnlyFinOps: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  roleId: UserRoleId;
  name: string;
  roleTitle: string;
  department: string;
  initials: string;
  avatarBg: string;
  badgeColor: string;
  description: string;
  permissions: UserRolePermissions;
  sessionToken: string;
  activeClusterAccess: string[];
}

export interface PolicyRule {
  id: string;
  name: string;
  category: 'Stateless API' | 'Batch Workload' | 'Production Database' | 'Critical Production Service' | 'Data Locality' | 'Cost Optimization';
  description: string;
  autoMigration: boolean;
  humanApprovalRequired: boolean;
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  costOptimizationMode: 'AGGRESSIVE' | 'BALANCED' | 'CONSERVATIVE' | 'OFF';
  maxAllowedLatencyMs: number;
  minSlaTarget: number;
  allowedClouds: CloudProviderId[];
  isActive: boolean;
  appliedWorkloadsCount: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  awsCpu: number;
  azureCpu: number;
  gcpCpu: number;
  awsMem: number;
  azureMem: number;
  gcpMem: number;
  awsCost: number;
  azureCost: number;
  gcpCost: number;
  totalWorkloads: number;
}

export interface ExperimentBenchmarkResult {
  strategyName: string;
  description: string;
  averageMonthlyCost: number;
  p95LatencyMs: number;
  averageCpuUtilization: number;
  slaViolationsCount: number;
  totalMigrations: number;
  decisionTimeMs: number;
  costEfficiencyRatio: number; // custom index
  overallScore: number; // 0 - 100
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  type: 'WARNING' | 'AI_RECOMMENDATION' | 'AUTONOMOUS_SUCCESS' | 'COST_ANOMALY' | 'SLA_RISK' | 'INFO';
  title: string;
  message: string;
  targetCloud?: CloudProviderId;
  workloadId?: string;
  isRead: boolean;
  actionLabel?: string;
  actionView?: string;
}

export interface WhatIfScenarioInput {
  trafficDemandMultiplier: number; // 0.5 to 2.5 (1.0 = 100%)
  awsCostMultiplier: number; // 0.5 to 2.0
  azureCostMultiplier: number;
  gcpCostMultiplier: number;
  simulatedGcpCpuStress: number;
  simulatedAwsCpuStress: number;
  simulatedAzureCpuStress: number;
  targetLatencyThresholdMs: number;
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  expectedOutcome: string;
  highlightCloud?: CloudProviderId;
}
