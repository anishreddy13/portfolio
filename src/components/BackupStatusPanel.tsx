import React from 'react';

export interface BackupStatus {
  lastBackup: string;
  size: string;
  status: string;
}

export function BackupStatusPanel({ backups }: { backups: BackupStatus }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 flex flex-col h-full">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Disaster Recovery & Backups
      </h3>
      <div className="space-y-4">
        <div className="bg-slate-900 p-3 rounded border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Last Successful Backup</div>
          <div className="text-sm font-bold text-white">{new Date(backups.lastBackup).toLocaleString()}</div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-slate-400">Size: {backups.size}</span>
            <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded uppercase font-bold">{backups.status}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded transition-colors">
            Trigger Backup
          </button>
          <button className="flex-1 bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-bold py-2 rounded transition-colors">
            Initiate Restore
          </button>
        </div>
      </div>
    </div>
  );
}
