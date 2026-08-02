import React from 'react';
import { ReleaseChecklist } from './ReleaseChecklist';
import { DemoLoader } from './DemoLoader';
import { QuickStartPanel } from './QuickStartPanel';

export default function ReleasePanel() {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-full overflow-hidden text-sm">
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
            <path d="M4 22h16"></path>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
          </svg>
          <h2 className="font-bold text-white">Version 1.0 Release Candidate</h2>
        </div>
        <div className="px-3 py-1 rounded-full border text-xs font-bold tracking-wider text-amber-400 bg-amber-400/10 border-amber-400/20">
          STATUS: VALIDATING
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/50 flex-1 overflow-y-auto">
        <div className="md:col-span-1 h-[280px]">
          <ReleaseChecklist />
        </div>
        <div className="md:col-span-1 h-[280px]">
          <DemoLoader />
        </div>
        <div className="md:col-span-1 h-[280px]">
          <QuickStartPanel />
        </div>

        <div className="md:col-span-3 bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <h3 className="text-sm font-bold text-white mb-4">Release Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 bg-slate-900 rounded border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-white">40</div>
              <div className="text-[10px] text-slate-400 uppercase mt-1">Subsystems</div>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-white">150</div>
              <div className="text-[10px] text-slate-400 uppercase mt-1">Backend Modules</div>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-white">80</div>
              <div className="text-[10px] text-slate-400 uppercase mt-1">Frontend Panels</div>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-white">40</div>
              <div className="text-[10px] text-slate-400 uppercase mt-1">React Hooks</div>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-white">25</div>
              <div className="text-[10px] text-slate-400 uppercase mt-1">Deploy Artifacts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
