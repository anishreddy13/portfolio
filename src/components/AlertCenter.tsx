import React from 'react';
import { Alert } from '../hooks/useOperations';

export function AlertCenter({ alerts }: { alerts: Alert[] }) {
  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'INFO': return 'text-blue-400 bg-blue-900/30';
      case 'WARNING': return 'text-yellow-400 bg-yellow-900/30';
      case 'CRITICAL': return 'text-red-400 bg-red-900/30';
      case 'FATAL': return 'text-red-100 bg-red-600 animate-pulse';
      default: return 'text-slate-400 bg-slate-800';
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 flex flex-col h-full">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        Alert Center
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2">
        {alerts.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">No active alerts.</div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="bg-slate-900 p-2.5 rounded border border-slate-700/50 flex items-start gap-3">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5 ${getSeverityColor(alert.severity)}`}>
                {alert.severity}
              </span>
              <div className="flex-1">
                <div className="text-xs font-bold text-white">{alert.source}</div>
                <div className="text-xs text-slate-300">{alert.message}</div>
              </div>
              <div className="text-[10px] text-slate-500 whitespace-nowrap">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
