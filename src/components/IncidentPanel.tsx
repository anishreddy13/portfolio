"use client";

import React, { useState } from "react";
import { AlertOctagon, ShieldAlert, CheckCircle2, UserCheck, Clock, ArrowUpRight, CheckSquare, History, User } from "lucide-react";
import { useIncidents, IncidentData } from "@/hooks/useIncidents";

function severityBadge(sev: string) {
  if (sev === "CRITICAL") return "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold";
  if (sev === "HIGH") return "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold";
  return "bg-sky-500/10 text-sky-400 border-sky-500/30";
}

function statusBadge(st: string) {
  if (st === "OPEN") return "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse font-bold";
  if (st === "ACKNOWLEDGED") return "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold";
  if (st === "ESCALATED") return "bg-violet-500/10 text-violet-400 border-violet-500/30 font-bold";
  return "bg-lime-500/10 text-lime-400 border-lime-500/30 font-bold";
}

export default function IncidentPanel() {
  const { activeIncidents, historyIncidents, statistics, acknowledgeIncident, resolveIncident } = useIncidents();
  const [selectedIncident, setSelectedIncident] = useState<IncidentData | null>(activeIncidents[0] || null);

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 font-mono text-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
            Enterprise Alerting & Incident Response Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full Incident Lifecycle • Ownership Assignment • SLA Response Metrics (MTTA/MTTR) • Escalation Policies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
            Active Incidents: <strong className="text-white">{activeIncidents.length}</strong>
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/30">
            MTTA: <strong className="text-white">{statistics.mttaSeconds}s</strong>
          </span>
        </div>
      </div>

      {/* Incident SLA Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/30">
          <div className="text-slate-400 text-[11px] mb-1">Open Incidents</div>
          <div className="text-lg font-bold text-rose-400">{activeIncidents.length} Active</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Acknowledged</div>
          <div className="text-lg font-bold text-amber-400">{statistics.acknowledgedCount} Incidents</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Mean Time to Ack (MTTA)</div>
          <div className="text-lg font-bold text-sky-400">{statistics.mttaSeconds} sec</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-slate-400 text-[11px] mb-1">Mean Time to Resolve (MTTR)</div>
          <div className="text-lg font-bold text-lime-400">{statistics.mttrSeconds} sec</div>
        </div>
      </div>

      {/* Active Incidents List & Incident Details — Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Incidents List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Active Incidents Stream
          </h3>
          <div className="space-y-2">
            {historyIncidents.map((inc) => {
              const isSelected = selectedIncident?.incidentId === inc.incidentId;
              return (
                <div
                  key={inc.incidentId}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition space-y-2 text-[11px] ${
                    isSelected
                      ? "bg-rose-500/10 border-rose-500/40 text-white"
                      : "bg-slate-950/70 border-slate-800/60 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{inc.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${statusBadge(inc.status)}`}>
                      {inc.status}
                    </span>
                  </div>

                  <div className="text-slate-400 text-[10px] truncate">{inc.description}</div>

                  <div className="flex items-center justify-between text-[10px] pt-1 text-slate-500 border-t border-slate-800/40">
                    <span>Owner: <strong className="text-slate-300">{inc.owner}</strong></span>
                    <span>Created: {inc.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Incident Details & Timeline */}
        {selectedIncident ? (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white">{selectedIncident.title}</h4>
                <div className="text-[10px] text-slate-400 mt-0.5">ID: {selectedIncident.incidentId} • Subsystem: {selectedIncident.subsystem}</div>
              </div>

              <div className="flex items-center gap-2">
                {selectedIncident.status === "OPEN" && (
                  <button
                    onClick={() => acknowledgeIncident(selectedIncident.incidentId, "Lead SRE (Alex)")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold"
                  >
                    <UserCheck className="w-3 h-3" />
                    Acknowledge
                  </button>
                )}
                {selectedIncident.status !== "RESOLVED" && (
                  <button
                    onClick={() => resolveIncident(selectedIncident.incidentId, "Resolved by SRE")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 border border-lime-500/30 text-[10px] font-bold"
                  >
                    <CheckSquare className="w-3 h-3" />
                    Resolve
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/50">
                <div>
                  <span className="text-slate-500 text-[10px]">Escalation Level</span>
                  <div className="text-violet-400 font-bold">{selectedIncident.escalationLevel}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Assigned Owner</span>
                  <div className="text-white font-bold">{selectedIncident.owner}</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2 pt-2">
                <h5 className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                  <History className="w-3 h-3 text-sky-400" />
                  Incident Audit Timeline
                </h5>
                <div className="space-y-1.5">
                  {selectedIncident.timeline.map((event) => (
                    <div key={event.eventId} className="p-2 rounded bg-slate-900/40 border border-slate-800/40 text-[10px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-lime-400 font-bold">[{event.eventType}]</span>
                        <span className="text-slate-500">{event.timestamp}</span>
                      </div>
                      <div className="text-slate-300">{event.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-center text-slate-500">
            Select an incident to view timeline and actions
          </div>
        )}
      </div>
    </div>
  );
}
