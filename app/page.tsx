"use client";

import { useEffect } from "react";
import { trackActivity } from "../lib/trackActivity";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import FeaturedPlantProduct from "@/components/FeaturedPlantProduct";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Home() {
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    trackActivity("home", "page_visit");
  }, []);

  return (
    <main
      className="relative min-h-screen"
      style={{ background: "var(--surface-0)" }}
    >
      {/* Fixed background — sits behind everything */}
      <AnimatedBackground />

      {/* Page content — layered above background */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <FeaturedPlantProduct />
        <About />
        <Projects />
        <Contact />
        <Footer />
      </div>
    </main>
  );
}
