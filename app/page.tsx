"use client";

import { useEffect } from "react";
import { trackActivity } from "../lib/trackActivity";
import Hero from "@/components/Hero";
import About from "@/components/About";
import FeaturedPlantProduct from "@/components/FeaturedPlantProduct";
import Projects from "@/components/Projects";
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
      <FeaturedPlantProduct />
      <About />
      <Projects />
      <Contact />
    </main>
  );
}
