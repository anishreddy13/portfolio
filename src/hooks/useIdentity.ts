import { useState, useCallback } from 'react';

export interface User {
  id: string;
  username: string;
  organization: string;
  roles: string[];
  permissions: string[];
}

export interface Workspace {
  id: string;
  name: string;
}

// Demo credentials are intentionally not hardcoded in source.
// Demo login is explicitly opt-in via env vars so production deployments remain locked down.
// Roles are intentionally limited to TRADER (no ADMIN) for demo users.
const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEMO_LOGIN_ENABLED === 'true';
const DEMO_USERNAME = (process.env.NEXT_PUBLIC_DEMO_USERNAME ?? '').trim();
const DEMO_PASSWORD = (process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? '').trim();

const isDemoLoginConfigured = () => DEMO_LOGIN_ENABLED && Boolean(DEMO_USERNAME) && Boolean(DEMO_PASSWORD);

export function useIdentity() {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setLoginError(null);

    const safeUsername = username.trim();
    const safePassword = password.trim();

    if (!safeUsername || !safePassword) {
      setLoginError('Username and password are required.');
      return;
    }

    if (!isDemoLoginConfigured()) {
      setLoginError('Demo authentication is disabled. Set NEXT_PUBLIC_DEMO_LOGIN_ENABLED=true and valid demo credentials to enable the demo login flow.');
      return;
    }

    setIsLoading(true);
    // Simulate async credential check.
    await new Promise<void>((resolve) => setTimeout(resolve, 400));

    if (safeUsername !== DEMO_USERNAME || safePassword !== DEMO_PASSWORD) {
      setLoginError('Invalid username or password.');
      setIsLoading(false);
      return;
    }

    setUser({
      id: 'usr_1',
      username: safeUsername,
      organization: 'Enterprise Corp',
      roles: ['TRADER'],
      permissions: ['EXECUTE_TRADES', 'VIEW_PORTFOLIO'],
    });
    const wss = [
      { id: 'ws_1', name: 'Global Equities' },
      { id: 'ws_2', name: 'Crypto Desk' },
    ];
    setWorkspaces(wss);
    setActiveWorkspace(wss[0]);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspace(null);
  }, []);

  const switchWorkspace = useCallback((wsId: string) => {
    const ws = workspaces.find(w => w.id === wsId);
    if (ws) setActiveWorkspace(ws);
  }, [workspaces]);

  return {
    user,
    workspaces,
    activeWorkspace,
    isLoading,
    loginError,
    login,
    logout,
    switchWorkspace,
  };
}
