import React, { useState } from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { LandingPage } from './components/landing/LandingPage';
import { OverviewView } from './components/views/OverviewView';
import { WorkloadsView } from './components/views/WorkloadsView';
import { CloudInfrastructureView } from './components/views/CloudInfrastructureView';
import { AiDecisionsView } from './components/views/AiDecisionsView';
import { AutonomousActionsView } from './components/views/AutonomousActionsView';
import { CostIntelligenceView } from './components/views/CostIntelligenceView';
import { PerformanceView } from './components/views/PerformanceView';
import { PoliciesView } from './components/views/PoliciesView';
import { WhatIfSimulatorView } from './components/views/WhatIfSimulatorView';
import { ExperimentsView } from './components/views/ExperimentsView';
import { GnnRecommendationsView } from './components/views/GnnRecommendationsView';
import { GraphExplorerView } from './components/views/GraphExplorerView';
import { MetaRlView } from './components/views/MetaRlView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';

import { CreateWorkloadModal } from './components/modals/CreateWorkloadModal';
import { TrafficSimulatorDrawer } from './components/modals/TrafficSimulatorDrawer';
import { DemoScenarioModal } from './components/modals/DemoScenarioModal';
import { CommandPalette } from './components/modals/CommandPalette';
import { PermissionNoticeBanner } from './components/common/PermissionNoticeBanner';
import { PricingModal } from './components/modals/PricingModal';
import { BookDemoModal } from './components/modals/BookDemoModal';
import { FreeTrialModal } from './components/modals/FreeTrialModal';
import { SignInModal } from './components/modals/SignInModal';
import { EnterpriseInfoModal, EnterpriseInfoType } from './components/modals/EnterpriseInfoModal';

const MainAppContent: React.FC = () => {
  const { activeView } = useSimulation();

  // Navigation mode: default is public marketing landing page (CAST AI style)
  const [inDashboardView, setInDashboardView] = useState(false);

  // Operational Control Plane Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSimulatorDrawerOpen, setIsSimulatorDrawerOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Enterprise SaaS Modals (CAST AI Style)
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);
  const [isFreeTrialOpen, setIsFreeTrialOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [enterpriseInfoType, setEnterpriseInfoType] = useState<EnterpriseInfoType>(null);

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return (
          <OverviewView
            onOpenCreateWorkload={() => setIsCreateModalOpen(true)}
            onOpenSimulator={() => setIsSimulatorDrawerOpen(true)}
          />
        );
      case 'workloads':
        return <WorkloadsView onOpenCreateModal={() => setIsCreateModalOpen(true)} />;
      case 'infrastructure':
        return <CloudInfrastructureView />;
      case 'ai-decisions':
        return <AiDecisionsView />;
      case 'autonomous-actions':
        return <AutonomousActionsView />;
      case 'cost-intelligence':
        return <CostIntelligenceView />;
      case 'performance':
        return <PerformanceView />;
      case 'policies':
        return <PoliciesView />;
      case 'meta-rl':
        return <MetaRlView />;
      case 'gnn-recommendations':
        return <GnnRecommendationsView />;
      case 'graph-explorer':
        return <GraphExplorerView />;
      case 'what-if':
        return <WhatIfSimulatorView />;
      case 'experiments':
        return <ExperimentsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <OverviewView
            onOpenCreateWorkload={() => setIsCreateModalOpen(true)}
            onOpenSimulator={() => setIsSimulatorDrawerOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-600 selection:text-white font-sans">
      {!inDashboardView ? (
        /* Public Marketing Landing Page (Default on First Load) */
        <LandingPage
          onEnterDashboard={() => setInDashboardView(true)}
          onOpenSignIn={() => setIsSignInOpen(true)}
          onOpenBookDemo={() => setIsBookDemoOpen(true)}
          onOpenFreeTrial={() => setIsFreeTrialOpen(true)}
          onOpenPricing={() => setIsPricingModalOpen(true)}
          onOpenInfo={(type) => setEnterpriseInfoType(type)}
        />
      ) : (
        /* Authenticated Multi-Cloud Control Center */
        <div className="flex min-h-screen">
          {/* Persistent Left Sidebar with Sign Out trigger */}
          <Sidebar onSignOut={() => setInDashboardView(false)} />

          {/* Main Control Center Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <TopNav
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenSimulator={() => setIsSimulatorDrawerOpen(true)}
              onOpenDemoModal={() => setIsDemoModalOpen(true)}
              onOpenCreateWorkload={() => setIsCreateModalOpen(true)}
              onSignOut={() => setInDashboardView(false)}
            />

            <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
              {renderActiveView()}
            </main>
          </div>
        </div>
      )}

      {/* Global Modals & Drawers Available Across Both Modes */}
      <CreateWorkloadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <TrafficSimulatorDrawer
        isOpen={isSimulatorDrawerOpen}
        onClose={() => setIsSimulatorDrawerOpen(false)}
      />

      <DemoScenarioModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />

      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Enterprise SaaS Modals (CAST AI Style) */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSuccess={() => setInDashboardView(true)}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onOpenBookDemo={() => setIsBookDemoOpen(true)}
        onOpenFreeTrial={() => setIsFreeTrialOpen(true)}
      />

      <BookDemoModal
        isOpen={isBookDemoOpen}
        onClose={() => setIsBookDemoOpen(false)}
      />

      <FreeTrialModal
        isOpen={isFreeTrialOpen}
        onClose={() => setIsFreeTrialOpen(false)}
      />

      <EnterpriseInfoModal
        type={enterpriseInfoType}
        onClose={() => setEnterpriseInfoType(null)}
        onOpenPricing={() => {
          setEnterpriseInfoType(null);
          setIsPricingModalOpen(true);
        }}
        onOpenBookDemo={() => {
          setEnterpriseInfoType(null);
          setIsBookDemoOpen(true);
        }}
        onOpenFreeTrial={() => {
          setEnterpriseInfoType(null);
          setIsFreeTrialOpen(true);
        }}
      />

      {/* Role-Based Permission Feedback Banner */}
      <PermissionNoticeBanner />
    </div>
  );
};

export default function App() {
  return (
    <SimulationProvider>
      <MainAppContent />
    </SimulationProvider>
  );
}
