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

export function useIdentity() {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Demo mode: credentials are not validated against the backend.
  // In production, replace this with a real API call to the IdentityEngine.
  const login = useCallback(async (username: string, _password: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setUser({
        id: 'usr_1',
        username,
        organization: 'Enterprise Corp',
        roles: ['ADMIN', 'TRADER'],
        permissions: ['EXECUTE_TRADES', 'VIEW_PORTFOLIO', 'SYSTEM_ADMIN']
      });
      const wss = [
        { id: 'ws_1', name: 'Global Equities' },
        { id: 'ws_2', name: 'Crypto Desk' }
      ];
      setWorkspaces(wss);
      setActiveWorkspace(wss[0]);
      setIsLoading(false);
    }, 500);
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
    login,
    logout,
    switchWorkspace
  };
}
