"use client";

import dynamic from "next/dynamic";
import CursorEffect from "./CursorEffect";
import Footer from "./Footer";
import Navbar from "./Navbar";
import FinancialAnalystAnnouncement from "./FinancialAnalystAnnouncement";
import BackToTop from "./BackToTop";
import PrintPortfolio from "./PrintPortfolio";

const AnimatedBackground = dynamic(() => import("./AnimatedBackground"), {
  ssr: false,
});

export default function PlatformShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PrintPortfolio />
      <AnimatedBackground />
      <CursorEffect />
      <FinancialAnalystAnnouncement />
      <BackToTop />
      <div className="relative z-10 min-h-screen">
        <Navbar />
        {children}
        <Footer />
      </div>
    </>
  );
}
