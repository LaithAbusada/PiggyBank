"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const ACCENTS = {
  lavender: { label: "Lavender", swatch: "oklch(0.64 0.10 310)" },
  mint: { label: "Mint", swatch: "oklch(0.72 0.11 165)" },
  sunset: { label: "Sunset", swatch: "oklch(0.72 0.14 45)" },
  slate: { label: "Slate", swatch: "oklch(0.55 0.04 260)" },
} as const;

export type AccentKey = keyof typeof ACCENTS;

const STORAGE_KEY = "pb_accent";
const DEFAULT: AccentKey = "lavender";

type Ctx = { accent: AccentKey; setAccent: (a: AccentKey) => void };

const AccentCtx = createContext<Ctx>({ accent: DEFAULT, setAccent: () => {} });

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentKey>(DEFAULT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AccentKey | null;
      if (stored && stored in ACCENTS) {
        setAccentState(stored);
        document.documentElement.setAttribute("data-accent", stored);
      }
    } catch {}
  }, []);

  const setAccent = (a: AccentKey) => {
    setAccentState(a);
    try {
      localStorage.setItem(STORAGE_KEY, a);
    } catch {}
    document.documentElement.setAttribute("data-accent", a);
  };

  return <AccentCtx.Provider value={{ accent, setAccent }}>{children}</AccentCtx.Provider>;
}

export const useAccent = () => useContext(AccentCtx);
