"use client";

import { useEffect } from "react";
import FinancialAnalystExplainer from "@/components/FinancialAnalystExplainer";

export default function AIFinancialAnalystExplainerPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <FinancialAnalystExplainer />;
}
