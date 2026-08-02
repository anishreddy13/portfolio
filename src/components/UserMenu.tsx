import React from 'react';
import { User } from '../hooks/useIdentity';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 pr-3 rounded-full border border-slate-700/50 hover:border-slate-600 transition-colors">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
        {user.username.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white leading-tight">{user.username}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-slate-400 font-medium">{user.organization}</span>
          <div className="w-1 h-1 rounded-full bg-slate-600"></div>
          {user.roles.slice(0, 1).map(role => (
            <span key={role} className="text-[9px] px-1 bg-blue-500/20 text-blue-300 rounded font-bold uppercase tracking-wider">
              {role}
            </span>
          ))}
        </div>
      </div>
      <button 
        onClick={onLogout}
        className="ml-2 p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-full transition-colors"
        title="Sign Out"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}
