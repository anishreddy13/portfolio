"use client";

import { useEffect } from "react";
import FinancialAnalystExplainer from "@/components/FinancialAnalystExplainer";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AIFinancialAnalystExplainerPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="relative min-h-screen bg-[#050505] pt-16">
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/#projects" },
          { label: "AI Financial Analyst", href: "/projects/ai-financial-analyst" },
          { label: "System Explainer" },
        ]}
        backToHref="/projects/ai-financial-analyst"
        backToLabel="Back to AI Financial Analyst"
      />
      <FinancialAnalystExplainer />
    </main>
  );
}
