import React from 'react';
import { useDeployment } from '../hooks/useDeployment';

export default function DeploymentPanel() {
  const { status, isDeploying, isRollingBack, triggerDeployment, triggerRollback } = useDeployment();

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'HEALTHY': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'DEGRADED': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'UNHEALTHY': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'PROVISIONING': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-full overflow-hidden text-sm">
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-10-5-10 5v12Z"></path>
            <path d="M12 15V3"></path>
          </svg>
          <h2 className="font-bold text-white">Cloud Deployment & Infrastructure</h2>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-bold tracking-wider ${getStatusColor(status.status)}`}>
          {status.status}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/50 flex-1 overflow-y-auto">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700/50 shadow-inner flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-xs font-medium mb-1">Target Environment</div>
            <div className="text-lg font-bold text-white tracking-wide">{status.environment}</div>
          </div>
          <div className="mt-4">
            <div className="text-slate-400 text-xs font-medium mb-1">Cluster Provider</div>
            <div className="text-sm font-medium text-blue-300">{status.target}</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700/50 shadow-inner">
          <div className="text-slate-400 text-xs font-medium mb-3">Kubernetes Pod Status</div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-white leading-none">{status.replicas}</span>
            <span className="text-xs text-slate-400 mb-1">Active Replicas</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-4">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700/50 shadow-inner">
          <div className="text-slate-400 text-xs font-medium mb-3">Infrastructure Load</div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">CPU Usage</span>
                <span className="text-white font-medium">{status.cpuUsage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-1000 ${status.cpuUsage > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${status.cpuUsage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Memory</span>
                <span className="text-white font-medium">{status.memoryUsage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-1000 ${status.memoryUsage > 85 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${status.memoryUsage}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700/50 shadow-inner flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-xs font-medium mb-1">Last Deployment</div>
            <div className="text-sm text-white font-medium truncate">
              {new Date(status.lastDeployment).toLocaleString()}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button 
              onClick={triggerDeployment}
              disabled={isDeploying || isRollingBack}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded transition-colors"
            >
              {isDeploying ? 'Deploying...' : 'Deploy'}
            </button>
            <button 
              onClick={triggerRollback}
              disabled={isDeploying || isRollingBack || !status.rollbackAvailable}
              className="flex-1 bg-red-900/80 hover:bg-red-800 disabled:opacity-50 text-red-100 text-xs font-bold py-2 rounded transition-colors border border-red-800/50"
            >
              {isRollingBack ? 'Rolling Back...' : 'Rollback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
