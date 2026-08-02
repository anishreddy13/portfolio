import LiveTradingDashboard from "@/components/LiveTradingDashboard";

export const metadata = {
  title: "Live Trading Dashboard | Phase 5 Enterprise Market Platform",
  description:
    "Real-time multi-provider live trading dashboard consuming EnterpriseMarketCache, SingleFlight Request Coordinator, Streaming Consensus, and AI Strategy Coach.",
};

export default function LiveDashboardPage() {
  return <LiveTradingDashboard />;
}
