import React, { useState, useRef, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import {
  User,
  Shield,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Zap,
  TrendingDown,
  Sliders,
  Check,
  Building,
} from 'lucide-react';
import { UserProfile } from '../../types';

interface RoleSwitcherDropdownProps {
  variant?: 'sidebar' | 'header';
}

export const RoleSwitcherDropdown: React.FC<RoleSwitcherDropdownProps> = ({ variant = 'header' }) => {
  const { currentUser, allUsers, switchUserRole } = useSimulation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectRole = (userId: string) => {
    switchUserRole(userId);
    setIsOpen(false);
  };

  const getRoleIcon = (roleId: string) => {
    if (roleId === 'sre_admin') return <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />;
    if (roleId === 'finops_lead') return <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />;
    return <Zap className="w-3.5 h-3.5 text-sky-400" />;
  };

  if (variant === 'sidebar') {
    return (
      <div className="relative w-full" ref={dropdownRef}>
        {/* Sidebar Trigger Card */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-[#0b1120] hover:bg-[#10172a] border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg ${currentUser.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-indigo-950`}
              >
                {currentUser.initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-100 truncate block">
                    {currentUser.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 truncate block">
                  {currentUser.department}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${currentUser.badgeColor}`}
              >
                {currentUser.roleTitle}
              </span>
              {isOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform" />
              )}
            </div>
          </div>
        </div>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-80 sm:w-88 bg-[#0b1120] border border-slate-700/80 rounded-2xl shadow-2xl z-50 p-4 animate-fade-in divide-y divide-slate-800/80">
            {/* Popover Header */}
            <div className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                    Identity & RBAC Switcher
                  </span>
                </div>
                <span className="text-[9px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  DEMO MOCK AUTH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Switch identity to test real role-based permission boundaries and audit traces.
              </p>
            </div>

            {/* Role List */}
            <div className="py-3 space-y-2">
              {allUsers.map((user: UserProfile) => {
                const isSelected = user.id === currentUser.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectRole(user.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40 shadow-md'
                        : 'bg-[#020617] hover:bg-[#10172a] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg ${user.avatarBg} text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        {user.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100">{user.name}</span>
                          <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${user.badgeColor}`}>
                            {user.roleTitle}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {user.department}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                          {user.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 mt-1">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active Session & Permission Summary */}
            <div className="pt-3">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-bold mb-1.5 flex justify-between">
                <span>Active Token: <span className="text-slate-300 font-mono">{currentUser.sessionToken.slice(0, 16)}...</span></span>
                <span className="text-emerald-400">AUTHENTICATED</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                <span className={`flex items-center gap-1 ${currentUser.permissions.canStressClouds ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {currentUser.permissions.canStressClouds ? '✓' : '✗'} Chaos Stress
                </span>
                <span className={`flex items-center gap-1 ${currentUser.permissions.canDeployWorkloads ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {currentUser.permissions.canDeployWorkloads ? '✓' : '✗'} Workload Deploy
                </span>
                <span className={`flex items-center gap-1 ${currentUser.permissions.canMigrateWorkloads ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {currentUser.permissions.canMigrateWorkloads ? '✓' : '✗'} Manual Relocate
                </span>
                <span className={`flex items-center gap-1 ${currentUser.permissions.canModifyPolicies ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {currentUser.permissions.canModifyPolicies ? '✓' : '✗'} Policy Authoring
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Header Variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[#0b1120] hover:bg-[#10172a] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm group"
        title="Switch active user & role"
      >
        <div
          className={`w-6 h-6 rounded-lg ${currentUser.avatarBg} text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm`}
        >
          {currentUser.initials}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-200 group-hover:text-white leading-none">
              {currentUser.name}
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 leading-tight">
            {currentUser.roleTitle}
          </span>
        </div>
        <span
          className={`hidden md:inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${currentUser.badgeColor}`}
        >
          {currentUser.username}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Header Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-84 bg-[#0b1120] border border-slate-700/80 rounded-2xl shadow-2xl z-50 p-4 animate-fade-in divide-y divide-slate-800/80">
          {/* Header */}
          <div className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  Enterprise Role Switcher
                </span>
              </div>
              <span className="text-[9px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                CAPSTONE DEMO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Select an identity to experience role-based capabilities and audit trail attribution.
            </p>
          </div>

          {/* User Selection List */}
          <div className="py-3 space-y-2">
            {allUsers.map((user: UserProfile) => {
              const isSelected = user.id === currentUser.id;
              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectRole(user.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40 shadow-md'
                      : 'bg-[#020617] hover:bg-[#10172a] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg ${user.avatarBg} text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      {user.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-100">{user.name}</span>
                        <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${user.badgeColor}`}>
                          {user.roleTitle}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        {user.department}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                        {user.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 mt-1">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Session & Matrix */}
          <div className="pt-3">
            <div className="text-[10px] font-mono text-slate-500 uppercase font-bold mb-1.5 flex justify-between">
              <span>Token: <span className="text-slate-300 font-mono">{currentUser.sessionToken.slice(0, 16)}...</span></span>
              <span className="text-emerald-400">ACTIVE SESSION</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
              <span className={`flex items-center gap-1 ${currentUser.permissions.canStressClouds ? 'text-emerald-400' : 'text-slate-500'}`}>
                {currentUser.permissions.canStressClouds ? '✓' : '✗'} Chaos Stress
              </span>
              <span className={`flex items-center gap-1 ${currentUser.permissions.canDeployWorkloads ? 'text-emerald-400' : 'text-slate-500'}`}>
                {currentUser.permissions.canDeployWorkloads ? '✓' : '✗'} Workload Deploy
              </span>
              <span className={`flex items-center gap-1 ${currentUser.permissions.canMigrateWorkloads ? 'text-emerald-400' : 'text-slate-500'}`}>
                {currentUser.permissions.canMigrateWorkloads ? '✓' : '✗'} Manual Relocate
              </span>
              <span className={`flex items-center gap-1 ${currentUser.permissions.canModifyPolicies ? 'text-emerald-400' : 'text-slate-500'}`}>
                {currentUser.permissions.canModifyPolicies ? '✓' : '✗'} Policy Authoring
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
