"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";
import { ACCENTS, useAccent, type AccentKey } from "@/lib/accent";
import {
  IconBolt,
  IconCheck,
  IconClose,
  IconCreditCard,
  IconGlobe,
  IconLogout,
  IconShield,
  IconSparkle,
  IconWallet,
} from "@/lib/icons";
import { CustomizePanelContent } from "@/components/dashboard/CustomizePanel";

function SettingsRow({
  icon: Icon,
  title,
  desc,
  children,
  danger,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  desc?: string;
  children?: ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "18px 0",
        borderBottom: "1px solid var(--line-2)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          flexShrink: 0,
          background: danger ? "color-mix(in oklch, var(--neg) 12%, white)" : "var(--surface-2)",
          color: danger ? "oklch(0.5 0.2 25)" : "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{desc}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingsCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ marginBottom: 10 }}>
        <h3 className="display" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          {title}
        </h3>
        {subtitle && <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SelectPill<T extends string>({
  value,
  setValue,
  options,
  labelFor,
}: {
  value: T;
  setValue: (v: T) => void;
  options: T[];
  labelFor?: (v: T) => string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => setValue(e.target.value as T)}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: "1px solid var(--line)",
        background: "var(--surface)",
        fontSize: 13,
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {labelFor ? labelFor(o) : o}
        </option>
      ))}
    </select>
  );
}

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "preferences", label: "Preferences" },
  { id: "dashboard", label: "Dashboard" },
  { id: "security", label: "Security" },
  { id: "data", label: "Data" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const { code, setCode } = useCurrency();
  const { accent, setAccent } = useAccent();
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("profile");

  const [monthBudget, setMonthBudget] = useState<string>("");
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.monthBudget === "number") setMonthBudget(String(data.monthBudget));
        }
      } catch {}
    })();
  }, []);

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Your account";
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const initial = (user?.firstName?.[0] ?? fullName[0] ?? "?").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const saveBudget = async () => {
    const n = parseFloat(monthBudget);
    if (!isFinite(n) || n <= 0) return;
    setBudgetSaving(true);
    setBudgetSaved(false);
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthBudget: n }),
      });
      if (res.ok) {
        setBudgetSaved(true);
        setTimeout(() => setBudgetSaved(false), 1800);
      }
    } finally {
      setBudgetSaving(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/me/export");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `piggybank-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      if (res.ok) {
        await signOut();
        router.push("/");
      }
    } finally {
      setDeleting(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid var(--line)",
    background: "var(--surface-2)",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "8px 0 96px" }}>
      <div style={{ marginBottom: 24 }}>
        <span className="kicker">Account</span>
        <h1
          className="display"
          style={{ fontSize: "clamp(32px, 4.4vw, 52px)", fontWeight: 700, margin: "6px 0 0" }}
        >
          Settings
        </h1>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 220px) 1fr", gap: 28 }}
        className="pb-settings-grid"
      >
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                textAlign: "left",
                padding: "10px 14px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                background: tab === t.id ? "var(--accent-soft)" : "transparent",
                color: tab === t.id ? "var(--accent-ink)" : "var(--ink-2)",
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {tab === "profile" && (
            <>
              <div
                className="card"
                style={{
                  padding: 24,
                  display: "flex",
                  gap: 20,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 999,
                    background:
                      "linear-gradient(135deg, oklch(0.82 0.10 60), oklch(0.68 0.15 25))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 34,
                    boxShadow: "var(--shadow-sm)",
                    overflow: "hidden",
                  }}
                >
                  {user?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.imageUrl}
                      alt={fullName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="display" style={{ fontSize: 22, fontWeight: 700 }}>
                    {fullName}
                  </div>
                  <div style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 2 }}>
                    {email || "No email on file"}
                  </div>
                </div>
                <button className="btn btn--outline btn--sm" onClick={() => openUserProfile()}>
                  Edit profile
                </button>
              </div>

              <SettingsCard
                title="Monthly budget"
                subtitle="The cap shown on your Budget Jar and used for pacing insights."
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 200 }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--ink-3)",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Amount per month ({CURRENCIES[code].symbol})
                    </span>
                    <input
                      type="number"
                      min={1}
                      step="50"
                      value={monthBudget}
                      onChange={(e) => setMonthBudget(e.target.value)}
                      placeholder="1500"
                      style={fieldStyle}
                    />
                  </label>
                  <button
                    className="btn btn--ink btn--sm"
                    onClick={saveBudget}
                    disabled={budgetSaving}
                    style={{ opacity: budgetSaving ? 0.85 : 1 }}
                  >
                    {budgetSaving ? (
                      <>
                        <span className="pb-spin" /> Saving…
                      </>
                    ) : budgetSaved ? (
                      <>
                        <IconCheck size={14} /> Saved
                      </>
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </SettingsCard>
            </>
          )}

          {tab === "preferences" && (
            <SettingsCard title="Preferences">
              <SettingsRow
                icon={IconCreditCard}
                title="Currency"
                desc="Every amount in the app is shown in this currency."
              >
                <SelectPill<CurrencyCode>
                  value={code}
                  setValue={setCode}
                  options={Object.keys(CURRENCIES) as CurrencyCode[]}
                  labelFor={(c) => `${CURRENCIES[c].symbol} · ${CURRENCIES[c].name}`}
                />
              </SettingsRow>
              <SettingsRow
                icon={IconSparkle}
                title="Accent colour"
                desc="Tints buttons, highlights, and charts."
              >
                <div style={{ display: "flex", gap: 6 }}>
                  {(Object.keys(ACCENTS) as AccentKey[]).map((k) => {
                    const active = accent === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setAccent(k)}
                        aria-label={ACCENTS[k].label}
                        title={ACCENTS[k].label}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: ACCENTS[k].swatch,
                          border: active
                            ? "2px solid var(--ink)"
                            : "2px solid var(--surface)",
                          boxShadow: active
                            ? "0 0 0 2px var(--ink), var(--shadow-sm)"
                            : "var(--shadow-sm)",
                          padding: 0,
                          cursor: "pointer",
                          transition: "box-shadow .15s ease",
                        }}
                      />
                    );
                  })}
                </div>
              </SettingsRow>
            </SettingsCard>
          )}

          {tab === "dashboard" && (
            <SettingsCard
              title="Dashboard layout"
              subtitle="Pick which cards show up, how charts are drawn, and how tight the layout feels."
            >
              <CustomizePanelContent />
            </SettingsCard>
          )}

          {tab === "security" && (
            <SettingsCard
              title="Sign-in & security"
              subtitle="Password, two-factor, and devices are managed through Clerk."
            >
              <SettingsRow
                icon={IconShield}
                title="Password & 2FA"
                desc="Change password, enable 2FA, review active sessions."
              >
                <button
                  className="btn btn--outline btn--sm"
                  onClick={() => openUserProfile()}
                >
                  Manage
                </button>
              </SettingsRow>
              <SettingsRow
                icon={IconGlobe}
                title="Email & connected accounts"
                desc="Change the email on file or linked sign-in providers."
              >
                <button
                  className="btn btn--outline btn--sm"
                  onClick={() => openUserProfile()}
                >
                  Manage
                </button>
              </SettingsRow>
              <SettingsRow
                icon={IconLogout}
                title="Sign out"
                desc="End your current session on this device."
              >
                <button onClick={handleSignOut} className="btn btn--outline btn--sm">
                  Sign out
                </button>
              </SettingsRow>
            </SettingsCard>
          )}

          {tab === "data" && (
            <>
              <SettingsCard
                title="Export your data"
                subtitle="Downloads every transaction, recurring item, and your profile as JSON."
              >
                <SettingsRow
                  icon={IconWallet}
                  title="All transactions and recurring items"
                  desc="Plain JSON. Safe to keep as a backup."
                >
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={exportData}
                    disabled={exporting}
                  >
                    {exporting ? (
                      <>
                        <span className="pb-spin" /> Preparing…
                      </>
                    ) : (
                      "Download"
                    )}
                  </button>
                </SettingsRow>
              </SettingsCard>

              <SettingsCard title="Danger zone">
                <SettingsRow
                  icon={IconClose}
                  title="Delete account"
                  desc="Removes your profile, every transaction, and every recurring item. Cannot be undone."
                  danger
                >
                  <button
                    className="btn btn--sm"
                    style={{ background: "oklch(0.5 0.2 25)", color: "#fff" }}
                    onClick={() => setDeleteOpen(true)}
                  >
                    Delete…
                  </button>
                </SettingsRow>
              </SettingsCard>
            </>
          )}
        </div>
      </div>

      {deleteOpen && (
        <div
          onClick={() => !deleting && setDeleteOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,15,35,0.48)",
            backdropFilter: "blur(6px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: 24,
              padding: 28,
              width: "100%",
              maxWidth: 440,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "color-mix(in oklch, var(--neg) 14%, white)",
                color: "oklch(0.42 0.18 25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <IconBolt size={20} />
            </div>
            <h3 className="display" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              Delete your account?
            </h3>
            <p style={{ color: "var(--ink-2)", fontSize: 14, margin: "10px 0 0", lineHeight: 1.55 }}>
              This wipes your profile, every transaction, every recurring item, and signs you out.
              Your sign-in record will also be removed. There&rsquo;s no undo.
            </p>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 18 }}>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--ink-3)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Type <strong style={{ color: "var(--ink)" }}>DELETE</strong> to confirm
              </span>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                disabled={deleting}
                autoFocus
                style={fieldStyle}
              />
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="btn btn--outline"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="btn"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  background: deleteConfirm === "DELETE" ? "oklch(0.5 0.2 25)" : "var(--line)",
                  color: deleteConfirm === "DELETE" ? "#fff" : "var(--ink-3)",
                  cursor: deleteConfirm === "DELETE" && !deleting ? "pointer" : "not-allowed",
                }}
              >
                {deleting ? (
                  <>
                    <span className="pb-spin" /> Deleting…
                  </>
                ) : (
                  "Delete account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
