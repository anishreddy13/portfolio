"use client";

import { useState } from "react";

export interface UserIdentityData {
  userId: string;
  username: string;
  email: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
}

export interface SecretReferenceData {
  secretId: string;
  secretName: string;
  vaultPath: string;
  version: number;
  lastRotatedAt: string;
}

export interface SecurityStatisticsData {
  totalIdentities: number;
  totalRoles: number;
  totalSecretsManaged: number;
  activeTokensCount: number;
  deniedAccessCount: number;
  lastRotationAt: string;
}

const INITIAL_IDENTITIES: UserIdentityData[] = [
  { userId: "user-01", username: "alex_sre", email: "alex.sre@enterprise.com", roleName: "ADMIN", isActive: true, createdAt: "10:00:00 AM" },
  { userId: "user-02", username: "sarah_quant", email: "sarah.quant@enterprise.com", roleName: "QUANT_TRADER", isActive: true, createdAt: "10:00:00 AM" },
  { userId: "user-03", username: "cro_officer", email: "cro@enterprise.com", roleName: "RISK_MANAGER", isActive: true, createdAt: "10:00:00 AM" },
];

const INITIAL_SECRETS: SecretReferenceData[] = [
  { secretId: "sec-alpaca", secretName: "ALPACA_API_SECRET", vaultPath: "secret/data/trading/alpaca-primary", version: 2, lastRotatedAt: "08:00:00 AM" },
  { secretId: "sec-ibkr", secretName: "IBKR_CERT_KEY", vaultPath: "secret/data/trading/ibkr-gateway", version: 1, lastRotatedAt: "08:00:00 AM" },
  { secretId: "sec-polygon", secretName: "POLYGON_API_KEY", vaultPath: "secret/data/marketdata/polygon", version: 3, lastRotatedAt: "08:00:00 AM" },
];

const INITIAL_STATS: SecurityStatisticsData = {
  totalIdentities: 3,
  totalRoles: 4,
  totalSecretsManaged: 3,
  activeTokensCount: 3,
  deniedAccessCount: 0,
  lastRotationAt: "08:00:00 AM",
};

export function useSecurity() {
  const [identities, setIdentities] = useState<UserIdentityData[]>(INITIAL_IDENTITIES);
  const [secrets, setSecrets] = useState<SecretReferenceData[]>(INITIAL_SECRETS);
  const [stats, setStats] = useState<SecurityStatisticsData>(INITIAL_STATS);

  const rotateSecret = (secretName: string) => {
    const now = new Date().toLocaleTimeString();
    setSecrets((prev) =>
      prev.map((s) => {
        if (s.secretName === secretName) {
          return { ...s, version: s.version + 1, lastRotatedAt: now };
        }
        return s;
      })
    );

    setStats((prev) => ({ ...prev, lastRotationAt: now }));
  };

  const registerUser = (username: string, email: string, roleName: string = "QUANT_TRADER") => {
    const now = new Date().toLocaleTimeString();
    const newUser: UserIdentityData = {
      userId: `user-${Date.now()}`,
      username,
      email,
      roleName,
      isActive: true,
      createdAt: now,
    };

    setIdentities((prev) => [...prev, newUser]);
    setStats((prev) => ({ ...prev, totalIdentities: prev.totalIdentities + 1 }));
  };

  return {
    identities,
    secrets,
    statistics: stats,
    rotateSecret,
    registerUser,
  };
}
