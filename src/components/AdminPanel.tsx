import React from 'react';
import { User } from '../hooks/useIdentity';

interface AdminPanelProps {
  user: User;
}

export function AdminPanel({ user }: AdminPanelProps) {
  if (!user.roles.includes('ADMIN')) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden h-full flex flex-col">
      <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          IAM Admin Console
        </h3>
        <span className="text-[10px] font-medium bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full border border-blue-800/50">
          ENTERPRISE
        </span>
      </div>
      
      <div className="p-3 space-y-2 text-sm text-slate-300 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded border border-slate-700/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="font-medium">Manage Users</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider">Configure</button>
        </div>
        
        <div className="flex justify-between items-center p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded border border-slate-700/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span className="font-medium">Roles & Permissions</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider">Configure</button>
        </div>
        
        <div className="flex justify-between items-center p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded border border-slate-700/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
            <span className="font-medium">API Keys</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider">Configure</button>
        </div>
        
        <div className="flex justify-between items-center p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded border border-slate-700/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span className="font-medium">Organization Settings</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider">Configure</button>
        </div>
      </div>
    </div>
  );
}
