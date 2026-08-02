"use client";

import React, { useState } from "react";
import { Lock, Shield, Key, UserCheck, RefreshCw, Eye, CheckCircle2, UserPlus, FileText } from "lucide-react";
import { useSecurity, UserIdentityData, SecretReferenceData } from "@/hooks/useSecurity";

function roleBadge(role: string) {
  if (role === "ADMIN") return "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold";
  if (role === "QUANT_TRADER") return "bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold";
  return "bg-amber-500/10 text-amber-400 border-amber-500/30";
}

export default function SecurityPanel() {
  const { identities, secrets, statistics, rotateSecret, registerUser } = useSecurity();
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      registerUser(newUsername, newEmail || `${newUsername}@enterprise.com`, "QUANT_TRADER");
      setNewUsername("");
      setNewEmail("");
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-violet-400" />
            Enterprise Security & Identity Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Identity Management • Role-Based Access Control (RBAC) • Vault / KMS Secret References • Credential Rotation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30 font-bold flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-lime-400" />
            Auth Status: ACTIVE (RS256)
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30">
            Secrets Managed: <strong className="text-white">{statistics.totalSecretsManaged}</strong>
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-violet-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Identities Registered</div>
          <div className="text-lg font-bold text-violet-400">{statistics.totalIdentities} Users/Services</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">RBAC Roles</div>
          <div className="text-lg font-bold text-sky-400">{statistics.totalRoles} Defined Roles</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Access Denied Audit</div>
          <div className="text-lg font-bold text-lime-400">{statistics.deniedAccessCount} Breaches</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Last Secret Rotation</div>
          <div className="text-lg font-bold text-white">{statistics.lastRotationAt}</div>
        </div>
      </div>

      {/* User Identity & RBAC Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Identities List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-violet-400" />
            Authenticated User Identities
          </h3>
          <div className="space-y-2">
            {identities.map((u: UserIdentityData) => (
              <div key={u.userId} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    {u.username}
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border ${roleBadge(u.roleName)}`}>
                      {u.roleName}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">{u.email}</div>
                </div>

                <span className="px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/30 text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>

          {/* Quick Add User Form */}
          <form onSubmit={handleCreateUser} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Username..."
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 w-1/2 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/30 font-bold text-xs flex items-center gap-1 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Principal
            </button>
          </form>
        </div>

        {/* Vault / KMS Secret References */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            Vault / KMS Secret References & Rotation
          </h3>
          <div className="space-y-2">
            {secrets.map((sec: SecretReferenceData) => (
              <div key={sec.secretId} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{sec.secretName}</span>
                  <span className="text-amber-400 font-bold text-[10px] border border-amber-500/30 px-1.5 py-0.2 rounded bg-amber-500/10">
                    Version: v{sec.version}
                  </span>
                </div>
                <div className="text-slate-500 text-[10px] truncate">Vault Path: {sec.vaultPath}</div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[10px]">
                  <span className="text-slate-400">Rotated: {sec.lastRotatedAt}</span>
                  <button
                    onClick={() => rotateSecret(sec.secretName)}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 font-bold flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Rotate Key
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
