"use client";

import React, { createContext, useContext, useEffect } from "react";

type Theme = "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      localStorage.removeItem("anish-theme");
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } catch {
      // Ignore
    }
  }, []);

  const toggleTheme = () => {
    // Fixed to dark mode only
  };

  return (
    <ThemeContext.Provider value={{ theme: "dark", toggleTheme, isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
