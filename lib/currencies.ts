export type CurrencyCode = "USD" | "JOD" | "EUR" | "GBP" | "ILS" | "AED" | "SAR" | "EGP";

export type CurrencyDef = {
  symbol: string;
  code: CurrencyCode;
  name: string;
  rate: number;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyDef> = {
  USD: { symbol: "$",   code: "USD", name: "US Dollar",       rate: 1.0  },
  JOD: { symbol: "JD",  code: "JOD", name: "Jordanian Dinar", rate: 0.71 },
  EUR: { symbol: "€",   code: "EUR", name: "Euro",            rate: 0.92 },
  GBP: { symbol: "£",   code: "GBP", name: "British Pound",   rate: 0.79 },
  ILS: { symbol: "₪",   code: "ILS", name: "Israeli Shekel",  rate: 3.70 },
  AED: { symbol: "AED", code: "AED", name: "UAE Dirham",      rate: 3.67 },
  SAR: { symbol: "SAR", code: "SAR", name: "Saudi Riyal",     rate: 3.75 },
  EGP: { symbol: "E£",  code: "EGP", name: "Egyptian Pound",  rate: 48.5 },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function isCurrencyCode(v: unknown): v is CurrencyCode {
  return typeof v === "string" && v in CURRENCIES;
}
