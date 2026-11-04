import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Building2,
  Check,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { UserProfile } from '../../types';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { allUsers, currentUser, switchUserRole } = useSimulation();
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [authMethod, setAuthMethod] = useState<'sso' | 'mock'>('mock');
  const [ssoDomain, setSsoDomain] = useState('enterprise-corp.com');

  if (!isOpen) return null;

  const handleSignIn = (userId?: string) => {
    const idToUse = userId || selectedUserId;
    switchUserRole(idToUse);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#020617] border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-fade-in text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Sign In to CloudOptiX
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your multi-cloud control plane and autonomous remediation engine.
          </p>
        </div>

        {/* Auth Method Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#0b1120] border border-slate-800 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthMethod('mock')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              authMethod === 'mock'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Demo Enterprise Roles (1-Click)
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('sso')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              authMethod === 'sso'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Enterprise SSO / SAML
          </button>
        </div>

        {authMethod === 'mock' ? (
          /* Role Picker (For Live Capstone Demo) */
          <div className="space-y-3">
            <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold">
              Select Demo Identity
            </label>
            <div className="space-y-2">
              {allUsers.map((user: UserProfile) => {
                const isSelected = user.id === selectedUserId;
                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40 shadow-md'
                        : 'bg-[#0b1120] hover:bg-slate-850 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl ${user.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm`}
                      >
                        {user.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100">{user.name}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${user.badgeColor}`}>
                            {user.roleTitle}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {user.department}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => handleSignIn()}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Control Center</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Enterprise SAML / Okta SSO Simulation */
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                Corporate Domain (Okta, Azure AD, Ping)
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ssoDomain}
                  onChange={(e) => setSsoDomain(e.target.value)}
                  className="w-full bg-[#0b1120] border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  placeholder="company.com"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSignIn('sre_admin_04')}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Authenticate with Okta SSO</span>
            </button>
          </div>
        )}

        {/* Security footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> SOC2 Type II Certified
          </span>
          <span className="font-mono text-slate-400">TLS 1.3 Encryption</span>
        </div>
      </div>
    </div>
  );
};
