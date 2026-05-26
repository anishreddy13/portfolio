"use client";

import dynamic from "next/dynamic";
import CursorEffect from "./CursorEffect";
import Footer from "./Footer";
import Navbar from "./Navbar";
import PlantAnnouncement from "./PlantAnnouncement";

const AnimatedBackground = dynamic(() => import("./AnimatedBackground"), {
  ssr: false,
});

export default function PlatformShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnimatedBackground />
      <CursorEffect />
      <PlantAnnouncement />
      <div className="relative z-10 min-h-screen">
        <Navbar />
        {children}
        <Footer />
      </div>
    </>
  );
}
