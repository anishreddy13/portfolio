import React from 'react';
import { Incident } from '../hooks/useOperations';

export function IncidentTimeline({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 flex flex-col h-full">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        Incident Timeline
      </h3>
      <div className="flex-1 overflow-y-auto">
        {incidents.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">No open incidents.</div>
        ) : (
          <div className="space-y-3 pl-2 border-l-2 border-slate-700 ml-2">
            {incidents.map(inc => (
              <div key={inc.id} className="relative pl-4">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-800"></div>
                <div className="text-xs text-slate-400">{new Date(inc.time).toLocaleTimeString()}</div>
                <div className="text-sm font-bold text-white">{inc.title}</div>
                <div className="text-xs text-slate-300 mt-1">Status: <span className="text-blue-400 font-medium">{inc.status}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
