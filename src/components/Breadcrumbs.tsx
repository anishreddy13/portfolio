"use client";

import { Link } from "@/i18n/routing";
import { ChevronRight, Home, FolderGit2 } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  backToHref?: string;
  backToLabel?: string;
}

export default function Breadcrumbs({
  items,
  backToHref = "/",
  backToLabel = "Back to Home",
}: BreadcrumbsProps) {
  return (
    <div className="w-full border-b border-[rgba(255,255,255,0.06)] bg-[#050505]/80 backdrop-blur-md px-4 py-2.5 sm:px-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 font-mono text-[0.68rem]">
        
        {/* Breadcrumb Path */}
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-[var(--text-tertiary)]">
          <Link
            href="/"
            className="flex items-center gap-1 transition-colors hover:text-[#C8FF00]"
          >
            <Home size={12} className="text-[#FF2D2D]" />
            <span>Home</span>
          </Link>

          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <div key={idx} className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-[rgba(255,255,255,0.2)]" />
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-[#C8FF00]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-bold text-[#C8FF00]" : ""}>
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Quick Back Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={backToHref}
            className="inline-flex items-center gap-1.5 rounded-sm border border-[rgba(255,255,255,0.1)] bg-[var(--surface-1)] px-2.5 py-1 text-[0.62rem] uppercase tracking-wider text-[var(--text-secondary)] transition-all hover:border-[#FF2D2D]/40 hover:text-[#FF2D2D]"
          >
            <span>&larr;</span>
            <span>{backToLabel}</span>
          </Link>

          {backToHref !== "/#projects" && (
            <Link
              href="/#projects"
              className="inline-flex items-center gap-1.5 rounded-sm border border-[rgba(255,255,255,0.1)] bg-[var(--surface-1)] px-2.5 py-1 text-[0.62rem] uppercase tracking-wider text-[var(--text-secondary)] transition-all hover:border-[#C8FF00]/40 hover:text-[#C8FF00]"
            >
              <FolderGit2 size={11} className="text-[#C8FF00]" />
              <span>All Projects</span>
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
