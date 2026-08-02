import React from 'react';
import { ServiceHealth } from '../hooks/useOperations';

export function InfrastructureHealthPanel({ services }: { services: ServiceHealth[] }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 flex flex-col h-full">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
        Service Health
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2">
        {services.map(svc => (
          <div key={svc.name} className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-700/30">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${svc.status === 'HEALTHY' ? 'bg-green-500' : svc.status === 'DEGRADED' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium text-slate-300">{svc.name}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-white">{svc.uptime.toFixed(2)}%</div>
              <div className="text-[10px] text-slate-400">{svc.latency.toFixed(1)}ms</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
