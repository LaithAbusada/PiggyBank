"use client";

import {
  useDashboardPrefs,
  WIDGET_META,
  RANGE_LABELS,
  type CashflowChart,
  type CashflowRange,
  type Density,
  type SpendingChart,
  type WidgetKey,
} from "@/lib/dashboard-prefs";
import { IconClose } from "@/lib/icons";

const MAIN_WIDGETS: WidgetKey[] = ["cashflow", "spending", "transactions"];
const RAIL_WIDGETS: WidgetKey[] = [
  "insights",
  "budgetJar",
  "quickLog",
  "recurring",
  "monthGlance",
  "streak",
  "catBudgets",
  "goals",
];

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 0",
        borderBottom: "1px solid var(--line-2)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{desc}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 999,
        padding: 2,
        border: "none",
        background: on ? "var(--accent)" : "var(--line)",
        cursor: "pointer",
        transition: "background .15s ease",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: "#fff",
          boxShadow: "var(--shadow-sm)",
          transform: on ? "translateX(18px)" : "translateX(0)",
          transition: "transform .18s ease",
        }}
      />
    </button>
  );
}

function SegButtons<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 3,
        background: "var(--surface-2)",
        borderRadius: 999,
        border: "1px solid var(--line)",
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "none",
              background: active ? "var(--ink)" : "transparent",
              color: active ? "var(--bg)" : "var(--ink-2)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "var(--ink-3)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        margin: "18px 0 2px",
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

export function CustomizePanelContent() {
  const { prefs, setPrefs, setVisible, reset } = useDashboardPrefs();

  const cashflowOptions: { value: CashflowChart; label: string }[] = [
    { value: "area", label: "Area" },
    { value: "line", label: "Line" },
    { value: "bar", label: "Bar" },
  ];
  const spendingOptions: { value: SpendingChart; label: string }[] = [
    { value: "donut", label: "Donut" },
    { value: "bar", label: "Bars" },
  ];
  const rangeOptions: { value: CashflowRange; label: string }[] = (
    Object.keys(RANGE_LABELS) as CashflowRange[]
  ).map((k) => ({ value: k, label: RANGE_LABELS[k] }));
  const densityOptions: { value: Density; label: string }[] = [
    { value: "cozy", label: "Cozy" },
    { value: "compact", label: "Compact" },
  ];

  return (
    <div>
      <GroupLabel>Layout</GroupLabel>
      <Row title="Density" desc="How tightly cards pack together.">
        <SegButtons
          value={prefs.density}
          options={densityOptions}
          onChange={(v) => setPrefs({ density: v })}
        />
      </Row>

      <GroupLabel>Cashflow chart</GroupLabel>
      <Row title="Chart style" desc="How income and expense are drawn.">
        <SegButtons
          value={prefs.cashflowChart}
          options={cashflowOptions}
          onChange={(v) => setPrefs({ cashflowChart: v })}
        />
      </Row>
      <Row title="Date range" desc="Window used for the cashflow series.">
        <SegButtons
          value={prefs.cashflowRange}
          options={rangeOptions}
          onChange={(v) => setPrefs({ cashflowRange: v })}
        />
      </Row>

      <GroupLabel>Spending breakdown</GroupLabel>
      <Row title="Chart style" desc="Donut or ranked horizontal bars.">
        <SegButtons
          value={prefs.spendingChart}
          options={spendingOptions}
          onChange={(v) => setPrefs({ spendingChart: v })}
        />
      </Row>

      <GroupLabel>Main area</GroupLabel>
      {MAIN_WIDGETS.map((key) => (
        <Row key={key} title={WIDGET_META[key].label} desc={WIDGET_META[key].hint}>
          <Toggle on={prefs.visible[key]} onChange={(v) => setVisible(key, v)} />
        </Row>
      ))}

      <GroupLabel>Sidebar</GroupLabel>
      {RAIL_WIDGETS.map((key) => (
        <Row key={key} title={WIDGET_META[key].label} desc={WIDGET_META[key].hint}>
          <Toggle on={prefs.visible[key]} onChange={(v) => setVisible(key, v)} />
        </Row>
      ))}

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

export function CustomizeDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,15,35,0.42)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          height: "100%",
          background: "var(--surface)",
          boxShadow: "var(--shadow-lg)",
          overflowY: "auto",
          padding: "24px 24px 40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <div>
            <div className="kicker">Dashboard</div>
            <h2 className="display" style={{ fontSize: 22, fontWeight: 700, margin: "2px 0 0" }}>
              Customize
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn--ghost btn--sm"
            style={{ padding: 8, borderRadius: 999 }}
          >
            <IconClose size={16} />
          </button>
        </div>
        <p style={{ color: "var(--ink-3)", fontSize: 13, margin: "6px 0 8px", lineHeight: 1.5 }}>
          Pick which cards show up, how charts are drawn, and how tight the layout feels. Changes save automatically.
        </p>
        <CustomizePanelContent />
      </aside>
    </div>
  );
}
