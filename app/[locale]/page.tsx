
"use client";

import { useEffect } from "react";
import { trackActivity } from "../../lib/trackActivity";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Education from "@/components/Education";
import FeaturedFinancialAnalyst from "@/components/FeaturedFinancialAnalyst";
import Projects from "@/components/Projects";
import Certificates from "@/components/Certificates";
import Contact from "@/components/Contact";

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.anishreddy.online/#person",
  name: "Anish Reddy",
  url: "https://www.anishreddy.online",
  jobTitle: "AI Researcher",
  description:
    "AI Researcher & Engineer crafting intelligent systems, machine learning pipelines, and multi-agent frameworks.",
  sameAs: [
    "https://www.linkedin.com/in/anishreddy5676",
    "https://github.com/anishreddy13",
    "https://www.instagram.com/anishreddy13",
  ],
  knowsAbout: [
    "Artificial Intelligence",
    "Machine Learning",
    "Deep Learning",
    "PyTorch",
    "AI Engineering",
    "Multi-Agent Systems",
    "Next.js",
  ],
};

const profilePageSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": "https://www.anishreddy.online/#profile",
  url: "https://www.anishreddy.online",
  name: "Anish Reddy — AI Researcher",
  mainEntity: {
    "@id": "https://www.anishreddy.online/#person",
  },
};

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profilePageSchema),
        }}
      />

      <main
        className="relative min-h-screen"
        style={{ background: "var(--surface-0)" }}
      >
        <Hero />
        <FeaturedFinancialAnalyst />
        <About />
        <Education />
        <Projects />
        <Certificates />
        <Contact />
      </main>
    </>
  );
}