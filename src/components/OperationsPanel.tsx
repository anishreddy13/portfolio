import React from 'react';
import { useOperations } from '../hooks/useOperations';
import { AlertCenter } from './AlertCenter';
import { IncidentTimeline } from './IncidentTimeline';
import { InfrastructureHealthPanel } from './InfrastructureHealthPanel';
import { BackupStatusPanel } from './BackupStatusPanel';

export default function OperationsPanel() {
  const { overallHealth, services, alerts, incidents, backups } = useOperations();

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-full overflow-hidden text-sm">
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <h2 className="font-bold text-white">SRE & Operations Center</h2>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-bold tracking-wider ${
          overallHealth === 'HEALTHY' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 
          overallHealth === 'DEGRADED' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' : 
          'text-red-400 bg-red-400/10 border-red-400/20'
        }`}>
          PLATFORM: {overallHealth}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/50 flex-1 overflow-y-auto">
        <div className="col-span-1 lg:col-span-1 h-[300px]">
          <InfrastructureHealthPanel services={services} />
        </div>
        <div className="col-span-1 lg:col-span-1 h-[300px]">
          <AlertCenter alerts={alerts} />
        </div>
        <div className="col-span-1 lg:col-span-1 h-[300px]">
          <IncidentTimeline incidents={incidents} />
        </div>
        <div className="col-span-1 lg:col-span-1 h-[300px]">
          <BackupStatusPanel backups={backups} />
        </div>
      </div>
    </div>
  );
}
