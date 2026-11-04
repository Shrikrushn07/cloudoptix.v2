import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { ShieldAlert, X, ArrowRight, UserCheck } from 'lucide-react';

export const PermissionNoticeBanner: React.FC = () => {
  const { permissionNotice, dismissPermissionNotice, switchUserRole, currentUser } = useSimulation();

  if (!permissionNotice) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-short">
      <div className="p-4 rounded-2xl bg-[#0b1120] border border-rose-500/60 shadow-2xl shadow-rose-950/50 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
        
        <div className="flex items-start justify-between gap-3 pl-2">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Role Permission Constraint
                </span>
                <span className="text-[10px] font-mono bg-rose-950 px-2 py-0.2 rounded text-rose-300 border border-rose-800">
                  HTTP 403 FORBIDDEN
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100 mt-1">
                {permissionNotice.actionName} Blocked
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {permissionNotice.reason}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => switchUserRole('sre_admin_04')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Switch to SRE Admin
                </button>
                <button
                  onClick={dismissPermissionNotice}
                  className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={dismissPermissionNotice}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
