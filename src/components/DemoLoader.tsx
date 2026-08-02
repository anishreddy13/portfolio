import React from 'react';

export function DemoLoader() {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 h-full flex flex-col">
      <h3 className="text-sm font-bold text-white mb-3">Demo Environment</h3>
      <div className="flex-1 flex flex-col justify-center gap-3">
        <p className="text-xs text-slate-400">Load sample portfolios, algorithmic signals, and backtest history to explore the platform's capabilities.</p>
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded transition-colors shadow-lg">
          Inject Demo Data
        </button>
        <button className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2.5 rounded transition-colors">
          Reset Environment
        </button>
      </div>
    </div>
  );
}
