import { useState, useEffect } from 'react';

export interface Alert {
  id: string;
  source: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'FATAL';
  message: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  title: string;
  status: 'OPEN' | 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'FATAL';
  time: string;
}

export interface ServiceHealth {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  uptime: number;
  latency: number;
}

export function useOperations() {
  const [overallHealth, setOverallHealth] = useState<'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'>('HEALTHY');
  const [services, setServices] = useState<ServiceHealth[]>([
    { name: 'API_GATEWAY', status: 'HEALTHY', uptime: 99.99, latency: 45 },
    { name: 'TRADING_ENGINE', status: 'HEALTHY', uptime: 100.0, latency: 12 },
    { name: 'MARKET_DATA', status: 'HEALTHY', uptime: 99.95, latency: 85 },
    { name: 'PORTFOLIO_MANAGER', status: 'HEALTHY', uptime: 100.0, latency: 25 },
    { name: 'STREAMING_ENGINE', status: 'HEALTHY', uptime: 99.9, latency: 15 },
    { name: 'CACHE_BRIDGE', status: 'HEALTHY', uptime: 99.99, latency: 5 },
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 'alrt_1', source: 'MARKET_DATA', severity: 'WARNING', message: 'Latency spike in SIP feed', timestamp: new Date(Date.now() - 500000).toISOString() }
  ]);

  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [backups, setBackups] = useState({
    lastBackup: new Date(Date.now() - 86400000).toISOString(),
    status: 'COMPLETED',
    size: '512 MB'
  });

  // Simulated live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setServices(prev => prev.map(s => {
        if (s.name === 'MARKET_DATA' && Math.random() > 0.8) {
          return { ...s, latency: Math.random() * 200 + 50 };
        }
        return { ...s, latency: Math.max(5, s.latency + (Math.random() * 10 - 5)) };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return {
    overallHealth,
    services,
    alerts,
    incidents,
    backups
  };
}
