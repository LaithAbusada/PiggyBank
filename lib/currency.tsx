"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CurrencyCode = "USD" | "JOD" | "EUR" | "GBP" | "ILS" | "AED" | "SAR" | "EGP";

export type CurrencyDef = {
  symbol: string;
  code: CurrencyCode;
  name: string;
  rate: number;
  position: "pre" | "post";
};

export const CURRENCIES: Record<CurrencyCode, CurrencyDef> = {
  USD: { symbol: "$",   code: "USD", name: "US Dollar",       rate: 1.0,  position: "pre" },
  JOD: { symbol: "JD",  code: "JOD", name: "Jordanian Dinar", rate: 0.71, position: "pre" },
  EUR: { symbol: "€",   code: "EUR", name: "Euro",            rate: 0.92, position: "pre" },
  GBP: { symbol: "£",   code: "GBP", name: "British Pound",   rate: 0.79, position: "pre" },
  ILS: { symbol: "₪",   code: "ILS", name: "Israeli Shekel",  rate: 3.70, position: "pre" },
  AED: { symbol: "AED", code: "AED", name: "UAE Dirham",      rate: 3.67, position: "pre" },
  SAR: { symbol: "SAR", code: "SAR", name: "Saudi Riyal",     rate: 3.75, position: "pre" },
  EGP: { symbol: "E£",  code: "EGP", name: "Egyptian Pound",  rate: 48.5, position: "pre" },
};

export type FmtOpts = {
  short?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export const formatMoney = (code: CurrencyCode, amount: number, opts: FmtOpts = {}) => {
  const c = CURRENCIES[code] ?? CURRENCIES.USD;
  const converted = amount * c.rate;
  const min = opts.minimumFractionDigits ?? (opts.short ? 0 : 2);
  const max = opts.maximumFractionDigits ?? (opts.short ? 0 : 2);
  const num = converted.toLocaleString(undefined, { minimumFractionDigits: min, maximumFractionDigits: max });
  const sym = c.symbol;
  return c.position === "post" ? `${num} ${sym}` : (sym.length > 1 ? `${sym} ${num}` : `${sym}${num}`);
};

type CurrencyValue = {
  code: CurrencyCode;
  setCode: (c: CurrencyCode) => void;
  fmt: (v: number, opts?: FmtOpts) => string;
  sym: string;
  rate: number;
};

const CurrencyCtx = createContext<CurrencyValue>({
  code: "USD",
  setCode: () => {},
  fmt: (v) => "$" + v.toFixed(0),
  sym: "$",
  rate: 1,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CurrencyCode>("USD");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pb_ccy") as CurrencyCode | null;
      if (stored && CURRENCIES[stored]) setCode(stored);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("pb_ccy", code); } catch {}
  }, [code]);

  const value = useMemo<CurrencyValue>(() => ({
    code,
    setCode,
    fmt: (v, opts) => formatMoney(code, v, opts),
    sym: CURRENCIES[code].symbol,
    rate: CURRENCIES[code].rate,
  }), [code]);

  return <CurrencyCtx.Provider value={value}>{children}</CurrencyCtx.Provider>;
}

export const useCurrency = () => useContext(CurrencyCtx);
