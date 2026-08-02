import React from 'react';

export function QuickStartPanel() {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 h-full flex flex-col">
      <h3 className="text-sm font-bold text-white mb-3">Quickstart Resources</h3>
      <div className="flex-1 space-y-2">
        <a href="/docs/architecture" className="block p-3 bg-slate-900 rounded border border-slate-700/30 hover:border-slate-500 transition-colors">
          <div className="text-xs font-bold text-blue-400">Architecture Overview</div>
          <div className="text-[10px] text-slate-400 mt-1">Platform subsystems and message flow.</div>
        </a>
        <a href="/docs/api-reference" className="block p-3 bg-slate-900 rounded border border-slate-700/30 hover:border-slate-500 transition-colors">
          <div className="text-xs font-bold text-purple-400">API Reference</div>
          <div className="text-[10px] text-slate-400 mt-1">FastAPI Swagger documentation.</div>
        </a>
        <a href="/docs/deployment" className="block p-3 bg-slate-900 rounded border border-slate-700/30 hover:border-slate-500 transition-colors">
          <div className="text-xs font-bold text-emerald-400">Deployment Guide</div>
          <div className="text-[10px] text-slate-400 mt-1">Kubernetes & Terraform IaC instructions.</div>
        </a>
      </div>
    </div>
  );
}
