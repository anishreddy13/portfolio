"use client";

import { useEffect } from "react";
import TradingCoPilot from "@/components/TradingCoPilot";

export default function TradingCoPilotPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <TradingCoPilot />;
}
