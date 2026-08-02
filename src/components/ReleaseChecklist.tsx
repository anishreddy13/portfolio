import React from 'react';

export function ReleaseChecklist() {
  const checklist = [
    { label: 'Unit & Integration Tests Passed', checked: true },
    { label: 'Security Audit & Threat Model Cleared', checked: true },
    { label: 'Infrastructure & SRE Hooks Verified', checked: true },
    { label: 'Documentation & API Reference Published', checked: true },
    { label: 'Demo Data Seeded', checked: true },
  ];

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 h-full flex flex-col">
      <h3 className="text-sm font-bold text-white mb-3">Release Checklist (v1.0.0)</h3>
      <div className="flex-1 space-y-2">
        {checklist.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 bg-slate-900 rounded border border-slate-700/30">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.checked ? 'bg-green-500' : 'bg-slate-600'}`}>
              {item.checked && (
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              )}
            </div>
            <span className={`text-xs ${item.checked ? 'text-slate-300' : 'text-slate-500'}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
