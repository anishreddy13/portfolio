"use client";

import { useEffect } from "react";
import { trackActivity } from "../lib/trackActivity";
import Hero from "@/components/Hero";
import About from "@/components/About";
import FeaturedFinancialAnalyst from "@/components/FeaturedFinancialAnalyst";
import Projects from "@/components/Projects";
import Certificates from "@/components/Certificates";
import Contact from "@/components/Contact";

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
      <Hero />
      <FeaturedFinancialAnalyst />
      <About />
      <Projects />
      <Certificates />
      <Contact />
    </main>
  );
}
