import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CloudProvider,
  CloudProviderId,
  Workload,
  PolicyRule,
  AIDecision,
  AutonomousAction,
  NotificationItem,
  TimeSeriesPoint,
  ExperimentBenchmarkResult,
  WhatIfScenarioInput,
  DemoScenario,
  AutonomousActionStep,
  UserProfile,
} from '../types';
import {
  INITIAL_CLOUDS,
  INITIAL_WORKLOADS,
  INITIAL_POLICIES,
  INITIAL_DECISIONS,
  INITIAL_AUTONOMOUS_ACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TIME_SERIES,
  EXPERIMENT_BENCHMARKS,
  DEMO_SCENARIOS,
  MOCK_USER_PROFILES,
} from '../data/initialData';
import { evaluateCloudCandidates } from '../services/aiEngine';
import confetti from 'canvas-confetti';

interface PermissionNotice {
  actionName: string;
  requiredRole: string;
  reason: string;
  timestamp: number;
}

interface SimulationContextType {
  clouds: Record<string, CloudProvider>;
  workloads: Workload[];
  policies: PolicyRule[];
  decisions: AIDecision[];
  actions: AutonomousAction[];
  notifications: NotificationItem[];
  timeSeries: TimeSeriesPoint[];
  benchmarks: ExperimentBenchmarkResult[];
  activeView: string;
  setActiveView: (view: string) => void;
  isAutonomousActive: boolean;
  setIsAutonomousActive: React.Dispatch<React.SetStateAction<boolean>>;
  trafficMultiplier: number;
  setTrafficMultiplier: (val: number) => void;
  isSimulatingAction: boolean;
  activeSimulatedStep: string;
  activeDemoScenario: DemoScenario | null;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  switchUserRole: (userKey: string) => void;
  permissionNotice: PermissionNotice | null;
  dismissPermissionNotice: () => void;
  stressCloud: (cloudId: CloudProviderId, targetCpu?: number) => void;
  unstressCloud: (cloudId: CloudProviderId) => void;
  createWorkload: (newWorkload: Partial<Workload>, selectedCloud: CloudProviderId) => boolean;
  deleteWorkload: (workloadId: string) => boolean;
  migrateWorkload: (workloadId: string, targetCloud: CloudProviderId, reason?: string) => Promise<boolean>;
  executeAutonomousRemediation: (cloudId: CloudProviderId, workloadIdOverride?: string) => Promise<void>;
  togglePolicy: (policyId: string) => boolean;
  updatePolicy: (policyId: string, updates: Partial<PolicyRule>) => boolean;
  resetSimulation: () => void;
  loadDemoScenario: (scenarioId: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  runWhatIfCalculation: (input: WhatIfScenarioInput) => {
    projectedCost: number;
    projectedLatency: number;
    projectedUtilization: number;
    projectedSla: number;
    currentCost: number;
    recommendedMigrations: number;
    cloudDistributions: { aws: number; azure: number; gcp: number };
    optimizedDistributions: { aws: number; azure: number; gcp: number };
  };
  totalWorkloadsCount: number;
  totalMonthlyCost: number;
  totalPotentialSavings: number;
  systemSlaHealth: number;
  overallResourceUtilization: number;
  actionsTodayCount: number;
  activeStress: Record<CloudProviderId, boolean>;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clouds, setClouds] = useState<Record<string, CloudProvider>>(() => JSON.parse(JSON.stringify(INITIAL_CLOUDS)));
  const [workloads, setWorkloads] = useState<Workload[]>(() => JSON.parse(JSON.stringify(INITIAL_WORKLOADS)));
  const [policies, setPolicies] = useState<PolicyRule[]>(() => JSON.parse(JSON.stringify(INITIAL_POLICIES)));
  const [decisions, setDecisions] = useState<AIDecision[]>(() => JSON.parse(JSON.stringify(INITIAL_DECISIONS)));
  const [actions, setActions] = useState<AutonomousAction[]>(() => JSON.parse(JSON.stringify(INITIAL_AUTONOMOUS_ACTIONS)));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)));
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>(() => JSON.parse(JSON.stringify(INITIAL_TIME_SERIES)));
  const [benchmarks] = useState<ExperimentBenchmarkResult[]>(() => JSON.parse(JSON.stringify(EXPERIMENT_BENCHMARKS)));

  // Mock Authentication & Role Switcher State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => MOCK_USER_PROFILES.sre_admin_04);
  const [permissionNotice, setPermissionNotice] = useState<PermissionNotice | null>(null);

  const allUsers = useMemo(() => Object.values(MOCK_USER_PROFILES), []);

  const [activeView, setActiveView] = useState<string>('overview');
  const [isAutonomousActive, setIsAutonomousActive] = useState<boolean>(true);
  const [trafficMultiplier, setTrafficMultiplier] = useState<number>(1.0);
  const [isSimulatingAction, setIsSimulatingAction] = useState<boolean>(false);
  const [activeSimulatedStep, setActiveSimulatedStep] = useState<string>('');
  const [activeDemoScenario, setActiveDemoScenario] = useState<DemoScenario | null>(null);
  const [activeStress, setActiveStress] = useState<Record<CloudProviderId, boolean>>({
    aws: false,
    azure: false,
    gcp: false,
  });

  const dismissPermissionNotice = useCallback(() => {
    setPermissionNotice(null);
  }, []);

  const triggerPermissionWarning = useCallback((actionName: string, requiredRole: string, reason: string) => {
    setPermissionNotice({
      actionName,
      requiredRole,
      reason,
      timestamp: Date.now(),
    });

    const notif: NotificationItem = {
      id: `NOTIF-AUTH-${Date.now()}`,
      timestamp: 'Just now',
      type: 'WARNING',
      title: `Access Restricted: ${actionName}`,
      message: `User '${currentUser.name}' (${currentUser.roleTitle}) attempted an action requiring ${requiredRole} permissions.`,
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  }, [currentUser]);

  const switchUserRole = useCallback((userKey: string) => {
    const matched = Object.values(MOCK_USER_PROFILES).find(
      (u) => u.id === userKey || u.username === userKey || u.roleId === userKey
    );
    if (matched) {
      setCurrentUser(matched);
      setPermissionNotice(null);
      
      const notif: NotificationItem = {
        id: `NOTIF-ROLE-${Date.now()}`,
        timestamp: 'Just now',
        type: 'INFO',
        title: `Switched Active Identity: ${matched.name}`,
        message: `Switched session to ${matched.roleTitle} (${matched.department}). Permissions refreshed.`,
        isRead: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  }, []);

  // Calculate live global metrics
  const totalWorkloadsCount = workloads.length;

  const totalMonthlyCost = useMemo(() => {
    const hourlySum = (Object.values(clouds) as CloudProvider[]).reduce((acc, c) => acc + c.costPerHour, 0);
    return Math.round(hourlySum * 24 * 30);
  }, [clouds]);

  const totalPotentialSavings = useMemo(() => {
    return workloads.reduce((acc, w) => acc + (w.aiRecommendation?.potentialSavingsPerMonth || 0), 0);
  }, [workloads]);

  const systemSlaHealth = useMemo(() => {
    if (workloads.length === 0) return 99.99;
    const avg = workloads.reduce((acc, w) => acc + w.currentSlaPercent, 0) / workloads.length;
    return Number(avg.toFixed(2));
  }, [workloads]);

  const overallResourceUtilization = useMemo(() => {
    const cList = Object.values(clouds) as CloudProvider[];
    const avgCpu = cList.reduce((acc, c) => acc + c.cpuUtilizedPercent, 0) / cList.length;
    return Number(avgCpu.toFixed(1));
  }, [clouds]);

  const actionsTodayCount = useMemo(() => actions.length + 24, [actions.length]);

  // Autonomous self-healing execution sequence (8-step loop)
  const executeAutonomousRemediation = useCallback(async (cloudId: CloudProviderId, workloadIdOverride?: string) => {
    setIsSimulatingAction(true);

    // Find candidate workload to migrate
    const candidateWorkload = workloads.find(
      (w) => (workloadIdOverride ? w.id === workloadIdOverride : w.cloud === cloudId && w.type === 'Checkout API')
    ) || workloads.find((w) => w.cloud === cloudId) || workloads[0];

    const sourceCloud = cloudId;
    // Target cloud with lowest CPU and healthy state
    const alternateCandidates: CloudProviderId[] = (['aws', 'azure', 'gcp'] as CloudProviderId[]).filter((c) => c !== sourceCloud);
    const destinationCloud = alternateCandidates.sort((a, b) => clouds[a].cpuUtilizedPercent - clouds[b].cpuUtilizedPercent)[0] || 'azure';

    const actionId = `ACT-${Math.floor(4000 + Math.random() * 9000)}`;
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    // Step 1: OBSERVE
    setActiveSimulatedStep('1. OBSERVE: Sensed telemetry breach & overload on ' + clouds[sourceCloud].shortName);
    await new Promise((r) => setTimeout(r, 600));

    // Step 2: PREDICT
    setActiveSimulatedStep('2. PREDICT: Forecasting SLA degradation risk within 3.5 minutes');
    await new Promise((r) => setTimeout(r, 600));

    // Step 3: OPTIMIZE
    setActiveSimulatedStep('3. OPTIMIZE: Evaluating multi-cloud Pareto frontier across candidate clusters');
    await new Promise((r) => setTimeout(r, 600));

    // Step 4: DECIDE
    setActiveSimulatedStep(`4. DECIDE: Selected ${clouds[destinationCloud].shortName} with 92% confidence score`);
    await new Promise((r) => setTimeout(r, 600));

    // Step 5: POLICY CHECK
    setActiveSimulatedStep('5. POLICY CHECK: Validated against POL-01 (Stateless API) — auto-migration approved');
    await new Promise((r) => setTimeout(r, 600));

    // Step 6: ACT
    setActiveSimulatedStep(`6. ACT: Migrating ${candidateWorkload.name} from ${clouds[sourceCloud].shortName} → ${clouds[destinationCloud].shortName}`);
    await new Promise((r) => setTimeout(r, 900));

    // Step 7: VERIFY
    setActiveSimulatedStep('7. VERIFY: Health checks passed, DNS traffic cutover complete, latency verified at 31ms');
    await new Promise((r) => setTimeout(r, 700));

    // Step 8: LEARN
    setActiveSimulatedStep('8. LEARN: Telemetry baseline updated and saved to optimization memory');
    await new Promise((r) => setTimeout(r, 500));

    // Update state: Workload migrated
    setWorkloads((prev) => {
      const next = prev.map((w) => {
        if (w.id === candidateWorkload.id) {
          return {
            ...w,
            cloud: destinationCloud,
            status: 'Running' as const,
            latencyMs: clouds[destinationCloud].averageLatencyMs,
            lastOptimizedAt: 'Just now',
            aiRecommendation: undefined,
          };
        }
        return w;
      });
      return next;
    });

    // Unstress source cloud
    setActiveStress((prev) => ({ ...prev, [sourceCloud]: false }));

    // Update cloud stats
    setClouds((prev) => {
      const updated = { ...prev };
      // Source cloud recovers
      updated[sourceCloud] = {
        ...updated[sourceCloud],
        cpuUtilizedPercent: sourceCloud === 'gcp' ? 32 : 45,
        healthStatus: 'HEALTHY',
        availableCapacityScore: 78,
      };
      // Destination absorbs workload
      updated[destinationCloud] = {
        ...updated[destinationCloud],
        cpuUtilizedPercent: Math.min(80, updated[destinationCloud].cpuUtilizedPercent + 8),
        workloadCount: updated[destinationCloud].workloadCount + 1,
      };
      return updated;
    });

    // Create Action record with current active audit user
    const newActionSteps: AutonomousActionStep[] = [
      { timeOffsetMs: 0, timestamp: nowTime, title: 'Telemetry Overload Detected', description: `${clouds[sourceCloud].shortName} reached ${clouds[sourceCloud].cpuUtilizedPercent}% utilization (>85% threshold).`, status: 'COMPLETED', stage: 'OBSERVE' },
      { timeOffsetMs: 800, timestamp: nowTime, title: 'Predictive SLA Risk Model', description: 'Predicted impending latency degradation on critical path.', status: 'COMPLETED', stage: 'PREDICT' },
      { timeOffsetMs: 1600, timestamp: nowTime, title: 'Multi-Cloud Optimization Search', description: 'Evaluated AWS, Azure, and GCP latency, capacity, and cost.', status: 'COMPLETED', stage: 'OPTIMIZE' },
      { timeOffsetMs: 2400, timestamp: nowTime, title: 'Target Decision Generated', description: `${clouds[destinationCloud].shortName} chosen with 92% confidence score.`, status: 'COMPLETED', stage: 'DECIDE' },
      { timeOffsetMs: 3200, timestamp: nowTime, title: 'Policy Engine Validation', description: 'Rule POL-01 evaluated; autonomous execution confirmed.', status: 'COMPLETED', stage: 'POLICY_CHECK' },
      { timeOffsetMs: 4000, timestamp: nowTime, title: 'Container Warm Migration', description: `Live transfer of ${candidateWorkload.name} executed without downtime.`, status: 'COMPLETED', stage: 'ACT' },
      { timeOffsetMs: 6000, timestamp: nowTime, title: 'SLA Verification & Health Check', description: `${clouds[sourceCloud].shortName} normalized to safe levels; ${candidateWorkload.name} responding healthy.`, status: 'COMPLETED', stage: 'VERIFY' },
      { timeOffsetMs: 7000, timestamp: nowTime, title: 'Optimization Memory Updated', description: 'System closed loop recorded for reinforcement optimization.', status: 'COMPLETED', stage: 'LEARN' },
    ];

    const newAction: AutonomousAction = {
      id: actionId,
      timestamp: nowTime,
      workloadId: candidateWorkload.id,
      workloadName: candidateWorkload.name,
      sourceCloud,
      destinationCloud,
      triggerReason: `${clouds[sourceCloud].shortName} cluster load reached threshold (>85%); proactive SLA protection triggered.`,
      policyApplied: 'POL-01: Stateless API Autonomous Auto-Rebalance',
      resultStatus: 'SUCCESS',
      executionDurationSec: 7,
      preMigrationSla: 99.82,
      postMigrationSla: 99.99,
      costDeltaMonthly: -115.00,
      latencyDeltaMs: -4,
      steps: newActionSteps,
      actor: 'Autonomous Orchestration Engine',
      actorRole: `Supervised by ${currentUser.name} (${currentUser.roleTitle})`,
    };

    setActions((prev) => [newAction, ...prev]);

    // Create notification
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      timestamp: 'Just now',
      type: 'AUTONOMOUS_SUCCESS',
      title: 'Autonomous Remediation Completed',
      message: `Migrated ${candidateWorkload.name} from ${clouds[sourceCloud].shortName} to ${clouds[destinationCloud].shortName}. Utilization normalized to safe levels.`,
      workloadId: candidateWorkload.id,
      isRead: false,
      actionLabel: 'View Action Timeline',
      actionView: 'autonomous-actions',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    setIsSimulatingAction(false);
    setActiveSimulatedStep('');

    // Trigger subtle celebratory feedback
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#0089D6', '#4285F4', '#10B981'],
      });
    } catch {
      // Ignore if confetti fails
    }
  }, [clouds, workloads, currentUser]);

  // Stress a specific cloud
  const stressCloud = useCallback((cloudId: CloudProviderId, targetCpu = 92) => {
    // Permission check
    if (!currentUser.permissions.canStressClouds) {
      triggerPermissionWarning(
        'Cloud Stress & Chaos Injection',
        'SRE Admin',
        `Role '${currentUser.roleTitle}' does not have hardware stress test privileges. Switch to 'SRE Admin' to inject chaos faults.`
      );
      return;
    }

    setActiveStress((prev) => ({ ...prev, [cloudId]: true }));
    setClouds((prev) => {
      const current = prev[cloudId];
      if (!current) return prev;
      return {
        ...prev,
        [cloudId]: {
          ...current,
          cpuUtilizedPercent: targetCpu,
          memoryUtilizedPercent: Math.min(88, current.memoryUtilizedPercent + 25),
          healthStatus: 'CRITICAL',
          availableCapacityScore: 12,
        },
      };
    });

    // Add alert notification with audit trail
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      timestamp: 'Just now',
      type: 'WARNING',
      title: `${INITIAL_CLOUDS[cloudId]?.shortName || cloudId.toUpperCase()} Compute Saturation Alert`,
      message: `${INITIAL_CLOUDS[cloudId]?.name} CPU utilization spiked to ${targetCpu}%. Initiated by ${currentUser.name} (${currentUser.roleTitle}).`,
      targetCloud: cloudId,
      isRead: false,
      actionLabel: 'Inspect Control Plane',
      actionView: 'overview',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // If autonomous engine is active, automatically kick off autonomous self-healing after 1.4s!
    if (isAutonomousActive) {
      setTimeout(() => {
        executeAutonomousRemediation(cloudId);
      }, 1400);
    }
  }, [executeAutonomousRemediation, isAutonomousActive, currentUser, triggerPermissionWarning]);

  const unstressCloud = useCallback((cloudId: CloudProviderId) => {
    if (!currentUser.permissions.canStressClouds) {
      triggerPermissionWarning('Release Stress Fault', 'SRE Admin', 'Release operation requires SRE Admin role.');
      return;
    }
    setActiveStress((prev) => ({ ...prev, [cloudId]: false }));
    setClouds((prev) => {
      const current = prev[cloudId];
      if (!current) return prev;
      const normalizedCpu = cloudId === 'gcp' ? 29 : cloudId === 'azure' ? 41 : 72;
      return {
        ...prev,
        [cloudId]: {
          ...current,
          cpuUtilizedPercent: normalizedCpu,
          healthStatus: normalizedCpu < 40 ? 'OPTIMAL' : 'HEALTHY',
          availableCapacityScore: 100 - normalizedCpu,
        },
      };
    });
  }, [currentUser, triggerPermissionWarning]);

  // Create workload flow with real cloud state impact
  const createWorkload = useCallback((newWl: Partial<Workload>, selectedCloud: CloudProviderId): boolean => {
    if (!currentUser.permissions.canDeployWorkloads) {
      triggerPermissionWarning(
        'Deploy New Microservice Workload',
        'SRE Admin or Platform Engineer',
        `User with role '${currentUser.roleTitle}' has read-only financial observability and cannot deploy compute assets.`
      );
      return false;
    }

    const id = `WL-${Math.floor(300 + Math.random() * 700)}`;
    const fullWorkload: Workload = {
      id,
      name: newWl.name || `Microservice-${id}`,
      type: newWl.type || 'Checkout API',
      cloud: selectedCloud,
      region: clouds[selectedCloud]?.region || 'us-central1',
      cpuCores: newWl.cpuCores || 16,
      cpuUtilPercent: 45,
      memoryGb: newWl.memoryGb || 32,
      memUtilPercent: 40,
      priority: newWl.priority || 'HIGH',
      latencyMs: clouds[selectedCloud]?.averageLatencyMs || 30,
      slaTargetPercent: newWl.slaTargetPercent || 99.95,
      currentSlaPercent: 99.99,
      costPerHour: Number((((newWl.cpuCores || 16) * 0.09) + ((newWl.memoryGb || 32) * 0.015)).toFixed(2)),
      status: 'Running',
      tags: ['newly-deployed', 'autonomous-managed', `actor:${currentUser.username}`],
      lastOptimizedAt: 'Just now',
      policyId: newWl.policyId || 'POL-01',
    };

    setWorkloads((prev) => [fullWorkload, ...prev]);

    // Increase target cloud utilization
    setClouds((prev) => {
      const target = prev[selectedCloud];
      if (!target) return prev;
      const additionalCpu = Math.min(15, Math.round((fullWorkload.cpuCores / 48) * 12));
      const newCpu = Math.min(96, target.cpuUtilizedPercent + additionalCpu);
      return {
        ...prev,
        [selectedCloud]: {
          ...target,
          cpuUtilizedPercent: newCpu,
          workloadCount: target.workloadCount + 1,
          costPerHour: Number((target.costPerHour + fullWorkload.costPerHour).toFixed(2)),
        },
      };
    });

    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      timestamp: 'Just now',
      type: 'INFO',
      title: `Workload Deployed: ${fullWorkload.name}`,
      message: `Provisioned on ${clouds[selectedCloud]?.shortName} by ${currentUser.name} (${currentUser.roleTitle}).`,
      workloadId: fullWorkload.id,
      isRead: false,
      actionLabel: 'View Workloads',
      actionView: 'workloads',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    return true;
  }, [clouds, currentUser, triggerPermissionWarning]);

  const deleteWorkload = useCallback((workloadId: string): boolean => {
    if (!currentUser.permissions.canDeployWorkloads) {
      triggerPermissionWarning(
        'Deprovision Workload',
        'SRE Admin or Platform Engineer',
        `Role '${currentUser.roleTitle}' cannot terminate cloud instances.`
      );
      return false;
    }

    setWorkloads((prev) => {
      const target = prev.find((w) => w.id === workloadId);
      if (!target) return prev;
      // Decrement cloud utilization
      setClouds((cPrev) => {
        const c = cPrev[target.cloud];
        if (!c) return cPrev;
        return {
          ...cPrev,
          [target.cloud]: {
            ...c,
            workloadCount: Math.max(0, c.workloadCount - 1),
            cpuUtilizedPercent: Math.max(15, c.cpuUtilizedPercent - 4),
          },
        };
      });
      return prev.filter((w) => w.id !== workloadId);
    });
    return true;
  }, [currentUser, triggerPermissionWarning]);

  const migrateWorkload = useCallback(async (workloadId: string, targetCloud: CloudProviderId, reason = 'Manual administrator override'): Promise<boolean> => {
    if (!currentUser.permissions.canMigrateWorkloads) {
      triggerPermissionWarning(
        'Manual Workload Relocation',
        'SRE Admin',
        `Direct cross-cloud container cutovers require SRE Admin privileges. Current role is '${currentUser.roleTitle}'.`
      );
      return false;
    }

    const targetWl = workloads.find((w) => w.id === workloadId);
    if (!targetWl) return false;

    setIsSimulatingAction(true);
    setActiveSimulatedStep(`Manual Migration (${currentUser.username}): Moving ${targetWl.name} from ${clouds[targetWl.cloud]?.shortName} → ${clouds[targetCloud]?.shortName}`);
    await new Promise((r) => setTimeout(r, 900));

    setWorkloads((prev) =>
      prev.map((w) => {
        if (w.id === workloadId) {
          return {
            ...w,
            cloud: targetCloud,
            status: 'Running',
            latencyMs: clouds[targetCloud]?.averageLatencyMs || 30,
            lastOptimizedAt: 'Just now',
            aiRecommendation: undefined,
          };
        }
        return w;
      })
    );

    // Update cloud stats
    setClouds((prev) => {
      const src = prev[targetWl.cloud];
      const dst = prev[targetCloud];
      return {
        ...prev,
        [targetWl.cloud]: {
          ...src,
          workloadCount: Math.max(0, src.workloadCount - 1),
          cpuUtilizedPercent: Math.max(15, src.cpuUtilizedPercent - 5),
        },
        [targetCloud]: {
          ...dst,
          workloadCount: dst.workloadCount + 1,
          cpuUtilizedPercent: Math.min(95, dst.cpuUtilizedPercent + 5),
        },
      };
    });

    const newAction: AutonomousAction = {
      id: `ACT-${Math.floor(5000 + Math.random() * 4000)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      workloadId: targetWl.id,
      workloadName: targetWl.name,
      sourceCloud: targetWl.cloud,
      destinationCloud: targetCloud,
      triggerReason: reason,
      policyApplied: 'Administrator Manual Relocation',
      resultStatus: 'SUCCESS',
      executionDurationSec: 5,
      preMigrationSla: targetWl.currentSlaPercent,
      postMigrationSla: 99.99,
      costDeltaMonthly: -48.0,
      latencyDeltaMs: -2,
      actor: `${currentUser.name} (${currentUser.username})`,
      actorRole: currentUser.roleTitle,
      steps: [
        { timeOffsetMs: 0, timestamp: 'Now', title: 'Migration Requested', description: `${reason} (Authorized by ${currentUser.name})`, status: 'COMPLETED', stage: 'DECIDE' },
        { timeOffsetMs: 2000, timestamp: 'Now', title: 'Target Pod Provisioned', description: `Launched on ${clouds[targetCloud]?.name}`, status: 'COMPLETED', stage: 'ACT' },
        { timeOffsetMs: 4000, timestamp: 'Now', title: 'Traffic Cutover & Verification', description: 'Completed with 0 packet drop.', status: 'COMPLETED', stage: 'VERIFY' },
      ],
    };
    setActions((prev) => [newAction, ...prev]);

    setIsSimulatingAction(false);
    setActiveSimulatedStep('');
    return true;
  }, [clouds, workloads, currentUser, triggerPermissionWarning]);

  const togglePolicy = useCallback((policyId: string): boolean => {
    if (!currentUser.permissions.canModifyPolicies) {
      triggerPermissionWarning(
        'Policy Rule Toggle',
        'SRE Admin',
        `Modifying governing orchestration policies requires SRE Admin authority.`
      );
      return false;
    }
    setPolicies((prev) =>
      prev.map((p) => (p.id === policyId ? { ...p, isActive: !p.isActive } : p))
    );
    return true;
  }, [currentUser, triggerPermissionWarning]);

  const updatePolicy = useCallback((policyId: string, updates: Partial<PolicyRule>): boolean => {
    if (!currentUser.permissions.canModifyPolicies) {
      triggerPermissionWarning(
        'Update Policy Parameters',
        'SRE Admin',
        `Adjusting SLA thresholds, latency limits, or cloud allowances requires SRE Admin authority.`
      );
      return false;
    }
    setPolicies((prev) =>
      prev.map((p) => (p.id === policyId ? { ...p, ...updates } : p))
    );
    return true;
  }, [currentUser, triggerPermissionWarning]);

  const resetSimulation = useCallback(() => {
    setClouds(JSON.parse(JSON.stringify(INITIAL_CLOUDS)));
    setWorkloads(JSON.parse(JSON.stringify(INITIAL_WORKLOADS)));
    setPolicies(JSON.parse(JSON.stringify(INITIAL_POLICIES)));
    setDecisions(JSON.parse(JSON.stringify(INITIAL_DECISIONS)));
    setActions(JSON.parse(JSON.stringify(INITIAL_AUTONOMOUS_ACTIONS)));
    setNotifications(JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)));
    setTimeSeries(JSON.parse(JSON.stringify(INITIAL_TIME_SERIES)));
    setActiveStress({ aws: false, azure: false, gcp: false });
    setTrafficMultiplier(1.0);
    setActiveDemoScenario(null);
    setIsSimulatingAction(false);
    setActiveSimulatedStep('');
    setPermissionNotice(null);
  }, []);

  const loadDemoScenario = useCallback((scenarioId: string) => {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;
    setActiveDemoScenario(scenario);

    if (scenarioId === 'scenario-1') {
      resetSimulation();
      setActiveView('overview');
    } else if (scenarioId === 'scenario-2') {
      // GCP Overload & Autonomous self healing
      resetSimulation();
      setActiveView('overview');
      setTimeout(() => {
        stressCloud('gcp', 94);
      }, 500);
    } else if (scenarioId === 'scenario-3') {
      // AWS Cost Spike
      resetSimulation();
      setActiveView('cost-intelligence');
      setClouds((prev) => ({
        ...prev,
        aws: { ...prev.aws, costPerHour: 14.80, cpuUtilizedPercent: 82 },
      }));
    } else if (scenarioId === 'scenario-4') {
      // Azure Latency Degradation
      resetSimulation();
      setActiveView('performance');
      setClouds((prev) => ({
        ...prev,
        azure: { ...prev.azure, averageLatencyMs: 88, p95LatencyMs: 142, healthStatus: 'WARNING' },
      }));
    } else if (scenarioId === 'scenario-5') {
      // Traffic surge
      resetSimulation();
      setTrafficMultiplier(1.8);
      setActiveView('what-if');
    } else if (scenarioId === 'scenario-6') {
      // SLA risk
      resetSimulation();
      setActiveView('policies');
    }
  }, [resetSimulation, stressCloud]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const runWhatIfCalculation = useCallback((input: WhatIfScenarioInput) => {
    const currentHourly = (Object.values(clouds) as CloudProvider[]).reduce((acc, c) => acc + c.costPerHour, 0);
    const currentCost = Math.round(currentHourly * 24 * 30);

    const projectedMultiplier = input.trafficDemandMultiplier;
    const projectedCost = Math.round(
      (clouds.aws.costPerHour * input.awsCostMultiplier +
        clouds.azure.costPerHour * input.azureCostMultiplier +
        clouds.gcp.costPerHour * input.gcpCostMultiplier) *
        projectedMultiplier *
        24 *
        30
    );

    const baseLat = 32;
    const projectedLatency = Math.round(baseLat * (1 + (projectedMultiplier - 1) * 0.4));
    const projectedUtilization = Math.min(98, Math.round(overallResourceUtilization * projectedMultiplier));
    const projectedSla = projectedUtilization > 88 ? 99.82 : 99.98;

    const totalWl = workloads.length;
    const cloudDistributions = {
      aws: workloads.filter((w) => w.cloud === 'aws').length,
      azure: workloads.filter((w) => w.cloud === 'azure').length,
      gcp: workloads.filter((w) => w.cloud === 'gcp').length,
    };

    // AI optimized shift towards lower-cost / optimal capacity
    const optimizedDistributions = {
      aws: Math.round(totalWl * 0.28),
      azure: Math.round(totalWl * 0.44),
      gcp: Math.round(totalWl * 0.28),
    };

    const recommendedMigrations = Math.abs(cloudDistributions.aws - optimizedDistributions.aws) +
      Math.abs(cloudDistributions.azure - optimizedDistributions.azure);

    return {
      projectedCost,
      projectedLatency,
      projectedUtilization,
      projectedSla,
      currentCost,
      recommendedMigrations,
      cloudDistributions,
      optimizedDistributions,
    };
  }, [clouds, overallResourceUtilization, workloads]);

  return (
    <SimulationContext.Provider
      value={{
        clouds,
        workloads,
        policies,
        decisions,
        actions,
        notifications,
        timeSeries,
        benchmarks,
        activeView,
        setActiveView,
        isAutonomousActive,
        setIsAutonomousActive,
        trafficMultiplier,
        setTrafficMultiplier,
        isSimulatingAction,
        activeSimulatedStep,
        activeDemoScenario,
        currentUser,
        allUsers,
        switchUserRole,
        permissionNotice,
        dismissPermissionNotice,
        stressCloud,
        unstressCloud,
        createWorkload,
        deleteWorkload,
        migrateWorkload,
        executeAutonomousRemediation,
        togglePolicy,
        updatePolicy,
        resetSimulation,
        loadDemoScenario,
        markNotificationAsRead,
        clearAllNotifications,
        runWhatIfCalculation,
        totalWorkloadsCount,
        totalMonthlyCost,
        totalPotentialSavings,
        systemSlaHealth,
        overallResourceUtilization,
        actionsTodayCount,
        activeStress,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
