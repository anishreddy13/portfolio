import React from 'react';
import { Workspace } from '../hooks/useIdentity';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onSwitch: (id: string) => void;
}

export function WorkspaceSelector({ workspaces, activeWorkspace, onSwitch }: WorkspaceSelectorProps) {
  if (!activeWorkspace) return null;

  return (
    <div className="flex items-center gap-2">
      <select 
        className="bg-slate-800/80 border border-slate-700/80 text-sm font-medium text-slate-200 rounded-md py-1.5 pl-3 pr-8 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer transition-colors"
        value={activeWorkspace.id}
        onChange={(e) => onSwitch(e.target.value)}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1em'
        }}
      >
        {workspaces.map(ws => (
          <option key={ws.id} value={ws.id}>{ws.name}</option>
        ))}
      </select>
    </div>
  );
}
