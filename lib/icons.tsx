import type { CSSProperties, SVGProps } from "react";

type IconProps = {
  size?: number;
  stroke?: number;
  fill?: string;
  style?: CSSProperties;
} & Omit<SVGProps<SVGSVGElement>, "fill" | "stroke" | "style">;

const Svg = ({ size = 20, stroke = 1.7, fill, style, children, ...rest }: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill || "none"}
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    {...rest}
  >
    {children}
  </svg>
);

export const IconHome = (p: IconProps) => <Svg {...p}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1z"/></Svg>;
export const IconFolder = (p: IconProps) => <Svg {...p}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></Svg>;
export const IconCalendar = (p: IconProps) => <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></Svg>;
export const IconInvoice = (p: IconProps) => <Svg {...p}><path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h4"/></Svg>;
export const IconCalculator = (p: IconProps) => <Svg {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/></Svg>;
export const IconLifeBuoy = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M4.9 4.9l4.3 4.3M14.8 14.8l4.3 4.3M4.9 19.1l4.3-4.3M14.8 9.2l4.3-4.3"/></Svg>;
export const IconUser = (p: IconProps) => <Svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></Svg>;
export const IconSearch = (p: IconProps) => <Svg {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></Svg>;
export const IconBell = (p: IconProps) => <Svg {...p}><path d="M6 8a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 004 0"/></Svg>;
export const IconMessage = (p: IconProps) => <Svg {...p}><path d="M21 11.5a8.4 8.4 0 01-8.5 8.5 8.5 8.5 0 01-4-1L3 21l2-5.5A8.5 8.5 0 013 11.5 8.4 8.4 0 0111.5 3 8.4 8.4 0 0121 11.5z"/></Svg>;
export const IconMenu = (p: IconProps) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16"/></Svg>;
export const IconClose = (p: IconProps) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18"/></Svg>;
export const IconArrowUp = (p: IconProps) => <Svg {...p}><path d="M12 20V4M5 11l7-7 7 7"/></Svg>;
export const IconArrowDown = (p: IconProps) => <Svg {...p}><path d="M12 4v16M5 13l7 7 7-7"/></Svg>;
export const IconArrowRight = (p: IconProps) => <Svg {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Svg>;
export const IconTrendUp = (p: IconProps) => <Svg {...p}><path d="M3 17l6-6 4 4 8-8M14 7h7v7"/></Svg>;
export const IconTrendDown = (p: IconProps) => <Svg {...p}><path d="M3 7l6 6 4-4 8 8M14 17h7v-7"/></Svg>;
export const IconPlus = (p: IconProps) => <Svg {...p}><path d="M12 5v14M5 12h14"/></Svg>;
export const IconSettings = (p: IconProps) => <Svg {...p}><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></Svg>;
export const IconShield = (p: IconProps) => <Svg {...p}><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/></Svg>;
export const IconCreditCard = (p: IconProps) => <Svg {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></Svg>;
export const IconDot = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="2" fill="currentColor"/></Svg>;
export const IconSparkle = (p: IconProps) => <Svg {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5zM19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/></Svg>;
export const IconLogout = (p: IconProps) => <Svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></Svg>;
export const IconCheck = (p: IconProps) => <Svg {...p}><path d="M5 12l5 5 9-11"/></Svg>;
export const IconEye = (p: IconProps) => <Svg {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></Svg>;
export const IconCategory = (p: IconProps) => <Svg {...p}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></Svg>;
export const IconWallet = (p: IconProps) => <Svg {...p}><path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 000 4h16v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7"/><circle cx="17" cy="13" r="1.2" fill="currentColor"/></Svg>;
export const IconBolt = (p: IconProps) => <Svg {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></Svg>;
export const IconGlobe = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></Svg>;

export function PiggyNose({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size * 0.66,
        borderRadius: "50%",
        background: "oklch(0.86 0.07 15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: size * 0.12,
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.07)",
        flexShrink: 0,
      }}
    >
      <div style={{ width: size * 0.18, height: size * 0.28, borderRadius: "50%", background: "#1a1015" }} />
      <div style={{ width: size * 0.18, height: size * 0.28, borderRadius: "50%", background: "#1a1015" }} />
    </div>
  );
}

export function Brand({ size = 28, showText = true, subtitle }: { size?: number; showText?: boolean; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <PiggyNose size={size} />
      {showText && (
        <div style={{ lineHeight: 1 }}>
          <div className="display" style={{ fontWeight: 700, fontSize: size * 0.6 }}>PiggyBank</div>
          {subtitle && (
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 4 }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
